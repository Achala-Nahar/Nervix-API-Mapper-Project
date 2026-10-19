package com.nervix.platform.project.api;

import com.nervix.platform.common.api.ApiResponse;
import com.nervix.platform.project.application.ProjectTeamService;
import jakarta.validation.Valid;
import java.util.*;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/projects/{projectId}")
public class ProjectTeamController {
    private final ProjectTeamService service;
    public ProjectTeamController(ProjectTeamService service) { this.service = service; }

    @GetMapping("/team")
    public ApiResponse<ProjectTeamResponse> team(@AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID workspaceId, @PathVariable UUID projectId) {
        return ApiResponse.success(service.team(jwt, workspaceId, projectId),
            "Project team retrieved", MDC.get("traceId"));
    }

    @PutMapping("/members/{userId}/role")
    public ApiResponse<ProjectMemberResponse> changeRole(@AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID workspaceId, @PathVariable UUID projectId, @PathVariable UUID userId,
        @Valid @RequestBody ChangeProjectRoleRequest request) {
        return ApiResponse.success(service.changeRole(jwt, workspaceId, projectId, userId, request),
            "Project role updated", MDC.get("traceId"));
    }

    @DeleteMapping("/team/members/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID workspaceId,
        @PathVariable UUID projectId, @PathVariable UUID userId) {
        service.remove(jwt, workspaceId, projectId, userId);
    }

    @PostMapping("/invitations")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ProjectInvitationResponse> invite(@AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID workspaceId, @PathVariable UUID projectId,
        @Valid @RequestBody CreateProjectInvitationRequest request) {
        return ApiResponse.success(service.invite(jwt, workspaceId, projectId, request),
            "Project invitation created", MDC.get("traceId"));
    }

    @DeleteMapping("/invitations/{invitationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revoke(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID workspaceId,
        @PathVariable UUID projectId, @PathVariable UUID invitationId) {
        service.revoke(jwt, workspaceId, projectId, invitationId);
    }
}
