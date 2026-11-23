package com.applyflow.notification;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.time.Instant;

@Embeddable
public class LeadEmailMarks {

    @Column(name = "emailed_24h_at")
    private Instant emailed24hAt;

    @Column(name = "emailed_1h_at")
    private Instant emailed1hAt;

    @Column(name = "emailed_at")
    private Instant emailedDueAt;

    public Instant getEmailed24hAt() {
        return emailed24hAt;
    }

    public Instant getEmailed1hAt() {
        return emailed1hAt;
    }

    public Instant getEmailedDueAt() {
        return emailedDueAt;
    }

    public boolean needsAny() {
        return emailed24hAt == null || emailed1hAt == null || emailedDueAt == null;
    }

    public boolean isUnset(LeadWindow window) {
        return switch (window) {
            case TWENTY_FOUR_HOURS -> emailed24hAt == null;
            case ONE_HOUR -> emailed1hAt == null;
            case DUE -> emailedDueAt == null;
        };
    }

    public void mark(LeadWindow window, Instant at) {
        switch (window) {
            case TWENTY_FOUR_HOURS -> emailed24hAt = at;
            case ONE_HOUR -> emailed1hAt = at;
            case DUE -> emailedDueAt = at;
        }
    }

    public void clear() {
        emailed24hAt = null;
        emailed1hAt = null;
        emailedDueAt = null;
    }
}
