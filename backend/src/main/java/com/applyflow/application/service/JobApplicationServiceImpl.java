package com.applyflow.application.service;

import com.applyflow.application.dto.JobApplicationCreateRequest;
import com.applyflow.application.dto.ApplicationActivityResponse;
import com.applyflow.application.dto.JobApplicationResponse;
import com.applyflow.application.dto.JobApplicationUpdateRequest;
import com.applyflow.application.entity.*;
import com.applyflow.application.mapper.JobApplicationMapper;
import com.applyflow.application.repository.ApplicationActivityRepository;
import com.applyflow.application.repository.JobApplicationRepository;
import com.applyflow.application.repository.ResumeRepository;
import com.applyflow.common.exception.ResourceNotFoundException;
import com.applyflow.company.entity.Company;
import com.applyflow.company.repository.CompanyRepository;
import com.applyflow.notification.NotificationDispatchService;
import com.applyflow.user.entity.User;
import com.applyflow.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class JobApplicationServiceImpl implements JobApplicationService {
    private static final Logger log = LoggerFactory.getLogger(JobApplicationServiceImpl.class);

    private final JobApplicationRepository applicationRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final JobApplicationMapper mapper;
    private final ApplicationActivityRepository activityRepository;
    private final NotificationDispatchService notificationDispatchService;

    public JobApplicationServiceImpl(JobApplicationRepository applicationRepository, CompanyRepository companyRepository,
                                     UserRepository userRepository, ResumeRepository resumeRepository,
                                     JobApplicationMapper mapper,
                                     ApplicationActivityRepository activityRepository,
                                     NotificationDispatchService notificationDispatchService) {
        this.applicationRepository = applicationRepository;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.resumeRepository = resumeRepository;
        this.mapper = mapper;
        this.activityRepository = activityRepository;
        this.notificationDispatchService = notificationDispatchService;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<JobApplicationResponse> findAll(UUID userId, String query, ApplicationStatus status,
                                                EmploymentType employmentType, WorkArrangement workArrangement,
                                                LocalDate fromDate, LocalDate toDate, Pageable pageable) {
        String normalizedQuery = normalize(query);
        boolean filterFrom = fromDate != null;
        boolean filterTo = toDate != null;
        LocalDate effectiveFrom = filterFrom ? fromDate : LocalDate.EPOCH;
        LocalDate effectiveTo = filterTo ? toDate : LocalDate.EPOCH;
        Page<JobApplication> applications = normalizedQuery == null
                ? applicationRepository.findAllOwned(userId, status, employmentType, workArrangement,
                        filterFrom, effectiveFrom, filterTo, effectiveTo, pageable)
                : applicationRepository.search(userId, normalizedQuery, status, employmentType,
                        workArrangement, filterFrom, effectiveFrom, filterTo, effectiveTo, pageable);
        return applications
                .map(mapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public JobApplicationResponse findById(UUID userId, UUID applicationId) {
        return mapper.toResponse(getOwnedApplication(userId, applicationId));
    }

    @Override
    public JobApplicationResponse create(UUID userId, JobApplicationCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        Company company = companyRepository.findById(request.companyId())
                .filter(item -> item.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + request.companyId()));
        ProcessStage processStage = normalizeProcessStage(request.status(), request.processStage());
        Resume resume = resolveResume(userId, request.resumeId());
        JobApplication application = new JobApplication(user, company, request.position().trim(), request.jobDescription(),
                request.jobPostingUrl(), request.location(), request.employmentType(), request.workArrangement(),
                request.status(), processStage, request.applicationDate(), request.salaryExpectation(), resume,
                request.personalNotes());
        JobApplication saved = applicationRepository.save(application);
        recordActivity(saved, "APPLICATION_CREATED", "Application added to " + describe(saved) + ".");
        return mapper.toResponse(saved);
    }

    @Override
    public JobApplicationResponse update(UUID userId, UUID applicationId, JobApplicationUpdateRequest request) {
        JobApplication application = getOwnedApplication(userId, applicationId);
        ApplicationStatus previousStatus = application.getStatus();
        ProcessStage previousStage = application.getProcessStage();
        ProcessStage processStage = normalizeProcessStage(request.status(), request.processStage());
        validateStatus(request.status());
        Resume resume = resolveResume(userId, request.resumeId());
        application.update(request.position().trim(), request.jobDescription(), request.jobPostingUrl(), request.location(),
                request.employmentType(), request.workArrangement(), request.status(), processStage, request.applicationDate(),
                request.salaryExpectation(), resume, request.personalNotes());
        recordStatusChange(application, previousStatus, previousStage, request.status(), processStage);
        notifyOutcomeIfChanged(application, previousStatus, request.status());
        return mapper.toResponse(application);
    }

    @Override
    public JobApplicationResponse changeStatus(UUID userId, UUID applicationId, ApplicationStatus status,
                                               ProcessStage processStage) {
        JobApplication application = getOwnedApplication(userId, applicationId);
        ApplicationStatus previousStatus = application.getStatus();
        ProcessStage previousStage = application.getProcessStage();
        ProcessStage normalizedStage = normalizeProcessStage(status, processStage);
        validateStatus(status);
        application.changeStatus(status, normalizedStage);
        recordStatusChange(application, previousStatus, previousStage, status, normalizedStage);
        notifyOutcomeIfChanged(application, previousStatus, status);
        return mapper.toResponse(application);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ApplicationActivityResponse> findActivities(UUID userId, UUID applicationId) {
        getOwnedApplication(userId, applicationId);
        return activityRepository.findOwnedByApplicationId(userId, applicationId).stream()
                .map(activity -> new ApplicationActivityResponse(
                        activity.getId(),
                        activity.getActivityType(),
                        activity.getDescription(),
                        activity.getOccurredAt()))
                .toList();
    }

    @Override
    public void delete(UUID userId, UUID applicationId) {
        applicationRepository.delete(getOwnedApplication(userId, applicationId));
    }

    private JobApplication getOwnedApplication(UUID userId, UUID applicationId) {
        return applicationRepository.findById(applicationId)
                .filter(item -> item.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Job application not found: " + applicationId));
    }

    private Resume resolveResume(UUID userId, UUID resumeId) {
        if (resumeId == null) {
            return null;
        }
        return resumeRepository.findByIdAndUserId(resumeId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume not found: " + resumeId));
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private ProcessStage normalizeProcessStage(ApplicationStatus status, ProcessStage processStage) {
        if (status == ApplicationStatus.IN_PROCESS) {
            if (processStage == null) {
                throw new IllegalArgumentException("A process stage is required when status is IN_PROCESS.");
            }
            return processStage;
        }
        return null;
    }

    private void recordStatusChange(JobApplication application, ApplicationStatus previousStatus,
                                    ProcessStage previousStage, ApplicationStatus newStatus, ProcessStage newStage) {
        if (previousStatus != newStatus || previousStage != newStage) {
            recordActivity(application, "STATUS_CHANGED",
                    "Status changed from " + describe(previousStatus, previousStage)
                            + " to " + describe(newStatus, newStage) + ".");
        }
    }

    private void notifyOutcomeIfChanged(JobApplication application, ApplicationStatus previousStatus,
                                        ApplicationStatus newStatus) {
        if (previousStatus == newStatus) {
            return;
        }
        if (newStatus != ApplicationStatus.HIRED && newStatus != ApplicationStatus.REJECTED) {
            return;
        }
        try {
            notificationDispatchService.sendApplicationOutcome(application.getUser(), application, newStatus);
        } catch (RuntimeException exception) {
            log.warn("Failed to email outcome for application {}: {}", application.getId(), exception.getMessage());
        }
    }

    private void recordActivity(JobApplication application, String activityType, String description) {
        activityRepository.save(new ApplicationActivity(application, activityType, description, Instant.now()));
    }

    private void validateStatus(ApplicationStatus status) {
        if (status == null) {
            throw new IllegalArgumentException("The next application status is required.");
        }
    }

    private String describe(JobApplication application) {
        return describe(application.getStatus(), application.getProcessStage());
    }

    private String describe(ApplicationStatus status, ProcessStage processStage) {
        if (status == ApplicationStatus.IN_PROCESS && processStage != null) {
            return status.name() + " (" + processStage.name() + ")";
        }
        return status.name();
    }
}
