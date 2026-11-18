package com.applyflow.application.service;

import com.applyflow.application.dto.ReminderCreateRequest;
import com.applyflow.application.entity.JobApplication;
import com.applyflow.application.entity.Reminder;
import com.applyflow.application.entity.ReminderType;
import com.applyflow.application.repository.JobApplicationRepository;
import com.applyflow.application.repository.ReminderRepository;
import com.applyflow.common.exception.ResourceNotFoundException;
import com.applyflow.user.entity.User;
import com.applyflow.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReminderServiceImplTest {
    @Mock ReminderRepository reminderRepository;
    @Mock JobApplicationRepository applicationRepository;
    @Mock UserRepository userRepository;
    @InjectMocks ReminderServiceImpl service;

    @Test
    void createRejectsApplicationOwnedByAnotherUser() {
        UUID ownerId = UUID.randomUUID();
        UUID attackerId = UUID.randomUUID();
        UUID applicationId = UUID.randomUUID();
        User owner = mock(User.class);
        when(owner.getId()).thenReturn(ownerId);
        User attacker = mock(User.class);
        when(userRepository.findById(attackerId)).thenReturn(Optional.of(attacker));
        JobApplication application = mock(JobApplication.class);
        when(application.getUser()).thenReturn(owner);
        when(applicationRepository.findById(applicationId)).thenReturn(Optional.of(application));
        ReminderCreateRequest request = new ReminderCreateRequest(applicationId, "Follow up",
                null, ReminderType.RECRUITER_FOLLOW_UP, Instant.now());

        assertThatThrownBy(() -> service.create(attackerId, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void completeMarksOwnedReminderCompleted() {
        UUID userId = UUID.randomUUID();
        UUID reminderId = UUID.randomUUID();
        Reminder reminder = mock(Reminder.class);
        when(reminder.getStatus()).thenReturn(com.applyflow.application.entity.ReminderStatus.COMPLETED);
        when(reminder.getRemindAt()).thenReturn(java.time.Instant.now());
        when(reminderRepository.findOwned(userId, reminderId)).thenReturn(Optional.of(reminder));

        service.complete(userId, reminderId);

        verify(reminder).complete();
    }

    @Test
    void findByIdRejectsUnknownReminder() {
        UUID userId = UUID.randomUUID();
        UUID reminderId = UUID.randomUUID();
        when(reminderRepository.findOwned(userId, reminderId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(userId, reminderId))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
