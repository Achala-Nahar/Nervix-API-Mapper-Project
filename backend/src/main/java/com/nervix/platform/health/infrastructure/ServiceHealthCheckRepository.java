package com.nervix.platform.health.infrastructure;

import com.nervix.platform.health.domain.ServiceHealthCheck;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceHealthCheckRepository extends JpaRepository<ServiceHealthCheck, UUID> {
    List<ServiceHealthCheck> findTop20ByServiceIdOrderByCheckedAtDesc(UUID serviceId);
}
