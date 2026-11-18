import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../core/http/api.service';
import { ResumeRecord } from './resume.models';

@Injectable({ providedIn: 'root' })
export class ResumeService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  list() {
    return this.api.get<ResumeRecord[]>('/resumes');
  }

  upload(title: string, description: string, file: File) {
    const body = new FormData();
    body.append('title', title);
    body.append('description', description);
    body.append('file', file);
    return this.http.post<ResumeRecord>(`${this.api.baseUrl}/resumes`, body);
  }

  update(id: string, title: string, description: string) {
    return this.api.put<ResumeRecord>(`/resumes/${id}`, { title, description });
  }

  delete(id: string) {
    return this.api.delete<void>(`/resumes/${id}`);
  }

  fileBlob(id: string) {
    return this.http.get(`${this.api.baseUrl}/resumes/${id}/file`, { responseType: 'blob' });
  }
}
