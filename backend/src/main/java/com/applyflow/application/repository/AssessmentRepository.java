package com.applyflow.application.repository;

import com.applyflow.application.entity.Assessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.applyflow.application.entity.AssessmentStatus;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AssessmentRepository extends JpaRepository<Assessment, UUID> {
    @Query("""
            select a from Assessment a
            join fetch a.application application
            join fetch application.company
            where application.user.id = :userId
            order by a.dueAt asc nulls last
            """)
    List<Assessment> findAllOwned(@Param("userId") UUID userId);

    @Query("""
            select a from Assessment a
            join fetch a.application application
            join fetch application.company
            where application.user.id = :userId
              and application.id = :applicationId
            order by a.dueAt asc nulls last
            """)
    List<Assessment> findOwnedByApplicationId(@Param("userId") UUID userId,
                                              @Param("applicationId") UUID applicationId);

    @Query("""
            select a from Assessment a
            where a.id = :assessmentId and a.application.user.id = :userId
            """)
    Optional<Assessment> findOwned(@Param("userId") UUID userId, @Param("assessmentId") UUID assessmentId);

    @Query("""
            select a from Assessment a
            join fetch a.application application
            join fetch application.company
            join fetch application.user
            where a.dueAt is not null
              and a.dueAt <= :horizon
              and a.status in :statuses
              and (
                   a.leadEmails.emailed24hAt is null
                or a.leadEmails.emailed1hAt is null
                or a.leadEmails.emailedDueAt is null
              )
            """)
    List<Assessment> findNeedingLeadEmails(@Param("statuses") Collection<AssessmentStatus> statuses,
                                           @Param("horizon") Instant horizon);
}
