package com.applyflow.application.dto;

import com.applyflow.application.entity.AssessmentStatus;

import java.time.Instant;
import java.util.UUID;

public record AssessmentResponse(
        UUID id,
        UUID applicationId,
        String position,
        String companyName,
        String title,
        String assessmentType,
        String instructions,
        String linkUrl,
        Instant dueAt,
        Instant completedAt,
        AssessmentStatus status,
        String result,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {}
