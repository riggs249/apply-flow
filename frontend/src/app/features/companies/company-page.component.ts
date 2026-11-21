import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { scrollToTop } from '../../shared/utils/scroll';
import { CompanyRecord } from './company.models';
import { CompanyService } from './company.service';

@Component({
  selector: 'app-company-page',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, PageHeaderComponent],
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

    @if (loading) { <div class="state">Loading companies…</div> }
    @else if (!companies.length) {
      <div class="empty"><mat-icon>business</mat-icon><h2>No companies yet</h2><p>Add a company before creating job applications.</p><button class="primary-button" type="button" (click)="openCreate()">Add company</button></div>
    }
    @else {
      <section class="table-card">
        <div class="table-scroll">
          <table>
            <thead><tr><th>Company</th><th>Industry</th><th>Location</th><th>Website</th><th></th></tr></thead>
            <tbody>
              @for (company of companies; track company.id) {
                <tr>
                  <td><strong>{{ company.name }}</strong>@if (company.notes) { <small class="max-w-[28rem] truncate">{{ company.notes }}</small> }</td>
                  <td>{{ company.industry || '—' }}</td>
                  <td>{{ company.location || '—' }}</td>
                  <td>@if (company.website) { <a [href]="company.website" target="_blank" rel="noopener noreferrer">Visit</a> } @else { — }</td>
                  <td class="row-actions">
                    <button type="button" class="text-button" (click)="edit(company)">Edit</button>
                    <button type="button" class="danger-text" (click)="deleteCompany(company)">Delete</button>
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

  ngOnInit(): void {
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
    this.service.list({ ...this.filters.getRawValue(), page }).subscribe({
      next: response => {
        this.companies = response.content;
        this.totalPages = response.totalPages;
        this.totalElements = response.totalElements;
        this.loading = false;
      },
      error: () => {
        this.error = 'Companies could not be loaded. Please try again.';
        this.loading = false;
      },
    });
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
