package com.applyflow.application.repository;

import com.applyflow.application.entity.Interview;
import com.applyflow.application.entity.InterviewOutcome;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.Instant;

public interface InterviewRepository extends JpaRepository<Interview, UUID> {

    @Query("""
            select count(i) from Interview i
            where i.application.user.id = :userId
              and (:filterFrom = false or i.scheduledAt >= :fromInstant)
              and (:filterTo = false or i.scheduledAt <= :toInstant)
            """)
    long countScheduledInRange(@Param("userId") UUID userId,
                               @Param("filterFrom") boolean filterFrom,
                               @Param("fromInstant") Instant fromInstant,
                               @Param("filterTo") boolean filterTo,
                               @Param("toInstant") Instant toInstant);

    @Query("""
            select i.scheduledAt, i.application.id from Interview i
            where i.application.user.id = :userId
              and (:filterFrom = false or i.scheduledAt >= :fromInstant)
              and (:filterTo = false or i.scheduledAt <= :toInstant)
            """)
    List<Object[]> findAnalyticsRows(@Param("userId") UUID userId,
                                     @Param("filterFrom") boolean filterFrom,
                                     @Param("fromInstant") Instant fromInstant,
                                     @Param("filterTo") boolean filterTo,
                                     @Param("toInstant") Instant toInstant);
    @Query("""
            select i from Interview i
            join fetch i.application a
            join fetch a.company
            where a.user.id = :userId
            order by i.scheduledAt asc
            """)
    List<Interview> findAllOwned(@Param("userId") UUID userId);

    @Query("""
            select i from Interview i
            join fetch i.application a
            join fetch a.company
            where a.user.id = :userId
              and a.id = :applicationId
            order by i.scheduledAt asc
            """)
    List<Interview> findOwnedByApplicationId(@Param("userId") UUID userId,
                                             @Param("applicationId") UUID applicationId);

    @Query("""
            select i from Interview i
            where i.id = :interviewId and i.application.user.id = :userId
            """)
    Optional<Interview> findOwned(@Param("userId") UUID userId, @Param("interviewId") UUID interviewId);

    @Query("""
            select i from Interview i
            join fetch i.application a
            join fetch a.company
            join fetch a.user
            where (i.outcome is null or i.outcome in :activeOutcomes)
              and i.scheduledAt <= :horizon
              and (
                   i.leadEmails.emailed24hAt is null
                or i.leadEmails.emailed1hAt is null
                or i.leadEmails.emailedDueAt is null
              )
            """)
    List<Interview> findNeedingLeadEmails(@Param("activeOutcomes") Collection<InterviewOutcome> activeOutcomes,
                                          @Param("horizon") Instant horizon);
}
