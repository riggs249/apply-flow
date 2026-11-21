import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { DatePickerComponent } from '../../shared/components/date-picker/date-picker.component';
import { ReminderService } from '../reminders/reminder.service';
import { ReminderRecord } from '../reminders/reminder.models';
import { AnalyticsService } from './analytics.service';
import { AnalyticsResponse } from './analytics.models';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    PageHeaderComponent,
    StatCardComponent,
    DatePickerComponent,
    RouterLink,
    DatePipe,
    BaseChartDirective,
  ],
  template: `
    <app-page-header title="Job search dashboard" description="Monitor applications, interviews, outcomes, and follow-ups.">
      <a class="primary-button" routerLink="/applications/new"><mat-icon>add</mat-icon> Add application</a>
    </app-page-header>

    <form class="range-filter max-[600px]:!items-stretch" [formGroup]="range">
      <app-date-picker placeholder="From" formControlName="from" />
      <app-date-picker placeholder="To" formControlName="to" />
      <button type="button" class="filter-button" (click)="load()">Apply range</button>
      <button type="button" class="clear-button" (click)="clearRange()">Clear</button>
    </form>

    @if (error) { <div class="error">{{ error }}</div> }
    @if (loading) { <div class="state">Loading analytics…</div> }
    @else if (analytics) {
      <section class="mb-5 grid grid-cols-[repeat(4,1fr)] gap-[.8rem] max-[1000px]:grid-cols-[repeat(2,1fr)] max-[600px]:grid-cols-[1fr]" aria-label="Application statistics">
        <app-stat-card label="Total applications" [value]="analytics.metrics.totalApplications.toString()" trend="In selected range" icon="work_outline" [positive]="true" />
        <app-stat-card label="Active applications" [value]="analytics.metrics.activeApplications.toString()" trend="Not hired, rejected, or withdrawn" icon="pending_actions" [positive]="true" />
        <app-stat-card label="Interviews scheduled" [value]="analytics.metrics.interviewsScheduled.toString()" trend="In selected range" icon="event" [positive]="true" />
        <app-stat-card label="Hired" [value]="analytics.metrics.offersReceived.toString()" trend="Reached hired status" icon="workspace_premium" [positive]="true" />
        <app-stat-card label="Rejections" [value]="analytics.metrics.rejections.toString()" trend="In selected range" icon="cancel" />
        <app-stat-card label="Pending follow-ups" [value]="analytics.metrics.pendingFollowUps.toString()" trend="Pending or overdue" icon="notifications_none" />
        <app-stat-card label="Response rate" [value]="analytics.metrics.applicationResponseRate + '%'" trend="Moved beyond wishlist" icon="trending_up" [positive]="true" />
        <app-stat-card label="Interview conversion" [value]="analytics.metrics.interviewConversionRate + '%'" trend="Applications reaching interviews" icon="swap_horiz" [positive]="true" />
      </section>

      @if (hasNoData) {
        <section class="flex flex-col items-center rounded-af-lg border border-af-border bg-af-surface p-12 text-center shadow-af">
          <mat-icon class="!size-[38px] !text-[38px] text-af-accent">analytics</mat-icon>
          <h2 class="mx-0 mb-1 mt-[.7rem] text-[1.05rem]">No application data found</h2>
          <p class="m-0 mb-4 text-af-text-faint">Try another date range or add your first job application.</p>
          <a class="primary-button" routerLink="/applications/new">Add application</a>
        </section>
      } @else {
        <section class="grid grid-cols-2 gap-4 max-[1000px]:grid-cols-[1fr]">
          <article class="panel col-span-2 max-[1000px]:col-auto">
            <div class="panel-heading"><div><h2>Applications submitted per month</h2><p>Monthly application volume</p></div></div>
            <div class="mt-4 h-[280px]"><canvas baseChart [type]="'line'" [data]="monthlyChart" [options]="lineOptions"></canvas></div>
          </article>

          <article class="panel">
            <div class="panel-heading"><div><h2>Recruitment stages</h2><p>Current application pipeline</p></div></div>
            <div class="mt-4 h-[280px]"><canvas baseChart [type]="'doughnut'" [data]="stageChart" [options]="doughnutOptions"></canvas></div>
          </article>

          <article class="panel">
            <div class="panel-heading"><div><h2>Application outcomes</h2><p>Terminal and active statuses</p></div></div>
            <div class="mt-4 h-[280px]"><canvas baseChart [type]="'doughnut'" [data]="outcomeChart" [options]="doughnutOptions"></canvas></div>
          </article>

          <article class="panel col-span-2 max-[1000px]:col-auto">
            <div class="panel-heading"><div><h2>Interview conversion trends</h2><p>Applications and interviews by month</p></div></div>
            <div class="mt-4 h-[280px]"><canvas baseChart [type]="'bar'" [data]="conversionChart" [options]="barOptions"></canvas></div>
          </article>

          <article class="panel">
            <div class="panel-heading"><div><h2>Applications by employment type</h2><p>Full-time, contract, and other types</p></div></div>
            <div class="mt-4 h-[280px]"><canvas baseChart [type]="'doughnut'" [data]="employmentChart" [options]="doughnutOptions"></canvas></div>
          </article>
        </section>
      }
    }

    <section class="notifications-panel mt-4">
      <div class="panel-heading"><div><h2>Upcoming and overdue reminders</h2><p>Notifications that need attention</p></div><a class="text-button" routerLink="/reminders">View all</a></div>
      @if (!notifications.length) { <p class="m-0 mt-[1.2rem] border-t border-af-divider pt-[1.1rem] text-[.78rem] text-af-text-faint">No upcoming or overdue reminders.</p> }
      @for (item of notifications.slice(0, 4); track item.id) {
        <div class="mt-4 flex items-center gap-[.8rem] border-t border-af-divider pt-4">
          <span
            class="flex flex-none flex-col items-center rounded-af-sm px-[.65rem] py-[.45rem]"
            [class.bg-af-accent-soft]="item.timingState !== 'OVERDUE'"
            [class.text-af-accent]="item.timingState !== 'OVERDUE'"
            [class.bg-af-border-soft]="item.timingState === 'OVERDUE'"
            [class.text-af-text-muted]="item.timingState === 'OVERDUE'"
          ><strong class="text-[.95rem] text-af-text">{{ item.remindAt | date:'d' }}</strong><small class="text-[.55rem] text-inherit">{{ item.remindAt | date:'MMM' }}</small></span>
          <div class="flex flex-1 flex-col"><strong class="text-[.82rem] text-af-text">{{ item.title }}</strong><span class="text-[.72rem] text-af-text-faint">{{ item.companyName ? item.companyName + ' · ' + item.applicationPosition : item.reminderType }}</span></div>
          <mat-icon class="!text-[19px] text-af-text-faint">chevron_right</mat-icon>
        </div>
      }
    </section>
  `,
})
export class DashboardPageComponent implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly reminderService = inject(ReminderService);
  private readonly fb = inject(FormBuilder);

  readonly range = this.fb.nonNullable.group({
    from: null as Date | null,
    to: null as Date | null,
  });
  analytics?: AnalyticsResponse;
  notifications: ReminderRecord[] = [];
  loading = true;
  error = '';

  private readonly statusColors = ['#64748b', '#0f766e', '#14b8a6', '#d89b37', '#0b5f58', '#be123c', '#94a3b8', '#5eead4'];
  private readonly outcomeColors = ['#0b5f58', '#be123c', '#94a3b8', '#0f766e'];

  monthlyChart: ChartData<'line'> = { labels: [], datasets: [{ data: [], label: 'Applications', borderColor: '#0f766e', backgroundColor: '#0f766e22', tension: 0.35, fill: true }] };
  stageChart: ChartData<'doughnut'> = { labels: [], datasets: [{ data: [], backgroundColor: this.statusColors }] };
  outcomeChart: ChartData<'doughnut'> = { labels: [], datasets: [{ data: [], backgroundColor: this.outcomeColors }] };
  conversionChart: ChartData<'bar'> = { labels: [], datasets: [{ data: [], label: 'Applications', backgroundColor: '#0f766e' }, { data: [], label: 'Interviewed', backgroundColor: '#d89b37' }] };
  employmentChart: ChartData<'doughnut'> = { labels: [], datasets: [{ data: [], backgroundColor: ['#0f766e', '#0b5f58', '#d89b37', '#be123c', '#94a3b8'] }] };

  lineOptions: ChartOptions<'line'> = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };
  doughnutOptions: ChartOptions<'doughnut'> = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } };
  barOptions: ChartOptions<'bar'> = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } };

  get hasNoData(): boolean {
    return !this.analytics?.metrics.totalApplications;
  }

  ngOnInit(): void {
    this.load();
    this.reminderService.notifications().subscribe({
      next: items => this.notifications = items,
      error: () => this.notifications = [],
    });
  }

  load(): void {
    const value = this.range.getRawValue();
    this.loading = true;
    this.error = '';
    this.analyticsService.dashboard(
      this.toIsoDate(value.from) || undefined,
      this.toIsoDate(value.to) || undefined,
    ).subscribe({
      next: response => { this.analytics = response; this.buildCharts(response); this.loading = false; },
      error: () => { this.error = 'Analytics could not be loaded.'; this.loading = false; },
    });
  }

  clearRange(): void {
    this.range.reset({ from: null, to: null });
    this.load();
  }

  private toIsoDate(value: Date | null): string {
    if (!value) return '';
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  buildCharts(response: AnalyticsResponse): void {
    this.monthlyChart = { labels: response.monthlyApplications.map(item => item.label), datasets: [{ data: response.monthlyApplications.map(item => item.value), label: 'Applications', borderColor: '#0f766e', backgroundColor: '#0f766e22', tension: 0.35, fill: true }] };
    this.stageChart = { labels: response.recruitmentStages.map(item => item.label), datasets: [{ data: response.recruitmentStages.map(item => item.value), backgroundColor: this.statusColors }] };
    this.outcomeChart = { labels: response.applicationOutcomes.map(item => item.label), datasets: [{ data: response.applicationOutcomes.map(item => item.value), backgroundColor: this.outcomeColors }] };
    this.conversionChart = { labels: response.interviewConversion.map(item => item.label), datasets: [{ data: response.interviewConversion.map(item => item.applications), label: 'Applications', backgroundColor: '#0f766e' }, { data: response.interviewConversion.map(item => item.interviews), label: 'Interviewed', backgroundColor: '#d89b37' }] };
    this.employmentChart = { labels: response.employmentTypes.map(item => item.label), datasets: [{ data: response.employmentTypes.map(item => item.value), backgroundColor: ['#0f766e', '#0b5f58', '#d89b37', '#be123c', '#94a3b8'] }] };
  }
}
