package com.nervix.platform.common.error;

import com.nervix.platform.common.api.ApiResponse;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    ResponseEntity<ApiResponse<Void>> notFound(ResourceNotFoundException exception) {
        return error(HttpStatus.NOT_FOUND, exception.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ApiResponse<Void>> forbidden() {
        return error(HttpStatus.FORBIDDEN, "Access denied");
    }

    @ExceptionHandler(ConflictException.class)
    ResponseEntity<ApiResponse<Void>> conflict(ConflictException exception) {
        return error(HttpStatus.CONFLICT, exception.getMessage());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ApiResponse<Void>> databaseConflict(DataIntegrityViolationException exception) {
        log.warn("Database constraint conflict; traceId={}", MDC.get("traceId"), exception);
        return error(HttpStatus.CONFLICT, "The requested data conflicts with an existing Nervix record");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<ApiResponse<Void>> badRequest(IllegalArgumentException exception) {
        return error(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiResponse<Map<String, String>>> invalid(MethodArgumentNotValidException exception) {
        var errors = exception.getBindingResult().getFieldErrors().stream()
            .collect(Collectors.toMap(error -> error.getField(), error -> error.getDefaultMessage(), (first, ignored) -> first));
        return ResponseEntity.badRequest().body(ApiResponse.failure(errors, "Validation failed", MDC.get("traceId")));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiResponse<Void>> unexpected(Exception exception) {
        log.error("Unhandled API exception; traceId={}", MDC.get("traceId"), exception);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred. Check backend logs using the trace ID.");
    }

    private ResponseEntity<ApiResponse<Void>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(ApiResponse.failure(message, MDC.get("traceId")));
    }
}
