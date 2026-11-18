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
      <form class="form-card" [formGroup]="form" (ngSubmit)="submit()">
        <h2>{{ editingId ? 'Edit assessment' : 'Add assessment' }}</h2>
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
        <div class="actions"><button class="secondary-button" type="button" (click)="closeForm()">Cancel</button><button class="primary-button" type="submit" [disabled]="saving">{{ saving ? 'Saving…' : 'Save assessment' }}</button></div>
      </form>
    }
    @if (loading) { <div class="state">Loading assessments…</div> } @else if (!assessments.length) { <div class="empty"><mat-icon>assignment</mat-icon><h2>No assessments recorded</h2><p>Add a technical test or coding examination.</p></div> } @else {
      <section class="cards">
        @for (item of assessments; track item.id) {
          <article class="card"><header><div><span class="type">{{ item.assessmentType }}</span><strong>{{ item.title }}</strong><small>{{ item.companyName }} · {{ item.position }}</small></div><span class="status" [class]="item.status.toLowerCase()">{{ label(item.status) }}</span></header>
            @if (item.dueAt) { <div class="deadline"><mat-icon>event</mat-icon><span>Due {{ item.dueAt | date:'MMM d, y, h:mm a' }}</span></div> }
            @if (item.completedAt) { <p class="completed">Completed {{ item.completedAt | date:'MMM d, y, h:mm a' }}</p> }
            @if (item.instructions) { <p class="detail">{{ item.instructions }}</p> }
            @if (item.result) { <p class="result"><strong>Result</strong>{{ item.result }}</p> }
            <footer><button class="text-button" type="button" (click)="edit(item)">Edit</button><button class="danger-text" type="button" (click)="deleteAssessment(item)">Delete</button></footer>
          </article>
        }
      </section>
    }
  `,
  styles: [`
    .form-card { margin-bottom: 1rem; }
    .form-card h2 { margin: 0 0 1.25rem; }
    .form-card label { margin-bottom: 1rem; }
    .actions {
      border-top: 1px solid var(--af-divider);
      display: flex;
      gap: .65rem;
      justify-content: flex-end;
      padding-top: 1rem;
    }
    .cards { display: grid; gap: .8rem; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
    .card {
      background: var(--af-surface);
      border: 1px solid var(--af-border);
      border-radius: var(--af-radius-lg);
      box-shadow: var(--af-shadow);
      padding: 1rem;
    }
    .card header { align-items: flex-start; display: flex; justify-content: space-between; }
    .card header strong, .card header small, .card header span { display: block; }
    .card header strong { color: var(--af-text); font-size: .86rem; margin-top: .45rem; }
    .card header small { color: var(--af-text-faint); font-size: .72rem; margin-top: .2rem; }
    .type { color: var(--af-accent); font-size: .68rem; font-weight: 700; text-transform: uppercase; }
    .status { border-radius: var(--af-radius-sm); font-size: .65rem; font-weight: 700; padding: .35rem .55rem; }
    .not_started { background: var(--af-slate-soft); color: var(--af-slate); }
    .in_progress { background: var(--af-amber-soft); color: var(--af-amber); }
    .completed { background: var(--af-success-soft); color: var(--af-success-deep); }
    .expired { background: var(--af-danger-soft); color: var(--af-danger); }
    .deadline, .result { color: var(--af-text-muted); font-size: .75rem; }
    .deadline {
      align-items: center;
      border-top: 1px solid var(--af-divider);
      display: flex;
      gap: .4rem;
      margin-top: .8rem;
      padding-top: .8rem;
    }
    .deadline mat-icon { font-size: 17px; height: 17px; width: 17px; }
    .detail { color: var(--af-text-muted); font-size: .75rem; line-height: 1.5; max-height: 4.5em; overflow: hidden; }
    .result strong { color: var(--af-text-secondary); display: block; margin-bottom: .2rem; }
    .card footer {
      border-top: 1px solid var(--af-divider);
      display: flex;
      gap: .7rem;
      justify-content: flex-end;
      margin-top: .8rem;
      padding-top: .7rem;
    }
  `],
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
