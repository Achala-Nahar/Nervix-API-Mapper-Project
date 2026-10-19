package com.nervix.platform.organization.domain;
import com.nervix.platform.common.persistence.BaseEntity;import com.nervix.platform.identity.domain.User;import jakarta.persistence.*;import java.time.Instant;
@Entity @Table(name="organization_members",uniqueConstraints=@UniqueConstraint(columnNames={"organization_id","user_id"}))
public class OrganizationMember extends BaseEntity{
 @ManyToOne(fetch=FetchType.LAZY,optional=false)private Organization organization;@ManyToOne(fetch=FetchType.LAZY,optional=false)private User user;
 @Enumerated(EnumType.STRING)@Column(nullable=false)private OrganizationRole role;@Column(nullable=false)private String status="ACTIVE";@Column(nullable=false)private Instant joinedAt;
 protected OrganizationMember(){}public OrganizationMember(Organization o,User u,OrganizationRole r){organization=o;user=u;role=r;joinedAt=Instant.now();}
 public OrganizationRole getRole(){return role;}public String getStatus(){return status;}
}
