package com.applyflow.company.service;

import com.applyflow.company.dto.CompanyCreateRequest;
import com.applyflow.company.dto.CompanyResponse;
import com.applyflow.company.entity.Company;
import com.applyflow.company.mapper.CompanyMapper;
import com.applyflow.company.repository.CompanyRepository;
import com.applyflow.user.entity.User;
import com.applyflow.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CompanyServiceImplTest {

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CompanyMapper companyMapper;

    @InjectMocks
    private CompanyServiceImpl companyService;

    @Test
    void createPersistsCompanyForExistingUser() {
        UUID userId = UUID.randomUUID();
        User user = org.mockito.Mockito.mock(User.class);
        CompanyCreateRequest request = new CompanyCreateRequest(
                " Acme ", "https://acme.example", "Technology", "Remote", "Notes"
        );
        Company savedCompany = new Company(user, "Acme", request.website(), request.industry(), request.location(), request.notes());
        CompanyResponse response = new CompanyResponse(
                null, "Acme", request.website(), request.industry(), request.location(), request.notes(), null, null
        );

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(companyRepository.save(org.mockito.ArgumentMatchers.any(Company.class))).thenReturn(savedCompany);
        when(companyMapper.toResponse(savedCompany)).thenReturn(response);

        CompanyResponse result = companyService.create(userId, request);

        assertThat(result).isEqualTo(response);
        verify(companyRepository).save(org.mockito.ArgumentMatchers.any(Company.class));
    }

    @Test
    void findByIdRejectsCompanyOwnedByAnotherUser() {
        UUID ownerId = UUID.randomUUID();
        UUID attackerId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();
        User owner = org.mockito.Mockito.mock(User.class);
        when(owner.getId()).thenReturn(ownerId);
        Company company = new Company(owner, "Acme", null, null, null, null);
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));

        assertThatThrownBy(() -> companyService.findById(attackerId, companyId))
                .isInstanceOf(com.applyflow.common.exception.ResourceNotFoundException.class);
    }
}
