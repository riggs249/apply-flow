package com.applyflow.application.entity;

import com.applyflow.common.persistence.BaseEntity;
import com.applyflow.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "resumes")
public class Resume extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 1_000)
    private String description;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "storage_key", nullable = false, length = 500)
    private String storageKey;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    protected Resume() {
    }

    public Resume(User user, String title, String description, String fileName,
                  String storageKey, String contentType, Long fileSize) {
        this.user = user;
        this.title = title;
        this.description = description;
        this.fileName = fileName;
        this.storageKey = storageKey;
        this.contentType = contentType;
        this.fileSize = fileSize;
    }

    public void updateMetadata(String title, String description) {
        this.title = title;
        this.description = description;
    }

    public void assignStorage(String storageKey, String fileName, String contentType, Long fileSize) {
        this.storageKey = storageKey;
        this.fileName = fileName;
        this.contentType = contentType;
        this.fileSize = fileSize;
    }

    public User getUser() { return user; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getFileName() { return fileName; }
    public String getStorageKey() { return storageKey; }
    public String getContentType() { return contentType; }
    public Long getFileSize() { return fileSize; }
}
