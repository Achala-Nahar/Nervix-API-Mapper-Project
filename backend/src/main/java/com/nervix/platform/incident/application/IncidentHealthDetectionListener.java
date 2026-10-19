package com.nervix.platform.incident.application;

import com.nervix.platform.graph.application.ProjectGraphChangedEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.*;

@Component
public class IncidentHealthDetectionListener {
    private final ProjectIncidentService incidents;
    public IncidentHealthDetectionListener(ProjectIncidentService incidents) { this.incidents = incidents; }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void serviceOrGraphChanged(ProjectGraphChangedEvent event) {
        incidents.detectProjectHealth(event.projectId());
    }
}

