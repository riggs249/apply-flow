package com.applyflow.application.service;

import com.applyflow.application.entity.ReminderStatus;
import com.applyflow.application.repository.ReminderRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Component
public class ReminderScheduler {
    private final ReminderRepository reminderRepository;

    public ReminderScheduler(ReminderRepository reminderRepository) {
        this.reminderRepository = reminderRepository;
    }

    @Scheduled(fixedDelayString = "${app.reminders.process-rate-ms:300000}")
    @Transactional
    public void processOverdueReminders() {
        reminderRepository.findPendingDue(ReminderStatus.PENDING, Instant.now())
                .forEach(reminder -> reminder.markOverdue());
    }
}
