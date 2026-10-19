package com.nervix.platform.incident.api;
import jakarta.validation.constraints.Size;
import java.util.UUID;
public record IncidentActionRequest(UUID assignedToUserId, @Size(max=5000) String resolutionNote) {}

