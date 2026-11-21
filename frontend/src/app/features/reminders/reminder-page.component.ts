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
      <form class="form-card mb-5 [&_label]:mb-4" [formGroup]="form" (ngSubmit)="submit()">
        <h2 class="!mb-5">{{ editingId ? 'Edit reminder' : 'Add reminder' }}</h2>
        <div class="fields two">
          <label>Title<input formControlName="title" placeholder="Follow up with recruiter" /></label>
          <label>Remind at<input type="datetime-local" formControlName="remindAt" /></label>
        </div>
        <div class="fields two">
          <label>Type<select formControlName="reminderType">@for (item of types; track item) { <option [value]="item">{{ label(item) }}</option> }</select></label>
          <label>Application (optional)<select formControlName="applicationId"><option value="">No application</option>@for (item of applications; track item.id) { <option [value]="item.id">{{ item.companyName }} — {{ item.position }}</option> }</select></label>
        </div>
        <label>Description<textarea rows="3" formControlName="description"></textarea></label>
        <div class="flex justify-end gap-[.65rem] border-t border-af-divider pt-4"><button class="secondary-button" type="button" (click)="closeForm()">Cancel</button><button class="primary-button" type="submit" [disabled]="saving">{{ saving ? 'Saving…' : 'Save reminder' }}</button></div>
      </form>
    }
    @if (loading) { <div class="state">Loading reminders…</div> } @else {
      @for (group of groups; track group.key) {
        @if (group.items.length) {
          <section class="mb-5"><div class="mx-0 mb-[.65rem] mt-2 flex items-center gap-2"><h2 class="m-0 text-[.88rem] text-af-text-secondary">{{ group.title }}</h2><span class="rounded-md bg-af-border-soft px-[.45rem] py-[.2rem] text-[.68rem] text-af-text-muted">{{ group.items.length }}</span></div>
            <div class="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-[.8rem]">@for (item of group.items; track item.id) {
              <article class="rounded-af-lg border border-af-border bg-af-surface p-4 shadow-af" [class]="cardClass(item)">
                <div class="mb-[.65rem] flex justify-between"><span class="text-[.65rem] font-bold text-af-accent">{{ label(item.reminderType) }}</span><span class="text-[.65rem] font-bold" [class]="item.timingState === 'OVERDUE' ? 'text-af-danger' : 'text-af-text-muted'">{{ label(item.timingState) }}</span></div>
                <strong class="block text-[.86rem] text-af-text">{{ item.title }}</strong>
                @if (item.companyName) { <small class="mt-1 block text-[.72rem] text-af-text-faint">{{ item.companyName }} · {{ item.applicationPosition }}</small> }
                @if (item.description) { <p class="text-[.75rem] leading-[1.5] text-af-text-muted">{{ item.description }}</p> }
                <time class="flex items-center gap-[.35rem] text-[.72rem] text-af-text-muted"><mat-icon class="!size-[17px] !text-[17px]">schedule</mat-icon>{{ item.remindAt | date:'MMM d, y, h:mm a' }}</time>
                <footer class="mt-[.8rem] flex justify-end gap-[.7rem] border-t border-af-divider pt-[.7rem]">
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

  cardClass(item: ReminderRecord): string {
    if (item.timingState === 'OVERDUE') return 'border-l-[3px] border-l-af-danger';
    if (item.timingState === 'COMPLETED') return 'opacity-[.72]';
    return '';
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
