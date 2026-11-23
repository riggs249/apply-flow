import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, RouterLink],
  template: `
    <main class="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <div
        class="absolute inset-0 z-0 bg-[radial-gradient(ellipse_70%_55%_at_15%_20%,rgba(15,118,110,.22),transparent_55%),radial-gradient(ellipse_60%_50%_at_90%_80%,rgba(13,148,136,.18),transparent_50%),linear-gradient(160deg,#141b24_0%,#1a2e2c_45%,#0f766e_160%)] after:absolute after:inset-0 after:bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] after:bg-size-[48px_48px] after:opacity-50 after:content-['']"
        aria-hidden="true"
      ></div>
      <section class="auth-card relative z-[1] w-full max-w-[400px] rounded-2xl border border-[rgba(255,255,255,.12)] bg-af-surface p-9 shadow-[0_18px_40px_rgba(10,20,24,.28)]">
        <div class="flex flex-col gap-[.35rem]">
          <div class="flex items-center gap-[.55rem] text-[1.35rem] font-[750] tracking-[-.04em] text-af-text">
            <span class="flex size-[2.1rem] items-center justify-center rounded-lg bg-af-accent text-[.95rem] font-bold text-white">H</span>
            <strong>Hanap<span class="text-af-accent">Tracker</span></strong>
          </div>
          <p class="m-0 text-[.68rem] leading-snug text-af-text-muted">Hiring and Application Navigation and Activity Platform</p>
        </div>
        <div class="mb-7 mt-[2.8rem]">
          <p class="m-0 mb-[.45rem] text-[.72rem] font-bold uppercase tracking-[.1em] text-af-accent">Get started</p>
          <h1 class="m-0 text-[1.65rem] font-[750] tracking-[-.04em] text-af-text">Create your account</h1>
          <p class="m-0 mt-[.55rem] text-[.86rem] text-af-text-muted">We’ll email you a verification link before you can sign in.</p>
        </div>
        @if (error) {
          <div class="mb-4 rounded-af-sm border border-af-danger-border bg-af-danger-soft p-[.7rem] text-left text-[.78rem] text-af-danger">{{ error }}</div>
        }
        <form class="flex flex-col gap-2" [formGroup]="form" (ngSubmit)="submit()">
          <label class="mt-[.55rem]" for="displayName">Display name</label>
          <input class="!px-[.8rem] !py-3 !text-[.84rem]" id="displayName" type="text" formControlName="displayName" autocomplete="name" placeholder="Alex Morgan" />
          @if (form.controls.displayName.touched && form.controls.displayName.invalid) { <small class="!text-[.72rem]">Enter your name.</small> }

          <label class="mt-[.55rem]" for="email">Email address</label>
          <input class="!px-[.8rem] !py-3 !text-[.84rem]" id="email" type="email" formControlName="email" autocomplete="email" placeholder="you@example.com" />
          @if (form.controls.email.touched && form.controls.email.invalid) { <small class="!text-[.72rem]">Enter a valid email address.</small> }

          <label class="mt-[.55rem]" for="password">Password</label>
          <input class="!px-[.8rem] !py-3 !text-[.84rem]" id="password" type="password" formControlName="password" autocomplete="new-password" placeholder="At least 8 characters" />
          @if (form.controls.password.touched && form.controls.password.invalid) { <small class="!text-[.72rem]">Password must be at least 8 characters.</small> }

          <button type="submit" class="primary-button mt-4 w-full justify-center !p-[.78rem]" [disabled]="loading">
            {{ loading ? 'Creating account…' : 'Create account' }} <mat-icon>arrow_forward</mat-icon>
          </button>
        </form>
        <p class="m-0 mt-5 text-center text-[.78rem] text-af-text-muted">
          Already have an account?
          <a class="font-semibold text-af-accent no-underline" routerLink="/login">Sign in</a>
        </p>
      </section>
    </main>
  `,
})
export class RegisterPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.formBuilder.nonNullable.group({
    displayName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });
  loading = false;
  error = '';

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const value = this.form.getRawValue();
    this.auth.register(value.email, value.password, value.displayName).pipe(
      finalize(() => { this.loading = false; }),
    ).subscribe({
      next: response => void this.router.navigate(['/check-email'], { queryParams: { email: response.email } }),
      error: err => {
        this.error = err?.error?.message || 'Unable to create your account. Please try again.';
      },
    });
  }
}
