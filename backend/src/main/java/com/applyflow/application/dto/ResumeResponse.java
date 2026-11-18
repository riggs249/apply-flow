package com.applyflow.application.dto;

import java.time.Instant;
import java.util.UUID;

public record ResumeResponse(
        UUID id,
        String title,
        String description,
        String fileName,
        String contentType,
        long fileSize,
        Instant createdAt,
        Instant updatedAt
) {
}
