package com.applyflow.application.service;

import com.applyflow.application.entity.Reminder;
import com.applyflow.application.entity.ReminderStatus;
import com.applyflow.application.repository.ReminderRepository;
import com.applyflow.notification.NotificationDispatchService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Component
public class ReminderScheduler {
    private static final Logger log = LoggerFactory.getLogger(ReminderScheduler.class);

    private final ReminderRepository reminderRepository;
    private final NotificationDispatchService notificationDispatchService;

    public ReminderScheduler(
            ReminderRepository reminderRepository,
            NotificationDispatchService notificationDispatchService
    ) {
        this.reminderRepository = reminderRepository;
        this.notificationDispatchService = notificationDispatchService;
    }

    @Scheduled(fixedDelayString = "${app.reminders.process-rate-ms:300000}")
    @Transactional
    public void processOverdueReminders() {
        Instant now = Instant.now();
        for (Reminder reminder : reminderRepository.findPendingDue(ReminderStatus.PENDING, now)) {
            reminder.markOverdue();
            if (reminder.getEmailedAt() == null) {
                try {
                    notificationDispatchService.sendReminderDue(reminder);
                    reminder.markEmailed(now);
                } catch (RuntimeException exception) {
                    log.warn("Failed to email reminder {}: {}", reminder.getId(), exception.getMessage());
                }
            }
        }
    }
}
