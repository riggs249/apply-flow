import { Component, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
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

    <section class="grid grid-cols-2 items-stretch gap-3 max-[800px]:grid-cols-1">
      <article class="panel flex h-full flex-col !p-4">
        <div class="panel-heading mb-3">
          <div>
            <h2>Profile</h2>
            <p>How your name appears across HanapTracker.</p>
          </div>
        </div>
        <div class="mb-3 flex items-center gap-2.5">
          <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-af-accent-soft text-[.72rem] font-bold text-af-accent">{{ user()?.initials || 'U' }}</span>
          <div class="min-w-0">
            <strong class="block truncate text-[.84rem] text-af-text">{{ user()?.displayName || 'Signed in' }}</strong>
            <span class="mt-[.1rem] block truncate text-[.7rem] text-af-text-faint">{{ user()?.email || 'Email unavailable' }}</span>
          </div>
        </div>
        @if (profileError) {
          <div class="mb-2.5 rounded-af-sm border border-af-danger-border bg-af-danger-soft px-2.5 py-2 text-[.74rem] text-af-danger">{{ profileError }}</div>
        }
        <form class="flex flex-1 flex-col gap-2.5" [formGroup]="profileForm" (ngSubmit)="saveProfile()">
          <label class="!mb-0" for="displayName">Display name
            <input class="!px-2.5 !py-2 !text-[.8rem]" id="displayName" type="text" formControlName="displayName" autocomplete="name" maxlength="100" />
          </label>
          <label class="!mb-0" for="email">Email
            <input class="!px-2.5 !py-2 !text-[.8rem]" id="email" type="email" [value]="user()?.email || ''" disabled />
          </label>
          <button class="primary-button mt-auto self-start !px-3.5 !py-2 !text-[.78rem]" type="submit" [disabled]="profileForm.invalid || profileSaving || !profileForm.dirty">
            {{ profileSaved ? 'Saved' : (profileSaving ? 'Saving…' : 'Save profile') }}
          </button>
        </form>
      </article>

      <article class="panel flex h-full flex-col !p-4">
        <div class="panel-heading mb-3">
          <div>
            <h2>Security</h2>
            <p>At least 8 characters. Other sessions will be signed out.</p>
          </div>
        </div>
        @if (passwordError) {
          <div class="mb-2.5 rounded-af-sm border border-af-danger-border bg-af-danger-soft px-2.5 py-2 text-[.74rem] text-af-danger">{{ passwordError }}</div>
        }
        @if (passwordSaved) {
          <div class="mb-2.5 rounded-af-sm border border-af-border bg-af-accent-soft px-2.5 py-2 text-[.74rem] text-af-success-deep">Password updated.</div>
        }
        <form class="flex flex-1 flex-col justify-between gap-3" [formGroup]="passwordForm" (ngSubmit)="savePassword()">
          <div class="flex flex-col gap-3">
            <label class="!mb-0" for="currentPassword">Current password
              <input class="!px-2.5 !py-2 !text-[.8rem]" id="currentPassword" type="password" formControlName="currentPassword" autocomplete="current-password" />
            </label>
            <label class="!mb-0" for="newPassword">New password
              <input class="!px-2.5 !py-2 !text-[.8rem]" id="newPassword" type="password" formControlName="newPassword" autocomplete="new-password" />
            </label>
            <label class="!mb-0" for="confirmNewPassword">Confirm password
              <input class="!px-2.5 !py-2 !text-[.8rem]" id="confirmNewPassword" type="password" formControlName="confirmNewPassword" autocomplete="new-password" />
            </label>
            @if (passwordForm.controls.confirmNewPassword.touched && passwordForm.hasError('mismatch')) {
              <p class="m-0 text-[.72rem] text-af-danger">Passwords do not match.</p>
            }
          </div>
          <button class="primary-button self-start !px-3.5 !py-2 !text-[.78rem]" type="submit" [disabled]="passwordForm.invalid || passwordSaving">
            {{ passwordSaving ? 'Updating…' : 'Update password' }}
          </button>
        </form>
      </article>

      <article class="panel !p-4">
        <div class="panel-heading mb-3">
          <div>
            <h2>Email notifications</h2>
            <p>24h, 1h, and due emails. Verified email required.</p>
          </div>
        </div>
        @if (notificationError) {
          <div class="mb-2.5 rounded-af-sm border border-af-danger-border bg-af-danger-soft px-2.5 py-2 text-[.74rem] text-af-danger">{{ notificationError }}</div>
        }
        @if (notificationsLoading) {
          <p class="m-0 text-[.78rem] text-af-text-muted">Loading notification settings…</p>
        } @else {
          <form class="text-left" [formGroup]="notificationForm" (ngSubmit)="saveNotifications()">
            <div class="mb-3 grid grid-cols-2 gap-x-3 gap-y-0 max-[520px]:grid-cols-1">
              <app-notification-toggle-row
                [control]="reminderControl"
                title="Reminders"
                description="Follow-ups and deadlines"
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
            <button class="primary-button !px-3.5 !py-2 !text-[.78rem]" type="submit" [disabled]="notificationsSaving">
              {{ notificationsSaved ? 'Saved' : (notificationsSaving ? 'Saving…' : 'Save notifications') }}
            </button>
          </form>
        }
      </article>

      <article class="panel !p-4">
        <div class="panel-heading mb-3">
          <div>
            <h2>Preferences</h2>
            <p>Device settings and session controls.</p>
          </div>
        </div>
        <form class="mb-4" [formGroup]="form" (ngSubmit)="savePreferences()">
          <label class="!mb-2.5" for="pageSize">Applications page size
            <select class="!px-2.5 !py-2 !text-[.8rem]" id="pageSize" formControlName="pageSize">
              <option [ngValue]="10">10 per page</option>
              <option [ngValue]="20">20 per page</option>
              <option [ngValue]="50">50 per page</option>
            </select>
          </label>
          <button class="primary-button !px-3.5 !py-2 !text-[.78rem]" type="submit">
            {{ saved ? 'Saved' : 'Save preferences' }}
          </button>
        </form>
        <div class="border-t border-af-divider pt-3">
          <div class="flex flex-wrap gap-2">
            <a class="secondary-button !px-3 !py-2 !text-[.78rem]" routerLink="/companies">
              <mat-icon class="!size-[16px] !text-[16px]">business</mat-icon> Companies
            </a>
            <button class="danger-button !px-3 !py-2 !text-[.78rem]" type="button" (click)="logout()" [disabled]="loggingOut">
              <mat-icon class="!size-[16px] !text-[16px]">logout</mat-icon>
              {{ loggingOut ? 'Signing out…' : 'Sign out' }}
            </button>
          </div>
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
  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    confirmNewPassword: ['', Validators.required],
  }, { validators: passwordsMatchValidator });
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
  passwordSaving = false;
  passwordSaved = false;
  passwordError = '';
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

  savePassword(): void {
    this.passwordForm.markAllAsTouched();
    if (this.passwordForm.invalid) {
      return;
    }
    this.passwordSaving = true;
    this.passwordError = '';
    this.passwordSaved = false;
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.auth.changePassword(currentPassword, newPassword).pipe(
      finalize(() => { this.passwordSaving = false; }),
    ).subscribe({
      next: () => {
        this.passwordForm.reset({
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: '',
        });
        this.passwordSaved = true;
        setTimeout(() => { this.passwordSaved = false; }, 2000);
      },
      error: err => {
        this.passwordError = err?.error?.message || 'Could not update your password.';
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

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('newPassword')?.value;
  const confirm = group.get('confirmNewPassword')?.value;
  if (!password || !confirm) return null;
  return password === confirm ? null : { mismatch: true };
}
