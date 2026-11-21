import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ApplicationService } from '../applications/application.service';
import { ApplicationRecord } from '../applications/application.models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { AssessmentRecord, AssessmentStatus } from './assessment.models';
import { AssessmentService } from './assessment.service';

@Component({
  selector: 'app-assessment-page',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, PageHeaderComponent, DatePipe],
  template: `
    <app-page-header title="Assessments" description="Track coding exams, technical work, deadlines, and results.">
      <button class="primary-button" type="button" (click)="openCreate()"><mat-icon>add</mat-icon> Add assessment</button>
    </app-page-header>
    @if (error) { <div class="error">{{ error }}</div> }
    @if (showForm) {
      <form class="form-card mb-4 [&_label]:mb-4" [formGroup]="form" (ngSubmit)="submit()">
        <h2 class="!mb-5">{{ editingId ? 'Edit assessment' : 'Add assessment' }}</h2>
        <div class="fields two">
          <label>Application<select formControlName="applicationId"><option value="">Select application</option>@for (item of applications; track item.id) { <option [value]="item.id">{{ item.companyName }} — {{ item.position }}</option> }</select></label>
          <label>Title<input formControlName="title" placeholder="Take-home coding project" /></label>
        </div>
        <div class="fields three">
          <label>Assessment type<input formControlName="assessmentType" placeholder="Coding, technical, case study..." /></label>
          <label>Deadline<input type="datetime-local" formControlName="dueAt" /></label>
          <label>Completion status<select formControlName="status">@for (item of statuses; track item) { <option [value]="item">{{ label(item) }}</option> }</select></label>
        </div>
        <label>Instructions<textarea rows="5" formControlName="instructions"></textarea></label>
        <div class="fields two"><label>Result<textarea rows="4" formControlName="result"></textarea></label><label>Notes<textarea rows="4" formControlName="notes"></textarea></label></div>
        <div class="flex justify-end gap-[.65rem] border-t border-af-divider pt-4"><button class="secondary-button" type="button" (click)="closeForm()">Cancel</button><button class="primary-button" type="submit" [disabled]="saving">{{ saving ? 'Saving…' : 'Save assessment' }}</button></div>
      </form>
    }
    @if (loading) { <div class="state">Loading assessments…</div> } @else if (!assessments.length) { <div class="empty"><mat-icon>assignment</mat-icon><h2>No assessments recorded</h2><p>Add a technical test or coding examination.</p></div> } @else {
      <section class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-[.8rem]">
        @for (item of assessments; track item.id) {
          <article class="rounded-af-lg border border-af-border bg-af-surface p-4 shadow-af"><header class="flex items-start justify-between"><div><span class="block text-[.68rem] font-bold uppercase text-af-accent">{{ item.assessmentType }}</span><strong class="mt-[.45rem] block text-[.86rem] text-af-text">{{ item.title }}</strong><small class="mt-[.2rem] block text-[.72rem] text-af-text-faint">{{ item.companyName }} · {{ item.position }}</small></div><span class="block rounded-af-sm px-[.55rem] py-[.35rem] text-[.65rem] font-bold" [class]="statusClass(item.status)">{{ label(item.status) }}</span></header>
            @if (item.dueAt) { <div class="mt-[.8rem] flex items-center gap-[.4rem] border-t border-af-divider pt-[.8rem] text-[.75rem] text-af-text-muted"><mat-icon class="!size-[17px] !text-[17px]">event</mat-icon><span>Due {{ item.dueAt | date:'MMM d, y, h:mm a' }}</span></div> }
            @if (item.completedAt) { <p class="bg-af-success-soft text-af-success-deep">Completed {{ item.completedAt | date:'MMM d, y, h:mm a' }}</p> }
            @if (item.instructions) { <p class="max-h-[4.5em] overflow-hidden text-[.75rem] leading-[1.5] text-af-text-muted">{{ item.instructions }}</p> }
            @if (item.result) { <p class="text-[.75rem] text-af-text-muted"><strong class="mb-[.2rem] block text-af-text-secondary">Result</strong>{{ item.result }}</p> }
            <footer class="mt-[.8rem] flex justify-end gap-[.7rem] border-t border-af-divider pt-[.7rem]"><button class="text-button" type="button" (click)="edit(item)">Edit</button><button class="danger-text" type="button" (click)="deleteAssessment(item)">Delete</button></footer>
          </article>
        }
      </section>
    }
  `,
})
export class AssessmentPageComponent implements OnInit {
  private readonly assessmentsApi = inject(AssessmentService);
  private readonly applicationsApi = inject(ApplicationService);
  private readonly fb = inject(FormBuilder);
  readonly statuses: AssessmentStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED'];
  readonly form = this.fb.nonNullable.group({
    applicationId: ['', Validators.required], title: ['', Validators.required], assessmentType: ['', Validators.required],
    dueAt: '', status: 'NOT_STARTED' as AssessmentStatus, instructions: '', result: '', notes: '',
  });
  assessments: AssessmentRecord[] = [];
  applications: ApplicationRecord[] = [];
  loading = true;
  saving = false;
  showForm = false;
  editingId?: string;
  error = '';

  ngOnInit(): void {
    this.load();
    this.applicationsApi.list({ page: 0, size: 100 }).subscribe({
      next: page => this.applications = page.content,
      error: () => this.error = 'Applications could not be loaded.',
    });
  }

  load(): void {
    this.loading = true;
    this.assessmentsApi.list().subscribe({
      next: items => { this.assessments = items; this.loading = false; },
      error: () => { this.error = 'Assessments could not be loaded.'; this.loading = false; },
    });
  }

  statusClass(status: AssessmentStatus): string {
    switch (status) {
      case 'IN_PROGRESS': return 'bg-af-amber-soft text-af-amber';
      case 'COMPLETED': return 'bg-af-success-soft text-af-success-deep';
      case 'EXPIRED': return 'bg-af-danger-soft text-af-danger';
      default: return 'bg-af-slate-soft text-af-slate';
    }
  }

  openCreate(): void {
    this.editingId = undefined;
    this.form.reset({ applicationId: '', title: '', assessmentType: '', dueAt: '', status: 'NOT_STARTED', instructions: '', result: '', notes: '' });
    this.showForm = true;
  }

  edit(item: AssessmentRecord): void {
    this.editingId = item.id;
    this.form.patchValue({ applicationId: item.applicationId, title: item.title, assessmentType: item.assessmentType, dueAt: item.dueAt ? this.toLocalDateTime(item.dueAt) : '', status: item.status, instructions: item.instructions ?? '', result: item.result ?? '', notes: item.notes ?? '' });
    this.showForm = true;
  }

  closeForm(): void { this.showForm = false; this.editingId = undefined; }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving = true;
    const raw = this.form.getRawValue();
    const value = { ...raw, dueAt: raw.dueAt ? new Date(raw.dueAt).toISOString() : null };
    const operation = this.editingId ? this.assessmentsApi.update(this.editingId, value) : this.assessmentsApi.create(value);
    operation.subscribe({ next: () => { this.saving = false; this.closeForm(); this.load(); }, error: () => { this.error = 'Assessment could not be saved.'; this.saving = false; } });
  }

  deleteAssessment(item: AssessmentRecord): void {
    if (!confirm(`Delete ${item.title}?`)) return;
    this.assessmentsApi.delete(item.id).subscribe({ next: () => this.load(), error: () => this.error = 'Assessment could not be deleted.' });
  }

  toLocalDateTime(value: string): string {
    const date = new Date(value);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  label(value: string): string { return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase()); }
}
