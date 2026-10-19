package com.nervix.platform.service.api;

import com.nervix.platform.service.domain.*;
import java.time.Instant;
import java.util.*;

public record ServiceResponse(
    UUID id, UUID projectId, String name, String description, ServiceType serviceType,
    String versionLabel, ServiceHealth healthStatus, ServiceLifecycle lifecycleStatus,
    String repositoryUrl, String endpointUrl, String technology, Set<String> tags,
    UUID ownerUserId, String ownerName, int dependencyCount, int dependentCount,
    Instant createdAt, Instant updatedAt, RuntimeMode runtimeMode, Integer managedPort
) {}
