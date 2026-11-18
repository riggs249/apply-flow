package com.applyflow.application.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {
    private final Path root;

    public FileStorageService(@Value("${app.upload-dir:./uploads}") String uploadDir) throws IOException {
        this.root = Path.of(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(this.root);
    }

    public String store(UUID userId, UUID resumeId, MultipartFile file) {
        try {
            Path userDir = root.resolve(userId.toString());
            Files.createDirectories(userDir);
            String key = userId + "/" + resumeId + ".pdf";
            Path target = root.resolve(key).normalize();
            if (!target.startsWith(root)) {
                throw new IllegalArgumentException("Invalid storage path.");
            }
            try (InputStream input = file.getInputStream()) {
                Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return key;
        } catch (IOException ex) {
            throw new IllegalStateException("Could not store resume file.", ex);
        }
    }

    public Path resolve(String storageKey) {
        Path path = root.resolve(storageKey).normalize();
        if (!path.startsWith(root)) {
            throw new IllegalArgumentException("Invalid storage path.");
        }
        return path;
    }

    public void delete(String storageKey) {
        try {
            Files.deleteIfExists(resolve(storageKey));
        } catch (IOException ex) {
            throw new IllegalStateException("Could not delete resume file.", ex);
        }
    }
}
