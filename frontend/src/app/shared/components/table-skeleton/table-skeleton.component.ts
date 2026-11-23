import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-table-skeleton',
  standalone: true,
  template: `
    <section class="table-card" role="status" aria-live="polite" [attr.aria-label]="label()">
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              @for (column of resolvedColumns(); track $index) {
                <th>
                  <span class="af-skeleton af-skeleton--header" [style.width]="column.width"></span>
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of rowIndexes(); track row) {
              <tr>
                @for (column of resolvedColumns(); track $index) {
                  <td>
                    <span class="af-skeleton" [style.width]="column.width"></span>
                    @if (column.secondary) {
                      <span class="af-skeleton af-skeleton--secondary" [style.width]="column.secondary"></span>
                    }
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
      @if (showFooter()) {
        <footer>
          <span class="af-skeleton af-skeleton--footer" style="width: 9rem"></span>
          <div class="pager">
            <span class="af-skeleton af-skeleton--footer" style="width: 7rem"></span>
          </div>
        </footer>
      }
    </section>
  `,
})
export class TableSkeletonComponent {
  /** Accessible label for the loading state. */
  readonly label = input('Loading table…');
  /** Number of placeholder rows. */
  readonly rows = input(6);
  /**
   * Column count, or explicit widths like `['42%', '18%', '14%', '14%', '12%']`.
   * Use objects for a primary + secondary line in a cell.
   */
  readonly columns = input<number | Array<string | TableSkeletonColumn>>(5);
  readonly showFooter = input(true);

  readonly rowIndexes = computed(() => Array.from({ length: Math.max(this.rows(), 1) }, (_, index) => index));

  readonly resolvedColumns = computed(() => {
    const value = this.columns();
    if (typeof value === 'number') {
      const count = Math.max(value, 1);
      const width = `${Math.floor(100 / count)}%`;
      return Array.from({ length: count }, (_, index) => ({
        width: index === 0 ? '55%' : '70%',
        secondary: index === 0 ? '40%' : undefined,
      }));
    }
    return value.map(column => {
      if (typeof column === 'string') {
        return { width: column };
      }
      return column;
    });
  });
}

export interface TableSkeletonColumn {
  width: string;
  secondary?: string;
}
