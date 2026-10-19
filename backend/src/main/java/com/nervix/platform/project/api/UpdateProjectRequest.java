package com.nervix.platform.project.api;
import com.nervix.platform.project.domain.*;
import jakarta.validation.constraints.*;
import java.util.Set;
public record UpdateProjectRequest(
    @NotBlank @Size(max=150) String name,@Size(max=4000) String description,
    @NotNull ProjectType projectType,@NotNull ProjectVisibility visibility,
    @Size(max=20) Set<@NotBlank @Size(max=50) String> tags){}
