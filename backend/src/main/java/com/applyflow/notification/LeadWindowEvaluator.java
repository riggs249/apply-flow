package com.applyflow.notification;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * Shared timing rules for 24h / 1h / due lead emails.
 */
public final class LeadWindowEvaluator {

    private LeadWindowEvaluator() {
    }

    public static Instant horizonFrom(Instant now) {
        return now.plus(24, ChronoUnit.HOURS);
    }

    /**
     * Marks lead windows that can no longer be sent (missed their time band) so
     * scheduler queries stop selecting the same rows forever.
     */
    public static void expireMissedWindows(Instant eventAt, Instant now, LeadEmailMarks marks) {
        if (eventAt == null || marks == null || now == null) {
            return;
        }
        Instant oneHourBefore = eventAt.minus(1, ChronoUnit.HOURS);

        // 24h window ends at T-1h
        if (marks.isUnset(LeadWindow.TWENTY_FOUR_HOURS) && !now.isBefore(oneHourBefore)) {
            marks.mark(LeadWindow.TWENTY_FOUR_HOURS, now);
        }
        // 1h window ends at T
        if (marks.isUnset(LeadWindow.ONE_HOUR) && !now.isBefore(eventAt)) {
            marks.mark(LeadWindow.ONE_HOUR, now);
        }
    }

    /**
     * Returns lead windows that should fire for {@code eventAt} at {@code now},
     * skipping windows that were already marked on {@code marks}.
     */
    public static List<LeadWindow> windowsToSend(Instant eventAt, Instant now, LeadEmailMarks marks) {
        List<LeadWindow> windows = new ArrayList<>(3);
        Instant twentyFourHoursBefore = eventAt.minus(24, ChronoUnit.HOURS);
        Instant oneHourBefore = eventAt.minus(1, ChronoUnit.HOURS);

        // [T-24h, T-1h)
        if (marks.isUnset(LeadWindow.TWENTY_FOUR_HOURS)
                && !now.isBefore(twentyFourHoursBefore)
                && now.isBefore(oneHourBefore)) {
            windows.add(LeadWindow.TWENTY_FOUR_HOURS);
        }

        // [T-1h, T)
        if (marks.isUnset(LeadWindow.ONE_HOUR)
                && !now.isBefore(oneHourBefore)
                && now.isBefore(eventAt)) {
            windows.add(LeadWindow.ONE_HOUR);
        }

        // [T, +inf)
        if (marks.isUnset(LeadWindow.DUE) && !now.isBefore(eventAt)) {
            windows.add(LeadWindow.DUE);
        }

        return windows;
    }
}
