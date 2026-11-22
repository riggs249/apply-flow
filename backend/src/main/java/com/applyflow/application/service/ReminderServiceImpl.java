package com.applyflow.application.service;

import com.applyflow.application.dto.ReminderCreateRequest;
import com.applyflow.application.dto.ReminderResponse;
import com.applyflow.application.dto.ReminderUpdateRequest;
import com.applyflow.application.entity.JobApplication;
import com.applyflow.application.entity.Reminder;
import com.applyflow.application.entity.ReminderStatus;
import com.applyflow.application.repository.JobApplicationRepository;
import com.applyflow.application.repository.ReminderRepository;
import com.applyflow.common.exception.ResourceNotFoundException;
import com.applyflow.user.entity.User;
import com.applyflow.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ReminderServiceImpl implements ReminderService {
    private final ReminderRepository reminderRepository;
    private final JobApplicationRepository applicationRepository;
    private final UserRepository userRepository;

    public ReminderServiceImpl(ReminderRepository reminderRepository,
                               JobApplicationRepository applicationRepository,
                               UserRepository userRepository) {
        this.reminderRepository = reminderRepository;
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReminderResponse> findAll(UUID userId) {
        return reminderRepository.findAllOwned(userId).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReminderResponse> findByApplicationId(UUID userId, UUID applicationId) {
        getApplication(userId, applicationId);
        return reminderRepository.findOwnedByApplicationId(userId, applicationId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ReminderResponse findById(UUID userId, UUID reminderId) {
        return toResponse(getOwned(userId, reminderId));
    }

    @Override
    public ReminderResponse create(UUID userId, ReminderCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        JobApplication application = getApplication(userId, request.applicationId());
        Reminder reminder = new Reminder(user, application, request.title().trim(), request.description(),
                request.reminderType(), request.remindAt());
        return toResponse(reminderRepository.save(reminder));
    }

    @Override
    public ReminderResponse update(UUID userId, UUID reminderId, ReminderUpdateRequest request) {
        Reminder reminder = getOwned(userId, reminderId);
        JobApplication application = getApplication(userId, request.applicationId());
        reminder.update(request.title().trim(), request.description(), request.reminderType(),
                request.remindAt(), application);
        reminder.reschedule(request.remindAt());
        return toResponse(reminder);
    }

    @Override
    public ReminderResponse complete(UUID userId, UUID reminderId) {
        Reminder reminder = getOwned(userId, reminderId);
        reminder.complete();
        return toResponse(reminder);
    }

    @Override
    public ReminderResponse reopen(UUID userId, UUID reminderId) {
        Reminder reminder = getOwned(userId, reminderId);
        reminder.reopen();
        reminder.reschedule(reminder.getRemindAt());
        return toResponse(reminder);
    }

    @Override
    public void delete(UUID userId, UUID reminderId) {
        reminderRepository.delete(getOwned(userId, reminderId));
    }

    private JobApplication getApplication(UUID userId, UUID applicationId) {
        if (applicationId == null) {
            return null;
        }
        return applicationRepository.findById(applicationId)
                .filter(application -> application.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Job application not found: " + applicationId));
    }

    private Reminder getOwned(UUID userId, UUID reminderId) {
        return reminderRepository.findOwned(userId, reminderId)
                .orElseThrow(() -> new ResourceNotFoundException("Reminder not found: " + reminderId));
    }

    private ReminderResponse toResponse(Reminder reminder) {
        Instant now = Instant.now();
        String timingState = reminder.getStatus() == ReminderStatus.COMPLETED ? "COMPLETED"
                : reminder.getStatus() == ReminderStatus.CANCELLED ? "CANCELLED"
                : reminder.getRemindAt().isBefore(now) ? "OVERDUE" : "UPCOMING";
        JobApplication application = reminder.getApplication();
        return new ReminderResponse(reminder.getId(),
                application == null ? null : application.getId(),
                application == null ? null : application.getJobTitle(),
                application == null ? null : application.getCompany().getName(),
                reminder.getTitle(), reminder.getDescription(), reminder.getReminderType(),
                reminder.getStatus(), reminder.getRemindAt(), reminder.getCompletedAt(),
                timingState, reminder.getCreatedAt(), reminder.getUpdatedAt());
    }
}
