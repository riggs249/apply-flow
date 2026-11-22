package com.applyflow.auth.service;

import com.applyflow.auth.dto.AuthResponse;
import com.applyflow.auth.dto.ForgotPasswordRequest;
import com.applyflow.auth.dto.LoginRequest;
import com.applyflow.auth.dto.MessageResponse;
import com.applyflow.auth.dto.RefreshRequest;
import com.applyflow.auth.dto.RegisterRequest;
import com.applyflow.auth.dto.ResendVerificationRequest;
import com.applyflow.auth.dto.ResetPasswordRequest;
import com.applyflow.auth.dto.VerifyEmailRequest;
import com.applyflow.user.dto.ChangePasswordRequest;

import java.util.UUID;

public interface AuthService {

    MessageResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refresh(RefreshRequest request);

    void logout(UUID userId, String refreshToken);

    AuthResponse verifyEmail(VerifyEmailRequest request);

    MessageResponse resendVerification(ResendVerificationRequest request);

    MessageResponse forgotPassword(ForgotPasswordRequest request);

    MessageResponse resetPassword(ResetPasswordRequest request);

    MessageResponse changePassword(UUID userId, ChangePasswordRequest request);
}
