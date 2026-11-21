import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <div class="mb-8 flex items-start justify-between gap-6 max-sm:flex-col max-sm:items-stretch">
      <div>
        <p class="m-0 mb-[.45rem] text-[.72rem] font-bold uppercase tracking-[.08em] text-af-accent">{{ eyebrow() }}</p>
        <h1 class="m-0 text-[clamp(1.65rem,3vw,2.25rem)] font-[750] leading-[1.1] tracking-[-.04em] text-af-text">{{ title() }}</h1>
        <p class="m-0 mt-[.65rem] text-af-text-muted">{{ description() }}</p>
      </div>
      <ng-content />
    </div>
  `,
})
export class PageHeaderComponent {
  readonly eyebrow = input('Overview');
  readonly title = input.required<string>();
  readonly description = input('');
}
