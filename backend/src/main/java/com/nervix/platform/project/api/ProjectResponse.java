package com.nervix.platform.project.api;
import com.nervix.platform.project.domain.*;
import java.time.Instant;
import java.util.*;
public record ProjectResponse(UUID id,UUID workspaceId,String name,String description,ProjectType projectType,
    ProjectVisibility visibility,String status,Set<String> tags,ProjectRole currentUserRole,
    long services,long dependencies,Instant createdAt,Instant updatedAt){}
