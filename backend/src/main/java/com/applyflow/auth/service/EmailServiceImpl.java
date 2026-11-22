package com.applyflow.auth.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.util.HtmlUtils;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final ObjectProvider<JavaMailSender> mailSender;
    private final String fromAddress;
    private final String mailHost;

    public EmailServiceImpl(
            ObjectProvider<JavaMailSender> mailSender,
            @Value("${app.mail.from:HanapTracker <noreply@hanaptracker.local>}") String fromAddress,
            @Value("${spring.mail.host:}") String mailHost
    ) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
        this.mailHost = mailHost;
    }

    @Override
    public void sendVerificationEmail(String toEmail, String displayName, String verificationUrl) {
        send(
                toEmail,
                "Verify your HanapTracker email",
                """
                        Hi %s,

                        Thanks for creating a HanapTracker account.
                        Click the link below to verify your email:

                        %s

                        This link expires in 24 hours.
                        If you did not create an account, you can ignore this message.

                        — HanapTracker
                        """.formatted(displayName, verificationUrl),
                htmlShell(
                        displayName,
                        "Thanks for creating a HanapTracker account. Click the button below to verify your email.",
                        verificationUrl,
                        "Click the link",
                        "This link expires in 24 hours. If you did not create an account, you can ignore this message."
                ),
                "verification link for " + toEmail + ": " + verificationUrl
        );
    }

    @Override
    public void sendReminderDueEmail(
            String toEmail,
            String displayName,
            String reminderTitle,
            String reminderTypeLabel,
            String details,
            String actionUrl
    ) {
        String bodyLead = "A reminder is due: %s (%s).".formatted(reminderTitle, reminderTypeLabel);
        if (StringUtils.hasText(details)) {
            bodyLead += " " + details;
        }
        send(
                toEmail,
                "Reminder due: " + reminderTitle,
                """
                        Hi %s,

                        %s

                        Open HanapTracker:
                        %s

                        — HanapTracker
                        """.formatted(displayName, bodyLead, actionUrl),
                htmlShell(displayName, HtmlUtils.htmlEscape(bodyLead), actionUrl, "Open reminders", null),
                "reminder email for " + toEmail + ": " + reminderTitle
        );
    }

    @Override
    public void sendInterviewScheduledEmail(
            String toEmail,
            String displayName,
            String jobTitle,
            String companyName,
            String interviewType,
            String scheduledAtLabel,
            String actionUrl
    ) {
        String bodyLead = "Interview scheduled for %s at %s (%s) on %s."
                .formatted(jobTitle, companyName, interviewType, scheduledAtLabel);
        send(
                toEmail,
                "Interview scheduled: " + jobTitle,
                """
                        Hi %s,

                        %s

                        Open HanapTracker:
                        %s

                        — HanapTracker
                        """.formatted(displayName, bodyLead, actionUrl),
                htmlShell(displayName, HtmlUtils.htmlEscape(bodyLead), actionUrl, "View interview", null),
                "interview email for " + toEmail + ": " + jobTitle
        );
    }

    @Override
    public void sendAssessmentAddedEmail(
            String toEmail,
            String displayName,
            String assessmentTitle,
            String jobTitle,
            String companyName,
            String dueAtLabel,
            String actionUrl
    ) {
        String duePart = StringUtils.hasText(dueAtLabel) ? " Due: " + dueAtLabel + "." : "";
        String bodyLead = "Assessment added for %s at %s: %s.%s"
                .formatted(jobTitle, companyName, assessmentTitle, duePart);
        send(
                toEmail,
                "Assessment added: " + assessmentTitle,
                """
                        Hi %s,

                        %s

                        Open HanapTracker:
                        %s

                        — HanapTracker
                        """.formatted(displayName, bodyLead, actionUrl),
                htmlShell(displayName, HtmlUtils.htmlEscape(bodyLead), actionUrl, "View assessment", null),
                "assessment email for " + toEmail + ": " + assessmentTitle
        );
    }

    @Override
    public void sendApplicationOutcomeEmail(
            String toEmail,
            String displayName,
            String jobTitle,
            String companyName,
            String outcomeLabel,
            String actionUrl
    ) {
        String bodyLead = "Your application for %s at %s is now marked as %s."
                .formatted(jobTitle, companyName, outcomeLabel);
        send(
                toEmail,
                "Application update: " + outcomeLabel,
                """
                        Hi %s,

                        %s

                        Open HanapTracker:
                        %s

                        — HanapTracker
                        """.formatted(displayName, bodyLead, actionUrl),
                htmlShell(displayName, HtmlUtils.htmlEscape(bodyLead), actionUrl, "View application", null),
                "outcome email for " + toEmail + ": " + jobTitle + " -> " + outcomeLabel
        );
    }

    private String htmlShell(String displayName, String leadHtml, String actionUrl, String ctaLabel, String footerNote) {
        String safeName = HtmlUtils.htmlEscape(displayName);
        String safeUrl = HtmlUtils.htmlEscape(actionUrl);
        String safeCta = HtmlUtils.htmlEscape(ctaLabel);
        String footer = footerNote == null
                ? ""
                : "<p style=\"margin:0 0 8px;font-size:13px;color:#5b6b73\">" + HtmlUtils.htmlEscape(footerNote) + "</p>";
        return """
                <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#1a2e2c;max-width:520px">
                  <p style="margin:0 0 12px">Hi %s,</p>
                  <p style="margin:0 0 20px">%s</p>
                  <p style="margin:0 0 24px">
                    <a href="%s"
                       style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:10px">
                      %s
                    </a>
                  </p>
                  %s
                  <p style="margin:24px 0 0;font-size:13px;color:#5b6b73">— HanapTracker</p>
                </div>
                """.formatted(safeName, leadHtml, safeUrl, safeCta, footer);
    }

    private void send(String toEmail, String subject, String textBody, String htmlBody, String logFallback) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null || !StringUtils.hasText(mailHost)) {
            log.info("Notification email (mail not configured) — {}", logFallback);
            log.debug("Notification email body:\n{}", textBody);
            return;
        }
        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(textBody, htmlBody);
            sender.send(message);
            log.info("Sent notification email to {} ({})", toEmail, subject);
        } catch (MessagingException exception) {
            throw new IllegalStateException("Failed to send notification email", exception);
        }
    }
}
