package com.applyflow.auth.service;

import com.applyflow.auth.dto.AuthResponse;
import com.applyflow.auth.entity.RefreshToken;
import com.applyflow.auth.repository.RefreshTokenRepository;
import com.applyflow.user.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.temporal.ChronoUnit;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class TokenService {

    private final JwtEncoder jwtEncoder;
    private final RefreshTokenRepository refreshTokenRepository;
    private final long accessTokenMinutes;
    private final long refreshTokenDays;

    public TokenService(
            JwtEncoder jwtEncoder,
            RefreshTokenRepository refreshTokenRepository,
            @Value("${app.security.access-token-minutes}") long accessTokenMinutes,
            @Value("${app.security.refresh-token-days}") long refreshTokenDays
    ) {
        this.jwtEncoder = jwtEncoder;
        this.refreshTokenRepository = refreshTokenRepository;
        this.accessTokenMinutes = accessTokenMinutes;
        this.refreshTokenDays = refreshTokenDays;
    }

    public AuthResponse issue(User user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(accessTokenMinutes, ChronoUnit.MINUTES);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("applyflow")
                .subject(user.getId().toString())
                .issuedAt(now)
                .expiresAt(expiresAt)
                .claim("email", user.getEmail())
                .build();
        String accessToken = jwtEncoder.encode(JwtEncoderParameters.from(
                org.springframework.security.oauth2.jwt.JwsHeader.with(MacAlgorithm.HS256).build(),
                claims
        )).getTokenValue();

        String refreshToken = UUID.randomUUID() + "." + UUID.randomUUID();
        refreshTokenRepository.save(new RefreshToken(
                user,
                hash(refreshToken),
                now.plus(refreshTokenDays, ChronoUnit.DAYS)
        ));
        return new AuthResponse(accessToken, refreshToken, accessTokenMinutes * 60);
    }

    public RefreshToken findUsable(String rawToken) {
        return refreshTokenRepository.findByTokenHash(hash(rawToken))
                .filter(token -> token.isUsable(Instant.now()))
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired refresh token"));
    }

    public void revoke(String rawToken) {
        findUsable(rawToken).revoke();
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
