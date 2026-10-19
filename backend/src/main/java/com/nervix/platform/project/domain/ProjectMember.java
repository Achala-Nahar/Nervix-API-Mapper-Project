package com.nervix.platform.project.domain;
import com.nervix.platform.common.persistence.BaseEntity;
import com.nervix.platform.identity.domain.User;
import jakarta.persistence.*;
import java.time.Instant;
@Entity @Table(name="project_members", uniqueConstraints=@UniqueConstraint(columnNames={"project_id","user_id"}))
public class ProjectMember extends BaseEntity {
    @ManyToOne(fetch=FetchType.LAZY,optional=false) private Project project;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) private User user;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=30) private ProjectRole role;
    @Column(nullable=false) private Instant joinedAt;
    protected ProjectMember(){}
    public ProjectMember(Project project,User user,ProjectRole role){this.project=project;this.user=user;this.role=role;joinedAt=Instant.now();}
    public void changeRole(ProjectRole role){this.role=role;} public Project getProject(){return project;}
    public User getUser(){return user;} public ProjectRole getRole(){return role;} public Instant getJoinedAt(){return joinedAt;}
}
