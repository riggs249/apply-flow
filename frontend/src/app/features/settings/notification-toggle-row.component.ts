import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-notification-toggle-row',
  standalone: true,
  imports: [ReactiveFormsModule],
  host: {
    class: 'block w-full min-w-0',
  },
  template: `
    <label class="!mb-0 flex w-full cursor-pointer items-start justify-between gap-3 py-2 text-left">
      <span class="min-w-0">
        <span class="block text-[.82rem] font-[650] leading-snug text-af-text">{{ title() }}</span>
        <span class="mt-[.15rem] block text-[.7rem] leading-snug text-af-text-muted">{{ description() }}</span>
      </span>
      <input
        class="mt-[.15rem] !h-4 !w-4 !min-h-4 !min-w-4 shrink-0 !p-0 accent-[var(--af-accent)]"
        type="checkbox"
        [formControl]="control()"
      />
    </label>
  `,
})
export class NotificationToggleRowComponent {
  readonly control = input.required<FormControl<boolean>>();
  readonly title = input.required<string>();
  readonly description = input.required<string>();
}
