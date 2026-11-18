package com.applyflow.company.dto;

import java.time.Instant;
import java.util.UUID;

public record CompanyResponse(
        UUID id,
        String name,
        String website,
        String industry,
        String location,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
}
