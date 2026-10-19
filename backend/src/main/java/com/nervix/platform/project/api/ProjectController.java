package com.nervix.platform.project.api;

import com.nervix.platform.common.api.ApiResponse;
import com.nervix.platform.project.application.ProjectService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/projects")
public class ProjectController {
    private final ProjectService service;

    public ProjectController(ProjectService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<ProjectResponse>> list(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID workspaceId
    ) {
        return ApiResponse.success(
            service.list(jwt, workspaceId),
            "Projects retrieved",
            MDC.get("traceId")
        );
    }

    @GetMapping("/{projectId}")
    public ApiResponse<ProjectResponse> get(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID workspaceId,
        @PathVariable UUID projectId
    ) {
        return ApiResponse.success(
            service.get(jwt, workspaceId, projectId),
            "Project retrieved",
            MDC.get("traceId")
        );
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectResponse>> create(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID workspaceId,
        @Valid @RequestBody CreateProjectRequest request
    ) {
        ProjectResponse created = service.create(jwt, workspaceId, request);
        URI location = URI.create("/api/v1/workspaces/" + workspaceId + "/projects/" + created.id());
        return ResponseEntity.created(location).body(
            ApiResponse.success(created, "Project created", MDC.get("traceId"))
        );
    }

    @PutMapping("/{projectId}")
    public ApiResponse<ProjectResponse> update(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID workspaceId,
        @PathVariable UUID projectId,
        @Valid @RequestBody UpdateProjectRequest request
    ) {
        return ApiResponse.success(
            service.update(jwt, workspaceId, projectId, request),
            "Project updated",
            MDC.get("traceId")
        );
    }

    @DeleteMapping("/{projectId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID workspaceId,
        @PathVariable UUID projectId
    ) {
        service.delete(jwt, workspaceId, projectId);
    }

    @GetMapping("/{projectId}/members")
    public ApiResponse<List<ProjectMemberResponse>> members(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID workspaceId,
        @PathVariable UUID projectId
    ) {
        return ApiResponse.success(
            service.members(jwt, workspaceId, projectId),
            "Project members retrieved",
            MDC.get("traceId")
        );
    }

    @PostMapping("/{projectId}/members")
    public ApiResponse<ProjectMemberResponse> addMember(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID workspaceId,
        @PathVariable UUID projectId,
        @Valid @RequestBody UpsertProjectMemberRequest request
    ) {
        return ApiResponse.success(
            service.addMember(jwt, workspaceId, projectId, request),
            "Project member added",
            MDC.get("traceId")
        );
    }

    @DeleteMapping("/{projectId}/members/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMember(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID workspaceId,
        @PathVariable UUID projectId,
        @PathVariable UUID userId
    ) {
        service.removeMember(jwt, workspaceId, projectId, userId);
    }
}
