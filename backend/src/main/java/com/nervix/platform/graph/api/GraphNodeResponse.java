package com.nervix.platform.graph.api;

import java.util.UUID;
import java.time.Instant;

public record GraphNodeResponse(
    UUID id, String name, String serviceType, String healthStatus, String lifecycleStatus,
    String versionLabel, String technology, String ownerName, int dependencyCount,
    int dependentCount, String description, String endpointUrl,
    Long responseTimeMs, Instant lastHealthCheckAt, String healthMessage,
    String dependencyImpact, int impactDepth, String impactSourceName,
    String runtimeMode, Integer managedPort, String runtimeHealthStatus
) {}
