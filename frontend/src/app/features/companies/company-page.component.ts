import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subject, catchError, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { TableSkeletonComponent } from '../../shared/components/table-skeleton/table-skeleton.component';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { scrollToTop } from '../../shared/utils/scroll';
import { CompanyRecord } from './company.models';
import { CompanyService } from './company.service';

@Component({
  selector: 'app-company-page',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, PageHeaderComponent, TableSkeletonComponent],
  template: `
    <app-page-header title="Companies" description="Keep your target companies organized in one place.">
      <button class="primary-button" type="button" (click)="openCreate()"><mat-icon>add</mat-icon> Add company</button>
    </app-page-header>

    <section class="toolbar">
      <div class="search"><mat-icon>search</mat-icon><input [formControl]="filters.controls.query" placeholder="Search by name" aria-label="Search companies" /></div>
      <input [formControl]="filters.controls.industry" placeholder="Filter by industry" aria-label="Industry filter" />
    </section>

    @if (error) { <div class="error">{{ error }}</div> }

    @if (showForm) {
      <form class="form-card mb-5 [&_label]:mb-4" [formGroup]="form" (ngSubmit)="submit()">
        <h2 class="!mb-5">{{ editingId ? 'Edit company' : 'Add company' }}</h2>
        <div class="fields two">
          <label>Name<input formControlName="name" placeholder="Acme Corp" />@if (form.controls.name.touched && form.controls.name.invalid) { <small>Name is required.</small> }</label>
          <label>Website<input type="url" formControlName="website" placeholder="https://..." /></label>
        </div>
        <div class="fields two">
          <label>Industry<input formControlName="industry" placeholder="Software" /></label>
          <label>Location<input formControlName="location" placeholder="Remote / New York" /></label>
        </div>
        <label>Notes<textarea rows="3" formControlName="notes" placeholder="Culture notes, contacts, or research"></textarea></label>
        <div class="flex justify-end gap-[.65rem] border-t border-af-divider pt-4">
          <button class="secondary-button" type="button" (click)="closeForm()">Cancel</button>
          <button class="primary-button" type="submit" [disabled]="saving">{{ saving ? 'Saving…' : 'Save company' }}</button>
        </div>
      </form>
    }

    @if (loading && !companies.length) {
      <app-table-skeleton
        label="Loading companies…"
        [rows]="7"
        [columns]="[
          { width: '52%', secondary: '68%' },
          '58%',
          '48%',
          '28%',
          '34%'
        ]"
      />
    }
    @else if (!companies.length) {
      <div class="empty"><mat-icon>business</mat-icon><h2>No companies yet</h2><p>Add a company before creating job applications.</p><button class="primary-button" type="button" (click)="openCreate()">Add company</button></div>
    }
    @else {
      <section class="table-card" [class.is-refreshing]="loading">
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th><button type="button" class="sort-header" [class.is-active]="sortBy === 'name'" (click)="sort('name')">Company <mat-icon>{{ sortIcon('name') }}</mat-icon></button></th>
                <th><button type="button" class="sort-header" [class.is-active]="sortBy === 'industry'" (click)="sort('industry')">Industry <mat-icon>{{ sortIcon('industry') }}</mat-icon></button></th>
                <th><button type="button" class="sort-header" [class.is-active]="sortBy === 'location'" (click)="sort('location')">Location <mat-icon>{{ sortIcon('location') }}</mat-icon></button></th>
                <th><button type="button" class="sort-header" [class.is-active]="sortBy === 'website'" (click)="sort('website')">Website <mat-icon>{{ sortIcon('website') }}</mat-icon></button></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (company of companies; track company.id) {
                <tr>
                  <td class="align-middle"><strong>{{ company.name }}</strong>@if (company.notes) { <small class="max-w-[28rem] truncate">{{ company.notes }}</small> }</td>
                  <td class="align-middle">{{ company.industry || '—' }}</td>
                  <td class="align-middle">{{ company.location || '—' }}</td>
                  <td class="align-middle">@if (company.website) { <a [href]="company.website" target="_blank" rel="noopener noreferrer">Visit</a> } @else { — }</td>
                  <td class="align-middle">
                    <div class="flex items-center justify-end gap-3">
                      <button type="button" class="text-button" (click)="edit(company)">Edit</button>
                      <button type="button" class="danger-text" (click)="deleteCompany(company)">Delete</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <footer>
          <span>Showing {{ companies.length }} of {{ totalElements }} companies</span>
          <div class="pager">
            <button type="button" [disabled]="page === 0" (click)="load(page - 1)"><mat-icon>chevron_left</mat-icon></button>
            <span>Page {{ page + 1 }} of {{ totalPages || 1 }}</span>
            <button type="button" [disabled]="page + 1 >= totalPages" (click)="load(page + 1)"><mat-icon>chevron_right</mat-icon></button>
          </div>
        </footer>
      </section>
    }
  `,
})
export class CompanyPageComponent implements OnInit {
  private readonly service = inject(CompanyService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reload$ = new Subject<number>();

  readonly filters = this.fb.nonNullable.group({ query: '', industry: '' });
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    website: ['', Validators.maxLength(500)],
    industry: ['', Validators.maxLength(100)],
    location: ['', Validators.maxLength(150)],
    notes: ['', Validators.maxLength(5000)],
  });

  companies: CompanyRecord[] = [];
  loading = true;
  saving = false;
  showForm = false;
  editingId?: string;
  error = '';
  page = 0;
  totalPages = 0;
  totalElements = 0;
  sortBy = 'name';
  direction: 'asc' | 'desc' = 'asc';

  ngOnInit(): void {
    this.filters.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.page = 0;
      this.load();
    });

    this.reload$.pipe(
      tap(page => {
        this.page = page;
        this.loading = true;
        this.error = '';
      }),
      switchMap(page => this.service.list({
        ...this.filters.getRawValue(),
        page,
        sortBy: this.sortBy,
        direction: this.direction,
      }).pipe(
        catchError(() => {
          this.error = 'Companies could not be loaded. Please try again.';
          this.loading = false;
          return of(null);
        }),
      )),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(response => {
      if (!response) return;
      this.companies = response.content;
      this.totalPages = response.totalPages;
      this.totalElements = response.totalElements;
      this.loading = false;
    });

    this.load();
  }

  load(page = this.page): void {
    this.reload$.next(page);
  }

  sort(column: string): void {
    if (this.sortBy === column) {
      this.direction = this.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.direction = 'asc';
    }
    this.companies = this.sortRows(this.companies);
    if (this.totalPages <= 1) return;
    this.load(0);
  }

  sortIcon(column: string): string {
    if (this.sortBy !== column) return 'unfold_more';
    return this.direction === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  private sortRows(rows: CompanyRecord[]): CompanyRecord[] {
    const dir = this.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = this.sortValue(a);
      const bv = this.sortValue(b);
      if (!av && !bv) return 0;
      if (!av) return 1;
      if (!bv) return -1;
      return av.localeCompare(bv, undefined, { sensitivity: 'base', numeric: true }) * dir;
    });
  }

  private sortValue(row: CompanyRecord): string {
    switch (this.sortBy) {
      case 'name': return row.name ?? '';
      case 'industry': return row.industry ?? '';
      case 'location': return row.location ?? '';
      case 'website': return row.website ?? '';
      default: return '';
    }
  }

  openCreate(): void {
    this.editingId = undefined;
    this.form.reset({ name: '', website: '', industry: '', location: '', notes: '' });
    this.showForm = true;
    scrollToTop();
  }

  edit(company: CompanyRecord): void {
    this.editingId = company.id;
    this.form.reset({
      name: company.name,
      website: company.website ?? '',
      industry: company.industry ?? '',
      location: company.location ?? '',
      notes: company.notes ?? '',
    });
    this.showForm = true;
    scrollToTop();
  }

  closeForm(): void {
    this.showForm = false;
    this.editingId = undefined;
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving = true;
    this.error = '';
    const value = this.form.getRawValue();
    const request = {
      name: value.name.trim(),
      website: value.website.trim() || null,
      industry: value.industry.trim() || null,
      location: value.location.trim() || null,
      notes: value.notes.trim() || null,
    };
    const operation = this.editingId
      ? this.service.update(this.editingId, request)
      : this.service.create(request);
    operation.subscribe({
      next: () => {
        this.saving = false;
        this.closeForm();
        this.load();
      },
      error: () => {
        this.error = 'Company could not be saved.';
        this.saving = false;
      },
    });
  }

  deleteCompany(company: CompanyRecord): void {
    this.confirmDialog.confirm({
      title: 'Delete company',
      message: `Delete ${company.name}? Applications linked to it may block deletion.`,
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.service.delete(company.id).subscribe({
        next: () => this.load(),
        error: () => { this.error = 'Company could not be deleted.'; },
      });
    });
  }
}
