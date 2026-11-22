import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface NotificationSettings {
  reminderEmail: boolean;
  interviewEmail: boolean;
  assessmentEmail: boolean;
  outcomeEmail: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationSettingsService {
  private readonly http = inject(HttpClient);

  get() {
    return this.http.get<NotificationSettings>(`${environment.apiUrl}/me/notification-settings`);
  }

  update(settings: NotificationSettings) {
    return this.http.put<NotificationSettings>(`${environment.apiUrl}/me/notification-settings`, settings);
  }
}
