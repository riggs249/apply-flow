import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../core/http/api.service';
import { PageResponse } from '../applications/application.models';
import { CompanyFilters, CompanyRecord } from './company.models';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly api = inject(ApiService);

  list(filters: CompanyFilters = {}) {
    let params = new HttpParams();
    Object.entries({ page: 0, size: 20, sortBy: 'name', direction: 'asc', ...filters }).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.api.get<PageResponse<CompanyRecord>>(`/companies?${params.toString()}`);
  }

  get(id: string) {
    return this.api.get<CompanyRecord>(`/companies/${id}`);
  }

  create(value: unknown) {
    return this.api.post<CompanyRecord>('/companies', value);
  }

  update(id: string, value: unknown) {
    return this.api.put<CompanyRecord>(`/companies/${id}`, value);
  }

  delete(id: string) {
    return this.api.delete<void>(`/companies/${id}`);
  }
}
