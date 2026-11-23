import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApplicationService } from './application.service';
import { ApplicationActivity, ApplicationRecord } from './application.models';
import { DatePipe } from '@angular/common';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { ResumeService } from '../resumes/resume.service';
import { InterviewRecord } from '../interviews/interview.models';
import { AssessmentRecord } from '../assessments/assessment.models';
import { ReminderRecord } from '../reminders/reminder.models';

@Component({
  selector: 'app-application-detail-page',
  standalone: true,
  imports: [RouterLink, MatIconModule, PageHeaderComponent, DatePipe, LoadingStateComponent],
  template: `
    @if (loading) { <app-loading-state message="Loading application…" /> }
    @else if (error) { <div class="error">{{ error }}</div> }
    @else if (application) {
      <div class="mb-3">
        <a class="text-button inline-flex items-center gap-1 !p-0" routerLink="/applications">
          <mat-icon class="!size-[18px] !text-[18px]">arrow_back</mat-icon>
          Back to applications
        </a>
      </div>
      <app-page-header [eyebrow]="application.companyName" [title]="application.position" [description]="application.location || 'Location not specified'">
        <div class="flex gap-[.55rem] max-[700px]:flex-wrap">
          <a class="secondary-button" [routerLink]="['/applications', application.id, 'edit']"><mat-icon>edit</mat-icon> Edit</a>
          <button class="danger-button" (click)="deleteApplication()"><mat-icon>delete_outline</mat-icon> Delete</button>
        </div>
      </app-page-header>

      <section class="grid grid-cols-[1.15fr_.85fr] gap-3 max-[700px]:grid-cols-[1fr]">
        <article class="panel !p-4">
          <h2 class="m-0 mb-3 text-[.92rem] text-af-text">Application overview</h2>
          <div class="grid grid-cols-2 gap-x-4 gap-y-3 max-[700px]:grid-cols-1">
            @for (item of details; track item.label) {
              <div>
                <span class="mb-[.15rem] block text-[.68rem] text-af-text-faint">{{ item.label }}</span>
                <strong class="text-[.8rem] font-[650] text-af-text-secondary">{{ item.value }}</strong>
              </div>
            }
          </div>

          @if (application.jobPostingUrl) {
            <div class="mt-3 border-t border-af-divider pt-3">
              <span class="mb-[.2rem] block text-[.68rem] text-af-text-faint">Job posting</span>
              <a
                class="inline-block max-w-full text-[.78rem] font-[650] text-af-accent [overflow-wrap:anywhere] [word-break:break-word]"
                [href]="application.jobPostingUrl"
                target="_blank"
                rel="noopener noreferrer"
              >{{ application.jobPostingUrl }}</a>
            </div>
          }

          @if (application.resumeId) {
            <div class="mt-3 border-t border-af-divider pt-3">
              <div class="mb-2 flex items-center justify-between gap-3">
                <h2 class="m-0 text-[.92rem] text-af-text">Resume</h2>
                <button class="secondary-button !px-3 !py-1.5 !text-[.75rem]" type="button" (click)="previewResume()">
                  <mat-icon>visibility</mat-icon> View CV
                </button>
              </div>
              @if (application.resumeFileName) {
                <p class="m-0 mb-1.5 flex items-center gap-[.35rem] text-[.75rem] text-af-text-secondary">
                  <mat-icon class="!size-[16px] !text-[16px] text-af-accent">picture_as_pdf</mat-icon>
                  <span class="truncate">{{ application.resumeFileName }}</span>
                </p>
              }
              <p class="m-0 whitespace-pre-wrap text-[.78rem] leading-[1.5] text-af-text-muted">
                {{ application.resumeDescription || 'No description for this resume.' }}
              </p>
            </div>
          }
        </article>

        <article class="panel !p-4">
          <h2 class="m-0 mb-3 text-[.92rem] text-af-text">Personal notes</h2>
          <p class="m-0 whitespace-pre-wrap text-[.78rem] leading-[1.55] text-af-text-muted">
            {{ application.personalNotes || 'No notes added yet.' }}
          </p>
        </article>
      </section>

      @if (previewUrl) {
        <section class="panel mt-3 !p-4">
          <div class="mb-2.5 flex items-center justify-between gap-3">
            <div class="min-w-0">
              <h2 class="m-0 text-[.92rem] text-af-text">{{ application.resumeTitle || 'Resume' }}</h2>
              @if (application.resumeFileName) {
                <p class="m-0 mt-1 truncate text-[.72rem] text-af-text-faint">{{ application.resumeFileName }}</p>
              }
            </div>
            <button class="secondary-button !px-3 !py-1.5 !text-[.75rem]" type="button" (click)="closePreview()"><mat-icon>close</mat-icon> Close</button>
          </div>
          <iframe class="h-[min(65vh,720px)] w-full rounded-af border border-af-border bg-white" [src]="previewUrl" title="Resume preview"></iframe>
        </section>
      }

      <section class="panel mt-3 !p-4">
        <div class="mb-2.5 flex items-center justify-between gap-3">
          <h2 class="m-0 text-[.92rem] text-af-text">Job description</h2>
          @if (canToggleDescription) {
            <button class="text-button inline-flex items-center gap-[.15rem] p-0 !text-[.78rem] !font-semibold" type="button" (click)="toggleDescription()">
              {{ descriptionExpanded ? 'Show less' : 'Show more' }}
              <mat-icon class="!size-4 !text-[1rem]">{{ descriptionExpanded ? 'expand_less' : 'expand_more' }}</mat-icon>
            </button>
          }
        </div>
        @if (!application.jobDescription) {
          <p class="m-0 text-[.78rem] text-af-text-faint">No job description added.</p>
        } @else {
          <div class="relative">
            <div [class.max-h-52]="!descriptionExpanded && canToggleDescription" [class.overflow-hidden]="!descriptionExpanded && canToggleDescription">
              <p class="m-0 max-w-[72ch] whitespace-pre-wrap text-[.78rem] leading-[1.55] text-af-text-muted">{{ application.jobDescription }}</p>
            </div>
            @if (canToggleDescription && !descriptionExpanded) {
              <div class="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-[linear-gradient(to_bottom,transparent,var(--af-surface))]"></div>
            }
          </div>
        }
      </section>

      <section class="mt-3 grid grid-cols-3 gap-3 max-[900px]:grid-cols-1">
        <article class="panel !p-4">
          <div class="mb-2.5 flex items-center justify-between gap-2">
            <h2 class="m-0 text-[.92rem] text-af-text">Interviews</h2>
            <a class="text-button !p-0 !text-[.72rem] !font-semibold" routerLink="/interviews">Manage</a>
          </div>
          @if (relatedLoading) {
            <p class="m-0 text-[.78rem] text-af-text-faint">Loading…</p>
          } @else if (!interviews.length) {
            <p class="m-0 text-[.78rem] text-af-text-faint">No interviews linked yet.</p>
          } @else {
            <ul class="m-0 list-none p-0">
              @for (item of interviews; track item.id) {
                <li class="py-2 not-first:border-t not-first:border-af-divider">
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <strong class="block truncate text-[.78rem] font-[550] text-af-text-secondary">{{ item.interviewType }}</strong>
                      <time class="mt-[.2rem] block text-[.68rem] text-af-text-faint">{{ item.scheduledAt | date:'MMM d, y, h:mm a' }}</time>
                    </div>
                    <span class="shrink-0 rounded-af-sm px-[.45rem] py-[.2rem] text-[.62rem] font-bold" [class]="outcomeClass(item.outcome)">{{ label(item.outcome) }}</span>
                  </div>
                </li>
              }
            </ul>
          }
        </article>

        <article class="panel !p-4">
          <div class="mb-2.5 flex items-center justify-between gap-2">
            <h2 class="m-0 text-[.92rem] text-af-text">Assessments</h2>
            <a class="text-button !p-0 !text-[.72rem] !font-semibold" routerLink="/assessments">Manage</a>
          </div>
          @if (relatedLoading) {
            <p class="m-0 text-[.78rem] text-af-text-faint">Loading…</p>
          } @else if (!assessments.length) {
            <p class="m-0 text-[.78rem] text-af-text-faint">No assessments linked yet.</p>
          } @else {
            <ul class="m-0 list-none p-0">
              @for (item of assessments; track item.id) {
                <li class="py-2 not-first:border-t not-first:border-af-divider">
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <strong class="block truncate text-[.78rem] font-[550] text-af-text-secondary">{{ item.title }}</strong>
                      <span class="mt-[.2rem] block text-[.68rem] text-af-text-faint">
                        {{ item.assessmentType }}
                        @if (item.dueAt) { · due {{ item.dueAt | date:'MMM d, y' }} }
                      </span>
                    </div>
                    <span class="shrink-0 rounded-af-sm px-[.45rem] py-[.2rem] text-[.62rem] font-bold" [class]="statusClass(item.status)">{{ label(item.status) }}</span>
                  </div>
                </li>
              }
            </ul>
          }
        </article>

        <article class="panel !p-4">
          <div class="mb-2.5 flex items-center justify-between gap-2">
            <h2 class="m-0 text-[.92rem] text-af-text">Reminders</h2>
            <a class="text-button !p-0 !text-[.72rem] !font-semibold" routerLink="/reminders">Manage</a>
          </div>
          @if (relatedLoading) {
            <p class="m-0 text-[.78rem] text-af-text-faint">Loading…</p>
          } @else if (!reminders.length) {
            <p class="m-0 text-[.78rem] text-af-text-faint">No reminders linked yet.</p>
          } @else {
            <ul class="m-0 list-none p-0">
              @for (item of reminders; track item.id) {
                <li class="py-2 not-first:border-t not-first:border-af-divider">
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <strong class="block truncate text-[.78rem] font-[550] text-af-text-secondary">{{ item.title }}</strong>
                      <time class="mt-[.2rem] block text-[.68rem] text-af-text-faint">{{ item.remindAt | date:'MMM d, y, h:mm a' }}</time>
                    </div>
                    <span
                      class="shrink-0 rounded-af-sm px-[.45rem] py-[.2rem] text-[.62rem] font-bold"
                      [class.text-af-danger]="item.timingState === 'OVERDUE'"
                      [class.bg-af-danger-soft]="item.timingState === 'OVERDUE'"
                      [class.text-af-accent]="item.timingState !== 'OVERDUE'"
                      [class.bg-af-accent-soft]="item.timingState !== 'OVERDUE'"
                    >{{ label(item.timingState) }}</span>
                  </div>
                </li>
              }
            </ul>
          }
        </article>
      </section>

      <section class="panel mt-3 !p-4">
        <h2 class="m-0 mb-2.5 text-[.92rem] text-af-text">Activity history</h2>
        @if (activitiesLoading) {
          <p class="m-0 text-[.78rem] text-af-text-faint">Loading activity…</p>
        } @else if (!activities.length) {
          <p class="m-0 text-[.78rem] text-af-text-faint">No activity recorded yet.</p>
        } @else {
          <ol class="m-0 list-none p-0">
            @for (activity of activities; track activity.id) {
              <li class="flex gap-[.65rem] py-2 not-first:border-t not-first:border-af-divider">
                <span class="mt-[.35rem] size-2 flex-none rounded-full bg-af-accent"></span>
                <div>
                  <strong class="block text-[.78rem] font-[550] text-af-text-secondary">{{ activity.description }}</strong>
                  <time class="mt-[.2rem] block text-[.68rem] text-af-text-faint">{{ activity.occurredAt | date:'MMM d, y, h:mm a' }}</time>
                </div>
              </li>
            }
          </ol>
        }
      </section>
    }
  `,
})
export class ApplicationDetailPageComponent implements OnInit, OnDestroy {
  private static readonly DESCRIPTION_COLLAPSE_CHARS = 700;

