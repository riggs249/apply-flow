import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PreferencesService } from '../../core/preferences/preferences.service';
import { ApplicationService } from './application.service';
import { ApplicationRecord, ApplicationStatus, EmploymentType, WorkArrangement } from './application.models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { DatePickerComponent } from '../../shared/components/date-picker/date-picker.component';

@Component({
  selector: 'app-application-list-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatIconModule,
    PageHeaderComponent,
    DatePickerComponent,
    DatePipe,
  ],
  template: `
    <app-page-header title="Applications" description="Track every opportunity from first contact to hire.">
      <div class="flex gap-[.6rem]"><a class="secondary-button" routerLink="/applications/board"><mat-icon>view_kanban</mat-icon> Pipeline</a><a class="primary-button" routerLink="/applications/new"><mat-icon>add</mat-icon> Add application</a></div>
    </app-page-header>
    <section class="toolbar">
      <div class="search"><mat-icon>search</mat-icon><input [formControl]="filters.controls.query" placeholder="Search company or position" /></div>
      <select [formControl]="filters.controls.status" aria-label="Status"><option value="">All statuses</option>@for (item of statuses; track item) { <option [value]="item">{{ label(item) }}</option> }</select>
      <select [formControl]="filters.controls.employmentType" aria-label="Employment type"><option value="">All employment types</option>@for (item of employmentTypes; track item) { <option [value]="item">{{ label(item) }}</option> }</select>
      <select [formControl]="filters.controls.workArrangement" aria-label="Work arrangement"><option value="">All arrangements</option>@for (item of arrangements; track item) { <option [value]="item">{{ label(item) }}</option> }</select>
      <app-date-picker placeholder="From" [formControl]="filters.controls.fromDate" />
      <app-date-picker placeholder="To" [formControl]="filters.controls.toDate" />
    </section>
    @if (error) { <div class="error">{{ error }}</div> }
    @if (loading) { <div class="state">Loading applications…</div> }
    @else if (!applications.length) { <div class="empty"><mat-icon>work_outline</mat-icon><h2>No applications found</h2><p>Adjust your filters or add your first application.</p><a class="primary-button" routerLink="/applications/new">Add application</a></div> }
    @else {
      <section class="table-card">
        <div class="table-scroll"><table><thead><tr><th>Position</th><th>Company</th><th>Status</th><th>Type</th><th>Applied</th><th></th></tr></thead>
          <tbody>@for (application of applications; track application.id) {
            <tr class="clickable" [routerLink]="['/applications', application.id]">
              <td><strong>{{ application.position }}</strong><small>{{ application.location || 'Location not set' }}</small></td>
              <td>{{ application.companyName }}</td>
              <td>
                <span [class]="'status ' + application.status.toLowerCase()">{{ label(application.status) }}</span>
                @if (application.status === 'IN_PROCESS' && application.processStage) {
                  <small class="!mt-[.3rem] !text-[.68rem]">{{ label(application.processStage) }}</small>
                }
              </td>
              <td>{{ label(application.employmentType) }}</td>
              <td>{{ application.applicationDate ? (application.applicationDate | date:'MMM d, y') : '—' }}</td>
              <td><mat-icon class="!size-[19px] !text-[19px] text-af-text-faint">chevron_right</mat-icon></td>
            </tr>
          }</tbody></table></div>
        <footer><span>Showing {{ applications.length }} of {{ totalElements }} applications</span><div class="pager"><button [disabled]="page === 0" (click)="load(page - 1)"><mat-icon>chevron_left</mat-icon></button><span>Page {{ page + 1 }} of {{ totalPages || 1 }}</span><button [disabled]="page + 1 >= totalPages" (click)="load(page + 1)"><mat-icon>chevron_right</mat-icon></button></div></footer>
      </section>
    }
  `,
})
export class ApplicationListPageComponent implements OnInit {
  private readonly service = inject(ApplicationService);
  private readonly preferences = inject(PreferencesService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  readonly statuses: ApplicationStatus[] = ['WISHLIST', 'APPLIED', 'IN_PROCESS', 'REJECTED', 'HIRED', 'WITHDRAWN'];
  readonly employmentTypes: EmploymentType[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'INTERNSHIP'];
  readonly arrangements: WorkArrangement[] = ['ONSITE', 'HYBRID', 'REMOTE'];
  readonly filters = this.fb.nonNullable.group({
    query: '',
    status: '' as ApplicationStatus | '',
    employmentType: '' as EmploymentType | '',
    workArrangement: '' as WorkArrangement | '',
    fromDate: null as Date | null,
    toDate: null as Date | null,
  });
  applications: ApplicationRecord[] = [];
  loading = false;
  error = '';
  page = 0;
  totalPages = 0;
  totalElements = 0;

  ngOnInit(): void {
    const initialQuery = this.route.snapshot.queryParamMap.get('q') ?? '';
    if (initialQuery) {
      this.filters.patchValue({ query: initialQuery }, { emitEvent: false });
    }

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const q = params.get('q') ?? '';
      if (q !== this.filters.controls.query.value) {
        this.filters.patchValue({ query: q });
      }
    });

    this.filters.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.page = 0;
      this.load();
    });

    this.load();
  }

  load(page = this.page): void {
    this.page = page;
    this.loading = true;
    this.error = '';
    const raw = this.filters.getRawValue();
    this.service.list({
      query: raw.query,
      status: raw.status,
      employmentType: raw.employmentType,
      workArrangement: raw.workArrangement,
      fromDate: this.toIsoDate(raw.fromDate),
      toDate: this.toIsoDate(raw.toDate),
      page,
      size: this.preferences.applicationsPageSize(),
    }).subscribe({
      next: response => {
        this.applications = response.content;
        this.totalPages = response.totalPages;
        this.totalElements = response.totalElements;
        this.loading = false;
      },
      error: () => {
        this.error = 'Applications could not be loaded. Please try again.';
        this.loading = false;
      },
    });
  }

  label(value: string): string {
    return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
  }

  private toIsoDate(value: Date | null): string {
    if (!value) return '';
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
