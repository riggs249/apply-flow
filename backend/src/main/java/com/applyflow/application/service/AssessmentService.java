package com.applyflow.application.service;

import com.applyflow.application.dto.AssessmentCreateRequest;
import com.applyflow.application.dto.AssessmentResponse;
import com.applyflow.application.dto.AssessmentUpdateRequest;

import java.util.List;
import java.util.UUID;

public interface AssessmentService {
    List<AssessmentResponse> findAll(UUID userId);
    List<AssessmentResponse> findByApplicationId(UUID userId, UUID applicationId);
    AssessmentResponse findById(UUID userId, UUID assessmentId);
    AssessmentResponse create(UUID userId, AssessmentCreateRequest request);
    AssessmentResponse update(UUID userId, UUID assessmentId, AssessmentUpdateRequest request);
    void delete(UUID userId, UUID assessmentId);
}
