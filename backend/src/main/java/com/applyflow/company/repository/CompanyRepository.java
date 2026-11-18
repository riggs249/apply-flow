package com.applyflow.company.repository;

import com.applyflow.company.entity.Company;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface CompanyRepository extends JpaRepository<Company, UUID> {

    Page<Company> findByUserId(UUID userId, Pageable pageable);

    @Query("""
            select c from Company c
            where c.user.id = :userId
              and (:query is null
                   or lower(c.name) like lower(concat('%', cast(:query as string), '%'))
                   or (c.industry is not null and lower(c.industry) like lower(concat('%', cast(:query as string), '%')))
                   or (c.location is not null and lower(c.location) like lower(concat('%', cast(:query as string), '%'))))
              and (:industry is null or lower(c.industry) = lower(cast(:industry as string)))
            """)
    Page<Company> search(
            @Param("userId") UUID userId,
            @Param("query") String query,
            @Param("industry") String industry,
            Pageable pageable
    );
}
