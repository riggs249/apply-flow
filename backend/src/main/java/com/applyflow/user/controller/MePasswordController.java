package com.applyflow.user.controller;

import com.applyflow.auth.dto.MessageResponse;
import com.applyflow.auth.service.AuthService;
import com.applyflow.user.dto.ChangePasswordRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/me/password")
public class MePasswordController {

    private final AuthService authService;

    public MePasswordController(AuthService authService) {
        this.authService = authService;
    }

    @PutMapping
    public MessageResponse changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        return authService.changePassword(UUID.fromString(authentication.getName()), request);
    }
}
