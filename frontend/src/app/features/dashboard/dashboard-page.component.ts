import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { DatePickerComponent } from '../../shared/components/date-picker/date-picker.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { ReminderService } from '../reminders/reminder.service';
import { ReminderRecord } from '../reminders/reminder.models';
import { AnalyticsService } from './analytics.service';
import { AnalyticsPoint, AnalyticsResponse } from './analytics.models';

type TrendChartKey = 'monthly' | 'conversion' | 'interviews' | 'conversionRate' | 'cumulative';
type PieChartKey = 'stages' | 'outcomes' | 'employment' | 'interviewReach' | 'responseSplit' | 'reminders';

interface ChartOption<T extends string> {
  key: T;
  label: string;
  description: string;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  providers: [provideCharts(withDefaultRegisterables())],
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    PageHeaderComponent,
    StatCardComponent,
    DatePickerComponent,
    LoadingStateComponent,
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
    @if (loading) { <app-loading-state message="Loading analytics…" /> }
    @else if (analytics) {
      <section class="mb-5 grid grid-cols-[repeat(4,1fr)] gap-[.8rem] max-[1000px]:grid-cols-[repeat(2,1fr)] max-[600px]:grid-cols-[1fr]" aria-label="Application statistics">
        @for (card of metricCards; track card.label) {
          <app-stat-card [label]="card.label" [value]="card.value" [trend]="card.trend" [icon]="card.icon" [positive]="card.positive" />
        }
      </section>

      @if (hasNoData) {
        <section class="flex flex-col items-center rounded-af-lg border border-af-border bg-af-surface p-12 text-center shadow-af">
          <mat-icon class="!size-[38px] !text-[38px] text-af-accent">analytics</mat-icon>
          <h2 class="mx-0 mb-1 mt-[.7rem] text-[1.05rem]">No application data found</h2>
          <p class="m-0 mb-4 text-af-text-faint">Try another date range or add your first job application.</p>
          <a class="primary-button" routerLink="/applications/new">Add application</a>
        </section>
      } @else {
        <section class="mb-4">
          <article class="panel">
            <div class="panel-heading items-center gap-3">
              <div>
                <h2>{{ activeTrend.label }}</h2>
                <p>{{ activeTrend.description }}</p>
              </div>
              <label class="chart-select">
                <span class="sr-only">Trend chart</span>
                <select [value]="trendChart" (change)="selectTrend($any($event.target).value)">
                  @for (option of trendOptions; track option.key) {
                    <option [value]="option.key">{{ option.label }}</option>
                  }
                </select>
              </label>
            </div>
            <div class="chart-frame mt-4">
              @if (trendIsBar) {
                <canvas baseChart [type]="'bar'" [data]="activeTrendBar" [options]="barOptions"></canvas>
              } @else {
                <canvas baseChart [type]="'line'" [data]="activeTrendLine" [options]="lineOptions"></canvas>
              }
            </div>
          </article>
        </section>

        <section class="grid grid-cols-2 items-stretch gap-4 max-[1000px]:grid-cols-[1fr]">
          <article class="panel flex h-full flex-col">
            <div class="panel-heading items-center gap-3">
              <div>
                <h2>{{ activePie.label }}</h2>
                <p>{{ activePie.description }}</p>
              </div>
              <label class="chart-select">
                <span class="sr-only">Distribution chart</span>
                <select [value]="pieChart" (change)="selectPie($any($event.target).value)">
                  @for (option of pieOptions; track option.key) {
                    <option [value]="option.key">{{ option.label }}</option>
                  }
                </select>
              </label>
            </div>
            <div class="chart-frame mt-4">
              <canvas baseChart [type]="'doughnut'" [data]="activePieData" [options]="doughnutOptions"></canvas>
            </div>
          </article>

          <section class="notifications-panel flex h-full flex-col !m-0">
            <div class="panel-heading">
              <div><h2>Upcoming and overdue reminders</h2><p>Notifications that need attention</p></div>
              <a class="text-button" routerLink="/reminders">View all</a>
            </div>
            @if (!notifications.length) {
              <p class="m-0 mt-[1.2rem] border-t border-af-divider pt-[1.1rem] text-[.78rem] text-af-text-faint">No upcoming or overdue reminders.</p>
            }
            <div class="min-h-0 flex-1 overflow-auto">
              @for (item of notifications.slice(0, 4); track item.id) {
                <div class="mt-4 flex items-center gap-[.8rem] border-t border-af-divider pt-4">
                  <span
                    class="flex flex-none flex-col items-center rounded-af-sm px-[.65rem] py-[.45rem]"
                    [class.bg-af-accent-soft]="item.timingState !== 'OVERDUE'"
                    [class.text-af-accent]="item.timingState !== 'OVERDUE'"
                    [class.bg-af-border-soft]="item.timingState === 'OVERDUE'"
                    [class.text-af-text-muted]="item.timingState === 'OVERDUE'"
                  ><strong class="text-[.95rem] text-af-text">{{ item.remindAt | date:'d' }}</strong><small class="text-[.55rem] text-inherit">{{ item.remindAt | date:'MMM' }}</small></span>
                  <div class="flex min-w-0 flex-1 flex-col">
                    <strong class="truncate text-[.82rem] text-af-text">{{ item.title }}</strong>
                    <span class="truncate text-[.72rem] text-af-text-faint">{{ item.companyName ? item.companyName + ' · ' + item.applicationPosition : item.reminderType }}</span>
                  </div>
                  <mat-icon class="!text-[19px] text-af-text-faint">chevron_right</mat-icon>
                </div>
              }
            </div>
          </section>
        </section>
      }
    }

