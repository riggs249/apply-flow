package com.applyflow.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ApplicationStatusRemapper implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(ApplicationStatusRemapper.class);

    private final JdbcTemplate jdbcTemplate;

    public ApplicationStatusRemapper(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        // Cast status to varchar so engines with enum/check constraints can still
        // match legacy values that are no longer part of ApplicationStatus.
        try {
            relaxStatusConstraints();

            int staged = jdbcTemplate.update("""
                    UPDATE job_applications
                    SET process_stage = CAST(status AS VARCHAR(30)),
                        status = 'IN_PROCESS'
                    WHERE CAST(status AS VARCHAR(30)) IN (
                        'ASSESSMENT', 'HR_INTERVIEW', 'TECHNICAL_INTERVIEW', 'FINAL_INTERVIEW'
                    )
                    """);

            int offers = jdbcTemplate.update("""
                    UPDATE job_applications
                    SET status = 'HIRED',
                        process_stage = NULL
                    WHERE CAST(status AS VARCHAR(30)) = 'OFFER'
                    """);

            int cleared = jdbcTemplate.update("""
                    UPDATE job_applications
                    SET process_stage = NULL
                    WHERE CAST(status AS VARCHAR(30)) <> 'IN_PROCESS'
                      AND process_stage IS NOT NULL
                    """);

            if (staged + offers + cleared > 0) {
                log.info("Remapped application statuses (in-process={}, offers={}, cleared-stages={})",
                        staged, offers, cleared);
            }
        } catch (DataAccessException ex) {
            log.warn("Skipped application status remap: {}", ex.getMostSpecificCause().getMessage());
        }
    }

    private void relaxStatusConstraints() {
        // PostgreSQL keeps stale CHECK constraints under ddl-auto=update, which blocks IN_PROCESS.
        for (String constraint : new String[]{
                "job_applications_status_check",
                "job_applications_process_stage_check"
        }) {
            try {
                jdbcTemplate.execute("ALTER TABLE job_applications DROP CONSTRAINT IF EXISTS " + constraint);
            } catch (DataAccessException ignored) {
                // H2 and other engines may not support this form; remap still proceeds.
            }
        }
    }
}
