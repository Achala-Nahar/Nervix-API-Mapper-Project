package com.nervix.platform.project.application;

import com.nervix.platform.common.error.*;
import com.nervix.platform.identity.domain.User;
import com.nervix.platform.identity.infrastructure.UserRepository;
import com.nervix.platform.organization.domain.Organization;
import com.nervix.platform.organization.infrastructure.*;
import com.nervix.platform.project.api.*;
import com.nervix.platform.project.domain.*;
import com.nervix.platform.project.infrastructure.*;
import com.nervix.platform.service.infrastructure.ProjectServiceRepository;
import com.nervix.platform.dependency.infrastructure.ServiceDependencyRepository;
import com.nervix.platform.graph.application.ProjectGraphChangedEvent;
import java.util.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProjectService {
    private final UserRepository users; private final OrganizationRepository organizations;
    private final OrganizationMemberRepository workspaceMembers; private final ProjectRepository projects;
    private final ProjectMemberRepository projectMembers;
    private final ProjectServiceRepository services;
    private final ServiceDependencyRepository dependencies;
    private final ApplicationEventPublisher events;
    public ProjectService(UserRepository users,OrganizationRepository organizations,OrganizationMemberRepository workspaceMembers,
        ProjectRepository projects,ProjectMemberRepository projectMembers,ProjectServiceRepository services,
        ServiceDependencyRepository dependencies,ApplicationEventPublisher events){
        this.users=users;this.organizations=organizations;this.workspaceMembers=workspaceMembers;this.projects=projects;this.projectMembers=projectMembers;this.services=services;this.dependencies=dependencies;this.events=events;
    }
    @Transactional(readOnly=true) public List<ProjectResponse> list(Jwt jwt,UUID workspaceId){
        User user=currentUser(jwt);requireWorkspaceMember(workspaceId,user.getId());
        return projectMembers.findAccessibleProjects(workspaceId,user.getId()).stream().map(m->response(m.getProject(),m.getRole())).toList();
    }
    @Transactional(readOnly=true) public ProjectResponse get(Jwt jwt,UUID workspaceId,UUID projectId){
        User user=currentUser(jwt);Project project=project(workspaceId,projectId);
        ProjectMember member=requireProjectMember(project,user.getId());return response(project,member.getRole());
    }
    @Transactional public ProjectResponse create(Jwt jwt,UUID workspaceId,CreateProjectRequest request){
        User creator=currentUser(jwt);requireWorkspaceMember(workspaceId,creator.getId());
        if(projects.existsByOrganizationIdAndNameIgnoreCaseAndSoftDeletedFalse(workspaceId,request.name().trim()))
            throw new ConflictException("A project with this name already exists in the workspace");
        Organization workspace=organizations.findById(workspaceId).filter(o->!o.isSoftDeleted())
            .orElseThrow(()->new ResourceNotFoundException("Workspace not found"));
        Project project=projects.save(new Project(workspace,request.name(),request.description(),request.projectType(),
            request.visibility(),request.tags()==null?Set.of():request.tags()));
        projectMembers.save(new ProjectMember(project,creator,ProjectRole.OWNER));
        if(request.collaborators()!=null){
            Set<String> seen=new HashSet<>();
            for(var c:request.collaborators()){
                String email=c.email().trim().toLowerCase(Locale.ROOT);
                if(!seen.add(email)||creator.getEmail().equalsIgnoreCase(email))continue;
                User user=users.findByEmailIgnoreCaseAndSoftDeletedFalse(email)
                    .orElseThrow(()->new IllegalArgumentException("Collaborator must have a Nervix account: "+email));
                requireWorkspaceMember(workspaceId,user.getId());
                ProjectRole role=c.role()==ProjectRole.OWNER?ProjectRole.ADMIN:c.role();
                projectMembers.save(new ProjectMember(project,user,role));
            }
        }
        return response(project,ProjectRole.OWNER);
    }
    @Transactional public ProjectResponse update(Jwt jwt,UUID workspaceId,UUID projectId,UpdateProjectRequest request){
        User user=currentUser(jwt);Project project=project(workspaceId,projectId);ProjectMember member=requireProjectMember(project,user.getId());
        if(!member.getRole().canEdit())throw new AccessDeniedException("Insufficient project role");
        if(projects.existsByOrganizationIdAndNameIgnoreCaseAndIdNotAndSoftDeletedFalse(workspaceId,request.name().trim(),projectId))
            throw new ConflictException("A project with this name already exists in the workspace");
        project.update(request.name(),request.description(),request.projectType(),request.visibility(),request.tags());
        events.publishEvent(new ProjectGraphChangedEvent(projectId));
        return response(project,member.getRole());
    }
    @Transactional public void delete(Jwt jwt,UUID workspaceId,UUID projectId){
        User user=currentUser(jwt);Project project=project(workspaceId,projectId);ProjectMember member=requireProjectMember(project,user.getId());
        if(!member.getRole().canManage())throw new AccessDeniedException("Insufficient project role");project.softDelete();
        events.publishEvent(new ProjectGraphChangedEvent(projectId));
    }
    @Transactional(readOnly=true) public List<ProjectMemberResponse> members(Jwt jwt,UUID workspaceId,UUID projectId){
        User user=currentUser(jwt);Project project=project(workspaceId,projectId);requireProjectMember(project,user.getId());
        return projectMembers.findAllByProjectIdAndSoftDeletedFalseOrderByJoinedAtAsc(projectId).stream().map(this::memberResponse).toList();
    }
    @Transactional public ProjectMemberResponse addMember(Jwt jwt,UUID workspaceId,UUID projectId,UpsertProjectMemberRequest request){
        User actor=currentUser(jwt);Project project=project(workspaceId,projectId);requireManager(project,actor.getId());
        User target=users.findByEmailIgnoreCaseAndSoftDeletedFalse(request.email().trim()).orElseThrow(()->new ResourceNotFoundException("User not found"));
        requireWorkspaceMember(workspaceId,target.getId());
        if(request.role()==ProjectRole.OWNER)throw new IllegalArgumentException("Ownership transfer is not supported");
        ProjectMember member=projectMembers.findByProjectIdAndUserIdAndSoftDeletedFalse(projectId,target.getId())
            .map(existing->{existing.changeRole(request.role());return existing;})
            .orElseGet(()->projectMembers.findByProjectIdAndUserId(projectId,target.getId())
                .map(existing->{existing.restore();existing.changeRole(request.role());return existing;})
                .orElseGet(()->projectMembers.save(new ProjectMember(project,target,request.role()))));
        return memberResponse(member);
    }
    @Transactional public void removeMember(Jwt jwt,UUID workspaceId,UUID projectId,UUID userId){
        User actor=currentUser(jwt);Project project=project(workspaceId,projectId);requireManager(project,actor.getId());
        ProjectMember target=requireProjectMember(project,userId);
        if(target.getRole()==ProjectRole.OWNER)throw new IllegalArgumentException("The project owner cannot be removed");target.softDelete();
    }
    private User currentUser(Jwt jwt){
        UUID subject;try{subject=UUID.fromString(jwt.getSubject());}catch(IllegalArgumentException e){throw new AccessDeniedException("Invalid authenticated subject");}
        return users.findBySupabaseUserIdAndSoftDeletedFalse(subject).orElseThrow(()->new ResourceNotFoundException("User profile not found"));
    }
    private void requireWorkspaceMember(UUID workspaceId,UUID userId){
        var membership=workspaceMembers.findByOrganizationIdAndUserIdAndSoftDeletedFalse(workspaceId,userId)
            .orElseThrow(()->new AccessDeniedException("Workspace membership required"));
        if(!"ACTIVE".equals(membership.getStatus()))throw new AccessDeniedException("Workspace membership is inactive");
    }
    private Project project(UUID workspaceId,UUID projectId){return projects.findByIdAndOrganizationIdAndSoftDeletedFalse(projectId,workspaceId)
        .orElseThrow(()->new ResourceNotFoundException("Project not found"));}
    private ProjectMember requireProjectMember(Project project,UUID userId){return projectMembers.findByProjectIdAndUserIdAndSoftDeletedFalse(project.getId(),userId)
        .orElseThrow(()->new AccessDeniedException("Project membership required"));}
    private void requireManager(Project project,UUID userId){if(!requireProjectMember(project,userId).getRole().canManage())throw new AccessDeniedException("Insufficient project role");}
    private ProjectResponse response(Project p,ProjectRole role){return new ProjectResponse(p.getId(),p.getOrganization().getId(),p.getName(),p.getDescription(),
        p.getProjectType(),p.getVisibility(),p.getStatus(),p.getTags(),role,
        services.countByProjectIdAndSoftDeletedFalse(p.getId()),
        dependencies.countByProjectIdAndSoftDeletedFalse(p.getId()),p.getCreatedAt(),p.getUpdatedAt());}
    private ProjectMemberResponse memberResponse(ProjectMember m){return new ProjectMemberResponse(m.getUser().getId(),m.getUser().getEmail(),m.getUser().getDisplayName(),m.getUser().getAvatarUrl(),m.getRole(),m.getJoinedAt());}
}
