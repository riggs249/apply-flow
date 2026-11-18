package com.applyflow.application.dto;

import com.applyflow.application.entity.ReminderStatus;
import com.applyflow.application.entity.ReminderType;

import java.time.Instant;
import java.util.UUID;

public record ReminderResponse(
        UUID id,
        UUID applicationId,
        String applicationPosition,
        String companyName,
        String title,
        String description,
        ReminderType reminderType,
        ReminderStatus status,
        Instant remindAt,
        Instant completedAt,
        String timingState,
        Instant createdAt,
        Instant updatedAt
) {}
