package com.applyflow.application.controller;

import com.applyflow.application.dto.ReminderCreateRequest;
import com.applyflow.application.dto.ReminderResponse;
import com.applyflow.application.dto.ReminderUpdateRequest;
import com.applyflow.application.service.ReminderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reminders")
public class ReminderController {
    private final ReminderService service;

    public ReminderController(ReminderService service) {
        this.service = service;
    }

    @GetMapping
    public List<ReminderResponse> findAll(Authentication authentication) {
        return service.findAll(userId(authentication));
    }

    @GetMapping("/notifications")
    public List<ReminderResponse> notifications(Authentication authentication) {
        return service.findAll(userId(authentication)).stream()
                .filter(reminder -> !"COMPLETED".equals(reminder.timingState())
                        && !"CANCELLED".equals(reminder.timingState()))
                .toList();
    }

    @GetMapping("/{reminderId}")
    public ReminderResponse findById(Authentication authentication, @PathVariable UUID reminderId) {
        return service.findById(userId(authentication), reminderId);
    }

    @PostMapping
    public ResponseEntity<ReminderResponse> create(Authentication authentication,
                                                    @Valid @RequestBody ReminderCreateRequest request) {
        ReminderResponse response = service.create(userId(authentication), request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}")
                .buildAndExpand(response.id()).toUri();
        return ResponseEntity.created(location).body(response);
    }

    @PutMapping("/{reminderId}")
    public ReminderResponse update(Authentication authentication, @PathVariable UUID reminderId,
                                   @Valid @RequestBody ReminderUpdateRequest request) {
        return service.update(userId(authentication), reminderId, request);
    }

    @PatchMapping("/{reminderId}/complete")
    public ReminderResponse complete(Authentication authentication, @PathVariable UUID reminderId) {
        return service.complete(userId(authentication), reminderId);
    }

    @PatchMapping("/{reminderId}/reopen")
    public ReminderResponse reopen(Authentication authentication, @PathVariable UUID reminderId) {
        return service.reopen(userId(authentication), reminderId);
    }

    @DeleteMapping("/{reminderId}")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable UUID reminderId) {
        service.delete(userId(authentication), reminderId);
        return ResponseEntity.noContent().build();
    }

    private UUID userId(Authentication authentication) {
        return UUID.fromString(authentication.getName());
    }
}
