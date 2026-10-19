package com.nervix.platform.service.api;

import com.nervix.platform.common.api.ApiResponse;
import com.nervix.platform.service.application.ProjectServiceManagementService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.*;
import org.slf4j.MDC;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/projects/{projectId}/services")
public class ProjectServiceController {
    private final ProjectServiceManagementService service;
    public ProjectServiceController(ProjectServiceManagementService service) { this.service = service; }

    @GetMapping
    public ApiResponse<List<ServiceResponse>> list(@AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID workspaceId, @PathVariable UUID projectId) {
        return ApiResponse.success(service.list(jwt, workspaceId, projectId),
            "Services retrieved", MDC.get("traceId"));
    }

    @GetMapping("/summary")
    public ApiResponse<ServiceSummaryResponse> summary(@AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID workspaceId, @PathVariable UUID projectId) {
        return ApiResponse.success(service.summary(jwt, workspaceId, projectId),
            "Service summary retrieved", MDC.get("traceId"));
    }

    @GetMapping("/{serviceId}")
    public ApiResponse<ServiceResponse> get(@AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID workspaceId, @PathVariable UUID projectId, @PathVariable UUID serviceId) {
        return ApiResponse.success(service.get(jwt, workspaceId, projectId, serviceId),
            "Service retrieved", MDC.get("traceId"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ServiceResponse>> create(@AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID workspaceId, @PathVariable UUID projectId,
        @Valid @RequestBody ServiceUpsertRequest request) {
        ServiceResponse created = service.create(jwt, workspaceId, projectId, request);
        URI location = URI.create("/api/v1/workspaces/" + workspaceId + "/projects/" + projectId
            + "/services/" + created.id());
        return ResponseEntity.created(location).body(
            ApiResponse.success(created, "Service created", MDC.get("traceId")));
    }

    @PutMapping("/{serviceId}")
    public ApiResponse<ServiceResponse> update(@AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID workspaceId, @PathVariable UUID projectId, @PathVariable UUID serviceId,
        @Valid @RequestBody ServiceUpsertRequest request) {
        return ApiResponse.success(service.update(jwt, workspaceId, projectId, serviceId, request),
            "Service updated", MDC.get("traceId"));
    }

    @DeleteMapping("/{serviceId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID workspaceId,
        @PathVariable UUID projectId, @PathVariable UUID serviceId) {
        service.delete(jwt, workspaceId, projectId, serviceId);
    }

    @PostMapping("/{serviceId}/runtime/stop")
    public ApiResponse<ServiceResponse> stopRuntime(@AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID workspaceId, @PathVariable UUID projectId, @PathVariable UUID serviceId) {
        return ApiResponse.success(service.stopRuntime(jwt, workspaceId, projectId, serviceId),
            "Managed runtime stopped", MDC.get("traceId"));
    }

    @PostMapping("/{serviceId}/runtime/restart")
    public ApiResponse<ServiceResponse> restartRuntime(@AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID workspaceId, @PathVariable UUID projectId, @PathVariable UUID serviceId) {
        return ApiResponse.success(service.restartRuntime(jwt, workspaceId, projectId, serviceId),
            "Managed runtime restarted", MDC.get("traceId"));
    }

    @PostMapping("/{serviceId}/runtime/degrade")
    public ApiResponse<ServiceResponse> degradeRuntime(@AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID workspaceId, @PathVariable UUID projectId, @PathVariable UUID serviceId) {
        return ApiResponse.success(service.degradeRuntime(jwt, workspaceId, projectId, serviceId),
            "Managed runtime response delay enabled", MDC.get("traceId"));
    }
}
