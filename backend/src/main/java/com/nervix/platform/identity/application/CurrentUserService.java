package com.nervix.platform.identity.application;

import com.nervix.platform.common.error.ResourceNotFoundException;
import com.nervix.platform.identity.api.*;
import com.nervix.platform.identity.domain.User;
import com.nervix.platform.identity.infrastructure.UserRepository;
import com.nervix.platform.organization.domain.*;
import com.nervix.platform.organization.infrastructure.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CurrentUserService {
    private final UserRepository users;
    private final OrganizationRepository organizations;
    private final OrganizationMemberRepository members;
    private final String defaultName;
    private final String defaultSlug;

    public CurrentUserService(
        UserRepository users,
        OrganizationRepository organizations,
        OrganizationMemberRepository members,
        @Value("${nervix.tenancy.default-organization-name}") String defaultName,
        @Value("${nervix.tenancy.default-organization-slug}") String defaultSlug
    ) {
        this.users = users;
        this.organizations = organizations;
        this.members = members;
        this.defaultName = defaultName;
        this.defaultSlug = defaultSlug;
    }

    @Transactional
    public UserProfileResponse getOrProvision(Jwt jwt) {
        UUID subject = authenticatedSubject(jwt);
        String email = requiredEmail(jwt).trim().toLowerCase(Locale.ROOT);

        User user = users.findBySupabaseUserIdAndSoftDeletedFalse(subject)
            .orElseGet(() -> users.findByEmailIgnoreCaseAndSoftDeletedFalse(email)
                .map(existing -> {
                    existing.relinkSupabaseIdentity(subject);
                    return existing;
                })
                .orElseGet(() -> users.save(new User(subject, email, displayName(jwt)))));

        user.markLogin();

        Organization workspace = organizations.findBySlugIgnoreCaseAndSoftDeletedFalse(defaultSlug)
            .orElseGet(() -> organizations.save(new Organization(defaultName, defaultSlug)));

        if (!members.existsByOrganizationIdAndUserIdAndSoftDeletedFalse(workspace.getId(), user.getId())) {
            OrganizationRole role = members.countByOrganizationIdAndSoftDeletedFalse(workspace.getId()) == 0
                ? OrganizationRole.OWNER
                : OrganizationRole.MEMBER;
            members.save(new OrganizationMember(workspace, user, role));
        }

        return response(user, workspace);
    }

    @Transactional
    public UserProfileResponse update(Jwt jwt, UpdateProfileRequest request) {
        User user = users.findBySupabaseUserIdAndSoftDeletedFalse(authenticatedSubject(jwt))
            .orElseThrow(() -> new ResourceNotFoundException("User profile not found"));
        user.updateProfile(request.displayName(), request.username(), request.avatarUrl(), request.timezone(), request.locale());
        Organization workspace = organizations.findBySlugIgnoreCaseAndSoftDeletedFalse(defaultSlug)
            .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        return response(user, workspace);
    }

    private UUID authenticatedSubject(Jwt jwt) {
        try {
            return UUID.fromString(jwt.getSubject());
        } catch (RuntimeException exception) {
            throw new IllegalArgumentException("Authenticated token has an invalid subject");
        }
    }

    private String requiredEmail(Jwt jwt) {
        String email = jwt.getClaimAsString("email");
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Verified token does not contain an email claim");
        }
        return email;
    }

    private String displayName(Jwt jwt) {
        Map<String, Object> metadata = jwt.getClaim("user_metadata");
        Object name = metadata == null ? null : metadata.get("full_name");
        return name == null || name.toString().isBlank()
            ? requiredEmail(jwt).split("@")[0]
            : name.toString();
    }

    private UserProfileResponse response(User user, Organization workspace) {
        return new UserProfileResponse(
            user.getId(),
            user.getEmail(),
            user.getDisplayName(),
            user.getUsername(),
            user.getAvatarUrl(),
            user.getTimezone(),
            user.getLocale(),
            user.getStatus().name(),
            user.getCreatedAt(),
            List.of(new UserProfileResponse.WorkspaceSummary(workspace.getId(), workspace.getName(), workspace.getSlug()))
        );
    }
}
