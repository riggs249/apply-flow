package com.applyflow.user.dto;

public record ProfileUpdateResponse(
        String email,
        String displayName,
        String accessToken,
        long expiresInSeconds
) {
}
