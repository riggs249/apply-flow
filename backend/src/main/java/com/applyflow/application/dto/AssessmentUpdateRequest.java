package com.applyflow.application.dto;

import com.applyflow.application.entity.AssessmentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record AssessmentUpdateRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(max = 50) String assessmentType,
        @Size(max = 20_000) String instructions,
        @Size(max = 1000) String linkUrl,
        Instant dueAt,
        @NotNull AssessmentStatus status,
        @Size(max = 5_000) String result,
        @Size(max = 5_000) String notes
) {}
