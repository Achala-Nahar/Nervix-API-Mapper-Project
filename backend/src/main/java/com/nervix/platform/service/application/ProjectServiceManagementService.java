package com.nervix.platform.service.application;

import com.nervix.platform.common.error.*;
import com.nervix.platform.identity.domain.User;
import com.nervix.platform.identity.infrastructure.UserRepository;
import com.nervix.platform.project.domain.*;
import com.nervix.platform.project.infrastructure.*;
import com.nervix.platform.service.api.*;
import com.nervix.platform.service.domain.*;
import com.nervix.platform.service.infrastructure.ProjectServiceRepository;
import com.nervix.platform.dependency.infrastructure.ServiceDependencyRepository;
import com.nervix.platform.graph.application.ProjectGraphChangedEvent;
import com.nervix.platform.health.application.ManagedRuntimeService;
import com.nervix.platform.health.application.ServiceHealthMonitor;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProjectServiceManagementService {
    private final UserRepository users;
    private final ProjectRepository projects;
    private final ProjectMemberRepository projectMembers;
    private final ProjectServiceRepository services;
    private final ServiceDependencyRepository dependencies;
    private final ApplicationEventPublisher events;
    private final ManagedRuntimeService managedRuntimes;
    private final ServiceHealthMonitor healthMonitor;

    public ProjectServiceManagementService(UserRepository users, ProjectRepository projects,
        ProjectMemberRepository projectMembers, ProjectServiceRepository services,
        ServiceDependencyRepository dependencies, ApplicationEventPublisher events,
        ManagedRuntimeService managedRuntimes, ServiceHealthMonitor healthMonitor) {
        this.users = users;
        this.projects = projects;
        this.projectMembers = projectMembers;
        this.services = services;
        this.dependencies = dependencies;
        this.events = events;
        this.managedRuntimes = managedRuntimes;
        this.healthMonitor = healthMonitor;
    }

    @Transactional(readOnly = true)
    public List<ServiceResponse> list(Jwt jwt, UUID workspaceId, UUID projectId) {
        Access access = access(jwt, workspaceId, projectId);
        return services.findAllByProjectIdAndSoftDeletedFalseOrderByUpdatedAtDesc(projectId)
            .stream().map(this::response).toList();
    }

    @Transactional(readOnly = true)
    public ServiceResponse get(Jwt jwt, UUID workspaceId, UUID projectId, UUID serviceId) {
        access(jwt, workspaceId, projectId);
        return response(service(projectId, serviceId));
    }

    @Transactional(readOnly = true)
    public ServiceSummaryResponse summary(Jwt jwt, UUID workspaceId, UUID projectId) {
        access(jwt, workspaceId, projectId);
        List<ProjectServiceEntity> values =
            services.findAllByProjectIdAndSoftDeletedFalseOrderByUpdatedAtDesc(projectId);
        Map<String, Long> byHealth = Arrays.stream(ServiceHealth.values())
            .collect(Collectors.toMap(Enum::name,
                health -> values.stream().filter(service -> service.getHealthStatus() == health).count(),
                (left, right) -> left, LinkedHashMap::new));
        Map<String, Long> byType = Arrays.stream(ServiceType.values())
            .collect(Collectors.toMap(Enum::name,
                type -> values.stream().filter(service -> service.getServiceType() == type).count(),
                (left, right) -> left, LinkedHashMap::new));
        return new ServiceSummaryResponse(values.size(), byHealth, byType);
    }

    @Transactional
    public ServiceResponse create(Jwt jwt, UUID workspaceId, UUID projectId, ServiceUpsertRequest request) {
        Access access = requireEditor(jwt, workspaceId, projectId);
        if (services.existsByProjectIdAndNameIgnoreCaseAndSoftDeletedFalse(projectId, request.name().trim())) {
            throw new ConflictException("A service with this name already exists in the project");
        }
        User owner = resolveOwner(access, request.ownerUserId());
        ProjectServiceEntity created = services.save(new ProjectServiceEntity(access.project(), owner,
            request.name(), request.description(), request.serviceType(), request.versionLabel(),
            request.healthStatus(), request.lifecycleStatus(), request.repositoryUrl(),
            request.endpointUrl(), request.technology(), safeTags(request.tags())));
        if ("managed://auto".equalsIgnoreCase(request.endpointUrl())) {
            if (managedRuntimes == null) throw new IllegalStateException("Managed runtime provider is unavailable");
            managedRuntimes.provision(created);
        }
        else created.configureExternalRuntime(request.endpointUrl());
        healthMonitor.monitorService(created);
        events.publishEvent(new ProjectGraphChangedEvent(projectId));
        return response(created);
    }

    @Transactional
    public ServiceResponse update(Jwt jwt, UUID workspaceId, UUID projectId,
        UUID serviceId, ServiceUpsertRequest request) {
        Access access = requireEditor(jwt, workspaceId, projectId);
        ProjectServiceEntity existing = service(projectId, serviceId);
        if (services.existsByProjectIdAndNameIgnoreCaseAndIdNotAndSoftDeletedFalse(
            projectId, request.name().trim(), serviceId)) {
            throw new ConflictException("A service with this name already exists in the project");
        }
        existing.update(resolveOwner(access, request.ownerUserId()), request.name(), request.description(),
            request.serviceType(), request.versionLabel(), request.healthStatus(),
            request.lifecycleStatus(), request.repositoryUrl(), request.endpointUrl(),
            request.technology(), safeTags(request.tags()));
        if ("managed://auto".equalsIgnoreCase(request.endpointUrl())) {
            if (managedRuntimes == null) throw new IllegalStateException("Managed runtime provider is unavailable");
            managedRuntimes.provision(existing);
        }
        else {
            if (existing.isLocallyManaged()) managedRuntimes.stop(existing);
            existing.configureExternalRuntime(request.endpointUrl());
        }
        healthMonitor.monitorService(existing);
        events.publishEvent(new ProjectGraphChangedEvent(projectId));
        return response(existing);
    }

    @Transactional
    public void delete(Jwt jwt, UUID workspaceId, UUID projectId, UUID serviceId) {
        Access access = access(jwt, workspaceId, projectId);
        if (!access.member().getRole().canManage()) {
            throw new AccessDeniedException("Only project owners and administrators can delete services");
        }
        dependencies.findConnected(projectId, serviceId).forEach(value -> value.softDelete());
        ProjectServiceEntity existing = service(projectId, serviceId);
        if (existing.isLocallyManaged()) managedRuntimes.stop(existing);
        existing.softDelete();
        events.publishEvent(new ProjectGraphChangedEvent(projectId));
    }

    private Access requireEditor(Jwt jwt, UUID workspaceId, UUID projectId) {
        Access access = access(jwt, workspaceId, projectId);
        if (!access.member().getRole().canEdit()) throw new AccessDeniedException("Insufficient project role");
        return access;
    }

    private Access access(Jwt jwt, UUID workspaceId, UUID projectId) {
        User user = currentUser(jwt);
        Project project = projects.findByIdAndOrganizationIdAndSoftDeletedFalse(projectId, workspaceId)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        ProjectMember member = projectMembers.findByProjectIdAndUserIdAndSoftDeletedFalse(projectId, user.getId())
            .orElseThrow(() -> new AccessDeniedException("Project membership required"));
        return new Access(user, project, member);
    }

    private User currentUser(Jwt jwt) {
        UUID subject;
        try { subject = UUID.fromString(jwt.getSubject()); }
        catch (RuntimeException exception) { throw new AccessDeniedException("Invalid authenticated subject"); }
        return users.findBySupabaseUserIdAndSoftDeletedFalse(subject)
            .orElseThrow(() -> new ResourceNotFoundException("User profile not found"));
    }

    private User resolveOwner(Access access, UUID requestedOwnerId) {
        if (requestedOwnerId == null) return access.user();
        projectMembers.findByProjectIdAndUserIdAndSoftDeletedFalse(access.project().getId(), requestedOwnerId)
            .orElseThrow(() -> new IllegalArgumentException("Service owner must be a project member"));
        return users.findById(requestedOwnerId).filter(user -> !user.isSoftDeleted())
            .orElseThrow(() -> new ResourceNotFoundException("Service owner not found"));
    }

    private ProjectServiceEntity service(UUID projectId, UUID serviceId) {
        return services.findByIdAndProjectIdAndSoftDeletedFalse(serviceId, projectId)
            .orElseThrow(() -> new ResourceNotFoundException("Service not found"));
    }

    private Set<String> safeTags(Set<String> tags) { return tags == null ? Set.of() : tags; }

    private ServiceResponse response(ProjectServiceEntity service) {
        User owner = service.getOwner();
        return new ServiceResponse(service.getId(), service.getProject().getId(), service.getName(),
            service.getDescription(), service.getServiceType(), service.getVersionLabel(),
            service.getHealthStatus(), service.getLifecycleStatus(), service.getRepositoryUrl(),
            service.getEndpointUrl(), service.getTechnology(), service.getTags(),
            owner == null ? null : owner.getId(), owner == null ? null : owner.getDisplayName(),
            Math.toIntExact(dependencies.countBySourceServiceIdAndSoftDeletedFalse(service.getId())),
            Math.toIntExact(dependencies.countByTargetServiceIdAndSoftDeletedFalse(service.getId())),
            service.getCreatedAt(), service.getUpdatedAt(), service.getRuntimeMode(), service.getManagedPort());
    }

    @Transactional
    public ServiceResponse stopRuntime(Jwt jwt, UUID workspaceId, UUID projectId, UUID serviceId) {
        requireEditor(jwt, workspaceId, projectId);
        ProjectServiceEntity existing = service(projectId, serviceId);
        if (!existing.isLocallyManaged()) throw new IllegalArgumentException("Only local managed runtimes can be stopped by Nervix");
        managedRuntimes.stop(existing);
        healthMonitor.monitorService(existing);
        return response(existing);
    }

    @Transactional
    public ServiceResponse restartRuntime(Jwt jwt, UUID workspaceId, UUID projectId, UUID serviceId) {
        requireEditor(jwt, workspaceId, projectId);
        ProjectServiceEntity existing = service(projectId, serviceId);
        if (!existing.isLocallyManaged()) throw new IllegalArgumentException("Only local managed runtimes can be restarted by Nervix");
        managedRuntimes.restart(existing);
        healthMonitor.monitorService(existing);
        return response(existing);
    }

    @Transactional
    public ServiceResponse degradeRuntime(Jwt jwt, UUID workspaceId, UUID projectId, UUID serviceId) {
        requireEditor(jwt, workspaceId, projectId);
        ProjectServiceEntity existing = service(projectId, serviceId);
        if (!existing.isLocallyManaged()) throw new IllegalArgumentException("Only local managed runtimes can be slowed by Nervix");
        managedRuntimes.makeSlow(existing);
        healthMonitor.monitorService(existing);
        return response(existing);
    }

    private record Access(User user, Project project, ProjectMember member) {}
}
