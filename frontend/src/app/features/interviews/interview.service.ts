import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/http/api.service';
import { InterviewRecord } from './interview.models';

@Injectable({ providedIn: 'root' })
export class InterviewService {
  private readonly api = inject(ApiService);

  list() {
    return this.api.get<InterviewRecord[]>('/interviews');
  }

  get(id: string) {
    return this.api.get<InterviewRecord>(`/interviews/${id}`);
  }

  create(value: unknown) {
    return this.api.post<InterviewRecord>('/interviews', value);
  }

  update(id: string, value: unknown) {
    return this.api.put<InterviewRecord>(`/interviews/${id}`, value);
  }

  delete(id: string) {
    return this.api.delete<void>(`/interviews/${id}`);
  }
}
