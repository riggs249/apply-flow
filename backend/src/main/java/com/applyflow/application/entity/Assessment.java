package com.applyflow.application.entity;

import com.applyflow.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "assessments")
public class Assessment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private JobApplication application;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "assessment_type", nullable = false, length = 50)
    private String assessmentType;

    @Column(columnDefinition = "text")
    private String instructions;

    @Column(name = "link_url", length = 1000)
    private String linkUrl;

    @Column(name = "due_at")
    private Instant dueAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(columnDefinition = "text")
    private String result;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AssessmentStatus status;

    @Column(columnDefinition = "text")
    private String notes;

    protected Assessment() {
    }

    public Assessment(JobApplication application, String title, String assessmentType, String instructions,
                      String linkUrl, Instant dueAt, AssessmentStatus status, String result, String notes) {
        this.application = application;
        this.title = title;
        this.assessmentType = assessmentType;
        this.instructions = instructions;
        this.linkUrl = linkUrl;
        this.dueAt = dueAt;
        this.status = status;
        this.result = result;
        this.notes = notes;
        this.completedAt = status == AssessmentStatus.COMPLETED ? Instant.now() : null;
    }

    public void update(String title, String assessmentType, String instructions, String linkUrl, Instant dueAt,
                       AssessmentStatus status, String result, String notes) {
        this.title = title;
        this.assessmentType = assessmentType;
        this.instructions = instructions;
        this.linkUrl = linkUrl;
        this.dueAt = dueAt;
        this.status = status;
        this.result = result;
        this.notes = notes;
        if (status == AssessmentStatus.COMPLETED) {
            if (this.completedAt == null) {
                this.completedAt = Instant.now();
            }
        } else {
            this.completedAt = null;
        }
    }

    public JobApplication getApplication() { return application; }
    public String getTitle() { return title; }
    public String getAssessmentType() { return assessmentType; }
    public String getInstructions() { return instructions; }
    public String getLinkUrl() { return linkUrl; }
    public Instant getDueAt() { return dueAt; }
    public Instant getCompletedAt() { return completedAt; }
    public AssessmentStatus getStatus() { return status; }
    public String getResult() { return result; }
    public String getNotes() { return notes; }
}
