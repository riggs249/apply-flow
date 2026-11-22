package com.applyflow.notification;

import com.applyflow.application.entity.ApplicationStatus;
import com.applyflow.application.entity.Assessment;
import com.applyflow.application.entity.Interview;
import com.applyflow.application.entity.JobApplication;
import com.applyflow.application.entity.Reminder;
import com.applyflow.application.entity.ReminderType;
import com.applyflow.auth.service.EmailService;
import com.applyflow.user.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class NotificationDispatchService {

    private static final Logger log = LoggerFactory.getLogger(NotificationDispatchService.class);

    private static final DateTimeFormatter WHEN =
            DateTimeFormatter.ofPattern("EEE, MMM d, yyyy 'at' h:mm a").withZone(ZoneId.systemDefault());

    private final EmailService emailService;
    private final String frontendUrl;

    public NotificationDispatchService(
            EmailService emailService,
            @Value("${app.frontend-url}") String frontendUrl
    ) {
        this.emailService = emailService;
        this.frontendUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
    }

    public boolean sendReminderLead(Reminder reminder, LeadWindow window) {
        User user = reminder.getUser();
        if (!canNotify(user, user != null && user.isNotifyReminderEmail(), "reminder", reminder.getId())) {
            return false;
        }
        JobApplication application = reminder.getApplication();
        List<EmailDetailRow> details = new ArrayList<>();
        details.add(new EmailDetailRow("Reminder", reminder.getTitle()));
        details.add(new EmailDetailRow("Type", label(reminder.getReminderType())));
        details.add(new EmailDetailRow("When", WHEN.format(reminder.getRemindAt())));
        if (application != null) {
            details.add(new EmailDetailRow("Role", application.getJobTitle()));
            details.add(new EmailDetailRow("Company", application.getCompany().getName()));
        }
        if (StringUtils.hasText(reminder.getDescription())) {
            details.add(new EmailDetailRow("Notes", reminder.getDescription().trim()));
        }

        emailService.send(leadMessage(
                user,
                subject("Reminder", reminder.getTitle(), window),
                "Reminder",
                headline("Reminder", window),
                "Your reminder is due " + window.bodyPhrase() + ".",
                details,
                frontendUrl + "/reminders",
                "Open reminders",
                window
        ));
        return true;
    }

    public boolean sendInterviewLead(Interview interview, LeadWindow window) {
        User user = interview.getApplication().getUser();
        if (!canNotify(user, user.isNotifyInterviewEmail(), "interview", interview.getId())) {
            return false;
        }
        JobApplication application = interview.getApplication();
        List<EmailDetailRow> details = new ArrayList<>();
        details.add(new EmailDetailRow("Role", application.getJobTitle()));
        details.add(new EmailDetailRow("Company", application.getCompany().getName()));
        details.add(new EmailDetailRow("Type", interview.getInterviewType()));
        details.add(new EmailDetailRow("Scheduled", WHEN.format(interview.getScheduledAt())));
        if (StringUtils.hasText(interview.getInterviewer())) {
            details.add(new EmailDetailRow("Interviewer", interview.getInterviewer()));
        }
        if (StringUtils.hasText(interview.getLocationOrMeetingUrl())) {
            details.add(new EmailDetailRow("Location", interview.getLocationOrMeetingUrl()));
        }

        emailService.send(leadMessage(
                user,
                subject("Interview", application.getJobTitle(), window),
                "Interview",
                headline("Interview", window),
                "Your interview is " + window.bodyPhrase() + ".",
                details,
                frontendUrl + "/interviews",
                "View interviews",
                window
        ));
        return true;
    }

    public boolean sendAssessmentLead(Assessment assessment, LeadWindow window) {
        User user = assessment.getApplication().getUser();
        if (!canNotify(user, user.isNotifyAssessmentEmail(), "assessment", assessment.getId())) {
            return false;
        }
        JobApplication application = assessment.getApplication();
        List<EmailDetailRow> details = new ArrayList<>();
        details.add(new EmailDetailRow("Assessment", assessment.getTitle()));
        details.add(new EmailDetailRow("Type", assessment.getAssessmentType()));
        details.add(new EmailDetailRow("Role", application.getJobTitle()));
        details.add(new EmailDetailRow("Company", application.getCompany().getName()));
        if (assessment.getDueAt() != null) {
            details.add(new EmailDetailRow("Due", WHEN.format(assessment.getDueAt())));
        }
        if (StringUtils.hasText(assessment.getLinkUrl())) {
            details.add(new EmailDetailRow("Link", assessment.getLinkUrl()));
        }

        emailService.send(leadMessage(
                user,
                subject("Assessment", assessment.getTitle(), window),
                "Assessment",
                headline("Assessment", window),
                "Your assessment is due " + window.bodyPhrase() + ".",
                details,
                frontendUrl + "/assessments",
                "View assessments",
                window
        ));
        return true;
    }

    public void sendInterviewScheduled(User user, Interview interview) {
        if (!canNotify(user, user.isNotifyInterviewEmail(), "interview-created", interview.getId())) {
            return;
        }
        JobApplication application = interview.getApplication();
        emailService.send(new NotificationEmailMessage(
                user.getEmail(),
                user.getDisplayName(),
                "Interview scheduled: " + application.getJobTitle(),
                "Interview added",
                "Interview scheduled",
                "A new interview was added to your tracker.",
                List.of(
                        new EmailDetailRow("Role", application.getJobTitle()),
                        new EmailDetailRow("Company", application.getCompany().getName()),
                        new EmailDetailRow("Type", interview.getInterviewType()),
                        new EmailDetailRow("Scheduled", WHEN.format(interview.getScheduledAt())),
                        new EmailDetailRow("Interviewer", interview.getInterviewer()),
                        new EmailDetailRow("Location", interview.getLocationOrMeetingUrl())
                ),
                frontendUrl + "/interviews",
                "View interviews",
                null
        ));
    }

    public void sendAssessmentAdded(User user, Assessment assessment) {
        if (!canNotify(user, user.isNotifyAssessmentEmail(), "assessment-created", assessment.getId())) {
            return;
        }
        JobApplication application = assessment.getApplication();
        emailService.send(new NotificationEmailMessage(
                user.getEmail(),
                user.getDisplayName(),
                "Assessment added: " + assessment.getTitle(),
                "Assessment added",
                "New assessment to complete",
                "A new assessment was added to your tracker.",
                List.of(
                        new EmailDetailRow("Assessment", assessment.getTitle()),
                        new EmailDetailRow("Type", assessment.getAssessmentType()),
                        new EmailDetailRow("Role", application.getJobTitle()),
                        new EmailDetailRow("Company", application.getCompany().getName()),
                        new EmailDetailRow("Due", assessment.getDueAt() == null ? null : WHEN.format(assessment.getDueAt())),
                        new EmailDetailRow("Link", assessment.getLinkUrl())
                ),
                frontendUrl + "/assessments",
                "View assessments",
                null
        ));
    }

    public void sendApplicationOutcome(User user, JobApplication application, ApplicationStatus status) {
        if (!canNotify(user, user.isNotifyOutcomeEmail(), "outcome", application.getId())) {
            return;
        }
        if (status != ApplicationStatus.HIRED && status != ApplicationStatus.REJECTED) {
            return;
        }
        String outcomeLabel = status == ApplicationStatus.HIRED ? "Hired" : "Rejected";
        emailService.send(new NotificationEmailMessage(
                user.getEmail(),
                user.getDisplayName(),
                "Application update: " + outcomeLabel,
                "Application update",
                "Status changed to " + outcomeLabel,
                "Your application status was updated.",
                List.of(
                        new EmailDetailRow("Role", application.getJobTitle()),
                        new EmailDetailRow("Company", application.getCompany().getName()),
                        new EmailDetailRow("Outcome", outcomeLabel)
                ),
                frontendUrl + "/applications/" + application.getId(),
                "View application",
                null
        ));
    }

    private NotificationEmailMessage leadMessage(
            User user,
            String subject,
            String kind,
            String headline,
            String intro,
            List<EmailDetailRow> details,
            String actionUrl,
            String ctaLabel,
            LeadWindow window
    ) {
        return new NotificationEmailMessage(
                user.getEmail(),
                user.getDisplayName(),
                subject,
                kind + " · " + window.badgeLabel(),
                headline,
                intro,
                details,
                actionUrl,
                ctaLabel,
                null
        );
    }

    private boolean canNotify(User user, boolean preferenceEnabled, String kind, Object id) {
        if (user == null || !user.isEmailVerified() || !preferenceEnabled) {
            log.debug(
                    "Skipping {} email for {} — verified={} pref={}",
                    kind,
                    id,
                    user != null && user.isEmailVerified(),
                    preferenceEnabled
            );
            return false;
        }
        return true;
    }

    private String subject(String kind, String title, LeadWindow window) {
        return switch (window) {
            case TWENTY_FOUR_HOURS -> kind + " in 24 hours: " + title;
            case ONE_HOUR -> kind + " in 1 hour: " + title;
            case DUE -> kind + " due: " + title;
        };
    }

    private String headline(String kind, LeadWindow window) {
        return switch (window) {
            case TWENTY_FOUR_HOURS -> kind + " coming up in 24 hours";
            case ONE_HOUR -> kind + " coming up in 1 hour";
            case DUE -> kind + " is due now";
        };
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
