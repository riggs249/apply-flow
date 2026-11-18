package com.applyflow.company.service;

import com.applyflow.company.dto.CompanyCreateRequest;
import com.applyflow.company.dto.CompanyResponse;
import com.applyflow.company.dto.CompanyUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface CompanyService {

    Page<CompanyResponse> findAll(UUID userId, String query, String industry, Pageable pageable);

    CompanyResponse findById(UUID userId, UUID companyId);

    CompanyResponse create(UUID userId, CompanyCreateRequest request);

    CompanyResponse update(UUID userId, UUID companyId, CompanyUpdateRequest request);

    void delete(UUID userId, UUID companyId);
}
