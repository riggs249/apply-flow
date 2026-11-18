package com.applyflow.application.service;

import com.applyflow.application.dto.AnalyticsMetrics;
import com.applyflow.application.dto.AnalyticsPoint;
import com.applyflow.application.dto.AnalyticsResponse;
import com.applyflow.application.dto.InterviewConversionPoint;
import com.applyflow.application.entity.ApplicationStatus;
import com.applyflow.application.entity.EmploymentType;
import com.applyflow.application.entity.ProcessStage;
import com.applyflow.application.entity.ReminderStatus;
import com.applyflow.application.repository.InterviewRepository;
import com.applyflow.application.repository.JobApplicationRepository;
import com.applyflow.application.repository.ReminderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class AnalyticsServiceImpl implements AnalyticsService {
    private static final Set<ApplicationStatus> TERMINAL_STATUSES = Set.of(
            ApplicationStatus.HIRED,
            ApplicationStatus.REJECTED,
            ApplicationStatus.WITHDRAWN
    );
    private static final Set<ApplicationStatus> RESPONSE_STATUSES = Set.of(
            ApplicationStatus.IN_PROCESS,
            ApplicationStatus.HIRED,
            ApplicationStatus.REJECTED
    );

    private final JobApplicationRepository applicationRepository;
    private final InterviewRepository interviewRepository;
    private final ReminderRepository reminderRepository;

    public AnalyticsServiceImpl(JobApplicationRepository applicationRepository,
                                InterviewRepository interviewRepository,
                                ReminderRepository reminderRepository) {
        this.applicationRepository = applicationRepository;
        this.interviewRepository = interviewRepository;
        this.reminderRepository = reminderRepository;
    }

    @Override
    public AnalyticsResponse getDashboard(UUID userId, LocalDate fromDate, LocalDate toDate) {
        LocalDate effectiveFrom = fromDate;
        LocalDate effectiveTo = toDate;
        if (effectiveFrom != null && effectiveTo != null && effectiveFrom.isAfter(effectiveTo)) {
            throw new IllegalArgumentException("fromDate must be before or equal to toDate");
        }

        boolean filterFrom = effectiveFrom != null;
        boolean filterTo = effectiveTo != null;
        LocalDate boundFrom = filterFrom ? effectiveFrom : LocalDate.EPOCH;
        LocalDate boundTo = filterTo ? effectiveTo : LocalDate.EPOCH;
        Instant fromInstant = filterFrom
                ? effectiveFrom.atStartOfDay(ZoneOffset.UTC).toInstant()
                : Instant.EPOCH;
        Instant toInstant = filterTo
                ? effectiveTo.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant()
                : Instant.EPOCH;

        List<Object[]> statusRows = applicationRepository.countByStatusInRange(
                userId, filterFrom, boundFrom, filterTo, boundTo);
        Map<ApplicationStatus, Long> statusCounts = new EnumMap<>(ApplicationStatus.class);
        long total = 0;
        long responded = 0;
        for (Object[] row : statusRows) {
            ApplicationStatus status = (ApplicationStatus) row[0];
            long count = (Long) row[1];
            statusCounts.put(status, count);
            total += count;
            if (RESPONSE_STATUSES.contains(status)) {
                responded += count;
            }
        }
        if (total == 0) {
            total = applicationRepository.countInRange(userId, filterFrom, boundFrom, filterTo, boundTo);
        }

        long active = statusCounts.entrySet().stream()
                .filter(entry -> !TERMINAL_STATUSES.contains(entry.getKey()))
                .mapToLong(Map.Entry::getValue).sum();
        long offers = statusCounts.getOrDefault(ApplicationStatus.HIRED, 0L);
        long rejections = statusCounts.getOrDefault(ApplicationStatus.REJECTED, 0L);
        long pendingFollowUps = reminderRepository.countByUserIdAndStatus(userId, ReminderStatus.PENDING)
                + reminderRepository.countByUserIdAndStatus(userId, ReminderStatus.OVERDUE);

        long interviewsScheduled = interviewRepository.countScheduledInRange(
                userId, filterFrom, fromInstant, filterTo, toInstant);
        List<Object[]> interviewRows = interviewRepository.findAnalyticsRows(
                userId, filterFrom, fromInstant, filterTo, toInstant);
        Set<UUID> interviewedApplicationIds = interviewApplicationIds(interviewRows);

        double responseRate = percent(responded, total);
        double interviewConversionRate = percent(interviewedApplicationIds.size(), total);

        AnalyticsMetrics metrics = new AnalyticsMetrics(
                total,
                active,
                interviewsScheduled,
                offers,
                rejections,
                pendingFollowUps,
                round(responseRate),
                round(interviewConversionRate)
        );

        List<Object[]> applicationRows = applicationRepository.findAnalyticsRows(
                userId, filterFrom, boundFrom, filterTo, boundTo);
        Map<ProcessStage, Long> stageCounts = new EnumMap<>(ProcessStage.class);
        for (Object[] row : applicationRepository.countByProcessStageInRange(
                userId, ApplicationStatus.IN_PROCESS, filterFrom, boundFrom, filterTo, boundTo)) {
            stageCounts.put((ProcessStage) row[0], (Long) row[1]);
        }
        return new AnalyticsResponse(
                metrics,
                monthlyApplications(applicationRows),
                recruitmentStages(statusCounts, stageCounts),
                applicationOutcomes(statusCounts),
                interviewConversion(applicationRows, interviewRows),
                employmentTypes(applicationRepository.countByEmploymentTypeInRange(
                        userId, filterFrom, boundFrom, filterTo, boundTo))
        );
    }

    private Set<UUID> interviewApplicationIds(List<Object[]> interviewRows) {
        return interviewRows.stream()
                .map(row -> (UUID) row[1])
                .collect(java.util.stream.Collectors.toSet());
    }

    private List<AnalyticsPoint> monthlyApplications(List<Object[]> rows) {
        Map<YearMonth, Long> counts = new LinkedHashMap<>();
        for (Object[] row : rows) {
            LocalDate date = (LocalDate) row[0];
            if (date != null) {
                counts.merge(YearMonth.from(date), 1L, Long::sum);
            }
        }
        return counts.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> new AnalyticsPoint(monthLabel(entry.getKey()), entry.getValue()))
                .toList();
    }

    private List<AnalyticsPoint> recruitmentStages(Map<ApplicationStatus, Long> counts,
                                                   Map<ProcessStage, Long> stageCounts) {
        List<AnalyticsPoint> points = new ArrayList<>();
        for (ApplicationStatus status : ApplicationStatus.values()) {
            if (status == ApplicationStatus.IN_PROCESS) {
                long staged = 0;
                for (ProcessStage stage : ProcessStage.values()) {
                    long count = stageCounts.getOrDefault(stage, 0L);
                    if (count > 0) {
                        points.add(new AnalyticsPoint(label(stage.name()), count));
                        staged += count;
                    }
                }
                long unstaged = counts.getOrDefault(status, 0L) - staged;
                if (unstaged > 0) {
                    points.add(new AnalyticsPoint(label(status.name()), unstaged));
                }
                continue;
            }
            long count = counts.getOrDefault(status, 0L);
            if (count > 0) {
                points.add(new AnalyticsPoint(label(status.name()), count));
            }
        }
        return points;
    }

    private List<AnalyticsPoint> applicationOutcomes(Map<ApplicationStatus, Long> counts) {
        return List.of(
                new AnalyticsPoint("Hired", counts.getOrDefault(ApplicationStatus.HIRED, 0L)),
                new AnalyticsPoint("Rejected", counts.getOrDefault(ApplicationStatus.REJECTED, 0L)),
                new AnalyticsPoint("Withdrawn", counts.getOrDefault(ApplicationStatus.WITHDRAWN, 0L)),
                new AnalyticsPoint("Active", counts.entrySet().stream()
                        .filter(entry -> !TERMINAL_STATUSES.contains(entry.getKey()))
                        .mapToLong(Map.Entry::getValue).sum())
        ).stream().filter(point -> point.value() > 0).toList();
    }

    private List<InterviewConversionPoint> interviewConversion(List<Object[]> applicationRows,
                                                              List<Object[]> interviewRows) {
        Map<YearMonth, Long> submitted = new LinkedHashMap<>();
        for (Object[] row : applicationRows) {
            LocalDate date = (LocalDate) row[0];
            if (date != null) {
                submitted.merge(YearMonth.from(date), 1L, Long::sum);
            }
        }
        Map<YearMonth, Set<UUID>> interviewedByMonth = new LinkedHashMap<>();
        for (Object[] row : interviewRows) {
            Instant scheduledAt = (Instant) row[0];
            UUID applicationId = (UUID) row[1];
            YearMonth month = YearMonth.from(scheduledAt.atZone(ZoneOffset.UTC).toLocalDate());
            interviewedByMonth.computeIfAbsent(month, key -> new java.util.HashSet<>()).add(applicationId);
        }
        Map<YearMonth, InterviewConversionPoint> allMonths = new LinkedHashMap<>();
        submitted.keySet().forEach(month -> allMonths.put(month,
                new InterviewConversionPoint(monthLabel(month), submitted.get(month),
                        0L, 0)));
        interviewedByMonth.keySet().forEach(month -> allMonths.putIfAbsent(month,
                new InterviewConversionPoint(monthLabel(month), submitted.getOrDefault(month, 0L),
                        0L, 0)));
        return allMonths.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    YearMonth month = entry.getKey();
                    long submittedCount = submitted.getOrDefault(month, 0L);
                    long interviewedCount = interviewedByMonth.getOrDefault(month, Set.of()).size();
                    return new InterviewConversionPoint(monthLabel(month), submittedCount,
                            interviewedCount, round(percent(interviewedCount, submittedCount)));
                })
                .toList();
    }

    private List<AnalyticsPoint> employmentTypes(List<Object[]> rows) {
        return rows.stream()
                .filter(row -> row[0] != null)
                .map(row -> new AnalyticsPoint(label(((EmploymentType) row[0]).name()), (Long) row[1]))
                .toList();
    }

    private double percent(long numerator, long denominator) {
        return denominator == 0 ? 0 : (numerator * 100.0) / denominator;
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private String monthLabel(YearMonth month) {
        return month.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + month.getYear();
    }

    private String label(String value) {
        String spaced = value.toLowerCase(Locale.ENGLISH).replace('_', ' ');
        if (spaced.isEmpty()) {
            return spaced;
        }
        return Character.toUpperCase(spaced.charAt(0)) + spaced.substring(1);
    }
}
