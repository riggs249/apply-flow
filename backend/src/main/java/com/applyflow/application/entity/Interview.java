package com.applyflow.application.entity;

import com.applyflow.common.persistence.BaseEntity;
import com.applyflow.notification.LeadEmailMarks;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "interviews")
public class Interview extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private JobApplication application;

    @Column(name = "scheduled_at", nullable = false)
    private Instant scheduledAt;

    @Column(name = "interview_type", nullable = false, length = 50)
    private String interviewType;

    @Column(length = 200)
    private String interviewer;

    @Column(name = "interviewer_contact", length = 255)
    private String interviewerContact;

    @Column(name = "location_or_meeting_url", length = 1_000)
    private String locationOrMeetingUrl;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private InterviewOutcome outcome;

    @Column(name = "preparation_notes", columnDefinition = "text")
    private String preparationNotes;

    @Column(columnDefinition = "text")
    private String reflection;

    @Embedded
    private LeadEmailMarks leadEmails = new LeadEmailMarks();

    protected Interview() {
    }

    public Interview(JobApplication application, Instant scheduledAt, String interviewType, String interviewer,
                     String interviewerContact, String locationOrMeetingUrl, String preparationNotes,
                     String reflection, InterviewOutcome outcome) {
        this.application = application;
        this.scheduledAt = scheduledAt;
        this.interviewType = interviewType;
        this.interviewer = interviewer;
        this.interviewerContact = interviewerContact;
        this.locationOrMeetingUrl = locationOrMeetingUrl;
        this.preparationNotes = preparationNotes;
        this.reflection = reflection;
        this.outcome = outcome;
        this.leadEmails = new LeadEmailMarks();
    }

    public void update(Instant scheduledAt, String interviewType, String interviewer, String interviewerContact,
                       String locationOrMeetingUrl, String preparationNotes, String reflection,
                       InterviewOutcome outcome) {
        if (!Objects.equals(this.scheduledAt, scheduledAt)) {
            leadEmails().clear();
        }
        this.scheduledAt = scheduledAt;
        this.interviewType = interviewType;
        this.interviewer = interviewer;
        this.interviewerContact = interviewerContact;
        this.locationOrMeetingUrl = locationOrMeetingUrl;
        this.preparationNotes = preparationNotes;
        this.reflection = reflection;
        this.outcome = outcome;
    }

    public LeadEmailMarks leadEmails() {
        if (leadEmails == null) {
            leadEmails = new LeadEmailMarks();
        }
        return leadEmails;
    }

    public JobApplication getApplication() { return application; }
    public Instant getScheduledAt() { return scheduledAt; }
    public String getInterviewType() { return interviewType; }
    public String getInterviewer() { return interviewer; }
    public String getInterviewerContact() { return interviewerContact; }
    public String getLocationOrMeetingUrl() { return locationOrMeetingUrl; }
    public String getPreparationNotes() { return preparationNotes; }
    public String getReflection() { return reflection; }
    public InterviewOutcome getOutcome() { return outcome; }
}
