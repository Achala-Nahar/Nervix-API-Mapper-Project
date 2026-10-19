package com.nervix.platform.organization.infrastructure;
import com.nervix.platform.organization.domain.OrganizationMember;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface OrganizationMemberRepository extends JpaRepository<OrganizationMember,UUID>{
 boolean existsByOrganizationIdAndUserIdAndSoftDeletedFalse(UUID organizationId,UUID userId);
 Optional<OrganizationMember> findByOrganizationIdAndUserIdAndSoftDeletedFalse(UUID organizationId,UUID userId);
 long countByOrganizationIdAndSoftDeletedFalse(UUID organizationId);
}
