package com.applyflow.notification;

import com.applyflow.application.entity.ApplicationStatus;
import com.applyflow.application.entity.Assessment;
import com.applyflow.application.entity.Interview;
import com.applyflow.application.entity.JobApplication;
import com.applyflow.application.entity.Reminder;
import com.applyflow.application.entity.ReminderType;
import com.applyflow.auth.service.EmailService;
import com.applyflow.user.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Service
public class NotificationDispatchService {

    private static final DateTimeFormatter WHEN =
            DateTimeFormatter.ofPattern("MMM d, yyyy h:mm a").withZone(ZoneId.systemDefault());

    private final EmailService emailService;
    private final String frontendUrl;

    public NotificationDispatchService(
            EmailService emailService,
            @Value("${app.frontend-url}") String frontendUrl
    ) {
        this.emailService = emailService;
        this.frontendUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
    }

    public void sendReminderDue(Reminder reminder) {
        User user = reminder.getUser();
        if (!canNotify(user) || !user.isNotifyReminderEmail()) {
            return;
        }
        JobApplication application = reminder.getApplication();
        String details = application == null
                ? blankToNull(reminder.getDescription())
                : "%s at %s%s".formatted(
                application.getJobTitle(),
                application.getCompany().getName(),
                reminder.getDescription() == null || reminder.getDescription().isBlank()
                        ? ""
                        : " — " + reminder.getDescription().trim()
        );
        emailService.sendReminderDueEmail(
                user.getEmail(),
                user.getDisplayName(),
                reminder.getTitle(),
                label(reminder.getReminderType()),
                details,
                frontendUrl + "/reminders"
        );
    }

    public void sendInterviewScheduled(User user, Interview interview) {
        if (!canNotify(user) || !user.isNotifyInterviewEmail()) {
            return;
        }
        JobApplication application = interview.getApplication();
        emailService.sendInterviewScheduledEmail(
                user.getEmail(),
                user.getDisplayName(),
                application.getJobTitle(),
                application.getCompany().getName(),
                interview.getInterviewType(),
                WHEN.format(interview.getScheduledAt()),
                frontendUrl + "/interviews"
        );
    }

    public void sendAssessmentAdded(User user, Assessment assessment) {
        if (!canNotify(user) || !user.isNotifyAssessmentEmail()) {
            return;
        }
        JobApplication application = assessment.getApplication();
        String dueLabel = assessment.getDueAt() == null ? null : WHEN.format(assessment.getDueAt());
        emailService.sendAssessmentAddedEmail(
                user.getEmail(),
                user.getDisplayName(),
                assessment.getTitle(),
                application.getJobTitle(),
                application.getCompany().getName(),
                dueLabel,
                frontendUrl + "/assessments"
        );
    }

    public void sendApplicationOutcome(User user, JobApplication application, ApplicationStatus status) {
        if (!canNotify(user) || !user.isNotifyOutcomeEmail()) {
            return;
        }
        if (status != ApplicationStatus.HIRED && status != ApplicationStatus.REJECTED) {
            return;
        }
        emailService.sendApplicationOutcomeEmail(
                user.getEmail(),
                user.getDisplayName(),
                application.getJobTitle(),
                application.getCompany().getName(),
                status == ApplicationStatus.HIRED ? "Hired" : "Rejected",
                frontendUrl + "/applications/" + application.getId()
        );
    }

    private boolean canNotify(User user) {
        return user != null && user.isEmailVerified();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String label(ReminderType type) {
        return switch (type) {
            case UPCOMING_INTERVIEW -> "Upcoming interview";
            case ASSESSMENT_DEADLINE -> "Assessment deadline";
            case APPLICATION_DEADLINE -> "Application deadline";
            case RECRUITER_FOLLOW_UP -> "Recruiter follow-up";
            case CUSTOM -> "Custom reminder";
        };
    }
}
