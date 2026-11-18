package com.applyflow.application.repository;

import com.applyflow.application.entity.ApplicationStatus;
import com.applyflow.application.entity.EmploymentType;
import com.applyflow.application.entity.JobApplication;
import com.applyflow.application.entity.WorkArrangement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface JobApplicationRepository extends JpaRepository<JobApplication, UUID> {

    long countByUserId(UUID userId);

    long countByUserIdAndStatus(UUID userId, ApplicationStatus status);

    List<JobApplication> findByUserIdAndResumeId(UUID userId, UUID resumeId);

    @Query("""
            select a from JobApplication a
            join a.company c
            where a.user.id = :userId
              and (:status is null or a.status = :status)
              and (:employmentType is null or a.employmentType = :employmentType)
              and (:workArrangement is null or a.workArrangement = :workArrangement)
              and (:filterFrom = false or a.appliedAt >= :fromDate)
              and (:filterTo = false or a.appliedAt <= :toDate)
            """)
    Page<JobApplication> findAllOwned(
            @Param("userId") UUID userId,
            @Param("status") ApplicationStatus status,
            @Param("employmentType") EmploymentType employmentType,
            @Param("workArrangement") WorkArrangement workArrangement,
            @Param("filterFrom") boolean filterFrom,
            @Param("fromDate") LocalDate fromDate,
            @Param("filterTo") boolean filterTo,
            @Param("toDate") LocalDate toDate,
            Pageable pageable
    );

    @Query("""
            select count(a) from JobApplication a
            where a.user.id = :userId
              and (:filterFrom = false or a.appliedAt >= :fromDate)
              and (:filterTo = false or a.appliedAt <= :toDate)
            """)
    long countInRange(@Param("userId") UUID userId,
                      @Param("filterFrom") boolean filterFrom,
                      @Param("fromDate") LocalDate fromDate,
                      @Param("filterTo") boolean filterTo,
                      @Param("toDate") LocalDate toDate);

    @Query("""
            select a.status, count(a) from JobApplication a
            where a.user.id = :userId
              and (:filterFrom = false or a.appliedAt >= :fromDate)
              and (:filterTo = false or a.appliedAt <= :toDate)
            group by a.status
            """)
    List<Object[]> countByStatusInRange(@Param("userId") UUID userId,
                                        @Param("filterFrom") boolean filterFrom,
                                        @Param("fromDate") LocalDate fromDate,
                                        @Param("filterTo") boolean filterTo,
                                        @Param("toDate") LocalDate toDate);

    @Query("""
            select a.processStage, count(a) from JobApplication a
            where a.user.id = :userId
              and a.status = :inProcess
              and a.processStage is not null
              and (:filterFrom = false or a.appliedAt >= :fromDate)
              and (:filterTo = false or a.appliedAt <= :toDate)
            group by a.processStage
            """)
    List<Object[]> countByProcessStageInRange(@Param("userId") UUID userId,
                                              @Param("inProcess") ApplicationStatus inProcess,
                                              @Param("filterFrom") boolean filterFrom,
                                              @Param("fromDate") LocalDate fromDate,
                                              @Param("filterTo") boolean filterTo,
                                              @Param("toDate") LocalDate toDate);

    @Query("""
            select a.employmentType, count(a) from JobApplication a
            where a.user.id = :userId
              and (:filterFrom = false or a.appliedAt >= :fromDate)
              and (:filterTo = false or a.appliedAt <= :toDate)
            group by a.employmentType
            """)
    List<Object[]> countByEmploymentTypeInRange(@Param("userId") UUID userId,
                                                 @Param("filterFrom") boolean filterFrom,
                                                 @Param("fromDate") LocalDate fromDate,
                                                 @Param("filterTo") boolean filterTo,
                                                 @Param("toDate") LocalDate toDate);

    @Query("""
            select a.appliedAt, a.status from JobApplication a
            where a.user.id = :userId
              and (:filterFrom = false or a.appliedAt >= :fromDate)
              and (:filterTo = false or a.appliedAt <= :toDate)
            """)
    List<Object[]> findAnalyticsRows(@Param("userId") UUID userId,
                                     @Param("filterFrom") boolean filterFrom,
                                     @Param("fromDate") LocalDate fromDate,
                                     @Param("filterTo") boolean filterTo,
                                     @Param("toDate") LocalDate toDate);

    @Query("""
            select a from JobApplication a
            join a.company c
            where a.user.id = :userId
              and (:query is null
                   or lower(a.jobTitle) like lower(concat('%', cast(:query as string), '%'))
                   or lower(c.name) like lower(concat('%', cast(:query as string), '%')))
              and (:status is null or a.status = :status)
              and (:employmentType is null or a.employmentType = :employmentType)
              and (:workArrangement is null or a.workArrangement = :workArrangement)
              and (:filterFrom = false or a.appliedAt >= :fromDate)
              and (:filterTo = false or a.appliedAt <= :toDate)
            """)
    Page<JobApplication> search(
            @Param("userId") UUID userId,
            @Param("query") String query,
            @Param("status") ApplicationStatus status,
            @Param("employmentType") EmploymentType employmentType,
            @Param("workArrangement") WorkArrangement workArrangement,
            @Param("filterFrom") boolean filterFrom,
            @Param("fromDate") LocalDate fromDate,
            @Param("filterTo") boolean filterTo,
            @Param("toDate") LocalDate toDate,
            Pageable pageable
    );
}
