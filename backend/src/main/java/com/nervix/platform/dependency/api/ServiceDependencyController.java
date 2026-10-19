package com.nervix.platform.dependency.api;

import com.nervix.platform.common.api.ApiResponse;
import com.nervix.platform.dependency.application.ServiceDependencyManagementService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.*;
import org.slf4j.MDC;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/projects/{projectId}/dependencies")
public class ServiceDependencyController {
    private final ServiceDependencyManagementService service;

    public ServiceDependencyController(ServiceDependencyManagementService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<DependencyResponse>> list(@AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID workspaceId, @PathVariable UUID projectId) {
        return ApiResponse.success(service.list(jwt, workspaceId, projectId),
            "Dependencies retrieved", MDC.get("traceId"));
    }

    @GetMapping("/summary")
    public ApiResponse<DependencySummaryResponse> summary(@AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID workspaceId, @PathVariable UUID projectId) {
        return ApiResponse.success(service.summary(jwt, workspaceId, projectId),
            "Dependency summary retrieved", MDC.get("traceId"));
    }

    @GetMapping("/{dependencyId}")
    public ApiResponse<DependencyResponse> get(@AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID workspaceId, @PathVariable UUID projectId,
        @PathVariable UUID dependencyId) {
        return ApiResponse.success(service.get(jwt, workspaceId, projectId, dependencyId),
            "Dependency retrieved", MDC.get("traceId"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DependencyResponse>> create(@AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID workspaceId, @PathVariable UUID projectId,
        @Valid @RequestBody DependencyUpsertRequest request) {
        DependencyResponse created = service.create(jwt, workspaceId, projectId, request);
        URI location = URI.create("/api/v1/workspaces/" + workspaceId + "/projects/" + projectId
            + "/dependencies/" + created.id());
        return ResponseEntity.created(location).body(
            ApiResponse.success(created, "Dependency created", MDC.get("traceId")));
    }

    @PutMapping("/{dependencyId}")
    public ApiResponse<DependencyResponse> update(@AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID workspaceId, @PathVariable UUID projectId,
        @PathVariable UUID dependencyId, @Valid @RequestBody DependencyUpsertRequest request) {
        return ApiResponse.success(service.update(jwt, workspaceId, projectId, dependencyId, request),
            "Dependency updated", MDC.get("traceId"));
    }

    @DeleteMapping("/{dependencyId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID workspaceId,
        @PathVariable UUID projectId, @PathVariable UUID dependencyId) {
        service.delete(jwt, workspaceId, projectId, dependencyId);
    }
}
