package com.applyflow.jobposting.service;

import com.applyflow.company.dto.CompanyResponse;
import com.applyflow.company.service.CompanyService;
import com.applyflow.jobposting.dto.JobPostingParseRequest;
import com.applyflow.jobposting.dto.JobPostingParseResponse;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

@Service
public class JobPostingParseService {

    private static final int MAX_BYTES = 1_500_000;

    private final JobPostingUrlGuard urlGuard;
    private final JobPostingContentParser contentParser;
    private final CompanyService companyService;
    private final HttpClient httpClient;

    public JobPostingParseService(
            JobPostingUrlGuard urlGuard,
            JobPostingContentParser contentParser,
            CompanyService companyService
    ) {
        this.urlGuard = urlGuard;
        this.contentParser = contentParser;
        this.companyService = companyService;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(8))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    public JobPostingParseResponse parse(UUID userId, JobPostingParseRequest request) {
        URI uri = urlGuard.validatePublicHttpUrl(request.url());
        String html = fetchHtml(uri);
        ParsedJobPosting parsed = contentParser.parse(uri, html);

        if (parsed.companyName() == null || parsed.companyName().isBlank()) {
            return new JobPostingParseResponse(
                    uri.toString(),
                    null,
                    null,
                    parsed.companyWebsite(),
                    false,
                    parsed.position(),
                    parsed.jobDescription(),
                    parsed.location(),
                    parsed.salaryExpectation(),
                    "Could not detect a company from that link. Enter the company below."
            );
        }

        Optional<CompanyResponse> existing = companyService.findByNameIgnoreCase(userId, parsed.companyName());
        if (existing.isPresent()) {
            CompanyResponse company = existing.get();
            return new JobPostingParseResponse(
                    uri.toString(),
                    company.id(),
                    company.name(),
                    firstNonBlank(company.website(), parsed.companyWebsite()),
                    true,
                    parsed.position(),
                    parsed.jobDescription(),
                    parsed.location(),
                    parsed.salaryExpectation(),
                    "Matched existing company \"" + company.name() + "\"."
            );
        }

        return new JobPostingParseResponse(
                uri.toString(),
                null,
                parsed.companyName(),
                parsed.companyWebsite(),
                false,
                parsed.position(),
                parsed.jobDescription(),
                parsed.location(),
                parsed.salaryExpectation(),
                "Company \"" + parsed.companyName() + "\" is not in your list yet. Review and create it below."
        );
    }

    private String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) {
            return first;
        }
        return second;
    }

    private String fetchHtml(URI uri) {
        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(12))
                .header(
                        "User-Agent",
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                                + "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                )
                .header("Accept", "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8")
                .header("Accept-Language", "en-US,en;q=0.9")
                .GET()
                .build();
        try {
            HttpResponse<InputStream> response = httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());
            if (response.statusCode() < 200 || response.statusCode() >= 400) {
                throw new IllegalArgumentException(
                        "Job posting page could not be loaded (HTTP " + response.statusCode() + ")"
                );
            }
            URI responseUri = response.uri();
            if (responseUri != null && responseUri.getHost() != null) {
                urlGuard.validatePublicHttpUrl(responseUri.toString());
            }
            try (InputStream body = response.body()) {
                byte[] bytes = body.readNBytes(MAX_BYTES + 1);
                if (bytes.length > MAX_BYTES) {
                    throw new IllegalArgumentException("Job posting page is too large to import");
                }
                return new String(bytes, StandardCharsets.UTF_8);
            }
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (IOException | InterruptedException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new IllegalArgumentException("Job posting page could not be loaded");
        }
    }
}
