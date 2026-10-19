package com.nervix.platform.analytics.application;

import com.nervix.platform.analytics.api.ConnectedServiceMetric;
import com.nervix.platform.analytics.api.ProjectAnalyticsResponse;
import com.nervix.platform.common.error.ResourceNotFoundException;
import com.nervix.platform.dependency.domain.*;
import com.nervix.platform.dependency.infrastructure.ServiceDependencyRepository;
import com.nervix.platform.identity.domain.User;
import com.nervix.platform.identity.infrastructure.UserRepository;
import com.nervix.platform.incident.domain.*;
import com.nervix.platform.incident.infrastructure.ProjectIncidentRepository;
import com.nervix.platform.project.domain.Project;
import com.nervix.platform.project.infrastructure.*;
import com.nervix.platform.service.domain.*;
import com.nervix.platform.service.infrastructure.ProjectServiceRepository;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProjectAnalyticsService {
    private final UserRepository users;
    private final ProjectRepository projects;
    private final ProjectMemberRepository members;
    private final ProjectServiceRepository services;
    private final ServiceDependencyRepository dependencies;
    private final ProjectIncidentRepository incidents;

    public ProjectAnalyticsService(UserRepository users, ProjectRepository projects,
        ProjectMemberRepository members, ProjectServiceRepository services,
        ServiceDependencyRepository dependencies, ProjectIncidentRepository incidents) {
        this.users = users;
        this.projects = projects;
        this.members = members;
        this.services = services;
        this.dependencies = dependencies;
        this.incidents = incidents;
    }

    @Transactional(readOnly = true)
    public ProjectAnalyticsResponse get(Jwt jwt, UUID workspaceId, UUID projectId, String requestedRange) {
        requireAccess(jwt, workspaceId, projectId);
        Range range = Range.from(requestedRange);
        List<ProjectServiceEntity> serviceValues =
            services.findAllByProjectIdAndSoftDeletedFalseOrderByUpdatedAtDesc(projectId);
        List<ServiceDependency> dependencyValues =
            dependencies.findAllByProjectIdAndSoftDeletedFalseOrderByUpdatedAtDesc(projectId);
        List<ProjectIncident> allIncidents =
            incidents.findAllByProjectIdAndSoftDeletedFalseOrderByCreatedAtDesc(projectId);
        Instant cutoff = range.cutoff();
        List<ProjectIncident> rangedIncidents = cutoff == null ? allIncidents :
            allIncidents.stream().filter(item -> !item.getCreatedAt().isBefore(cutoff)).toList();

        Map<UUID, Long> incoming = dependencyValues.stream().collect(Collectors.groupingBy(
            value -> value.getTargetService().getId(), Collectors.counting()));
        Map<UUID, Long> outgoing = dependencyValues.stream().collect(Collectors.groupingBy(
            value -> value.getSourceService().getId(), Collectors.counting()));
        List<ConnectedServiceMetric> connected = serviceValues.stream()
            .map(item -> {
                long in = incoming.getOrDefault(item.getId(), 0L);
                long out = outgoing.getOrDefault(item.getId(), 0L);
                return new ConnectedServiceMetric(item.getId(), item.getName(),
                    item.getHealthStatus().name(), in, out, in + out);
            })
            .sorted(Comparator.comparingLong(ConnectedServiceMetric::total).reversed()
                .thenComparing(ConnectedServiceMetric::name))
            .limit(6).toList();

        long isolated = serviceValues.stream()
            .filter(item -> incoming.getOrDefault(item.getId(), 0L) == 0
                && outgoing.getOrDefault(item.getId(), 0L) == 0).count();
        long singlePoints = serviceValues.stream()
            .filter(item -> incoming.getOrDefault(item.getId(), 0L) >= 2).count();
        long critical = dependencyValues.stream()
            .filter(item -> item.getCriticality() == DependencyCriticality.CRITICAL).count();
        long unhealthyCritical = dependencyValues.stream()
            .filter(item -> item.getCriticality() == DependencyCriticality.CRITICAL
                || item.getCriticality() == DependencyCriticality.HIGH)
            .filter(item -> unhealthy(item.getSourceService()) || unhealthy(item.getTargetService())).count();
        long averageLatency = Math.round(dependencyValues.stream()
            .map(ServiceDependency::getLatencyMs).filter(Objects::nonNull)
            .mapToInt(Integer::intValue).average().orElse(0));
        long active = allIncidents.stream()
            .filter(item -> item.getStatus() != IncidentStatus.RESOLVED).count();

        int score = healthScore(serviceValues, allIncidents, unhealthyCritical, isolated);
        return new ProjectAnalyticsResponse(projectId, range.name(), Instant.now(), score,
            serviceValues.size(), dependencyValues.size(), rangedIncidents.size(), active,
            critical, averageLatency, isolated, singlePoints, unhealthyCritical,
            distribution(ServiceHealth.values(), serviceValues, ProjectServiceEntity::getHealthStatus),
            distribution(ServiceLifecycle.values(), serviceValues, ProjectServiceEntity::getLifecycleStatus),
            distribution(DependencyType.values(), dependencyValues, ServiceDependency::getDependencyType),
            distribution(DependencyCriticality.values(), dependencyValues, ServiceDependency::getCriticality),
            distribution(IncidentSeverity.values(), rangedIncidents, ProjectIncident::getSeverity),
            distribution(IncidentStatus.values(), rangedIncidents, ProjectIncident::getStatus),
            distribution(IncidentCategory.values(), rangedIncidents, ProjectIncident::getCategory),
            trend(rangedIncidents, range), connected);
    }

    private int healthScore(List<ProjectServiceEntity> serviceValues, List<ProjectIncident> incidentValues,
        long unhealthyCritical, long isolated) {
        if (serviceValues.isEmpty()) return 100;
        long errors = serviceValues.stream().filter(item -> item.getHealthStatus() == ServiceHealth.ERROR).count();
        long warnings = serviceValues.stream().filter(item -> item.getHealthStatus() == ServiceHealth.WARNING).count();
        long unknown = serviceValues.stream().filter(item -> item.getHealthStatus() == ServiceHealth.UNKNOWN).count();
        long pending = serviceValues.stream().filter(item -> item.getHealthStatus() == ServiceHealth.PENDING).count();
        long criticalIncidents = incidentValues.stream()
            .filter(item -> item.getStatus() != IncidentStatus.RESOLVED)
            .filter(item -> item.getSeverity() == IncidentSeverity.CRITICAL).count();
        long penalty = errors * 18 + warnings * 8 + (unknown + pending) * 3 + criticalIncidents * 12
            + unhealthyCritical * 5 + isolated * 2;
        return (int) Math.max(0, Math.min(100, 100 - penalty));
    }

    private boolean unhealthy(ProjectServiceEntity service) {
        return service.getHealthStatus() == ServiceHealth.ERROR
            || service.getHealthStatus() == ServiceHealth.WARNING;
    }

    private <E extends Enum<E>, T> Map<String, Long> distribution(E[] values, List<T> items,
        Function<T, E> classifier) {
        Map<String, Long> result = new LinkedHashMap<>();
        for (E value : values) {
            result.put(value.name(), items.stream().filter(item -> classifier.apply(item) == value).count());
        }
        return result;
    }

    private Map<String, Long> trend(List<ProjectIncident> values, Range range) {
        int days = range == Range.DAYS_7 ? 7 : range == Range.DAYS_30 ? 30 : 12;
        Map<String, Long> result = new LinkedHashMap<>();
        if (range == Range.DAYS_90 || range == Range.ALL) {
            YearMonth start = YearMonth.now(ZoneOffset.UTC).minusMonths(days - 1L);
            for (int index = 0; index < days; index++) {
                YearMonth month = start.plusMonths(index);
                result.put(month.format(DateTimeFormatter.ofPattern("MMM yy")), values.stream()
                    .filter(item -> YearMonth.from(item.getCreatedAt().atZone(ZoneOffset.UTC)).equals(month)).count());
            }
        } else {
            LocalDate start = LocalDate.now(ZoneOffset.UTC).minusDays(days - 1L);
            for (int index = 0; index < days; index++) {
                LocalDate day = start.plusDays(index);
                result.put(day.format(DateTimeFormatter.ofPattern("dd MMM")), values.stream()
                    .filter(item -> item.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate().equals(day)).count());
            }
        }
        return result;
    }

    private void requireAccess(Jwt jwt, UUID workspaceId, UUID projectId) {
        User user = currentUser(jwt);
        Project project = projects.findByIdAndOrganizationIdAndSoftDeletedFalse(projectId, workspaceId)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        members.findByProjectIdAndUserIdAndSoftDeletedFalse(project.getId(), user.getId())
            .orElseThrow(() -> new AccessDeniedException("Project membership required"));
    }

    private User currentUser(Jwt jwt) {
        UUID subject;
        try {
            subject = UUID.fromString(jwt.getSubject());
        } catch (RuntimeException error) {
            throw new AccessDeniedException("Invalid authenticated subject");
        }
        return users.findBySupabaseUserIdAndSoftDeletedFalse(subject)
            .orElseThrow(() -> new ResourceNotFoundException("User profile not found"));
    }

    private enum Range {
        DAYS_7, DAYS_30, DAYS_90, ALL;
        static Range from(String value) {
            if (value == null || value.isBlank()) return DAYS_30;
            try { return valueOf(value.toUpperCase(Locale.ROOT)); }
            catch (IllegalArgumentException error) { return DAYS_30; }
        }
        Instant cutoff() {
            return switch (this) {
                case DAYS_7 -> Instant.now().minus(Duration.ofDays(7));
                case DAYS_30 -> Instant.now().minus(Duration.ofDays(30));
                case DAYS_90 -> Instant.now().minus(Duration.ofDays(90));
                case ALL -> null;
            };
        }
    }
}
