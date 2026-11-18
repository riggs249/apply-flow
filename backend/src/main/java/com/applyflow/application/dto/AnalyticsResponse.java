package com.applyflow.application.dto;

import java.util.List;

public record AnalyticsResponse(
        AnalyticsMetrics metrics,
        List<AnalyticsPoint> monthlyApplications,
        List<AnalyticsPoint> recruitmentStages,
        List<AnalyticsPoint> applicationOutcomes,
        List<InterviewConversionPoint> interviewConversion,
        List<AnalyticsPoint> employmentTypes
) {}
