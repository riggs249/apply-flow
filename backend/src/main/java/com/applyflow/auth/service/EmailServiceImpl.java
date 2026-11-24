package com.applyflow.auth.service;

import com.applyflow.notification.NotificationEmailComposer;
import com.applyflow.notification.NotificationEmailMessage;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final ObjectProvider<JavaMailSender> mailSender;
    private final ResendHttpMailClient resendHttpMailClient;
    private final NotificationEmailComposer composer;
    private final String fromAddress;
    private final String mailHost;
    private final String provider;

    public EmailServiceImpl(
            ObjectProvider<JavaMailSender> mailSender,
            ResendHttpMailClient resendHttpMailClient,
            NotificationEmailComposer composer,
            @Value("${app.mail.from:HanapTracker <noreply@hanaptracker.local>}") String fromAddress,
            @Value("${spring.mail.host:}") String mailHost,
            @Value("${app.mail.provider:auto}") String provider
    ) {
        this.mailSender = mailSender;
        this.resendHttpMailClient = resendHttpMailClient;
        this.composer = composer;
        this.fromAddress = fromAddress;
        this.mailHost = mailHost;
        this.provider = provider == null ? "auto" : provider.trim().toLowerCase();
    }

    @Override
    public void send(NotificationEmailMessage message) {
        String textBody = composer.plainText(message);
        String htmlBody = composer.html(message);

        Transport transport = resolveTransport();
        if (transport == Transport.NONE) {
            log.info("Notification email (mail not configured) — {} to {}", message.subject(), message.toEmail());
            log.debug("Notification email body:\n{}", textBody);
            return;
        }

        try {
            if (transport == Transport.RESEND) {
                resendHttpMailClient.send(
                        fromAddress,
                        message.toEmail(),
                        message.subject(),
                        textBody,
                        htmlBody
                );
            } else {
                sendViaSmtp(message, textBody, htmlBody);
            }
            log.info("Sent notification email via {} to {} ({})",
                    transport.name().toLowerCase(), message.toEmail(), message.subject());
        } catch (RuntimeException exception) {
            throw new IllegalStateException("Failed to send notification email", exception);
        }
    }

    private void sendViaSmtp(NotificationEmailMessage message, String textBody, String htmlBody) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null) {
            throw new IllegalStateException("JavaMailSender is not available for SMTP delivery.");
        }
        try {
            MimeMessage mimeMessage = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(message.toEmail());
            helper.setSubject(message.subject());
            helper.setText(textBody, htmlBody);
            sender.send(mimeMessage);
        } catch (MailException | jakarta.mail.MessagingException exception) {
            throw new IllegalStateException("SMTP send failed", exception);
        }
    }

    private Transport resolveTransport() {
        return switch (provider) {
            case "resend" -> resendHttpMailClient.isConfigured() ? Transport.RESEND : Transport.NONE;
            case "smtp" -> StringUtils.hasText(mailHost) && mailSender.getIfAvailable() != null
                    ? Transport.SMTP
                    : Transport.NONE;
            default -> {
                // Prefer Resend HTTPS on hosts that block SMTP (e.g. Render free).
                if (resendHttpMailClient.isConfigured()) {
                    yield Transport.RESEND;
                }
                if (StringUtils.hasText(mailHost) && mailSender.getIfAvailable() != null) {
                    yield Transport.SMTP;
                }
                yield Transport.NONE;
            }
        };
    }

    private enum Transport {
        RESEND,
        SMTP,
        NONE
    }
}
