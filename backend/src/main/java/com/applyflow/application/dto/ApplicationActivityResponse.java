package com.applyflow.application.dto;

import java.time.Instant;
import java.util.UUID;

public record ApplicationActivityResponse(
        UUID id,
        String activityType,
        String description,
        Instant occurredAt
) {
}
