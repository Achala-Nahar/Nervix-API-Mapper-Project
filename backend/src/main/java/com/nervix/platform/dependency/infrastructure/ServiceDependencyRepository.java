package com.nervix.platform.dependency.infrastructure;

import com.nervix.platform.dependency.domain.ServiceDependency;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.query.Param;

public interface ServiceDependencyRepository extends JpaRepository<ServiceDependency, UUID> {
    @EntityGraph(attributePaths = {"project", "sourceService", "targetService"})
    List<ServiceDependency> findAllByProjectIdAndSoftDeletedFalseOrderByUpdatedAtDesc(UUID projectId);
    Optional<ServiceDependency> findByIdAndProjectIdAndSoftDeletedFalse(UUID id, UUID projectId);
    boolean existsByProjectIdAndSourceServiceIdAndTargetServiceIdAndDependencyTypeAndSoftDeletedFalse(
        UUID projectId, UUID sourceId, UUID targetId,
        com.nervix.platform.dependency.domain.DependencyType type);
    boolean existsByProjectIdAndSourceServiceIdAndTargetServiceIdAndDependencyTypeAndIdNotAndSoftDeletedFalse(
        UUID projectId, UUID sourceId, UUID targetId,
        com.nervix.platform.dependency.domain.DependencyType type, UUID id);
    long countByProjectIdAndSoftDeletedFalse(UUID projectId);
    long countBySourceServiceIdAndSoftDeletedFalse(UUID serviceId);
    long countByTargetServiceIdAndSoftDeletedFalse(UUID serviceId);
    @Query("""
        select dependency from ServiceDependency dependency
        where dependency.project.id = :projectId and dependency.softDeleted = false
          and (dependency.sourceService.id = :serviceId or dependency.targetService.id = :serviceId)
        """)
    List<ServiceDependency> findConnected(@Param("projectId") UUID projectId,
        @Param("serviceId") UUID serviceId);

    interface RuntimeDependencyTarget {
        String getTargetName();
        String getEndpointUrl();
        String getCriticality();
    }

    @Query(value = """
        SELECT target.name AS targetName, target.endpoint_url AS endpointUrl,
               dependency.criticality AS criticality
        FROM service_dependencies dependency
        JOIN services target ON target.id = dependency.target_service_id
        WHERE dependency.source_service_id = :sourceId
          AND dependency.soft_deleted = false AND target.soft_deleted = false
        """, nativeQuery = true)
    List<RuntimeDependencyTarget> findRuntimeTargets(@Param("sourceId") UUID sourceId);
}
