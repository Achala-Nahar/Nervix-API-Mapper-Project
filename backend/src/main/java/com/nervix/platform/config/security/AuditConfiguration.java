package com.nervix.platform.config.security;

import java.util.Optional;
import java.util.UUID;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@Configuration
public class AuditConfiguration {
    /**
     * Auditing must never query a JPA repository. Hibernate invokes this callback
     * while flushing entities; a repository query here starts another flush and
     * recursively invokes the callback until the request overflows its stack.
     *
     * Supabase access-token subjects are UUIDs, so the authenticated subject is a
     * stable audit identifier and can be recorded without touching persistence.
     */
    @Bean
    AuditorAware<UUID> auditorAware() {
        return () -> Optional.ofNullable(SecurityContextHolder.getContext().getAuthentication())
            .filter(Authentication::isAuthenticated)
            .map(Authentication::getName)
            .flatMap(AuditConfiguration::parseUuid);
    }

    private static Optional<UUID> parseUuid(String value) {
        try {
            return Optional.of(UUID.fromString(value));
        } catch (IllegalArgumentException exception) {
            return Optional.empty();
        }
    }
}
