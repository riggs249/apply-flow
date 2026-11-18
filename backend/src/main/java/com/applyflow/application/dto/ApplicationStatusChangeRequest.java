package com.applyflow.application.dto;

import com.applyflow.application.entity.ApplicationStatus;
import com.applyflow.application.entity.ProcessStage;
import jakarta.validation.constraints.NotNull;

public record ApplicationStatusChangeRequest(
        @NotNull ApplicationStatus status,
        ProcessStage processStage
) {
}
