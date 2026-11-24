package com.applyflow.notification;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class LeadWindowEvaluatorTest {

    @Test
    void selectsTwentyFourHourWindow() {
        Instant now = Instant.parse("2026-01-10T12:00:00Z");
        Instant eventAt = now.plus(20, ChronoUnit.HOURS);

        List<LeadWindow> windows = LeadWindowEvaluator.windowsToSend(eventAt, now, new LeadEmailMarks());

        assertThat(windows).containsExactly(LeadWindow.TWENTY_FOUR_HOURS);
    }

    @Test
    void selectsOneHourWindow() {
        Instant now = Instant.parse("2026-01-10T12:00:00Z");
        Instant eventAt = now.plus(30, ChronoUnit.MINUTES);

        List<LeadWindow> windows = LeadWindowEvaluator.windowsToSend(eventAt, now, new LeadEmailMarks());

        assertThat(windows).containsExactly(LeadWindow.ONE_HOUR);
    }

    @Test
    void selectsDueWindowAfterEvent() {
        Instant now = Instant.parse("2026-01-10T12:00:00Z");
        Instant eventAt = now.minus(5, ChronoUnit.MINUTES);

        List<LeadWindow> windows = LeadWindowEvaluator.windowsToSend(eventAt, now, new LeadEmailMarks());

        assertThat(windows).containsExactly(LeadWindow.DUE);
    }

    @Test
    void skipsAlreadyMarkedWindows() {
        Instant now = Instant.parse("2026-01-10T12:00:00Z");
        Instant eventAt = now.plus(30, ChronoUnit.MINUTES);
        LeadEmailMarks marks = new LeadEmailMarks();
        marks.mark(LeadWindow.ONE_HOUR, now.minusSeconds(10));

        List<LeadWindow> windows = LeadWindowEvaluator.windowsToSend(eventAt, now, marks);

        assertThat(windows).isEmpty();
    }

    @Test
    void expireMissedWindowsMarksPastBands() {
        Instant now = Instant.parse("2026-01-10T12:00:00Z");
        Instant eventAt = now.minus(5, ChronoUnit.MINUTES);
        LeadEmailMarks marks = new LeadEmailMarks();

        LeadWindowEvaluator.expireMissedWindows(eventAt, now, marks);

        assertThat(marks.getEmailed24hAt()).isNotNull();
        assertThat(marks.getEmailed1hAt()).isNotNull();
        assertThat(marks.isUnset(LeadWindow.DUE)).isTrue();
        assertThat(LeadWindowEvaluator.windowsToSend(eventAt, now, marks))
                .containsExactly(LeadWindow.DUE);
    }
}
