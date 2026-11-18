import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { ApplicationService } from './application.service';
import { ApplicationActivity, ApplicationRecord } from './application.models';
import { DatePipe } from '@angular/common';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ResumeService } from '../resumes/resume.service';

@Component({
  selector: 'app-application-detail-page',
  standalone: true,
  imports: [RouterLink, MatIconModule, PageHeaderComponent, DatePipe],
  template: `
    @if (loading) { <div class="state">Loading application…</div> }
    @else if (error) { <div class="error">{{ error }}</div> }
    @else if (application) {
      <app-page-header [eyebrow]="application.companyName" [title]="application.position" [description]="application.location || 'Location not specified'">
        <div class="header-actions"><a class="secondary-button" [routerLink]="['/applications', application.id, 'edit']"><mat-icon>edit</mat-icon> Edit</a><button class="danger-button" (click)="deleteApplication()"><mat-icon>delete_outline</mat-icon> Delete</button></div>
      </app-page-header>
      <section class="detail-grid">
        <article class="panel">
          <h2>Application overview</h2>
          <div class="details">@for (item of details; track item.label) { <div><span>{{ item.label }}</span><strong>{{ item.value }}</strong></div> }</div>
          @if (application.resumeId) {
            <div class="resume-block">
              <h2 class="description-title">Resume</h2>
              <p class="notes">{{ application.resumeDescription || 'No description for this resume.' }}</p>
              <button class="secondary-button" type="button" (click)="previewResume()"><mat-icon>visibility</mat-icon> View CV</button>
            </div>
          }
        </article>
        <article class="panel">
          <h2>Personal notes</h2>
          <p class="notes">{{ application.personalNotes || 'No notes added yet.' }}</p>
          <h2 class="description-title">Job description</h2>
          <p class="notes">{{ application.jobDescription || 'No job description added.' }}</p>
        </article>
      </section>
      @if (previewUrl) {
        <section class="panel preview-panel">
          <div class="preview-header">
            <h2>{{ application.resumeTitle || 'Resume' }}</h2>
            <button class="secondary-button" type="button" (click)="closePreview()"><mat-icon>close</mat-icon> Close</button>
          </div>
          <iframe class="preview-frame" [src]="previewUrl" title="Resume preview"></iframe>
        </section>
      }
      <section class="panel timeline-panel"><h2>Activity history</h2>@if (activitiesLoading) { <p class="muted">Loading activity…</p> } @else if (!activities.length) { <p class="muted">No activity recorded yet.</p> } @else { <ol class="timeline">@for (activity of activities; track activity.id) { <li><span class="timeline-dot"></span><div><strong>{{ activity.description }}</strong><time>{{ activity.occurredAt | date:'MMM d, y, h:mm a' }}</time></div></li> }</ol> }</section>
    }
  `,
  styles: [`
    .header-actions { display: flex; gap: .6rem; }
    .detail-grid { display: grid; gap: 1rem; grid-template-columns: 1fr 1fr; }
    .timeline-panel, .preview-panel { margin-top: 1rem; }
    h2 { color: var(--af-text); font-size: 1rem; margin: 0 0 1.25rem; }
    .details { display: grid; gap: 1.25rem; grid-template-columns: repeat(2, 1fr); }
    .details span { color: var(--af-text-faint); display: block; font-size: .7rem; margin-bottom: .3rem; }
    .details strong { color: var(--af-text-secondary); font-size: .82rem; }
    .notes { color: var(--af-text-muted); font-size: .82rem; line-height: 1.7; white-space: pre-wrap; }
    .description-title { border-top: 1px solid var(--af-divider); margin-top: 1.5rem; padding-top: 1.5rem; }
    .resume-block .secondary-button { margin-top: .75rem; }
    .preview-header { align-items: center; display: flex; justify-content: space-between; gap: 1rem; margin-bottom: .85rem; }
    .preview-header h2 { margin: 0; }
    .preview-frame {
      background: #fff;
      border: 1px solid var(--af-border);
      border-radius: var(--af-radius);
      height: min(70vh, 820px);
      width: 100%;
    }
    .muted { color: var(--af-text-faint); font-size: .82rem; }
    .timeline { list-style: none; margin: 0; padding: 0; }
    .timeline li { display: flex; gap: .8rem; padding: .75rem 0; }
    .timeline-dot {
      background: var(--af-accent);
      border-radius: 50%;
      flex: none;
      height: 9px;
      margin-top: .3rem;
      width: 9px;
    }
    .timeline li + li { border-top: 1px solid var(--af-divider); }
    .timeline strong, .timeline time { display: block; }
    .timeline strong { color: var(--af-text-secondary); font-size: .82rem; font-weight: 550; }
    .timeline time { color: var(--af-text-faint); font-size: .7rem; margin-top: .25rem; }
    @media (max-width: 700px) {
      .detail-grid { grid-template-columns: 1fr; }
      .header-actions { flex-wrap: wrap; }
      .details { grid-template-columns: 1fr; }
    }
  `],
})
export class ApplicationDetailPageComponent implements OnInit, OnDestroy {
  private readonly service = inject(ApplicationService);
  private readonly resumeService = inject(ResumeService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  application?: ApplicationRecord;
  activities: ApplicationActivity[] = [];
  activitiesLoading = true;
  loading = true;
  error = '';
  details: { label: string; value: string }[] = [];
  previewUrl: SafeResourceUrl | null = null;
  private objectUrl: string | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.service.get(id).subscribe({
      next: item => {
        this.application = item;
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
        this.service.activities(id).subscribe({
          next: items => { this.activities = items; this.activitiesLoading = false; },
          error: () => this.activitiesLoading = false,
        });
      },
      error: () => {
        this.error = 'Application could not be loaded.';
        this.loading = false;
        this.activitiesLoading = false;
      },
    });
  }

  ngOnDestroy(): void {
    this.closePreview();
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
    if (!this.application || !confirm(`Delete the application for ${this.application.position}?`)) return;
    this.service.delete(this.application.id).subscribe({
      next: () => this.router.navigateByUrl('/applications'),
      error: () => this.error = 'Application could not be deleted.',
    });
  }

  label(value: string): string {
    return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
  }
}
