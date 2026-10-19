package com.nervix.platform.identity.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import com.nervix.platform.identity.domain.User;
import com.nervix.platform.identity.infrastructure.UserRepository;
import com.nervix.platform.organization.domain.Organization;
import com.nervix.platform.organization.infrastructure.*;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.util.ReflectionTestUtils;

class CurrentUserServiceTest {
    private final UserRepository users = mock(UserRepository.class);
    private final OrganizationRepository organizations = mock(OrganizationRepository.class);
    private final OrganizationMemberRepository members = mock(OrganizationMemberRepository.class);
    private final CurrentUserService service = new CurrentUserService(users, organizations, members, "Nervix Workspace", "default");

    @Test
    void relinksExistingEmailWhenSupabaseIdentityChanges() {
        UUID oldSubject = UUID.randomUUID();
        UUID newSubject = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID workspaceId = UUID.randomUUID();
        User existing = new User(oldSubject, "member@nervix.test", "Member");
        ReflectionTestUtils.setField(existing, "id", userId);
        Organization workspace = new Organization("Nervix Workspace", "default");
        ReflectionTestUtils.setField(workspace, "id", workspaceId);

        when(users.findBySupabaseUserIdAndSoftDeletedFalse(newSubject)).thenReturn(Optional.empty());
        when(users.findByEmailIgnoreCaseAndSoftDeletedFalse("member@nervix.test")).thenReturn(Optional.of(existing));
        when(organizations.findBySlugIgnoreCaseAndSoftDeletedFalse("default")).thenReturn(Optional.of(workspace));
        when(members.existsByOrganizationIdAndUserIdAndSoftDeletedFalse(workspaceId, userId)).thenReturn(true);

        var profile = service.getOrProvision(jwt(newSubject, "member@nervix.test"));

        assertThat(existing.getSupabaseUserId()).isEqualTo(newSubject);
        assertThat(profile.id()).isEqualTo(userId);
        verify(users, never()).save(any());
        verify(members, never()).save(any());
    }

    private Jwt jwt(UUID subject, String email) {
        return new Jwt(
            "token",
            Instant.now(),
            Instant.now().plusSeconds(3600),
            Map.of("alg", "ES256"),
            Map.of("sub", subject.toString(), "email", email, "user_metadata", Map.of("full_name", "Member"))
        );
    }
}
