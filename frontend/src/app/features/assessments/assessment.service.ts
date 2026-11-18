import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/http/api.service';
import { AssessmentRecord } from './assessment.models';

@Injectable({ providedIn: 'root' })
export class AssessmentService {
  private readonly api = inject(ApiService);

  list() {
    return this.api.get<AssessmentRecord[]>('/assessments');
  }

  get(id: string) {
    return this.api.get<AssessmentRecord>(`/assessments/${id}`);
  }

  create(value: unknown) {
    return this.api.post<AssessmentRecord>('/assessments', value);
  }

  update(id: string, value: unknown) {
    return this.api.put<AssessmentRecord>(`/assessments/${id}`, value);
  }

  delete(id: string) {
    return this.api.delete<void>(`/assessments/${id}`);
  }
}
