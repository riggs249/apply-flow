package com.applyflow.application.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface FileStorageService {
    String store(UUID userId, UUID resumeId, MultipartFile file);

    Resource load(String storageKey);

    void delete(String storageKey);
}
