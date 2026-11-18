package com.applyflow.application.service;

import com.applyflow.application.dto.AnalyticsResponse;

import java.time.LocalDate;
import java.util.UUID;

public interface AnalyticsService {
    AnalyticsResponse getDashboard(UUID userId, LocalDate fromDate, LocalDate toDate);
}
