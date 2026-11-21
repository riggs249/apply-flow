import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ApplicationService } from '../applications/application.service';
import { ApplicationRecord } from '../applications/application.models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { scrollToTop } from '../../shared/utils/scroll';
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
        <label>Assessment link<input formControlName="linkUrl" type="url" placeholder="https://hackerrank.com/..." /></label>
        <label>Instructions<textarea rows="5" formControlName="instructions"></textarea></label>
        <div class="fields two"><label>Result<textarea rows="4" formControlName="result"></textarea></label><label>Notes<textarea rows="4" formControlName="notes"></textarea></label></div>
        <div class="flex justify-end gap-[.65rem] border-t border-af-divider pt-4"><button class="secondary-button" type="button" (click)="closeForm()">Cancel</button><button class="primary-button" type="submit" [disabled]="saving">{{ saving ? 'Saving…' : 'Save assessment' }}</button></div>
      </form>
    }
    @if (loading) { <div class="state">Loading assessments…</div> } @else if (!assessments.length) { <div class="empty"><mat-icon>assignment</mat-icon><h2>No assessments recorded</h2><p>Add a technical test or coding examination.</p></div> } @else {
      <section class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-[.8rem]">
        @for (item of assessments; track item.id) {
          <article class="flex h-[22rem] flex-col overflow-hidden rounded-af-lg border border-af-border bg-af-surface p-4 shadow-af">
            <header class="flex shrink-0 items-start justify-between gap-3">
              <div class="min-w-0">
                <span class="block text-[.68rem] font-bold uppercase text-af-accent">{{ item.assessmentType }}</span>
                <strong class="mt-[.45rem] block truncate text-[.86rem] text-af-text">{{ item.title }}</strong>
                <small class="mt-[.2rem] block truncate text-[.72rem] text-af-text-faint">{{ item.companyName }} · {{ item.position }}</small>
              </div>
              <div class="flex shrink-0 flex-col items-end gap-[.35rem]">
                <span class="rounded-af-sm px-[.55rem] py-[.35rem] text-[.65rem] font-bold" [class]="statusClass(item.status)">{{ label(item.status) }}</span>
                @if (isOverdue(item)) {
                  <span class="rounded-af-sm bg-af-danger-soft px-[.55rem] py-[.3rem] text-[.65rem] font-bold text-af-danger">Overdue</span>
                }
              </div>
            </header>
            <div class="mt-[.8rem] flex min-h-0 flex-1 flex-col gap-[.65rem] overflow-y-auto border-t border-af-divider pt-[.8rem] pr-1">
              @if (item.dueAt) {
                <div class="flex items-center gap-[.4rem] text-[.75rem]" [class.text-af-danger]="isOverdue(item)" [class.text-af-text-muted]="!isOverdue(item)">
                  <mat-icon class="!size-[17px] !text-[17px]">event</mat-icon>
                  <span>Due {{ item.dueAt | date:'MMM d, y, h:mm a' }}@if (isOverdue(item)) { · Overdue }</span>
                </div>
              }
              @if (item.linkUrl) {
                <a class="inline-flex items-center gap-[.35rem] text-[.75rem] font-[650] text-af-accent no-underline hover:underline" [href]="item.linkUrl" target="_blank" rel="noopener noreferrer">
                  <mat-icon class="!size-[17px] !text-[17px]">open_in_new</mat-icon>
                  <span class="truncate">{{ displayLink(item.linkUrl) }}</span>
                </a>
              }
              @if (item.completedAt) {
                <p class="m-0 rounded-af-sm bg-af-success-soft px-[.55rem] py-[.35rem] text-[.75rem] text-af-success-deep">Completed {{ item.completedAt | date:'MMM d, y, h:mm a' }}</p>
              }
              @if (item.instructions) {
                <div class="text-[.75rem] leading-[1.5] text-af-text-muted">
                  <p class="m-0 whitespace-pre-wrap">{{ instructionsPreview(item) }}</p>
                  @if (canExpandInstructions(item)) {
                    <button class="text-button mt-1 px-0" type="button" (click)="toggleInstructions(item.id)">
                      {{ isInstructionsExpanded(item.id) ? 'Show less' : 'Show more' }}
                    </button>
                  }
                </div>
              }
              @if (item.result) {
                <p class="m-0 text-[.75rem] text-af-text-muted"><strong class="mb-[.2rem] block text-af-text-secondary">Result</strong>{{ item.result }}</p>
              }
              @if (item.notes) {
                <p class="m-0 text-[.75rem] text-af-text-muted"><strong class="mb-[.2rem] block text-af-text-secondary">Notes</strong>{{ item.notes }}</p>
              }
            </div>
            <footer class="mt-auto flex shrink-0 items-center justify-between gap-3 border-t border-af-divider pt-[.7rem]">
              @if (item.linkUrl) {
                <a class="secondary-button" [href]="item.linkUrl" target="_blank" rel="noopener noreferrer"><mat-icon>link</mat-icon> Open link</a>
              } @else {
                <span></span>
              }
              <div class="flex items-center gap-[.7rem]">
                <button class="text-button" type="button" (click)="edit(item)">Edit</button>
                <button class="danger-text" type="button" (click)="deleteAssessment(item)">Delete</button>
              </div>
            </footer>
          </article>
        }
      </section>
    }
  `,
})
export class AssessmentPageComponent implements OnInit {
  private readonly assessmentsApi = inject(AssessmentService);
  private readonly applicationsApi = inject(ApplicationService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly fb = inject(FormBuilder);
  readonly statuses: AssessmentStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED'];
  readonly form = this.fb.nonNullable.group({
    applicationId: ['', Validators.required],
    title: ['', Validators.required],
    assessmentType: ['', Validators.required],
    linkUrl: ['', Validators.maxLength(1000)],
    dueAt: '',
    status: 'NOT_STARTED' as AssessmentStatus,
    instructions: '',
    result: '',
    notes: '',
  });
  private static readonly INSTRUCTIONS_PREVIEW_LENGTH = 140;

  assessments: AssessmentRecord[] = [];
  applications: ApplicationRecord[] = [];
  loading = true;
  saving = false;
  showForm = false;
  editingId?: string;
  error = '';
  private readonly expandedInstructions = new Set<string>();

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

  isOverdue(item: AssessmentRecord): boolean {
    if (!item.dueAt || item.status === 'COMPLETED') return false;
    return new Date(item.dueAt).getTime() < Date.now();
  }

  openCreate(): void {
    this.editingId = undefined;
    this.form.reset({
      applicationId: '',
      title: '',
      assessmentType: '',
      linkUrl: '',
      dueAt: '',
      status: 'NOT_STARTED',
      instructions: '',
      result: '',
      notes: '',
    });
    this.showForm = true;
    scrollToTop();
  }

  edit(item: AssessmentRecord): void {
    this.editingId = item.id;
    this.form.patchValue({
      applicationId: item.applicationId,
      title: item.title,
      assessmentType: item.assessmentType,
      linkUrl: item.linkUrl ?? '',
      dueAt: item.dueAt ? this.toLocalDateTime(item.dueAt) : '',
      status: item.status,
      instructions: item.instructions ?? '',
      result: item.result ?? '',
      notes: item.notes ?? '',
    });
    this.showForm = true;
    scrollToTop();
  }

  closeForm(): void { this.showForm = false; this.editingId = undefined; }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving = true;
    const raw = this.form.getRawValue();
    const value = {
      ...raw,
      linkUrl: raw.linkUrl.trim() || null,
      dueAt: raw.dueAt ? new Date(raw.dueAt).toISOString() : null,
    };
    const operation = this.editingId ? this.assessmentsApi.update(this.editingId, value) : this.assessmentsApi.create(value);
    operation.subscribe({ next: () => { this.saving = false; this.closeForm(); this.load(); }, error: () => { this.error = 'Assessment could not be saved.'; this.saving = false; } });
  }

  displayLink(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.hostname + (parsed.pathname === '/' ? '' : parsed.pathname);
    } catch {
      return url;
    }
  }

  canExpandInstructions(item: AssessmentRecord): boolean {
    return (item.instructions?.length ?? 0) > AssessmentPageComponent.INSTRUCTIONS_PREVIEW_LENGTH;
  }

  isInstructionsExpanded(id: string): boolean {
    return this.expandedInstructions.has(id);
  }

  toggleInstructions(id: string): void {
    if (this.expandedInstructions.has(id)) {
      this.expandedInstructions.delete(id);
    } else {
      this.expandedInstructions.add(id);
    }
  }

  instructionsPreview(item: AssessmentRecord): string {
    const text = item.instructions ?? '';
    if (!this.canExpandInstructions(item) || this.isInstructionsExpanded(item.id)) {
      return text;
    }
    return text.slice(0, AssessmentPageComponent.INSTRUCTIONS_PREVIEW_LENGTH).trimEnd() + '…';
  }

  deleteAssessment(item: AssessmentRecord): void {
    this.confirmDialog.confirm({
      title: 'Delete assessment',
      message: `Delete “${item.title}”? This cannot be undone.`,
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.assessmentsApi.delete(item.id).subscribe({
        next: () => this.load(),
        error: () => this.error = 'Assessment could not be deleted.',
      });
    });
  }

  toLocalDateTime(value: string): string {
    const date = new Date(value);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  label(value: string): string { return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase()); }
}
