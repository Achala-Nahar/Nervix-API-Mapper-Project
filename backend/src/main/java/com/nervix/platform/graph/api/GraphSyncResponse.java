package com.nervix.platform.graph.api;

import java.time.Instant;
import java.util.UUID;

public record GraphSyncResponse(
    UUID projectId, int nodesSynchronized, int relationshipsSynchronized, Instant synchronizedAt,
    boolean synchronizedSuccessfully, String message
) {}
