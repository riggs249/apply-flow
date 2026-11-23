import { Component, OnInit, inject, input } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-verify-status',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <mat-icon class="!mx-auto !mb-3 !block !size-10 !text-[40px] text-af-accent">{{ icon() }}</mat-icon>
    <h1 class="m-0 text-[1.35rem] font-[750] tracking-[-.03em] text-af-text">{{ title() }}</h1>
    <p class="m-0 mt-2 text-[.86rem] leading-relaxed text-af-text-muted">{{ message() }}</p>
  `,
})
export class VerifyStatusComponent {
  readonly icon = input('info');
  readonly title = input('');
  readonly message = input('');
}

@Component({
  selector: 'app-verify-email-page',
  standalone: true,
  imports: [MatIconModule, RouterLink, VerifyStatusComponent],
  template: `
    <main class="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <div
        class="absolute inset-0 z-0 bg-[radial-gradient(ellipse_70%_55%_at_15%_20%,rgba(15,118,110,.22),transparent_55%),radial-gradient(ellipse_60%_50%_at_90%_80%,rgba(13,148,136,.18),transparent_50%),linear-gradient(160deg,#141b24_0%,#1a2e2c_45%,#0f766e_160%)] after:absolute after:inset-0 after:bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] after:bg-size-[48px_48px] after:opacity-50 after:content-['']"
        aria-hidden="true"
      ></div>
      <section class="auth-card relative z-[1] w-full max-w-[420px] rounded-2xl border border-[rgba(255,255,255,.12)] bg-af-surface p-9 text-center shadow-[0_18px_40px_rgba(10,20,24,.28)]">
        <div class="mb-6 flex flex-col items-center gap-[.35rem]">
          <div class="flex items-center justify-center gap-[.55rem] text-[1.35rem] font-[750] tracking-[-.04em] text-af-text">
            <span class="flex size-[2.1rem] items-center justify-center rounded-lg bg-af-accent text-[.95rem] font-bold text-white">H</span>
            <strong>Hanap<span class="text-af-accent">Tracker</span></strong>
          </div>
          <p class="m-0 max-w-[22rem] text-center text-[.68rem] leading-snug text-af-text-muted">Hiring and Application Navigation and Activity Platform</p>
        </div>
        @if (status === 'loading') {
          <app-verify-status icon="hourglass_top" title="Verifying your email…" message="One moment while we activate your account." />
        } @else if (status === 'success') {
          <app-verify-status icon="verified" title="Email verified" message="You're signed in. Redirecting to your workspace…" />
        } @else {
          <app-verify-status icon="error_outline" title="Verification failed" [message]="error" />
          <div class="mt-5 flex flex-col gap-2">
            <a class="primary-button justify-center" routerLink="/check-email">Resend verification</a>
            <a class="secondary-button justify-center" routerLink="/login">Back to sign in</a>
          </div>
        }
      </section>
    </main>
  `,
})
export class VerifyEmailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  status: 'loading' | 'success' | 'error' = 'loading';
  error = 'This verification link is invalid or has expired.';

  ngOnInit(): void {
    const token =
      this.route.snapshot.paramMap.get('token')?.trim()
      || this.route.snapshot.queryParamMap.get('token')?.trim()
      || '';
    if (!token) {
      this.status = 'error';
      this.error = 'Missing verification token. Open the link from your email again.';
      return;
    }
    this.auth.verifyEmail(token).subscribe({
      next: () => {
        this.status = 'success';
        setTimeout(() => void this.router.navigateByUrl('/dashboard'), 900);
      },
      error: err => {
        this.status = 'error';
        this.error = err?.error?.message || 'This verification link is invalid or has expired.';
      },
    });
  }
}
