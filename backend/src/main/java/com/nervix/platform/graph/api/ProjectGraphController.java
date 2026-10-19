package com.nervix.platform.graph.api;

import com.nervix.platform.common.api.ApiResponse;
import com.nervix.platform.graph.application.ProjectGraphService;
import java.time.Instant;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/projects/{projectId}/graph")
public class ProjectGraphController {
    private final ProjectGraphService service;
    public ProjectGraphController(ProjectGraphService service) { this.service = service; }

    @GetMapping
    public ApiResponse<ProjectGraphResponse> graph(@AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID workspaceId, @PathVariable UUID projectId) {
        return ApiResponse.success(service.graph(jwt, workspaceId, projectId),
            "Project graph retrieved", MDC.get("traceId"));
    }

    @PostMapping("/reconcile")
    public ApiResponse<GraphSyncResponse> reconcile(@AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID workspaceId, @PathVariable UUID projectId) {
        try {
            return ApiResponse.success(service.reconcile(jwt, workspaceId, projectId),
                "Project graph reconciled", MDC.get("traceId"));
        } catch (AccessDeniedException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            String detail = exception.getMessage() == null
                ? exception.getClass().getSimpleName() : exception.getMessage();
            GraphSyncResponse failed = new GraphSyncResponse(projectId, 0, 0, Instant.now(),
                false, "Reconciliation could not start: " + detail);
            return ApiResponse.success(failed, "Project graph reconciliation reported an error",
                MDC.get("traceId"));
        }
    }
}
