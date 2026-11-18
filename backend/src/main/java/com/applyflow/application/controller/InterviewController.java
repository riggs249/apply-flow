package com.applyflow.application.controller;

import com.applyflow.application.dto.*;
import com.applyflow.application.service.InterviewService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/interviews")
public class InterviewController {
    private final InterviewService service;

    public InterviewController(InterviewService service) {
        this.service = service;
    }

    @GetMapping
    public List<InterviewResponse> findAll(Authentication authentication) {
        return service.findAll(userId(authentication));
    }

    @GetMapping("/{interviewId}")
    public InterviewResponse findById(Authentication authentication, @PathVariable UUID interviewId) {
        return service.findById(userId(authentication), interviewId);
    }

    @PostMapping
    public ResponseEntity<InterviewResponse> create(Authentication authentication,
                                                     @Valid @RequestBody InterviewCreateRequest request) {
        InterviewResponse response = service.create(userId(authentication), request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}")
                .buildAndExpand(response.id()).toUri();
        return ResponseEntity.created(location).body(response);
    }

    @PutMapping("/{interviewId}")
    public InterviewResponse update(Authentication authentication, @PathVariable UUID interviewId,
                                    @Valid @RequestBody InterviewUpdateRequest request) {
        return service.update(userId(authentication), interviewId, request);
    }

    @DeleteMapping("/{interviewId}")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable UUID interviewId) {
        service.delete(userId(authentication), interviewId);
        return ResponseEntity.noContent().build();
    }

    private UUID userId(Authentication authentication) {
        return UUID.fromString(authentication.getName());
    }
}
