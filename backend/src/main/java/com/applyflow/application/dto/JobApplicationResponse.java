package com.applyflow.application.dto;

import com.applyflow.application.entity.ApplicationStatus;
import com.applyflow.application.entity.EmploymentType;
import com.applyflow.application.entity.ProcessStage;
import com.applyflow.application.entity.WorkArrangement;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record JobApplicationResponse(
        UUID id,
        UUID companyId,
        String companyName,
        String position,
        String jobDescription,
        EmploymentType employmentType,
        WorkArrangement workArrangement,
        String location,
        BigDecimal salaryExpectation,
        LocalDate applicationDate,
        String jobPostingUrl,
        String resumeVersion,
        UUID resumeId,
        String resumeTitle,
        String resumeDescription,
        ApplicationStatus status,
        ProcessStage processStage,
        String personalNotes,
        Instant createdAt,
        Instant updatedAt
) {
}
