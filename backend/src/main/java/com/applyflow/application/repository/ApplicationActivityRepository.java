package com.applyflow.application.repository;

import com.applyflow.application.entity.ApplicationActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ApplicationActivityRepository extends JpaRepository<ApplicationActivity, UUID> {

    @Query("""
            select activity from ApplicationActivity activity
            where activity.application.id = :applicationId
              and activity.application.user.id = :userId
            order by activity.occurredAt asc
            """)
    List<ApplicationActivity> findOwnedByApplicationId(
            @Param("userId") UUID userId,
            @Param("applicationId") UUID applicationId
    );
}
