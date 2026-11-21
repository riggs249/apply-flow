import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  template: `
    <div class="af-loader" role="status" aria-live="polite" [attr.aria-label]="message()">
      <div class="af-loader__stage" aria-hidden="true">
        <span class="af-loader__glow"></span>
        <span class="af-loader__ring af-loader__ring--outer"></span>
        <span class="af-loader__ring af-loader__ring--inner"></span>
        <span class="af-loader__core"></span>
        <span class="af-loader__orbit">
          <i></i><i></i><i></i>
        </span>
      </div>
      <p class="af-loader__label">{{ message() }}</p>
      <div class="af-loader__bars" aria-hidden="true">
        <span></span><span></span><span></span><span></span>
      </div>
    </div>
  `,
})
export class LoadingStateComponent {
  readonly message = input('Loading…');
}
