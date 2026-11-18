import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PageHeaderComponent } from '../page-header/page-header.component';

@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  imports: [PageHeaderComponent],
  template: `
    <app-page-header [title]="title" [description]="description" />
    <section class="empty-card">
      <div class="empty-icon">✦</div>
      <h2>This workspace is ready for its next feature</h2>
      <p>The foundation is in place. This module will be implemented in a later step.</p>
    </section>
  `,
  styles: [`
    .empty-card {
      align-items: center;
      background: var(--af-surface);
      border: 1px solid var(--af-border);
      border-radius: var(--af-radius-lg);
      box-shadow: var(--af-shadow);
      display: flex;
      flex-direction: column;
      min-height: 280px;
      justify-content: center;
      padding: 2rem;
      text-align: center;
    }
    .empty-icon {
      align-items: center;
      background: var(--af-accent-soft);
      border-radius: 50%;
      color: var(--af-accent);
      display: flex;
      font-size: 1.5rem;
      height: 3.25rem;
      justify-content: center;
      margin-bottom: 1rem;
      width: 3.25rem;
    }
    h2 { color: var(--af-text); font-size: 1.1rem; margin: 0; }
    p { color: var(--af-text-muted); margin: .5rem 0 0; }
  `],
})
export class PlaceholderPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly title = this.route.snapshot.data['title'] as string;
  readonly description = this.route.snapshot.data['description'] as string;
}
