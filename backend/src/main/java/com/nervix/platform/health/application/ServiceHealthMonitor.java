package com.nervix.platform.health.application;

import com.nervix.platform.graph.application.ProjectGraphChangedEvent;
import com.nervix.platform.health.domain.ServiceHealthCheck;
import com.nervix.platform.health.infrastructure.ServiceHealthCheckRepository;
import com.nervix.platform.service.domain.*;
import com.nervix.platform.service.infrastructure.ProjectServiceRepository;
import java.net.URI;
import java.time.*;
import java.util.*;
import org.slf4j.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

@Service
public class ServiceHealthMonitor {
    private static final Logger log = LoggerFactory.getLogger(ServiceHealthMonitor.class);
    private static final List<String> COMMON_PATHS = List.of(
        "/actuator/health/readiness", "/actuator/health", "/health", "/healthz", "/ready"
    );

    private final ProjectServiceRepository services;
    private final ServiceHealthCheckRepository checks;
    private final ApplicationEventPublisher events;
    private final RestClient client;
    private final long warningThresholdMs;

    public ServiceHealthMonitor(ProjectServiceRepository services,
        ServiceHealthCheckRepository checks, ApplicationEventPublisher events,
        RestClient.Builder builder,
        @Value("${nervix.health.timeout:3s}") Duration timeout,
        @Value("${nervix.health.warning-threshold:1500ms}") Duration warningThreshold) {
        this.services = services;
        this.checks = checks;
        this.events = events;
        this.warningThresholdMs = warningThreshold.toMillis();
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(timeout);
        factory.setReadTimeout(timeout);
        this.client = builder.requestFactory(factory).build();
    }

    @Scheduled(fixedDelayString = "${nervix.health.interval-ms:30000}")
    @Transactional
    public void monitorAll() {
        Set<UUID> changedProjects = new LinkedHashSet<>();
        for (ProjectServiceEntity service : services.findAllBySoftDeletedFalse()) {
            if (service.getLifecycleStatus() == ServiceLifecycle.RETIRED) continue;
            if (monitor(service)) changedProjects.add(service.getProject().getId());
        }
        changedProjects.forEach(id -> events.publishEvent(new ProjectGraphChangedEvent(id)));
    }

    @EventListener(ApplicationReadyEvent.class)
    @Order(1)
    public void monitorConfiguredServicesOnStartup() {
        monitorAll();
    }

    @Transactional
    public HealthRunResult monitorProject(UUID projectId) {
        List<ProjectServiceEntity> projectServices = services
            .findAllByProjectIdAndSoftDeletedFalseOrderByUpdatedAtDesc(projectId).stream()
            .filter(service -> service.getLifecycleStatus() != ServiceLifecycle.RETIRED).toList();
        int healthy = 0, warning = 0, error = 0, pending = 0, unknown = 0;
        boolean changed = false;
        for (ProjectServiceEntity service : projectServices) {
            changed |= monitor(service);
            switch (service.getHealthStatus()) {
                case HEALTHY -> healthy++;
                case WARNING -> warning++;
                case ERROR -> error++;
                case PENDING -> pending++;
                case UNKNOWN -> unknown++;
            }
        }
        if (changed) events.publishEvent(new ProjectGraphChangedEvent(projectId));
        return new HealthRunResult(projectServices.size(), healthy, warning, error,
            pending, unknown, Instant.now());
    }

    @Transactional
    public void monitorService(ProjectServiceEntity service) {
        boolean changed = monitor(service);
        if (changed) events.publishEvent(new ProjectGraphChangedEvent(service.getProject().getId()));
    }

    private boolean monitor(ProjectServiceEntity service) {
        ServiceHealth previous = service.getRuntimeHealthStatus();
        ProbeResult result = probe(service.getEndpointUrl());
        service.recordHealth(result.status(), result.responseTimeMs(), result.message());
        services.save(service);
        checks.save(new ServiceHealthCheck(service, result.status(), result.responseTimeMs(), result.message()));
        log.info("service_health serviceId={} name={} status={} endpoint={} latencyMs={} message={}",
            service.getId(), service.getName(), result.status(), result.endpoint(),
            result.responseTimeMs(), result.message());
        return previous != result.status();
    }

    private ProbeResult probe(String configuredEndpoint) {
        if (configuredEndpoint == null || configuredEndpoint.isBlank()) {
            return new ProbeResult(ServiceHealth.UNKNOWN, null, null,
                "No endpoint configured");
        }
        List<URI> candidates;
        try { candidates = candidates(configuredEndpoint.trim()); }
        catch (IllegalArgumentException exception) {
            return new ProbeResult(ServiceHealth.ERROR, null, configuredEndpoint,
                "Invalid HTTP(S) endpoint");
        }

        String failure = "No health endpoint responded";
        for (URI endpoint : candidates) {
            Instant started = Instant.now();
            try {
                ResponseEntity<Void> response = client.get().uri(endpoint).retrieve().toBodilessEntity();
                long elapsed = Duration.between(started, Instant.now()).toMillis();
                if (response.getStatusCode().is2xxSuccessful()) {
                    ServiceHealth status = elapsed >= warningThresholdMs
                        ? ServiceHealth.WARNING : ServiceHealth.HEALTHY;
                    return new ProbeResult(status, elapsed, endpoint.toString(),
                        status == ServiceHealth.WARNING ? "Service is responding slowly" : "Service is responding");
                }
                failure = "HTTP " + response.getStatusCode().value();
            } catch (RuntimeException exception) {
                failure = exception.getClass().getSimpleName();
            }
        }
        return new ProbeResult(ServiceHealth.ERROR, null, candidates.get(0).toString(), failure);
    }

    private List<URI> candidates(String value) {
        URI configured = URI.create(value);
        if (!("http".equalsIgnoreCase(configured.getScheme())
            || "https".equalsIgnoreCase(configured.getScheme())) || configured.getHost() == null) {
            throw new IllegalArgumentException("Absolute HTTP(S) endpoint required");
        }
        LinkedHashSet<URI> result = new LinkedHashSet<>();
        String path = configured.getPath() == null ? "" : configured.getPath();
        if (!path.isBlank() && !"/".equals(path)) result.add(configured);
        String base = configured.getScheme() + "://" + configured.getAuthority();
        COMMON_PATHS.forEach(pathValue -> result.add(URI.create(base + pathValue)));
        result.add(URI.create(base));
        return List.copyOf(result);
    }

    private record ProbeResult(ServiceHealth status, Long responseTimeMs,
                               String endpoint, String message) {}
    public record HealthRunResult(int checked, int healthy, int warning, int error,
                                  int pending, int unknown, Instant completedAt) {}
}
