package com.nervix.platform.analytics.api;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record ProjectAnalyticsResponse(
    UUID projectId,
    String range,
    Instant generatedAt,
    int healthScore,
    long totalServices,
    long totalDependencies,
    long incidentsInRange,
    long activeIncidents,
    long criticalDependencies,
    long averageLatencyMs,
    long isolatedServices,
    long singlePointsOfFailure,
    long unhealthyCriticalDependencies,
    Map<String, Long> healthDistribution,
    Map<String, Long> lifecycleDistribution,
    Map<String, Long> dependencyTypeDistribution,
    Map<String, Long> criticalityDistribution,
    Map<String, Long> incidentSeverityDistribution,
    Map<String, Long> incidentStatusDistribution,
    Map<String, Long> incidentCategoryDistribution,
    Map<String, Long> incidentTrend,
    List<ConnectedServiceMetric> topConnectedServices
) {}
