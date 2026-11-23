import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmDialogData } from './confirm-dialog.models';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="w-[min(92vw,400px)] rounded-af-lg border border-af-border bg-af-surface px-4 pb-3.5 pt-4 shadow-[0_18px_40px_rgba(20,27,36,.18)]">
      <div class="mb-3 flex items-start gap-3">
        <span class="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-af-danger-soft text-af-danger">
          <mat-icon class="!size-[18px] !text-[18px]">warning</mat-icon>
        </span>
        <div class="min-w-0">
          <h2 class="m-0 text-[.98rem] font-[700] text-af-text">{{ data.title }}</h2>
          <p class="m-0 mt-1.5 text-[.8rem] leading-[1.45] text-af-text-muted">{{ data.message }}</p>
        </div>
      </div>
      <div class="flex justify-end gap-2 border-t border-af-divider pt-2.5">
        <button class="secondary-button !px-3 !py-1.5 !text-[.78rem]" type="button" (click)="cancel()">{{ data.cancelLabel || 'Cancel' }}</button>
        <button class="danger-button !px-3 !py-1.5 !text-[.78rem]" type="button" (click)="confirm()">{{ data.confirmLabel || 'Delete' }}</button>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(DIALOG_DATA);
  private readonly dialogRef = inject(DialogRef<boolean>);

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}
