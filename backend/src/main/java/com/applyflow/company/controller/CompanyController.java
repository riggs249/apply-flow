package com.applyflow.company.controller;

import com.applyflow.company.dto.CompanyCreateRequest;
import com.applyflow.company.dto.CompanyResponse;
import com.applyflow.company.dto.CompanyUpdateRequest;
import com.applyflow.company.service.CompanyService;
import com.applyflow.common.dto.PageResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.UUID;

@Validated
@RestController
@RequestMapping("/api/v1/companies")
public class CompanyController {

    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    @GetMapping
    public PageResponse<CompanyResponse> findAll(
            Authentication authentication,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String industry,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String direction
    ) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), sort(sortBy, direction));
        return PageResponse.from(companyService.findAll(userId(authentication), query, industry, pageable));
    }

    @GetMapping("/{companyId}")
    public CompanyResponse findById(
            Authentication authentication,
            @PathVariable UUID companyId
    ) {
        return companyService.findById(userId(authentication), companyId);
    }

    @PostMapping
    public ResponseEntity<CompanyResponse> create(Authentication authentication, @Valid @RequestBody CompanyCreateRequest request) {
        CompanyResponse response = companyService.create(userId(authentication), request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }

    @PutMapping("/{companyId}")
    public CompanyResponse update(
            Authentication authentication,
            @PathVariable UUID companyId,
            @Valid @RequestBody CompanyUpdateRequest request
    ) {
        return companyService.update(userId(authentication), companyId, request);
    }

    @DeleteMapping("/{companyId}")
    public ResponseEntity<Void> delete(
            Authentication authentication,
            @PathVariable UUID companyId
    ) {
        companyService.delete(userId(authentication), companyId);
        return ResponseEntity.noContent().build();
    }

    private Sort sort(String sortBy, String direction) {
        Sort.Direction sortDirection = "desc".equalsIgnoreCase(direction)
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;
        return Sort.by(sortDirection, sortBy);
    }

    private UUID userId(Authentication authentication) {
        return UUID.fromString(authentication.getName());
    }
}
