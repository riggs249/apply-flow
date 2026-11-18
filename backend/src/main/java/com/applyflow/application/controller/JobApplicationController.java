package com.applyflow.application.controller;

import com.applyflow.application.dto.*;
import com.applyflow.application.entity.*;
import com.applyflow.application.service.JobApplicationService;
import com.applyflow.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/applications")
public class JobApplicationController {
    private final JobApplicationService service;

    public JobApplicationController(JobApplicationService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<JobApplicationResponse> findAll(Authentication authentication,
                                                        @RequestParam(required = false) String query,
                                                        @RequestParam(required = false) ApplicationStatus status,
                                                        @RequestParam(required = false) EmploymentType employmentType,
                                                        @RequestParam(required = false) WorkArrangement workArrangement,
                                                        @RequestParam(required = false) LocalDate fromDate,
                                                        @RequestParam(required = false) LocalDate toDate,
                                                        @RequestParam(defaultValue = "0") int page,
                                                        @RequestParam(defaultValue = "20") int size,
                                                        @RequestParam(defaultValue = "appliedAt") String sortBy,
                                                        @RequestParam(defaultValue = "desc") String direction) {
        Sort.Direction sortDirection = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by(sortDirection, sortBy));
        return PageResponse.from(service.findAll(userId(authentication), query, status, employmentType, workArrangement,
                fromDate, toDate, pageable));
    }

    @GetMapping("/{applicationId}")
    public JobApplicationResponse findById(Authentication authentication, @PathVariable UUID applicationId) {
        return service.findById(userId(authentication), applicationId);
    }

    @PostMapping
    public ResponseEntity<JobApplicationResponse> create(Authentication authentication,
                                                          @Valid @RequestBody JobApplicationCreateRequest request) {
        JobApplicationResponse response = service.create(userId(authentication), request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(response.id()).toUri();
        return ResponseEntity.created(location).body(response);
    }

    @PutMapping("/{applicationId}")
    public JobApplicationResponse update(Authentication authentication, @PathVariable UUID applicationId,
                                         @Valid @RequestBody JobApplicationUpdateRequest request) {
        return service.update(userId(authentication), applicationId, request);
    }

    @PatchMapping("/{applicationId}/status")
    public JobApplicationResponse changeStatus(Authentication authentication,
                                               @PathVariable UUID applicationId,
                                               @Valid @RequestBody ApplicationStatusChangeRequest request) {
        return service.changeStatus(userId(authentication), applicationId, request.status(), request.processStage());
    }

    @GetMapping("/{applicationId}/activities")
    public java.util.List<ApplicationActivityResponse> findActivities(Authentication authentication,
                                                                        @PathVariable UUID applicationId) {
        return service.findActivities(userId(authentication), applicationId);
    }

    @DeleteMapping("/{applicationId}")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable UUID applicationId) {
        service.delete(userId(authentication), applicationId);
        return ResponseEntity.noContent().build();
    }

    private UUID userId(Authentication authentication) {
        return UUID.fromString(authentication.getName());
    }
}
