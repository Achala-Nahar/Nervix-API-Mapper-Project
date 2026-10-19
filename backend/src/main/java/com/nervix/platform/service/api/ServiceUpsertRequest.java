package com.nervix.platform.service.api;

import com.nervix.platform.service.domain.*;
import jakarta.validation.constraints.*;
import java.util.*;

public record ServiceUpsertRequest(
    @NotBlank @Size(max = 150) String name,
    @Size(max = 4000) String description,
    @NotNull ServiceType serviceType,
    @NotBlank @Size(max = 50) String versionLabel,
    @NotNull ServiceHealth healthStatus,
    @NotNull ServiceLifecycle lifecycleStatus,
    @Size(max = 2000) String repositoryUrl,
    @Size(max = 2000) String endpointUrl,
    @Size(max = 100) String technology,
    UUID ownerUserId,
    @Size(max = 20) Set<@NotBlank @Size(max = 50) String> tags
) {}
