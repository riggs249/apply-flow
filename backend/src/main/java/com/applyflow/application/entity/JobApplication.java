package com.applyflow.application.entity;

import com.applyflow.common.persistence.BaseEntity;
import com.applyflow.company.entity.Company;
import com.applyflow.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.math.BigDecimal;

@Entity
@Table(name = "job_applications")
public class JobApplication extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "job_title", nullable = false, length = 200)
    private String jobTitle;

    @Column(name = "job_description", columnDefinition = "text")
    private String jobDescription;

    @Column(name = "job_url", length = 1_000)
    private String jobUrl;

    @Column(length = 150)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_type", length = 30)
    private EmploymentType employmentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "work_arrangement", length = 30)
    private WorkArrangement workArrangement;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ApplicationStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "process_stage", length = 30)
    private ProcessStage processStage;

    @Column(name = "applied_at")
    private LocalDate appliedAt;

    @Column(name = "salary_range", length = 100)
    private String salaryRange;

    @Column(name = "salary_expectation", precision = 12, scale = 2)
    private BigDecimal salaryExpectation;

    @Column(name = "resume_version", length = 150)
    private String resumeVersion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id")
    private Resume resume;

    @Column(columnDefinition = "text")
    private String notes;

    protected JobApplication() {
    }

    public JobApplication(User user, Company company, String jobTitle, String jobDescription, String jobUrl,
                          String location, EmploymentType employmentType, WorkArrangement workArrangement,
                          ApplicationStatus status, ProcessStage processStage, LocalDate appliedAt,
                          BigDecimal salaryExpectation, Resume resume, String notes) {
        this(user, company, jobTitle, jobDescription, jobUrl, location, employmentType, workArrangement,
                status, processStage, appliedAt, salaryExpectation, resume, null, notes);
    }

    public JobApplication(User user, Company company, String jobTitle, String jobDescription, String jobUrl,
                          String location, EmploymentType employmentType, WorkArrangement workArrangement,
                          ApplicationStatus status, ProcessStage processStage, LocalDate appliedAt,
                          BigDecimal salaryExpectation, Resume resume, String legacyResumeVersion, String notes) {
        this.user = user;
        this.company = company;
        this.jobTitle = jobTitle;
        this.jobDescription = jobDescription;
        this.jobUrl = jobUrl;
        this.location = location;
        this.employmentType = employmentType;
        this.workArrangement = workArrangement;
        applyStatus(status, processStage);
        this.appliedAt = appliedAt;
        this.salaryExpectation = salaryExpectation;
        this.resume = resume;
        this.resumeVersion = resume != null ? resume.getTitle() : legacyResumeVersion;
        this.notes = notes;
    }

    public void update(String jobTitle, String jobDescription, String jobUrl, String location,
                       EmploymentType employmentType, WorkArrangement workArrangement,
                       ApplicationStatus status, ProcessStage processStage, LocalDate appliedAt,
                       BigDecimal salaryExpectation, Resume resume, String notes) {
        this.jobTitle = jobTitle;
        this.jobDescription = jobDescription;
        this.jobUrl = jobUrl;
        this.location = location;
        this.employmentType = employmentType;
        this.workArrangement = workArrangement;
        applyStatus(status, processStage);
        this.appliedAt = appliedAt;
        this.salaryExpectation = salaryExpectation;
        this.resume = resume;
        this.resumeVersion = resume != null ? resume.getTitle() : this.resumeVersion;
        this.notes = notes;
    }

    public void changeStatus(ApplicationStatus status, ProcessStage processStage) {
        applyStatus(status, processStage);
    }

    public void clearResume() {
        this.resume = null;
    }

    private void applyStatus(ApplicationStatus status, ProcessStage processStage) {
        this.status = status;
        this.processStage = status == ApplicationStatus.IN_PROCESS ? processStage : null;
    }

    public User getUser() { return user; }
    public Company getCompany() { return company; }
    public String getJobTitle() { return jobTitle; }
    public String getJobDescription() { return jobDescription; }
    public String getJobUrl() { return jobUrl; }
    public String getLocation() { return location; }
    public EmploymentType getEmploymentType() { return employmentType; }
    public WorkArrangement getWorkArrangement() { return workArrangement; }
    public ApplicationStatus getStatus() { return status; }
    public ProcessStage getProcessStage() { return processStage; }
    public LocalDate getAppliedAt() { return appliedAt; }
    public BigDecimal getSalaryExpectation() { return salaryExpectation; }
    public String getResumeVersion() { return resumeVersion; }
    public Resume getResume() { return resume; }
    public String getNotes() { return notes; }
}
