package com.applyflow.user.dto;

public record NotificationSettingsResponse(
        boolean reminderEmail,
        boolean interviewEmail,
        boolean assessmentEmail,
        boolean outcomeEmail
) {
}
