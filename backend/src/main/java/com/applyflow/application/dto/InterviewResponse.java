package com.applyflow.application.dto;

import com.applyflow.application.entity.InterviewOutcome;

import java.time.Instant;
import java.util.UUID;

public record InterviewResponse(
        UUID id,
        UUID applicationId,
        String position,
        String companyName,
        Instant scheduledAt,
        String interviewType,
        String interviewer,
        String interviewerContact,
        String locationOrMeetingUrl,
        String preparationNotes,
        String reflection,
        InterviewOutcome outcome,
        Instant createdAt,
        Instant updatedAt
) {}
