package com.applyflow.company.service;

import com.applyflow.company.dto.CompanyCreateRequest;
import com.applyflow.company.dto.CompanyResponse;
import com.applyflow.company.dto.CompanyUpdateRequest;
import com.applyflow.company.entity.Company;
import com.applyflow.company.mapper.CompanyMapper;
import com.applyflow.company.repository.CompanyRepository;
import com.applyflow.common.exception.ResourceNotFoundException;
import com.applyflow.user.entity.User;
import com.applyflow.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
public class CompanyServiceImpl implements CompanyService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final CompanyMapper companyMapper;

    public CompanyServiceImpl(
            CompanyRepository companyRepository,
            UserRepository userRepository,
            CompanyMapper companyMapper
    ) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.companyMapper = companyMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CompanyResponse> findAll(UUID userId, String query, String industry, Pageable pageable) {
        String normalizedQuery = normalize(query);
        String normalizedIndustry = normalize(industry);
        Page<Company> companies = normalizedQuery == null && normalizedIndustry == null
                ? companyRepository.findByUserId(userId, pageable)
                : companyRepository.search(userId, normalizedQuery, normalizedIndustry, pageable);
        return companies.map(companyMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public CompanyResponse findById(UUID userId, UUID companyId) {
        return companyMapper.toResponse(getOwnedCompany(userId, companyId));
    }

    @Override
    public CompanyResponse create(UUID userId, CompanyCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        Company company = new Company(
                user,
                request.name().trim(),
                request.website(),
                request.industry(),
                request.location(),
                request.notes()
        );
        return companyMapper.toResponse(companyRepository.save(company));
    }

    @Override
    public CompanyResponse update(UUID userId, UUID companyId, CompanyUpdateRequest request) {
        Company company = getOwnedCompany(userId, companyId);
        company.update(
                request.name().trim(),
                request.website(),
                request.industry(),
                request.location(),
                request.notes()
        );
        return companyMapper.toResponse(company);
    }

    @Override
    public void delete(UUID userId, UUID companyId) {
        companyRepository.delete(getOwnedCompany(userId, companyId));
    }

    private Company getOwnedCompany(UUID userId, UUID companyId) {
        return companyRepository.findById(companyId)
                .filter(company -> company.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + companyId));
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
