package com.nervix.platform.incident.domain;

import com.nervix.platform.common.persistence.BaseEntity;
import com.nervix.platform.identity.domain.User;
import com.nervix.platform.project.domain.Project;
import com.nervix.platform.service.domain.ProjectServiceEntity;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "project_incidents")
public class ProjectIncident extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false) private Project project;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "service_id")
    private ProjectServiceEntity service;
    @Column(nullable = false, length = 180) private String title;
    @Column(columnDefinition = "TEXT") private String description;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private IncidentSeverity severity;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private IncidentCategory category;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private IncidentStatus status = IncidentStatus.OPEN;
    @Column(length = 80) private String source;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "assigned_to_user_id") private User assignedTo;
    private Instant acknowledgedAt;
    private Instant resolvedAt;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "resolved_by_user_id") private User resolvedBy;
    @Column(columnDefinition = "TEXT") private String resolutionNote;

    protected ProjectIncident() {}
    public ProjectIncident(Project project, ProjectServiceEntity service, String title, String description,
        IncidentSeverity severity, IncidentCategory category, String source, User assignedTo) {
        this.project = project; this.service = service; this.title = title.trim();
        this.description = clean(description); this.severity = severity; this.category = category;
        this.source = clean(source); this.assignedTo = assignedTo;
    }
    public void acknowledge(User assignee) {
        if (status == IncidentStatus.RESOLVED) throw new IllegalStateException("Resolved incidents cannot be acknowledged");
        status = IncidentStatus.ACKNOWLEDGED; acknowledgedAt = Instant.now();
        if (assignee != null) assignedTo = assignee;
    }
    public void resolve(String note) { resolve(note, null); }
    public void resolve(String note, User resolver) {
        if (status == IncidentStatus.RESOLVED) throw new IllegalStateException("Incident is already resolved");
        if (acknowledgedAt == null) acknowledgedAt = Instant.now();
        status = IncidentStatus.RESOLVED; resolvedAt = Instant.now(); resolutionNote = clean(note); resolvedBy = resolver;
    }
    public void reopen() {
        if (status != IncidentStatus.RESOLVED) throw new IllegalStateException("Only resolved incidents can be reopened");
        status = IncidentStatus.OPEN; acknowledgedAt = null; resolvedAt = null; resolutionNote = null; resolvedBy = null;
    }
    private String clean(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    public Project getProject() { return project; } public ProjectServiceEntity getService() { return service; }
    public String getTitle() { return title; } public String getDescription() { return description; }
    public IncidentSeverity getSeverity() { return severity; } public IncidentCategory getCategory() { return category; }
    public IncidentStatus getStatus() { return status; } public String getSource() { return source; }
    public User getAssignedTo() { return assignedTo; } public Instant getAcknowledgedAt() { return acknowledgedAt; }
    public Instant getResolvedAt() { return resolvedAt; } public String getResolutionNote() { return resolutionNote; }
    public User getResolvedBy() { return resolvedBy; }
}

