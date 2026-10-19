package com.nervix.platform.project.application;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

import com.nervix.platform.identity.domain.User;
import com.nervix.platform.identity.infrastructure.UserRepository;
import com.nervix.platform.organization.domain.*;
import com.nervix.platform.organization.infrastructure.*;
import com.nervix.platform.project.api.UpdateProjectRequest;
import com.nervix.platform.project.domain.*;
import com.nervix.platform.project.infrastructure.*;
import com.nervix.platform.service.infrastructure.ProjectServiceRepository;
import com.nervix.platform.dependency.infrastructure.ServiceDependencyRepository;
import org.springframework.context.ApplicationEventPublisher;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.util.ReflectionTestUtils;

class ProjectServiceAuthorizationTest {
    private final UserRepository users=mock(UserRepository.class);
    private final OrganizationRepository organizations=mock(OrganizationRepository.class);
    private final OrganizationMemberRepository workspaceMembers=mock(OrganizationMemberRepository.class);
    private final ProjectRepository projects=mock(ProjectRepository.class);
    private final ProjectMemberRepository projectMembers=mock(ProjectMemberRepository.class);
    private final ProjectServiceRepository services=mock(ProjectServiceRepository.class);
    private final ServiceDependencyRepository dependencies=mock(ServiceDependencyRepository.class);
    private final ApplicationEventPublisher events=mock(ApplicationEventPublisher.class);
    private final ProjectService service=new ProjectService(users,organizations,workspaceMembers,projects,projectMembers,services,dependencies,events);
    private final UUID subject=UUID.randomUUID(),userId=UUID.randomUUID(),workspaceId=UUID.randomUUID(),projectId=UUID.randomUUID();
    private User user; private Project project;

    @BeforeEach void setUp(){
        user=new User(subject,"viewer@nervix.test","Viewer"); ReflectionTestUtils.setField(user,"id",userId);
        Organization workspace=new Organization("Workspace","workspace"); ReflectionTestUtils.setField(workspace,"id",workspaceId);
        project=new Project(workspace,"Project",null,ProjectType.MICROSERVICES,ProjectVisibility.PRIVATE,Set.of());
        ReflectionTestUtils.setField(project,"id",projectId);
        when(users.findBySupabaseUserIdAndSoftDeletedFalse(subject)).thenReturn(Optional.of(user));
        when(projects.findByIdAndOrganizationIdAndSoftDeletedFalse(projectId,workspaceId)).thenReturn(Optional.of(project));
    }

    @Test void workspaceOutsiderCannotListProjects(){
        when(workspaceMembers.findByOrganizationIdAndUserIdAndSoftDeletedFalse(workspaceId,userId)).thenReturn(Optional.empty());
        assertThatThrownBy(()->service.list(jwt(),workspaceId)).isInstanceOf(AccessDeniedException.class);
        verifyNoInteractions(projectMembers);
    }

    @Test void viewerCannotUpdateProject(){
        ProjectMember viewer=new ProjectMember(project,user,ProjectRole.VIEWER);
        when(projectMembers.findByProjectIdAndUserIdAndSoftDeletedFalse(projectId,userId)).thenReturn(Optional.of(viewer));
        var request=new UpdateProjectRequest("Changed",null,ProjectType.MONOLITH,ProjectVisibility.TEAM,Set.of());
        assertThatThrownBy(()->service.update(jwt(),workspaceId,projectId,request)).isInstanceOf(AccessDeniedException.class);
        verify(projects,never()).existsByOrganizationIdAndNameIgnoreCaseAndIdNotAndSoftDeletedFalse(any(),any(),any());
    }

    private Jwt jwt(){return new Jwt("token",Instant.now(),Instant.now().plusSeconds(60),Map.of("alg","none"),Map.of("sub",subject.toString()));}
}
