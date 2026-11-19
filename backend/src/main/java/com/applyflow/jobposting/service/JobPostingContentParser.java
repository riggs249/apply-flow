package com.applyflow.jobposting.service;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
class JobPostingContentParser {

    private static final Set<String> AGGREGATOR_SITE_NAMES = Set.of(
            "linkedin",
            "linkedin jobs",
            "indeed",
            "indeed.com",
            "jobstreet",
            "jobstreet.com",
            "glassdoor"
    );

    private static final Pattern META_CONTENT = Pattern.compile(
            "<meta[^>]+(?:property|name)\\s*=\\s*[\"']([^\"']+)[\"'][^>]+content\\s*=\\s*[\"']([^\"']*)[\"'][^>]*>"
                    + "|<meta[^>]+content\\s*=\\s*[\"']([^\"']*)[\"'][^>]+(?:property|name)\\s*=\\s*[\"']([^\"']+)[\"'][^>]*>",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern TITLE_TAG = Pattern.compile(
            "<title[^>]*>(.*?)</title>",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );
    private static final Pattern JSON_LD = Pattern.compile(
            "<script[^>]+type\\s*=\\s*[\"']application/ld\\+json[\"'][^>]*>(.*?)</script>",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );
    private static final Pattern LINKEDIN_ORG = Pattern.compile(
            "topcard__org-name-link[^>]*>(.*?)</a>",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );
    private static final Pattern LINKEDIN_LOCATION = Pattern.compile(
            "topcard__flavor--bullet[^>]*>(.*?)</span>",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );
    private static final Pattern LINKEDIN_TITLE = Pattern.compile(
            "topcard__title[^>]*>(.*?)</h1>",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );
    private static final Pattern LINKEDIN_DESCRIPTION = Pattern.compile(
            "show-more-less-html__markup[^>]*>(.*?)</div>",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );
    private static final Pattern INDEED_COMPANY = Pattern.compile(
            "(?:data-company-name|data-tn-element\\s*=\\s*[\"']companyName[\"'])[^>]*>(.*?)</(?:a|span|div)>|"
                    + "jobsearch-JobInfoHeader-companyName[^>]*>(.*?)</(?:a|span|div|div)>|"
                    + "\"companyName\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );
    private static final Pattern INDEED_LOCATION = Pattern.compile(
            "jobsearch-JobInfoHeader-subtitle[^>]*>.*?<div[^>]*>(.*?)</div>|"
                    + "\"jobLocation\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"|"
                    + "data-testid\\s*=\\s*[\"']inlineHeader-companyLocation[\"'][^>]*>(.*?)</div>",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );
    private static final Pattern JOBSTREET_COMPANY = Pattern.compile(
            "(?:data-automation\\s*=\\s*[\"']jobCompany[\"']|job-details-company)[^>]*>(.*?)</(?:a|span|div)>|"
                    + "\"companyName\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"|"
                    + "\"hiringOrganization\"\\s*:\\s*\\{[^}]*?\"name\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );
    private static final Pattern LINKEDIN_TITLE_WITH_LOCATION = Pattern.compile(
            "(?i)^(.+?)\\s+at\\s+(.+?)\\s*[—–-]\\s*(.+)$"
    );
    private static final Pattern LINKEDIN_TITLE_PLAIN = Pattern.compile(
            "(?i)^(.+?)\\s+at\\s+(.+)$"
    );
    private static final Pattern INDEED_TITLE_WITH_LOCATION = Pattern.compile(
            "(?i)^(.+?)\\s+-\\s+(.+?)\\s+-\\s+(.+)$"
    );
    private static final Pattern INDEED_TITLE_PLAIN = Pattern.compile(
            "(?i)^(.+?)\\s+-\\s+(.+)$"
    );
    private static final Pattern JOBSTREET_TITLE = Pattern.compile(
            "(?i)^(.+?)\\s*\\|\\s*(.+?)(?:\\s*\\|\\s*.*)?$"
    );
    private static final Pattern LINKEDIN_SALARY = Pattern.compile(
            "compensation__salary[^>]*>(.*?)</div>",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );
    private static final Pattern SALARY_RANGE = Pattern.compile(
            "(?:₱|PHP\\s*|\\$|USD\\s*|€|£)?\\s*([\\d]{1,3}(?:,\\d{3})*(?:\\.\\d+)?|[\\d]+(?:\\.\\d+)?)"
                    + "\\s*(?:/\\w+)?\\s*(?:-|–|—|to)\\s*"
                    + "(?:₱|PHP\\s*|\\$|USD\\s*|€|£)?\\s*([\\d]{1,3}(?:,\\d{3})*(?:\\.\\d+)?|[\\d]+(?:\\.\\d+)?)",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern SALARY_SINGLE = Pattern.compile(
            "(?:₱|PHP\\s*|\\$|USD\\s*|€|£)\\s*([\\d]{1,3}(?:,\\d{3})*(?:\\.\\d+)?|[\\d]+(?:\\.\\d+)?)",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern JSON_LD_SALARY_RANGE = Pattern.compile(
            "\"minValue\"\\s*:\\s*([\\d.]+).*?\"maxValue\"\\s*:\\s*([\\d.]+)|"
                    + "\"maxValue\"\\s*:\\s*([\\d.]+).*?\"minValue\"\\s*:\\s*([\\d.]+)",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );
    private static final Pattern JSON_LD_SALARY_VALUE = Pattern.compile(
            "\"baseSalary\"[^{]*\\{.*?\"value\"\\s*:\\s*([\\d.]+)",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );

    ParsedJobPosting parse(URI sourceUrl, String html) {
        String safeHtml = html == null ? "" : html;
        MetaValues meta = extractMeta(safeHtml);
        JsonLdJobPosting jsonLd = extractJsonLd(safeHtml).orElse(null);
        BoardExtract board = extractBoardSpecific(sourceUrl, safeHtml, meta);

        String companyName = firstNonBlank(
                board.companyName(),
                jsonLd == null ? null : jsonLd.companyName(),
                usableSiteName(meta.siteName()),
                companyFromUrl(sourceUrl),
                companyFromTitle(meta.title(), sourceUrl),
                companyFromTitle(meta.ogTitle(), sourceUrl)
        );
        String position = firstNonBlank(
                board.position(),
                jsonLd == null ? null : jsonLd.position(),
                positionFromTitle(meta.ogTitle(), companyName, sourceUrl),
                positionFromTitle(meta.title(), companyName, sourceUrl)
        );
        String description = firstNonBlank(
                board.description(),
                jsonLd == null ? null : jsonLd.description(),
                meta.description()
        );
        String location = firstNonBlank(
                board.location(),
                jsonLd == null ? null : jsonLd.location(),
                locationFromTitle(meta.ogTitle(), sourceUrl),
                locationFromTitle(meta.title(), sourceUrl),
                meta.location()
        );
        String website = firstNonBlank(
                jsonLd == null ? null : jsonLd.companyWebsite(),
                companyWebsiteFromUrl(sourceUrl)
        );
        BigDecimal salary = firstNonNull(
                board.salaryExpectation(),
                jsonLd == null ? null : jsonLd.salaryExpectation(),
                extractSalary(safeHtml),
                extractSalary(description)
        );

        return new ParsedJobPosting(
                clean(companyName),
                clean(website),
                clean(position),
                truncate(cleanMultiline(description), 5_000),
                clean(location),
                salary
        );
    }

    private BoardExtract extractBoardSpecific(URI sourceUrl, String html, MetaValues meta) {
        String host = hostOf(sourceUrl);
        if (isLinkedIn(host)) {
            return new BoardExtract(
                    firstNonBlank(innerText(LINKEDIN_ORG, html), companyFromLinkedInTitle(meta.ogTitle()), companyFromLinkedInTitle(meta.title())),
                    firstNonBlank(innerText(LINKEDIN_TITLE, html), positionFromLinkedInTitle(meta.ogTitle()), positionFromLinkedInTitle(meta.title())),
                    firstNonBlank(innerHtml(LINKEDIN_DESCRIPTION, html), meta.description()),
                    firstNonBlank(innerText(LINKEDIN_LOCATION, html), locationFromLinkedInTitle(meta.ogTitle()), locationFromLinkedInTitle(meta.title())),
                    extractSalary(matchFirst(LINKEDIN_SALARY, html))
            );
        }
        if (isIndeed(host)) {
            return new BoardExtract(
                    firstNonBlank(matchAnyGroup(INDEED_COMPANY, html), companyFromIndeedTitle(meta.ogTitle()), companyFromIndeedTitle(meta.title())),
                    firstNonBlank(positionFromIndeedTitle(meta.ogTitle()), positionFromIndeedTitle(meta.title())),
                    meta.description(),
                    firstNonBlank(matchAnyGroup(INDEED_LOCATION, html), locationFromIndeedTitle(meta.ogTitle()), locationFromIndeedTitle(meta.title())),
                    extractSalary(html)
            );
        }
        if (isJobStreet(host)) {
            return new BoardExtract(
                    firstNonBlank(matchAnyGroup(JOBSTREET_COMPANY, html), companyFromJobStreetTitle(meta.ogTitle()), companyFromJobStreetTitle(meta.title())),
                    firstNonBlank(positionFromJobStreetTitle(meta.ogTitle()), positionFromJobStreetTitle(meta.title())),
                    meta.description(),
                    null,
                    extractSalary(html)
            );
        }
        return BoardExtract.empty();
    }

    private MetaValues extractMeta(String html) {
        String siteName = null;
        String ogTitle = null;
        String description = null;
        String location = null;
        Matcher matcher = META_CONTENT.matcher(html);
        while (matcher.find()) {
            String name = matcher.group(1) != null ? matcher.group(1) : matcher.group(4);
            String content = matcher.group(1) != null ? matcher.group(2) : matcher.group(3);
            if (name == null || content == null) {
                continue;
            }
            String key = name.toLowerCase(Locale.ROOT).trim();
            String value = decode(content).trim();
            if (value.isEmpty()) {
                continue;
            }
            switch (key) {
                case "og:site_name" -> siteName = firstNonBlank(siteName, value);
                case "og:title", "twitter:title" -> ogTitle = firstNonBlank(ogTitle, value);
                case "og:description", "description", "twitter:description" ->
                        description = firstNonBlank(description, value);
                default -> {
                    if (key.contains("location") || key.contains("job_location")) {
                        location = firstNonBlank(location, value);
                    }
                }
            }
        }

        String title = null;
        Matcher titleMatcher = TITLE_TAG.matcher(html);
        if (titleMatcher.find()) {
            title = decode(titleMatcher.group(1)).replaceAll("\\s+", " ").trim();
        }
        return new MetaValues(siteName, ogTitle, description, location, title);
    }

    private Optional<JsonLdJobPosting> extractJsonLd(String html) {
        Matcher matcher = JSON_LD.matcher(html);
        while (matcher.find()) {
            String block = matcher.group(1);
            if (block == null || !block.toLowerCase(Locale.ROOT).contains("jobposting")) {
                continue;
            }
            String companyName = jsonString(block, "hiringOrganization", "name");
            if (companyName == null) {
                companyName = nestedName(block, "hiringOrganization");
            }
            String companyWebsite = nestedUrl(block, "hiringOrganization");
            String position = jsonTopLevelString(block, "title");
            String description = jsonTopLevelString(block, "description");
            String location = nestedName(block, "addressLocality");
            if (location == null) {
                location = nestedName(block, "jobLocation");
            }
            return Optional.of(new JsonLdJobPosting(
                    companyName,
                    companyWebsite,
                    position,
                    description,
                    location,
                    extractSalaryFromJsonLd(block)
            ));
        }
        return Optional.empty();
    }

    private BigDecimal extractSalaryFromJsonLd(String block) {
        Matcher range = JSON_LD_SALARY_RANGE.matcher(block);
        if (range.find()) {
            String min = firstNonBlank(range.group(1), range.group(4));
            String max = firstNonBlank(range.group(2), range.group(3));
            return midpoint(parseNumber(min), parseNumber(max));
        }
        Matcher single = JSON_LD_SALARY_VALUE.matcher(block);
        if (single.find()) {
            return parseNumber(single.group(1));
        }
        return extractSalary(block);
    }

    private BigDecimal extractSalary(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        String plain = stripTags(text);
        Matcher range = SALARY_RANGE.matcher(plain);
        if (range.find()) {
            return midpoint(parseNumber(range.group(1)), parseNumber(range.group(2)));
        }
        Matcher single = SALARY_SINGLE.matcher(plain);
        if (single.find()) {
            return parseNumber(single.group(1));
        }
        return null;
    }

    private BigDecimal midpoint(BigDecimal min, BigDecimal max) {
        if (min == null) {
            return max;
        }
        if (max == null) {
            return min;
        }
        return min.add(max).divide(BigDecimal.valueOf(2), 0, RoundingMode.HALF_UP);
    }

    private BigDecimal parseNumber(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return new BigDecimal(raw.replace(",", "").trim()).setScale(0, RoundingMode.HALF_UP);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private BigDecimal firstNonNull(BigDecimal... values) {
        for (BigDecimal value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    String companyFromUrl(URI uri) {
        String host = hostOf(uri);
        String path = uri.getPath() == null ? "" : uri.getPath();
        List<String> segments = pathSegments(path);

        if (hostContains(host, "greenhouse.io") && !segments.isEmpty()) {
            return humanizeSlug(segments.getFirst());
        }
        if (hostContains(host, "lever.co") && !segments.isEmpty()) {
            return humanizeSlug(segments.getFirst());
        }
        if (hostContains(host, "ashbyhq.com") && !segments.isEmpty()) {
            return humanizeSlug(segments.getFirst());
        }
        if (hostContains(host, "workable.com") && !segments.isEmpty()) {
            return humanizeSlug(segments.getFirst());
        }
        if (hostContains(host, "smartrecruiters.com") && !segments.isEmpty()) {
            return humanizeSlug(segments.getFirst());
        }
        if (host.endsWith(".bamboohr.com")) {
            return humanizeSlug(host.substring(0, host.indexOf('.')));
        }
        if (host.startsWith("careers.") || host.startsWith("jobs.") || host.startsWith("job.")) {
            String companyHost = host.substring(host.indexOf('.') + 1);
            return humanizeSlug(companyHost.split("\\.")[0]);
        }
        return null;
    }

    private String companyWebsiteFromUrl(URI uri) {
        String host = hostOf(uri);
        if (host.isBlank() || isAggregatorHost(host) || host.endsWith(".bamboohr.com")
                || hostContains(host, "greenhouse.io")
                || hostContains(host, "lever.co")
                || hostContains(host, "ashbyhq.com")
                || hostContains(host, "workable.com")
                || hostContains(host, "smartrecruiters.com")) {
            return null;
        }
        return uri.getScheme() + "://" + uri.getHost();
    }

    private String companyFromTitle(String title, URI sourceUrl) {
        String host = hostOf(sourceUrl);
        if (isLinkedIn(host)) {
            return companyFromLinkedInTitle(title);
        }
        if (isIndeed(host)) {
            return companyFromIndeedTitle(title);
        }
        if (isJobStreet(host)) {
            return companyFromJobStreetTitle(title);
        }
        String normalized = stripAggregatorSuffix(title);
        if (normalized == null) {
            return null;
        }
        Matcher atMatcher = Pattern.compile("(?i)^(.+?)\\s+at\\s+(.+)$").matcher(normalized);
        if (atMatcher.matches()) {
            return clean(atMatcher.group(2));
        }
        String[] parts = normalized.split("\\s*[|\\-–—]\\s*");
        if (parts.length >= 2) {
            return clean(parts[parts.length - 1]);
        }
        return null;
    }

    private String positionFromTitle(String title, String companyName, URI sourceUrl) {
        String host = hostOf(sourceUrl);
        if (isLinkedIn(host)) {
            return positionFromLinkedInTitle(title);
        }
        if (isIndeed(host)) {
            return positionFromIndeedTitle(title);
        }
        if (isJobStreet(host)) {
            return positionFromJobStreetTitle(title);
        }
        String normalized = stripAggregatorSuffix(title);
        if (normalized == null) {
            return null;
        }
        String value = normalized;
        if (companyName != null && !companyName.isBlank()) {
            value = value.replaceAll("(?i)\\s+at\\s+" + Pattern.quote(companyName) + ".*$", "");
            value = value.replaceAll("(?i)[|\\-–—]\\s*" + Pattern.quote(companyName) + ".*$", "");
            value = value.replaceAll("(?i)^" + Pattern.quote(companyName) + "\\s*[|\\-–—]\\s*", "");
        }
        return clean(value);
    }

    private String locationFromTitle(String title, URI sourceUrl) {
        String host = hostOf(sourceUrl);
        if (isLinkedIn(host)) {
            return locationFromLinkedInTitle(title);
        }
        if (isIndeed(host)) {
            return locationFromIndeedTitle(title);
        }
        return null;
    }

    private String companyFromLinkedInTitle(String title) {
        String normalized = stripAggregatorSuffix(title);
        if (normalized == null) {
            return null;
        }
        Matcher withLocation = LINKEDIN_TITLE_WITH_LOCATION.matcher(normalized);
        if (withLocation.matches()) {
            return clean(withLocation.group(2));
        }
        Matcher plain = LINKEDIN_TITLE_PLAIN.matcher(normalized);
        return plain.matches() ? clean(plain.group(2)) : null;
    }

    private String positionFromLinkedInTitle(String title) {
        String normalized = stripAggregatorSuffix(title);
        if (normalized == null) {
            return null;
        }
        Matcher withLocation = LINKEDIN_TITLE_WITH_LOCATION.matcher(normalized);
        if (withLocation.matches()) {
            return clean(withLocation.group(1));
        }
        Matcher plain = LINKEDIN_TITLE_PLAIN.matcher(normalized);
        return plain.matches() ? clean(plain.group(1)) : null;
    }

    private String locationFromLinkedInTitle(String title) {
        String normalized = stripAggregatorSuffix(title);
        if (normalized == null) {
            return null;
        }
        Matcher withLocation = LINKEDIN_TITLE_WITH_LOCATION.matcher(normalized);
        return withLocation.matches() ? clean(withLocation.group(3)) : null;
    }

    private String companyFromIndeedTitle(String title) {
        String normalized = stripAggregatorSuffix(title);
        if (normalized == null) {
            return null;
        }
        Matcher withLocation = INDEED_TITLE_WITH_LOCATION.matcher(normalized);
        if (withLocation.matches()) {
            return clean(withLocation.group(2));
        }
        Matcher plain = INDEED_TITLE_PLAIN.matcher(normalized);
        return plain.matches() ? clean(plain.group(2)) : null;
    }

    private String positionFromIndeedTitle(String title) {
        String normalized = stripAggregatorSuffix(title);
        if (normalized == null) {
            return null;
        }
        Matcher withLocation = INDEED_TITLE_WITH_LOCATION.matcher(normalized);
        if (withLocation.matches()) {
            return clean(withLocation.group(1));
        }
        Matcher plain = INDEED_TITLE_PLAIN.matcher(normalized);
        return plain.matches() ? clean(plain.group(1)) : null;
    }

    private String locationFromIndeedTitle(String title) {
        String normalized = stripAggregatorSuffix(title);
        if (normalized == null) {
            return null;
        }
        Matcher withLocation = INDEED_TITLE_WITH_LOCATION.matcher(normalized);
        return withLocation.matches() ? clean(withLocation.group(3)) : null;
    }

    private String companyFromJobStreetTitle(String title) {
        String normalized = stripAggregatorSuffix(title);
        if (normalized == null) {
            return null;
        }
        Matcher matcher = JOBSTREET_TITLE.matcher(normalized);
        return matcher.matches() ? clean(matcher.group(2)) : null;
    }

    private String positionFromJobStreetTitle(String title) {
        String normalized = stripAggregatorSuffix(title);
        if (normalized == null) {
            return null;
        }
        Matcher matcher = JOBSTREET_TITLE.matcher(normalized);
        return matcher.matches() ? clean(matcher.group(1)) : null;
    }

    private String stripAggregatorSuffix(String title) {
        if (title == null || title.isBlank()) {
            return null;
        }
        return title
                .replaceAll("(?i)\\s*[|\\-]\\s*LinkedIn(\\s+Jobs)?\\s*$", "")
                .replaceAll("(?i)\\s*[|\\-]\\s*Indeed(\\.[a-z]+)?\\s*$", "")
                .replaceAll("(?i)\\s*[|\\-]\\s*JobStreet.*$", "")
                .replaceAll("(?i)\\s*[|\\-]\\s*Glassdoor.*$", "")
                .trim();
    }

    private String usableSiteName(String siteName) {
        if (siteName == null || siteName.isBlank()) {
            return null;
        }
        String normalized = siteName.toLowerCase(Locale.ROOT).trim();
        return AGGREGATOR_SITE_NAMES.contains(normalized) ? null : siteName;
    }

    private String innerText(Pattern pattern, String html) {
        return clean(stripTags(matchFirst(pattern, html)));
    }

    private String innerHtml(Pattern pattern, String html) {
        return matchFirst(pattern, html);
    }

    private String matchFirst(Pattern pattern, String html) {
        Matcher matcher = pattern.matcher(html);
        return matcher.find() ? matcher.group(1) : null;
    }

    private String matchAnyGroup(Pattern pattern, String html) {
        Matcher matcher = pattern.matcher(html);
        if (!matcher.find()) {
            return null;
        }
        for (int i = 1; i <= matcher.groupCount(); i++) {
            String value = matcher.group(i);
            if (value != null && !value.isBlank()) {
                return decodeJson(stripTags(value));
            }
        }
        return null;
    }

    private String stripTags(String value) {
        if (value == null) {
            return null;
        }
        return value.replaceAll("<[^>]+>", " ");
    }

    private String nestedName(String json, String key) {
        Pattern pattern = Pattern.compile(
                "\"" + Pattern.quote(key) + "\"\\s*:\\s*\\{[^}]*?\"name\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"",
                Pattern.CASE_INSENSITIVE | Pattern.DOTALL
        );
        Matcher matcher = pattern.matcher(json);
        if (matcher.find()) {
            return decodeJson(matcher.group(1));
        }
        Pattern plain = Pattern.compile(
                "\"" + Pattern.quote(key) + "\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"",
                Pattern.CASE_INSENSITIVE
        );
        Matcher plainMatcher = plain.matcher(json);
        if (plainMatcher.find()) {
            return decodeJson(plainMatcher.group(1));
        }
        return null;
    }

    private String nestedUrl(String json, String key) {
        Pattern pattern = Pattern.compile(
                "\"" + Pattern.quote(key) + "\"\\s*:\\s*\\{[^}]*?\"(?:url|sameAs)\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"",
                Pattern.CASE_INSENSITIVE | Pattern.DOTALL
        );
        Matcher matcher = pattern.matcher(json);
        if (matcher.find()) {
            return decodeJson(matcher.group(1));
        }
        return null;
    }

    private String jsonString(String json, String parent, String child) {
        Pattern pattern = Pattern.compile(
                "\"" + Pattern.quote(parent) + "\"\\s*:\\s*\\{[^}]*?\"" + Pattern.quote(child)
                        + "\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"",
                Pattern.CASE_INSENSITIVE | Pattern.DOTALL
        );
        Matcher matcher = pattern.matcher(json);
        return matcher.find() ? decodeJson(matcher.group(1)) : null;
    }

    private String jsonTopLevelString(String json, String key) {
        Pattern pattern = Pattern.compile(
                "\"" + Pattern.quote(key) + "\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"",
                Pattern.CASE_INSENSITIVE
        );
        Matcher matcher = pattern.matcher(json);
        return matcher.find() ? decodeJson(matcher.group(1)) : null;
    }

    private List<String> pathSegments(String path) {
        List<String> segments = new ArrayList<>();
        for (String part : path.split("/")) {
            if (!part.isBlank()) {
                segments.add(part);
            }
        }
        return segments;
    }

    private boolean hostContains(String host, String needle) {
        return host.equals(needle) || host.endsWith("." + needle) || host.contains(needle);
    }

    private boolean isLinkedIn(String host) {
        return hostContains(host, "linkedin.com");
    }

    private boolean isIndeed(String host) {
        return hostContains(host, "indeed.com");
    }

    private boolean isJobStreet(String host) {
        return hostContains(host, "jobstreet.com")
                || hostContains(host, "jobstreet.com.ph")
                || hostContains(host, "jobstreet.com.sg")
                || hostContains(host, "jobstreet.com.my")
                || hostContains(host, "jobstreet.com.id");
    }

    private boolean isAggregatorHost(String host) {
        return isLinkedIn(host) || isIndeed(host) || isJobStreet(host) || hostContains(host, "glassdoor.");
    }

    private String hostOf(URI uri) {
        return uri.getHost() == null ? "" : uri.getHost().toLowerCase(Locale.ROOT);
    }

    private String humanizeSlug(String slug) {
        if (slug == null || slug.isBlank()) {
            return null;
        }
        String[] parts = slug.replace('_', '-').split("-");
        StringBuilder builder = new StringBuilder();
        for (String part : parts) {
            if (part.isBlank()) {
                continue;
            }
            if (!builder.isEmpty()) {
                builder.append(' ');
            }
            builder.append(Character.toUpperCase(part.charAt(0)));
            if (part.length() > 1) {
                builder.append(part.substring(1));
            }
        }
        return builder.toString();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }

    private String clean(String value) {
        if (value == null) {
            return null;
        }
        String cleaned = decode(value).replaceAll("\\s+", " ").trim();
        return cleaned.isEmpty() ? null : cleaned;
    }

    private String cleanMultiline(String value) {
        if (value == null) {
            return null;
        }
        String cleaned = decode(value)
                .replace("\r\n", "\n")
                .replace('\r', '\n')
                .replaceAll("(?i)<br\\s*/?>", "\n")
                .replaceAll("(?i)</p>", "\n\n")
                .replaceAll("(?i)</h[1-6]>", "\n\n")
                .replaceAll("(?i)<li[^>]*>", "\n- ")
                .replaceAll("(?i)</li>", "")
                .replaceAll("(?i)</?(ul|ol)[^>]*>", "\n")
                .replaceAll("(?i)</div>", "\n")
                .replaceAll("(?i)&nbsp;", " ")
                .replaceAll("<[^>]+>", "")
                .replaceAll("[ \\t\\x0B\\f]+", " ")
                .replaceAll(" *\\n *", "\n")
                .replaceAll("\\n{3,}", "\n\n")
                .trim();
        return cleaned.isEmpty() ? null : cleaned;
    }

    private String truncate(String value, int max) {
        if (value == null || value.length() <= max) {
            return value;
        }
        return value.substring(0, max);
    }

    private String decode(String value) {
        return value
                .replace("&amp;", "&")
                .replace("&quot;", "\"")
                .replace("&#39;", "'")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&nbsp;", " ");
    }

    private String decodeJson(String value) {
        return value
                .replace("\\\"", "\"")
                .replace("\\n", "\n")
                .replace("\\/", "/")
                .replace("\\\\", "\\");
    }

    private record MetaValues(
            String siteName,
            String ogTitle,
            String description,
            String location,
            String title
    ) {
    }

    private record JsonLdJobPosting(
            String companyName,
            String companyWebsite,
            String position,
            String description,
            String location,
            BigDecimal salaryExpectation
    ) {
    }

    private record BoardExtract(
            String companyName,
            String position,
            String description,
            String location,
            BigDecimal salaryExpectation
    ) {
        static BoardExtract empty() {
            return new BoardExtract(null, null, null, null, null);
        }
    }
}
