package com.nervix.platform.graph.api;

import java.time.Instant;
import java.util.*;

public record ProjectGraphResponse(
    UUID projectId, String projectName, List<GraphNodeResponse> nodes,
    List<GraphEdgeResponse> edges, Instant synchronizedAt,
    boolean neo4jSynchronized, String synchronizationMessage
) {}
