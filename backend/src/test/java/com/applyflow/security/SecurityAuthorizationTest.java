package com.applyflow.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityAuthorizationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void companyApiRejectsUnauthenticatedRequest() throws Exception {
        mockMvc.perform(get("/api/v1/companies"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void analyticsApiRejectsUnauthenticatedRequest() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/dashboard"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void authLoginAcceptsValidRequestShapeButRejectsUnknownCredentials() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"email":"missing@example.com","password":"password123"}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void authLoginRejectsInvalidEmailAndPassword() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"email":"not-an-email","password":""}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.email").exists())
                .andExpect(jsonPath("$.validationErrors.password").exists());
    }

    @Test
    void forgotPasswordIgnoresExpiredBearerToken() throws Exception {
        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .header("Authorization", "Bearer not-a-valid-jwt")
                        .contentType("application/json")
                        .content("""
                                {"email":"someone@example.com"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists());
    }
}
