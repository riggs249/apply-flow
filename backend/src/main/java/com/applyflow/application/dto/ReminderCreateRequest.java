package com.applyflow.application.dto;

import com.applyflow.application.entity.ReminderType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public record ReminderCreateRequest(
        UUID applicationId,
        @NotBlank @Size(max = 200) String title,
        @Size(max = 5_000) String description,
        @NotNull ReminderType reminderType,
        @NotNull Instant remindAt
) {}
