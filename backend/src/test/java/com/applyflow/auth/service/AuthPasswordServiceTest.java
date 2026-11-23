package com.applyflow.auth.service;

import com.applyflow.auth.dto.ForgotPasswordRequest;
import com.applyflow.auth.dto.ResetPasswordRequest;
import com.applyflow.auth.entity.PasswordResetToken;
import com.applyflow.auth.repository.EmailVerificationTokenRepository;
import com.applyflow.auth.repository.PasswordResetTokenRepository;
import com.applyflow.user.dto.ChangePasswordRequest;
import com.applyflow.user.entity.User;
import com.applyflow.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthPasswordServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock AuthenticationManager authenticationManager;
    @Mock TokenService tokenService;
    @Mock EmailVerificationTokenRepository verificationTokenRepository;
    @Mock PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock EmailService emailService;

    AuthServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AuthServiceImpl(
                userRepository,
                passwordEncoder,
                authenticationManager,
                tokenService,
                verificationTokenRepository,
                passwordResetTokenRepository,
                emailService,
                "http://localhost:4200",
                24,
                1
        );
    }

    @Test
    void forgotPasswordDoesNotRevealMissingAccounts() {
        when(userRepository.findByEmailIgnoreCase("missing@example.com")).thenReturn(Optional.empty());

        var response = service.forgotPassword(new ForgotPasswordRequest("missing@example.com"));

        assertThat(response.message()).contains("If an account exists");
        verify(emailService, never()).send(any());
    }

    @Test
    void forgotPasswordSendsResetEmailForExistingUser() {
        User user = new User("alex@example.com", "hash", "Alex", true);
        when(userRepository.findByEmailIgnoreCase("alex@example.com")).thenReturn(Optional.of(user));
        when(passwordResetTokenRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        service.forgotPassword(new ForgotPasswordRequest("alex@example.com"));

        verify(passwordResetTokenRepository).deleteUnusedByUserId(user.getId());
        verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
        verify(emailService).send(any());
    }

    @Test
    void resetPasswordUpdatesHashAndRevokesSessions() {
        User user = new User("alex@example.com", "old-hash", "Alex", true);
        PasswordResetToken token = new PasswordResetToken(user, "token-hash", Instant.now().plusSeconds(3600));
        when(passwordResetTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("new-password")).thenReturn("new-hash");

        // AuthServiceImpl hashes the raw token before lookup; stub any hash lookup.
        // We intercept by making findByTokenHash return for any string.
        var response = service.resetPassword(new ResetPasswordRequest("raw-token", "new-password"));

        assertThat(user.getPasswordHash()).isEqualTo("new-hash");
        assertThat(response.message()).contains("Password updated");
        verify(tokenService).revokeAllForUser(user.getId());
        verify(passwordResetTokenRepository).deleteUnusedByUserId(user.getId());
    }

    @Test
    void changePasswordRejectsWrongCurrentPassword() {
        UUID userId = UUID.randomUUID();
        User user = new User("alex@example.com", "stored-hash", "Alex", true);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "stored-hash")).thenReturn(false);

        assertThatThrownBy(() -> service.changePassword(userId, new ChangePasswordRequest("wrong", "new-password")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Current password is incorrect");
    }

    @Test
    void changePasswordUpdatesWhenCurrentMatches() {
        UUID userId = UUID.randomUUID();
        User user = new User("alex@example.com", "stored-hash", "Alex", true);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("current-password", "stored-hash")).thenReturn(true);
        when(passwordEncoder.matches("new-password", "stored-hash")).thenReturn(false);
        when(passwordEncoder.encode("new-password")).thenReturn("new-hash");

        var response = service.changePassword(userId, new ChangePasswordRequest("current-password", "new-password"));

        assertThat(user.getPasswordHash()).isEqualTo("new-hash");
        assertThat(response.message()).contains("Password updated");
        verify(tokenService).revokeAllForUser(userId);
    }
}
