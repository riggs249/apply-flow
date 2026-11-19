package com.applyflow.jobposting.service;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.net.URI;

import static org.assertj.core.api.Assertions.assertThat;

class JobPostingContentParserTest {

    private final JobPostingContentParser parser = new JobPostingContentParser();

    @Test
    void extractsCompanyFromGreenhouseUrlWhenPageHasLittleMetadata() {
        ParsedJobPosting parsed = parser.parse(
                URI.create("https://boards.greenhouse.io/stripe/jobs/123"),
                "<html><head><title>Jobs</title></head><body></body></html>"
        );

        assertThat(parsed.companyName()).isEqualTo("Stripe");
    }

    @Test
    void prefersJsonLdHiringOrganization() {
        String html = """
                <html><head>
                <meta property="og:site_name" content="Careers Portal" />
                <script type="application/ld+json">
                {
                  "@type": "JobPosting",
                  "title": "Backend Engineer",
                  "description": "Build APIs",
                  "hiringOrganization": {
                    "name": "ApplyFlow",
                    "url": "https://applyflow.dev"
                  },
                  "jobLocation": {
                    "addressLocality": "Remote"
                  },
                  "baseSalary": {
                    "value": {
                      "minValue": 70000,
                      "maxValue": 90000
                    }
                  }
                }
                </script>
                </head></html>
                """;

        ParsedJobPosting parsed = parser.parse(URI.create("https://applyflow.dev/jobs/1"), html);

        assertThat(parsed.companyName()).isEqualTo("ApplyFlow");
        assertThat(parsed.companyWebsite()).isEqualTo("https://applyflow.dev");
        assertThat(parsed.position()).isEqualTo("Backend Engineer");
        assertThat(parsed.jobDescription()).contains("Build APIs");
        assertThat(parsed.location()).isEqualTo("Remote");
        assertThat(parsed.salaryExpectation()).isEqualByComparingTo("80000");
    }

    @Test
    void extractsCompanyFromTitleFallback() {
        ParsedJobPosting parsed = parser.parse(
                URI.create("https://example.com/jobs/1"),
                "<html><head><title>Product Designer at Contoso</title></head></html>"
        );

        assertThat(parsed.companyName()).isEqualTo("Contoso");
        assertThat(parsed.position()).isEqualTo("Product Designer");
    }

    @Test
    void extractsLinkedInJobDetailsFromGuestPageMarkup() {
        String html = """
                <html><head>
                <title>AI Engineer at Ascendion — Taguig, National Capital Region, Philippines | LinkedIn Jobs</title>
                <meta property="og:title" content="AI Engineer at Ascendion — Taguig, National Capital Region, Philippines | LinkedIn Jobs" />
                <meta name="description" content="Apply for AI Engineer at Ascendion in Taguig." />
                </head><body>
                <h1 class="topcard__title">AI Engineer</h1>
                <a class="topcard__org-name-link" href="https://www.linkedin.com/company/ascendion">Ascendion</a>
                <span class="topcard__flavor--bullet">Taguig, National Capital Region, Philippines</span>
                <div class="salary compensation__salary">₱70,000.00/mo - ₱100,000.00/mo</div>
                <div class="show-more-less-html__markup"><p><strong>Responsibilities</strong></p><ul><li>Build practical AI systems.</li><li>Ship reliable features.</li></ul></div>
                </body></html>
                """;

        ParsedJobPosting parsed = parser.parse(
                URI.create("https://www.linkedin.com/jobs/view/4492276983/"),
                html
        );

        assertThat(parsed.companyName()).isEqualTo("Ascendion");
        assertThat(parsed.position()).isEqualTo("AI Engineer");
        assertThat(parsed.location()).isEqualTo("Taguig, National Capital Region, Philippines");
        assertThat(parsed.salaryExpectation()).isEqualByComparingTo("85000");
        assertThat(parsed.jobDescription()).isEqualTo("Responsibilities\n\n- Build practical AI systems.\n- Ship reliable features.");
        assertThat(parsed.companyWebsite()).isNull();
    }

    @Test
    void extractsLinkedInDetailsFromTitleWhenMarkupMissing() {
        String html = """
                <html><head>
                <title>AI Engineer at Ascendion — Taguig, National Capital Region, Philippines | LinkedIn Jobs</title>
                <meta property="og:title" content="AI Engineer at Ascendion — Taguig, National Capital Region, Philippines | LinkedIn Jobs" />
                </head></html>
                """;

        ParsedJobPosting parsed = parser.parse(
                URI.create("https://www.linkedin.com/jobs/view/4492276983/"),
                html
        );

        assertThat(parsed.companyName()).isEqualTo("Ascendion");
        assertThat(parsed.position()).isEqualTo("AI Engineer");
        assertThat(parsed.location()).isEqualTo("Taguig, National Capital Region, Philippines");
    }

    @Test
    void extractsIndeedDetailsFromTitle() {
        String html = """
                <html><head>
                <title>Software Engineer - Contoso - Manila | Indeed.com</title>
                <meta property="og:title" content="Software Engineer - Contoso - Manila | Indeed.com" />
                <meta name="description" content="Software Engineer role at Contoso. Salary $120,000 - $140,000 a year." />
                </head><body>
                <a data-tn-element="companyName">Contoso</a>
                </body></html>
                """;

        ParsedJobPosting parsed = parser.parse(
                URI.create("https://ph.indeed.com/viewjob?jk=abc123"),
                html
        );

        assertThat(parsed.companyName()).isEqualTo("Contoso");
        assertThat(parsed.position()).isEqualTo("Software Engineer");
        assertThat(parsed.location()).isEqualTo("Manila");
        assertThat(parsed.salaryExpectation()).isEqualByComparingTo("130000");
    }

    @Test
    void extractsJobStreetDetailsFromTitle() {
        String html = """
                <html><head>
                <title>Java Developer | Globex | JobStreet</title>
                <meta property="og:title" content="Java Developer | Globex | JobStreet" />
                </head></html>
                """;

        ParsedJobPosting parsed = parser.parse(
                URI.create("https://www.jobstreet.com.ph/job/123"),
                html
        );

        assertThat(parsed.companyName()).isEqualTo("Globex");
        assertThat(parsed.position()).isEqualTo("Java Developer");
        assertThat(parsed.companyWebsite()).isNull();
    }
}
