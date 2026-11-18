import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../core/http/api.service';
import { AnalyticsResponse } from './analytics.models';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly api = inject(ApiService);

  dashboard(from?: string, to?: string) {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    const suffix = params.toString();
    return this.api.get<AnalyticsResponse>(`/analytics/dashboard${suffix ? `?${suffix}` : ''}`);
  }
}
