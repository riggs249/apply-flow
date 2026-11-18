import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ApplicationService } from '../applications/application.service';
import { ApplicationRecord } from '../applications/application.models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ReminderRecord, ReminderType } from './reminder.models';
import { ReminderService } from './reminder.service';

@Component({
  selector: 'app-reminder-page',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, PageHeaderComponent, DatePipe],
  template: `
    <app-page-header title="Reminders" description="Keep follow-ups and deadlines from slipping through the cracks.">
      <button class="primary-button" type="button" (click)="openCreate()"><mat-icon>add</mat-icon> Add reminder</button>
    </app-page-header>
    @if (error) { <div class="error">{{ error }}</div> }
    @if (showForm) {
      <form class="form-card" [formGroup]="form" (ngSubmit)="submit()">
        <h2>{{ editingId ? 'Edit reminder' : 'Add reminder' }}</h2>
        <div class="fields two">
          <label>Title<input formControlName="title" placeholder="Follow up with recruiter" /></label>
          <label>Remind at<input type="datetime-local" formControlName="remindAt" /></label>
        </div>
        <div class="fields two">
          <label>Type<select formControlName="reminderType">@for (item of types; track item) { <option [value]="item">{{ label(item) }}</option> }</select></label>
          <label>Application (optional)<select formControlName="applicationId"><option value="">No application</option>@for (item of applications; track item.id) { <option [value]="item.id">{{ item.companyName }} — {{ item.position }}</option> }</select></label>
        </div>
        <label>Description<textarea rows="3" formControlName="description"></textarea></label>
        <div class="actions"><button class="secondary-button" type="button" (click)="closeForm()">Cancel</button><button class="primary-button" type="submit" [disabled]="saving">{{ saving ? 'Saving…' : 'Save reminder' }}</button></div>
      </form>
    }
    @if (loading) { <div class="state">Loading reminders…</div> } @else {
      @for (group of groups; track group.key) {
        @if (group.items.length) {
          <section class="group"><div class="group-heading"><h2>{{ group.title }}</h2><span>{{ group.items.length }}</span></div>
            <div class="reminder-grid">@for (item of group.items; track item.id) {
              <article class="card" [class.completed]="item.timingState === 'COMPLETED'" [class.overdue]="item.timingState === 'OVERDUE'">
                <div class="card-head"><span class="type">{{ label(item.reminderType) }}</span><span class="timing">{{ label(item.timingState) }}</span></div>
                <strong>{{ item.title }}</strong>
                @if (item.companyName) { <small>{{ item.companyName }} · {{ item.applicationPosition }}</small> }
                @if (item.description) { <p>{{ item.description }}</p> }
                <time><mat-icon>schedule</mat-icon>{{ item.remindAt | date:'MMM d, y, h:mm a' }}</time>
                <footer>
                  @if (item.timingState === 'COMPLETED') { <button class="text-button" type="button" (click)="reopen(item)">Reopen</button> }
                  @else { <button class="text-button" type="button" (click)="complete(item)">Complete</button> }
                  <button class="text-button" type="button" (click)="edit(item)">Edit</button>
                  <button class="danger-text" type="button" (click)="deleteReminder(item)">Delete</button>
                </footer>
              </article>
            }</div>
          </section>
        }
      }
    }
  `,
  styles: [`
    .form-card { margin-bottom: 1.25rem; }
    .form-card h2 { margin: 0 0 1.25rem; }
    .form-card label { margin-bottom: 1rem; }
    .actions {
      border-top: 1px solid var(--af-divider);
      display: flex;
      gap: .65rem;
      justify-content: flex-end;
      padding-top: 1rem;
    }
    .group { margin-bottom: 1.25rem; }
    .group-heading { align-items: center; display: flex; gap: .5rem; margin: .5rem 0 .65rem; }
    .group-heading h2 { color: var(--af-text-secondary); font-size: .88rem; margin: 0; }
    .group-heading span {
      background: var(--af-border-soft);
      border-radius: 6px;
      color: var(--af-text-muted);
      font-size: .68rem;
      padding: .2rem .45rem;
    }
    .reminder-grid { display: grid; gap: .8rem; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
    .card {
      background: var(--af-surface);
      border: 1px solid var(--af-border);
      border-radius: var(--af-radius-lg);
      box-shadow: var(--af-shadow);
      padding: 1rem;
    }
    .card.overdue { border-left: 3px solid var(--af-danger); }
    .card.completed { opacity: .72; }
    .card-head { display: flex; justify-content: space-between; margin-bottom: .65rem; }
    .type, .timing { font-size: .65rem; font-weight: 700; }
    .type { color: var(--af-accent); }
    .timing { color: var(--af-text-muted); }
    .overdue .timing { color: var(--af-danger); }
    .card > strong, .card > small { display: block; }
    .card > strong { color: var(--af-text); font-size: .86rem; }
    .card > small { color: var(--af-text-faint); font-size: .72rem; margin-top: .25rem; }
    .card p { color: var(--af-text-muted); font-size: .75rem; line-height: 1.5; }
    .card time {
      align-items: center;
      color: var(--af-text-muted);
      display: flex;
      font-size: .72rem;
      gap: .35rem;
    }
    .card time mat-icon { font-size: 17px; height: 17px; width: 17px; }
    .card footer {
      border-top: 1px solid var(--af-divider);
      display: flex;
      gap: .7rem;
      justify-content: flex-end;
      margin-top: .8rem;
      padding-top: .7rem;
    }
  `],
})
export class ReminderPageComponent implements OnInit {
  private readonly reminderApi = inject(ReminderService);
  private readonly applicationsApi = inject(ApplicationService);
  private readonly fb = inject(FormBuilder);
  readonly types: ReminderType[] = ['RECRUITER_FOLLOW_UP', 'UPCOMING_INTERVIEW', 'ASSESSMENT_DEADLINE', 'APPLICATION_DEADLINE', 'CUSTOM'];
  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required], remindAt: ['', Validators.required],
    reminderType: 'CUSTOM' as ReminderType, applicationId: '', description: '',
  });
  reminders: ReminderRecord[] = [];
  applications: ApplicationRecord[] = [];
  loading = true;
  saving = false;
  showForm = false;
  editingId?: string;
  error = '';
  groups: { key: string; title: string; items: ReminderRecord[] }[] = [];

  ngOnInit(): void {
    this.load();
    this.applicationsApi.list({ page: 0, size: 100 }).subscribe({
      next: page => this.applications = page.content,
      error: () => this.error = 'Applications could not be loaded.',
    });
  }

  load(): void {
    this.loading = true;
    this.reminderApi.list().subscribe({
      next: items => {
        this.reminders = items;
        this.groups = [
          { key: 'overdue', title: 'Overdue', items: items.filter(item => item.timingState === 'OVERDUE') },
          { key: 'upcoming', title: 'Upcoming', items: items.filter(item => item.timingState === 'UPCOMING') },
          { key: 'completed', title: 'Completed', items: items.filter(item => item.timingState === 'COMPLETED') },
        ];
        this.loading = false;
      },
      error: () => { this.error = 'Reminders could not be loaded.'; this.loading = false; },
    });
  }

  openCreate(): void {
    this.editingId = undefined;
    this.form.reset({ title: '', remindAt: '', reminderType: 'CUSTOM', applicationId: '', description: '' });
    this.showForm = true;
  }

  edit(item: ReminderRecord): void {
    this.editingId = item.id;
    this.form.patchValue({ title: item.title, remindAt: this.toLocalDateTime(item.remindAt), reminderType: item.reminderType, applicationId: item.applicationId ?? '', description: item.description ?? '' });
    this.showForm = true;
  }

  closeForm(): void { this.showForm = false; this.editingId = undefined; }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving = true;
    const raw = this.form.getRawValue();
    const value = { ...raw, applicationId: raw.applicationId || null, remindAt: new Date(raw.remindAt).toISOString() };
    const operation = this.editingId ? this.reminderApi.update(this.editingId, value) : this.reminderApi.create(value);
    operation.subscribe({ next: () => { this.saving = false; this.closeForm(); this.load(); }, error: () => { this.error = 'Reminder could not be saved.'; this.saving = false; } });
  }

  complete(item: ReminderRecord): void { this.reminderApi.complete(item.id).subscribe({ next: () => this.load(), error: () => this.error = 'Reminder could not be completed.' }); }
  reopen(item: ReminderRecord): void { this.reminderApi.reopen(item.id).subscribe({ next: () => this.load(), error: () => this.error = 'Reminder could not be reopened.' }); }
  deleteReminder(item: ReminderRecord): void { if (!confirm(`Delete the reminder "${item.title}"?`)) return; this.reminderApi.delete(item.id).subscribe({ next: () => this.load(), error: () => this.error = 'Reminder could not be deleted.' }); }

  toLocalDateTime(value: string): string {
    const date = new Date(value);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  label(value: string): string { return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase()); }
}
