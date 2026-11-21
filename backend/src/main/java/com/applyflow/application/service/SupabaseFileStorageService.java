package com.applyflow.application.service;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "app.storage.type", havingValue = "supabase")
public class SupabaseFileStorageService implements FileStorageService {
    private static final Logger log = LoggerFactory.getLogger(SupabaseFileStorageService.class);

    private final RestClient restClient;
    private final String bucket;
    private final String baseUrl;

    public SupabaseFileStorageService(
            @Value("${app.storage.supabase.url}") String supabaseUrl,
            @Value("${app.storage.supabase.service-role-key}") String serviceRoleKey,
            @Value("${app.storage.supabase.bucket:resumes}") String bucket
    ) {
        if (supabaseUrl == null || supabaseUrl.isBlank()) {
            throw new IllegalStateException("SUPABASE_URL is required when STORAGE_TYPE=supabase.");
        }
        if (serviceRoleKey == null || serviceRoleKey.isBlank()) {
            throw new IllegalStateException("SUPABASE_SERVICE_ROLE_KEY is required when STORAGE_TYPE=supabase.");
        }

        String normalizedUrl = supabaseUrl.trim();
        if (normalizedUrl.endsWith("/")) {
            normalizedUrl = normalizedUrl.substring(0, normalizedUrl.length() - 1);
        }
        validateConfig(normalizedUrl, serviceRoleKey.trim());

        this.baseUrl = normalizedUrl;
        this.bucket = bucket;
        this.restClient = RestClient.builder()
                .baseUrl(this.baseUrl)
                .defaultHeader("Authorization", "Bearer " + serviceRoleKey.trim())
                .defaultHeader("apikey", serviceRoleKey.trim())
                .build();
    }

    @PostConstruct
    void ensureBucket() {
        try {
            restClient.get()
                    .uri("/storage/v1/bucket/{bucket}", bucket)
                    .retrieve()
                    .toBodilessEntity();
            return;
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().value() != 404) {
                throw new IllegalStateException(bucketErrorMessage(ex), ex);
            }
        }

        try {
            restClient.post()
                    .uri("/storage/v1/bucket")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "id", bucket,
                            "name", bucket,
                            "public", false,
                            "file_size_limit", 10_485_760
                    ))
                    .retrieve()
                    .toBodilessEntity();
            log.info("Created private Supabase storage bucket '{}'.", bucket);
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().value() == 409) {
                return;
            }
            throw new IllegalStateException(bucketErrorMessage(ex), ex);
        }
    }

    @Override
    public String store(UUID userId, UUID resumeId, MultipartFile file) {
        String key = userId + "/" + resumeId + ".pdf";
        try {
            byte[] bytes = file.getBytes();
            restClient.post()
                    .uri("/storage/v1/object/{bucket}/{userId}/{fileName}", bucket, userId, resumeId + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .header("x-upsert", "true")
                    .body(bytes)
                    .retrieve()
                    .toBodilessEntity();
            return key;
        } catch (IOException | RestClientResponseException ex) {
            throw new IllegalStateException("Could not store resume file in Supabase.", ex);
        }
    }

    @Override
    public Resource load(String storageKey) {
        try {
            ObjectPath path = ObjectPath.parse(storageKey);
            byte[] bytes = restClient.get()
                    .uri("/storage/v1/object/{bucket}/{userId}/{fileName}", bucket, path.userId(), path.fileName())
                    .retrieve()
                    .body(byte[].class);
            if (bytes == null || bytes.length == 0) {
                throw new IllegalStateException("Resume file not found: " + storageKey);
            }
            return new ByteArrayResource(bytes) {
                @Override
                public String getFilename() {
                    return path.fileName();
                }
            };
        } catch (RestClientResponseException ex) {
            throw new IllegalStateException("Could not read resume file from Supabase.", ex);
        }
    }

    @Override
    public void delete(String storageKey) {
        try {
            ObjectPath path = ObjectPath.parse(storageKey);
            restClient.delete()
                    .uri("/storage/v1/object/{bucket}/{userId}/{fileName}", bucket, path.userId(), path.fileName())
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().value() != 404) {
                throw new IllegalStateException("Could not delete resume file from Supabase.", ex);
            }
        }
    }

    private void validateConfig(String url, String serviceRoleKey) {
        String lower = url.toLowerCase(Locale.ENGLISH);
        if (lower.contains("pooler.supabase.com") || lower.contains("db.") && lower.contains("supabase")) {
            throw new IllegalStateException(
                    "SUPABASE_URL looks like a database host. Use the Project URL from Supabase → Project Settings → API, "
                            + "e.g. https://YOUR_PROJECT_REF.supabase.co (not the pooler hostname)."
            );
        }
        if (!lower.matches("https://[a-z0-9-]+\\.supabase\\.co")) {
            throw new IllegalStateException(
                    "SUPABASE_URL must look like https://YOUR_PROJECT_REF.supabase.co. Current value: " + url
            );
        }
        if (!serviceRoleKey.startsWith("eyJ") || serviceRoleKey.length() < 100) {
            throw new IllegalStateException(
                    "SUPABASE_SERVICE_ROLE_KEY looks invalid. Copy the service_role key (a long JWT starting with eyJ) "
                            + "from Supabase → Project Settings → API. Do not use the database password."
            );
        }
    }

    private String bucketErrorMessage(RestClientResponseException ex) {
        return "Could not ensure Supabase storage bucket '" + bucket + "' via " + baseUrl
                + " (HTTP " + ex.getStatusCode().value() + "). "
                + "Confirm SUPABASE_URL is https://YOUR_PROJECT_REF.supabase.co and the service_role key is correct.";
    }

    private record ObjectPath(String userId, String fileName) {
        static ObjectPath parse(String storageKey) {
            if (storageKey == null || storageKey.isBlank() || !storageKey.contains("/")) {
                throw new IllegalArgumentException("Invalid storage key: " + storageKey);
            }
            int slash = storageKey.lastIndexOf('/');
            return new ObjectPath(storageKey.substring(0, slash), storageKey.substring(slash + 1));
        }
    }
}
