package com.applyflow.application.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "app.storage.type", havingValue = "local", matchIfMissing = true)
public class LocalFileStorageService implements FileStorageService {
    private final Path root;

    public LocalFileStorageService(@Value("${app.storage.upload-dir:${app.upload-dir:./uploads}}") String uploadDir)
            throws IOException {
        this.root = Path.of(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(this.root);
    }

    @Override
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

    @Override
    public Resource load(String storageKey) {
        try {
            Path path = resolve(storageKey);
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new IllegalStateException("Resume file not found: " + storageKey);
            }
            return resource;
        } catch (MalformedURLException ex) {
            throw new IllegalStateException("Could not read resume file.", ex);
        }
    }

    @Override
    public void delete(String storageKey) {
        try {
            Files.deleteIfExists(resolve(storageKey));
        } catch (IOException ex) {
            throw new IllegalStateException("Could not delete resume file.", ex);
        }
    }

    private Path resolve(String storageKey) {
        Path path = root.resolve(storageKey).normalize();
        if (!path.startsWith(root)) {
            throw new IllegalArgumentException("Invalid storage path.");
        }
        return path;
    }
}
