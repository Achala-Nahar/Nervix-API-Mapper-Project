package com.nervix.platform.incident.api;
import java.util.Map;
public record IncidentSummaryResponse(long total, long active, long resolved,
    long unacknowledged, Map<String,Long> bySeverity, Map<String,Long> byStatus) {}