  private readonly service = inject(ApplicationService);
  private readonly resumeService = inject(ResumeService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  application?: ApplicationRecord;
  activities: ApplicationActivity[] = [];
  interviews: InterviewRecord[] = [];
  assessments: AssessmentRecord[] = [];
  reminders: ReminderRecord[] = [];
  activitiesLoading = true;
  relatedLoading = true;
  loading = true;
  error = '';
  details: { label: string; value: string }[] = [];
  descriptionExpanded = false;
  canToggleDescription = false;
  previewUrl: SafeResourceUrl | null = null;
  private objectUrl: string | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.service.get(id).subscribe({
      next: item => {
        this.application = item;
        this.canToggleDescription = (item.jobDescription?.length ?? 0) > ApplicationDetailPageComponent.DESCRIPTION_COLLAPSE_CHARS;
        this.descriptionExpanded = !this.canToggleDescription;
        const resumeLabel = item.resumeTitle || item.resumeVersion || 'Not specified';
        this.details = [
          { label: 'Status', value: this.label(item.status) },
          ...(item.status === 'IN_PROCESS' && item.processStage
            ? [{ label: 'Process stage', value: this.label(item.processStage) }]
            : []),
          { label: 'Employment type', value: this.label(item.employmentType) },
          { label: 'Work arrangement', value: item.workArrangement ? this.label(item.workArrangement) : 'Not specified' },
          { label: 'Application date', value: item.applicationDate || 'Not specified' },
          { label: 'Salary expectation', value: item.salaryExpectation ? String(item.salaryExpectation) : 'Not specified' },
          { label: 'Resume', value: resumeLabel },
        ];
        this.loading = false;
        this.loadRelated(id);
      },
      error: () => {
        this.error = 'Application could not be loaded.';
        this.loading = false;
        this.activitiesLoading = false;
        this.relatedLoading = false;
      },
    });
  }

