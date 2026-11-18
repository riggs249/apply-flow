package com.applyflow.application.service;

import com.applyflow.application.dto.*;
import com.applyflow.application.entity.Interview;
import com.applyflow.application.entity.JobApplication;
import com.applyflow.application.repository.InterviewRepository;
import com.applyflow.application.repository.JobApplicationRepository;
import com.applyflow.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class InterviewServiceImpl implements InterviewService {
    private final InterviewRepository interviewRepository;
    private final JobApplicationRepository applicationRepository;

    public InterviewServiceImpl(InterviewRepository interviewRepository, JobApplicationRepository applicationRepository) {
        this.interviewRepository = interviewRepository;
        this.applicationRepository = applicationRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<InterviewResponse> findAll(UUID userId) {
        return interviewRepository.findAllOwned(userId).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public InterviewResponse findById(UUID userId, UUID interviewId) {
        return toResponse(getOwned(userId, interviewId));
    }

    @Override
    public InterviewResponse create(UUID userId, InterviewCreateRequest request) {
        JobApplication application = getApplication(userId, request.applicationId());
        Interview interview = new Interview(application, request.scheduledAt(), request.interviewType().trim(),
                request.interviewer(), request.interviewerContact(), request.locationOrMeetingUrl(),
                request.preparationNotes(), request.reflection(), request.outcome());
        return toResponse(interviewRepository.save(interview));
    }

    @Override
    public InterviewResponse update(UUID userId, UUID interviewId, InterviewUpdateRequest request) {
        Interview interview = getOwned(userId, interviewId);
        interview.update(request.scheduledAt(), request.interviewType().trim(), request.interviewer(),
                request.interviewerContact(), request.locationOrMeetingUrl(), request.preparationNotes(),
                request.reflection(), request.outcome());
        return toResponse(interview);
    }

    @Override
    public void delete(UUID userId, UUID interviewId) {
        interviewRepository.delete(getOwned(userId, interviewId));
    }

    private JobApplication getApplication(UUID userId, UUID applicationId) {
        return applicationRepository.findById(applicationId)
                .filter(application -> application.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Job application not found: " + applicationId));
    }

    private Interview getOwned(UUID userId, UUID interviewId) {
        return interviewRepository.findOwned(userId, interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found: " + interviewId));
    }

    private InterviewResponse toResponse(Interview interview) {
        return new InterviewResponse(interview.getId(), interview.getApplication().getId(),
                interview.getApplication().getJobTitle(), interview.getApplication().getCompany().getName(),
                interview.getScheduledAt(), interview.getInterviewType(), interview.getInterviewer(),
                interview.getInterviewerContact(), interview.getLocationOrMeetingUrl(),
                interview.getPreparationNotes(), interview.getReflection(), interview.getOutcome(),
                interview.getCreatedAt(), interview.getUpdatedAt());
    }
}
