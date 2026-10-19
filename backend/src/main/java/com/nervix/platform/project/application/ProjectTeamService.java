package com.nervix.platform.project.application;

import com.nervix.platform.common.error.*;
import com.nervix.platform.identity.domain.User;
import com.nervix.platform.identity.infrastructure.UserRepository;
import com.nervix.platform.organization.infrastructure.OrganizationMemberRepository;
import com.nervix.platform.project.api.*;
import com.nervix.platform.project.domain.*;
import com.nervix.platform.project.infrastructure.*;
import java.time.Instant;
import java.util.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProjectTeamService {
    private final UserRepository users;
    private final OrganizationMemberRepository workspaceMembers;
    private final ProjectRepository projects;
    private final ProjectMemberRepository members;
    private final ProjectInvitationRepository invitations;

    public ProjectTeamService(UserRepository users, OrganizationMemberRepository workspaceMembers,
        ProjectRepository projects, ProjectMemberRepository members, ProjectInvitationRepository invitations) {
        this.users = users;
        this.workspaceMembers = workspaceMembers;
        this.projects = projects;
        this.members = members;
        this.invitations = invitations;
    }

    @Transactional(readOnly = true)
    public ProjectTeamResponse team(Jwt jwt, UUID workspaceId, UUID projectId) {
        User actor = currentUser(jwt);
        Project project = project(workspaceId, projectId);
        ProjectMember actorMember = requireMember(project, actor.getId());
        List<ProjectInvitationResponse> projectInvitations = actorMember.getRole().canManage()
            ? invitations.findAllByProjectIdAndSoftDeletedFalseOrderByCreatedAtDesc(projectId).stream()
                .map(this::invitationResponse).toList()
            : List.of();
        return new ProjectTeamResponse(actorMember.getRole(),
            members.findAllByProjectIdAndSoftDeletedFalseOrderByJoinedAtAsc(projectId).stream()
                .map(this::memberResponse).toList(), projectInvitations);
    }

    @Transactional
    public ProjectMemberResponse changeRole(Jwt jwt, UUID workspaceId, UUID projectId,
        UUID targetUserId, ChangeProjectRoleRequest request) {
        User actor = currentUser(jwt);
        Project project = project(workspaceId, projectId);
        ProjectMember actorMember = requireManager(project, actor.getId());
        ProjectMember target = requireMember(project, targetUserId);
        if (target.getRole() == ProjectRole.OWNER || request.role() == ProjectRole.OWNER) {
            throw new IllegalArgumentException("Project ownership cannot be changed through role management");
        }
        if (actorMember.getRole() == ProjectRole.ADMIN &&
            (target.getRole() == ProjectRole.ADMIN || request.role() == ProjectRole.ADMIN)) {
            throw new AccessDeniedException("Only the project owner can manage administrators");
        }
        target.changeRole(request.role());
        return memberResponse(target);
    }

    @Transactional
    public void remove(Jwt jwt, UUID workspaceId, UUID projectId, UUID targetUserId) {
        User actor = currentUser(jwt);
        Project project = project(workspaceId, projectId);
        ProjectMember actorMember = requireManager(project, actor.getId());
        ProjectMember target = requireMember(project, targetUserId);
        if (target.getRole() == ProjectRole.OWNER) {
            throw new IllegalArgumentException("The project owner cannot be removed");
        }
        if (actorMember.getRole() == ProjectRole.ADMIN && target.getRole() == ProjectRole.ADMIN) {
            throw new AccessDeniedException("Only the project owner can remove an administrator");
        }
        target.softDelete();
    }

    @Transactional
    public ProjectInvitationResponse invite(Jwt jwt, UUID workspaceId, UUID projectId,
        CreateProjectInvitationRequest request) {
        User actor = currentUser(jwt);
        Project project = project(workspaceId, projectId);
        ProjectMember actorMember = requireManager(project, actor.getId());
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (request.role() == ProjectRole.OWNER) {
            throw new IllegalArgumentException("Ownership transfer is not supported");
        }
        if (actorMember.getRole() == ProjectRole.ADMIN && request.role() == ProjectRole.ADMIN) {
            throw new AccessDeniedException("Only the project owner can invite administrators");
        }
        if (actor.getEmail().equalsIgnoreCase(email)) {
            throw new IllegalArgumentException("You are already a member of this project");
        }
        users.findByEmailIgnoreCaseAndSoftDeletedFalse(email).ifPresent(user -> {
            if (members.findByProjectIdAndUserIdAndSoftDeletedFalse(projectId, user.getId()).isPresent()) {
                throw new ConflictException("This user is already a project member");
            }
            requireWorkspaceMember(workspaceId, user.getId());
        });
        if (invitations.existsByProjectIdAndEmailIgnoreCaseAndStatusAndSoftDeletedFalse(
            projectId, email, ProjectInvitationStatus.PENDING)) {
            throw new ConflictException("A pending invitation already exists for this email");
        }
        return invitationResponse(invitations.save(
            new ProjectInvitation(project, email, request.role(), request.message(), actor)));
    }

    @Transactional
    public void revoke(Jwt jwt, UUID workspaceId, UUID projectId, UUID invitationId) {
        User actor = currentUser(jwt);
        Project project = project(workspaceId, projectId);
        requireManager(project, actor.getId());
        ProjectInvitation invitation = invitations.findByIdAndProjectIdAndSoftDeletedFalse(invitationId, projectId)
            .orElseThrow(() -> new ResourceNotFoundException("Invitation not found"));
        if (invitation.getStatus() != ProjectInvitationStatus.PENDING) {
            throw new ConflictException("Only pending invitations can be revoked");
        }
        invitation.revoke();
    }

    @Transactional
    public List<ProjectInvitationResponse> myInvitations(Jwt jwt) {
        User user = currentUser(jwt);
        List<ProjectInvitationResponse> result = new ArrayList<>();
        for (ProjectInvitation invitation : invitations
            .findAllByEmailIgnoreCaseAndStatusAndSoftDeletedFalseOrderByCreatedAtAsc(
                user.getEmail(), ProjectInvitationStatus.PENDING)) {
            if (invitation.getExpiresAt().isBefore(Instant.now())) {
                invitation.expire();
                continue;
            }
            if (invitation.getProject().isSoftDeleted()) {
                invitation.revoke();
                continue;
            }
            result.add(invitationResponse(invitation));
        }
        return result;
    }

    @Transactional
    public ProjectInvitationResponse respondToInvitation(Jwt jwt, UUID invitationId, boolean accept) {
        User user = currentUser(jwt);
        ProjectInvitation invitation = invitations.findByIdAndSoftDeletedFalse(invitationId)
            .orElseThrow(() -> new ResourceNotFoundException("Invitation not found"));
        if (!invitation.getEmail().equalsIgnoreCase(user.getEmail())) {
            throw new AccessDeniedException("This invitation belongs to another user");
        }
        if (invitation.getStatus() != ProjectInvitationStatus.PENDING) {
            throw new ConflictException("This invitation has already been answered");
        }
        if (invitation.getExpiresAt().isBefore(Instant.now())) {
            invitation.expire();
            throw new ConflictException("This invitation has expired");
        }
        Project project = invitation.getProject();
        if (project.isSoftDeleted()) {
            invitation.revoke();
            throw new ConflictException("This project is no longer available");
        }
        if (accept) {
            requireWorkspaceMember(project.getOrganization().getId(), user.getId());
            members.findByProjectIdAndUserId(project.getId(), user.getId())
                .map(existing -> {
                    existing.restore();
                    existing.changeRole(invitation.getRole());
                    return existing;
                })
                .orElseGet(() -> members.save(new ProjectMember(project, user, invitation.getRole())));
            invitation.accept();
        } else {
            invitation.reject();
        }
        return invitationResponse(invitation);
    }

    private User currentUser(Jwt jwt) {
        UUID subject;
        try { subject = UUID.fromString(jwt.getSubject()); }
        catch (RuntimeException exception) { throw new AccessDeniedException("Invalid authenticated subject"); }
        return users.findBySupabaseUserIdAndSoftDeletedFalse(subject)
            .orElseThrow(() -> new ResourceNotFoundException("User profile not found"));
    }

    private Project project(UUID workspaceId, UUID projectId) {
        return projects.findByIdAndOrganizationIdAndSoftDeletedFalse(projectId, workspaceId)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
    }

    private ProjectMember requireMember(Project project, UUID userId) {
        return members.findByProjectIdAndUserIdAndSoftDeletedFalse(project.getId(), userId)
            .orElseThrow(() -> new AccessDeniedException("Project membership required"));
    }

    private ProjectMember requireManager(Project project, UUID userId) {
        ProjectMember member = requireMember(project, userId);
        if (!member.getRole().canManage()) throw new AccessDeniedException("Insufficient project role");
        return member;
    }

    private void requireWorkspaceMember(UUID workspaceId, UUID userId) {
        var membership = workspaceMembers.findByOrganizationIdAndUserIdAndSoftDeletedFalse(workspaceId, userId)
            .orElseThrow(() -> new AccessDeniedException("Workspace membership required"));
        if (!"ACTIVE".equals(membership.getStatus())) {
            throw new AccessDeniedException("Workspace membership is inactive");
        }
    }

    private ProjectMemberResponse memberResponse(ProjectMember member) {
        User user = member.getUser();
        return new ProjectMemberResponse(user.getId(), user.getEmail(), user.getDisplayName(),
            user.getAvatarUrl(), member.getRole(), member.getJoinedAt());
    }

    private ProjectInvitationResponse invitationResponse(ProjectInvitation invitation) {
        Project project = invitation.getProject();
        return new ProjectInvitationResponse(invitation.getId(), project.getId(),
            project.getOrganization().getId(), project.getName(),
            invitation.getEmail(), invitation.getRole(),
            invitation.getStatus(), invitation.getMessage(), invitation.getInvitedBy().getDisplayName(),
            invitation.getExpiresAt(), invitation.getCreatedAt());
    }
}
