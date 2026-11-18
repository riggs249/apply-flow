package com.applyflow.application.controller;

import com.applyflow.application.dto.*;
import com.applyflow.application.service.AssessmentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/assessments")
public class AssessmentController {
    private final AssessmentService service;

    public AssessmentController(AssessmentService service) {
        this.service = service;
    }

    @GetMapping
    public List<AssessmentResponse> findAll(Authentication authentication) {
        return service.findAll(userId(authentication));
    }

    @GetMapping("/{assessmentId}")
    public AssessmentResponse findById(Authentication authentication, @PathVariable UUID assessmentId) {
        return service.findById(userId(authentication), assessmentId);
    }

    @PostMapping
    public ResponseEntity<AssessmentResponse> create(Authentication authentication,
                                                      @Valid @RequestBody AssessmentCreateRequest request) {
        AssessmentResponse response = service.create(userId(authentication), request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}")
                .buildAndExpand(response.id()).toUri();
        return ResponseEntity.created(location).body(response);
    }

    @PutMapping("/{assessmentId}")
    public AssessmentResponse update(Authentication authentication, @PathVariable UUID assessmentId,
                                     @Valid @RequestBody AssessmentUpdateRequest request) {
        return service.update(userId(authentication), assessmentId, request);
    }

    @DeleteMapping("/{assessmentId}")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable UUID assessmentId) {
        service.delete(userId(authentication), assessmentId);
        return ResponseEntity.noContent().build();
    }

    private UUID userId(Authentication authentication) {
        return UUID.fromString(authentication.getName());
    }
}
