package com.applyflow.jobposting.service;

import java.math.BigDecimal;

record ParsedJobPosting(
        String companyName,
        String companyWebsite,
        String position,
        String jobDescription,
        String location,
        BigDecimal salaryExpectation
) {
}
