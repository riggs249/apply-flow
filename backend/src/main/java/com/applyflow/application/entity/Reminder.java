package com.applyflow.application.entity;

import com.applyflow.common.persistence.BaseEntity;
import com.applyflow.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "reminders")
public class Reminder extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id")
    private JobApplication application;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "remind_at", nullable = false)
    private Instant remindAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ReminderStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "reminder_type", nullable = false, length = 30)
    private ReminderType reminderType;

    @Column(columnDefinition = "text")
    private String description;

    protected Reminder() {
    }

    public Reminder(User user, JobApplication application, String title, String description,
                    ReminderType reminderType, Instant remindAt) {
        this.user = user;
        this.application = application;
        this.title = title;
        this.description = description;
        this.reminderType = reminderType;
        this.remindAt = remindAt;
        this.status = ReminderStatus.PENDING;
    }

    public void update(String title, String description, ReminderType reminderType,
                       Instant remindAt, JobApplication application) {
        this.title = title;
        this.description = description;
        this.reminderType = reminderType;
        this.remindAt = remindAt;
        this.application = application;
    }

    public void complete() {
        this.status = ReminderStatus.COMPLETED;
        this.completedAt = Instant.now();
    }

    public void reopen() {
        this.status = ReminderStatus.PENDING;
        this.completedAt = null;
    }

    public void markOverdue() {
        if (this.status == ReminderStatus.PENDING) {
            this.status = ReminderStatus.OVERDUE;
        }
    }

    public void reschedule(Instant remindAt) {
        this.remindAt = remindAt;
        if (this.status == ReminderStatus.OVERDUE) {
            this.status = ReminderStatus.PENDING;
        }
    }

    public User getUser() { return user; }
    public JobApplication getApplication() { return application; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public ReminderType getReminderType() { return reminderType; }
    public Instant getRemindAt() { return remindAt; }
    public Instant getCompletedAt() { return completedAt; }
    public ReminderStatus getStatus() { return status; }
}
