package com.applyflow.security.ratelimit;

import com.applyflow.common.exception.ApiError;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 40)
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final String AUTH_PREFIX = "/api/v1/auth/";

    private final RateLimitProperties properties;
    private final InMemoryRateLimiter rateLimiter;
    private final ObjectMapper objectMapper;

    public AuthRateLimitFilter(
            RateLimitProperties properties,
            InMemoryRateLimiter rateLimiter,
            ObjectMapper objectMapper
    ) {
        this.properties = properties;
        this.rateLimiter = rateLimiter;
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!properties.isEnabled()) {
            return true;
        }
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String path = normalizedPath(request);
        return path == null || !path.startsWith(AUTH_PREFIX);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String path = normalizedPath(request);
        int limit = properties.limitForPath(path);
        Duration window = Duration.ofSeconds(Math.max(1, properties.getWindowSeconds()));
        String clientKey = clientKey(request);
        String bucketKey = path + "|" + clientKey;

        if (!rateLimiter.tryAcquire(bucketKey, limit, window)) {
            long retryAfter = rateLimiter.retryAfterSeconds(bucketKey, window);
            writeTooManyRequests(request, response, retryAfter);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void writeTooManyRequests(
            HttpServletRequest request,
            HttpServletResponse response,
            long retryAfterSeconds
    ) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader("Retry-After", Long.toString(retryAfterSeconds));
        ApiError body = new ApiError(
                Instant.now(),
                HttpStatus.TOO_MANY_REQUESTS.value(),
                HttpStatus.TOO_MANY_REQUESTS.getReasonPhrase(),
                "Too many requests. Try again in " + retryAfterSeconds + " second"
                        + (retryAfterSeconds == 1 ? "" : "s") + ".",
                request.getRequestURI(),
                Map.of()
        );
        objectMapper.writeValue(response.getOutputStream(), body);
    }

    private static String normalizedPath(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri == null) {
            return null;
        }
        String context = request.getContextPath();
        if (context != null && !context.isEmpty() && uri.startsWith(context)) {
            uri = uri.substring(context.length());
        }
        if (uri.length() > 1 && uri.endsWith("/")) {
            uri = uri.substring(0, uri.length() - 1);
        }
        return uri;
    }

    private static String clientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            String first = forwarded.split(",")[0].trim();
            if (!first.isEmpty()) {
                return first;
            }
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        String remote = request.getRemoteAddr();
        return remote == null || remote.isBlank() ? "unknown" : remote;
    }
}
