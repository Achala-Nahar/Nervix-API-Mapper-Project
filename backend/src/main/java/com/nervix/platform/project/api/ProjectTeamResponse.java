package com.nervix.platform.project.api;

import com.nervix.platform.project.domain.ProjectRole;
import java.util.List;

public record ProjectTeamResponse(
    ProjectRole currentUserRole,
    List<ProjectMemberResponse> members,
    List<ProjectInvitationResponse> invitations
) {}
