package com.nervix.platform.service.application;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

import com.nervix.platform.identity.domain.User;
import com.nervix.platform.identity.infrastructure.UserRepository;
import com.nervix.platform.organization.domain.Organization;
import com.nervix.platform.project.domain.*;
import com.nervix.platform.project.infrastructure.*;
import com.nervix.platform.service.api.ServiceUpsertRequest;
import com.nervix.platform.service.domain.*;
import com.nervix.platform.service.infrastructure.ProjectServiceRepository;
import com.nervix.platform.dependency.infrastructure.ServiceDependencyRepository;
import com.nervix.platform.health.application.ManagedRuntimeService;
import com.nervix.platform.health.application.ServiceHealthMonitor;
import org.springframework.context.ApplicationEventPublisher;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.util.ReflectionTestUtils;

class ProjectServiceManagementAuthorizationTest {
    private final UserRepository users = mock(UserRepository.class);
    private final ProjectRepository projects = mock(ProjectRepository.class);
    private final ProjectMemberRepository members = mock(ProjectMemberRepository.class);
    private final ProjectServiceRepository services = mock(ProjectServiceRepository.class);
    private final ServiceDependencyRepository dependencies = mock(ServiceDependencyRepository.class);
    private final ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
    private final ManagedRuntimeService managedRuntimes = mock(ManagedRuntimeService.class);
    private final ServiceHealthMonitor healthMonitor = mock(ServiceHealthMonitor.class);
    private final ProjectServiceManagementService service =
        new ProjectServiceManagementService(users, projects, members, services, dependencies, events, managedRuntimes, healthMonitor);
    private final UUID subject = UUID.randomUUID(), userId = UUID.randomUUID();
    private final UUID workspaceId = UUID.randomUUID(), projectId = UUID.randomUUID();
    private User user;
    private Project project;

    @BeforeEach
    void setUp() {
        user = new User(subject, "member@nervix.test", "Member");
        ReflectionTestUtils.setField(user, "id", userId);
        Organization workspace = new Organization("Workspace", "workspace");
        ReflectionTestUtils.setField(workspace, "id", workspaceId);
        project = new Project(workspace, "Project", null,
            ProjectType.MICROSERVICES, ProjectVisibility.PRIVATE, Set.of());
        ReflectionTestUtils.setField(project, "id", projectId);
        when(users.findBySupabaseUserIdAndSoftDeletedFalse(subject)).thenReturn(Optional.of(user));
        when(projects.findByIdAndOrganizationIdAndSoftDeletedFalse(projectId, workspaceId))
            .thenReturn(Optional.of(project));
    }

    @Test
    void viewerCannotCreateService() {
        when(members.findByProjectIdAndUserIdAndSoftDeletedFalse(projectId, userId))
            .thenReturn(Optional.of(new ProjectMember(project, user, ProjectRole.VIEWER)));
        assertThatThrownBy(() -> service.create(jwt(), workspaceId, projectId, request()))
            .isInstanceOf(AccessDeniedException.class);
        verifyNoInteractions(services);
    }

    @Test
    void editorCannotDeleteService() {
        when(members.findByProjectIdAndUserIdAndSoftDeletedFalse(projectId, userId))
            .thenReturn(Optional.of(new ProjectMember(project, user, ProjectRole.EDITOR)));
        assertThatThrownBy(() -> service.delete(jwt(), workspaceId, projectId, UUID.randomUUID()))
            .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void duplicateServiceNameIsRejected() {
        when(members.findByProjectIdAndUserIdAndSoftDeletedFalse(projectId, userId))
            .thenReturn(Optional.of(new ProjectMember(project, user, ProjectRole.OWNER)));
        when(services.existsByProjectIdAndNameIgnoreCaseAndSoftDeletedFalse(projectId, "API"))
            .thenReturn(true);
        assertThatThrownBy(() -> service.create(jwt(), workspaceId, projectId, request()))
            .isInstanceOf(com.nervix.platform.common.error.ConflictException.class);
    }

    private ServiceUpsertRequest request() {
        return new ServiceUpsertRequest("API", null, ServiceType.API, "v1.0.0",
            ServiceHealth.UNKNOWN, ServiceLifecycle.ACTIVE, null, null, null, null, Set.of());
    }

    private Jwt jwt() {
        return new Jwt("token", Instant.now(), Instant.now().plusSeconds(60),
            Map.of("alg", "none"), Map.of("sub", subject.toString()));
    }
}
