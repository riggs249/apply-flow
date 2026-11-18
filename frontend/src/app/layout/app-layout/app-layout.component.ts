import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ShellNavComponent } from '../shell-nav/shell-nav.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, ShellNavComponent],
  template: `
    <div class="app-shell">
      <app-shell-nav />
      <div class="workspace">
        <main class="page-content"><router-outlet /></main>
      </div>
    </div>
  `,
  styles: [`
    .app-shell {
      background:
        radial-gradient(ellipse 70% 40% at 100% 0%, var(--af-canvas-glow), transparent 55%),
        radial-gradient(ellipse 50% 35% at 0% 100%, #e2ebe8, transparent 50%),
        var(--af-canvas);
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .workspace {
      margin: 0 auto;
      max-width: 1440px;
      padding: 0 clamp(1rem, 3vw, 2.5rem) 2.5rem;
      width: 75%;
    }

    .page-content {
      padding: 1.75rem 0 0;
    }

    @media (max-width: 760px) {
      .workspace { padding: 0 1rem 1.5rem; }
      .page-content { padding-top: 1.25rem; }
    }
  `],
})
export class AppLayoutComponent {}
