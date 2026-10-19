package com.nervix.platform.dependency.api;

import com.nervix.platform.dependency.domain.*;
import java.time.Instant;
import java.util.UUID;

public record DependencyResponse(
    UUID id, UUID projectId, UUID sourceServiceId, String sourceServiceName,
    UUID targetServiceId, String targetServiceName, DependencyType dependencyType,
    DependencyCriticality criticality, CommunicationProtocol communicationProtocol,
    DependencyDirection direction, Integer latencyMs, String description,
    Instant createdAt, Instant updatedAt
) {}
