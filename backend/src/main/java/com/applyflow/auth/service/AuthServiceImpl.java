package com.applyflow.auth.service;

import com.applyflow.auth.dto.AuthResponse;
import com.applyflow.auth.dto.LoginRequest;
import com.applyflow.auth.dto.RefreshRequest;
import com.applyflow.auth.dto.RegisterRequest;
import com.applyflow.auth.entity.RefreshToken;
import com.applyflow.common.exception.ResourceNotFoundException;
import com.applyflow.user.entity.User;
import com.applyflow.user.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;

    public AuthServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder,
                           AuthenticationManager authenticationManager, TokenService tokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenService = tokenService;
    }

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new IllegalArgumentException("Email is already registered");
        }
        User user = userRepository.save(new User(
                request.email().trim().toLowerCase(),
                passwordEncoder.encode(request.password()),
                request.displayName().trim()
        ));
        return tokenService.issue(user);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );
        User user = (User) authentication.getPrincipal();
        return tokenService.issue(user);
    }

    @Override
    public AuthResponse refresh(RefreshRequest request) {
        RefreshToken oldToken = tokenService.findUsable(request.refreshToken());
        oldToken.revoke();
        return tokenService.issue(oldToken.getUser());
    }

    @Override
    public void logout(UUID userId, String refreshToken) {
        RefreshToken token = tokenService.findUsable(refreshToken);
        if (!token.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Refresh token does not belong to the authenticated user");
        }
        token.revoke();
    }
}
