package com.nervix.platform.service.domain;

import com.nervix.platform.common.persistence.BaseEntity;
import com.nervix.platform.identity.domain.User;
import com.nervix.platform.project.domain.Project;
import jakarta.persistence.*;
import java.util.*;
import java.time.Instant;

@Entity
@Table(name = "services")
public class ProjectServiceEntity extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Project project;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_user_id")
    private User owner;
    @Column(nullable = false, length = 150)
    private String name;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Enumerated(EnumType.STRING)
    @Column(name = "service_type", nullable = false, length = 30)
    private ServiceType serviceType;
    @Column(name = "version_label", nullable = false, length = 50)
    private String versionLabel;
    @Enumerated(EnumType.STRING)
    @Column(name = "health_status", nullable = false, length = 30)
    private ServiceHealth healthStatus = ServiceHealth.UNKNOWN;
    @Enumerated(EnumType.STRING)
    @Column(name = "runtime_health_status", nullable = false, length = 30)
    private ServiceHealth runtimeHealthStatus = ServiceHealth.UNKNOWN;
    @Enumerated(EnumType.STRING)
    @Column(name = "lifecycle_status", nullable = false, length = 30)
    private ServiceLifecycle lifecycleStatus = ServiceLifecycle.ACTIVE;
    @Column(columnDefinition = "TEXT")
    private String repositoryUrl;
    @Column(columnDefinition = "TEXT")
    private String endpointUrl;
    @Enumerated(EnumType.STRING)
    @Column(name = "runtime_mode", nullable = false, length = 30)
    private RuntimeMode runtimeMode = RuntimeMode.EXTERNAL;
    @Column(name = "managed_port")
    private Integer managedPort;
    @Column(name = "last_health_check_at")
    private Instant lastHealthCheckAt;
    @Column(name = "health_response_time_ms")
    private Long healthResponseTimeMs;
    @Column(name = "health_message", length = 500)
    private String healthMessage;
    @Column(length = 100)
    private String technology;
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "service_tags", joinColumns = @JoinColumn(name = "service_id"))
    @Column(name = "tag", length = 50)
    private Set<String> tags = new LinkedHashSet<>();

    protected ProjectServiceEntity() {}

    public ProjectServiceEntity(Project project, User owner, String name, String description,
        ServiceType type, String versionLabel, ServiceHealth health, ServiceLifecycle lifecycle,
        String repositoryUrl, String endpointUrl, String technology, Set<String> tags) {
        this.project = project;
        this.healthStatus = ServiceHealth.UNKNOWN;
        update(owner, name, description, type, versionLabel, health, lifecycle,
            repositoryUrl, endpointUrl, technology, tags);
    }

    public void update(User owner, String name, String description, ServiceType type,
        String versionLabel, ServiceHealth health, ServiceLifecycle lifecycle,
        String repositoryUrl, String endpointUrl, String technology, Set<String> tags) {
        this.owner = owner;
        this.name = name.trim();
        this.description = clean(description);
        this.serviceType = type;
        this.versionLabel = versionLabel.trim();
        // Runtime health is evidence produced by the endpoint monitor. It is
        // intentionally not editable through service metadata requests.
        this.lifecycleStatus = lifecycle;
        this.repositoryUrl = clean(repositoryUrl);
        this.endpointUrl = clean(endpointUrl);
        this.technology = clean(technology);
        this.tags.clear();
        if (tags != null) tags.stream().map(String::trim).filter(value -> !value.isBlank()).forEach(this.tags::add);
    }

    private String clean(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    public Project getProject() { return project; }
    public User getOwner() { return owner; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public ServiceType getServiceType() { return serviceType; }
    public String getVersionLabel() { return versionLabel; }
    public ServiceHealth getHealthStatus() { return healthStatus; }
    public ServiceHealth getRuntimeHealthStatus() { return runtimeHealthStatus; }
    public void updateHealthFromIncidents(ServiceHealth health) { this.healthStatus = health; }
    public ServiceLifecycle getLifecycleStatus() { return lifecycleStatus; }
    public String getRepositoryUrl() { return repositoryUrl; }
    public String getEndpointUrl() { return endpointUrl; }
    public RuntimeMode getRuntimeMode() { return runtimeMode; }
    public Integer getManagedPort() { return managedPort; }
    public boolean isLocallyManaged() { return runtimeMode == RuntimeMode.LOCAL_MANAGED; }
    public void configureManagedRuntime(int port) {
        this.runtimeMode = RuntimeMode.LOCAL_MANAGED;
        this.managedPort = port;
        this.endpointUrl = "http://127.0.0.1:" + port + "/health";
        this.healthStatus = ServiceHealth.PENDING;
        this.runtimeHealthStatus = ServiceHealth.PENDING;
        this.healthMessage = "Managed runtime provisioned; awaiting first observation";
    }
    public void configureExternalRuntime(String endpoint) {
        this.runtimeMode = RuntimeMode.EXTERNAL;
        this.managedPort = null;
        this.endpointUrl = clean(endpoint);
        this.healthStatus = this.endpointUrl == null ? ServiceHealth.UNKNOWN : ServiceHealth.PENDING;
        this.runtimeHealthStatus = this.healthStatus;
        this.healthResponseTimeMs = null;
        this.lastHealthCheckAt = null;
        this.healthMessage = this.endpointUrl == null ? "No endpoint configured" : "Endpoint configured; awaiting first observation";
    }
    public Instant getLastHealthCheckAt() { return lastHealthCheckAt; }
    public Long getHealthResponseTimeMs() { return healthResponseTimeMs; }
    public String getHealthMessage() { return healthMessage; }
    public void recordHealth(ServiceHealth status, Long responseTimeMs, String message) {
        this.runtimeHealthStatus = status == null ? ServiceHealth.UNKNOWN : status;
        this.healthStatus = this.runtimeHealthStatus;
        this.healthResponseTimeMs = responseTimeMs;
        this.healthMessage = clean(message);
        this.lastHealthCheckAt = Instant.now();
    }
    public String getTechnology() { return technology; }
    public Set<String> getTags() { return Set.copyOf(tags); }
}
