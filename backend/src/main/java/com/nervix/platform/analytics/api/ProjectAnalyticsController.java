package com.nervix.platform.analytics.api;

import com.nervix.platform.analytics.application.ProjectAnalyticsService;
import com.nervix.platform.common.api.ApiResponse;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/projects/{projectId}/analytics")
public class ProjectAnalyticsController {
    private final ProjectAnalyticsService service;

    public ProjectAnalyticsController(ProjectAnalyticsService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<ProjectAnalyticsResponse> get(@AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID workspaceId, @PathVariable UUID projectId,
        @RequestParam(defaultValue = "DAYS_30") String range) {
        return ApiResponse.success(service.get(jwt, workspaceId, projectId, range),
            "Project analytics retrieved", MDC.get("traceId"));
    }
}
