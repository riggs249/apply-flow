package com.applyflow.notification;

import java.util.List;

public record NotificationEmailMessage(
        String toEmail,
        String displayName,
        String subject,
        String eyebrow,
        String headline,
        String intro,
        List<EmailDetailRow> details,
        String actionUrl,
        String ctaLabel,
        String footerNote
) {
}
