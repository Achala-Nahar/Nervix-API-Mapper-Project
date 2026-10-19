package com.nervix.platform.common.api;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(boolean success, T data, String message, Instant timestamp, String traceId) {
    public static <T> ApiResponse<T> success(T data, String message, String traceId) {
        return new ApiResponse<>(true, data, message, Instant.now(), traceId);
    }
    public static ApiResponse<Void> failure(String message, String traceId) {
        return new ApiResponse<>(false, null, message, Instant.now(), traceId);
    }
    public static <T> ApiResponse<T> failure(T details, String message, String traceId) {
        return new ApiResponse<>(false, details, message, Instant.now(), traceId);
    }
}
