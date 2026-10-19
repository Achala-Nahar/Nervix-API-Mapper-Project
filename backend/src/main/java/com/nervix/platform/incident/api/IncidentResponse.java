package com.nervix.platform.incident.api;
import com.nervix.platform.incident.domain.*;
import java.time.Instant;
import java.util.UUID;
public record IncidentResponse(UUID id, UUID projectId, UUID serviceId, String serviceName,
    String title, String description, IncidentSeverity severity, IncidentCategory category,
    IncidentStatus status, String source, UUID assignedToUserId, String assignedToName,
    Instant acknowledgedAt, Instant resolvedAt, UUID resolvedByUserId, String resolvedByName,
    String resolutionNote, Instant createdAt, Instant updatedAt) {}

