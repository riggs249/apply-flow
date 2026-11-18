import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <article class="stat-card">
      <div class="stat-top">
        <span class="label">{{ label() }}</span>
        <span class="icon"><mat-icon>{{ icon() }}</mat-icon></span>
      </div>
      <strong>{{ value() }}</strong>
      <span class="trend" [class.positive]="positive()">{{ trend() }}</span>
    </article>
  `,
  styles: [`
    .stat-card {
      background: var(--af-surface);
      border: 1px solid var(--af-border);
      border-radius: var(--af-radius-lg);
      box-shadow: var(--af-shadow);
      padding: 1.15rem 1.25rem;
    }
    .stat-top {
      align-items: center;
      display: flex;
      justify-content: space-between;
      margin-bottom: 1.1rem;
    }
    .label {
      color: var(--af-text-muted);
      font-size: .84rem;
      font-weight: 600;
    }
    .icon {
      align-items: center;
      background: var(--af-accent-soft);
      border-radius: 9px;
      color: var(--af-accent);
      display: flex;
      height: 2rem;
      justify-content: center;
      width: 2rem;
    }
    .icon mat-icon { font-size: 19px; height: 19px; width: 19px; }
    strong {
      color: var(--af-text);
      display: block;
      font-size: 1.75rem;
      letter-spacing: -.04em;
    }
    .trend {
      color: var(--af-text-faint);
      display: block;
      font-size: .75rem;
      margin-top: .5rem;
    }
    .trend.positive { color: var(--af-success-deep); }
  `],
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly trend = input.required<string>();
  readonly icon = input('insights');
  readonly positive = input(false);
}
