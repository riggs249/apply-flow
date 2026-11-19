package com.applyflow.jobposting.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record JobPostingParseRequest(
        @NotBlank @Size(max = 1_000) String url
) {
}
