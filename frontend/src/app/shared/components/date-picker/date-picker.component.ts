import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  forwardRef,
  inject,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

interface CalendarDay {
  date: Date;
  inMonth: boolean;
  selected: boolean;
  today: boolean;
  disabled: boolean;
}

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [MatIconModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="dp" [class.open]="open()">
      <button
        type="button"
        class="dp-trigger"
        [disabled]="disabled"
        [attr.aria-label]="placeholder"
        (click)="toggle()"
      >
        <span [class.placeholder]="!value">{{ displayLabel() }}</span>
        <mat-icon>calendar_today</mat-icon>
      </button>

      @if (open()) {
        <div class="dp-popover" role="dialog" aria-label="Choose date">
          <div class="dp-header">
            <button type="button" class="nav" (click)="shiftMonth(-1)" aria-label="Previous month">
              <mat-icon>chevron_left</mat-icon>
            </button>
            <strong>{{ monthLabel() }}</strong>
            <button type="button" class="nav" [disabled]="!canGoNext()" (click)="shiftMonth(1)" aria-label="Next month">
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
          <div class="dp-weekdays">
            @for (day of weekdays; track day) {
              <span>{{ day }}</span>
            }
          </div>
          <div class="dp-grid">
            @for (day of days(); track day.date.getTime()) {
              <button
                type="button"
                class="day"
                [class.outside]="!day.inMonth"
                [class.selected]="day.selected"
                [class.today]="day.today && !day.selected"
                [class.disabled]="day.disabled"
                [disabled]="day.disabled"
                (click)="select(day.date)"
              >
                {{ day.date.getDate() }}
              </button>
            }
          </div>
          <div class="dp-footer">
            <button type="button" class="text" (click)="clear()">Clear</button>
            <button type="button" class="text accent" (click)="selectToday()">Today</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; flex: 0 1 168px; min-width: 150px; position: relative; }
    .dp { position: relative; width: 100%; }
    .dp-trigger {
      align-items: center;
      background: var(--af-surface);
      border: 1px solid var(--af-border);
      border-radius: var(--af-radius-sm);
      box-sizing: border-box;
      color: var(--af-text);
      cursor: pointer;
      display: flex;
      font: inherit;
      font-size: .82rem;
      gap: .5rem;
      height: 42px;
      justify-content: space-between;
      padding: 0 .75rem;
      width: 100%;
    }
    .dp-trigger:disabled { cursor: not-allowed; opacity: .55; }
    .dp-trigger .placeholder { color: var(--af-text-faint); }
    .dp-trigger mat-icon { color: var(--af-text-muted); font-size: 18px; height: 18px; width: 18px; }
    .dp-popover {
      background: var(--af-surface);
      border: 1px solid var(--af-border);
      border-radius: var(--af-radius);
      box-shadow: 0 10px 30px rgba(20, 27, 36, .12);
      left: 0;
      padding: .75rem;
      position: absolute;
      top: calc(100% + .4rem);
      width: 280px;
      z-index: 40;
    }
    .dp-header {
      align-items: center;
      display: flex;
      justify-content: space-between;
      margin-bottom: .65rem;
    }
    .dp-header strong { color: var(--af-text); font-size: .85rem; font-weight: 650; }
    .nav {
      align-items: center;
      background: transparent;
      border: 0;
      border-radius: 6px;
      color: var(--af-text-muted);
      cursor: pointer;
      display: inline-flex;
      height: 28px;
      justify-content: center;
      width: 28px;
    }
    .nav:hover:not(:disabled) { background: var(--af-border-soft); color: var(--af-text); }
    .nav:disabled { cursor: default; opacity: .35; }
    .nav mat-icon { font-size: 18px; height: 18px; width: 18px; }
    .dp-weekdays, .dp-grid {
      display: grid;
      gap: .15rem;
      grid-template-columns: repeat(7, 1fr);
    }
    .dp-weekdays span {
      color: var(--af-text-faint);
      font-size: .68rem;
      font-weight: 650;
      padding: .25rem 0;
      text-align: center;
    }
    .day {
      aspect-ratio: 1;
      background: transparent;
      border: 0;
      border-radius: 8px;
      color: var(--af-text-secondary);
      cursor: pointer;
      font: inherit;
      font-size: .78rem;
    }
    .day:hover:not(:disabled) { background: var(--af-accent-soft); color: var(--af-accent); }
    .day.outside { color: var(--af-text-faint); opacity: .55; }
    .day.today { box-shadow: inset 0 0 0 1px var(--af-border); }
    .day.selected {
      background: var(--af-accent);
      color: #fff;
      font-weight: 650;
    }
    .day.disabled,
    .day:disabled {
      color: var(--af-text-faint);
      cursor: not-allowed;
      opacity: .4;
    }
    .day.disabled:hover,
    .day:disabled:hover {
      background: transparent;
      color: var(--af-text-faint);
    }
    .dp-footer {
      border-top: 1px solid var(--af-divider);
      display: flex;
      justify-content: space-between;
      margin-top: .55rem;
      padding-top: .55rem;
    }
    .text {
      background: transparent;
      border: 0;
      color: var(--af-text-muted);
      cursor: pointer;
      font: inherit;
      font-size: .75rem;
      padding: .2rem .35rem;
    }
    .text.accent { color: var(--af-accent); font-weight: 650; }
  `],
})
export class DatePickerComponent implements ControlValueAccessor, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);

  @Input() placeholder = 'Pick a date';

  readonly weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  readonly open = signal(false);
  readonly days = signal<CalendarDay[]>([]);
  value: Date | null = null;
  disabled = false;
  private viewYear = new Date().getFullYear();
  private viewMonth = new Date().getMonth();
  private onChange: (value: Date | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
      this.onTouched();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) {
      this.open.set(false);
      this.onTouched();
    }
  }

  ngOnDestroy(): void {
    this.open.set(false);
  }

  writeValue(value: Date | null): void {
    if (!value) {
      this.value = null;
    } else {
      const normalized = this.startOfDay(value);
      const today = this.startOfDay(new Date());
      this.value = normalized.getTime() > today.getTime() ? today : normalized;
    }
    if (this.value) {
      this.viewYear = this.value.getFullYear();
      this.viewMonth = this.value.getMonth();
    }
    this.rebuild();
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  toggle(): void {
    if (this.disabled) return;
    const next = !this.open();
    this.open.set(next);
    if (next) {
      if (this.value) {
        this.viewYear = this.value.getFullYear();
        this.viewMonth = this.value.getMonth();
      }
      this.rebuild();
    } else {
      this.onTouched();
    }
  }

  shiftMonth(delta: number): void {
    if (delta > 0 && !this.canGoNext()) return;
    const cursor = new Date(this.viewYear, this.viewMonth + delta, 1);
    this.viewYear = cursor.getFullYear();
    this.viewMonth = cursor.getMonth();
    this.rebuild();
  }

  canGoNext(): boolean {
    const today = new Date();
    return this.viewYear < today.getFullYear()
      || (this.viewYear === today.getFullYear() && this.viewMonth < today.getMonth());
  }

  select(date: Date): void {
    const normalized = this.startOfDay(date);
    if (normalized.getTime() > this.startOfDay(new Date()).getTime()) return;
    this.value = normalized;
    this.viewYear = this.value.getFullYear();
    this.viewMonth = this.value.getMonth();
    this.onChange(this.value);
    this.onTouched();
    this.open.set(false);
    this.rebuild();
  }

  selectToday(): void {
    this.select(new Date());
  }

  clear(): void {
    this.value = null;
    this.onChange(null);
    this.onTouched();
    this.open.set(false);
    this.rebuild();
  }

  displayLabel(): string {
    if (!this.value) return this.placeholder;
    return this.value.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  monthLabel(): string {
    return new Date(this.viewYear, this.viewMonth, 1).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  }

  private rebuild(): void {
    const first = new Date(this.viewYear, this.viewMonth, 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    const today = this.startOfDay(new Date());
    const selected = this.value ? this.startOfDay(this.value).getTime() : null;
    const cells: CalendarDay[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const normalized = this.startOfDay(date);
      cells.push({
        date: normalized,
        inMonth: normalized.getMonth() === this.viewMonth,
        selected: selected !== null && normalized.getTime() === selected,
        today: normalized.getTime() === today.getTime(),
        disabled: normalized.getTime() > today.getTime(),
      });
    }
    this.days.set(cells);
  }

  private startOfDay(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
}
