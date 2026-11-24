package com.applyflow.auth.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;
import java.util.Map;

/**
 * Sends mail through Resend's HTTPS API.
 * Required on Render free tier, which blocks outbound SMTP ports 25/465/587.
 */
@Component
public class ResendHttpMailClient {

    private static final Logger log = LoggerFactory.getLogger(ResendHttpMailClient.class);
    private static final String DEFAULT_API_URL = "https://api.resend.com/emails";

    private final RestClient restClient;
    private final String apiKey;
    private final String apiUrl;

    public ResendHttpMailClient(
            RestClient.Builder restClientBuilder,
            @Value("${app.mail.resend-api-key:}") String apiKey,
            @Value("${app.mail.resend-api-url:https://api.resend.com/emails}") String apiUrl
    ) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.apiUrl = StringUtils.hasText(apiUrl) ? apiUrl.trim() : DEFAULT_API_URL;
        this.restClient = restClientBuilder.build();
    }

    public boolean isConfigured() {
        return StringUtils.hasText(apiKey);
    }

    public void send(String from, String to, String subject, String textBody, String htmlBody) {
        if (!isConfigured()) {
            throw new IllegalStateException("RESEND_API_KEY / app.mail.resend-api-key is not configured.");
        }
        Map<String, Object> payload = Map.of(
                "from", from,
                "to", List.of(to),
                "subject", subject,
                "text", textBody == null ? "" : textBody,
                "html", htmlBody == null ? "" : htmlBody
        );
        try {
            JsonNode response = restClient.post()
                    .uri(apiUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + apiKey)
                    .body(payload)
                    .retrieve()
                    .body(JsonNode.class);
            String id = response != null && response.hasNonNull("id") ? response.get("id").asText() : "unknown";
            log.info("Resend accepted email id={} to={}", id, to);
        } catch (RestClientResponseException exception) {
            throw new IllegalStateException(
                    "Resend API rejected email (" + exception.getStatusCode().value() + "): "
                            + exception.getResponseBodyAsString(),
                    exception
            );
        }
    }
}
