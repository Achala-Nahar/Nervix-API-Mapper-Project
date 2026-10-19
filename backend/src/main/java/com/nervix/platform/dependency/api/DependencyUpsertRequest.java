package com.nervix.platform.dependency.api;

import com.nervix.platform.dependency.domain.*;
import jakarta.validation.constraints.*;
import java.util.UUID;

public record DependencyUpsertRequest(
    @NotNull UUID sourceServiceId,
    @NotNull UUID targetServiceId,
    @NotNull DependencyType dependencyType,
    @NotNull DependencyCriticality criticality,
    @NotNull CommunicationProtocol communicationProtocol,
    @NotNull DependencyDirection direction,
    @PositiveOrZero Integer latencyMs,
    @Size(max = 2000) String description
) {}
