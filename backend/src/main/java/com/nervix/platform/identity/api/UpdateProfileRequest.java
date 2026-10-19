package com.nervix.platform.identity.api;
import jakarta.validation.constraints.*;
public record UpdateProfileRequest(@NotBlank @Size(max=150) String displayName, @Pattern(regexp="^[A-Za-z0-9_.-]{3,50}$") String username, @Size(max=2048) String avatarUrl, @NotBlank @Size(max=100) String timezone, @NotBlank @Size(max=20) String locale) {}
