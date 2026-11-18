package com.applyflow.auth.service;

import com.applyflow.auth.dto.AuthResponse;
import com.applyflow.auth.dto.LoginRequest;
import com.applyflow.auth.dto.RefreshRequest;
import com.applyflow.auth.dto.RegisterRequest;

import java.util.UUID;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refresh(RefreshRequest request);

    void logout(UUID userId, String refreshToken);
}
