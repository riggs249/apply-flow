package com.applyflow.user.controller;

import com.applyflow.user.dto.ProfileResponse;
import com.applyflow.user.dto.ProfileUpdateRequest;
import com.applyflow.user.dto.ProfileUpdateResponse;
import com.applyflow.user.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/me/profile")
public class MeProfileController {

    private final ProfileService service;

    public MeProfileController(ProfileService service) {
        this.service = service;
    }

    @GetMapping
    public ProfileResponse get(Authentication authentication) {
        return service.get(userId(authentication));
    }

    @PutMapping
    public ProfileUpdateResponse update(
            Authentication authentication,
            @Valid @RequestBody ProfileUpdateRequest request
    ) {
        return service.update(userId(authentication), request);
    }

    private UUID userId(Authentication authentication) {
        return UUID.fromString(authentication.getName());
    }
}
