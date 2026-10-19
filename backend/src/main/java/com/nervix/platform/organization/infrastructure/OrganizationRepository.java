package com.nervix.platform.organization.infrastructure;
import com.nervix.platform.organization.domain.Organization;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface OrganizationRepository extends JpaRepository<Organization,UUID> { Optional<Organization> findBySlugIgnoreCaseAndSoftDeletedFalse(String slug); }
