package com.applyflow.user.controller;

import com.applyflow.user.dto.NotificationSettingsResponse;
import com.applyflow.user.dto.NotificationSettingsUpdateRequest;
import com.applyflow.user.service.NotificationSettingsService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/me/notification-settings")
public class MeNotificationSettingsController {

    private final NotificationSettingsService service;

    public MeNotificationSettingsController(NotificationSettingsService service) {
        this.service = service;
    }

    @GetMapping
    public NotificationSettingsResponse get(Authentication authentication) {
        return service.get(userId(authentication));
    }

    @PutMapping
    public NotificationSettingsResponse update(
            Authentication authentication,
            @Valid @RequestBody NotificationSettingsUpdateRequest request
    ) {
        return service.update(userId(authentication), request);
    }

    private UUID userId(Authentication authentication) {
        return UUID.fromString(authentication.getName());
    }
}
