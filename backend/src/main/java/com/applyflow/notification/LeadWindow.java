package com.applyflow.notification;

public enum LeadWindow {
    TWENTY_FOUR_HOURS("in 24 hours", "in 24 hours", "24 hours"),
    ONE_HOUR("in 1 hour", "in 1 hour", "1 hour"),
    DUE("now", "due now", "Due");

    private final String bodyPhrase;
    private final String subjectQualifier;
    private final String badgeLabel;

    LeadWindow(String bodyPhrase, String subjectQualifier, String badgeLabel) {
        this.bodyPhrase = bodyPhrase;
        this.subjectQualifier = subjectQualifier;
        this.badgeLabel = badgeLabel;
    }

    public String bodyPhrase() {
        return bodyPhrase;
    }

    public String subjectQualifier() {
        return subjectQualifier;
    }

    public String badgeLabel() {
        return badgeLabel;
    }
}
