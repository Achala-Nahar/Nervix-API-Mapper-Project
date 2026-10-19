package com.nervix.platform.common.api;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class TraceIdFilter extends OncePerRequestFilter {
    public static final String TRACE_ID = "traceId";
    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        String traceId = request.getHeader("X-Correlation-ID");
        if (traceId == null || traceId.isBlank() || traceId.length() > 100) traceId = UUID.randomUUID().toString();
        MDC.put(TRACE_ID, traceId); response.setHeader("X-Correlation-ID", traceId);
        try { chain.doFilter(request, response); } finally { MDC.remove(TRACE_ID); }
    }
}
