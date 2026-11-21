package com.applyflow.application.service;

import com.applyflow.application.dto.ResumeResponse;
import com.applyflow.application.dto.ResumeUpdateRequest;
import com.applyflow.application.entity.JobApplication;
import com.applyflow.application.entity.Resume;
import com.applyflow.application.repository.JobApplicationRepository;
import com.applyflow.application.repository.ResumeRepository;
import com.applyflow.common.exception.ResourceNotFoundException;
import com.applyflow.user.entity.User;
import com.applyflow.user.repository.UserRepository;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@Transactional
public class ResumeServiceImpl implements ResumeService {
    private static final String PDF_CONTENT_TYPE = "application/pdf";
    private static final long MAX_BYTES = 10L * 1024 * 1024;

    private final ResumeRepository resumeRepository;
    private final JobApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public ResumeServiceImpl(ResumeRepository resumeRepository,
                             JobApplicationRepository applicationRepository,
                             UserRepository userRepository,
                             FileStorageService fileStorageService) {
        this.resumeRepository = resumeRepository;
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResumeResponse> findAll(UUID userId) {
        return resumeRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public ResumeResponse create(UUID userId, String title, String description, MultipartFile file) {
        validatePdf(file);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        Resume resume = new Resume(
                user,
                requireTitle(title),
                normalizeDescription(description),
                safeFileName(file.getOriginalFilename()),
                "pending",
                PDF_CONTENT_TYPE,
                file.getSize()
        );
        Resume saved = resumeRepository.save(resume);
        String storageKey = fileStorageService.store(userId, saved.getId(), file);
        saved.assignStorage(storageKey, safeFileName(file.getOriginalFilename()), PDF_CONTENT_TYPE, file.getSize());
        return toResponse(saved);
    }

    @Override
    public ResumeResponse update(UUID userId, UUID resumeId, ResumeUpdateRequest request) {
        Resume resume = getOwned(userId, resumeId);
        resume.updateMetadata(requireTitle(request.title()), normalizeDescription(request.description()));
        return toResponse(resume);
    }

    @Override
    @Transactional(readOnly = true)
    public Resource loadFile(UUID userId, UUID resumeId) {
        Resume resume = getOwned(userId, resumeId);
        try {
            Resource resource = fileStorageService.load(resume.getStorageKey());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResourceNotFoundException("Resume file not found: " + resumeId);
            }
            return resource;
        } catch (IllegalStateException ex) {
            throw new ResourceNotFoundException("Resume file not found: " + resumeId);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public String contentType(UUID userId, UUID resumeId) {
        return getOwned(userId, resumeId).getContentType();
    }

    @Override
    @Transactional(readOnly = true)
    public String fileName(UUID userId, UUID resumeId) {
        return getOwned(userId, resumeId).getFileName();
    }

    @Override
    public void delete(UUID userId, UUID resumeId) {
        Resume resume = getOwned(userId, resumeId);
        for (JobApplication application : applicationRepository.findByUserIdAndResumeId(userId, resumeId)) {
            application.clearResume();
        }
        String storageKey = resume.getStorageKey();
        resumeRepository.delete(resume);
        if (!"pending".equals(storageKey)) {
            fileStorageService.delete(storageKey);
        }
    }

    private Resume getOwned(UUID userId, UUID resumeId) {
        return resumeRepository.findByIdAndUserId(resumeId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume not found: " + resumeId));
    }

    private void validatePdf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("A PDF file is required.");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new IllegalArgumentException("Resume files must be 10MB or smaller.");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ENGLISH);
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ENGLISH);
        if (!PDF_CONTENT_TYPE.equals(contentType) && !name.endsWith(".pdf")) {
            throw new IllegalArgumentException("Only PDF resumes are supported.");
        }
    }

    private String requireTitle(String title) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Title is required.");
        }
        return title.trim();
    }

    private String normalizeDescription(String description) {
        return description == null || description.isBlank() ? null : description.trim();
    }

    private String safeFileName(String original) {
        if (original == null || original.isBlank()) {
            return "resume.pdf";
        }
        String cleaned = original.replace('\\', '/');
        int slash = cleaned.lastIndexOf('/');
        return slash >= 0 ? cleaned.substring(slash + 1) : cleaned;
    }

    private ResumeResponse toResponse(Resume resume) {
        return new ResumeResponse(
                resume.getId(),
                resume.getTitle(),
                resume.getDescription(),
                resume.getFileName(),
                resume.getContentType(),
                resume.getFileSize(),
                resume.getCreatedAt(),
                resume.getUpdatedAt()
        );
    }
}
