package com.nervix.platform.health.application;

import com.nervix.platform.service.domain.ProjectServiceEntity;
import com.nervix.platform.service.infrastructure.ProjectServiceRepository;
import com.nervix.platform.dependency.infrastructure.ServiceDependencyRepository;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import jakarta.annotation.PreDestroy;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Local managed runtimes are real independent HTTP listeners intended for local
 * acceptance testing. Production services remain EXTERNAL and are deployed by
 * the organization's normal Kubernetes/Cloud Run/VM pipeline. */
@Service
public class ManagedRuntimeService {
    private static final Logger log = LoggerFactory.getLogger(ManagedRuntimeService.class);
    private final ProjectServiceRepository services;
    private final ServiceDependencyRepository dependencies;
    private final HttpClient dependencyClient = HttpClient.newBuilder().connectTimeout(Duration.ofMillis(500)).build();
    private final Map<UUID, HttpServer> servers = new ConcurrentHashMap<>();
    private final Map<UUID, Long> responseDelaysMs = new ConcurrentHashMap<>();

    public ManagedRuntimeService(ProjectServiceRepository services, ServiceDependencyRepository dependencies) {
        this.services = services;
        this.dependencies = dependencies;
    }

    @Transactional
    public void provision(ProjectServiceEntity service) {
        stopListener(service.getId());
        try {
            HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
            server.createContext("/health", exchange -> health(exchange, service));
            server.createContext("/ready", exchange -> health(exchange, service));
            server.createContext("/", exchange -> info(exchange, service));
            server.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
            server.start();
            int port = server.getAddress().getPort();
            servers.put(service.getId(), server);
            service.configureManagedRuntime(port);
            services.save(service);
            log.info("managed_runtime_started serviceId={} port={}", service.getId(), port);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not provision managed service runtime", exception);
        }
    }

    public void stop(ProjectServiceEntity service) {
        stopListener(service.getId());
        log.warn("managed_runtime_stopped serviceId={} name={}", service.getId(), service.getName());
    }

    public void makeSlow(ProjectServiceEntity service) {
        if (!servers.containsKey(service.getId())) throw new IllegalStateException("Managed runtime is not running");
        responseDelaysMs.put(service.getId(), 1800L);
        log.warn("managed_runtime_degraded serviceId={} delayMs=1800", service.getId());
    }

    @Transactional
    public void restart(ProjectServiceEntity service) {
        responseDelaysMs.remove(service.getId());
        provision(service);
    }

    @EventListener(ApplicationReadyEvent.class)
    @Order(0)
    @Transactional
    public void restoreManagedRuntimes() {
        services.findAllBySoftDeletedFalse().stream().filter(ProjectServiceEntity::isLocallyManaged)
            .forEach(this::provision);
    }

    private void health(HttpExchange exchange, ProjectServiceEntity service) throws IOException {
        long delay = responseDelaysMs.getOrDefault(service.getId(), 0L);
        if (delay > 0) {
            try { Thread.sleep(delay); }
            catch (InterruptedException exception) { Thread.currentThread().interrupt(); }
        }
        for (ServiceDependencyRepository.RuntimeDependencyTarget target
            : dependencies.findRuntimeTargets(service.getId())) {
            if (!("HIGH".equals(target.getCriticality()) || "CRITICAL".equals(target.getCriticality()))) continue;
            if (!endpointUp(target.getEndpointUrl())) {
                respond(exchange, 503, "{\"status\":\"DOWN\",\"cause\":\"Required dependency unavailable\",\"dependency\":\""
                    + escape(target.getTargetName()) + "\"}");
                return;
            }
        }
        respond(exchange, 200, "{\"status\":\"UP\",\"serviceId\":\"" + service.getId()
            + "\",\"service\":\"" + escape(service.getName()) + "\"}");
    }

    private boolean endpointUp(String endpoint) {
        if (endpoint == null || endpoint.isBlank()) return false;
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(endpoint)).timeout(Duration.ofSeconds(1)).GET().build();
            int status = dependencyClient.send(request, HttpResponse.BodyHandlers.discarding()).statusCode();
            return status >= 200 && status < 300;
        } catch (Exception exception) {
            return false;
        }
    }

    private void info(HttpExchange exchange, ProjectServiceEntity service) throws IOException {
        respond(exchange, 200, "{\"name\":\"" + escape(service.getName())
            + "\",\"version\":\"" + escape(service.getVersionLabel()) + "\"}");
    }

    private void respond(HttpExchange exchange, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }

    private String escape(String value) { return value == null ? "" : value.replace("\\", "\\\\").replace("\"", "\\\""); }
    private void stopListener(UUID id) {
        HttpServer server = servers.remove(id);
        if (server != null) server.stop(0);
    }
    @PreDestroy public void close() { servers.keySet().stream().toList().forEach(this::stopListener); }
}
