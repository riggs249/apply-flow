package com.applyflow.security.ratelimit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "app.rate-limit.enabled=true",
        "app.rate-limit.window-seconds=60",
        "app.rate-limit.login-per-window=2",
        "app.rate-limit.email-per-window=1"
})
class AuthRateLimitFilterTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private InMemoryRateLimiter rateLimiter;

    @BeforeEach
    void clearBuckets() {
        rateLimiter.clear();
    }

    @Test
    void loginReturns429AfterExceedingLimit() throws Exception {
        String body = """
                {"email":"missing@example.com","password":"password123"}
                """;

        mockMvc.perform(post("/api/v1/auth/login").contentType("application/json").content(body))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/auth/login").contentType("application/json").content(body))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/auth/login").contentType("application/json").content(body))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.status").value(429))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Too many requests")));
    }

    @Test
    void forgotPasswordUsesStricterEmailLimit() throws Exception {
        String body = """
                {"email":"someone@example.com"}
                """;

        mockMvc.perform(post("/api/v1/auth/forgot-password").contentType("application/json").content(body))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/auth/forgot-password").contentType("application/json").content(body))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("Retry-After", org.hamcrest.Matchers.not(org.hamcrest.Matchers.blankOrNullString())));
    }
}
