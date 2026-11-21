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
  // Lets sticky nav participate in the full page shell, not a short header box
  host: { class: 'contents' },
  template: `
    <header
      #deckTop
      class="relative flex items-end justify-between gap-6 bg-af-sidebar-bg px-[clamp(1rem,3vw,2.5rem)] pb-6 pt-[1.35rem] text-[#c5d0d8] max-[760px]:flex-wrap max-[760px]:items-center max-[760px]:pb-4"
    >
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_0%_0%,rgba(15,118,110,.35),transparent_55%),radial-gradient(ellipse_40%_60%_at_100%_20%,rgba(13,148,136,.18),transparent_50%)]"
        aria-hidden="true"
      ></div>
      <div class="relative z-[1] flex min-w-0 items-end gap-3">
        <button
          class="hidden cursor-pointer border-0 bg-transparent p-[.2rem] text-[#c5d0d8] max-[760px]:flex"
          type="button"
          aria-label="Open navigation"
          (click)="navOpen.set(!navOpen())"
        >
          <mat-icon>{{ navOpen() ? 'close' : 'menu' }}</mat-icon>
        </button>
        <a routerLink="/dashboard" class="flex flex-col gap-[.35rem] text-inherit no-underline" (click)="navOpen.set(false)">
          <span class="text-[.68rem] font-bold uppercase tracking-[.16em] text-[#5eead4]">HANAP platform</span>
          <span class="text-[clamp(1.9rem,3.5vw,2.75rem)] font-extrabold leading-[.95] tracking-[-.06em] text-white max-[760px]:text-[1.7rem]">Hanap<span class="text-[#5eead4]">Tracker</span></span>
        </a>
      </div>

      <div class="relative z-[1] flex min-w-0 flex-1 items-center justify-end gap-4 max-[760px]:flex-[1_1_auto]">
        <form
          class="flex w-full max-w-[260px] items-center gap-[.45rem] border-b border-[rgba(255,255,255,.18)] pb-2 pt-[.35rem] text-[#8b9aa6] max-[980px]:max-w-[180px] max-[760px]:max-w-none max-[760px]:flex-1"
          (submit)="search($event)"
        >
          <mat-icon class="!size-[18px] !text-[18px]">search</mat-icon>
          <input
            class="w-full min-w-0 border-0 bg-transparent text-[.8rem] text-white outline-0 placeholder:text-[#7a8a96]"
            aria-label="Search applications"
            [formControl]="query"
            placeholder="Find a role or company"
          />
        </form>

        <a
          class="relative flex cursor-pointer border-0 bg-transparent text-[#9aa6b2] no-underline hover:text-white"
          routerLink="/reminders"
          aria-label="Notifications"
          (click)="navOpen.set(false)"
        >
          <mat-icon class="!text-[22px]">notifications_none</mat-icon>
          @if (notificationCount) {
            <span class="absolute -right-2 -top-[7px] rounded-md bg-af-accent-hover px-[.28rem] py-[.12rem] text-[.58rem] font-bold leading-[1.2] text-white">{{ notificationCount }}</span>
          }
        </a>

        <span class="whitespace-nowrap text-[.72rem] font-[550] tracking-[.02em] text-[#8b9aa6] max-[980px]:hidden">{{ today | date:'EEE · MMM d' }}</span>

        <div class="flex items-center gap-[.55rem] border-l border-[rgba(255,255,255,.12)] pl-4 max-[760px]:border-l-0 max-[760px]:pl-0">
          <span class="flex size-8 items-center justify-center rounded-full bg-[rgba(94,234,212,.16)] text-[.65rem] font-bold text-[#5eead4]">{{ user()?.initials || 'U' }}</span>
          <div class="flex min-w-0 flex-col gap-[.1rem] max-[980px]:hidden">
            <strong class="overflow-hidden text-ellipsis whitespace-nowrap text-[.72rem] font-[650] text-[#e8eef2]">{{ user()?.displayName || 'Signed in' }}</strong>
            <small class="overflow-hidden text-ellipsis whitespace-nowrap text-[.62rem] text-[#7a8a96]">{{ user()?.email || 'Personal workspace' }}</small>
          </div>
          <button
            class="flex cursor-pointer border-0 bg-transparent p-[.2rem] text-[#7a8a96] hover:text-white"
            type="button"
            aria-label="Sign out"
            title="Sign out"
            (click)="logout()"
          >
            <mat-icon class="!size-[18px] !text-[18px]">logout</mat-icon>
          </button>
        </div>
      </div>
    </header>

    <nav
      [class]="navClass()"
      aria-label="Main navigation"
    >
      <div class="flex items-center gap-[.15rem] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-[760px]:flex-col max-[760px]:items-stretch max-[760px]:gap-0 max-[760px]:pb-2">
        <span [class]="groupLabelClass()">Workspace</span>
        @for (item of primaryNav; track item.route) {
          <a
            [class]="linkClass()"
            [routerLink]="item.route"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: !!item.exact }"
            (click)="navOpen.set(false)"
          >{{ item.label }}</a>
        }
        <span class="mx-[.7rem] my-[.85rem] w-px flex-[0_0_1px] self-stretch bg-[rgba(255,255,255,.14)] max-[760px]:mx-0 max-[760px]:my-[.55rem] max-[760px]:h-px max-[760px]:w-full" aria-hidden="true"></span>
        <span [class]="groupLabelClass()">Manage</span>
        @for (item of secondaryNav; track item.route) {
          <a [class]="linkClass()" [routerLink]="item.route" routerLinkActive="active" (click)="navOpen.set(false)">{{ item.label }}</a>
        }
      </div>
    </nav>
  `,
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

  navClass(): string {
    const base =
      'sticky top-0 z-[25] border-y px-[clamp(1rem,3vw,2.5rem)] text-[#c5d0d8] transition-[background-color,border-color,backdrop-filter,-webkit-backdrop-filter] duration-[250ms] ease-[ease] max-[760px]:pb-2';
    const visibility = this.navOpen() ? 'max-[760px]:block' : 'max-[760px]:hidden';
    // Scrolled away from brand: translucent until hover
    const surface = this.stuck()
      ? 'border-b-[rgba(255,255,255,.14)] border-t-transparent bg-[rgba(20,27,36,.48)] backdrop-blur-[16px] backdrop-saturate-[1.25] hover:border-b-[rgba(255,255,255,.06)] hover:border-t-[rgba(255,255,255,.08)] hover:bg-af-sidebar-bg hover:backdrop-filter-none'
      : 'border-b-[rgba(255,255,255,.06)] border-t-[rgba(255,255,255,.08)] bg-af-sidebar-bg';
    return `${base} ${visibility} ${surface}`;
  }

  groupLabelClass(): string {
    const base =
      'mr-[.35rem] whitespace-nowrap text-[.62rem] font-bold uppercase tracking-[.12em] max-[760px]:mb-[.2rem] max-[760px]:mr-0 max-[760px]:mt-3';
    return `${base} ${this.stuck() ? 'text-[#c5d0d8]' : 'text-[#8b9aa8]'}`;
  }

  linkClass(): string {
    const base =
      `relative flex-none overflow-visible whitespace-nowrap px-[.7rem] pb-[.85rem] pt-[.95rem] text-[.84rem] font-semibold tracking-[-.01em] no-underline transition-colors duration-150 ease-[ease] hover:text-white [&.active]:text-white before:pointer-events-none before:absolute before:inset-x-[.45rem] before:bottom-0 before:h-8 before:scale-x-[.4] before:bg-gradient-to-t before:from-[#5eead4]/55 before:via-[#5eead4]/18 before:to-transparent before:opacity-0 before:blur-[7px] before:transition-[opacity,scale] before:duration-[180ms] before:ease-[ease] before:content-[''] after:absolute after:inset-x-[.7rem] after:bottom-0 after:z-[1] after:h-0.5 after:scale-x-[.4] after:bg-[#5eead4] after:opacity-0 after:shadow-[0_0_10px_1px_rgba(94,234,212,.55)] after:transition-[opacity,scale] after:duration-[180ms] after:ease-[ease] after:content-[''] [&.active]:before:scale-x-100 [&.active]:before:opacity-100 [&.active]:after:scale-x-100 [&.active]:after:opacity-100 max-[760px]:px-0 max-[760px]:py-[.7rem] max-[760px]:before:hidden max-[760px]:after:hidden`;
    return this.stuck()
      ? `${base} text-[#f3f6f8] [text-shadow:0_1px_2px_rgba(15,23,32,.45)]`
      : `${base} text-[#d5dee6] max-[760px]:[&.active]:text-[#5eead4]`;
  }

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
