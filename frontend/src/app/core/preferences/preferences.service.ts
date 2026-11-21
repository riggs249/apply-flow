import { Injectable, signal } from '@angular/core';

const PAGE_SIZE_KEY = 'hanaptracker.applicationsPageSize';
const DEFAULT_PAGE_SIZE = 10;

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly applicationsPageSizeSignal = signal(this.readPageSize());

  readonly applicationsPageSize = this.applicationsPageSizeSignal.asReadonly();

  setApplicationsPageSize(size: number): void {
    const next = [10, 20, 50].includes(size) ? size : DEFAULT_PAGE_SIZE;
    localStorage.setItem(PAGE_SIZE_KEY, String(next));
    this.applicationsPageSizeSignal.set(next);
  }

  private readPageSize(): number {
    const raw = Number(localStorage.getItem(PAGE_SIZE_KEY));
    return [10, 20, 50].includes(raw) ? raw : DEFAULT_PAGE_SIZE;
  }
}
