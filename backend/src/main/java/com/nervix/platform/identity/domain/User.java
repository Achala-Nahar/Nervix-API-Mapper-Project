package com.nervix.platform.identity.domain;

import com.nervix.platform.common.persistence.BaseEntity;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User extends BaseEntity {
    @Column(nullable = false, unique = true)
    private UUID supabaseUserId;
    @Column(nullable = false, unique = true)
    private String email;
    @Column(nullable = false)
    private String displayName;
    @Column(unique = true)
    private String username;
    private String avatarUrl;
    @Column(nullable = false)
    private String timezone = "UTC";
    @Column(nullable = false)
    private String locale = "en";
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status = UserStatus.ACTIVE;
    private Instant lastLoginAt;

    protected User() {}

    public User(UUID subject, String email, String displayName) {
        this.supabaseUserId = subject;
        this.email = email.trim().toLowerCase();
        this.displayName = displayName;
    }

    public void relinkSupabaseIdentity(UUID subject) {
        this.supabaseUserId = subject;
    }

    public void updateProfile(String displayName, String username, String avatarUrl, String timezone, String locale) {
        this.displayName = displayName;
        this.username = username;
        this.avatarUrl = avatarUrl;
        this.timezone = timezone;
        this.locale = locale;
    }

    public void markLogin() {
        lastLoginAt = Instant.now();
    }

    public UUID getSupabaseUserId() { return supabaseUserId; }
    public String getEmail() { return email; }
    public String getDisplayName() { return displayName; }
    public String getUsername() { return username; }
    public String getAvatarUrl() { return avatarUrl; }
    public String getTimezone() { return timezone; }
    public String getLocale() { return locale; }
    public UserStatus getStatus() { return status; }
    public Instant getLastLoginAt() { return lastLoginAt; }
}
