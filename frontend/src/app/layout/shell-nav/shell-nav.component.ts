import { DatePipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ReminderService } from '../../features/reminders/reminder.service';

interface NavItem {
  label: string;
  route: string;
  exact?: boolean;
}

@Component({
  selector: 'app-shell-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule, ReactiveFormsModule, DatePipe],
  template: `
    <header #deckTop class="deck-top" [class.nav-open]="navOpen()">
      <div class="deck-glow" aria-hidden="true"></div>
      <div class="brand-block">
        <button class="menu-button" type="button" aria-label="Open navigation" (click)="navOpen.set(!navOpen())">
          <mat-icon>{{ navOpen() ? 'close' : 'menu' }}</mat-icon>
        </button>
        <a routerLink="/dashboard" class="brand" (click)="navOpen.set(false)">
          <span class="brand-kicker">Job search OS</span>
          <span class="brand-name">Apply<span>Flow</span></span>
        </a>
      </div>

      <div class="utilities">
        <form class="search" (submit)="search($event)">
          <mat-icon>search</mat-icon>
          <input aria-label="Search applications" [formControl]="query" placeholder="Find a role or company" />
        </form>

        <a class="icon-button" routerLink="/reminders" aria-label="Notifications" (click)="navOpen.set(false)">
          <mat-icon>notifications_none</mat-icon>
          @if (notificationCount) {
            <span class="notification-count">{{ notificationCount }}</span>
          }
        </a>

        <span class="date">{{ today | date:'EEE · MMM d' }}</span>

        <div class="profile">
          <span class="avatar">{{ user()?.initials || 'U' }}</span>
          <div class="profile-copy">
            <strong>{{ user()?.displayName || 'Signed in' }}</strong>
            <small>{{ user()?.email || 'Personal workspace' }}</small>
          </div>
          <button class="logout-button" type="button" aria-label="Sign out" title="Sign out" (click)="logout()">
            <mat-icon>logout</mat-icon>
          </button>
        </div>
      </div>
    </header>

    <nav
      class="deck-nav"
      [class.nav-open]="navOpen()"
      [class.is-stuck]="stuck()"
      aria-label="Main navigation"
    >
      <div class="nav-track">
        <span class="nav-group-label">Workspace</span>
        @for (item of primaryNav; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: !!item.exact }"
            (click)="navOpen.set(false)"
          >{{ item.label }}</a>
        }
        <span class="nav-rule" aria-hidden="true"></span>
        <span class="nav-group-label">Manage</span>
        @for (item of secondaryNav; track item.route) {
          <a [routerLink]="item.route" routerLinkActive="active" (click)="navOpen.set(false)">{{ item.label }}</a>
        }
      </div>
    </nav>
  `,
  styles: [`
    /* Lets sticky nav participate in the full page shell, not a short header box */
    :host { display: contents; }

    .deck-top {
      align-items: flex-end;
      background: var(--af-sidebar-bg);
      color: #c5d0d8;
      display: flex;
      gap: 1.5rem;
      justify-content: space-between;
      padding: 1.35rem clamp(1rem, 3vw, 2.5rem) 1.5rem;
      position: relative;
    }

    .deck-glow {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 50% 80% at 0% 0%, rgba(15, 118, 110, .35), transparent 55%),
        radial-gradient(ellipse 40% 60% at 100% 20%, rgba(13, 148, 136, .18), transparent 50%);
      pointer-events: none;
    }

    .brand-block, .utilities { position: relative; z-index: 1; }
    .brand-block { align-items: flex-end; display: flex; gap: .75rem; min-width: 0; }

    .brand {
      color: inherit;
      display: flex;
      flex-direction: column;
      gap: .35rem;
      text-decoration: none;
    }

    .brand-kicker {
      color: #5eead4;
      font-size: .68rem;
      font-weight: 700;
      letter-spacing: .16em;
      text-transform: uppercase;
    }

    .brand-name {
      color: #fff;
      font-size: clamp(1.9rem, 3.5vw, 2.75rem);
      font-weight: 800;
      letter-spacing: -.06em;
      line-height: .95;
    }

    .brand-name span { color: #5eead4; }

    .utilities {
      align-items: center;
      display: flex;
      flex: 1;
      gap: 1rem;
      justify-content: flex-end;
      min-width: 0;
    }

    .search {
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, .18);
      color: #8b9aa6;
      display: flex;
      gap: .45rem;
      max-width: 260px;
      padding: .35rem 0 .5rem;
      width: 100%;
    }

    .search mat-icon { font-size: 18px; height: 18px; width: 18px; }

    .search input {
      background: transparent;
      border: 0;
      color: #fff;
      font: inherit;
      font-size: .8rem;
      min-width: 0;
      outline: 0;
      width: 100%;
    }

    .search input::placeholder { color: #7a8a96; }

    .icon-button {
      background: none;
      border: 0;
      color: #9aa6b2;
      cursor: pointer;
      display: flex;
      position: relative;
      text-decoration: none;
    }

    .icon-button:hover { color: #fff; }
    .icon-button mat-icon { font-size: 22px; }

    .notification-count {
      background: var(--af-accent-hover);
      border-radius: 6px;
      color: #fff;
      font-size: .58rem;
      font-weight: 700;
      line-height: 1.2;
      padding: .12rem .28rem;
      position: absolute;
      right: -8px;
      top: -7px;
    }

    .date {
      color: #8b9aa6;
      font-size: .72rem;
      font-weight: 550;
      letter-spacing: .02em;
      white-space: nowrap;
    }

    .profile {
      align-items: center;
      border-left: 1px solid rgba(255, 255, 255, .12);
      display: flex;
      gap: .55rem;
      padding-left: 1rem;
    }

    .avatar {
      align-items: center;
      background: rgba(94, 234, 212, .16);
      border-radius: 50%;
      color: #5eead4;
      display: flex;
      font-size: .65rem;
      font-weight: 700;
      height: 2rem;
      justify-content: center;
      width: 2rem;
    }

    .profile-copy {
      display: flex;
      flex-direction: column;
      gap: .1rem;
      min-width: 0;
    }

    .profile-copy strong {
      color: #e8eef2;
      font-size: .72rem;
      font-weight: 650;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .profile-copy small {
      color: #7a8a96;
      font-size: .62rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .logout-button {
      background: none;
      border: 0;
      color: #7a8a96;
      cursor: pointer;
      display: flex;
      padding: .2rem;
    }

    .logout-button:hover { color: #fff; }
    .logout-button mat-icon { font-size: 18px; height: 18px; width: 18px; }

    .deck-nav {
      background: var(--af-sidebar-bg);
      border-bottom: 1px solid rgba(255, 255, 255, .06);
      border-top: 1px solid rgba(255, 255, 255, .08);
      color: #c5d0d8;
      padding: 0 clamp(1rem, 3vw, 2.5rem);
      position: sticky;
      top: 0;
      transition:
        background-color .25s ease,
        border-color .25s ease,
        backdrop-filter .25s ease,
        -webkit-backdrop-filter .25s ease;
      z-index: 25;
    }

    /* Scrolled away from brand: translucent until hover */
    .deck-nav.is-stuck {
      background: rgba(20, 27, 36, .48);
      border-bottom-color: rgba(255, 255, 255, .14);
      border-top-color: transparent;
      -webkit-backdrop-filter: blur(16px) saturate(1.25);
      backdrop-filter: blur(16px) saturate(1.25);
    }

    .deck-nav.is-stuck:hover {
      background: var(--af-sidebar-bg);
      border-bottom-color: rgba(255, 255, 255, .06);
      border-top-color: rgba(255, 255, 255, .08);
      -webkit-backdrop-filter: none;
      backdrop-filter: none;
    }

    .deck-nav.is-stuck .nav-group-label {
      color: #c5d0d8;
    }

    .deck-nav.is-stuck .nav-track a {
      color: #f3f6f8;
      text-shadow: 0 1px 2px rgba(15, 23, 32, .45);
    }

    .deck-nav.is-stuck .nav-track a.active,
    .deck-nav.is-stuck .nav-track a:hover {
      color: #fff;
    }

    .nav-track {
      align-items: center;
      display: flex;
      gap: .15rem;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .nav-track::-webkit-scrollbar { display: none; }

    .nav-group-label {
      color: #8b9aa8;
      font-size: .62rem;
      font-weight: 700;
      letter-spacing: .12em;
      margin-right: .35rem;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .nav-rule {
      align-self: stretch;
      background: rgba(255, 255, 255, .14);
      flex: 0 0 1px;
      margin: .85rem .7rem;
      width: 1px;
    }

    .nav-track a {
      color: #d5dee6;
      flex: 0 0 auto;
      font-size: .84rem;
      font-weight: 600;
      letter-spacing: -.01em;
      padding: .95rem .7rem .85rem;
      position: relative;
      text-decoration: none;
      transition: color .15s ease;
      white-space: nowrap;
    }

    .nav-track a::after {
      background: #5eead4;
      bottom: 0;
      content: '';
      height: 2px;
      left: .7rem;
      opacity: 0;
      position: absolute;
      right: .7rem;
      transform: scaleX(.4);
      transition: opacity .18s ease, transform .18s ease;
    }

    .nav-track a:hover { color: #fff; }

    .nav-track a.active {
      color: #fff;
    }

    .nav-track a.active::after {
      opacity: 1;
      transform: scaleX(1);
    }

    .menu-button {
      background: none;
      border: 0;
      color: #c5d0d8;
      cursor: pointer;
      display: none;
      padding: .2rem;
    }

    @media (max-width: 980px) {
      .date, .profile-copy { display: none; }
      .search { max-width: 180px; }
    }

    @media (max-width: 760px) {
      .deck-top {
        align-items: center;
        flex-wrap: wrap;
        padding-bottom: 1rem;
      }
      .menu-button { display: flex; }
      .brand-name { font-size: 1.7rem; }
      .utilities { flex: 1 1 auto; justify-content: flex-end; }
      .search { max-width: none; flex: 1; }
      .profile { border-left: 0; padding-left: 0; }
      .deck-nav {
        display: none;
        padding-bottom: .5rem;
      }
      .deck-nav.nav-open { display: block; }
      .nav-track {
        align-items: stretch;
        flex-direction: column;
        gap: 0;
        padding-bottom: .5rem;
      }
      .nav-group-label { margin: .75rem 0 .2rem; }
      .nav-rule {
        height: 1px;
        margin: .55rem 0;
        width: 100%;
      }
      .nav-track a {
        padding: .7rem 0;
      }
      .nav-track a::after { display: none; }
      .nav-track a.active {
        color: #5eead4;
      }
    }
  `],
})
export class ShellNavComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly reminderService = inject(ReminderService);
  private readonly router = inject(Router);
  private readonly deckTop = viewChild.required<ElementRef<HTMLElement>>('deckTop');

  readonly navOpen = signal(false);
  readonly stuck = signal(false);
  readonly closeRequested = output<void>();
  readonly user = this.auth.currentUser;
  readonly query = new FormControl('', { nonNullable: true });
  readonly today = new Date();
  notificationCount = 0;
  private brandObserver?: IntersectionObserver;

  readonly primaryNav: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', exact: true },
    { label: 'Applications', route: '/applications' },
    { label: 'Companies', route: '/companies' },
    { label: 'Resumes', route: '/resumes' },
    { label: 'Interviews', route: '/interviews' },
  ];

  readonly secondaryNav: NavItem[] = [
    { label: 'Assessments', route: '/assessments' },
    { label: 'Reminders', route: '/reminders' },
    { label: 'Analytics', route: '/analytics' },
    { label: 'Settings', route: '/settings' },
  ];

  ngOnInit(): void {
    this.reminderService.notifications().subscribe({
      next: items => this.notificationCount = items.length,
      error: () => this.notificationCount = 0,
    });
  }

  ngAfterViewInit(): void {
    this.brandObserver = new IntersectionObserver(
      ([entry]) => this.stuck.set(!entry.isIntersecting),
      { threshold: 0 },
    );
    this.brandObserver.observe(this.deckTop().nativeElement);
  }

  ngOnDestroy(): void {
    this.brandObserver?.disconnect();
  }

  search(event: Event): void {
    event.preventDefault();
    const q = this.query.value.trim();
    this.navOpen.set(false);
    void this.router.navigate(['/applications'], { queryParams: q ? { q } : {} });
  }

  logout(): void {
    this.navOpen.set(false);
    this.auth.logout().subscribe({
      next: () => void this.router.navigateByUrl('/login'),
      error: () => void this.router.navigateByUrl('/login'),
    });
  }
}
