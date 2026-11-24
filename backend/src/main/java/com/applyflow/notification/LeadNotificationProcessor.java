package com.applyflow.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.function.Function;

@Component
public class LeadNotificationProcessor {

    private static final Logger log = LoggerFactory.getLogger(LeadNotificationProcessor.class);

    /**
     * Expires missed windows, then evaluates remaining lead windows to send.
     * Call inside a short write transaction before sending mail outside it.
     */
    public List<LeadWindow> prepareWindows(Instant eventAt, Instant now, LeadEmailMarks marks) {
        if (eventAt == null || marks == null) {
            return List.of();
        }
        LeadWindowEvaluator.expireMissedWindows(eventAt, now, marks);
        return new ArrayList<>(LeadWindowEvaluator.windowsToSend(eventAt, now, marks));
    }

    /**
     * Sends one lead window. Returns {@code true} when the window should be marked handled.
     */
    public boolean sendWindow(
            String kind,
            UUID entityId,
            LeadWindow window,
            Function<LeadWindow, Boolean> send
    ) {
        try {
            return Boolean.TRUE.equals(send.apply(window));
        } catch (RuntimeException exception) {
            log.warn("Failed to email {} {} ({}): {}", kind, entityId, window, exception.getMessage());
            return false;
        }
    }

    /**
     * Evaluates lead windows for an event and marks only successful sends.
     * Prefer {@link #prepareWindows} + {@link #sendWindow} when mail must stay outside the DB transaction.
     */
    public void process(
            String kind,
            UUID entityId,
            Instant eventAt,
            Instant now,
            LeadEmailMarks marks,
            Function<LeadWindow, Boolean> send
    ) {
        for (LeadWindow window : prepareWindows(eventAt, now, marks)) {
            if (sendWindow(kind, entityId, window, send)) {
                marks.mark(window, now);
            }
        }
    }
}