    @if (!loading && (!analytics || hasNoData)) {
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
    }
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
  metricCards: Array<{ label: string; value: string; trend: string; icon: string; positive: boolean }> = [];

  trendChart: TrendChartKey = 'monthly';
  pieChart: PieChartKey = 'stages';

  readonly trendOptions: ChartOption<TrendChartKey>[] = [
    { key: 'monthly', label: 'Applications per month', description: 'Monthly application volume' },
    { key: 'conversion', label: 'Applications vs interviews', description: 'Submitted applications and interviewed roles by month' },
    { key: 'interviews', label: 'Interviews per month', description: 'Interview volume over time' },
    { key: 'conversionRate', label: 'Conversion rate trend', description: 'Share of applications reaching interviews' },
    { key: 'cumulative', label: 'Cumulative applications', description: 'Running total of applications submitted' },
  ];

  readonly pieOptions: ChartOption<PieChartKey>[] = [
    { key: 'stages', label: 'Recruitment stages', description: 'Current application pipeline' },
    { key: 'outcomes', label: 'Application outcomes', description: 'Terminal and active statuses' },
    { key: 'employment', label: 'Employment type', description: 'Full-time, contract, and other types' },
    { key: 'interviewReach', label: 'Interview reach', description: 'Applications that reached an interview' },
    { key: 'responseSplit', label: 'Response split', description: 'Applications that moved beyond wishlist' },
    { key: 'reminders', label: 'Reminder health', description: 'Upcoming versus overdue reminders' },
  ];

  private readonly palette = ['#0f766e', '#0b5f58', '#14b8a6', '#d89b37', '#be123c', '#64748b', '#94a3b8', '#5eead4'];
  private readonly outcomeColors = ['#0b5f58', '#be123c', '#94a3b8', '#0f766e'];

