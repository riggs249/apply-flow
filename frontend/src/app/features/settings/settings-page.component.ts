import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth/auth.service';
import { PreferencesService } from '../../core/preferences/preferences.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, PageHeaderComponent, RouterLink],
  template: `
    <app-page-header title="Settings" description="Manage your profile and application preferences." />

    <section class="settings-grid">
      <article class="panel">
        <div class="panel-heading"><h2>Profile</h2><p>Signed-in account details from your session.</p></div>
        <div class="profile-row">
          <span class="avatar">{{ user()?.initials || 'U' }}</span>
          <div>
            <strong>{{ user()?.displayName || 'Signed in' }}</strong>
            <small>{{ user()?.email || 'Email unavailable' }}</small>
          </div>
        </div>
        <p class="hint">Profile editing is not available from the API yet. Display name is derived from your email.</p>
      </article>

      <article class="panel">
        <div class="panel-heading"><h2>Preferences</h2><p>These settings stay on this device.</p></div>
        <form [formGroup]="form" (ngSubmit)="savePreferences()">
          <label for="pageSize">Applications page size
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
        <div class="panel-heading"><h2>Workspace</h2><p>Quick links and session controls.</p></div>
        <div class="actions">
          <a class="secondary-button" routerLink="/companies"><mat-icon>business</mat-icon> Manage companies</a>
          <button class="danger-button" type="button" (click)="logout()" [disabled]="loggingOut">
            <mat-icon>logout</mat-icon> {{ loggingOut ? 'Signing out…' : 'Sign out' }}
          </button>
        </div>
      </article>
    </section>
  `,
  styles: [`
    .settings-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .panel:last-child { grid-column: 1 / -1; }
    .panel-heading { margin-bottom: 1.1rem; }
    .profile-row { align-items: center; display: flex; gap: .8rem; }
    .avatar {
      align-items: center;
      background: var(--af-accent-soft);
      border-radius: 50%;
      color: var(--af-accent);
      display: flex;
      font-size: .75rem;
      font-weight: 700;
      height: 2.5rem;
      justify-content: center;
      width: 2.5rem;
    }
    .profile-row strong, .profile-row small { display: block; }
    .profile-row strong { color: var(--af-text); font-size: .9rem; }
    .profile-row small { color: var(--af-text-faint); font-size: .75rem; margin-top: .2rem; }
    .hint { color: var(--af-text-faint); font-size: .75rem; margin: 1rem 0 0; }
    label { margin-bottom: 1rem; }
    .actions { display: flex; flex-wrap: wrap; gap: .7rem; }
    .actions mat-icon { font-size: 18px; height: 18px; width: 18px; }
    @media (max-width: 800px) {
      .settings-grid { grid-template-columns: 1fr; }
      .panel:last-child { grid-column: auto; }
    }
  `],
})
export class SettingsPageComponent {
  private readonly auth = inject(AuthService);
  private readonly preferences = inject(PreferencesService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly user = this.auth.currentUser;
  readonly form = this.fb.nonNullable.group({
    pageSize: this.preferences.applicationsPageSize(),
  });
  saved = false;
  loggingOut = false;

  savePreferences(): void {
    this.preferences.setApplicationsPageSize(this.form.controls.pageSize.value);
    this.saved = true;
    setTimeout(() => { this.saved = false; }, 1500);
  }

  logout(): void {
    this.loggingOut = true;
    this.auth.logout().subscribe({
      next: () => void this.router.navigateByUrl('/login'),
      error: () => void this.router.navigateByUrl('/login'),
    });
  }
}
