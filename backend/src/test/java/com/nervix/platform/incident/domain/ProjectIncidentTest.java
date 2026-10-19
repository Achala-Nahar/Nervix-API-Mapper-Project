package com.nervix.platform.incident.domain;
import static org.assertj.core.api.Assertions.*;
import org.junit.jupiter.api.Test;

class ProjectIncidentTest {
 @Test void supportsCompleteLifecycle() {
  ProjectIncident incident=new ProjectIncident(null,null,"Database unavailable",null,
      IncidentSeverity.CRITICAL,IncidentCategory.OUTAGE,"monitor",null);
  assertThat(incident.getStatus()).isEqualTo(IncidentStatus.OPEN);
  incident.acknowledge(null);
  assertThat(incident.getStatus()).isEqualTo(IncidentStatus.ACKNOWLEDGED);
  assertThat(incident.getAcknowledgedAt()).isNotNull();
  incident.resolve("Connection restored");
  assertThat(incident.getStatus()).isEqualTo(IncidentStatus.RESOLVED);
  assertThat(incident.getResolutionNote()).isEqualTo("Connection restored");
  incident.reopen();
  assertThat(incident.getStatus()).isEqualTo(IncidentStatus.OPEN);
  assertThat(incident.getResolvedAt()).isNull();
 }
 @Test void cannotAcknowledgeResolvedIncident() {
  ProjectIncident incident=new ProjectIncident(null,null,"Failure",null,
      IncidentSeverity.HIGH,IncidentCategory.OTHER,null,null);
  incident.resolve(null);
  assertThatThrownBy(()->incident.acknowledge(null)).isInstanceOf(IllegalStateException.class);
 }
 @Test void resolvingOpenIncidentAutomaticallyAcknowledgesIt() {
  ProjectIncident incident=new ProjectIncident(null,null,"Failure",null,
      IncidentSeverity.HIGH,IncidentCategory.OUTAGE,null,null);
  incident.resolve("Recovered");
  assertThat(incident.getStatus()).isEqualTo(IncidentStatus.RESOLVED);
  assertThat(incident.getAcknowledgedAt()).isNotNull();
  assertThat(incident.getResolvedAt()).isNotNull();
 }
}

