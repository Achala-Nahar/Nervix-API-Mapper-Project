package com.nervix.platform.analytics.api;

import java.util.UUID;

public record ConnectedServiceMetric(
    UUID serviceId,
    String name,
    String health,
    long incoming,
    long outgoing,
    long total
) {}
