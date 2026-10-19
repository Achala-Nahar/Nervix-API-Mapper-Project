package com.nervix.platform.health.domain;

import com.nervix.platform.service.domain.ProjectServiceEntity;
import com.nervix.platform.service.domain.ServiceHealth;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "service_health_checks")
public class ServiceHealthCheck {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "service_id", nullable = false)
    private ProjectServiceEntity service;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ServiceHealth status;
    @Column(name = "response_time_ms")
    private Long responseTimeMs;
    @Column(length = 500)
    private String message;
    @Column(name = "checked_at", nullable = false)
    private Instant checkedAt;

    protected ServiceHealthCheck() {}

    public ServiceHealthCheck(ProjectServiceEntity service, ServiceHealth status,
                              Long responseTimeMs, String message) {
        this.service = service;
        this.status = status;
        this.responseTimeMs = responseTimeMs;
        this.message = message;
        this.checkedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public ServiceHealth getStatus() { return status; }
    public Long getResponseTimeMs() { return responseTimeMs; }
    public String getMessage() { return message; }
    public Instant getCheckedAt() { return checkedAt; }
}
