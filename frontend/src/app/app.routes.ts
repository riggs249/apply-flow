import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';
import { AppLayoutComponent } from './layout/app-layout/app-layout.component';
import { DashboardPageComponent } from './features/dashboard/dashboard-page.component';
import { LoginPageComponent } from './features/auth/login-page.component';
import { RegisterPageComponent } from './features/auth/register-page.component';
import { CheckEmailPageComponent } from './features/auth/check-email-page.component';
import { VerifyEmailPageComponent } from './features/auth/verify-email-page.component';
import { ApplicationListPageComponent } from './features/applications/application-list-page.component';
import { ApplicationFormPageComponent } from './features/applications/application-form-page.component';
import { ApplicationDetailPageComponent } from './features/applications/application-detail-page.component';
import { ApplicationBoardPageComponent } from './features/applications/application-board-page.component';
import { InterviewPageComponent } from './features/interviews/interview-page.component';
import { AssessmentPageComponent } from './features/assessments/assessment-page.component';
import { ReminderPageComponent } from './features/reminders/reminder-page.component';
import { CompanyPageComponent } from './features/companies/company-page.component';
import { ResumePageComponent } from './features/resumes/resume-page.component';
import { SettingsPageComponent } from './features/settings/settings-page.component';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent, canActivate: [guestGuard], title: 'Sign in · HanapTracker' },
  { path: 'register', component: RegisterPageComponent, canActivate: [guestGuard], title: 'Create account · HanapTracker' },
  { path: 'check-email', component: CheckEmailPageComponent, canActivate: [guestGuard], title: 'Verify email · HanapTracker' },
  { path: 'v/:token', component: VerifyEmailPageComponent, title: 'Verify email · HanapTracker' },
  { path: 'verify-email', component: VerifyEmailPageComponent, title: 'Verify email · HanapTracker' },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardPageComponent, title: 'Dashboard · HanapTracker' },
      { path: 'applications', component: ApplicationListPageComponent, title: 'Applications · HanapTracker' },
      { path: 'applications/new', component: ApplicationFormPageComponent, title: 'Add application · HanapTracker' },
      { path: 'applications/board', component: ApplicationBoardPageComponent, title: 'Kanban board · HanapTracker' },
      { path: 'applications/:id/edit', component: ApplicationFormPageComponent, title: 'Edit application · HanapTracker' },
      { path: 'applications/:id', component: ApplicationDetailPageComponent, title: 'Application · HanapTracker' },
      { path: 'companies', component: CompanyPageComponent, title: 'Companies · HanapTracker' },
      { path: 'resumes', component: ResumePageComponent, title: 'Resumes · HanapTracker' },
      { path: 'interviews', component: InterviewPageComponent, title: 'Interviews · HanapTracker' },
      { path: 'assessments', component: AssessmentPageComponent, title: 'Assessments · HanapTracker' },
      { path: 'reminders', component: ReminderPageComponent, title: 'Reminders · HanapTracker' },
      { path: 'settings', component: SettingsPageComponent, title: 'Settings · HanapTracker' },
    ],
  },
  { path: '**', redirectTo: '' },
];
