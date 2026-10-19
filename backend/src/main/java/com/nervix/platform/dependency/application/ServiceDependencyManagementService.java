package com.nervix.platform.dependency.application;

import com.nervix.platform.common.error.*;
import com.nervix.platform.dependency.api.*;
import com.nervix.platform.dependency.domain.*;
import com.nervix.platform.dependency.infrastructure.ServiceDependencyRepository;
import com.nervix.platform.identity.domain.User;
import com.nervix.platform.identity.infrastructure.UserRepository;
import com.nervix.platform.project.domain.*;
import com.nervix.platform.project.infrastructure.*;
import com.nervix.platform.service.domain.ProjectServiceEntity;
import com.nervix.platform.service.infrastructure.ProjectServiceRepository;
import com.nervix.platform.graph.application.ProjectGraphChangedEvent;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ServiceDependencyManagementService {
    private final UserRepository users;
    private final ProjectRepository projects;
    private final ProjectMemberRepository projectMembers;
    private final ProjectServiceRepository services;
    private final ServiceDependencyRepository dependencies;
    private final ApplicationEventPublisher events;

    public ServiceDependencyManagementService(UserRepository users, ProjectRepository projects,
        ProjectMemberRepository projectMembers, ProjectServiceRepository services,
        ServiceDependencyRepository dependencies, ApplicationEventPublisher events) {
        this.users = users;
        this.projects = projects;
        this.projectMembers = projectMembers;
        this.services = services;
        this.dependencies = dependencies;
        this.events = events;
    }

    @Transactional(readOnly = true)
    public List<DependencyResponse> list(Jwt jwt, UUID workspaceId, UUID projectId) {
        access(jwt, workspaceId, projectId);
        return dependencies.findAllByProjectIdAndSoftDeletedFalseOrderByUpdatedAtDesc(projectId)
            .stream().map(this::response).toList();
    }

    @Transactional(readOnly = true)
    public DependencyResponse get(Jwt jwt, UUID workspaceId, UUID projectId, UUID dependencyId) {
        access(jwt, workspaceId, projectId);
        return response(dependency(projectId, dependencyId));
    }

    @Transactional(readOnly = true)
    public DependencySummaryResponse summary(Jwt jwt, UUID workspaceId, UUID projectId) {
        access(jwt, workspaceId, projectId);
        List<ServiceDependency> values =
            dependencies.findAllByProjectIdAndSoftDeletedFalseOrderByUpdatedAtDesc(projectId);
        Map<String, Long> byType = Arrays.stream(DependencyType.values()).collect(Collectors.toMap(
            Enum::name, type -> values.stream().filter(value -> value.getDependencyType() == type).count(),
            (left, right) -> left, LinkedHashMap::new));
        Map<String, Long> byCriticality = Arrays.stream(DependencyCriticality.values())
            .collect(Collectors.toMap(Enum::name,
                criticality -> values.stream().filter(value -> value.getCriticality() == criticality).count(),
                (left, right) -> left, LinkedHashMap::new));
        long critical = values.stream()
            .filter(value -> value.getCriticality() == DependencyCriticality.CRITICAL).count();
        return new DependencySummaryResponse(values.size(), critical, byType, byCriticality);
    }

    @Transactional
    public DependencyResponse create(Jwt jwt, UUID workspaceId, UUID projectId,
        DependencyUpsertRequest request) {
        Access access = requireEditor(jwt, workspaceId, projectId);
        validateDistinct(request);
        ProjectServiceEntity source = projectService(projectId, request.sourceServiceId());
        ProjectServiceEntity target = projectService(projectId, request.targetServiceId());
        if (dependencies.existsByProjectIdAndSourceServiceIdAndTargetServiceIdAndDependencyTypeAndSoftDeletedFalse(
            projectId, source.getId(), target.getId(), request.dependencyType())) {
            throw new ConflictException("This dependency already exists in the project");
        }
        ServiceDependency created = dependencies.save(new ServiceDependency(access.project(), source, target,
            request.dependencyType(), request.criticality(), request.communicationProtocol(),
            request.direction(), request.latencyMs(), request.description()));
        events.publishEvent(new ProjectGraphChangedEvent(projectId));
        return response(created);
    }

    @Transactional
    public DependencyResponse update(Jwt jwt, UUID workspaceId, UUID projectId, UUID dependencyId,
        DependencyUpsertRequest request) {
        requireEditor(jwt, workspaceId, projectId);
        validateDistinct(request);
        ServiceDependency existing = dependency(projectId, dependencyId);
        ProjectServiceEntity source = projectService(projectId, request.sourceServiceId());
        ProjectServiceEntity target = projectService(projectId, request.targetServiceId());
        if (!existing.getSourceService().getId().equals(source.getId())
            || !existing.getTargetService().getId().equals(target.getId())) {
            throw new IllegalArgumentException("Source and target cannot be changed; create a new dependency");
        }
        if (dependencies.existsByProjectIdAndSourceServiceIdAndTargetServiceIdAndDependencyTypeAndIdNotAndSoftDeletedFalse(
            projectId, source.getId(), target.getId(), request.dependencyType(), dependencyId)) {
            throw new ConflictException("This dependency already exists in the project");
        }
        existing.update(request.dependencyType(), request.criticality(), request.communicationProtocol(),
            request.direction(), request.latencyMs(), request.description());
        events.publishEvent(new ProjectGraphChangedEvent(projectId));
        return response(existing);
    }

    @Transactional
    public void delete(Jwt jwt, UUID workspaceId, UUID projectId, UUID dependencyId) {
        requireEditor(jwt, workspaceId, projectId);
        dependency(projectId, dependencyId).softDelete();
        events.publishEvent(new ProjectGraphChangedEvent(projectId));
    }

    private void validateDistinct(DependencyUpsertRequest request) {
        if (request.sourceServiceId().equals(request.targetServiceId())) {
            throw new IllegalArgumentException("Source and target services must be different");
        }
    }

    private Access requireEditor(Jwt jwt, UUID workspaceId, UUID projectId) {
        Access access = access(jwt, workspaceId, projectId);
        if (!access.member().getRole().canEdit()) {
            throw new AccessDeniedException("Insufficient project role");
        }
        return access;
    }

    private Access access(Jwt jwt, UUID workspaceId, UUID projectId) {
        User user = currentUser(jwt);
        Project project = projects.findByIdAndOrganizationIdAndSoftDeletedFalse(projectId, workspaceId)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        ProjectMember member = projectMembers.findByProjectIdAndUserIdAndSoftDeletedFalse(projectId, user.getId())
            .orElseThrow(() -> new AccessDeniedException("Project membership required"));
        return new Access(project, member);
    }

    private User currentUser(Jwt jwt) {
        UUID subject;
        try { subject = UUID.fromString(jwt.getSubject()); }
        catch (RuntimeException exception) { throw new AccessDeniedException("Invalid authenticated subject"); }
        return users.findBySupabaseUserIdAndSoftDeletedFalse(subject)
            .orElseThrow(() -> new ResourceNotFoundException("User profile not found"));
    }

    private ProjectServiceEntity projectService(UUID projectId, UUID serviceId) {
        return services.findByIdAndProjectIdAndSoftDeletedFalse(serviceId, projectId)
            .orElseThrow(() -> new ResourceNotFoundException("Service not found in this project"));
    }

    private ServiceDependency dependency(UUID projectId, UUID dependencyId) {
        return dependencies.findByIdAndProjectIdAndSoftDeletedFalse(dependencyId, projectId)
            .orElseThrow(() -> new ResourceNotFoundException("Dependency not found"));
    }

    private DependencyResponse response(ServiceDependency value) {
        return new DependencyResponse(value.getId(), value.getProject().getId(),
            value.getSourceService().getId(), value.getSourceService().getName(),
            value.getTargetService().getId(), value.getTargetService().getName(),
            value.getDependencyType(), value.getCriticality(), value.getCommunicationProtocol(),
            value.getDirection(), value.getLatencyMs(), value.getDescription(),
            value.getCreatedAt(), value.getUpdatedAt());
    }

    private record Access(Project project, ProjectMember member) {}
}
