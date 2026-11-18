package com.applyflow.application.service;

import com.applyflow.application.dto.AnalyticsResponse;
import com.applyflow.application.entity.ReminderStatus;
import com.applyflow.application.repository.InterviewRepository;
import com.applyflow.application.repository.JobApplicationRepository;
import com.applyflow.application.repository.ReminderRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceImplTest {
    @Mock JobApplicationRepository applicationRepository;
    @Mock InterviewRepository interviewRepository;
    @Mock ReminderRepository reminderRepository;
    @InjectMocks AnalyticsServiceImpl service;

    @Test
    void rejectsReversedDateRange() {
        UUID userId = UUID.randomUUID();

        assertThatThrownBy(() -> service.getDashboard(
                userId, LocalDate.of(2026, 12, 1), LocalDate.of(2026, 1, 1)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("before");
    }

    @Test
    void returnsEmptyAnalyticsWhenUserHasNoData() {
        UUID userId = UUID.randomUUID();
        LocalDate from = LocalDate.of(2026, 1, 1);
        LocalDate to = LocalDate.of(2026, 1, 31);
        when(applicationRepository.countByStatusInRange(userId, true, from, true, to)).thenReturn(List.of());
        when(applicationRepository.countByProcessStageInRange(
                eq(userId), any(), eq(true), eq(from), eq(true), eq(to))).thenReturn(List.of());
        when(applicationRepository.countInRange(userId, true, from, true, to)).thenReturn(0L);
        when(reminderRepository.countByUserIdAndStatus(userId, ReminderStatus.PENDING)).thenReturn(0L);
        when(reminderRepository.countByUserIdAndStatus(userId, ReminderStatus.OVERDUE)).thenReturn(0L);
        when(interviewRepository.countScheduledInRange(
                eq(userId), eq(true), any(), eq(true), any())).thenReturn(0L);
        when(interviewRepository.findAnalyticsRows(
                eq(userId), eq(true), any(), eq(true), any())).thenReturn(List.of());
        when(applicationRepository.findAnalyticsRows(userId, true, from, true, to)).thenReturn(List.of());
        when(applicationRepository.countByEmploymentTypeInRange(userId, true, from, true, to)).thenReturn(List.of());

        AnalyticsResponse response = service.getDashboard(userId, from, to);

        assertThat(response.metrics().totalApplications()).isZero();
        assertThat(response.monthlyApplications()).isEmpty();
        assertThat(response.recruitmentStages()).isEmpty();
        assertThat(response.applicationOutcomes()).isEmpty();
        assertThat(response.employmentTypes()).isEmpty();
    }
}
