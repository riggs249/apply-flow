package com.applyflow.application.service;

import com.applyflow.application.dto.AssessmentCreateRequest;
import com.applyflow.application.entity.AssessmentStatus;
import com.applyflow.application.entity.JobApplication;
import com.applyflow.application.repository.AssessmentRepository;
import com.applyflow.application.repository.JobApplicationRepository;
import com.applyflow.common.exception.ResourceNotFoundException;
import com.applyflow.user.entity.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AssessmentServiceImplTest {
    @Mock AssessmentRepository assessmentRepository;
    @Mock JobApplicationRepository applicationRepository;
    @InjectMocks AssessmentServiceImpl service;

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
        AssessmentCreateRequest request = new AssessmentCreateRequest(applicationId, "Take-home",
                "Coding", null, null, null, AssessmentStatus.NOT_STARTED, null, null);

        assertThatThrownBy(() -> service.create(attackerId, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void findByIdRejectsUnknownAssessment() {
        UUID userId = UUID.randomUUID();
        UUID assessmentId = UUID.randomUUID();
        when(assessmentRepository.findOwned(userId, assessmentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(userId, assessmentId))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
