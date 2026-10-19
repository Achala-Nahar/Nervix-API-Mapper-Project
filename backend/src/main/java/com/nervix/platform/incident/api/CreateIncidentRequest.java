package com.nervix.platform.incident.api;
import com.nervix.platform.incident.domain.*;
import jakarta.validation.constraints.*;
import java.util.UUID;
public record CreateIncidentRequest(@NotNull UUID serviceId, @NotBlank @Size(max=180) String title,
    @Size(max=5000) String description, @NotNull IncidentSeverity severity,
    @NotNull IncidentCategory category, @Size(max=80) String source, UUID assignedToUserId) {}

