import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../core/http/api.service';
import { ApplicationActivity, ApplicationRecord, ApplicationStatus, CompanyOption, EmploymentType, PageResponse, ProcessStage, WorkArrangement } from './application.models';

export interface ApplicationFilters {
  query?: string;
  status?: ApplicationStatus | '';
  employmentType?: EmploymentType | '';
  workArrangement?: WorkArrangement | '';
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private readonly api = inject(ApiService);

  list(filters: ApplicationFilters = {}) {
    let params = new HttpParams();
    Object.entries({ page: 0, size: 10, sortBy: 'appliedAt', direction: 'desc', ...filters }).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
    });
    return this.api.get<PageResponse<ApplicationRecord>>(`/applications?${params.toString()}`);
  }

  get(id: string) {
    return this.api.get<ApplicationRecord>(`/applications/${id}`);
  }

  create(value: unknown) {
    return this.api.post<ApplicationRecord>('/applications', value);
  }

  update(id: string, value: unknown) {
    return this.api.put<ApplicationRecord>(`/applications/${id}`, value);
  }

  changeStatus(id: string, status: ApplicationStatus, processStage?: ProcessStage | null) {
    return this.api.patch<ApplicationRecord>(`/applications/${id}/status`, { status, processStage: processStage ?? null });
  }

  activities(id: string) {
    return this.api.get<ApplicationActivity[]>(`/applications/${id}/activities`);
  }

  delete(id: string) {
    return this.api.delete<void>(`/applications/${id}`);
  }

  companies() {
    return this.api.get<PageResponse<CompanyOption>>('/companies?page=0&size=100&sortBy=name&direction=asc');
  }
}
