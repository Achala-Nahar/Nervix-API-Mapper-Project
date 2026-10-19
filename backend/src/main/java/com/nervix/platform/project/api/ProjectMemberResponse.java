package com.nervix.platform.project.api;
import com.nervix.platform.project.domain.ProjectRole;
import java.time.Instant;
import java.util.UUID;
public record ProjectMemberResponse(
    UUID userId, String email, String displayName, String avatarUrl,
    ProjectRole role, Instant joinedAt
) {}
