package com.nervix.platform.project.infrastructure;
import com.nervix.platform.project.domain.Project;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ProjectRepository extends JpaRepository<Project,UUID> {
    Optional<Project> findByIdAndOrganizationIdAndSoftDeletedFalse(UUID id,UUID organizationId);
    boolean existsByOrganizationIdAndNameIgnoreCaseAndSoftDeletedFalse(UUID organizationId,String name);
    boolean existsByOrganizationIdAndNameIgnoreCaseAndIdNotAndSoftDeletedFalse(UUID organizationId,String name,UUID id);
}
