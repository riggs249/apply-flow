package com.applyflow.notification;

import com.applyflow.application.entity.Assessment;
import com.applyflow.application.entity.AssessmentStatus;
import com.applyflow.application.entity.Interview;
import com.applyflow.application.entity.JobApplication;
import com.applyflow.application.entity.Reminder;
import com.applyflow.application.entity.ReminderStatus;
import com.applyflow.application.entity.ReminderType;
import com.applyflow.application.repository.AssessmentRepository;
import com.applyflow.application.repository.InterviewRepository;
import com.applyflow.application.repository.ReminderRepository;
import com.applyflow.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeadNotificationSchedulerTest {

    @Mock ReminderRepository reminderRepository;
    @Mock InterviewRepository interviewRepository;
    @Mock AssessmentRepository assessmentRepository;
    @Mock NotificationDispatchService notificationDispatchService;

    LeadNotificationScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new LeadNotificationScheduler(
                reminderRepository,
                interviewRepository,
                assessmentRepository,
                notificationDispatchService,
                new LeadNotificationProcessor()
        );
    }

    @Test
    void processesReminderInterviewAndAssessmentLeadEmails() {
        Instant now = Instant.now();
        User user = new User("demo@example.com", "hash", "Demo", true);

        Reminder reminder = new Reminder(user, null, "Follow up", null, ReminderType.CUSTOM,
                now.plus(30, ChronoUnit.MINUTES));
        when(reminderRepository.findNeedingLeadEmails(any(), any())).thenReturn(List.of(reminder));
        when(notificationDispatchService.sendReminderLead(eq(reminder), eq(LeadWindow.ONE_HOUR)))
                .thenReturn(true);

        JobApplication application = org.mockito.Mockito.mock(JobApplication.class);

        Interview interview = new Interview(application, now.plus(20, ChronoUnit.HOURS), "Phone",
                null, null, null, null, null, null);
        when(interviewRepository.findNeedingLeadEmails(any(), any())).thenReturn(List.of(interview));
        when(notificationDispatchService.sendInterviewLead(eq(interview), eq(LeadWindow.TWENTY_FOUR_HOURS)))
                .thenReturn(true);

        Assessment assessment = new Assessment(application, "Takehome", "Coding", null, null,
                now.minus(2, ChronoUnit.MINUTES), AssessmentStatus.NOT_STARTED, null, null);
        when(assessmentRepository.findNeedingLeadEmails(any(), any())).thenReturn(List.of(assessment));
        when(notificationDispatchService.sendAssessmentLead(eq(assessment), eq(LeadWindow.DUE)))
                .thenReturn(true);

        scheduler.processLeadEmails();

        verify(notificationDispatchService).sendReminderLead(reminder, LeadWindow.ONE_HOUR);
        verify(notificationDispatchService).sendInterviewLead(interview, LeadWindow.TWENTY_FOUR_HOURS);
        verify(notificationDispatchService).sendAssessmentLead(assessment, LeadWindow.DUE);
        assertThat(reminder.getEmailed1hAt()).isNotNull();
        assertThat(interview.leadEmails().getEmailed24hAt()).isNotNull();
        assertThat(assessment.leadEmails().getEmailedDueAt()).isNotNull();
        assertThat(reminder.getStatus()).isEqualTo(ReminderStatus.PENDING);
    }
}
