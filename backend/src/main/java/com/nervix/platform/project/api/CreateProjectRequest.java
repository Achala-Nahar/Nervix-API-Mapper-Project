package com.nervix.platform.project.api;
import com.nervix.platform.project.domain.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
public record CreateProjectRequest(
    @NotBlank @Size(max=150) String name, @Size(max=4000) String description,
    @NotNull ProjectType projectType, @NotNull ProjectVisibility visibility,
    @Size(max=20) Set<@NotBlank @Size(max=50) String> tags,
    @Size(max=50) List<@Valid CollaboratorRequest> collaborators) {
    public record CollaboratorRequest(@NotBlank @Email @Size(max=320) String email,@NotNull ProjectRole role){}
}
