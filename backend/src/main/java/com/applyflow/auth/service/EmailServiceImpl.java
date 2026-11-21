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
        String subject = "Verify your HanapTracker email";
        String safeName = HtmlUtils.htmlEscape(displayName);
        String safeUrl = HtmlUtils.htmlEscape(verificationUrl);

        String textBody = """
                Hi %s,

                Thanks for creating a HanapTracker account.
                Click the link below to verify your email:

                %s

                This link expires in 24 hours.
                If you did not create an account, you can ignore this message.

                — HanapTracker
                """.formatted(displayName, verificationUrl);

        String htmlBody = """
                <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#1a2e2c;max-width:520px">
                  <p style="margin:0 0 12px">Hi %s,</p>
                  <p style="margin:0 0 20px">Thanks for creating a HanapTracker account. Click the button below to verify your email.</p>
                  <p style="margin:0 0 24px">
                    <a href="%s"
                       style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:10px">
                      Click the link
                    </a>
                  </p>
                  <p style="margin:0 0 8px;font-size:13px;color:#5b6b73">This link expires in 24 hours.</p>
                  <p style="margin:0;font-size:13px;color:#5b6b73">If you did not create an account, you can ignore this message.</p>
                  <p style="margin:24px 0 0;font-size:13px;color:#5b6b73">— HanapTracker</p>
                </div>
                """.formatted(safeName, safeUrl);

        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null || !StringUtils.hasText(mailHost)) {
            log.info("Email verification link for {} (mail not configured):\n{}", toEmail, verificationUrl);
            log.debug("Verification email body:\n{}", textBody);
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
            log.info("Sent verification email to {}", toEmail);
        } catch (MessagingException exception) {
            throw new IllegalStateException("Failed to send verification email", exception);
        }
    }
}
