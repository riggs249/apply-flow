package com.applyflow.company.entity;

import com.applyflow.common.persistence.BaseEntity;
import com.applyflow.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "companies",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_company_user_name",
                columnNames = {"user_id", "name"}
        )
)
public class Company extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 500)
    private String website;

    @Column(length = 100)
    private String industry;

    @Column(length = 150)
    private String location;

    @Column(columnDefinition = "text")
    private String notes;

    protected Company() {
    }

    public Company(User user, String name, String website, String industry, String location, String notes) {
        this.user = user;
        this.name = name;
        this.website = website;
        this.industry = industry;
        this.location = location;
        this.notes = notes;
    }

    public User getUser() {
        return user;
    }

    public String getName() {
        return name;
    }

    public String getWebsite() {
        return website;
    }

    public String getIndustry() {
        return industry;
    }

    public String getLocation() {
        return location;
    }

    public String getNotes() {
        return notes;
    }

    public void update(String name, String website, String industry, String location, String notes) {
        this.name = name;
        this.website = website;
        this.industry = industry;
        this.location = location;
        this.notes = notes;
    }
}
