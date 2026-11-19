import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApplicationService } from './application.service';
import { ApplicationFormPageComponent } from './application-form-page.component';
import { ResumeService } from '../resumes/resume.service';
import { CompanyService } from '../companies/company.service';

describe('ApplicationFormPageComponent', () => {
  let fixture: ComponentFixture<ApplicationFormPageComponent>;
  let component: ApplicationFormPageComponent;
  let service: jasmine.SpyObj<ApplicationService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<ApplicationService>('ApplicationService', [
      'companies',
      'create',
      'update',
      'get',
      'parseJobPosting',
    ]);
    service.companies.and.returnValue(of({
      content: [],
      page: 0,
      size: 100,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    }));
    const resumeService = jasmine.createSpyObj<ResumeService>('ResumeService', ['list']);
    resumeService.list.and.returnValue(of([]));
    const companyService = jasmine.createSpyObj<CompanyService>('CompanyService', ['create']);

    await TestBed.configureTestingModule({
      imports: [ApplicationFormPageComponent],
      providers: [
        provideAnimationsAsync(),
        provideRouter([]),
        { provide: ApplicationService, useValue: service },
        { provide: ResumeService, useValue: resumeService },
        { provide: CompanyService, useValue: companyService },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ApplicationFormPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('requires a company and position', () => {
    component.setCompanyMode('existing');
    component.form.patchValue({
      companyId: '',
      position: '',
      jobDescription: '',
      employmentType: 'FULL_TIME',
      workArrangement: '',
      location: '',
      salaryExpectation: null,
      applicationDate: '',
      jobPostingUrl: '',
      resumeId: '',
      status: 'APPLIED',
      processStage: '',
      personalNotes: '',
    });

    component.submit();

    expect(component.form.controls.companyId.invalid).toBeTrue();
    expect(component.form.controls.position.invalid).toBeTrue();
    expect(service.create).not.toHaveBeenCalled();
  });

  it('defaults to create-new company when none exist', () => {
    expect(component.companyMode).toBe('new');
  });
});
