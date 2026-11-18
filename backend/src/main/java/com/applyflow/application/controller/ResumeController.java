package com.applyflow.application.controller;

import com.applyflow.application.dto.ResumeResponse;
import com.applyflow.application.dto.ResumeUpdateRequest;
import com.applyflow.application.service.ResumeService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@Validated
@RestController
@RequestMapping("/api/v1/resumes")
public class ResumeController {
    private final ResumeService resumeService;

    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
    }

    @GetMapping
    public List<ResumeResponse> findAll(Authentication authentication) {
        return resumeService.findAll(userId(authentication));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResumeResponse> create(
            Authentication authentication,
            @RequestPart("title") String title,
            @RequestPart(value = "description", required = false) String description,
            @RequestPart("file") MultipartFile file
    ) {
        ResumeResponse response = resumeService.create(userId(authentication), title, description, file);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }

    @PutMapping("/{resumeId}")
    public ResumeResponse update(
            Authentication authentication,
            @PathVariable UUID resumeId,
            @Valid @RequestBody ResumeUpdateRequest request
    ) {
        return resumeService.update(userId(authentication), resumeId, request);
    }

    @GetMapping("/{resumeId}/file")
    public ResponseEntity<Resource> file(Authentication authentication, @PathVariable UUID resumeId) {
        UUID userId = userId(authentication);
        Resource resource = resumeService.loadFile(userId, resumeId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(resumeService.contentType(userId, resumeId)))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + resumeService.fileName(userId, resumeId).replace("\"", "") + "\"")
                .body(resource);
    }

    @DeleteMapping("/{resumeId}")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable UUID resumeId) {
        resumeService.delete(userId(authentication), resumeId);
        return ResponseEntity.noContent().build();
    }

    private UUID userId(Authentication authentication) {
        return UUID.fromString(authentication.getName());
    }
}
