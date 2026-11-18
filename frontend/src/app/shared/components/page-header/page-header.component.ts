import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <div class="page-header">
      <div>
        <p class="eyebrow">{{ eyebrow() }}</p>
        <h1>{{ title() }}</h1>
        <p class="description">{{ description() }}</p>
      </div>
      <ng-content />
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .eyebrow {
      color: var(--af-accent);
      font-size: .72rem;
      font-weight: 700;
      letter-spacing: .08em;
      margin: 0 0 .45rem;
      text-transform: uppercase;
    }
    h1 {
      color: var(--af-text);
      font-size: clamp(1.65rem, 3vw, 2.25rem);
      font-weight: 750;
      letter-spacing: -.04em;
      line-height: 1.1;
      margin: 0;
    }
    .description {
      color: var(--af-text-muted);
      margin: .65rem 0 0;
    }
    @media (max-width: 640px) {
      .page-header { align-items: stretch; flex-direction: column; }
    }
  `],
})
export class PageHeaderComponent {
  readonly eyebrow = input('Overview');
  readonly title = input.required<string>();
  readonly description = input('');
}
