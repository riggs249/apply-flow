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
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.UUID;

@Component
public class LeadNotificationScheduler {

    private final ReminderRepository reminderRepository;
    private final InterviewRepository interviewRepository;
    private final AssessmentRepository assessmentRepository;
    private final NotificationDispatchService notificationDispatchService;
    private final LeadNotificationProcessor leadNotificationProcessor;
    private final TransactionTemplate transactionTemplate;

    public LeadNotificationScheduler(
            ReminderRepository reminderRepository,
            InterviewRepository interviewRepository,
            AssessmentRepository assessmentRepository,
            NotificationDispatchService notificationDispatchService,
            LeadNotificationProcessor leadNotificationProcessor,
            PlatformTransactionManager transactionManager
    ) {
        this.reminderRepository = reminderRepository;
        this.interviewRepository = interviewRepository;
        this.assessmentRepository = assessmentRepository;
        this.notificationDispatchService = notificationDispatchService;
        this.leadNotificationProcessor = leadNotificationProcessor;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    @Scheduled(fixedDelayString = "${app.notifications.lead-process-rate-ms:300000}")
    public void processLeadEmails() {
        Instant now = Instant.now();
        Instant horizon = LeadWindowEvaluator.horizonFrom(now);
        processReminders(now, horizon);
        processInterviews(now, horizon);
        processAssessments(now, horizon);
    }

    private void processReminders(Instant now, Instant horizon) {
        List<PreparedLead<Reminder>> batch = transactionTemplate.execute(status -> {
            List<PreparedLead<Reminder>> prepared = new ArrayList<>();
            for (Reminder reminder : reminderRepository.findNeedingLeadEmails(
                    EnumSet.of(ReminderStatus.PENDING, ReminderStatus.OVERDUE), horizon)) {
                reminder.getUser();
                if (reminder.getApplication() != null) {
                    reminder.getApplication().getCompany();
                }
                if (reminder.getStatus() == ReminderStatus.PENDING
                        && !reminder.getRemindAt().isAfter(now)) {
                    reminder.markOverdue();
                }
                List<LeadWindow> windows = leadNotificationProcessor.prepareWindows(
                        reminder.getRemindAt(), now, reminder.leadEmails());
                prepared.add(new PreparedLead<>(reminder.getId(), reminder, windows));
            }
            return prepared;
        });
        dispatchBatch(
                "reminder",
                batch,
                (entity, window) -> notificationDispatchService.sendReminderLead(entity, window),
                (id, window, markedAt) -> transactionTemplate.executeWithoutResult(status -> {
                    Reminder reminder = reminderRepository.findById(id).orElse(null);
                    if (reminder != null) {
                        reminder.leadEmails().mark(window, markedAt);
                    }
                })
        );
    }

    private void processInterviews(Instant now, Instant horizon) {
        List<PreparedLead<Interview>> batch = transactionTemplate.execute(status -> {
            List<PreparedLead<Interview>> prepared = new ArrayList<>();
            for (Interview interview : interviewRepository.findNeedingLeadEmails(
                    EnumSet.of(InterviewOutcome.PENDING), horizon)) {
                interview.getApplication().getUser();
                interview.getApplication().getCompany();
                List<LeadWindow> windows = leadNotificationProcessor.prepareWindows(
                        interview.getScheduledAt(), now, interview.leadEmails());
                prepared.add(new PreparedLead<>(interview.getId(), interview, windows));
            }
            return prepared;
        });
        dispatchBatch(
                "interview",
                batch,
                (entity, window) -> notificationDispatchService.sendInterviewLead(entity, window),
                (id, window, markedAt) -> transactionTemplate.executeWithoutResult(status -> {
                    Interview interview = interviewRepository.findById(id).orElse(null);
                    if (interview != null) {
                        interview.leadEmails().mark(window, markedAt);
                    }
                })
        );
    }

    private void processAssessments(Instant now, Instant horizon) {
        List<PreparedLead<Assessment>> batch = transactionTemplate.execute(status -> {
            List<PreparedLead<Assessment>> prepared = new ArrayList<>();
            for (Assessment assessment : assessmentRepository.findNeedingLeadEmails(
                    EnumSet.of(AssessmentStatus.NOT_STARTED, AssessmentStatus.IN_PROGRESS),
                    horizon)) {
                assessment.getApplication().getUser();
                assessment.getApplication().getCompany();
                List<LeadWindow> windows = leadNotificationProcessor.prepareWindows(
                        assessment.getDueAt(), now, assessment.leadEmails());
                prepared.add(new PreparedLead<>(assessment.getId(), assessment, windows));
            }
            return prepared;
        });
        dispatchBatch(
                "assessment",
                batch,
                (entity, window) -> notificationDispatchService.sendAssessmentLead(entity, window),
                (id, window, markedAt) -> transactionTemplate.executeWithoutResult(status -> {
                    Assessment assessment = assessmentRepository.findById(id).orElse(null);
                    if (assessment != null) {
                        assessment.leadEmails().mark(window, markedAt);
                    }
                })
        );
    }

    private <T> void dispatchBatch(
            String kind,
            List<PreparedLead<T>> batch,
            java.util.function.BiFunction<T, LeadWindow, Boolean> send,
            MarkCallback mark
    ) {
        if (batch == null || batch.isEmpty()) {
            return;
        }
        Instant markedAt = Instant.now();
        for (PreparedLead<T> prepared : batch) {
            if (prepared.windows().isEmpty() || prepared.id() == null) {
                continue;
            }
            for (LeadWindow window : prepared.windows()) {
                if (leadNotificationProcessor.sendWindow(
                        kind,
                        prepared.id(),
                        window,
                        w -> send.apply(prepared.entity(), w))) {
                    mark.accept(prepared.id(), window, markedAt);
                }
            }
        }
    }

    @FunctionalInterface
    private interface MarkCallback {
        void accept(UUID id, LeadWindow window, Instant markedAt);
    }

    private record PreparedLead<T>(UUID id, T entity, List<LeadWindow> windows) {
    }
}
