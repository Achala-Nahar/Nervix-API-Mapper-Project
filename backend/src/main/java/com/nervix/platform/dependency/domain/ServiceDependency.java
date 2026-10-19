package com.nervix.platform.dependency.domain;

import com.nervix.platform.common.persistence.BaseEntity;
import com.nervix.platform.project.domain.Project;
import com.nervix.platform.service.domain.ProjectServiceEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "service_dependencies")
public class ServiceDependency extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Project project;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "source_service_id")
    private ProjectServiceEntity sourceService;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "target_service_id")
    private ProjectServiceEntity targetService;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DependencyType dependencyType;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DependencyCriticality criticality;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CommunicationProtocol communicationProtocol;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DependencyDirection direction;
    private Integer latencyMs;
    @Column(columnDefinition = "TEXT")
    private String description;

    protected ServiceDependency() {}

    public ServiceDependency(Project project, ProjectServiceEntity source, ProjectServiceEntity target,
        DependencyType type, DependencyCriticality criticality, CommunicationProtocol protocol,
        DependencyDirection direction, Integer latencyMs, String description) {
        this.project = project;
        this.sourceService = source;
        this.targetService = target;
        update(type, criticality, protocol, direction, latencyMs, description);
    }

    public void update(DependencyType type, DependencyCriticality criticality,
        CommunicationProtocol protocol, DependencyDirection direction, Integer latencyMs,
        String description) {
        this.dependencyType = type;
        this.criticality = criticality;
        this.communicationProtocol = protocol;
        this.direction = direction;
        this.latencyMs = latencyMs;
        this.description = description == null || description.isBlank() ? null : description.trim();
    }

    public Project getProject() { return project; }
    public ProjectServiceEntity getSourceService() { return sourceService; }
    public ProjectServiceEntity getTargetService() { return targetService; }
    public DependencyType getDependencyType() { return dependencyType; }
    public DependencyCriticality getCriticality() { return criticality; }
    public CommunicationProtocol getCommunicationProtocol() { return communicationProtocol; }
    public DependencyDirection getDirection() { return direction; }
    public Integer getLatencyMs() { return latencyMs; }
    public String getDescription() { return description; }
}
