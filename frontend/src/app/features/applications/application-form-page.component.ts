import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ApplicationService } from './application.service';
import { ApplicationStatus, EmploymentType, ProcessStage, WorkArrangement, CompanyOption } from './application.models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ResumeService } from '../resumes/resume.service';
import { ResumeRecord } from '../resumes/resume.models';
import { CompanyService } from '../companies/company.service';

@Component({
  selector: 'app-application-form-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatIconModule, PageHeaderComponent],
  template: `
    <app-page-header [title]="editing ? 'Edit application' : 'Add application'" description="Capture the details you need to keep momentum.">
      <a class="secondary-button" routerLink="/applications"><mat-icon>arrow_back</mat-icon> Back to applications</a>
    </app-page-header>
    @if (error) { <div class="error">{{ error }}</div> }
    @if (importMessage) { <div class="success">{{ importMessage }}</div> }
    <form class="form-card" [formGroup]="form" (ngSubmit)="submit()">
      <div class="section-title"><h2>Import from job link</h2><p>Paste a posting URL to create or match the company automatically.</p></div>
      <div class="url-row">
        <label class="grow">Job posting URL
          <input type="url" formControlName="jobPostingUrl" placeholder="https://boards.greenhouse.io/..." />
        </label>
        <button class="secondary-button parse-button" type="button" (click)="fillFromJobLink()" [disabled]="parsing">
          <mat-icon>link</mat-icon>
          {{ parsing ? 'Reading…' : 'Fill from link' }}
        </button>
      </div>

      <div class="section-title separated"><h2>Role details</h2><p>Start with the essentials of this opportunity.</p></div>
      <div class="company-mode">
        <button type="button" class="mode-chip" [class.active]="companyMode === 'existing'" (click)="setCompanyMode('existing')">Use existing</button>
        <button type="button" class="mode-chip" [class.active]="companyMode === 'new'" (click)="setCompanyMode('new')">Create new</button>
      </div>
      @if (companyMode === 'existing') {
        <label>Company
          <select formControlName="companyId">
            <option value="">Select a company</option>
            @for (company of companies; track company.id) {
              <option [value]="company.id">{{ company.name }}</option>
            }
          </select>
          @if (!companies.length) {
            <small class="hint">No companies yet. Create one here or import from a job link.</small>
          }
          @if (form.controls.companyId.touched && form.controls.companyId.invalid) {
            <small>Company is required.</small>
          }
        </label>
      } @else {
        <div class="fields two">
          <label>Company name
            <input formControlName="newCompanyName" placeholder="e.g. Acme" />
            @if (form.controls.newCompanyName.touched && form.controls.newCompanyName.invalid) {
              <small>Company name is required.</small>
            }
          </label>
          <label>Company website
            <input type="url" formControlName="newCompanyWebsite" placeholder="https://..." />
          </label>
        </div>
      }
      <label>Position<input formControlName="position" placeholder="e.g. Product Designer" />@if (form.controls.position.touched && form.controls.position.invalid) { <small>Position is required.</small> }</label>
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
      <label>Personal notes<textarea rows="4" formControlName="personalNotes" placeholder="Your notes, next steps, or context"></textarea></label>
      <div class="actions"><a class="secondary-button" routerLink="/applications">Cancel</a><button class="primary-button" type="submit" [disabled]="saving">{{ saving ? 'Saving…' : (editing ? 'Save changes' : 'Add application') }}</button></div>
    </form>
  `,
  styles: [`
    .form-card label { margin-bottom: 1rem; }
    .fields.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .url-row {
      align-items: end;
      display: grid;
      gap: .75rem;
      grid-template-columns: minmax(0, 1fr) auto;
      margin-bottom: 1rem;
    }
    .url-row .grow { margin-bottom: 0; }
    .parse-button { height: 2.75rem; white-space: nowrap; }
    .company-mode {
      display: flex;
      gap: .5rem;
      margin-bottom: .85rem;
    }
    .mode-chip {
      background: transparent;
      border: 1px solid var(--af-divider);
      border-radius: 999px;
      color: var(--af-text-muted);
      cursor: pointer;
      font: inherit;
      padding: .35rem .85rem;
    }
    .mode-chip.active {
      background: var(--af-accent-soft);
      border-color: var(--af-accent);
      color: var(--af-text);
    }
    .success {
      background: var(--af-success-soft);
      border: 1px solid var(--af-accent-muted);
      border-radius: var(--af-radius);
      color: var(--af-success-deep);
      margin-bottom: 1rem;
      padding: .85rem 1rem;
    }
    .actions {
      border-top: 1px solid var(--af-divider);
      display: flex;
      gap: .65rem;
      justify-content: flex-end;
      margin-top: .5rem;
      padding-top: 1.25rem;
    }
    @media (max-width: 700px) {
      .fields.two, .fields.three, .url-row { grid-template-columns: 1fr; }
      .parse-button { width: 100%; }
    }
  `],
})
export class ApplicationFormPageComponent implements OnInit {
  private readonly service = inject(ApplicationService);
  private readonly companyService = inject(CompanyService);
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
    newCompanyName: [''],
    newCompanyWebsite: [''],
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
  companyMode: 'existing' | 'new' = 'existing';
  editing = false;
  saving = false;
  parsing = false;
  error = '';
  importMessage = '';
  private id?: string;

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? undefined;
    this.editing = !!this.id;
    this.syncProcessStageValidators(this.form.controls.status.value);
    this.syncCompanyValidators();
    this.form.controls.status.valueChanges.subscribe(status => this.syncProcessStageValidators(status));

