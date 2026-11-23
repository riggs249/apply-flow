import { Dialog } from '@angular/cdk/dialog';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { ConfirmDialogData } from './confirm-dialog.models';

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly dialog = inject(Dialog);

  confirm(data: ConfirmDialogData): Observable<boolean> {
    const ref = this.dialog.open<boolean, ConfirmDialogData>(ConfirmDialogComponent, {
      data,
      autoFocus: 'dialog',
      backdropClass: 'af-confirm-backdrop',
      panelClass: 'af-confirm-panel',
    });
    return ref.closed.pipe(map(result => result === true));
  }
}
