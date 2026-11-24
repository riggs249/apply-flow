package com.applyflow.config;

/**
 * FRONTEND_URL must be a single origin for email links.
 * If a comma-separated value is provided by mistake, the first entry is used.
 */
public final class FrontendUrls {

    private FrontendUrls() {
    }

    public static String canonical(String frontendUrl) {
        if (frontendUrl == null || frontendUrl.isBlank()) {
            return "http://localhost:4200";
        }
        String first = frontendUrl.split(",")[0].trim();
        return first.endsWith("/") ? first.substring(0, first.length() - 1) : first;
    }
}
