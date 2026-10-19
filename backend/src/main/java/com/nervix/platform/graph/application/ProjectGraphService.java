package com.nervix.platform.graph.application;

import com.nervix.platform.common.error.ResourceNotFoundException;
import com.nervix.platform.dependency.domain.ServiceDependency;
import com.nervix.platform.dependency.infrastructure.ServiceDependencyRepository;
import com.nervix.platform.graph.api.*;
import com.nervix.platform.identity.domain.User;
import com.nervix.platform.identity.infrastructure.UserRepository;
import com.nervix.platform.project.domain.*;
import com.nervix.platform.project.infrastructure.*;
import com.nervix.platform.service.domain.ProjectServiceEntity;
import com.nervix.platform.service.domain.ServiceHealth;
import com.nervix.platform.service.infrastructure.ProjectServiceRepository;
import java.time.Instant;
import java.util.*;
import org.slf4j.*;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.*;

@Service
public class ProjectGraphService {
    private static final Logger log = LoggerFactory.getLogger(ProjectGraphService.class);
    private final Neo4jClient neo4j;
    private final UserRepository users;
    private final ProjectRepository projects;
    private final ProjectMemberRepository members;
    private final ProjectServiceRepository services;
    private final ServiceDependencyRepository dependencies;

    public ProjectGraphService(Neo4jClient neo4j, UserRepository users, ProjectRepository projects,
        ProjectMemberRepository members, ProjectServiceRepository services,
        ServiceDependencyRepository dependencies) {
        this.neo4j = neo4j;
        this.users = users;
        this.projects = projects;
        this.members = members;
        this.services = services;
        this.dependencies = dependencies;
    }

    @Transactional(readOnly = true)
    public ProjectGraphResponse graph(Jwt jwt, UUID workspaceId, UUID projectId) {
        Project project = access(jwt, workspaceId, projectId).project();
        GraphData data = data(project, workspaceId);
        return response(data, Instant.now(), false,
            "Graph loaded from PostgreSQL. Neo4j synchronization runs automatically after project changes.");
    }

