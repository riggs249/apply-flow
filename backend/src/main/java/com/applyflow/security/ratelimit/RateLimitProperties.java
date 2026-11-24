package com.applyflow.security.ratelimit;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.rate-limit")
public class RateLimitProperties {

    private boolean enabled = true;
    /** Sliding window length in seconds. */
    private int windowSeconds = 60;
    private int loginPerWindow = 10;
    private int registerPerWindow = 5;
    private int emailPerWindow = 3;
    private int tokenPerWindow = 20;
    private int defaultPerWindow = 30;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public int getWindowSeconds() {
        return windowSeconds;
    }

    public void setWindowSeconds(int windowSeconds) {
        this.windowSeconds = windowSeconds;
    }

    public int getLoginPerWindow() {
        return loginPerWindow;
    }

    public void setLoginPerWindow(int loginPerWindow) {
        this.loginPerWindow = loginPerWindow;
    }

    public int getRegisterPerWindow() {
        return registerPerWindow;
    }

    public void setRegisterPerWindow(int registerPerWindow) {
        this.registerPerWindow = registerPerWindow;
    }

    public int getEmailPerWindow() {
        return emailPerWindow;
    }

    public void setEmailPerWindow(int emailPerWindow) {
        this.emailPerWindow = emailPerWindow;
    }

    public int getTokenPerWindow() {
        return tokenPerWindow;
    }

    public void setTokenPerWindow(int tokenPerWindow) {
        this.tokenPerWindow = tokenPerWindow;
    }

    public int getDefaultPerWindow() {
        return defaultPerWindow;
    }

    public void setDefaultPerWindow(int defaultPerWindow) {
        this.defaultPerWindow = defaultPerWindow;
    }

    public int limitForPath(String path) {
        if (path == null) {
            return defaultPerWindow;
        }
        if (path.endsWith("/login")) {
            return loginPerWindow;
        }
        if (path.endsWith("/register")) {
            return registerPerWindow;
        }
        if (path.endsWith("/forgot-password") || path.endsWith("/resend-verification")) {
            return emailPerWindow;
        }
        if (path.endsWith("/verify-email")
                || path.endsWith("/reset-password")
                || path.endsWith("/refresh")) {
            return tokenPerWindow;
        }
        return defaultPerWindow;
    }
}
