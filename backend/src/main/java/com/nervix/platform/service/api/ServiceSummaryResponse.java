package com.nervix.platform.service.api;

import java.util.Map;

public record ServiceSummaryResponse(
    long total, Map<String, Long> byHealth, Map<String, Long> byType
) {}
