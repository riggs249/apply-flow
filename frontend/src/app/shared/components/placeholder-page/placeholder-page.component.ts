import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PageHeaderComponent } from '../page-header/page-header.component';

@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  imports: [PageHeaderComponent],
  template: `
    <app-page-header [title]="title" [description]="description" />
    <section class="flex min-h-[280px] flex-col items-center justify-center rounded-af-lg border border-af-border bg-af-surface p-8 text-center shadow-af">
      <div class="mb-4 flex size-[3.25rem] items-center justify-center rounded-full bg-af-accent-soft text-2xl text-af-accent">✦</div>
      <h2 class="m-0 text-[1.1rem] font-bold text-af-text">This workspace is ready for its next feature</h2>
      <p class="m-0 mt-2 text-af-text-muted">The foundation is in place. This module will be implemented in a later step.</p>
    </section>
  `,
})
export class PlaceholderPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly title = this.route.snapshot.data['title'] as string;
  readonly description = this.route.snapshot.data['description'] as string;
}
