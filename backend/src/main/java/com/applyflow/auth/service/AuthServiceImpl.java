package com.applyflow.auth.service;

import com.applyflow.auth.dto.AuthResponse;
import com.applyflow.auth.dto.LoginRequest;
import com.applyflow.auth.dto.MessageResponse;
import com.applyflow.auth.dto.RefreshRequest;
import com.applyflow.auth.dto.RegisterRequest;
import com.applyflow.auth.dto.ResendVerificationRequest;
import com.applyflow.auth.dto.VerifyEmailRequest;
import com.applyflow.auth.entity.EmailVerificationToken;
import com.applyflow.auth.entity.RefreshToken;
import com.applyflow.auth.repository.EmailVerificationTokenRepository;
import com.applyflow.notification.NotificationEmailMessage;
import com.applyflow.user.entity.User;
import com.applyflow.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;
    private final EmailVerificationTokenRepository verificationTokenRepository;
    private final EmailService emailService;
    private final String frontendUrl;
    private final long verificationTokenHours;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthServiceImpl(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            TokenService tokenService,
            EmailVerificationTokenRepository verificationTokenRepository,
            EmailService emailService,
            @Value("${app.frontend-url}") String frontendUrl,
            @Value("${app.security.verification-token-hours:24}") long verificationTokenHours
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenService = tokenService;
        this.verificationTokenRepository = verificationTokenRepository;
        this.emailService = emailService;
        this.frontendUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
        this.verificationTokenHours = verificationTokenHours;
    }

    @Override
    public MessageResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("Email is already registered");
        }
        User user = userRepository.save(new User(
                email,
                passwordEncoder.encode(request.password()),
                request.displayName().trim(),
                false
        ));
        issueVerificationEmail(user);
        return new MessageResponse(
                "Account created. Check your email to verify your address before signing in.",
                user.getEmail()
        );
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );
        User user = (User) authentication.getPrincipal();
        if (!user.isEmailVerified()) {
            throw new IllegalArgumentException(
                    "Please verify your email before signing in. Check your inbox for the verification link."
            );
        }
        return tokenService.issue(user);
    }

    @Override
    public AuthResponse refresh(RefreshRequest request) {
        RefreshToken oldToken = tokenService.findUsable(request.refreshToken());
        User user = oldToken.getUser();
        if (!user.isEmailVerified()) {
            throw new IllegalArgumentException("Please verify your email before continuing.");
        }
        oldToken.revoke();
        return tokenService.issue(user);
    }

    @Override
    public void logout(UUID userId, String refreshToken) {
        RefreshToken token = tokenService.findUsable(refreshToken);
        if (!token.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Refresh token does not belong to the authenticated user");
        }
        token.revoke();
    }

    @Override
    public AuthResponse verifyEmail(VerifyEmailRequest request) {
        EmailVerificationToken token = verificationTokenRepository.findByTokenHash(hash(request.token().trim()))
                .filter(item -> item.isUsable(Instant.now()))
                .orElseThrow(() -> new IllegalArgumentException("Verification link is invalid or has expired."));

        User user = token.getUser();
        user.markEmailVerified();
        token.markUsed(Instant.now());
        verificationTokenRepository.deleteUnusedByUserId(user.getId());
        return tokenService.issue(user);
    }

    @Override
    public MessageResponse resendVerification(ResendVerificationRequest request) {
        String email = request.email().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        // Always return the same message to avoid email enumeration.
        String message = "If that email needs verification, we sent a new link.";
        if (user == null || user.isEmailVerified()) {
            return new MessageResponse(message, email);
        }
        issueVerificationEmail(user);
        return new MessageResponse(message, email);
    }

    private void issueVerificationEmail(User user) {
        verificationTokenRepository.deleteUnusedByUserId(user.getId());
        String rawToken = newShortToken();
        verificationTokenRepository.save(new EmailVerificationToken(
                user,
                hash(rawToken),
                Instant.now().plus(verificationTokenHours, ChronoUnit.HOURS)
        ));
        String verificationUrl = frontendUrl + "/v/" + rawToken;
        emailService.send(new NotificationEmailMessage(
                user.getEmail(),
                user.getDisplayName(),
                "Verify your HanapTracker email",
                "Welcome",
                "Confirm your email address",
                "Thanks for creating a HanapTracker account. Verify your email to start tracking applications.",
                List.of(),
                verificationUrl,
                "Verify email",
                "This link expires in 24 hours. If you did not create an account, you can ignore this message."
        ));
    }

    private String newShortToken() {
        byte[] bytes = new byte[16];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
