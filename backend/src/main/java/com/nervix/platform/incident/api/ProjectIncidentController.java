package com.nervix.platform.incident.api;
import com.nervix.platform.common.api.ApiResponse;
import com.nervix.platform.incident.application.ProjectIncidentService;
import jakarta.validation.Valid;
import java.util.*;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/projects/{projectId}/incidents")
public class ProjectIncidentController {
 private final ProjectIncidentService service; public ProjectIncidentController(ProjectIncidentService service){this.service=service;}
 @GetMapping public ApiResponse<List<IncidentResponse>> list(@AuthenticationPrincipal Jwt jwt,@PathVariable UUID workspaceId,@PathVariable UUID projectId){
  return ApiResponse.success(service.list(jwt,workspaceId,projectId),"Project incidents retrieved",MDC.get("traceId"));}
 @GetMapping("/summary") public ApiResponse<IncidentSummaryResponse> summary(@AuthenticationPrincipal Jwt jwt,@PathVariable UUID workspaceId,@PathVariable UUID projectId){
  return ApiResponse.success(service.summary(jwt,workspaceId,projectId),"Incident summary retrieved",MDC.get("traceId"));}
 @PostMapping("/detect") public ApiResponse<Map<String,Integer>> detect(@AuthenticationPrincipal Jwt jwt,@PathVariable UUID workspaceId,@PathVariable UUID projectId){
  return ApiResponse.success(Map.of("changes",service.detectFromServiceHealth(jwt,workspaceId,projectId)),"Service health evaluated",MDC.get("traceId"));}
 @PostMapping @ResponseStatus(HttpStatus.CREATED) public ApiResponse<IncidentResponse> create(@AuthenticationPrincipal Jwt jwt,@PathVariable UUID workspaceId,@PathVariable UUID projectId,@Valid @RequestBody CreateIncidentRequest request){
  return ApiResponse.success(service.create(jwt,workspaceId,projectId,request),"Incident created",MDC.get("traceId"));}
 @PostMapping("/{id}/acknowledge") public ApiResponse<IncidentResponse> acknowledge(@AuthenticationPrincipal Jwt jwt,@PathVariable UUID workspaceId,@PathVariable UUID projectId,@PathVariable UUID id,@RequestBody(required=false) IncidentActionRequest request){
  return ApiResponse.success(service.acknowledge(jwt,workspaceId,projectId,id,request),"Incident acknowledged",MDC.get("traceId"));}
 @PostMapping("/{id}/resolve") public ApiResponse<IncidentResponse> resolve(@AuthenticationPrincipal Jwt jwt,@PathVariable UUID workspaceId,@PathVariable UUID projectId,@PathVariable UUID id,@RequestBody(required=false) IncidentActionRequest request){
  return ApiResponse.success(service.resolve(jwt,workspaceId,projectId,id,request),"Incident resolved",MDC.get("traceId"));}
 @PostMapping("/{id}/reopen") public ApiResponse<IncidentResponse> reopen(@AuthenticationPrincipal Jwt jwt,@PathVariable UUID workspaceId,@PathVariable UUID projectId,@PathVariable UUID id){
  return ApiResponse.success(service.reopen(jwt,workspaceId,projectId,id),"Incident reopened",MDC.get("traceId"));}
}

