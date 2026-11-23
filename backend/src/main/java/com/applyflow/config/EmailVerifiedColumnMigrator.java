package com.applyflow.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Existing databases may already have rows when {@code email_verified} is introduced.
 * Hibernate cannot add a NOT NULL column over nulls, so we backfill safely first.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class EmailVerifiedColumnMigrator implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(EmailVerifiedColumnMigrator.class);

    private final JdbcTemplate jdbcTemplate;

    public EmailVerifiedColumnMigrator(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        jdbcTemplate.execute("""
                ALTER TABLE app_users
                ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false
                """);
        jdbcTemplate.update("UPDATE app_users SET email_verified = true WHERE email_verified IS NULL");
        jdbcTemplate.execute("ALTER TABLE app_users ALTER COLUMN email_verified SET DEFAULT false");
        jdbcTemplate.execute("ALTER TABLE app_users ALTER COLUMN email_verified SET NOT NULL");
        log.info("Ensured app_users.email_verified is present and backfilled");
    }
}
