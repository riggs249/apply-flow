package com.applyflow.user.service;

import com.applyflow.auth.service.TokenService;
import com.applyflow.common.exception.ResourceNotFoundException;
import com.applyflow.user.dto.ProfileResponse;
import com.applyflow.user.dto.ProfileUpdateRequest;
import com.applyflow.user.dto.ProfileUpdateResponse;
import com.applyflow.user.entity.User;
import com.applyflow.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
public class ProfileService {

    private final UserRepository userRepository;
    private final TokenService tokenService;

    public ProfileService(UserRepository userRepository, TokenService tokenService) {
        this.userRepository = userRepository;
        this.tokenService = tokenService;
    }

    @Transactional(readOnly = true)
    public ProfileResponse get(UUID userId) {
        User user = requireUser(userId);
        return new ProfileResponse(user.getEmail(), user.getDisplayName());
    }

    public ProfileUpdateResponse update(UUID userId, ProfileUpdateRequest request) {
        User user = requireUser(userId);
        user.updateDisplayName(request.displayName().trim());
        String accessToken = tokenService.issueAccessToken(user);
        return new ProfileUpdateResponse(
                user.getEmail(),
                user.getDisplayName(),
                accessToken,
                tokenService.accessTokenExpiresInSeconds()
        );
    }

    private User requireUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }
}
