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

    <section class="grid grid-cols-2 gap-4 max-[800px]:grid-cols-[1fr]">
      <article class="panel">
        <div class="panel-heading mb-[1.1rem]"><h2>Profile</h2><p>Signed-in account details from your session.</p></div>
        <div class="flex items-center gap-[.8rem]">
          <span class="flex size-10 items-center justify-center rounded-full bg-af-accent-soft text-[.75rem] font-bold text-af-accent">{{ user()?.initials || 'U' }}</span>
          <div>
            <strong class="block text-[.9rem] text-af-text">{{ user()?.displayName || 'Signed in' }}</strong>
            <small class="mt-[.2rem] block !text-[.75rem] !text-af-text-faint">{{ user()?.email || 'Email unavailable' }}</small>
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

      <article class="panel col-span-full max-[800px]:col-auto">
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
