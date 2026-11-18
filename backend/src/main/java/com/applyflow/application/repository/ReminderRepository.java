package com.applyflow.application.repository;

import com.applyflow.application.entity.Reminder;
import com.applyflow.application.entity.ReminderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReminderRepository extends JpaRepository<Reminder, UUID> {

    @Query("""
            select r from Reminder r
            left join fetch r.application application
            left join fetch application.company
            where r.user.id = :userId
            order by r.remindAt asc
            """)
    List<Reminder> findAllOwned(@Param("userId") UUID userId);

    @Query("""
            select r from Reminder r
            where r.id = :reminderId and r.user.id = :userId
            """)
    Optional<Reminder> findOwned(@Param("userId") UUID userId, @Param("reminderId") UUID reminderId);

    @Query("""
            select r from Reminder r
            where r.user.id = :userId
              and r.status = :status
              and r.remindAt <= :now
            """)
    List<Reminder> findDueOrOverdue(@Param("userId") UUID userId,
                                    @Param("status") ReminderStatus status,
                                    @Param("now") Instant now);

    @Query("""
            select r from Reminder r
            where r.status = :status
              and r.remindAt <= :now
            """)
    List<Reminder> findPendingDue(@Param("status") ReminderStatus status,
                                  @Param("now") Instant now);

    long countByUserIdAndStatus(UUID userId, ReminderStatus status);
}
