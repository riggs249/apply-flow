package com.applyflow.auth.service;

import com.applyflow.notification.NotificationEmailComposer;
import com.applyflow.notification.NotificationEmailMessage;
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

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final ObjectProvider<JavaMailSender> mailSender;
    private final NotificationEmailComposer composer;
    private final String fromAddress;
    private final String mailHost;

    public EmailServiceImpl(
            ObjectProvider<JavaMailSender> mailSender,
            NotificationEmailComposer composer,
            @Value("${app.mail.from:HanapTracker <noreply@hanaptracker.local>}") String fromAddress,
            @Value("${spring.mail.host:}") String mailHost
    ) {
        this.mailSender = mailSender;
        this.composer = composer;
        this.fromAddress = fromAddress;
        this.mailHost = mailHost;
    }

    @Override
    public void send(NotificationEmailMessage message) {
        String textBody = composer.plainText(message);
        String htmlBody = composer.html(message);
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null || !StringUtils.hasText(mailHost)) {
            log.info("Notification email (mail not configured) — {} to {}", message.subject(), message.toEmail());
            log.debug("Notification email body:\n{}", textBody);
            return;
        }
        try {
            MimeMessage mimeMessage = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(message.toEmail());
            helper.setSubject(message.subject());
            helper.setText(textBody, htmlBody);
            sender.send(mimeMessage);
            log.info("Sent notification email to {} ({})", message.toEmail(), message.subject());
        } catch (MessagingException exception) {
            throw new IllegalStateException("Failed to send notification email", exception);
        }
    }
}
