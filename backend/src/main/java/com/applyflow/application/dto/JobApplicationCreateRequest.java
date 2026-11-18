package com.applyflow.application.dto;

import com.applyflow.application.entity.ApplicationStatus;
import com.applyflow.application.entity.EmploymentType;
import com.applyflow.application.entity.ProcessStage;
import com.applyflow.application.entity.WorkArrangement;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record JobApplicationCreateRequest(
        @NotNull UUID companyId,
        @NotBlank @Size(max = 200) String position,
        @Size(max = 20_000) String jobDescription,
        @NotNull EmploymentType employmentType,
        WorkArrangement workArrangement,
        @Size(max = 150) String location,
        @DecimalMin(value = "0.0") BigDecimal salaryExpectation,
        LocalDate applicationDate,
        @Size(max = 1_000) String jobPostingUrl,
        UUID resumeId,
        @NotNull ApplicationStatus status,
        ProcessStage processStage,
        @Size(max = 5_000) String personalNotes
) {
}
