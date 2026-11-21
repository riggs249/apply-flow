import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ApplicationService } from '../applications/application.service';
import { ApplicationRecord } from '../applications/application.models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { scrollToTop } from '../../shared/utils/scroll';
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
      <form class="form-card mb-4 [&_label]:mb-4" [formGroup]="form" (ngSubmit)="submit()">
        <h2 class="!mb-5">{{ editingId ? 'Edit interview' : 'Schedule interview' }}</h2>
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
        <div class="flex justify-end gap-[.65rem] border-t border-af-divider pt-4"><button class="secondary-button" type="button" (click)="closeForm()">Cancel</button><button class="primary-button" type="submit" [disabled]="saving">{{ saving ? 'Saving…' : 'Save interview' }}</button></div>
      </form>
    }
    @if (loading) { <div class="state">Loading interviews…</div> }
    @else if (!interviews.length) {
      <div class="empty"><mat-icon>calendar_month</mat-icon><h2>No interviews scheduled</h2><p>Add the next conversation for an application.</p></div>
    }
    @else {
      <section class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] items-stretch gap-[.8rem]">
        @for (item of interviews; track item.id) {
          <article class="flex h-full flex-col rounded-af-lg border border-af-border bg-af-surface p-4 shadow-af">
            <header class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <span class="block text-[.68rem] font-bold uppercase text-af-accent">{{ item.interviewType }}</span>
                <strong class="mt-[.45rem] block truncate text-[.86rem] text-af-text">{{ item.companyName }}</strong>
                <small class="mt-[.2rem] block truncate text-[.72rem] text-af-text-faint">{{ item.position }}</small>
              </div>
              <div class="flex shrink-0 flex-col items-end gap-[.35rem]">
                <span class="rounded-af-sm px-[.55rem] py-[.35rem] text-[.65rem] font-bold" [class]="outcomeClass(item.outcome)">{{ label(item.outcome) }}</span>
                @if (needsUpdate(item)) {
                  <span class="rounded-af-sm bg-af-amber-soft px-[.55rem] py-[.3rem] text-[.65rem] font-bold text-af-amber">Needs update</span>
                }
              </div>
            </header>

            <div class="mt-[.8rem] flex flex-1 flex-col gap-[.65rem] border-t border-af-divider pt-[.8rem]">
              @if (needsUpdate(item)) {
                <button
                  type="button"
                  class="rounded-af-sm border border-af-amber/30 bg-af-amber-soft px-3 py-2 text-left text-[.75rem] leading-[1.45] text-af-amber"
                  (click)="edit(item)"
                >
                  This interview time has passed and the outcome is still pending. Edit it to update the result.
                </button>
              }

              <div class="flex items-center gap-[.4rem] text-[.75rem]" [class.text-af-amber]="needsUpdate(item)" [class.text-af-text-muted]="!needsUpdate(item)">
                <mat-icon class="!size-[17px] !text-[17px]">schedule</mat-icon>
                <span>{{ item.scheduledAt | date:'MMM d, y, h:mm a' }}</span>
              </div>

              <div class="flex items-start gap-[.4rem] text-[.75rem] text-af-text-muted">
                <mat-icon class="!size-[17px] !text-[17px]">person</mat-icon>
                <span>{{ item.interviewer || 'No interviewer set' }}</span>
              </div>

              @if (item.interviewerContact) {
                <div class="flex items-start gap-[.4rem] text-[.75rem] text-af-text-muted">
                  <mat-icon class="!size-[17px] !text-[17px]">contact_mail</mat-icon>
                  @if (isEmail(item.interviewerContact)) {
                    <a class="text-af-accent no-underline hover:underline" [href]="'mailto:' + item.interviewerContact">{{ item.interviewerContact }}</a>
                  } @else if (isPhone(item.interviewerContact)) {
                    <a class="text-af-accent no-underline hover:underline" [href]="'tel:' + item.interviewerContact">{{ item.interviewerContact }}</a>
                  } @else {
                    <span>{{ item.interviewerContact }}</span>
                  }
                </div>
              }

              @if (item.locationOrMeetingUrl) {
                <div class="flex items-start gap-[.4rem] text-[.75rem] text-af-text-muted">
                  <mat-icon class="!size-[17px] !text-[17px]">{{ isLink(item.locationOrMeetingUrl) ? 'link' : 'place' }}</mat-icon>
                  @if (isLink(item.locationOrMeetingUrl)) {
                    <a
                      class="min-w-0 break-all font-[650] text-af-accent no-underline hover:underline"
                      [href]="normalizeLink(item.locationOrMeetingUrl)"
                      target="_blank"
                      rel="noopener noreferrer"
                    >{{ displayLink(item.locationOrMeetingUrl) }}</a>
                  } @else {
                    <span class="min-w-0 break-words">{{ item.locationOrMeetingUrl }}</span>
                  }
                </div>
              }

              @if (item.preparationNotes) {
                <p class="m-0 text-[.75rem] leading-[1.5] text-af-text-muted">
                  <strong class="mb-[.2rem] block text-af-text-secondary">Preparation</strong>
                  {{ item.preparationNotes }}
                </p>
              }

              @if (item.reflection) {
                <p class="m-0 text-[.75rem] leading-[1.5] text-af-text-muted">
                  <strong class="mb-[.2rem] block text-af-text-secondary">Reflection</strong>
                  {{ item.reflection }}
                </p>
              }
            </div>

            <footer class="mt-auto flex items-center justify-between gap-3 border-t border-af-divider pt-[.7rem]">
              @if (item.locationOrMeetingUrl && isLink(item.locationOrMeetingUrl)) {
                <a class="secondary-button" [href]="normalizeLink(item.locationOrMeetingUrl)" target="_blank" rel="noopener noreferrer">
                  <mat-icon>videocam</mat-icon> Join
                </a>
              } @else {
                <span></span>
              }
              <div class="flex items-center gap-[.7rem]">
                <button class="text-button" type="button" (click)="edit(item)">Edit</button>
                <button class="danger-text" type="button" (click)="deleteInterview(item)">Delete</button>
              </div>
            </footer>
          </article>
        }
      </section>
    }
  `,
})
export class InterviewPageComponent implements OnInit {
  private readonly interviewsApi = inject(InterviewService);
  private readonly applicationsApi = inject(ApplicationService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly fb = inject(FormBuilder);
  readonly outcomes: InterviewOutcome[] = ['PENDING', 'PASSED', 'FAILED', 'RESCHEDULED', 'CANCELLED'];
  readonly form = this.fb.nonNullable.group({
    applicationId: ['', Validators.required],
    scheduledAt: ['', Validators.required],
    interviewType: ['', Validators.required],
    interviewer: '',
    interviewerContact: '',
    locationOrMeetingUrl: '',
    preparationNotes: '',
    reflection: '',
    outcome: 'PENDING' as InterviewOutcome,
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

  outcomeClass(outcome: InterviewOutcome): string {
    switch (outcome) {
      case 'PASSED': return 'bg-af-success-soft text-af-success-deep';
      case 'FAILED':
      case 'CANCELLED': return 'bg-af-danger-soft text-af-danger';
      case 'RESCHEDULED': return 'bg-af-accent-soft text-af-accent';
      default: return 'bg-af-amber-soft text-af-amber';
    }
  }

  needsUpdate(item: InterviewRecord): boolean {
    return item.outcome === 'PENDING' && new Date(item.scheduledAt).getTime() < Date.now();
  }

  isLink(value: string): boolean {
    const trimmed = value.trim().toLowerCase();
    return trimmed.startsWith('http://')
      || trimmed.startsWith('https://')
      || trimmed.startsWith('www.')
      || trimmed.includes('meet.google.com')
      || trimmed.includes('zoom.us')
      || trimmed.includes('teams.microsoft.com');
  }

  normalizeLink(value: string): string {
    const trimmed = value.trim();
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  }

  displayLink(value: string): string {
    try {
      const parsed = new URL(this.normalizeLink(value));
      return parsed.hostname + (parsed.pathname === '/' ? '' : parsed.pathname);
    } catch {
      return value;
    }
  }

  isEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  isPhone(value: string): boolean {
    return /^[+]?[\d\s().-]{7,}$/.test(value.trim());
  }

  openCreate(): void {
    this.editingId = undefined;
    this.form.reset({
      applicationId: '',
      scheduledAt: '',
      interviewType: '',
      interviewer: '',
      interviewerContact: '',
      locationOrMeetingUrl: '',
      preparationNotes: '',
      reflection: '',
      outcome: 'PENDING',
    });
    this.showForm = true;
    scrollToTop();
  }

  edit(item: InterviewRecord): void {
    this.editingId = item.id;
    this.form.patchValue({
      applicationId: item.applicationId,
      scheduledAt: this.toLocalDateTime(item.scheduledAt),
      interviewType: item.interviewType,
      interviewer: item.interviewer ?? '',
      interviewerContact: item.interviewerContact ?? '',
      locationOrMeetingUrl: item.locationOrMeetingUrl ?? '',
      preparationNotes: item.preparationNotes ?? '',
      reflection: item.reflection ?? '',
      outcome: item.outcome,
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
    const value = { ...this.form.getRawValue(), scheduledAt: new Date(this.form.value.scheduledAt!).toISOString() };
    const operation = this.editingId ? this.interviewsApi.update(this.editingId, value) : this.interviewsApi.create(value);
    operation.subscribe({
      next: () => { this.saving = false; this.closeForm(); this.load(); },
      error: () => { this.error = 'Interview could not be saved.'; this.saving = false; },
    });
  }

  deleteInterview(item: InterviewRecord): void {
    this.confirmDialog.confirm({
      title: 'Delete interview',
      message: `Delete the interview for ${item.companyName}?`,
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.interviewsApi.delete(item.id).subscribe({
        next: () => this.load(),
        error: () => this.error = 'Interview could not be deleted.',
      });
    });
  }

  toLocalDateTime(value: string): string {
    const date = new Date(value);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  label(value: string): string {
    return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
  }
}
