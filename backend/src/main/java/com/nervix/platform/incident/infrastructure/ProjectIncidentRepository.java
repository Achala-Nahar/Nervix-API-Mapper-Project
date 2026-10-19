package com.nervix.platform.incident.infrastructure;
import com.nervix.platform.incident.domain.*;
import java.util.*;
import org.springframework.data.jpa.repository.*;

public interface ProjectIncidentRepository extends JpaRepository<ProjectIncident, UUID> {
    @EntityGraph(attributePaths = {"project","service","assignedTo","resolvedBy"})
    List<ProjectIncident> findAllByProjectIdAndSoftDeletedFalseOrderByCreatedAtDesc(UUID projectId);
    @EntityGraph(attributePaths = {"project","service","assignedTo","resolvedBy"})
    Optional<ProjectIncident> findByIdAndProjectIdAndSoftDeletedFalse(UUID id, UUID projectId);
    long countByServiceIdAndStatusNotAndSoftDeletedFalse(UUID serviceId, IncidentStatus status);
}

