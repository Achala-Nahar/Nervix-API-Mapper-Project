package com.nervix.platform.graph.api;

import java.util.UUID;

public record GraphEdgeResponse(
    UUID id, UUID sourceServiceId, UUID targetServiceId, String dependencyType,
    String criticality, String communicationProtocol, String direction, Integer latencyMs
) {}
