package com.applyflow.notification;

import com.applyflow.application.entity.Assessment;
import com.applyflow.application.entity.AssessmentStatus;
import com.applyflow.application.entity.Interview;
import com.applyflow.application.entity.InterviewOutcome;
import com.applyflow.application.entity.Reminder;
import com.applyflow.application.entity.ReminderStatus;
import com.applyflow.application.repository.AssessmentRepository;
import com.applyflow.application.repository.InterviewRepository;
import com.applyflow.application.repository.ReminderRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.EnumSet;
import java.util.List;

@Component
public class LeadNotificationScheduler {

    private final ReminderRepository reminderRepository;
    private final InterviewRepository interviewRepository;
    private final AssessmentRepository assessmentRepository;
    private final NotificationDispatchService notificationDispatchService;
    private final LeadNotificationProcessor leadNotificationProcessor;

    public LeadNotificationScheduler(
            ReminderRepository reminderRepository,
            InterviewRepository interviewRepository,
            AssessmentRepository assessmentRepository,
            NotificationDispatchService notificationDispatchService,
            LeadNotificationProcessor leadNotificationProcessor
    ) {
        this.reminderRepository = reminderRepository;
        this.interviewRepository = interviewRepository;
        this.assessmentRepository = assessmentRepository;
        this.notificationDispatchService = notificationDispatchService;
        this.leadNotificationProcessor = leadNotificationProcessor;
    }

    @Scheduled(fixedDelayString = "${app.notifications.lead-process-rate-ms:60000}")
    @Transactional
    public void processLeadEmails() {
        Instant now = Instant.now();
        Instant horizon = LeadWindowEvaluator.horizonFrom(now);
        processReminders(now, horizon);
        processInterviews(now, horizon);
        processAssessments(now, horizon);
    }

    private void processReminders(Instant now, Instant horizon) {
        List<Reminder> reminders = reminderRepository.findNeedingLeadEmails(
                EnumSet.of(ReminderStatus.PENDING, ReminderStatus.OVERDUE),
                horizon
        );
        for (Reminder reminder : reminders) {
            if (reminder.getStatus() == ReminderStatus.PENDING
                    && !reminder.getRemindAt().isAfter(now)) {
                reminder.markOverdue();
            }
            leadNotificationProcessor.process(
                    "reminder",
                    reminder.getId(),
                    reminder.getRemindAt(),
                    now,
                    reminder.leadEmails(),
                    window -> notificationDispatchService.sendReminderLead(reminder, window)
            );
        }
    }

    private void processInterviews(Instant now, Instant horizon) {
        // New interviews default to PENDING (not null), so include PENDING explicitly.
        for (Interview interview : interviewRepository.findNeedingLeadEmails(
                EnumSet.of(InterviewOutcome.PENDING),
                horizon
        )) {
            leadNotificationProcessor.process(
                    "interview",
                    interview.getId(),
                    interview.getScheduledAt(),
                    now,
                    interview.leadEmails(),
                    window -> notificationDispatchService.sendInterviewLead(interview, window)
            );
        }
    }

    private void processAssessments(Instant now, Instant horizon) {
        List<Assessment> assessments = assessmentRepository.findNeedingLeadEmails(
                EnumSet.of(AssessmentStatus.NOT_STARTED, AssessmentStatus.IN_PROGRESS),
                horizon
        );
        for (Assessment assessment : assessments) {
            leadNotificationProcessor.process(
                    "assessment",
                    assessment.getId(),
                    assessment.getDueAt(),
                    now,
                    assessment.leadEmails(),
                    window -> notificationDispatchService.sendAssessmentLead(assessment, window)
            );
        }
    }
}
