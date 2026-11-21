import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <article class="rounded-af-lg border border-af-border bg-af-surface px-5 py-[1.15rem] shadow-af">
      <div class="mb-[1.1rem] flex items-center justify-between">
        <span class="text-[.84rem] font-semibold text-af-text-muted">{{ label() }}</span>
        <span class="flex size-8 items-center justify-center rounded-[9px] bg-af-accent-soft text-af-accent">
          <mat-icon class="!size-[19px] !text-[19px]">{{ icon() }}</mat-icon>
        </span>
      </div>
      <strong class="block text-[1.75rem] font-bold tracking-[-.04em] text-af-text">{{ value() }}</strong>
      <span
        class="mt-2 block text-[.75rem]"
        [class.text-af-text-faint]="!positive()"
        [class.text-af-success-deep]="positive()"
      >{{ trend() }}</span>
    </article>
  `,
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly trend = input.required<string>();
  readonly icon = input('insights');
  readonly positive = input(false);
}
