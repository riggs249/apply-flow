package com.applyflow.application.service;

import com.applyflow.application.dto.InterviewCreateRequest;
import com.applyflow.application.dto.InterviewResponse;
import com.applyflow.application.dto.InterviewUpdateRequest;

import java.util.List;
import java.util.UUID;

public interface InterviewService {
    List<InterviewResponse> findAll(UUID userId);
    List<InterviewResponse> findByApplicationId(UUID userId, UUID applicationId);
    InterviewResponse findById(UUID userId, UUID interviewId);
    InterviewResponse create(UUID userId, InterviewCreateRequest request);
    InterviewResponse update(UUID userId, UUID interviewId, InterviewUpdateRequest request);
    void delete(UUID userId, UUID interviewId);
}