  private monthlyChart: ChartData<'line'> = this.emptyLine('Applications');
  private interviewsChart: ChartData<'line'> = this.emptyLine('Interviews');
  private conversionRateChart: ChartData<'line'> = this.emptyLine('Conversion %');
  private cumulativeChart: ChartData<'line'> = this.emptyLine('Cumulative');
  private conversionChart: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Applications', backgroundColor: '#0f766e' },
      { data: [], label: 'Interviewed', backgroundColor: '#d89b37' },
    ],
  };

  private pieCharts: Record<PieChartKey, ChartData<'doughnut'>> = {
    stages: this.emptyDoughnut(),
    outcomes: this.emptyDoughnut(),
    employment: this.emptyDoughnut(),
    interviewReach: this.emptyDoughnut(),
    responseSplit: this.emptyDoughnut(),
    reminders: this.emptyDoughnut(),
  };

  activeTrendLine: ChartData<'line'> = this.emptyLine('Applications');
  activeTrendBar: ChartData<'bar'> = this.conversionChart;
  activePieData: ChartData<'doughnut'> = this.emptyDoughnut();

  lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  };
  doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: 8 },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 10, boxHeight: 10, padding: 12, font: { size: 11 } },
      },
    },
  };
  barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12 } } },
    scales: { y: { beginAtZero: true } },
  };

  get hasNoData(): boolean {
    return !this.analytics?.metrics.totalApplications;
  }

  get trendIsBar(): boolean {
    return this.trendChart === 'conversion';
  }

  get activeTrend(): ChartOption<TrendChartKey> {
    return this.trendOptions.find(option => option.key === this.trendChart) ?? this.trendOptions[0];
  }

  get activePie(): ChartOption<PieChartKey> {
    return this.pieOptions.find(option => option.key === this.pieChart) ?? this.pieOptions[0];
  }

  ngOnInit(): void {
    this.load();
    this.reminderService.notifications().subscribe({
      next: items => {
        this.notifications = items;
        this.pieCharts.reminders = this.toDoughnut(this.reminderPoints(items), ['#d89b37', '#0f766e', '#94a3b8']);
        if (this.pieChart === 'reminders') {
          this.activePieData = this.pieCharts.reminders;
        }
      },
      error: () => this.notifications = [],
    });
  }

  selectTrend(value: TrendChartKey): void {
    this.trendChart = value;
    this.syncTrendChart();
  }

  selectPie(value: PieChartKey): void {
    this.pieChart = value;
    this.activePieData = this.cloneDoughnut(this.pieCharts[value]);
  }

  load(): void {
    const value = this.range.getRawValue();
    this.loading = true;
    this.error = '';
    this.analyticsService.dashboard(
      this.toIsoDate(value.from) || undefined,
      this.toIsoDate(value.to) || undefined,
    ).subscribe({
      next: response => {
        this.analytics = response;
        this.metricCards = this.buildMetricCards(response);
        this.buildCharts(response);
        this.loading = false;
      },
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

  private buildMetricCards(response: AnalyticsResponse): Array<{ label: string; value: string; trend: string; icon: string; positive: boolean }> {
    const metrics = response.metrics;
    return [
      { label: 'Total applications', value: metrics.totalApplications.toString(), trend: 'In selected range', icon: 'work_outline', positive: true },
      { label: 'Active applications', value: metrics.activeApplications.toString(), trend: 'Not hired, rejected, or withdrawn', icon: 'pending_actions', positive: true },
      { label: 'Interviews scheduled', value: metrics.interviewsScheduled.toString(), trend: 'In selected range', icon: 'event', positive: true },
      { label: 'Hired', value: metrics.offersReceived.toString(), trend: 'Reached hired status', icon: 'workspace_premium', positive: true },
      { label: 'Rejections', value: metrics.rejections.toString(), trend: 'In selected range', icon: 'cancel', positive: false },
      { label: 'Pending follow-ups', value: metrics.pendingFollowUps.toString(), trend: 'Pending or overdue', icon: 'notifications_none', positive: false },
      { label: 'Response rate', value: `${metrics.applicationResponseRate}%`, trend: 'Moved beyond wishlist', icon: 'trending_up', positive: true },
      { label: 'Interview conversion', value: `${metrics.interviewConversionRate}%`, trend: 'Applications reaching interviews', icon: 'swap_horiz', positive: true },
    ];
  }

  private buildCharts(response: AnalyticsResponse): void {
    const monthlyLabels = response.monthlyApplications.map(item => item.label);
    const monthlyValues = response.monthlyApplications.map(item => item.value);
    const conversionLabels = response.interviewConversion.map(item => item.label);

    this.monthlyChart = {
      labels: monthlyLabels,
      datasets: [{ data: monthlyValues, label: 'Applications', borderColor: '#0f766e', backgroundColor: '#0f766e22', tension: 0.35, fill: true }],
    };
    this.interviewsChart = {
      labels: conversionLabels,
      datasets: [{
        data: response.interviewConversion.map(item => item.interviews),
        label: 'Interviews',
        borderColor: '#d89b37',
        backgroundColor: '#d89b3722',
        tension: 0.35,
        fill: true,
      }],
    };
    this.conversionRateChart = {
      labels: conversionLabels,
      datasets: [{
        data: response.interviewConversion.map(item => item.conversionRate),
        label: 'Conversion %',
        borderColor: '#0b5f58',
        backgroundColor: '#0b5f5822',
        tension: 0.35,
        fill: true,
      }],
    };
    this.cumulativeChart = {
      labels: monthlyLabels,
      datasets: [{
        data: this.runningTotal(monthlyValues),
        label: 'Cumulative',
        borderColor: '#14b8a6',
        backgroundColor: '#14b8a622',
        tension: 0.35,
        fill: true,
      }],
    };
    this.conversionChart = {
      labels: conversionLabels,
      datasets: [
        { data: response.interviewConversion.map(item => item.applications), label: 'Applications', backgroundColor: '#0f766e' },
        { data: response.interviewConversion.map(item => item.interviews), label: 'Interviewed', backgroundColor: '#d89b37' },
      ],
    };

    const total = response.metrics.totalApplications;
    const interviewed = Math.round((response.metrics.interviewConversionRate / 100) * total);
    const responded = Math.round((response.metrics.applicationResponseRate / 100) * total);

    this.pieCharts = {
      stages: this.toDoughnut(response.recruitmentStages, this.palette),
      outcomes: this.toDoughnut(response.applicationOutcomes, this.outcomeColors),
      employment: this.toDoughnut(response.employmentTypes, this.palette),
      interviewReach: this.toDoughnut([
        { label: 'Interviewed', value: interviewed },
        { label: 'Not interviewed', value: Math.max(total - interviewed, 0) },
      ], ['#0f766e', '#94a3b8']),
      responseSplit: this.toDoughnut([
        { label: 'Responded', value: responded },
        { label: 'No response yet', value: Math.max(total - responded, 0) },
      ], ['#14b8a6', '#cbd5e1']),
      reminders: this.toDoughnut(this.reminderPoints(this.notifications), ['#d89b37', '#0f766e', '#94a3b8']),
    };

    this.syncTrendChart();
    this.activePieData = this.cloneDoughnut(this.pieCharts[this.pieChart]);
  }

  private syncTrendChart(): void {
    switch (this.trendChart) {
      case 'conversion':
        this.activeTrendBar = {
          labels: [...(this.conversionChart.labels ?? [])],
          datasets: this.conversionChart.datasets.map(dataset => ({ ...dataset, data: [...dataset.data] })),
        };
        break;
      case 'interviews':
        this.activeTrendLine = this.cloneLine(this.interviewsChart);
        break;
      case 'conversionRate':
        this.activeTrendLine = this.cloneLine(this.conversionRateChart);
        break;
      case 'cumulative':
        this.activeTrendLine = this.cloneLine(this.cumulativeChart);
        break;
      default:
        this.activeTrendLine = this.cloneLine(this.monthlyChart);
        break;
    }
  }

  private reminderPoints(items: ReminderRecord[]): AnalyticsPoint[] {
    const overdue = items.filter(item => item.timingState === 'OVERDUE').length;
    const upcoming = items.filter(item => item.timingState !== 'OVERDUE').length;
    return [
      { label: 'Overdue', value: overdue },
      { label: 'Upcoming', value: upcoming },
    ].filter(point => point.value > 0);
  }

  private runningTotal(values: number[]): number[] {
    let total = 0;
    return values.map(value => {
      total += value;
      return total;
    });
  }

  private toDoughnut(points: AnalyticsPoint[], colors: string[]): ChartData<'doughnut'> {
    const visible = points.filter(point => point.value > 0);
    return {
      labels: visible.map(point => point.label),
      datasets: [{
        data: visible.map(point => point.value),
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 4,
      }],
    };
  }

  private cloneDoughnut(data: ChartData<'doughnut'>): ChartData<'doughnut'> {
    return {
      labels: [...(data.labels ?? [])],
      datasets: data.datasets.map(dataset => ({
        ...dataset,
        data: [...dataset.data],
        backgroundColor: Array.isArray(dataset.backgroundColor) ? [...dataset.backgroundColor] : dataset.backgroundColor,
      })),
    };
  }

  private cloneLine(data: ChartData<'line'>): ChartData<'line'> {
    return {
      labels: [...(data.labels ?? [])],
      datasets: data.datasets.map(dataset => ({ ...dataset, data: [...dataset.data] })),
    };
  }

  private emptyLine(label: string): ChartData<'line'> {
    return { labels: [], datasets: [{ data: [], label, borderColor: '#0f766e', backgroundColor: '#0f766e22', tension: 0.35, fill: true }] };
  }

  private emptyDoughnut(): ChartData<'doughnut'> {
    return { labels: [], datasets: [{ data: [], backgroundColor: this.palette, borderWidth: 0 }] };
  }
}
