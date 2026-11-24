package com.applyflow.security.ratelimit;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.Scheduled;

import java.time.Duration;

@Configuration
@EnableConfigurationProperties(RateLimitProperties.class)
public class RateLimitConfig {

    private final InMemoryRateLimiter rateLimiter;
    private final RateLimitProperties properties;

    public RateLimitConfig(InMemoryRateLimiter rateLimiter, RateLimitProperties properties) {
        this.rateLimiter = rateLimiter;
        this.properties = properties;
    }

    @Scheduled(fixedDelayString = "${app.rate-limit.evict-interval-ms:600000}")
    public void evictExpiredWindows() {
        if (!properties.isEnabled()) {
            return;
        }
        rateLimiter.evictExpired(Duration.ofSeconds(Math.max(1, properties.getWindowSeconds())));
    }
}
