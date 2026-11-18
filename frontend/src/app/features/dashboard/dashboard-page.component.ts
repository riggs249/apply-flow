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

    <form class="range-filter" [formGroup]="range">
      <app-date-picker placeholder="From" formControlName="from" />
      <app-date-picker placeholder="To" formControlName="to" />
      <button type="button" class="filter-button" (click)="load()">Apply range</button>
      <button type="button" class="clear-button" (click)="clearRange()">Clear</button>
    </form>

    @if (error) { <div class="error">{{ error }}</div> }
    @if (loading) { <div class="state">Loading analytics…</div> }
    @else if (analytics) {
      <section class="stats-grid" aria-label="Application statistics">
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
        <section class="empty-state"><mat-icon>analytics</mat-icon><h2>No application data found</h2><p>Try another date range or add your first job application.</p><a class="primary-button" routerLink="/applications/new">Add application</a></section>
      } @else {
        <section class="chart-grid">
          <article class="panel wide">
            <div class="panel-heading"><div><h2>Applications submitted per month</h2><p>Monthly application volume</p></div></div>
            <div class="chart"><canvas baseChart [type]="'line'" [data]="monthlyChart" [options]="lineOptions"></canvas></div>
          </article>

          <article class="panel">
            <div class="panel-heading"><div><h2>Recruitment stages</h2><p>Current application pipeline</p></div></div>
            <div class="chart"><canvas baseChart [type]="'doughnut'" [data]="stageChart" [options]="doughnutOptions"></canvas></div>
          </article>

          <article class="panel">
            <div class="panel-heading"><div><h2>Application outcomes</h2><p>Terminal and active statuses</p></div></div>
            <div class="chart"><canvas baseChart [type]="'doughnut'" [data]="outcomeChart" [options]="doughnutOptions"></canvas></div>
          </article>

          <article class="panel wide">
            <div class="panel-heading"><div><h2>Interview conversion trends</h2><p>Applications and interviews by month</p></div></div>
            <div class="chart"><canvas baseChart [type]="'bar'" [data]="conversionChart" [options]="barOptions"></canvas></div>
          </article>

          <article class="panel">
            <div class="panel-heading"><div><h2>Applications by employment type</h2><p>Full-time, contract, and other types</p></div></div>
            <div class="chart"><canvas baseChart [type]="'doughnut'" [data]="employmentChart" [options]="doughnutOptions"></canvas></div>
          </article>
        </section>
      }
    }

    <section class="notifications-panel">
      <div class="panel-heading"><div><h2>Upcoming and overdue reminders</h2><p>Notifications that need attention</p></div><a class="text-button" routerLink="/reminders">View all</a></div>
      @if (!notifications.length) { <p class="empty-notifications">No upcoming or overdue reminders.</p> }
      @for (item of notifications.slice(0, 4); track item.id) {
        <div class="upcoming-item"><span class="date-badge" [class.muted]="item.timingState === 'OVERDUE'"><strong>{{ item.remindAt | date:'d' }}</strong><small>{{ item.remindAt | date:'MMM' }}</small></span><div><strong>{{ item.title }}</strong><span>{{ item.companyName ? item.companyName + ' · ' + item.applicationPosition : item.reminderType }}</span></div><mat-icon>chevron_right</mat-icon></div>
      }
    </section>
  `,
  styles: [`
    .stats-grid {
      display: grid;
      gap: .8rem;
      grid-template-columns: repeat(4, 1fr);
      margin-bottom: 1.25rem;
    }
    .chart-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .panel.wide { grid-column: span 2; }
    .chart { height: 280px; margin-top: 1rem; }
    .empty-state {
      align-items: center;
      background: var(--af-surface);
      border: 1px solid var(--af-border);
      border-radius: var(--af-radius-lg);
      box-shadow: var(--af-shadow);
      display: flex;
      flex-direction: column;
      padding: 3rem;
      text-align: center;
    }
    .empty-state mat-icon {
      color: var(--af-accent);
      font-size: 38px;
      height: 38px;
      width: 38px;
    }
    .empty-state h2 { font-size: 1.05rem; margin: .7rem 0 .25rem; }
    .empty-state p { color: var(--af-text-faint); margin: 0 0 1rem; }
    .notifications-panel { margin-top: 1rem; }
    .empty-notifications {
      border-top: 1px solid var(--af-divider);
      color: var(--af-text-faint);
      font-size: .78rem;
      margin: 1.2rem 0 0;
      padding-top: 1.1rem;
    }
    .upcoming-item {
      align-items: center;
      border-top: 1px solid var(--af-divider);
      display: flex;
      gap: .8rem;
      margin-top: 1rem;
      padding-top: 1rem;
    }
    .upcoming-item > div { display: flex; flex: 1; flex-direction: column; }
    .upcoming-item strong { color: var(--af-text); font-size: .82rem; }
    .upcoming-item span { color: var(--af-text-faint); font-size: .72rem; }
    .upcoming-item mat-icon { color: var(--af-text-faint); font-size: 19px; }
    .date-badge {
      align-items: center !important;
      background: var(--af-accent-soft);
      border-radius: var(--af-radius-sm);
      color: var(--af-accent) !important;
      display: flex !important;
      flex: 0 0 auto !important;
      flex-direction: column;
      padding: .45rem .65rem;
    }
    .date-badge.muted {
      background: var(--af-border-soft);
      color: var(--af-text-muted) !important;
    }
    .date-badge strong { font-size: .95rem; }
    .date-badge small { color: inherit !important; font-size: .55rem; }
    @media (max-width: 1000px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .chart-grid { grid-template-columns: 1fr; }
      .panel.wide { grid-column: auto; }
    }
    @media (max-width: 600px) {
      .stats-grid { grid-template-columns: 1fr; }
      .range-filter { align-items: stretch; flex-wrap: wrap; }
      .range-filter label { flex: 1 1 130px; }
    }
  `],
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
