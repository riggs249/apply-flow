import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import { PreferencesService } from '../../core/preferences/preferences.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { NotificationSettingsService } from './notification-settings.service';
import { NotificationToggleRowComponent } from './notification-toggle-row.component';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    PageHeaderComponent,
    RouterLink,
    NotificationToggleRowComponent,
  ],
  template: `
    <app-page-header title="Settings" description="Manage your profile and application preferences." />

    <section class="grid grid-cols-2 gap-4 max-[800px]:grid-cols-[1fr]">
      <article class="panel">
        <div class="panel-heading mb-[1.1rem]"><h2>Profile</h2><p>Signed-in account details from your session.</p></div>
        <div class="flex items-center gap-[.8rem]">
          <span class="flex size-10 items-center justify-center rounded-full bg-af-accent-soft text-[.75rem] font-bold text-af-accent">{{ user()?.initials || 'U' }}</span>
          <div>
            <strong class="block text-[.9rem] text-af-text">{{ user()?.displayName || 'Signed in' }}</strong>
            <span class="mt-[.2rem] block text-[.75rem] text-af-text-faint">{{ user()?.email || 'Email unavailable' }}</span>
          </div>
        </div>
        <p class="m-0 mt-4 text-[.75rem] text-af-text-faint">Display name comes from your account. Profile editing is not available from the API yet.</p>
      </article>

      <article class="panel">
        <div class="panel-heading mb-[1.1rem]"><h2>Preferences</h2><p>These settings stay on this device.</p></div>
        <form [formGroup]="form" (ngSubmit)="savePreferences()">
          <label class="mb-4" for="pageSize">Applications page size
            <select id="pageSize" formControlName="pageSize">
              <option [ngValue]="10">10 per page</option>
              <option [ngValue]="20">20 per page</option>
              <option [ngValue]="50">50 per page</option>
            </select>
          </label>
          <button class="primary-button" type="submit">{{ saved ? 'Saved' : 'Save preferences' }}</button>
        </form>
      </article>

      <article class="panel">
        <div class="panel-heading mb-3">
          <div>
            <h2>Email notifications</h2>
            <p>24h, 1h, and due emails. Verified email required.</p>
          </div>
        </div>

        @if (notificationError) {
          <div class="mb-2 rounded-af-sm border border-af-danger-border bg-af-danger-soft px-2.5 py-2 text-[.74rem] text-af-danger">{{ notificationError }}</div>
        }

        @if (notificationsLoading) {
          <p class="m-0 text-[.78rem] text-af-text-muted">Loading notification settings…</p>
        } @else {
          <form class="text-left" [formGroup]="notificationForm" (ngSubmit)="saveNotifications()">
            <div class="mb-3 grid grid-cols-2 gap-x-4 gap-y-1 max-[520px]:grid-cols-1">
              <app-notification-toggle-row
                [control]="reminderControl"
                title="Reminders"
                description="Follow-ups and deadlines you create"
              />
              <app-notification-toggle-row
                [control]="interviewControl"
                title="Interviews"
                description="Scheduled + lead-up notices"
              />
              <app-notification-toggle-row
                [control]="assessmentControl"
                title="Assessments"
                description="Added + lead-up notices"
              />
              <app-notification-toggle-row
                [control]="outcomeControl"
                title="Outcomes"
                description="Hired or Rejected updates"
              />
            </div>
            <button class="primary-button" type="submit" [disabled]="notificationsSaving">
              {{ notificationsSaved ? 'Saved' : (notificationsSaving ? 'Saving…' : 'Save') }}
            </button>
          </form>
        }
      </article>

      <article class="panel">
        <div class="panel-heading mb-[1.1rem]"><h2>Workspace</h2><p>Quick links and session controls.</p></div>
        <div class="flex flex-wrap gap-[.7rem]">
          <a class="secondary-button" routerLink="/companies"><mat-icon>business</mat-icon> Manage companies</a>
          <button class="danger-button" type="button" (click)="logout()" [disabled]="loggingOut">
            <mat-icon class="!size-[18px] !text-[18px]">logout</mat-icon> {{ loggingOut ? 'Signing out…' : 'Sign out' }}
          </button>
        </div>
      </article>
    </section>
  `,
})
export class SettingsPageComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly preferences = inject(PreferencesService);
  private readonly notifications = inject(NotificationSettingsService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly user = this.auth.currentUser;
  readonly form = this.fb.nonNullable.group({
    pageSize: this.preferences.applicationsPageSize(),
  });
  readonly notificationForm = this.fb.nonNullable.group({
    reminderEmail: true,
    interviewEmail: true,
    assessmentEmail: true,
    outcomeEmail: true,
  });
  saved = false;
  loggingOut = false;
  notificationsLoading = true;
  notificationsSaving = false;
  notificationsSaved = false;
  notificationError = '';

  get reminderControl() {
    return this.notificationForm.controls.reminderEmail;
  }

  get interviewControl() {
    return this.notificationForm.controls.interviewEmail;
  }

  get assessmentControl() {
    return this.notificationForm.controls.assessmentEmail;
  }

  get outcomeControl() {
    return this.notificationForm.controls.outcomeEmail;
  }

  ngOnInit(): void {
    this.notifications.get().subscribe({
      next: settings => {
        this.notificationForm.setValue(settings);
        this.notificationsLoading = false;
      },
      error: () => {
        this.notificationError = 'Could not load email notification settings.';
        this.notificationsLoading = false;
      },
    });
  }

  savePreferences(): void {
    this.preferences.setApplicationsPageSize(this.form.controls.pageSize.value);
    this.saved = true;
    setTimeout(() => { this.saved = false; }, 1500);
  }

  saveNotifications(): void {
    this.notificationsSaving = true;
    this.notificationError = '';
    this.notifications.update(this.notificationForm.getRawValue()).pipe(
      finalize(() => { this.notificationsSaving = false; }),
    ).subscribe({
      next: settings => {
        this.notificationForm.setValue(settings);
        this.notificationsSaved = true;
        setTimeout(() => { this.notificationsSaved = false; }, 1500);
      },
      error: () => {
        this.notificationError = 'Could not save email notification settings.';
      },
    });
  }

  logout(): void {
    this.loggingOut = true;
    this.auth.logout().subscribe({
      next: () => void this.router.navigateByUrl('/login'),
      error: () => void this.router.navigateByUrl('/login'),
    });
  }
}
