package com.nervix.platform.incident.application;

import com.nervix.platform.common.error.*;
import com.nervix.platform.graph.application.ProjectGraphChangedEvent;
import com.nervix.platform.identity.domain.User;
import com.nervix.platform.identity.infrastructure.UserRepository;
import com.nervix.platform.incident.api.*;
import com.nervix.platform.incident.domain.*;
import com.nervix.platform.incident.infrastructure.ProjectIncidentRepository;
import com.nervix.platform.project.domain.*;
import com.nervix.platform.project.infrastructure.*;
import com.nervix.platform.service.domain.*;
import com.nervix.platform.service.infrastructure.ProjectServiceRepository;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProjectIncidentService {
    private final UserRepository users; private final ProjectRepository projects;
    private final ProjectMemberRepository members; private final ProjectServiceRepository services;
    private final ProjectIncidentRepository incidents; private final ApplicationEventPublisher events;
    public ProjectIncidentService(UserRepository users, ProjectRepository projects, ProjectMemberRepository members,
        ProjectServiceRepository services, ProjectIncidentRepository incidents, ApplicationEventPublisher events) {
        this.users=users; this.projects=projects; this.members=members; this.services=services;
        this.incidents=incidents; this.events=events;
    }

    @Transactional(readOnly=true)
    public List<IncidentResponse> list(Jwt jwt, UUID workspaceId, UUID projectId) {
        access(jwt,workspaceId,projectId);
        return incidents.findAllByProjectIdAndSoftDeletedFalseOrderByCreatedAtDesc(projectId).stream().map(this::response).toList();
    }
    @Transactional(readOnly=true)
    public IncidentSummaryResponse summary(Jwt jwt, UUID workspaceId, UUID projectId) {
        access(jwt,workspaceId,projectId);
        var values=incidents.findAllByProjectIdAndSoftDeletedFalseOrderByCreatedAtDesc(projectId);
        Map<String,Long> severity=Arrays.stream(IncidentSeverity.values()).collect(Collectors.toMap(Enum::name,
            value->values.stream().filter(i->i.getSeverity()==value).count(),(a,b)->a,LinkedHashMap::new));
        Map<String,Long> status=Arrays.stream(IncidentStatus.values()).collect(Collectors.toMap(Enum::name,
            value->values.stream().filter(i->i.getStatus()==value).count(),(a,b)->a,LinkedHashMap::new));
        long active=values.stream().filter(i->i.getStatus()!=IncidentStatus.RESOLVED).count();
        return new IncidentSummaryResponse(values.size(),active,values.size()-active,
            values.stream().filter(i->i.getStatus()==IncidentStatus.OPEN).count(),severity,status);
    }
    @Transactional
    public int detectFromServiceHealth(Jwt jwt, UUID workspaceId, UUID projectId) {
        access(jwt,workspaceId,projectId);
        return detectProjectHealthInternal(projectId);
    }
    @Transactional
    public int detectProjectHealth(UUID projectId) {
        return detectProjectHealthInternal(projectId);
    }
    private int detectProjectHealthInternal(UUID projectId) {
        List<ProjectIncident> existing=incidents.findAllByProjectIdAndSoftDeletedFalseOrderByCreatedAtDesc(projectId);
        int changes=0;
        for(ProjectServiceEntity service:services.findAllByProjectIdAndSoftDeletedFalseOrderByUpdatedAtDesc(projectId)){
            Optional<ProjectIncident> detected=existing.stream().filter(i->i.getService().getId().equals(service.getId())
                &&"SERVICE_HEALTH".equals(i.getSource())&&i.getStatus()!=IncidentStatus.RESOLVED).findFirst();
            ServiceHealth runtimeHealth=service.getRuntimeHealthStatus();
            if(runtimeHealth==ServiceHealth.ERROR||runtimeHealth==ServiceHealth.WARNING){
                if(detected.isEmpty()){
                    IncidentSeverity severity=runtimeHealth==ServiceHealth.ERROR?IncidentSeverity.HIGH:IncidentSeverity.MEDIUM;
                    incidents.save(new ProjectIncident(service.getProject(),service,
                        service.getName()+" health changed to "+runtimeHealth,
                        "Automatically detected from the service health state.",severity,
                        runtimeHealth==ServiceHealth.ERROR?IncidentCategory.OUTAGE:IncidentCategory.PERFORMANCE,
                        "SERVICE_HEALTH",null));changes++;
                }
            }else if(detected.isPresent()){
                detected.get().resolve("Automatically resolved after service health recovered.");changes++;
            }
            refreshHealth(service);
        }
        return changes;
    }
    @Transactional
    public IncidentResponse create(Jwt jwt,UUID workspaceId,UUID projectId,CreateIncidentRequest request) {
        Access access=editor(jwt,workspaceId,projectId);
        ProjectServiceEntity service=service(projectId,request.serviceId());
        User assignee=assignee(projectId,request.assignedToUserId());
        ProjectIncident created=incidents.save(new ProjectIncident(access.project,service,request.title(),
            request.description(),request.severity(),request.category(),request.source(),assignee));
        refreshHealth(service); events.publishEvent(new ProjectGraphChangedEvent(projectId)); return response(created);
    }
    @Transactional
    public IncidentResponse acknowledge(Jwt jwt,UUID workspaceId,UUID projectId,UUID incidentId,IncidentActionRequest request) {
        editor(jwt,workspaceId,projectId); ProjectIncident incident=incident(projectId,incidentId);
        try { incident.acknowledge(assignee(projectId,request==null?null:request.assignedToUserId())); }
        catch(IllegalStateException e){throw new ConflictException(e.getMessage());}
        return response(incident);
    }
    @Transactional
    public IncidentResponse resolve(Jwt jwt,UUID workspaceId,UUID projectId,UUID incidentId,IncidentActionRequest request) {
        Access access=editor(jwt,workspaceId,projectId); ProjectIncident incident=incident(projectId,incidentId);
        try { incident.resolve(request==null?null:request.resolutionNote(),access.user()); }
        catch(IllegalStateException e){throw new ConflictException(e.getMessage());}
        refreshHealth(incident.getService()); events.publishEvent(new ProjectGraphChangedEvent(projectId)); return response(incident);
    }
    @Transactional
    public IncidentResponse reopen(Jwt jwt,UUID workspaceId,UUID projectId,UUID incidentId) {
        editor(jwt,workspaceId,projectId); ProjectIncident incident=incident(projectId,incidentId);
        try { incident.reopen(); } catch(IllegalStateException e){throw new ConflictException(e.getMessage());}
        refreshHealth(incident.getService()); events.publishEvent(new ProjectGraphChangedEvent(projectId)); return response(incident);
    }
    private void refreshHealth(ProjectServiceEntity service) {
        var active=incidents.findAllByProjectIdAndSoftDeletedFalseOrderByCreatedAtDesc(service.getProject().getId()).stream()
            .filter(i->i.getService().getId().equals(service.getId())&&i.getStatus()!=IncidentStatus.RESOLVED).toList();
        ServiceHealth measured=service.getRuntimeHealthStatus();
        ServiceHealth health=active.stream().anyMatch(i->i.getSeverity()==IncidentSeverity.CRITICAL||i.getSeverity()==IncidentSeverity.HIGH)
            ? ServiceHealth.ERROR : active.isEmpty()?measured:
              measured==ServiceHealth.ERROR?ServiceHealth.ERROR:ServiceHealth.WARNING;
        service.updateHealthFromIncidents(health);
    }
    private Access editor(Jwt jwt,UUID workspaceId,UUID projectId){Access a=access(jwt,workspaceId,projectId);
        if(!a.member.getRole().canEdit())throw new AccessDeniedException("Insufficient project role");return a;}
    private Access access(Jwt jwt,UUID workspaceId,UUID projectId){User user=currentUser(jwt);
        Project project=projects.findByIdAndOrganizationIdAndSoftDeletedFalse(projectId,workspaceId).orElseThrow(()->new ResourceNotFoundException("Project not found"));
        ProjectMember member=members.findByProjectIdAndUserIdAndSoftDeletedFalse(projectId,user.getId()).orElseThrow(()->new AccessDeniedException("Project membership required"));
        return new Access(user,project,member);}
    private User currentUser(Jwt jwt){UUID subject;try{subject=UUID.fromString(jwt.getSubject());}catch(RuntimeException e){throw new AccessDeniedException("Invalid authenticated subject");}
        return users.findBySupabaseUserIdAndSoftDeletedFalse(subject).orElseThrow(()->new ResourceNotFoundException("User profile not found"));}
    private ProjectServiceEntity service(UUID projectId,UUID id){return services.findByIdAndProjectIdAndSoftDeletedFalse(id,projectId).orElseThrow(()->new ResourceNotFoundException("Service not found"));}
    private ProjectIncident incident(UUID projectId,UUID id){return incidents.findByIdAndProjectIdAndSoftDeletedFalse(id,projectId).orElseThrow(()->new ResourceNotFoundException("Incident not found"));}
    private User assignee(UUID projectId,UUID id){if(id==null)return null;members.findByProjectIdAndUserIdAndSoftDeletedFalse(projectId,id).orElseThrow(()->new IllegalArgumentException("Assignee must be a project member"));
        return users.findById(id).filter(u->!u.isSoftDeleted()).orElseThrow(()->new ResourceNotFoundException("Assignee not found"));}
    private IncidentResponse response(ProjectIncident i){User a=i.getAssignedTo();User r=i.getResolvedBy();return new IncidentResponse(i.getId(),i.getProject().getId(),i.getService().getId(),i.getService().getName(),
        i.getTitle(),i.getDescription(),i.getSeverity(),i.getCategory(),i.getStatus(),i.getSource(),a==null?null:a.getId(),a==null?null:a.getDisplayName(),
        i.getAcknowledgedAt(),i.getResolvedAt(),r==null?null:r.getId(),r==null?null:r.getDisplayName(),
        i.getResolutionNote(),i.getCreatedAt(),i.getUpdatedAt());}
    private record Access(User user,Project project,ProjectMember member){}
}
