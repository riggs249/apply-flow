package com.applyflow.application.dto;

public record AnalyticsMetrics(
        long totalApplications,
        long activeApplications,
        long interviewsScheduled,
        long offersReceived,
        long rejections,
        long pendingFollowUps,
        double applicationResponseRate,
        double interviewConversionRate
) {}
