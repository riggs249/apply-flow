package com.applyflow.application.service;

import com.applyflow.application.dto.*;
import com.applyflow.application.entity.Assessment;
import com.applyflow.application.entity.JobApplication;
import com.applyflow.application.repository.AssessmentRepository;
import com.applyflow.application.repository.JobApplicationRepository;
import com.applyflow.common.exception.ResourceNotFoundException;
import com.applyflow.notification.NotificationDispatchService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class AssessmentServiceImpl implements AssessmentService {
    private static final Logger log = LoggerFactory.getLogger(AssessmentServiceImpl.class);

    private final AssessmentRepository assessmentRepository;
    private final JobApplicationRepository applicationRepository;
    private final NotificationDispatchService notificationDispatchService;

    public AssessmentServiceImpl(
            AssessmentRepository assessmentRepository,
            JobApplicationRepository applicationRepository,
            NotificationDispatchService notificationDispatchService
    ) {
        this.assessmentRepository = assessmentRepository;
        this.applicationRepository = applicationRepository;
        this.notificationDispatchService = notificationDispatchService;
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
                request.instructions(), normalizeLink(request.linkUrl()), request.dueAt(), request.status(),
                request.result(), request.notes());
        Assessment saved = assessmentRepository.save(assessment);
        try {
            notificationDispatchService.sendAssessmentAdded(application.getUser(), saved);
        } catch (RuntimeException exception) {
            log.warn("Failed to email assessment {}: {}", saved.getId(), exception.getMessage());
        }
        return toResponse(saved);
    }

    @Override
    public AssessmentResponse update(UUID userId, UUID assessmentId, AssessmentUpdateRequest request) {
        Assessment assessment = getOwned(userId, assessmentId);
        assessment.update(request.title().trim(), request.assessmentType().trim(), request.instructions(),
                normalizeLink(request.linkUrl()), request.dueAt(), request.status(), request.result(), request.notes());
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
                assessment.getLinkUrl(), assessment.getDueAt(), assessment.getCompletedAt(), assessment.getStatus(),
                assessment.getResult(), assessment.getNotes(), assessment.getCreatedAt(), assessment.getUpdatedAt());
    }

    private String normalizeLink(String linkUrl) {
        if (linkUrl == null || linkUrl.isBlank()) {
            return null;
        }
        return linkUrl.trim();
    }
}
