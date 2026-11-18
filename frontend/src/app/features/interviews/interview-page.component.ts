import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ApplicationService } from '../applications/application.service';
import { ApplicationRecord } from '../applications/application.models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { InterviewOutcome, InterviewRecord } from './interview.models';
import { InterviewService } from './interview.service';

@Component({
  selector: 'app-interview-page',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, PageHeaderComponent, DatePipe],
  template: `
    <app-page-header title="Interviews" description="Schedule conversations and capture preparation and reflections.">
      <button class="primary-button" type="button" (click)="openCreate()"><mat-icon>add</mat-icon> Schedule interview</button>
    </app-page-header>
    @if (error) { <div class="error">{{ error }}</div> }
    @if (showForm) {
      <form class="form-card" [formGroup]="form" (ngSubmit)="submit()">
        <h2>{{ editingId ? 'Edit interview' : 'Schedule interview' }}</h2>
        <div class="fields two">
          <label>Application<select formControlName="applicationId"><option value="">Select application</option>@for (item of applications; track item.id) { <option [value]="item.id">{{ item.companyName }} — {{ item.position }}</option> }</select></label>
          <label>Scheduled at<input type="datetime-local" formControlName="scheduledAt" /></label>
        </div>
        <div class="fields two">
          <label>Interview type<input formControlName="interviewType" placeholder="Technical, HR, final..." /></label>
          <label>Outcome<select formControlName="outcome">@for (item of outcomes; track item) { <option [value]="item">{{ label(item) }}</option> }</select></label>
        </div>
        <div class="fields two">
          <label>Interviewer<input formControlName="interviewer" /></label>
          <label>Interviewer contact<input formControlName="interviewerContact" placeholder="Email or phone" /></label>
        </div>
        <label>Meeting link or location<input formControlName="locationOrMeetingUrl" /></label>
        <label>Preparation notes<textarea rows="4" formControlName="preparationNotes"></textarea></label>
        <label>Post-interview reflection<textarea rows="4" formControlName="reflection"></textarea></label>
        <div class="actions"><button class="secondary-button" type="button" (click)="closeForm()">Cancel</button><button class="primary-button" type="submit" [disabled]="saving">{{ saving ? 'Saving…' : 'Save interview' }}</button></div>
      </form>
    }
    @if (loading) { <div class="state">Loading interviews…</div> } @else if (!interviews.length) { <div class="empty"><mat-icon>calendar_month</mat-icon><h2>No interviews scheduled</h2><p>Add the next conversation for an application.</p></div> } @else {
      <section class="cards">
        @for (item of interviews; track item.id) {
          <article class="card"><header><div><span class="type">{{ item.interviewType }}</span><strong>{{ item.companyName }}</strong><small>{{ item.position }}</small></div><span class="status" [class]="item.outcome.toLowerCase()">{{ label(item.outcome) }}</span></header>
            <div class="meta"><div><mat-icon>schedule</mat-icon><span>{{ item.scheduledAt | date:'MMM d, y, h:mm a' }}</span></div><div><mat-icon>person</mat-icon><span>{{ item.interviewer || 'No interviewer set' }}</span></div></div>
            @if (item.locationOrMeetingUrl) { <p class="detail">{{ item.locationOrMeetingUrl }}</p> }
            <footer><button class="text-button" type="button" (click)="edit(item)">Edit</button><button class="danger-text" type="button" (click)="deleteInterview(item)">Delete</button></footer>
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
    .cards { display: grid; gap: .8rem; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
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
    .pending { background: var(--af-amber-soft); color: var(--af-amber); }
    .passed { background: var(--af-success-soft); color: var(--af-success-deep); }
    .failed, .cancelled { background: var(--af-danger-soft); color: var(--af-danger); }
    .rescheduled { background: var(--af-accent-soft); color: var(--af-accent); }
    .meta { border-top: 1px solid var(--af-divider); display: grid; gap: .5rem; margin-top: .8rem; padding-top: .8rem; }
    .meta div { align-items: center; color: var(--af-text-muted); display: flex; font-size: .75rem; gap: .4rem; }
    .meta mat-icon { font-size: 17px; height: 17px; width: 17px; }
    .detail { color: var(--af-text-muted); font-size: .75rem; overflow: hidden; text-overflow: ellipsis; }
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
export class InterviewPageComponent implements OnInit {
  private readonly interviewsApi = inject(InterviewService);
  private readonly applicationsApi = inject(ApplicationService);
  private readonly fb = inject(FormBuilder);
  readonly outcomes: InterviewOutcome[] = ['PENDING', 'PASSED', 'FAILED', 'RESCHEDULED', 'CANCELLED'];
  readonly form = this.fb.nonNullable.group({
    applicationId: ['', Validators.required], scheduledAt: ['', Validators.required], interviewType: ['', Validators.required],
    interviewer: '', interviewerContact: '', locationOrMeetingUrl: '', preparationNotes: '', reflection: '', outcome: 'PENDING' as InterviewOutcome,
  });
  interviews: InterviewRecord[] = [];
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
    this.interviewsApi.list().subscribe({
      next: items => { this.interviews = items; this.loading = false; },
      error: () => { this.error = 'Interviews could not be loaded.'; this.loading = false; },
    });
  }

  openCreate(): void {
    this.editingId = undefined;
    this.form.reset({ applicationId: '', scheduledAt: '', interviewType: '', interviewer: '', interviewerContact: '', locationOrMeetingUrl: '', preparationNotes: '', reflection: '', outcome: 'PENDING' });
    this.showForm = true;
  }

  edit(item: InterviewRecord): void {
    this.editingId = item.id;
    this.form.patchValue({ applicationId: item.applicationId, scheduledAt: this.toLocalDateTime(item.scheduledAt), interviewType: item.interviewType, interviewer: item.interviewer ?? '', interviewerContact: item.interviewerContact ?? '', locationOrMeetingUrl: item.locationOrMeetingUrl ?? '', preparationNotes: item.preparationNotes ?? '', reflection: item.reflection ?? '', outcome: item.outcome });
    this.showForm = true;
  }

  closeForm(): void { this.showForm = false; this.editingId = undefined; }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving = true;
    const value = { ...this.form.getRawValue(), scheduledAt: new Date(this.form.value.scheduledAt!).toISOString() };
    const operation = this.editingId ? this.interviewsApi.update(this.editingId, value) : this.interviewsApi.create(value);
    operation.subscribe({ next: () => { this.saving = false; this.closeForm(); this.load(); }, error: () => { this.error = 'Interview could not be saved.'; this.saving = false; } });
  }

  deleteInterview(item: InterviewRecord): void {
    if (!confirm(`Delete the interview for ${item.companyName}?`)) return;
    this.interviewsApi.delete(item.id).subscribe({ next: () => this.load(), error: () => this.error = 'Interview could not be deleted.' });
  }

  toLocalDateTime(value: string): string {
    const date = new Date(value);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  label(value: string): string { return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase()); }
}
