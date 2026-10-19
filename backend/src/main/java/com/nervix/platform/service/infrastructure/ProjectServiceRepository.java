package com.nervix.platform.service.infrastructure;

import com.nervix.platform.service.domain.ProjectServiceEntity;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

public interface ProjectServiceRepository extends JpaRepository<ProjectServiceEntity, UUID> {
    @EntityGraph(attributePaths = {"project", "project.organization", "owner"})
    List<ProjectServiceEntity> findAllByProjectIdAndSoftDeletedFalseOrderByUpdatedAtDesc(UUID projectId);
    Optional<ProjectServiceEntity> findByIdAndProjectIdAndSoftDeletedFalse(UUID id, UUID projectId);
    boolean existsByProjectIdAndNameIgnoreCaseAndSoftDeletedFalse(UUID projectId, String name);
    boolean existsByProjectIdAndNameIgnoreCaseAndIdNotAndSoftDeletedFalse(UUID projectId, String name, UUID id);
    long countByProjectIdAndSoftDeletedFalse(UUID projectId);
    @EntityGraph(attributePaths = {"project", "project.organization", "owner"})
    List<ProjectServiceEntity> findAllBySoftDeletedFalse();
}
