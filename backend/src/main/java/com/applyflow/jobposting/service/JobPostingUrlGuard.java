package com.applyflow.jobposting.service;

import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.util.Locale;
import java.util.Set;

@Component
class JobPostingUrlGuard {

    private static final Set<String> BLOCKED_HOSTS = Set.of(
            "localhost",
            "metadata.google.internal",
            "metadata"
    );

    URI validatePublicHttpUrl(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) {
            throw new IllegalArgumentException("Job posting URL is required");
        }

        URI uri;
        try {
            uri = URI.create(rawUrl.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Job posting URL is invalid");
        }

        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
        if (!scheme.equals("http") && !scheme.equals("https")) {
            throw new IllegalArgumentException("Only http and https job posting URLs are supported");
        }
        if (uri.getHost() == null || uri.getHost().isBlank()) {
            throw new IllegalArgumentException("Job posting URL must include a host");
        }

        String host = uri.getHost().toLowerCase(Locale.ROOT);
        if (BLOCKED_HOSTS.contains(host) || host.endsWith(".localhost") || host.endsWith(".local")) {
            throw new IllegalArgumentException("That host cannot be used for job posting import");
        }
        if (isPrivateOrLocalAddress(host)) {
            throw new IllegalArgumentException("That host cannot be used for job posting import");
        }
        return uri;
    }

    private boolean isPrivateOrLocalAddress(String host) {
        try {
            InetAddress address = InetAddress.getByName(host);
            return address.isAnyLocalAddress()
                    || address.isLoopbackAddress()
                    || address.isLinkLocalAddress()
                    || address.isSiteLocalAddress()
                    || address.isMulticastAddress();
        } catch (UnknownHostException ex) {
            throw new IllegalArgumentException("Job posting host could not be resolved");
        }
    }
}
