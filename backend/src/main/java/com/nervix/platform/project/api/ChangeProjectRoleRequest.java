package com.nervix.platform.project.api;

import com.nervix.platform.project.domain.ProjectRole;
import jakarta.validation.constraints.NotNull;

public record ChangeProjectRoleRequest(@NotNull ProjectRole role) {}
