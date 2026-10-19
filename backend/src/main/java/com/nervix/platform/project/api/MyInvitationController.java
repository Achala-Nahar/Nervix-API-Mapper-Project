package com.nervix.platform.project.api;

import com.nervix.platform.common.api.ApiResponse;
import com.nervix.platform.project.application.ProjectTeamService;
import java.util.List;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/invitations/me")
public class MyInvitationController {
    private final ProjectTeamService service;
    public MyInvitationController(ProjectTeamService service) { this.service = service; }

    @GetMapping
    public ApiResponse<List<ProjectInvitationResponse>> list(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.success(service.myInvitations(jwt),
            "Pending invitations retrieved", MDC.get("traceId"));
    }

    @PostMapping("/{invitationId}/accept")
    public ApiResponse<ProjectInvitationResponse> accept(@AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID invitationId) {
        return ApiResponse.success(service.respondToInvitation(jwt, invitationId, true),
            "Project invitation accepted", MDC.get("traceId"));
    }

    @PostMapping("/{invitationId}/reject")
    public ApiResponse<ProjectInvitationResponse> reject(@AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID invitationId) {
        return ApiResponse.success(service.respondToInvitation(jwt, invitationId, false),
            "Project invitation rejected", MDC.get("traceId"));
    }
}
