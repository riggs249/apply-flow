package com.applyflow.jobposting.controller;

import com.applyflow.jobposting.dto.JobPostingParseRequest;
import com.applyflow.jobposting.dto.JobPostingParseResponse;
import com.applyflow.jobposting.service.JobPostingParseService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@Validated
@RestController
@RequestMapping("/api/v1/job-postings")
public class JobPostingController {

    private final JobPostingParseService jobPostingParseService;

    public JobPostingController(JobPostingParseService jobPostingParseService) {
        this.jobPostingParseService = jobPostingParseService;
    }

    @PostMapping("/parse")
    public JobPostingParseResponse parse(
            Authentication authentication,
            @Valid @RequestBody JobPostingParseRequest request
    ) {
        return jobPostingParseService.parse(userId(authentication), request);
    }

    private UUID userId(Authentication authentication) {
        return UUID.fromString(authentication.getName());
    }
}
