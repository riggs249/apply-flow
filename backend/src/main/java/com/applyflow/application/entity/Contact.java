package com.applyflow.application.entity;

import com.applyflow.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "contacts")
public class Contact extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private JobApplication application;

    @Column(name = "contact_type", nullable = false, length = 50)
    private String contactType;

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Column(length = 320)
    private String email;

    @Column(length = 50)
    private String phone;

    @Column(length = 150)
    private String role;

    protected Contact() {
    }
}
