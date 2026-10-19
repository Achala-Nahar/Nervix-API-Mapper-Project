package com.nervix.platform.project.api;

import com.nervix.platform.project.domain.*;
import java.time.Instant;
import java.util.UUID;

public record ProjectInvitationResponse(
    UUID id, UUID projectId, UUID workspaceId, String projectName,
    String email, ProjectRole role, ProjectInvitationStatus status,
    String message, String invitedByName, Instant expiresAt, Instant createdAt
) {}
