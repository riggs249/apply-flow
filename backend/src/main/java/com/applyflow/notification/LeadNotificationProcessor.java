package com.applyflow.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;
import java.util.function.Function;

@Component
public class LeadNotificationProcessor {

    private static final Logger log = LoggerFactory.getLogger(LeadNotificationProcessor.class);

    /**
     * Evaluates lead windows for an event and marks only successful sends.
     *
     * @param send returns {@code true} when the email was handed to the mail layer
     */
    public void process(
            String kind,
            UUID entityId,
            Instant eventAt,
            Instant now,
            LeadEmailMarks marks,
            Function<LeadWindow, Boolean> send
    ) {
        if (eventAt == null || marks == null) {
            return;
        }
        for (LeadWindow window : LeadWindowEvaluator.windowsToSend(eventAt, now, marks)) {
            try {
                Boolean sent = send.apply(window);
                if (Boolean.TRUE.equals(sent)) {
                    marks.mark(window, now);
                }
            } catch (RuntimeException exception) {
                log.warn("Failed to email {} {} ({}): {}", kind, entityId, window, exception.getMessage());
            }
        }
    }
}
