package com.nervix.platform.project.infrastructure;

import com.nervix.platform.project.domain.*;
import java.time.Instant;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectInvitationRepository extends JpaRepository<ProjectInvitation, UUID> {
    List<ProjectInvitation> findAllByProjectIdAndSoftDeletedFalseOrderByCreatedAtDesc(UUID projectId);
    Optional<ProjectInvitation> findByIdAndProjectIdAndSoftDeletedFalse(UUID id, UUID projectId);
    Optional<ProjectInvitation> findByIdAndSoftDeletedFalse(UUID id);
    Optional<ProjectInvitation> findByProjectIdAndEmailIgnoreCaseAndStatusAndSoftDeletedFalse(
        UUID projectId, String email, ProjectInvitationStatus status);
    List<ProjectInvitation> findAllByEmailIgnoreCaseAndStatusAndSoftDeletedFalseOrderByCreatedAtAsc(
        String email, ProjectInvitationStatus status);
    boolean existsByProjectIdAndEmailIgnoreCaseAndStatusAndSoftDeletedFalse(
        UUID projectId, String email, ProjectInvitationStatus status);
}
