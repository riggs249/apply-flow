import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ApplicationService } from './application.service';
import { ApplicationStatus, EmploymentType, ProcessStage, WorkArrangement, CompanyOption } from './application.models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ResumeService } from '../resumes/resume.service';
import { ResumeRecord } from '../resumes/resume.models';

@Component({
  selector: 'app-application-form-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatIconModule, PageHeaderComponent],
  template: `
    <app-page-header [title]="editing ? 'Edit application' : 'Add application'" description="Capture the details you need to keep momentum.">
      <a class="secondary-button" routerLink="/applications"><mat-icon>arrow_back</mat-icon> Back to applications</a>
    </app-page-header>
    @if (error) { <div class="error">{{ error }}</div> }
    <form class="form-card" [formGroup]="form" (ngSubmit)="submit()">
      <div class="section-title"><h2>Role details</h2><p>Start with the essentials of this opportunity.</p></div>
      <div class="fields two"><label>Company<select formControlName="companyId"><option value="">Select a company</option>@for (company of companies; track company.id) { <option [value]="company.id">{{ company.name }}</option> }</select>@if (!companies.length) { <small class="hint">No companies yet. <a routerLink="/companies">Add a company</a> first.</small> }</label><label>Position<input formControlName="position" placeholder="e.g. Product Designer" />@if (form.controls.position.touched && form.controls.position.invalid) { <small>Position is required.</small> }</label></div>
      <label>Job description<textarea rows="4" formControlName="jobDescription" placeholder="What will you be working on?"></textarea></label>
      <div class="fields three"><label>Employment type<select formControlName="employmentType">@for (item of employmentTypes; track item) { <option [value]="item">{{ label(item) }}</option> }</select></label><label>Work arrangement<select formControlName="workArrangement"><option value="">Not specified</option>@for (item of arrangements; track item) { <option [value]="item">{{ label(item) }}</option> }</select></label><label>Location<input formControlName="location" placeholder="Remote / New York" /></label></div>
      <div class="section-title separated"><h2>Application details</h2><p>Keep the information you will want at a glance.</p></div>
      <div class="fields three">
        <label>Application date<input type="date" formControlName="applicationDate" /></label>
        <label>Current status<select formControlName="status">@for (item of statuses; track item) { <option [value]="item">{{ label(item) }}</option> }</select></label>
        <label>Salary expectation<input type="number" min="0" formControlName="salaryExpectation" placeholder="Optional" /></label>
      </div>
      @if (form.controls.status.value === 'IN_PROCESS') {
        <label>Process stage
          <select formControlName="processStage">
            <option value="">Select a stage</option>
            @for (item of processStages; track item) { <option [value]="item">{{ label(item) }}</option> }
          </select>
          @if (form.controls.processStage.touched && form.controls.processStage.invalid) {
            <small>Process stage is required for In Process applications.</small>
          }
        </label>
      }
      <div class="fields two">
        <label>Job posting URL<input type="url" formControlName="jobPostingUrl" placeholder="https://..." /></label>
        <label>Resume
          <select formControlName="resumeId">
            <option value="">None</option>
            @for (resume of resumes; track resume.id) {
              <option [value]="resume.id">{{ resume.title }}</option>
            }
          </select>
          @if (!resumes.length) {
            <small class="hint">No resumes yet. <a routerLink="/resumes">Upload a CV</a> first.</small>
          }
        </label>
      </div>
      <label>Personal notes<textarea rows="4" formControlName="personalNotes" placeholder="Your notes, next steps, or context"></textarea></label>
      <div class="actions"><a class="secondary-button" routerLink="/applications">Cancel</a><button class="primary-button" type="submit" [disabled]="saving">{{ saving ? 'Saving…' : (editing ? 'Save changes' : 'Add application') }}</button></div>
    </form>
  `,
  styles: [`
    .form-card label { margin-bottom: 1rem; }
    .fields.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .actions {
      border-top: 1px solid var(--af-divider);
      display: flex;
      gap: .65rem;
      justify-content: flex-end;
      margin-top: .5rem;
      padding-top: 1.25rem;
    }
    @media (max-width: 700px) {
      .fields.two, .fields.three { grid-template-columns: 1fr; }
    }
  `],
})
export class ApplicationFormPageComponent implements OnInit {
  private readonly service = inject(ApplicationService);
  private readonly resumeService = inject(ResumeService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly statuses: ApplicationStatus[] = ['WISHLIST', 'APPLIED', 'IN_PROCESS', 'REJECTED', 'HIRED', 'WITHDRAWN'];
  readonly processStages: ProcessStage[] = ['ASSESSMENT', 'HR_INTERVIEW', 'TECHNICAL_INTERVIEW', 'FINAL_INTERVIEW'];
  readonly employmentTypes: EmploymentType[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'INTERNSHIP'];
  readonly arrangements: WorkArrangement[] = ['ONSITE', 'HYBRID', 'REMOTE'];
  readonly form = this.fb.nonNullable.group({
    companyId: ['', Validators.required],
    position: ['', [Validators.required, Validators.maxLength(200)]],
    jobDescription: '',
    employmentType: 'FULL_TIME' as EmploymentType,
    workArrangement: '' as WorkArrangement | '',
    location: '',
    salaryExpectation: null as number | null,
    applicationDate: new Date().toISOString().slice(0, 10),
    jobPostingUrl: '',
    resumeId: '',
    status: 'APPLIED' as ApplicationStatus,
    processStage: '' as ProcessStage | '',
    personalNotes: '',
  });
  companies: CompanyOption[] = [];
  resumes: ResumeRecord[] = [];
  editing = false;
  saving = false;
  error = '';
  private id?: string;

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? undefined;
    this.editing = !!this.id;
    this.syncProcessStageValidators(this.form.controls.status.value);
    this.form.controls.status.valueChanges.subscribe(status => this.syncProcessStageValidators(status));

    this.service.companies().subscribe({
      next: page => this.companies = page.content,
      error: () => this.error = 'Companies could not be loaded.',
    });

    this.resumeService.list().subscribe({
      next: items => this.resumes = items,
      error: () => this.error = 'Resumes could not be loaded.',
    });

    if (this.id) {
      this.service.get(this.id).subscribe({
        next: item => this.form.patchValue({
          companyId: item.companyId,
          position: item.position,
          jobDescription: item.jobDescription ?? '',
          employmentType: item.employmentType,
          workArrangement: item.workArrangement ?? '',
          location: item.location ?? '',
          salaryExpectation: item.salaryExpectation ?? null,
          applicationDate: item.applicationDate ?? '',
          jobPostingUrl: item.jobPostingUrl ?? '',
          resumeId: item.resumeId ?? '',
          status: item.status,
          processStage: item.processStage ?? '',
          personalNotes: item.personalNotes ?? '',
        }),
        error: () => this.error = 'Application could not be loaded.',
      });
    }
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving = true;
    this.error = '';
    const raw = this.form.getRawValue();
    const request = {
      ...raw,
      workArrangement: raw.workArrangement || null,
      resumeId: raw.resumeId || null,
      processStage: raw.status === 'IN_PROCESS' ? raw.processStage || null : null,
    };
    const operation = this.id ? this.service.update(this.id, request) : this.service.create(request);
    operation.subscribe({
      next: item => this.router.navigate(['/applications', item.id]),
      error: () => { this.error = 'Application could not be saved.'; this.saving = false; },
    });
  }

  label(value: string): string {
    return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
  }

  private syncProcessStageValidators(status: ApplicationStatus): void {
    const control = this.form.controls.processStage;
    if (status === 'IN_PROCESS') {
      control.setValidators([Validators.required]);
    } else {
      control.clearValidators();
      control.setValue('');
    }
    control.updateValueAndValidity({ emitEvent: false });
  }
}
