package com.applyflow.security.ratelimit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

class InMemoryRateLimiterTest {

    private InMemoryRateLimiter limiter;

    @BeforeEach
    void setUp() {
        limiter = new InMemoryRateLimiter();
    }

    @Test
    void allowsUpToLimitThenRejects() {
        Duration window = Duration.ofMinutes(1);

        assertThat(limiter.tryAcquire("login|127.0.0.1", 3, window)).isTrue();
        assertThat(limiter.tryAcquire("login|127.0.0.1", 3, window)).isTrue();
        assertThat(limiter.tryAcquire("login|127.0.0.1", 3, window)).isTrue();
        assertThat(limiter.tryAcquire("login|127.0.0.1", 3, window)).isFalse();
    }

    @Test
    void isolatesKeys() {
        Duration window = Duration.ofMinutes(1);

        assertThat(limiter.tryAcquire("login|1.1.1.1", 1, window)).isTrue();
        assertThat(limiter.tryAcquire("login|1.1.1.1", 1, window)).isFalse();
        assertThat(limiter.tryAcquire("login|2.2.2.2", 1, window)).isTrue();
    }

    @Test
    void retryAfterIsAtLeastOneSecond() {
        Duration window = Duration.ofSeconds(30);
        limiter.tryAcquire("email|127.0.0.1", 1, window);
        limiter.tryAcquire("email|127.0.0.1", 1, window);

        assertThat(limiter.retryAfterSeconds("email|127.0.0.1", window)).isBetween(1L, 30L);
    }
}