  ngOnDestroy(): void {
    this.closePreview();
  }

  toggleDescription(): void {
    this.descriptionExpanded = !this.descriptionExpanded;
  }

  previewResume(): void {
    if (!this.application?.resumeId) return;
    this.resumeService.fileBlob(this.application.resumeId).subscribe({
      next: blob => {
        this.closePreview();
        this.objectUrl = URL.createObjectURL(blob);
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl);
      },
      error: () => this.error = 'Resume preview could not be loaded.',
    });
  }

  closePreview(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    this.previewUrl = null;
  }

  deleteApplication(): void {
    if (!this.application) return;
    const application = this.application;
    this.confirmDialog.confirm({
      title: 'Delete application',
      message: `Delete the application for ${application.position}? This cannot be undone.`,
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.service.delete(application.id).subscribe({
        next: () => this.router.navigateByUrl('/applications'),
        error: () => this.error = 'Application could not be deleted.',
      });
    });
  }

  label(value: string): string {
    return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
  }

  outcomeClass(outcome: string): string {
    switch (outcome) {
      case 'PASSED': return 'bg-af-accent-soft text-af-accent';
      case 'FAILED':
      case 'CANCELLED': return 'bg-af-danger-soft text-af-danger';
      case 'RESCHEDULED': return 'bg-af-border-soft text-af-text-muted';
      default: return 'bg-af-border-soft text-af-text-secondary';
    }
  }

  statusClass(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'bg-af-accent-soft text-af-accent';
      case 'EXPIRED': return 'bg-af-danger-soft text-af-danger';
      case 'IN_PROGRESS': return 'bg-af-border-soft text-af-text-secondary';
      default: return 'bg-af-border-soft text-af-text-muted';
    }
  }

  private loadRelated(id: string): void {
    forkJoin({
      activities: this.service.activities(id).pipe(catchError(() => of([] as ApplicationActivity[]))),
      interviews: this.service.interviews(id).pipe(catchError(() => of([] as InterviewRecord[]))),
      assessments: this.service.assessments(id).pipe(catchError(() => of([] as AssessmentRecord[]))),
      reminders: this.service.reminders(id).pipe(catchError(() => of([] as ReminderRecord[]))),
    }).subscribe({
      next: result => {
        this.activities = result.activities;
        this.interviews = result.interviews;
        this.assessments = result.assessments;
        this.reminders = result.reminders;
        this.activitiesLoading = false;
        this.relatedLoading = false;
      },
      error: () => {
        this.activitiesLoading = false;
        this.relatedLoading = false;
      },
    });
  }
}
