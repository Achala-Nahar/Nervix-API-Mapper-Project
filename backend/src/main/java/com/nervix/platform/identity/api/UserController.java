package com.nervix.platform.identity.api;
import com.nervix.platform.common.api.ApiResponse;
import com.nervix.platform.identity.application.CurrentUserService;
import jakarta.validation.Valid;
import org.slf4j.MDC;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/users/me")
public class UserController {
 private final CurrentUserService service; public UserController(CurrentUserService service){this.service=service;}
 @GetMapping public ApiResponse<UserProfileResponse> me(@AuthenticationPrincipal Jwt jwt){return ApiResponse.success(service.getOrProvision(jwt),"Profile retrieved",MDC.get("traceId"));}
 @PatchMapping public ApiResponse<UserProfileResponse> update(@AuthenticationPrincipal Jwt jwt,@Valid @RequestBody UpdateProfileRequest request){return ApiResponse.success(service.update(jwt,request),"Profile updated",MDC.get("traceId"));}
}
