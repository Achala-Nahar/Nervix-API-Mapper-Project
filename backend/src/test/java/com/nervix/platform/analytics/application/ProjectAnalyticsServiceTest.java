package com.nervix.platform.analytics.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import com.nervix.platform.dependency.domain.*;
import com.nervix.platform.dependency.infrastructure.ServiceDependencyRepository;
import com.nervix.platform.identity.domain.User;
import com.nervix.platform.identity.infrastructure.UserRepository;
import com.nervix.platform.incident.domain.*;
import com.nervix.platform.incident.infrastructure.ProjectIncidentRepository;
import com.nervix.platform.organization.domain.Organization;
import com.nervix.platform.project.domain.*;
import com.nervix.platform.project.infrastructure.*;
import com.nervix.platform.service.domain.*;
import com.nervix.platform.service.infrastructure.ProjectServiceRepository;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.util.ReflectionTestUtils;

class ProjectAnalyticsServiceTest {
    private final UserRepository users = mock(UserRepository.class);
    private final ProjectRepository projects = mock(ProjectRepository.class);
    private final ProjectMemberRepository members = mock(ProjectMemberRepository.class);
    private final ProjectServiceRepository services = mock(ProjectServiceRepository.class);
    private final ServiceDependencyRepository dependencies = mock(ServiceDependencyRepository.class);
    private final ProjectIncidentRepository incidents = mock(ProjectIncidentRepository.class);
    private final ProjectAnalyticsService analytics =
        new ProjectAnalyticsService(users, projects, members, services, dependencies, incidents);

    @Test
    void calculatesProjectScopedOperationalMetrics() {
        UUID subject = UUID.randomUUID(), userId = UUID.randomUUID();
        UUID workspaceId = UUID.randomUUID(), projectId = UUID.randomUUID();
        User user = new User(subject, "analyst@nervix.test", "Analyst");
        ReflectionTestUtils.setField(user, "id", userId);
        Organization workspace = new Organization("Workspace", "workspace");
        ReflectionTestUtils.setField(workspace, "id", workspaceId);
        Project project = new Project(workspace, "Analytics Project", null,
            ProjectType.MICROSERVICES, ProjectVisibility.PRIVATE, Set.of());
        ReflectionTestUtils.setField(project, "id", projectId);

        ProjectServiceEntity source = service(project, "API", ServiceHealth.HEALTHY);
        ProjectServiceEntity target = service(project, "Database", ServiceHealth.WARNING);
        ServiceDependency dependency = new ServiceDependency(project, source, target,
            DependencyType.DATABASE, DependencyCriticality.CRITICAL,
            CommunicationProtocol.JDBC, DependencyDirection.UNIDIRECTIONAL, 120, null);
        ProjectIncident incident = new ProjectIncident(project, target, "Database warning", null,
            IncidentSeverity.HIGH, IncidentCategory.PERFORMANCE, "TEST", null);
        ReflectionTestUtils.setField(incident, "createdAt", Instant.now());

        when(users.findBySupabaseUserIdAndSoftDeletedFalse(subject)).thenReturn(Optional.of(user));
        when(projects.findByIdAndOrganizationIdAndSoftDeletedFalse(projectId, workspaceId))
            .thenReturn(Optional.of(project));
        when(members.findByProjectIdAndUserIdAndSoftDeletedFalse(projectId, userId))
            .thenReturn(Optional.of(new ProjectMember(project, user, ProjectRole.VIEWER)));
        when(services.findAllByProjectIdAndSoftDeletedFalseOrderByUpdatedAtDesc(projectId))
            .thenReturn(List.of(source, target));
        when(dependencies.findAllByProjectIdAndSoftDeletedFalseOrderByUpdatedAtDesc(projectId))
            .thenReturn(List.of(dependency));
        when(incidents.findAllByProjectIdAndSoftDeletedFalseOrderByCreatedAtDesc(projectId))
            .thenReturn(List.of(incident));

        Jwt jwt = Jwt.withTokenValue("token").header("alg", "none")
            .subject(subject.toString()).build();
        var result = analytics.get(jwt, workspaceId, projectId, "DAYS_30");

        assertThat(result.totalServices()).isEqualTo(2);
        assertThat(result.totalDependencies()).isEqualTo(1);
        assertThat(result.activeIncidents()).isEqualTo(1);
        assertThat(result.criticalDependencies()).isEqualTo(1);
        assertThat(result.averageLatencyMs()).isEqualTo(120);
        assertThat(result.unhealthyCriticalDependencies()).isEqualTo(1);
        assertThat(result.healthDistribution()).containsEntry("WARNING", 1L);
        assertThat(result.topConnectedServices()).hasSize(2);
        assertThat(result.healthScore()).isEqualTo(87);
    }

    private ProjectServiceEntity service(Project project, String name, ServiceHealth health) {
        ProjectServiceEntity value = new ProjectServiceEntity(project, null, name, null,
            ServiceType.API, "v1", health, ServiceLifecycle.ACTIVE, null, null, null, Set.of());
        value.recordHealth(health, 10L, "Analytics test observation");
        ReflectionTestUtils.setField(value, "id", UUID.randomUUID());
        return value;
    }
}
