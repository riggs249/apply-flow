package com.applyflow.application.service;

import com.applyflow.application.entity.JobApplication;
import com.applyflow.application.entity.ApplicationStatus;
import com.applyflow.application.entity.ProcessStage;
import com.applyflow.application.mapper.JobApplicationMapper;
import com.applyflow.application.repository.ApplicationActivityRepository;
import com.applyflow.application.repository.JobApplicationRepository;
import com.applyflow.common.exception.ResourceNotFoundException;
import com.applyflow.company.repository.CompanyRepository;
import com.applyflow.user.entity.User;
import com.applyflow.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JobApplicationServiceImplTest {

    @Mock
    private JobApplicationRepository applicationRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JobApplicationMapper mapper;

    @Mock
    private ApplicationActivityRepository activityRepository;

    @InjectMocks
    private JobApplicationServiceImpl service;

    @Test
    void findByIdRejectsApplicationOwnedByAnotherUser() {
        UUID ownerId = UUID.randomUUID();
        UUID attackerId = UUID.randomUUID();
        UUID applicationId = UUID.randomUUID();
        User owner = mock(User.class);
        when(owner.getId()).thenReturn(ownerId);
        JobApplication application = mock(JobApplication.class);
        when(application.getUser()).thenReturn(owner);
        when(applicationRepository.findById(applicationId)).thenReturn(Optional.of(application));

        assertThatThrownBy(() -> service.findById(attackerId, applicationId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void changeStatusPersistsStatusTransitionActivity() {
        UUID userId = UUID.randomUUID();
        UUID applicationId = UUID.randomUUID();
        User user = mock(User.class);
        when(user.getId()).thenReturn(userId);
        JobApplication application = mock(JobApplication.class);
        when(application.getUser()).thenReturn(user);
        when(application.getStatus()).thenReturn(ApplicationStatus.APPLIED);
        when(application.getProcessStage()).thenReturn(null);
        when(applicationRepository.findById(applicationId)).thenReturn(Optional.of(application));

        service.changeStatus(userId, applicationId, ApplicationStatus.IN_PROCESS, ProcessStage.ASSESSMENT);

        verify(application).changeStatus(ApplicationStatus.IN_PROCESS, ProcessStage.ASSESSMENT);
        verify(activityRepository).save(org.mockito.ArgumentMatchers.argThat(activity ->
                "STATUS_CHANGED".equals(activity.getActivityType())
                        && activity.getDescription().contains("APPLIED")
                        && activity.getDescription().contains("IN_PROCESS")));
    }

    @Test
    void changeStatusRequiresProcessStageForInProcess() {
        UUID userId = UUID.randomUUID();
        UUID applicationId = UUID.randomUUID();
        User user = mock(User.class);
        when(user.getId()).thenReturn(userId);
        JobApplication application = mock(JobApplication.class);
        when(application.getUser()).thenReturn(user);
        when(application.getStatus()).thenReturn(ApplicationStatus.APPLIED);
        when(applicationRepository.findById(applicationId)).thenReturn(Optional.of(application));

        assertThatThrownBy(() -> service.changeStatus(userId, applicationId, ApplicationStatus.IN_PROCESS, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("process stage");
    }

    @Test
    void changeStatusAllowsMovingFromTerminalApplication() {
        UUID userId = UUID.randomUUID();
        UUID applicationId = UUID.randomUUID();
        User user = mock(User.class);
        when(user.getId()).thenReturn(userId);
        JobApplication application = mock(JobApplication.class);
        when(application.getUser()).thenReturn(user);
        when(application.getStatus()).thenReturn(ApplicationStatus.HIRED);
        when(application.getProcessStage()).thenReturn(null);
        when(applicationRepository.findById(applicationId)).thenReturn(Optional.of(application));

        service.changeStatus(userId, applicationId, ApplicationStatus.APPLIED, null);

        verify(application).changeStatus(ApplicationStatus.APPLIED, null);
    }

    @Test
    void findActivitiesRejectsApplicationOwnedByAnotherUser() {
        UUID ownerId = UUID.randomUUID();
        UUID attackerId = UUID.randomUUID();
        UUID applicationId = UUID.randomUUID();
        User owner = mock(User.class);
        when(owner.getId()).thenReturn(ownerId);
        JobApplication application = mock(JobApplication.class);
        when(application.getUser()).thenReturn(owner);
        when(applicationRepository.findById(applicationId)).thenReturn(Optional.of(application));

        assertThatThrownBy(() -> service.findActivities(attackerId, applicationId))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
