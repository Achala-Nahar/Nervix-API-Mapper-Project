package com.nervix.platform.project.application;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.nervix.platform.identity.domain.User;
import com.nervix.platform.identity.infrastructure.UserRepository;
import com.nervix.platform.organization.domain.Organization;
import com.nervix.platform.organization.infrastructure.OrganizationMemberRepository;
import com.nervix.platform.project.api.*;
import com.nervix.platform.project.domain.*;
import com.nervix.platform.project.infrastructure.*;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.util.ReflectionTestUtils;

class ProjectTeamServiceAuthorizationTest {
    private final UserRepository users = mock(UserRepository.class);
    private final OrganizationMemberRepository workspaceMembers = mock(OrganizationMemberRepository.class);
    private final ProjectRepository projects = mock(ProjectRepository.class);
    private final ProjectMemberRepository members = mock(ProjectMemberRepository.class);
    private final ProjectInvitationRepository invitations = mock(ProjectInvitationRepository.class);
    private final ProjectTeamService service =
        new ProjectTeamService(users, workspaceMembers, projects, members, invitations);

    private final UUID subject = UUID.randomUUID();
    private final UUID actorId = UUID.randomUUID();
    private final UUID targetId = UUID.randomUUID();
    private final UUID workspaceId = UUID.randomUUID();
    private final UUID projectId = UUID.randomUUID();
    private User actor;
    private User target;
    private Project project;

    @BeforeEach
    void setUp() {
        actor = user(subject, actorId, "actor@nervix.test", "Actor");
        target = user(UUID.randomUUID(), targetId, "target@nervix.test", "Target");
        Organization workspace = new Organization("Workspace", "workspace");
        ReflectionTestUtils.setField(workspace, "id", workspaceId);
        project = new Project(workspace, "Project", null,
            ProjectType.MICROSERVICES, ProjectVisibility.PRIVATE, Set.of());
        ReflectionTestUtils.setField(project, "id", projectId);
        when(users.findBySupabaseUserIdAndSoftDeletedFalse(subject)).thenReturn(Optional.of(actor));
        when(projects.findByIdAndOrganizationIdAndSoftDeletedFalse(projectId, workspaceId))
            .thenReturn(Optional.of(project));
    }

    @Test
    void viewerCannotInviteMembers() {
        when(members.findByProjectIdAndUserIdAndSoftDeletedFalse(projectId, actorId))
            .thenReturn(Optional.of(new ProjectMember(project, actor, ProjectRole.VIEWER)));

        assertThatThrownBy(() -> service.invite(jwt(), workspaceId, projectId,
            new CreateProjectInvitationRequest("new@nervix.test", ProjectRole.VIEWER, null)))
            .isInstanceOf(AccessDeniedException.class);
        verifyNoInteractions(invitations);
    }

    @Test
    void adminCannotPromoteAnotherMemberToAdmin() {
        when(members.findByProjectIdAndUserIdAndSoftDeletedFalse(projectId, actorId))
            .thenReturn(Optional.of(new ProjectMember(project, actor, ProjectRole.ADMIN)));
        when(members.findByProjectIdAndUserIdAndSoftDeletedFalse(projectId, targetId))
            .thenReturn(Optional.of(new ProjectMember(project, target, ProjectRole.EDITOR)));

        assertThatThrownBy(() -> service.changeRole(jwt(), workspaceId, projectId, targetId,
            new ChangeProjectRoleRequest(ProjectRole.ADMIN)))
            .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void ownerCannotBeRemoved() {
        ProjectMember owner = new ProjectMember(project, actor, ProjectRole.OWNER);
        when(members.findByProjectIdAndUserIdAndSoftDeletedFalse(projectId, actorId))
            .thenReturn(Optional.of(owner));

        assertThatThrownBy(() -> service.remove(jwt(), workspaceId, projectId, actorId))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("owner");
    }

    @Test
    void invitedUserCanRejectWithoutBecomingProjectMember() {
        ProjectInvitation invitation = new ProjectInvitation(
            project, actor.getEmail(), ProjectRole.VIEWER, "Please join", target);
        UUID invitationId = UUID.randomUUID();
        ReflectionTestUtils.setField(invitation, "id", invitationId);
        when(invitations.findByIdAndSoftDeletedFalse(invitationId)).thenReturn(Optional.of(invitation));

        ProjectInvitationResponse response = service.respondToInvitation(jwt(), invitationId, false);

        assertThat(response.status()).isEqualTo(ProjectInvitationStatus.REJECTED);
        verify(members, never()).save(any());
    }

    private User user(UUID supabaseId, UUID id, String email, String name) {
        User user = new User(supabaseId, email, name);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private Jwt jwt() {
        return new Jwt("token", Instant.now(), Instant.now().plusSeconds(60),
            Map.of("alg", "none"), Map.of("sub", subject.toString()));
    }
}
