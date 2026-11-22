package com.applyflow.user.dto;

import jakarta.validation.constraints.NotNull;

public record NotificationSettingsUpdateRequest(
        @NotNull Boolean reminderEmail,
        @NotNull Boolean interviewEmail,
        @NotNull Boolean assessmentEmail,
        @NotNull Boolean outcomeEmail
) {
}
