package com.nervix.platform.config.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

class AuditConfigurationTest {
    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void usesAuthenticatedSubjectWithoutQueryingPersistence() {
        UUID subject = UUID.randomUUID();
        SecurityContextHolder.getContext().setAuthentication(
            UsernamePasswordAuthenticationToken.authenticated(subject.toString(), "n/a", java.util.List.of())
        );

        AuditorAware<UUID> auditor = new AuditConfiguration().auditorAware();

        assertThat(auditor.getCurrentAuditor()).contains(subject);
    }

    @Test
    void ignoresNonUuidSubjects() {
        SecurityContextHolder.getContext().setAuthentication(
            UsernamePasswordAuthenticationToken.authenticated("anonymous", "n/a", java.util.List.of())
        );

        AuditorAware<UUID> auditor = new AuditConfiguration().auditorAware();

        assertThat(auditor.getCurrentAuditor()).isEmpty();
    }
}
