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
  host: { class: 'relative block min-w-[150px] flex-[0_1_168px]' },
  template: `
    <div class="relative w-full">
      <button
        type="button"
        class="flex h-[42px] w-full cursor-pointer items-center justify-between gap-2 rounded-af-sm border border-af-border bg-af-surface px-3 text-[.82rem] text-af-text disabled:cursor-not-allowed disabled:opacity-[.55]"
        [disabled]="disabled"
        [attr.aria-label]="placeholder"
        (click)="toggle()"
      >
        <span [class.text-af-text-faint]="!value">{{ displayLabel() }}</span>
        <mat-icon class="!size-[18px] !text-[18px] text-af-text-muted">calendar_today</mat-icon>
      </button>

      @if (open()) {
        <div
          class="absolute left-0 top-[calc(100%+.4rem)] z-40 w-[280px] rounded-af border border-af-border bg-af-surface p-3 shadow-[0_10px_30px_rgba(20,27,36,.12)]"
          role="dialog"
          aria-label="Choose date"
        >
          <div class="mb-[.65rem] flex items-center justify-between">
            <button type="button" [class]="navClass" (click)="shiftMonth(-1)" aria-label="Previous month">
              <mat-icon class="!size-[18px] !text-[18px]">chevron_left</mat-icon>
            </button>
            <strong class="text-[.85rem] font-[650] text-af-text">{{ monthLabel() }}</strong>
            <button type="button" [class]="navClass" [disabled]="!canGoNext()" (click)="shiftMonth(1)" aria-label="Next month">
              <mat-icon class="!size-[18px] !text-[18px]">chevron_right</mat-icon>
            </button>
          </div>
          <div class="grid grid-cols-[repeat(7,1fr)] gap-[.15rem]">
            @for (day of weekdays; track day) {
              <span class="py-1 text-center text-[.68rem] font-[650] text-af-text-faint">{{ day }}</span>
            }
          </div>
          <div class="grid grid-cols-[repeat(7,1fr)] gap-[.15rem]">
            @for (day of days(); track day.date.getTime()) {
              <button
                type="button"
                [class]="dayClass(day)"
                [disabled]="day.disabled"
                (click)="select(day.date)"
              >
                {{ day.date.getDate() }}
              </button>
            }
          </div>
          <div class="mt-[.55rem] flex justify-between border-t border-af-divider pt-[.55rem]">
            <button type="button" [class]="textButtonClass + ' text-af-text-muted'" (click)="clear()">Clear</button>
            <button type="button" [class]="textButtonClass + ' font-[650] text-af-accent'" (click)="selectToday()">Today</button>
          </div>
        </div>
      }
    </div>
  `,
})
export class DatePickerComponent implements ControlValueAccessor, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);

  @Input() placeholder = 'Pick a date';

  readonly navClass =
    'inline-flex size-7 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-af-text-muted enabled:hover:bg-af-border-soft enabled:hover:text-af-text disabled:cursor-default disabled:opacity-35';
  readonly textButtonClass = 'cursor-pointer border-0 bg-transparent px-[.35rem] py-[.2rem] text-[.75rem]';

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

  dayClass(day: CalendarDay): string {
    const base = 'aspect-square rounded-lg border-0 text-[.78rem]';
    if (day.disabled) {
      return `${base} cursor-not-allowed bg-transparent text-af-text-faint opacity-40`;
    }
    const classes = [base, 'cursor-pointer', 'hover:bg-af-accent-soft', 'hover:text-af-accent'];
    if (day.selected) {
      classes.push('bg-af-accent', 'font-[650]', 'text-white');
    } else {
      classes.push('bg-transparent', day.inMonth ? 'text-af-text-secondary' : 'text-af-text-faint');
    }
    if (!day.inMonth) classes.push('opacity-55');
    if (day.today && !day.selected) classes.push('shadow-[inset_0_0_0_1px_var(--af-border)]');
    return classes.join(' ');
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
