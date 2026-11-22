package com.applyflow.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class NotificationPrefsColumnMigrator implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(NotificationPrefsColumnMigrator.class);

    private final JdbcTemplate jdbcTemplate;

    public NotificationPrefsColumnMigrator(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        ensureBooleanColumn("notify_reminder_email", true);
        ensureBooleanColumn("notify_interview_email", true);
        ensureBooleanColumn("notify_assessment_email", true);
        ensureBooleanColumn("notify_outcome_email", true);
        jdbcTemplate.execute("""
                ALTER TABLE reminders
                ADD COLUMN IF NOT EXISTS emailed_at timestamptz
                """);
        log.info("Ensured notification preference columns and reminders.emailed_at");
    }

    private void ensureBooleanColumn(String column, boolean defaultValue) {
        String defaultSql = defaultValue ? "true" : "false";
        jdbcTemplate.execute("""
                ALTER TABLE app_users
                ADD COLUMN IF NOT EXISTS %s boolean DEFAULT %s
                """.formatted(column, defaultSql));
        jdbcTemplate.update("""
                UPDATE app_users SET %s = %s WHERE %s IS NULL
                """.formatted(column, defaultSql, column));
        jdbcTemplate.execute("""
                ALTER TABLE app_users ALTER COLUMN %s SET DEFAULT %s
                """.formatted(column, defaultSql));
        jdbcTemplate.execute("""
                ALTER TABLE app_users ALTER COLUMN %s SET NOT NULL
                """.formatted(column));
    }
}
