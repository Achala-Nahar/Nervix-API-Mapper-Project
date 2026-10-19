package com.nervix.platform.dependency.api;

import java.util.Map;

public record DependencySummaryResponse(
    long total, long critical, Map<String, Long> byType, Map<String, Long> byCriticality
) {}
