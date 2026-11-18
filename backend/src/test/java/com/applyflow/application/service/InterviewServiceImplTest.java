package com.applyflow.application.service;

import com.applyflow.application.dto.InterviewCreateRequest;
import com.applyflow.application.entity.InterviewOutcome;
import com.applyflow.application.entity.JobApplication;
import com.applyflow.application.repository.InterviewRepository;
import com.applyflow.application.repository.JobApplicationRepository;
import com.applyflow.common.exception.ResourceNotFoundException;
import com.applyflow.user.entity.User;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InterviewServiceImplTest {
    @Mock InterviewRepository interviewRepository;
    @Mock JobApplicationRepository applicationRepository;
    @InjectMocks InterviewServiceImpl service;

    @Test
    void createRejectsApplicationOwnedByAnotherUser() {
        UUID ownerId = UUID.randomUUID();
        UUID attackerId = UUID.randomUUID();
        UUID applicationId = UUID.randomUUID();
        User owner = mock(User.class);
        when(owner.getId()).thenReturn(ownerId);
        JobApplication application = mock(JobApplication.class);
        when(application.getUser()).thenReturn(owner);
        when(applicationRepository.findById(applicationId)).thenReturn(Optional.of(application));
        InterviewCreateRequest request = new InterviewCreateRequest(applicationId, Instant.now(),
                "Technical", null, null, null, null, null, InterviewOutcome.PENDING);

        assertThatThrownBy(() -> service.create(attackerId, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void findByIdRejectsUnknownInterview() {
        UUID userId = UUID.randomUUID();
        UUID interviewId = UUID.randomUUID();
        when(interviewRepository.findOwned(userId, interviewId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(userId, interviewId))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
