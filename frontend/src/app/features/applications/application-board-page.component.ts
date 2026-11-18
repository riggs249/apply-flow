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
      <section class="board" cdkDropListGroup>
        @for (column of columns; track column.status) {
          <article class="column">
            <header><div><span class="column-marker" [class]="column.status.toLowerCase()"></span><h2>{{ column.label }}</h2></div><span class="count">{{ column.applications.length }}</span></header>
            <div class="drop-zone" cdkDropList [cdkDropListData]="column.applications" (cdkDropListDropped)="drop($event, column.status)">
              @for (application of column.applications; track application.id) {
                <a class="application-card" cdkDrag [routerLink]="['/applications', application.id]">
                  <div class="drag-preview" *cdkDragPreview>{{ application.position }}</div>
                  <strong>{{ application.position }}</strong>
                  <span>{{ application.companyName }}</span>
                  @if (application.status === 'IN_PROCESS' && application.processStage) {
                    <span class="stage">{{ label(application.processStage) }}</span>
                  }
                  @if (application.applicationDate) { <time>{{ application.applicationDate | date:'MMM d, y' }}</time> }
                </a>
              } @empty { <div class="empty-column">Drop applications here</div> }
            </div>
          </article>
        }
      </section>
    }
  `,
  styles: [`
    .board {
      display: grid;
      gap: .8rem;
      grid-auto-columns: minmax(220px, 1fr);
      grid-auto-flow: column;
      overflow-x: auto;
      padding-bottom: .5rem;
    }
    .column {
      background: rgba(255, 255, 255, .55);
      border: 1px solid var(--af-border);
      border-radius: var(--af-radius-lg);
      min-height: 30rem;
      min-width: 220px;
    }
    header { align-items: center; display: flex; justify-content: space-between; padding: .9rem; }
    header div { align-items: center; display: flex; gap: .45rem; }
    h2 { color: var(--af-text-secondary); font-size: .78rem; margin: 0; }
    .count {
      background: var(--af-border-soft);
      border-radius: 6px;
      color: var(--af-text-muted);
      font-size: .68rem;
      min-width: 1.25rem;
      padding: .2rem .4rem;
      text-align: center;
    }
    .column-marker { background: var(--af-slate); border-radius: 50%; height: 8px; width: 8px; }
    .column-marker.wishlist { background: var(--af-slate); }
    .column-marker.applied { background: var(--af-accent); }
    .column-marker.in_process { background: var(--af-amber-dot); }
    .column-marker.hired { background: var(--af-success); }
    .column-marker.rejected, .column-marker.withdrawn { background: var(--af-danger); }
    .drop-zone { min-height: 26rem; padding: .15rem .65rem .65rem; }
    .application-card {
      background: var(--af-surface);
      border: 1px solid var(--af-border);
      border-radius: var(--af-radius);
      box-shadow: var(--af-shadow);
      cursor: grab;
      display: block;
      margin-bottom: .6rem;
      padding: .8rem;
      text-decoration: none;
    }
    .application-card:active { cursor: grabbing; }
    .application-card strong, .application-card span, .application-card time { display: block; }
    .application-card strong { color: var(--af-text); font-size: .8rem; }
    .application-card span, .application-card time { color: var(--af-text-faint); font-size: .7rem; margin-top: .3rem; }
    .application-card .stage { color: var(--af-amber); font-weight: 650; }
    .empty-column {
      border: 1px dashed var(--af-border);
      border-radius: var(--af-radius-sm);
      color: var(--af-text-faint);
      font-size: .72rem;
      margin-top: .5rem;
      padding: 1rem .5rem;
      text-align: center;
    }
    .drag-preview {
      background: var(--af-sidebar-bg);
      border-radius: 7px;
      color: #fff;
      font-size: .78rem;
      padding: .6rem .8rem;
    }
  `],
})
export class ApplicationBoardPageComponent implements OnInit {
  private readonly service = inject(ApplicationService);
  readonly statuses: ApplicationStatus[] = ['WISHLIST', 'APPLIED', 'IN_PROCESS', 'REJECTED', 'HIRED', 'WITHDRAWN'];
  columns: PipelineColumn[] = this.statuses.map(status => ({ status, label: this.label(status), applications: [] }));
  loading = true;
  error = '';

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
