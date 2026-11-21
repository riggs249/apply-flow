import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-check-email-page',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  template: `
    <main class="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <div
        class="absolute inset-0 z-0 bg-[radial-gradient(ellipse_70%_55%_at_15%_20%,rgba(15,118,110,.22),transparent_55%),radial-gradient(ellipse_60%_50%_at_90%_80%,rgba(13,148,136,.18),transparent_50%),linear-gradient(160deg,#141b24_0%,#1a2e2c_45%,#0f766e_160%)] after:absolute after:inset-0 after:bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] after:bg-size-[48px_48px] after:opacity-50 after:content-['']"
        aria-hidden="true"
      ></div>
      <section class="auth-card relative z-[1] w-full max-w-[420px] rounded-2xl border border-[rgba(255,255,255,.12)] bg-af-surface p-9 shadow-[0_18px_40px_rgba(10,20,24,.28)]">
        <div class="flex items-center gap-[.55rem] text-[1.35rem] font-[750] tracking-[-.04em] text-af-text">
          <span class="flex size-[2.1rem] items-center justify-center rounded-lg bg-af-accent text-[.95rem] font-bold text-white">H</span>
          <strong>Hanap<span class="text-af-accent">Tracker</span></strong>
        </div>
        <div class="mb-6 mt-[2.4rem]">
          <p class="m-0 mb-[.45rem] text-[.72rem] font-bold uppercase tracking-[.1em] text-af-accent">Verify email</p>
          <h1 class="m-0 text-[1.55rem] font-[750] tracking-[-.04em] text-af-text">Check your inbox</h1>
          <p class="m-0 mt-[.65rem] text-[.86rem] leading-relaxed text-af-text-muted">
            We sent a verification link
            @if (email) { to <strong class="text-af-text">{{ email }}</strong> }.
            Open it to activate your account, then sign in.
          </p>
        </div>
        @if (message) {
          <div class="mb-4 rounded-af-sm border border-af-border bg-af-accent-soft p-[.7rem] text-left text-[.78rem] text-af-success-deep">{{ message }}</div>
        }
        @if (error) {
          <div class="mb-4 rounded-af-sm border border-af-danger-border bg-af-danger-soft p-[.7rem] text-left text-[.78rem] text-af-danger">{{ error }}</div>
        }
        <button type="button" class="secondary-button w-full justify-center" (click)="resend()" [disabled]="!email || loading">
          <mat-icon>mail</mat-icon> {{ loading ? 'Sending…' : 'Resend verification email' }}
        </button>
        <p class="m-0 mt-5 text-center text-[.78rem] text-af-text-muted">
          Wrong email?
          <a class="font-semibold text-af-accent no-underline" routerLink="/register">Register again</a>
          ·
          <a class="font-semibold text-af-accent no-underline" routerLink="/login">Sign in</a>
        </p>
      </section>
    </main>
  `,
})
export class CheckEmailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);

  email = '';
  loading = false;
  message = '';
  error = '';

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') ?? '';
  }

  resend(): void {
    if (!this.email) return;
    this.loading = true;
    this.error = '';
    this.message = '';
    this.auth.resendVerification(this.email).pipe(
      finalize(() => { this.loading = false; }),
    ).subscribe({
      next: response => { this.message = response.message; },
      error: () => { this.error = 'Could not resend the verification email. Try again shortly.'; },
    });
  }
}
