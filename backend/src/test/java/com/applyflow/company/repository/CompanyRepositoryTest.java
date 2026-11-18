package com.applyflow.company.repository;

import com.applyflow.company.entity.Company;
import com.applyflow.user.entity.User;
import com.applyflow.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
@ActiveProfiles("test")
class CompanyRepositoryTest {
    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void ownerCannotBeChangedBySavingCompanyWithAnotherUser() {
        User owner = userRepository.save(new User(
                "owner@example.com", "{bcrypt}hash", "Owner"));
        Company company = companyRepository.save(
                new Company(owner, "Acme", null, null, null, null));

        assertThat(companyRepository.findById(company.getId()))
                .isPresent()
                .get()
                .extracting(item -> item.getUser().getId())
                .isEqualTo(owner.getId());
    }

    @Test
    void companyNameIsUniquePerUser() {
        User owner = userRepository.save(new User(
                "unique@example.com", "{bcrypt}hash", "Owner"));
        companyRepository.saveAndFlush(new Company(owner, "Acme", null, null, null, null));

        assertThatThrownBy(() -> companyRepository.saveAndFlush(
                new Company(owner, "Acme", null, null, null, null)))
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
    }

    @Test
    void searchWithNullFiltersAndSortReturnsOwnedCompanies() {
        User owner = userRepository.save(new User(
                "search@example.com", "{bcrypt}hash", "Owner"));
        companyRepository.save(new Company(owner, "Zephyr", null, "Software", "Remote", null));
        companyRepository.save(new Company(owner, "Acme", "https://acme.test", null, null, null));

        var page = companyRepository.search(
                owner.getId(), null, null, PageRequest.of(0, 10, Sort.by("name")));

        assertThat(page.getTotalElements()).isEqualTo(2);
        assertThat(page.getContent()).extracting(Company::getName)
                .containsExactly("Acme", "Zephyr");
    }

    @Test
    void searchByQueryMatchesNameIndustryOrLocation() {
        User owner = userRepository.save(new User(
                "filter@example.com", "{bcrypt}hash", "Owner"));
        companyRepository.save(new Company(owner, "Linear", null, "Productivity", "Remote", null));
        companyRepository.save(new Company(owner, "Stripe", null, "Payments", "San Francisco", null));

        var byName = companyRepository.search(
                owner.getId(), "lin", null, PageRequest.of(0, 10));
        var byIndustry = companyRepository.search(
                owner.getId(), "pay", null, PageRequest.of(0, 10));
        var byLocation = companyRepository.search(
                owner.getId(), "francisco", null, PageRequest.of(0, 10));

        assertThat(byName).extracting(Company::getName).containsExactly("Linear");
        assertThat(byIndustry).extracting(Company::getName).containsExactly("Stripe");
        assertThat(byLocation).extracting(Company::getName).containsExactly("Stripe");
    }
}
