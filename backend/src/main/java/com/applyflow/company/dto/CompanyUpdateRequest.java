package com.applyflow.company.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CompanyUpdateRequest(
        @NotBlank @Size(max = 200) String name,
        @Size(max = 500) String website,
        @Size(max = 100) String industry,
        @Size(max = 150) String location,
        @Size(max = 5_000) String notes
) {
}
