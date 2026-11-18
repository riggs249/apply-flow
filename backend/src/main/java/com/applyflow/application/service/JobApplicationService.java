package com.applyflow.application.service;

import com.applyflow.application.dto.JobApplicationCreateRequest;
import com.applyflow.application.dto.ApplicationActivityResponse;
import com.applyflow.application.dto.JobApplicationResponse;
import com.applyflow.application.dto.JobApplicationUpdateRequest;
import com.applyflow.application.entity.ApplicationStatus;
import com.applyflow.application.entity.EmploymentType;
import com.applyflow.application.entity.ProcessStage;
import com.applyflow.application.entity.WorkArrangement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface JobApplicationService {
    Page<JobApplicationResponse> findAll(UUID userId, String query, ApplicationStatus status,
                                         EmploymentType employmentType, WorkArrangement workArrangement,
                                         LocalDate fromDate, LocalDate toDate, Pageable pageable);
    JobApplicationResponse findById(UUID userId, UUID applicationId);
    JobApplicationResponse create(UUID userId, JobApplicationCreateRequest request);
    JobApplicationResponse update(UUID userId, UUID applicationId, JobApplicationUpdateRequest request);
    JobApplicationResponse changeStatus(UUID userId, UUID applicationId, ApplicationStatus status, ProcessStage processStage);
    List<ApplicationActivityResponse> findActivities(UUID userId, UUID applicationId);
    void delete(UUID userId, UUID applicationId);
}
