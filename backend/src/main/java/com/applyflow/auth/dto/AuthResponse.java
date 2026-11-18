package com.applyflow.auth.dto;

public record AuthResponse(String accessToken, String refreshToken, long expiresInSeconds) {
}
