package com.applyflow.application.service;

import com.applyflow.application.dto.*;
import com.applyflow.application.entity.Assessment;
import com.applyflow.application.entity.JobApplication;
import com.applyflow.application.repository.AssessmentRepository;
import com.applyflow.application.repository.JobApplicationRepository;
import com.applyflow.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class AssessmentServiceImpl implements AssessmentService {
    private final AssessmentRepository assessmentRepository;
    private final JobApplicationRepository applicationRepository;

    public AssessmentServiceImpl(AssessmentRepository assessmentRepository, JobApplicationRepository applicationRepository) {
        this.assessmentRepository = assessmentRepository;
        this.applicationRepository = applicationRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssessmentResponse> findAll(UUID userId) {
        return assessmentRepository.findAllOwned(userId).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AssessmentResponse findById(UUID userId, UUID assessmentId) {
        return toResponse(getOwned(userId, assessmentId));
    }

    @Override
    public AssessmentResponse create(UUID userId, AssessmentCreateRequest request) {
        JobApplication application = getApplication(userId, request.applicationId());
        Assessment assessment = new Assessment(application, request.title().trim(), request.assessmentType().trim(),
                request.instructions(), request.dueAt(), request.status(), request.result(), request.notes());
        return toResponse(assessmentRepository.save(assessment));
    }

    @Override
    public AssessmentResponse update(UUID userId, UUID assessmentId, AssessmentUpdateRequest request) {
        Assessment assessment = getOwned(userId, assessmentId);
        assessment.update(request.title().trim(), request.assessmentType().trim(), request.instructions(),
                request.dueAt(), request.status(), request.result(), request.notes());
        return toResponse(assessment);
    }

    @Override
    public void delete(UUID userId, UUID assessmentId) {
        assessmentRepository.delete(getOwned(userId, assessmentId));
    }

    private JobApplication getApplication(UUID userId, UUID applicationId) {
        return applicationRepository.findById(applicationId)
                .filter(application -> application.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Job application not found: " + applicationId));
    }

    private Assessment getOwned(UUID userId, UUID assessmentId) {
        return assessmentRepository.findOwned(userId, assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment not found: " + assessmentId));
    }

    private AssessmentResponse toResponse(Assessment assessment) {
        return new AssessmentResponse(assessment.getId(), assessment.getApplication().getId(),
                assessment.getApplication().getJobTitle(), assessment.getApplication().getCompany().getName(),
                assessment.getTitle(), assessment.getAssessmentType(), assessment.getInstructions(),
                assessment.getDueAt(), assessment.getCompletedAt(), assessment.getStatus(),
                assessment.getResult(), assessment.getNotes(), assessment.getCreatedAt(), assessment.getUpdatedAt());
    }
}
