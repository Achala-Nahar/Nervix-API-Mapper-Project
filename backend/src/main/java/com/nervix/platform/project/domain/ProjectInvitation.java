package com.nervix.platform.project.domain;

import com.nervix.platform.common.persistence.BaseEntity;
import com.nervix.platform.identity.domain.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "project_invitations")
public class ProjectInvitation extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Project project;
    @Column(nullable = false, length = 320)
    private String email;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ProjectRole role;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ProjectInvitationStatus status = ProjectInvitationStatus.PENDING;
    @Column(length = 1000)
    private String message;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invited_by_user_id")
    private User invitedBy;
    @Column(nullable = false)
    private Instant expiresAt;
    private Instant respondedAt;

    protected ProjectInvitation() {}

    public ProjectInvitation(Project project, String email, ProjectRole role, String message, User invitedBy) {
        this.project = project;
        this.email = email.trim().toLowerCase();
        this.role = role;
        this.message = message == null || message.isBlank() ? null : message.trim();
        this.invitedBy = invitedBy;
        this.expiresAt = Instant.now().plusSeconds(7 * 24 * 60 * 60);
    }

    public void accept() { status = ProjectInvitationStatus.ACCEPTED; respondedAt = Instant.now(); }
    public void reject() { status = ProjectInvitationStatus.REJECTED; respondedAt = Instant.now(); }
    public void revoke() { status = ProjectInvitationStatus.REVOKED; respondedAt = Instant.now(); }
    public void expire() { status = ProjectInvitationStatus.EXPIRED; respondedAt = Instant.now(); }
    public Project getProject() { return project; }
    public String getEmail() { return email; }
    public ProjectRole getRole() { return role; }
    public ProjectInvitationStatus getStatus() { return status; }
    public String getMessage() { return message; }
    public User getInvitedBy() { return invitedBy; }
    public Instant getExpiresAt() { return expiresAt; }
    public Instant getRespondedAt() { return respondedAt; }
}
