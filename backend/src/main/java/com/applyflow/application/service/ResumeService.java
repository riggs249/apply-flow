package com.applyflow.application.service;

import com.applyflow.application.dto.ResumeResponse;
import com.applyflow.application.dto.ResumeUpdateRequest;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface ResumeService {
    List<ResumeResponse> findAll(UUID userId);

    ResumeResponse create(UUID userId, String title, String description, MultipartFile file);

    ResumeResponse update(UUID userId, UUID resumeId, ResumeUpdateRequest request);

    Resource loadFile(UUID userId, UUID resumeId);

    String contentType(UUID userId, UUID resumeId);

    String fileName(UUID userId, UUID resumeId);

    void delete(UUID userId, UUID resumeId);
}
