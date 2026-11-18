package com.applyflow.company.mapper;

import com.applyflow.company.dto.CompanyResponse;
import com.applyflow.company.entity.Company;
import org.springframework.stereotype.Component;

@Component
public class CompanyMapper {

    public CompanyResponse toResponse(Company company) {
        return new CompanyResponse(
                company.getId(),
                company.getName(),
                company.getWebsite(),
                company.getIndustry(),
                company.getLocation(),
                company.getNotes(),
                company.getCreatedAt(),
                company.getUpdatedAt()
        );
    }
}
