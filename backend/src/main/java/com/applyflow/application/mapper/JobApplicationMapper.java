package com.applyflow.application.mapper;

import com.applyflow.application.dto.JobApplicationResponse;
import com.applyflow.application.entity.JobApplication;
import com.applyflow.application.entity.Resume;
import org.springframework.stereotype.Component;

@Component
public class JobApplicationMapper {

    public JobApplicationResponse toResponse(JobApplication application) {
        Resume resume = application.getResume();
        return new JobApplicationResponse(
                application.getId(),
                application.getCompany().getId(),
                application.getCompany().getName(),
                application.getJobTitle(),
                application.getJobDescription(),
                application.getEmploymentType(),
                application.getWorkArrangement(),
                application.getLocation(),
                application.getSalaryExpectation(),
                application.getAppliedAt(),
                application.getJobUrl(),
                application.getResumeVersion(),
                resume != null ? resume.getId() : null,
                resume != null ? resume.getTitle() : null,
                resume != null ? resume.getFileName() : null,
                resume != null ? resume.getDescription() : null,
                application.getStatus(),
                application.getProcessStage(),
                application.getNotes(),
                application.getCreatedAt(),
                application.getUpdatedAt()
        );
    }
}
