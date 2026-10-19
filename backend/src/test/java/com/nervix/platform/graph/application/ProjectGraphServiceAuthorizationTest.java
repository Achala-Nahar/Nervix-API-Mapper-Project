package com.nervix.platform.graph.application;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

import com.nervix.platform.dependency.infrastructure.ServiceDependencyRepository;
import com.nervix.platform.identity.domain.User;
import com.nervix.platform.identity.infrastructure.UserRepository;
import com.nervix.platform.organization.domain.Organization;
import com.nervix.platform.project.domain.*;
import com.nervix.platform.project.infrastructure.*;
import com.nervix.platform.service.infrastructure.ProjectServiceRepository;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.util.ReflectionTestUtils;

class ProjectGraphServiceAuthorizationTest {
    private final Neo4jClient neo4j = mock(Neo4jClient.class);
    private final UserRepository users = mock(UserRepository.class);
    private final ProjectRepository projects = mock(ProjectRepository.class);
    private final ProjectMemberRepository members = mock(ProjectMemberRepository.class);
    private final ProjectServiceRepository services = mock(ProjectServiceRepository.class);
    private final ServiceDependencyRepository dependencies = mock(ServiceDependencyRepository.class);
    private final ProjectGraphService graph =
        new ProjectGraphService(neo4j, users, projects, members, services, dependencies);

    @Test
    void viewerCannotReconcileGraph() {
        UUID subject = UUID.randomUUID(), userId = UUID.randomUUID();
        UUID workspaceId = UUID.randomUUID(), projectId = UUID.randomUUID();
        User user = new User(subject, "viewer@nervix.test", "Viewer");
        ReflectionTestUtils.setField(user, "id", userId);
        Organization workspace = new Organization("Workspace", "workspace");
        ReflectionTestUtils.setField(workspace, "id", workspaceId);
        Project project = new Project(workspace, "Project", null,
            ProjectType.MICROSERVICES, ProjectVisibility.PRIVATE, Set.of());
        ReflectionTestUtils.setField(project, "id", projectId);
        when(users.findBySupabaseUserIdAndSoftDeletedFalse(subject)).thenReturn(Optional.of(user));
        when(projects.findByIdAndOrganizationIdAndSoftDeletedFalse(projectId, workspaceId))
            .thenReturn(Optional.of(project));
        when(members.findByProjectIdAndUserIdAndSoftDeletedFalse(projectId, userId))
            .thenReturn(Optional.of(new ProjectMember(project, user, ProjectRole.VIEWER)));

        Jwt jwt = Jwt.withTokenValue("token").header("alg", "none")
            .subject(subject.toString()).claim("email", user.getEmail()).build();
        assertThatThrownBy(() -> graph.reconcile(jwt, workspaceId, projectId))
            .isInstanceOf(AccessDeniedException.class);
        verifyNoInteractions(neo4j, services, dependencies);
    }
}
