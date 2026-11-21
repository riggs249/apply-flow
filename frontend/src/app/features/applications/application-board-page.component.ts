import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CdkDrag, CdkDragDrop, CdkDragPreview, CdkDropList, CdkDropListGroup, transferArrayItem } from '@angular/cdk/drag-drop';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ApplicationService } from './application.service';
import { ApplicationRecord, ApplicationStatus, PageResponse, ProcessStage } from './application.models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

interface PipelineColumn {
  status: ApplicationStatus;
  label: string;
  applications: ApplicationRecord[];
}

@Component({
  selector: 'app-application-board-page',
  standalone: true,
  imports: [CdkDropListGroup, CdkDropList, CdkDrag, CdkDragPreview, RouterLink, MatIconModule, PageHeaderComponent, DatePipe],
  template: `
    <app-page-header title="Application pipeline" description="Move opportunities through each stage of your job search.">
      <a class="secondary-button" routerLink="/applications"><mat-icon>table_rows</mat-icon> List view</a>
    </app-page-header>
    @if (error) { <div class="error">{{ error }}</div> }
    @if (loading) { <div class="state">Loading pipeline…</div> }
    @else {
      <section
        class="relative left-1/2 w-[min(100vw-6rem,1680px)] -translate-x-1/2 grid grid-cols-6 gap-[.55rem] pb-2 max-[980px]:w-[min(100vw-2rem,1680px)] max-[980px]:auto-cols-[minmax(180px,1fr)] max-[980px]:grid-flow-col max-[980px]:grid-cols-none max-[980px]:overflow-x-auto"
        cdkDropListGroup
      >
        @for (column of columns; track column.status) {
          <article class="flex min-h-[30rem] min-w-0 flex-col rounded-af-lg border border-af-border bg-[rgba(255,255,255,.55)] max-[980px]:min-w-[180px]">
            <header class="flex items-center justify-between gap-1 px-[.65rem] py-[.75rem]">
              <div class="flex min-w-0 items-center gap-[.35rem]">
                <span class="size-2 shrink-0 rounded-full" [class]="markerClass(column.status)"></span>
                <h2 class="m-0 truncate text-[.72rem] text-af-text-secondary">{{ column.label }}</h2>
              </div>
              <span class="shrink-0 rounded-md bg-af-border-soft px-[.35rem] py-[.15rem] text-center text-[.65rem] text-af-text-muted">{{ column.applications.length }}</span>
            </header>
            <div class="min-h-0 flex-1 px-[.5rem] pb-[.55rem] pt-[.1rem]" cdkDropList [cdkDropListData]="column.applications" (cdkDropListDropped)="drop($event, column.status)">
              @for (application of column.applications; track application.id) {
                <a
                  class="pipeline-card mb-[.5rem] block cursor-grab rounded-af border border-af-border bg-af-surface p-[.7rem] no-underline shadow-af active:cursor-grabbing"
                  cdkDrag
                  [routerLink]="['/applications', application.id]"
                >
                  <div *cdkDragPreview class="pipeline-card-preview">
                    <strong class="block text-[.8rem] text-af-text">{{ application.position }}</strong>
                    <span class="mt-[.3rem] block text-[.7rem] text-af-text-faint">{{ application.companyName }}</span>
                    @if (application.status === 'IN_PROCESS' && application.processStage) {
                      <span class="mt-[.3rem] block text-[.7rem] font-[650] text-af-amber">{{ label(application.processStage) }}</span>
                    }
                    @if (application.applicationDate) {
                      <time class="mt-[.3rem] block text-[.7rem] text-af-text-faint">{{ application.applicationDate | date:'MMM d, y' }}</time>
                    }
                  </div>
                  <strong class="block truncate text-[.78rem] text-af-text">{{ application.position }}</strong>
                  <span class="mt-[.25rem] block truncate text-[.68rem] text-af-text-faint">{{ application.companyName }}</span>
                  @if (application.status === 'IN_PROCESS' && application.processStage) {
                    <span class="mt-[.25rem] block truncate text-[.68rem] font-[650] text-af-amber">{{ label(application.processStage) }}</span>
                  }
                  @if (application.applicationDate) { <time class="mt-[.25rem] block text-[.68rem] text-af-text-faint">{{ application.applicationDate | date:'MMM d, y' }}</time> }
                </a>
              } @empty { <div class="mt-2 rounded-af-sm border border-dashed border-af-border px-2 py-4 text-center text-[.7rem] text-af-text-faint">Drop applications here</div> }
            </div>
          </article>
        }
      </section>
    }
  `,
})
export class ApplicationBoardPageComponent implements OnInit {
  private readonly service = inject(ApplicationService);
  readonly statuses: ApplicationStatus[] = ['WISHLIST', 'APPLIED', 'IN_PROCESS', 'REJECTED', 'HIRED', 'WITHDRAWN'];
  columns: PipelineColumn[] = this.statuses.map(status => ({ status, label: this.label(status), applications: [] }));
  loading = true;
  error = '';

  private readonly markerColors: Record<ApplicationStatus, string> = {
    WISHLIST: 'bg-af-slate',
    APPLIED: 'bg-af-accent',
    IN_PROCESS: 'bg-af-amber-dot',
    HIRED: 'bg-af-success',
    REJECTED: 'bg-af-danger',
    WITHDRAWN: 'bg-af-danger',
  };

  markerClass(status: ApplicationStatus): string {
    return this.markerColors[status];
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.loadAllApplications().subscribe({
      next: applications => {
        this.columns.forEach(column => {
          column.applications = applications.filter(item => item.status === column.status);
        });
        this.loading = false;
      },
      error: () => {
        this.error = 'The application pipeline could not be loaded.';
        this.loading = false;
      },
    });
  }

  drop(event: CdkDragDrop<ApplicationRecord[]>, status: ApplicationStatus): void {
    if (event.previousContainer === event.container) return;
    const application = event.previousContainer.data[event.previousIndex];
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    const processStage: ProcessStage | null = status === 'IN_PROCESS'
      ? (application.processStage ?? 'ASSESSMENT')
      : null;
    this.service.changeStatus(application.id, status, processStage).subscribe({
      next: updated => {
        application.status = updated.status;
        application.processStage = updated.processStage ?? null;
      },
      error: () => {
        this.error = 'That status transition was rejected.';
        this.load();
      },
    });
  }

  label(value: string): string {
    return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
  }

  private loadAllApplications(page = 0, accumulated: ApplicationRecord[] = []): Observable<ApplicationRecord[]> {
    return this.service.list({ page, size: 100, sortBy: 'updatedAt', direction: 'desc' }).pipe(
      switchMap((response: PageResponse<ApplicationRecord>) => {
        const next = [...accumulated, ...response.content];
        if (response.last || page + 1 >= response.totalPages) {
          return of(next);
        }
        return this.loadAllApplications(page + 1, next);
      }),
    );
  }
}
