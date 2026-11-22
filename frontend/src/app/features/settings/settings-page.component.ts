import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import { PreferencesService } from '../../core/preferences/preferences.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
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
        <div class="panel-heading mb-[1.1rem]"><h2>Profile</h2><p>Update how your name appears across HanapTracker.</p></div>
        <div class="mb-4 flex items-center gap-[.8rem]">
          <span class="flex size-10 items-center justify-center rounded-full bg-af-accent-soft text-[.75rem] font-bold text-af-accent">{{ user()?.initials || 'U' }}</span>
          <div class="min-w-0">
            <strong class="block truncate text-[.9rem] text-af-text">{{ user()?.displayName || 'Signed in' }}</strong>
            <span class="mt-[.2rem] block truncate text-[.75rem] text-af-text-faint">{{ user()?.email || 'Email unavailable' }}</span>
          </div>
        </div>
        @if (profileError) {
          <div class="mb-3 rounded-af-sm border border-af-danger-border bg-af-danger-soft p-[.7rem] text-[.78rem] text-af-danger">{{ profileError }}</div>
        }
        <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
          <label class="mb-3" for="displayName">Display name
            <input id="displayName" type="text" formControlName="displayName" autocomplete="name" maxlength="100" />
          </label>
          <label class="mb-4" for="email">Email
            <input id="email" type="email" [value]="user()?.email || ''" disabled />
          </label>
          <button class="primary-button" type="submit" [disabled]="profileForm.invalid || profileSaving || !profileForm.dirty">
            {{ profileSaved ? 'Saved' : (profileSaving ? 'Saving…' : 'Save profile') }}
          </button>
        </form>
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
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly user = this.auth.currentUser;
  readonly form = this.fb.nonNullable.group({
    pageSize: this.preferences.applicationsPageSize(),
  });
  readonly profileForm = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.maxLength(100)]],
  });
  readonly notificationForm = this.fb.nonNullable.group({
    reminderEmail: true,
    interviewEmail: true,
    assessmentEmail: true,
    outcomeEmail: true,
  });
  saved = false;
  loggingOut = false;
  profileSaving = false;
  profileSaved = false;
  profileError = '';
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
    this.profileForm.patchValue({ displayName: this.user()?.displayName ?? '' });
    this.auth.getProfile().subscribe({
      next: profile => {
        this.profileForm.reset({ displayName: profile.displayName });
      },
      error: () => {
        // Fall back to the session user if the profile endpoint is unavailable.
      },
    });
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

  saveProfile(): void {
    this.profileForm.markAllAsTouched();
    if (this.profileForm.invalid) {
      return;
    }
    this.profileSaving = true;
    this.profileError = '';
    this.auth.updateProfile(this.profileForm.controls.displayName.value.trim()).pipe(
      finalize(() => { this.profileSaving = false; }),
    ).subscribe({
      next: profile => {
        this.profileForm.reset({ displayName: profile.displayName });
        this.profileSaved = true;
        setTimeout(() => { this.profileSaved = false; }, 1500);
      },
      error: () => {
        this.profileError = 'Could not save your profile.';
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
    this.confirmDialog.confirm({
      title: 'Sign out',
      message: 'Are you sure you want to sign out of HanapTracker?',
      confirmLabel: 'Sign out',
      cancelLabel: 'Stay signed in',
    }).subscribe(confirmed => {
      if (!confirmed) {
        return;
      }
      this.loggingOut = true;
      this.auth.logout().subscribe({
        next: () => void this.router.navigateByUrl('/login'),
        error: () => void this.router.navigateByUrl('/login'),
      });
    });
  }
}
