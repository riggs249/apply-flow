package com.applyflow.application.dto;

public record InterviewConversionPoint(
        String label,
        long applications,
        long interviews,
        double conversionRate
) {}
