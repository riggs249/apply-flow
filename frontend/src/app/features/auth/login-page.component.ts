import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule],
  template: `
    <main class="auth-page">
      <div class="auth-atmosphere" aria-hidden="true"></div>
      <section class="auth-card">
        <div class="brand"><span class="brand-mark">A</span><strong>Apply<span>Flow</span></strong></div>
        <div class="intro">
          <p class="eyebrow">Welcome back</p>
          <h1>Sign in to your workspace</h1>
          <p>Keep your job search moving forward.</p>
        </div>
        @if (error) { <div class="error">{{ error }}</div> }
        <form [formGroup]="form" (ngSubmit)="submit()">
          <label for="email">Email address</label>
          <input id="email" type="email" formControlName="email" autocomplete="email" placeholder="you@example.com" />
          @if (form.controls.email.touched && form.controls.email.invalid) { <small>Enter a valid email address.</small> }
          <label for="password">Password</label>
          <input id="password" type="password" formControlName="password" autocomplete="current-password" placeholder="Your password" />
          @if (form.controls.password.touched && form.controls.password.invalid) { <small>Password is required.</small> }
          <button type="submit" class="primary-button submit" [disabled]="loading">
            {{ loading ? 'Signing in…' : 'Continue' }} <mat-icon>arrow_forward</mat-icon>
          </button>
        </form>
      </section>
    </main>
  `,
  styles: [`
    .auth-page {
      align-items: center;
      display: flex;
      justify-content: center;
      min-height: 100vh;
      padding: 1.5rem;
      position: relative;
      overflow: hidden;
    }
    .auth-atmosphere {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 70% 55% at 15% 20%, rgba(15, 118, 110, .22), transparent 55%),
        radial-gradient(ellipse 60% 50% at 90% 80%, rgba(13, 148, 136, .18), transparent 50%),
        linear-gradient(160deg, #141b24 0%, #1a2e2c 45%, #0f766e 160%);
      z-index: 0;
    }
    .auth-atmosphere::after {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
      background-size: 48px 48px;
      opacity: .5;
    }
    .auth-card {
      background: var(--af-surface);
      border: 1px solid rgba(255, 255, 255, .12);
      border-radius: 16px;
      box-shadow: 0 18px 40px rgba(10, 20, 24, .28);
      max-width: 400px;
      padding: 2.25rem;
      position: relative;
      width: 100%;
      z-index: 1;
    }
    .brand {
      align-items: center;
      color: var(--af-text);
      display: flex;
      font-size: 1.35rem;
      font-weight: 750;
      gap: .55rem;
      letter-spacing: -.04em;
    }
    .brand span:last-child span { color: var(--af-accent); }
    .brand-mark {
      align-items: center;
      background: var(--af-accent);
      border-radius: 8px;
      color: #fff;
      display: flex;
      font-size: .95rem;
      font-weight: 700;
      height: 2.1rem;
      justify-content: center;
      width: 2.1rem;
    }
    .intro { margin: 2.8rem 0 1.75rem; }
    .eyebrow {
      color: var(--af-accent);
      font-size: .72rem;
      font-weight: 700;
      letter-spacing: .1em;
      margin: 0 0 .45rem;
      text-transform: uppercase;
    }
    h1 {
      color: var(--af-text);
      font-size: 1.65rem;
      font-weight: 750;
      letter-spacing: -.04em;
      margin: 0;
    }
    .intro p:last-child {
      color: var(--af-text-muted);
      font-size: .86rem;
      margin: .55rem 0 0;
    }
    form { display: flex; flex-direction: column; gap: .5rem; }
    label {
      color: var(--af-text-secondary);
      font-size: .78rem;
      font-weight: 650;
      margin-top: .55rem;
    }
    input {
      border: 1px solid var(--af-border);
      border-radius: var(--af-radius-sm);
      box-sizing: border-box;
      color: var(--af-text);
      font: inherit;
      font-size: .84rem;
      outline: 0;
      padding: .75rem .8rem;
      width: 100%;
    }
    input:focus {
      border-color: var(--af-accent);
      box-shadow: 0 0 0 3px var(--af-accent-soft);
    }
    small { color: var(--af-danger); font-size: .72rem; }
    .submit {
      justify-content: center;
      margin-top: 1rem;
      padding: .78rem;
      width: 100%;
    }
    .error {
      background: var(--af-danger-soft);
      border: 1px solid var(--af-danger-border);
      border-radius: var(--af-radius-sm);
      color: var(--af-danger);
      font-size: .78rem;
      padding: .7rem;
    }
  `],
})
export class LoginPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  loading = false;
  error = '';

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.auth.login(this.form.controls.email.value, this.form.controls.password.value).pipe(
      finalize(() => { this.loading = false; }),
    ).subscribe({
      next: () => void this.router.navigateByUrl('/applications'),
      error: () => { this.error = 'Unable to sign in. Check your credentials and try again.'; },
    });
  }
}
