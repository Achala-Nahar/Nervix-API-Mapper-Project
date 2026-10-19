package com.nervix.platform.project.infrastructure;
import com.nervix.platform.project.domain.ProjectMember;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
public interface ProjectMemberRepository extends JpaRepository<ProjectMember,UUID> {
    Optional<ProjectMember> findByProjectIdAndUserIdAndSoftDeletedFalse(UUID projectId,UUID userId);
    Optional<ProjectMember> findByProjectIdAndUserId(UUID projectId,UUID userId);
    List<ProjectMember> findAllByProjectIdAndSoftDeletedFalseOrderByJoinedAtAsc(UUID projectId);
    @Query("select pm from ProjectMember pm join fetch pm.project p where pm.user.id=:userId and p.organization.id=:workspaceId and pm.softDeleted=false and p.softDeleted=false order by p.updatedAt desc")
    List<ProjectMember> findAccessibleProjects(@Param("workspaceId") UUID workspaceId,@Param("userId") UUID userId);
}
