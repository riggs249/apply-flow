package com.applyflow.security.ratelimit;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Fixed-window counter rate limiter for a single JVM (Render web service).
 */
@Component
public class InMemoryRateLimiter {

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    /**
     * @return {@code true} if the request is allowed
     */
    public boolean tryAcquire(String key, int limit, Duration window) {
        if (limit <= 0) {
            return false;
        }
        long now = System.currentTimeMillis();
        long windowMs = Math.max(1L, window.toMillis());

        Window current = windows.compute(key, (ignored, existing) -> {
            if (existing == null || now - existing.startMs >= windowMs) {
                return new Window(now, new AtomicInteger(1));
            }
            existing.count.incrementAndGet();
            return existing;
        });

        return current.count.get() <= limit;
    }

    /**
     * Seconds until the current window for {@code key} resets, or {@code windowSeconds} if unknown.
     */
    public long retryAfterSeconds(String key, Duration window) {
        Window existing = windows.get(key);
        long windowMs = Math.max(1L, window.toMillis());
        if (existing == null) {
            return Math.max(1L, window.toSeconds());
        }
        long elapsed = System.currentTimeMillis() - existing.startMs;
        long remainingMs = Math.max(1L, windowMs - elapsed);
        return Math.max(1L, (remainingMs + 999) / 1000);
    }

    public void clear() {
        windows.clear();
    }

    /** Drops windows that finished at least one full period ago. */
    public void evictExpired(Duration window) {
        long now = System.currentTimeMillis();
        long windowMs = Math.max(1L, window.toMillis());
        Iterator<Map.Entry<String, Window>> iterator = windows.entrySet().iterator();
        while (iterator.hasNext()) {
            Map.Entry<String, Window> entry = iterator.next();
            if (now - entry.getValue().startMs >= windowMs * 2) {
                iterator.remove();
            }
        }
    }

    private static final class Window {
        private final long startMs;
        private final AtomicInteger count;

        private Window(long startMs, AtomicInteger count) {
            this.startMs = startMs;
            this.count = count;
        }
    }
}
