package com.applyflow.application.entity;

import com.applyflow.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "application_activities")
public class ApplicationActivity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private JobApplication application;

    @Column(name = "activity_type", nullable = false, length = 50)
    private String activityType;

    @Column(nullable = false, columnDefinition = "text")
    private String description;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    protected ApplicationActivity() {
    }

    public ApplicationActivity(JobApplication application, String activityType, String description, Instant occurredAt) {
        this.application = application;
        this.activityType = activityType;
        this.description = description;
        this.occurredAt = occurredAt;
    }

    public JobApplication getApplication() {
        return application;
    }

    public String getActivityType() {
        return activityType;
    }

    public String getDescription() {
        return description;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }
}
