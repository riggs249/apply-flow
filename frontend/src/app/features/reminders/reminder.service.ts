import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/http/api.service';
import { ReminderRecord } from './reminder.models';

@Injectable({ providedIn: 'root' })
export class ReminderService {
  private readonly api = inject(ApiService);

  list() {
    return this.api.get<ReminderRecord[]>('/reminders');
  }

  notifications() {
    return this.api.get<ReminderRecord[]>('/reminders/notifications');
  }

  create(value: unknown) {
    return this.api.post<ReminderRecord>('/reminders', value);
  }

  update(id: string, value: unknown) {
    return this.api.put<ReminderRecord>(`/reminders/${id}`, value);
  }

  complete(id: string) {
    return this.api.patch<ReminderRecord>(`/reminders/${id}/complete`, {});
  }

  reopen(id: string) {
    return this.api.patch<ReminderRecord>(`/reminders/${id}/reopen`, {});
  }

  delete(id: string) {
    return this.api.delete<void>(`/reminders/${id}`);
  }
}
