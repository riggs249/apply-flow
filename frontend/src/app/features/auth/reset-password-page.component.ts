import { Component, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  if (!password || !confirm) return null;
  return password === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, RouterLink],
  template: `
    <main class="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <div
        class="absolute inset-0 z-0 bg-[radial-gradient(ellipse_70%_55%_at_15%_20%,rgba(15,118,110,.22),transparent_55%),radial-gradient(ellipse_60%_50%_at_90%_80%,rgba(13,148,136,.18),transparent_50%),linear-gradient(160deg,#141b24_0%,#1a2e2c_45%,#0f766e_160%)] after:absolute after:inset-0 after:bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] after:bg-size-[48px_48px] after:opacity-50 after:content-['']"
        aria-hidden="true"
      ></div>
      <section class="auth-card relative z-[1] w-full max-w-[400px] rounded-2xl border border-[rgba(255,255,255,.12)] bg-af-surface p-9 shadow-[0_18px_40px_rgba(10,20,24,.28)]">
        <div class="flex items-center gap-[.55rem] text-[1.35rem] font-[750] tracking-[-.04em] text-af-text">
          <span class="flex size-[2.1rem] items-center justify-center rounded-lg bg-af-accent text-[.95rem] font-bold text-white">H</span>
          <strong>Hanap<span class="text-af-accent">Tracker</span></strong>
        </div>
        <div class="mb-7 mt-[2.8rem]">
          <p class="m-0 mb-[.45rem] text-[.72rem] font-bold uppercase tracking-[.1em] text-af-accent">Account recovery</p>
          <h1 class="m-0 text-[1.65rem] font-[750] tracking-[-.04em] text-af-text">Choose a new password</h1>
          <p class="m-0 mt-[.55rem] text-[.86rem] text-af-text-muted">Use at least 8 characters. You’ll sign in again afterward.</p>
        </div>
        @if (error) {
          <div class="mb-4 rounded-af-sm border border-af-danger-border bg-af-danger-soft p-[.7rem] text-left text-[.78rem] text-af-danger">{{ error }}</div>
        }
        @if (message) {
          <div class="mb-4 rounded-af-sm border border-af-border bg-af-accent-soft p-[.7rem] text-left text-[.78rem] text-af-success-deep">{{ message }}</div>
          <a class="primary-button w-full justify-center" routerLink="/login">Sign in</a>
        } @else {
          <form class="flex flex-col gap-2" [formGroup]="form" (ngSubmit)="submit()">
            <label class="mt-[.55rem]" for="password">New password</label>
            <input class="!px-[.8rem] !py-3 !text-[.84rem]" id="password" type="password" formControlName="password" autocomplete="new-password" placeholder="At least 8 characters" />
            @if (form.controls.password.touched && form.controls.password.invalid) {
              <small class="!text-[.72rem]">Password must be at least 8 characters.</small>
            }
            <label class="mt-[.55rem]" for="confirmPassword">Confirm password</label>
            <input class="!px-[.8rem] !py-3 !text-[.84rem]" id="confirmPassword" type="password" formControlName="confirmPassword" autocomplete="new-password" placeholder="Repeat password" />
            @if (form.controls.confirmPassword.touched && form.hasError('mismatch')) {
              <small class="!text-[.72rem]">Passwords do not match.</small>
            }
            <button type="submit" class="primary-button mt-4 w-full justify-center !p-[.78rem]" [disabled]="loading || !token">
              {{ loading ? 'Updating…' : 'Update password' }} <mat-icon>lock_reset</mat-icon>
            </button>
          </form>
          <p class="m-0 mt-5 text-center text-[.78rem] text-af-text-muted">
            <a class="font-semibold text-af-accent no-underline" routerLink="/forgot-password">Request a new link</a>
          </p>
        }
      </section>
    </main>
  `,
})
export class ResetPasswordPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly form = this.formBuilder.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordsMatch });

  token = '';
  loading = false;
  error = '';
  message = '';

  ngOnInit(): void {
    this.token =
      this.route.snapshot.paramMap.get('token')?.trim()
      || this.route.snapshot.queryParamMap.get('token')?.trim()
      || '';
    if (!this.token) {
      this.error = 'Missing reset token. Open the link from your email again.';
    }
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.token) return;
    this.loading = true;
    this.error = '';
    this.auth.resetPassword(this.token, this.form.controls.password.value).pipe(
      finalize(() => { this.loading = false; }),
    ).subscribe({
      next: response => {
        this.message = response.message;
        setTimeout(() => void this.router.navigateByUrl('/login'), 1200);
      },
      error: err => {
        this.error = err?.error?.message || 'Unable to reset password. The link may have expired.';
      },
    });
  }
}
