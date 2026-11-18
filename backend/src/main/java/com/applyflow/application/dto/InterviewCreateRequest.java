package com.applyflow.application.dto;

import com.applyflow.application.entity.InterviewOutcome;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public record InterviewCreateRequest(
        @NotNull UUID applicationId,
        @NotNull Instant scheduledAt,
        @NotBlank @Size(max = 50) String interviewType,
        @Size(max = 200) String interviewer,
        @Size(max = 255) String interviewerContact,
        @Size(max = 1_000) String locationOrMeetingUrl,
        @Size(max = 5_000) String preparationNotes,
        @Size(max = 5_000) String reflection,
        @NotNull InterviewOutcome outcome
) {}
