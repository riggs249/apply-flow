package com.applyflow.notification;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.util.HtmlUtils;

import java.util.ArrayList;
import java.util.List;

@Component
public class NotificationEmailComposer {

    public String plainText(NotificationEmailMessage message) {
        StringBuilder body = new StringBuilder();
        body.append("Hi ").append(message.displayName()).append(",\n\n");
        if (StringUtils.hasText(message.intro())) {
            body.append(message.intro()).append("\n\n");
        }
        if (message.details() != null) {
            for (EmailDetailRow row : message.details()) {
                if (row == null || !StringUtils.hasText(row.value())) {
                    continue;
                }
                body.append(row.label()).append(": ").append(row.value()).append('\n');
            }
            if (!message.details().isEmpty()) {
                body.append('\n');
            }
        }
        body.append(message.ctaLabel()).append(":\n").append(message.actionUrl()).append("\n\n");
        if (StringUtils.hasText(message.footerNote())) {
            body.append(message.footerNote()).append("\n\n");
        }
        body.append("— HanapTracker");
        return body.toString();
    }

    public String html(NotificationEmailMessage message) {
        String safeName = escape(message.displayName());
        String safeEyebrow = escape(blankTo(message.eyebrow(), "HanapTracker"));
        String safeHeadline = escape(message.headline());
        String safeIntro = escape(blankTo(message.intro(), ""));
        String safeUrl = escape(message.actionUrl());
        String safeCta = escape(message.ctaLabel());
        String footer = StringUtils.hasText(message.footerNote())
                ? "<p style=\"margin:16px 0 0;font-size:13px;line-height:1.5;color:#6b7c85\">"
                + escape(message.footerNote()) + "</p>"
                : "";

        String introBlock = StringUtils.hasText(message.intro())
                ? "<p style=\"margin:0 0 18px;font-size:15px;line-height:1.6;color:#334155\">" + safeIntro + "</p>"
                : "";

        return """
                <div style="margin:0;padding:0;background:#f3f6f5">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="background:#f3f6f5;padding:24px 12px">
                    <tr>
                      <td align="center">
                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="max-width:560px;background:#ffffff;border:1px solid #d7e3df;border-radius:16px;overflow:hidden">
                          <tr>
                            <td style="background:linear-gradient(135deg,#0f766e,#134e4a);padding:20px 24px">
                              <p style="margin:0;font-family:Segoe UI,Arial,sans-serif;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#b7ebe4;font-weight:700">%s</p>
                              <h1 style="margin:8px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.3;color:#ffffff;font-weight:700">%s</h1>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:24px;font-family:Segoe UI,Arial,sans-serif;color:#1a2e2c">
                              <p style="margin:0 0 12px;font-size:15px;line-height:1.5">Hi %s,</p>
                              %s
                              %s
                              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 0">
                                <tr>
                                  <td style="border-radius:10px;background:#0f766e">
                                    <a href="%s" style="display:inline-block;padding:12px 20px;font-family:Segoe UI,Arial,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none">%s</a>
                                  </td>
                                </tr>
                              </table>
                              %s
                              <p style="margin:22px 0 0;font-size:13px;color:#6b7c85">— HanapTracker</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </div>
                """.formatted(
                safeEyebrow,
                safeHeadline,
                safeName,
                introBlock,
                detailsTable(message.details()),
                safeUrl,
                safeCta,
                footer
        );
    }

    private String detailsTable(List<EmailDetailRow> details) {
        if (details == null || details.isEmpty()) {
            return "";
        }
        List<String> rows = new ArrayList<>();
        for (EmailDetailRow row : details) {
            if (row == null || !StringUtils.hasText(row.value())) {
                continue;
            }
            rows.add("""
                    <tr>
                      <td style="padding:10px 0;border-bottom:1px solid #e6efec;width:34%%;vertical-align:top;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#5b6b73">%s</td>
                      <td style="padding:10px 0;border-bottom:1px solid #e6efec;vertical-align:top;font-size:14px;color:#1a2e2c;font-weight:600">%s</td>
                    </tr>
                    """.formatted(escape(row.label()), escape(row.value())));
        }
        if (rows.isEmpty()) {
            return "";
        }
        return """
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="margin:0 0 22px;background:#f7fbfa;border:1px solid #e6efec;border-radius:12px">
                  <tr>
                    <td style="padding:4px 16px">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%%">
                        %s
                      </table>
                    </td>
                  </tr>
                </table>
                """.formatted(String.join("", rows));
    }

    private String escape(String value) {
        return HtmlUtils.htmlEscape(value == null ? "" : value);
    }

    private String blankTo(String value, String fallback) {
        return StringUtils.hasText(value) ? value : fallback;
    }
}
