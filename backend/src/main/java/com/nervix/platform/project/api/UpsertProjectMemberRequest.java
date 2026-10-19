package com.nervix.platform.project.api;
import com.nervix.platform.project.domain.ProjectRole;
import jakarta.validation.constraints.*;
public record UpsertProjectMemberRequest(@NotBlank @Email @Size(max=320) String email,@NotNull ProjectRole role){}
