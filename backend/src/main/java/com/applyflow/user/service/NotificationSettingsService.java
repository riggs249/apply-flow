package com.applyflow.user.service;

import com.applyflow.common.exception.ResourceNotFoundException;
import com.applyflow.user.dto.NotificationSettingsResponse;
import com.applyflow.user.dto.NotificationSettingsUpdateRequest;
import com.applyflow.user.entity.User;
import com.applyflow.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
public class NotificationSettingsService {

    private final UserRepository userRepository;

    public NotificationSettingsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public NotificationSettingsResponse get(UUID userId) {
        return toResponse(requireUser(userId));
    }

    public NotificationSettingsResponse update(UUID userId, NotificationSettingsUpdateRequest request) {
        User user = requireUser(userId);
        user.updateNotificationSettings(
                request.reminderEmail(),
                request.interviewEmail(),
                request.assessmentEmail(),
                request.outcomeEmail()
        );
        return toResponse(user);
    }

    private User requireUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }

    private NotificationSettingsResponse toResponse(User user) {
        return new NotificationSettingsResponse(
                user.isNotifyReminderEmail(),
                user.isNotifyInterviewEmail(),
                user.isNotifyAssessmentEmail(),
                user.isNotifyOutcomeEmail()
        );
    }
}
