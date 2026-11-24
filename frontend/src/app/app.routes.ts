import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';
import { AppLayoutComponent } from './layout/app-layout/app-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login-page.component').then((m) => m.LoginPageComponent),
    canActivate: [guestGuard],
    title: 'Sign in · HanapTracker',
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register-page.component').then((m) => m.RegisterPageComponent),
    canActivate: [guestGuard],
    title: 'Create account · HanapTracker',
  },
  {
    path: 'check-email',
    loadComponent: () => import('./features/auth/check-email-page.component').then((m) => m.CheckEmailPageComponent),
    canActivate: [guestGuard],
    title: 'Verify email · HanapTracker',
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password-page.component').then((m) => m.ForgotPasswordPageComponent),
    canActivate: [guestGuard],
    title: 'Forgot password · HanapTracker',
  },
  {
    path: 'reset-password/:token',
    loadComponent: () =>
      import('./features/auth/reset-password-page.component').then((m) => m.ResetPasswordPageComponent),
    canActivate: [guestGuard],
    title: 'Reset password · HanapTracker',
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password-page.component').then((m) => m.ResetPasswordPageComponent),
    canActivate: [guestGuard],
    title: 'Reset password · HanapTracker',
  },
  {
    path: 'v/:token',
    loadComponent: () =>
      import('./features/auth/verify-email-page.component').then((m) => m.VerifyEmailPageComponent),
    title: 'Verify email · HanapTracker',
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./features/auth/verify-email-page.component').then((m) => m.VerifyEmailPageComponent),
    title: 'Verify email · HanapTracker',
  },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard-page.component').then((m) => m.DashboardPageComponent),
        title: 'Dashboard · HanapTracker',
      },
      {
        path: 'applications',
        loadComponent: () =>
          import('./features/applications/application-list-page.component').then(
            (m) => m.ApplicationListPageComponent
          ),
        title: 'Applications · HanapTracker',
      },
      {
        path: 'applications/new',
        loadComponent: () =>
          import('./features/applications/application-form-page.component').then(
            (m) => m.ApplicationFormPageComponent
          ),
        title: 'Add application · HanapTracker',
      },
      {
        path: 'applications/board',
        loadComponent: () =>
          import('./features/applications/application-board-page.component').then(
            (m) => m.ApplicationBoardPageComponent
          ),
        title: 'Kanban board · HanapTracker',
      },
      {
        path: 'applications/:id/edit',
        loadComponent: () =>
          import('./features/applications/application-form-page.component').then(
            (m) => m.ApplicationFormPageComponent
          ),
        title: 'Edit application · HanapTracker',
      },
      {
        path: 'applications/:id',
        loadComponent: () =>
          import('./features/applications/application-detail-page.component').then(
            (m) => m.ApplicationDetailPageComponent
          ),
        title: 'Application · HanapTracker',
      },
      {
        path: 'companies',
        loadComponent: () =>
          import('./features/companies/company-page.component').then((m) => m.CompanyPageComponent),
        title: 'Companies · HanapTracker',
      },
      {
        path: 'resumes',
        loadComponent: () =>
          import('./features/resumes/resume-page.component').then((m) => m.ResumePageComponent),
        title: 'Resumes · HanapTracker',
      },
      {
        path: 'interviews',
        loadComponent: () =>
          import('./features/interviews/interview-page.component').then((m) => m.InterviewPageComponent),
        title: 'Interviews · HanapTracker',
      },
      {
        path: 'assessments',
        loadComponent: () =>
          import('./features/assessments/assessment-page.component').then((m) => m.AssessmentPageComponent),
        title: 'Assessments · HanapTracker',
      },
      {
        path: 'reminders',
        loadComponent: () =>
          import('./features/reminders/reminder-page.component').then((m) => m.ReminderPageComponent),
        title: 'Reminders · HanapTracker',
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings-page.component').then((m) => m.SettingsPageComponent),
        title: 'Settings · HanapTracker',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
