package com.applyflow.auth.service;

public interface EmailService {

    void sendVerificationEmail(String toEmail, String displayName, String verificationUrl);

    void sendReminderDueEmail(
            String toEmail,
            String displayName,
            String reminderTitle,
            String reminderTypeLabel,
            String details,
            String actionUrl
    );

    void sendInterviewScheduledEmail(
            String toEmail,
            String displayName,
            String jobTitle,
            String companyName,
            String interviewType,
            String scheduledAtLabel,
            String actionUrl
    );

    void sendAssessmentAddedEmail(
            String toEmail,
            String displayName,
            String assessmentTitle,
            String jobTitle,
            String companyName,
            String dueAtLabel,
            String actionUrl
    );

    void sendApplicationOutcomeEmail(
            String toEmail,
            String displayName,
            String jobTitle,
            String companyName,
            String outcomeLabel,
            String actionUrl
    );
}
