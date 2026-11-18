package com.applyflow.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResumeUpdateRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 1_000) String description
) {
}