    this.service.companies().subscribe({
      next: page => {
        this.companies = page.content;
        if (!this.editing && !this.companies.length) {
          this.setCompanyMode('new');
        }
      },
      error: () => this.error = 'Companies could not be loaded.',
    });

    this.resumeService.list().subscribe({
      next: items => this.resumes = items,
      error: () => this.error = 'Resumes could not be loaded.',
    });

    if (this.id) {
      this.service.get(this.id).subscribe({
        next: item => {
          this.setCompanyMode('existing');
          this.form.patchValue({
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
          });
        },
        error: () => this.error = 'Application could not be loaded.',
      });
    }
  }

  setCompanyMode(mode: 'existing' | 'new'): void {
    this.companyMode = mode;
    this.syncCompanyValidators();
  }

  fillFromJobLink(): void {
    const url = this.form.controls.jobPostingUrl.value.trim();
    if (!url) {
      this.error = 'Paste a job posting URL first.';
      this.importMessage = '';
      return;
    }

    this.parsing = true;
    this.error = '';
    this.importMessage = '';
    this.service.parseJobPosting(url).subscribe({
      next: result => {
        this.parsing = false;
        this.importMessage = result.message;
        this.form.patchValue({
          jobPostingUrl: result.jobPostingUrl || url,
          position: result.position || this.form.controls.position.value,
          jobDescription: result.jobDescription || this.form.controls.jobDescription.value,
          location: result.location || this.form.controls.location.value,
          salaryExpectation: result.salaryExpectation ?? this.form.controls.salaryExpectation.value,
        });

        if (result.companyMatched && result.companyId) {
          this.setCompanyMode('existing');
          this.form.patchValue({ companyId: result.companyId });
          return;
        }

        this.setCompanyMode('new');
        this.form.patchValue({
          companyId: '',
          newCompanyName: result.companyName ?? '',
          newCompanyWebsite: result.companyWebsite ?? '',
        });
      },
      error: err => {
        this.parsing = false;
        this.importMessage = '';
        this.error = err?.error?.message || 'That job link could not be imported.';
      },
    });
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving = true;
    this.error = '';
    this.importMessage = '';

    if (this.companyMode === 'new') {
      const name = this.form.controls.newCompanyName.value.trim();
      const website = this.form.controls.newCompanyWebsite.value.trim();
      this.companyService.create({
        name,
        website: website || null,
        industry: null,
        location: null,
        notes: null,
      }).subscribe({
        next: company => {
          this.companies = [...this.companies, { id: company.id, name: company.name }]
            .sort((a, b) => a.name.localeCompare(b.name));
          this.setCompanyMode('existing');
          this.form.patchValue({ companyId: company.id });
          this.saveApplication();
        },
        error: () => {
          this.error = 'Company could not be created.';
          this.saving = false;
        },
      });
      return;
    }

    this.saveApplication();
  }

  label(value: string): string {
    return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
  }

  private saveApplication(): void {
    const raw = this.form.getRawValue();
    const request = {
      companyId: raw.companyId,
      position: raw.position,
      jobDescription: raw.jobDescription,
      employmentType: raw.employmentType,
      workArrangement: raw.workArrangement || null,
      location: raw.location,
      salaryExpectation: raw.salaryExpectation,
      applicationDate: raw.applicationDate,
      jobPostingUrl: raw.jobPostingUrl,
      resumeId: raw.resumeId || null,
      status: raw.status,
      processStage: raw.status === 'IN_PROCESS' ? raw.processStage || null : null,
      personalNotes: raw.personalNotes,
    };
    const operation = this.id ? this.service.update(this.id, request) : this.service.create(request);
    operation.subscribe({
      next: item => this.router.navigate(['/applications', item.id]),
      error: () => { this.error = 'Application could not be saved.'; this.saving = false; },
    });
  }

  private syncCompanyValidators(): void {
    const companyId = this.form.controls.companyId;
    const newCompanyName = this.form.controls.newCompanyName;
    if (this.companyMode === 'existing') {
      companyId.setValidators([Validators.required]);
      newCompanyName.clearValidators();
      newCompanyName.setValue(newCompanyName.value, { emitEvent: false });
    } else {
      companyId.clearValidators();
      companyId.setValue('', { emitEvent: false });
      newCompanyName.setValidators([Validators.required, Validators.maxLength(200)]);
    }
    companyId.updateValueAndValidity({ emitEvent: false });
    newCompanyName.updateValueAndValidity({ emitEvent: false });
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
