package com.applyflow.application.dto;

import com.applyflow.application.entity.AssessmentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public record AssessmentCreateRequest(
        @NotNull UUID applicationId,
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(max = 50) String assessmentType,
        @Size(max = 20_000) String instructions,
        Instant dueAt,
        @NotNull AssessmentStatus status,
        @Size(max = 5_000) String result,
        @Size(max = 5_000) String notes
) {}