    public GraphSyncResponse reconcile(Jwt jwt, UUID workspaceId, UUID projectId) {
        Access access = access(jwt, workspaceId, projectId);
        if (!access.member().getRole().canEdit()) {
            throw new AccessDeniedException("Insufficient project role");
        }
        GraphData data = data(access.project(), workspaceId);
        try {
            Instant synchronizedAt = synchronize(data);
            return new GraphSyncResponse(projectId, data.services().size(), data.dependencies().size(),
                synchronizedAt, true, "Neo4j graph synchronized successfully");
        } catch (RuntimeException exception) {
            log.warn("Manual Neo4j reconciliation failed for project {}", projectId, exception);
            return new GraphSyncResponse(projectId, 0, 0, Instant.now(), false,
                synchronizationFailure(exception));
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void afterProjectGraphChange(ProjectGraphChangedEvent event) {
        try {
            projects.findById(event.projectId()).filter(project -> !project.isSoftDeleted())
                .ifPresentOrElse(project -> synchronize(data(project, project.getOrganization().getId())),
                    () -> deleteProjection(event.projectId()));
        } catch (RuntimeException exception) {
            log.warn("Neo4j synchronization failed for project {}", event.projectId(), exception);
        }
    }

    private void deleteProjection(UUID projectId) {
        neo4j.query("""
            MATCH (service:NervixService {projectId: $projectId})
            DETACH DELETE service
            """).bind(projectId.toString()).to("projectId").run();
        neo4j.query("MATCH (p:NervixProject {id: $projectId}) DETACH DELETE p")
            .bind(projectId.toString()).to("projectId").run();
    }

    private Instant synchronize(GraphData data) {
        UUID projectId = data.project().getId();
        ensureConstraints();
        neo4j.query("""
            MERGE (p:NervixProject {id: $id})
            SET p.name = $name, p.workspaceId = $workspaceId, p.status = $status,
                p.updatedAt = $updatedAt
            """)
            .bind(projectId.toString()).to("id")
            .bind(data.project().getName()).to("name")
            .bind(data.workspaceId().toString()).to("workspaceId")
            .bind(data.project().getStatus()).to("status")
            .bind(Instant.now().toString()).to("updatedAt").run();

        List<Map<String, Object>> nodeRows = data.services().stream().map(service -> {
            Map<String, Object> row = new HashMap<>();
            row.put("id", service.getId().toString());
            row.put("name", service.getName());
            row.put("type", service.getServiceType().name());
            row.put("health", service.getHealthStatus().name());
            row.put("lifecycle", service.getLifecycleStatus().name());
            row.put("version", service.getVersionLabel());
            row.put("technology", service.getTechnology() == null ? "" : service.getTechnology());
            return row;
        }).toList();
        neo4j.query("""
            MATCH (p:NervixProject {id: $projectId})
            UNWIND $rows AS row
            MERGE (s:NervixService {id: row.id})
            SET s.projectId = $projectId, s.name = row.name, s.serviceType = row.type,
                s.healthStatus = row.health, s.lifecycleStatus = row.lifecycle,
                s.versionLabel = row.version, s.technology = row.technology
            MERGE (p)-[:CONTAINS]->(s)
            """).bind(projectId.toString()).to("projectId").bind(nodeRows).to("rows").run();
        List<String> activeIds = data.services().stream().map(value -> value.getId().toString()).toList();
        neo4j.query("""
            MATCH (s:NervixService {projectId: $projectId})
            WHERE NOT s.id IN $activeIds
            DETACH DELETE s
            """).bind(projectId.toString()).to("projectId").bind(activeIds).to("activeIds").run();
        neo4j.query("""
            MATCH (:NervixService {projectId: $projectId})-[r:DEPENDS_ON]->()
            DELETE r
            """).bind(projectId.toString()).to("projectId").run();

        List<Map<String, Object>> edgeRows = data.dependencies().stream().map(dependency -> {
            Map<String, Object> row = new HashMap<>();
            row.put("id", dependency.getId().toString());
            row.put("sourceId", dependency.getSourceService().getId().toString());
            row.put("targetId", dependency.getTargetService().getId().toString());
            row.put("type", dependency.getDependencyType().name());
            row.put("criticality", dependency.getCriticality().name());
            row.put("protocol", dependency.getCommunicationProtocol().name());
            row.put("direction", dependency.getDirection().name());
            row.put("latencyMs", dependency.getLatencyMs() == null ? -1 : dependency.getLatencyMs());
            return row;
        }).toList();
        neo4j.query("""
            UNWIND $rows AS row
            MATCH (source:NervixService {id: row.sourceId, projectId: $projectId})
            MATCH (target:NervixService {id: row.targetId, projectId: $projectId})
            CREATE (source)-[:DEPENDS_ON {
                id: row.id, projectId: $projectId, dependencyType: row.type,
                criticality: row.criticality, communicationProtocol: row.protocol,
                direction: row.direction, latencyMs: row.latencyMs
            }]->(target)
            """).bind(projectId.toString()).to("projectId").bind(edgeRows).to("rows").run();
        return Instant.now();
    }

    private void ensureConstraints() {
        try {
            neo4j.query("CREATE CONSTRAINT nervix_project_id IF NOT EXISTS FOR (p:NervixProject) REQUIRE p.id IS UNIQUE").run();
            neo4j.query("CREATE CONSTRAINT nervix_service_id IF NOT EXISTS FOR (s:NervixService) REQUIRE s.id IS UNIQUE").run();
        } catch (RuntimeException exception) {
            // Projection remains functional for restricted Neo4j users that can
            // write graph data but are not permitted to manage schema objects.
            log.warn("Neo4j constraints could not be created; continuing graph synchronization", exception);
        }
    }

    private GraphData data(Project project, UUID workspaceId) {
        return new GraphData(project, workspaceId,
            services.findAllByProjectIdAndSoftDeletedFalseOrderByUpdatedAtDesc(project.getId()),
            dependencies.findAllByProjectIdAndSoftDeletedFalseOrderByUpdatedAtDesc(project.getId()));
    }

    private ProjectGraphResponse response(GraphData data, Instant synchronizedAt,
        boolean neo4jSynchronized, String synchronizationMessage) {
        Map<UUID, Long> outgoing = new HashMap<>(), incoming = new HashMap<>();
        data.dependencies().forEach(value -> {
            outgoing.merge(value.getSourceService().getId(), 1L, Long::sum);
            incoming.merge(value.getTargetService().getId(), 1L, Long::sum);
        });
        Map<UUID, Impact> impacts = dependencyImpacts(data.services(), data.dependencies());
        List<GraphNodeResponse> nodes = data.services().stream().map(value ->
            new GraphNodeResponse(value.getId(), value.getName(), value.getServiceType().name(),
                value.getHealthStatus().name(), value.getLifecycleStatus().name(), value.getVersionLabel(),
                value.getTechnology(), value.getOwner() == null ? null : value.getOwner().getDisplayName(),
                outgoing.getOrDefault(value.getId(), 0L).intValue(),
                incoming.getOrDefault(value.getId(), 0L).intValue(), value.getDescription(),
                value.getEndpointUrl(), value.getHealthResponseTimeMs(), value.getLastHealthCheckAt(),
                value.getHealthMessage(),
                impacts.containsKey(value.getId()) ? impacts.get(value.getId()).level() : "CLEAR",
                impacts.containsKey(value.getId()) ? impacts.get(value.getId()).depth() : 0,
                impacts.containsKey(value.getId()) ? impacts.get(value.getId()).sourceName() : null,
                value.getRuntimeMode().name(), value.getManagedPort(),
                value.getRuntimeHealthStatus().name())).toList();
        List<GraphEdgeResponse> edges = data.dependencies().stream().map(value ->
            new GraphEdgeResponse(value.getId(), value.getSourceService().getId(),
                value.getTargetService().getId(), value.getDependencyType().name(),
                value.getCriticality().name(), value.getCommunicationProtocol().name(),
                value.getDirection().name(), value.getLatencyMs())).toList();
        return new ProjectGraphResponse(data.project().getId(), data.project().getName(),
            nodes, edges, synchronizedAt, neo4jSynchronized, synchronizationMessage);
    }

    private Map<UUID, Impact> dependencyImpacts(List<ProjectServiceEntity> serviceList,
        List<ServiceDependency> dependencyList) {
        Map<UUID, ProjectServiceEntity> byId = new HashMap<>();
        serviceList.forEach(service -> byId.put(service.getId(), service));
        Map<UUID, List<UUID>> consumersByProvider = new HashMap<>();
        dependencyList.stream()
            .filter(dependency -> dependency.getCriticality().name().equals("HIGH")
                || dependency.getCriticality().name().equals("CRITICAL"))
            .forEach(dependency -> consumersByProvider
                .computeIfAbsent(dependency.getTargetService().getId(), ignored -> new ArrayList<>())
                .add(dependency.getSourceService().getId()));
        Map<UUID, Impact> impacts = new HashMap<>();
        ArrayDeque<ImpactQueueItem> queue = new ArrayDeque<>();
        serviceList.stream().filter(service -> service.getHealthStatus() == ServiceHealth.ERROR)
            .forEach(service -> queue.add(new ImpactQueueItem(service.getId(), service.getName(), 0)));
        while (!queue.isEmpty()) {
            ImpactQueueItem current = queue.removeFirst();
            for (UUID consumerId : consumersByProvider.getOrDefault(current.serviceId(), List.of())) {
                int depth = current.depth() + 1;
                Impact existing = impacts.get(consumerId);
                ProjectServiceEntity consumer = byId.get(consumerId);
                if (consumer == null || consumer.getHealthStatus() == ServiceHealth.ERROR
                    || (existing != null && existing.depth() <= depth)) continue;
                impacts.put(consumerId, new Impact(depth == 1 ? "DIRECT_AT_RISK" : "INDIRECT_AT_RISK",
                    depth, current.sourceName()));
                queue.add(new ImpactQueueItem(consumerId, current.sourceName(), depth));
            }
        }
        return impacts;
    }

    private String synchronizationFailure(RuntimeException exception) {
        Throwable cause = exception;
        while (cause.getCause() != null && cause.getCause() != cause) cause = cause.getCause();
        String detail = cause.getMessage();
        if (detail == null || detail.isBlank()) detail = exception.getClass().getSimpleName();
        if (detail.length() > 240) detail = detail.substring(0, 240) + "…";
        return "PostgreSQL graph loaded, but Neo4j synchronization failed: " + detail;
    }

    private Access access(Jwt jwt, UUID workspaceId, UUID projectId) {
        UUID subject;
        try { subject = UUID.fromString(jwt.getSubject()); }
        catch (RuntimeException exception) { throw new AccessDeniedException("Invalid authenticated subject"); }
        User user = users.findBySupabaseUserIdAndSoftDeletedFalse(subject)
            .orElseThrow(() -> new ResourceNotFoundException("User profile not found"));
        Project project = projects.findByIdAndOrganizationIdAndSoftDeletedFalse(projectId, workspaceId)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        ProjectMember member = members.findByProjectIdAndUserIdAndSoftDeletedFalse(projectId, user.getId())
            .orElseThrow(() -> new AccessDeniedException("Project membership required"));
        return new Access(project, member);
    }

    private record Access(Project project, ProjectMember member) {}
    private record Impact(String level, int depth, String sourceName) {}
    private record ImpactQueueItem(UUID serviceId, String sourceName, int depth) {}
    private record GraphData(Project project, UUID workspaceId, List<ProjectServiceEntity> services,
        List<ServiceDependency> dependencies) {}
}
