package com.nervix.platform.health.api;

import com.nervix.platform.common.api.ApiResponse;
import com.nervix.platform.graph.application.ProjectGraphService;
import com.nervix.platform.health.application.ServiceHealthMonitor;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/projects/{projectId}/health")
public class ServiceHealthController {
    private final ServiceHealthMonitor monitor;
    private final ProjectGraphService graph;

    public ServiceHealthController(ServiceHealthMonitor monitor, ProjectGraphService graph) {
        this.monitor = monitor;
        this.graph = graph;
    }

    @PostMapping("/check")
    public ApiResponse<ServiceHealthMonitor.HealthRunResult> check(
        @AuthenticationPrincipal Jwt jwt, @PathVariable UUID workspaceId,
        @PathVariable UUID projectId) {
        graph.graph(jwt, workspaceId, projectId);
        return ApiResponse.success(monitor.monitorProject(projectId),
            "Service health monitoring completed", MDC.get("traceId"));
    }
}
