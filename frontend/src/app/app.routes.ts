import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';
import { AppLayoutComponent } from './layout/app-layout/app-layout.component';
import { DashboardPageComponent } from './features/dashboard/dashboard-page.component';
import { LoginPageComponent } from './features/auth/login-page.component';
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
  { path: 'login', component: LoginPageComponent, canActivate: [guestGuard], title: 'Sign in · ApplyFlow' },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardPageComponent, title: 'Dashboard · ApplyFlow' },
      { path: 'applications', component: ApplicationListPageComponent, title: 'Applications · ApplyFlow' },
      { path: 'applications/new', component: ApplicationFormPageComponent, title: 'Add application · ApplyFlow' },
      { path: 'applications/board', component: ApplicationBoardPageComponent, title: 'Kanban board · ApplyFlow' },
      { path: 'applications/:id/edit', component: ApplicationFormPageComponent, title: 'Edit application · ApplyFlow' },
      { path: 'applications/:id', component: ApplicationDetailPageComponent, title: 'Application · ApplyFlow' },
      { path: 'companies', component: CompanyPageComponent, title: 'Companies · ApplyFlow' },
      { path: 'resumes', component: ResumePageComponent, title: 'Resumes · ApplyFlow' },
      { path: 'interviews', component: InterviewPageComponent, title: 'Interviews · ApplyFlow' },
      { path: 'assessments', component: AssessmentPageComponent, title: 'Assessments · ApplyFlow' },
      { path: 'reminders', component: ReminderPageComponent, title: 'Reminders · ApplyFlow' },
      { path: 'analytics', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'settings', component: SettingsPageComponent, title: 'Settings · ApplyFlow' },
    ],
  },
  { path: '**', redirectTo: '' },
];
