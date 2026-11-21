import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ShellNavComponent } from '../shell-nav/shell-nav.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, ShellNavComponent],
  template: `
    <div class="flex min-h-screen flex-col bg-af-canvas bg-[radial-gradient(ellipse_70%_40%_at_100%_0%,var(--af-canvas-glow),transparent_55%),radial-gradient(ellipse_50%_35%_at_0%_100%,#e2ebe8,transparent_50%)]">
      <app-shell-nav />
      <div class="mx-auto w-[80%] max-w-[1440px] px-[clamp(1rem,3vw,2.5rem)] pb-10 max-[760px]:px-4 max-[760px]:pb-6">
        <main class="pt-7 max-[760px]:pt-5"><router-outlet /></main>
      </div>
    </div>
  `,
})
export class AppLayoutComponent {}
