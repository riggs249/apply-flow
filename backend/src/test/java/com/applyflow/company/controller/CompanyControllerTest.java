package com.applyflow.company.controller;

import com.applyflow.company.dto.CompanyResponse;
import com.applyflow.company.service.CompanyService;
import com.applyflow.common.exception.GlobalExceptionHandler;
import com.applyflow.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

class CompanyControllerTest {

    private MockMvc mockMvc;
    private CompanyService companyService;

    @BeforeEach
    void setUp() {
        companyService = mock(CompanyService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new CompanyController(companyService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void createReturnsCreatedWithLocationHeader() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();
        when(companyService.create(any(), any())).thenReturn(new CompanyResponse(
                companyId, "Acme", null, null, null, null, null, null
        ));

        mockMvc.perform(post("/api/v1/companies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .principal(new UsernamePasswordAuthenticationToken(userId.toString(), null))
                        .content("""
                                {
                                  "name": "Acme"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "http://localhost/api/v1/companies/" + companyId));
    }

    @Test
    void findAllReturnsPage() throws Exception {
        UUID userId = UUID.randomUUID();
        when(companyService.findAll(any(), eq("acme"), eq(null), any()))
                .thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/v1/companies")
                        .param("userId", userId.toString())
                        .param("query", "acme")
                        .principal(new UsernamePasswordAuthenticationToken(userId.toString(), null)))
                .andExpect(status().isOk());
    }

    @Test
    void createRejectsBlankName() throws Exception {
        UUID userId = UUID.randomUUID();

        mockMvc.perform(post("/api/v1/companies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .principal(new UsernamePasswordAuthenticationToken(userId.toString(), null))
                        .content("""
                                {"name":" "}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.name").exists());
    }

    @Test
    void findByIdReturnsNotFoundForMissingCompany() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();
        when(companyService.findById(userId, companyId))
                .thenThrow(new ResourceNotFoundException("Company not found"));

        mockMvc.perform(get("/api/v1/companies/{companyId}", companyId)
                        .principal(new UsernamePasswordAuthenticationToken(userId.toString(), null)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Company not found"));
    }
}
