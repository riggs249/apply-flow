import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-kanban-card-skeleton',
  standalone: true,
  template: `
    <div class="flex flex-col gap-[.5rem]" role="status" aria-live="polite" [attr.aria-label]="label()">
      @for (card of cardIndexes(); track card) {
        <div class="rounded-af border border-af-border bg-af-surface p-[.7rem] shadow-af">
          <span class="af-skeleton" style="width: 78%"></span>
          <span class="af-skeleton af-skeleton--secondary" style="width: 56%"></span>
          <span class="af-skeleton af-skeleton--secondary" style="width: 38%"></span>
        </div>
      }
    </div>
  `,
})
export class KanbanCardSkeletonComponent {
  readonly count = input(3);
  readonly label = input('Loading cards…');

  readonly cardIndexes = computed(() =>
    Array.from({ length: Math.max(this.count(), 1) }, (_, index) => index),
  );
}
