package com.nervix.platform.common.persistence;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseEntity {
    @Id @Column(nullable = false, updatable = false) private UUID id;
    @CreatedDate @Column(nullable = false, updatable = false) private Instant createdAt;
    @LastModifiedDate @Column(nullable = false) private Instant updatedAt;
    @CreatedBy @Column(updatable = false) private UUID createdBy;
    @LastModifiedBy private UUID updatedBy;
    @Version @Column(nullable = false) private long version;
    @Column(nullable = false) private boolean softDeleted;
    private Instant deletedAt;

    @PrePersist void assignId() { if (id == null) id = UUID.randomUUID(); }
    public void softDelete() { softDeleted = true; deletedAt = Instant.now(); }
    public void restore() { softDeleted = false; deletedAt = null; }
    public UUID getId() { return id; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public UUID getCreatedBy() { return createdBy; }
    public UUID getUpdatedBy() { return updatedBy; }
    public long getVersion() { return version; }
    public boolean isSoftDeleted() { return softDeleted; }
    public Instant getDeletedAt() { return deletedAt; }
}
