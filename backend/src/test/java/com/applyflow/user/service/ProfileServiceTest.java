package com.applyflow.user.service;

import com.applyflow.auth.service.TokenService;
import com.applyflow.user.dto.ProfileUpdateRequest;
import com.applyflow.user.entity.User;
import com.applyflow.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock UserRepository userRepository;
    @Mock TokenService tokenService;
    @InjectMocks ProfileService service;

    @Test
    void updateChangesDisplayNameAndReissuesAccessToken() {
        UUID userId = UUID.randomUUID();
        User user = new User("alex@example.com", "hash", "Alex", true);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(tokenService.issueAccessToken(user)).thenReturn("new-access-token");
        when(tokenService.accessTokenExpiresInSeconds()).thenReturn(900L);

        var response = service.update(userId, new ProfileUpdateRequest("  Alex Rivera  "));

        assertThat(user.getDisplayName()).isEqualTo("Alex Rivera");
        assertThat(response.displayName()).isEqualTo("Alex Rivera");
        assertThat(response.email()).isEqualTo("alex@example.com");
        assertThat(response.accessToken()).isEqualTo("new-access-token");
        assertThat(response.expiresInSeconds()).isEqualTo(900L);
        verify(tokenService).issueAccessToken(user);
    }
}
