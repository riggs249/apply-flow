package com.applyflow.jobposting.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record JobPostingParseResponse(
        String jobPostingUrl,
        UUID companyId,
        String companyName,
        String companyWebsite,
        boolean companyMatched,
        String position,
        String jobDescription,
        String location,
        BigDecimal salaryExpectation,
        String message
) {
}
