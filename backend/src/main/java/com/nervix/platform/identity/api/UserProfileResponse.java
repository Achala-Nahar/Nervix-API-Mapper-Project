package com.nervix.platform.identity.api;
import java.time.Instant;
import java.util.*;
public record UserProfileResponse(UUID id,String email,String displayName,String username,String avatarUrl,String timezone,String locale,String status,Instant createdAt,List<WorkspaceSummary> workspaces) {
  public record WorkspaceSummary(UUID id,String name,String slug){}
}
