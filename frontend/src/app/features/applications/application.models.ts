export type ApplicationStatus = 'WISHLIST' | 'APPLIED' | 'IN_PROCESS' | 'REJECTED' | 'HIRED' | 'WITHDRAWN';
export type ProcessStage = 'ASSESSMENT' | 'HR_INTERVIEW' | 'TECHNICAL_INTERVIEW' | 'FINAL_INTERVIEW';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'TEMPORARY' | 'INTERNSHIP';
export type WorkArrangement = 'ONSITE' | 'HYBRID' | 'REMOTE';

export interface ApplicationRecord {
  id: string;
  companyId: string;
  companyName: string;
  position: string;
  jobDescription?: string;
  employmentType: EmploymentType;
  workArrangement?: WorkArrangement;
  location?: string;
  salaryExpectation?: number;
  applicationDate?: string;
  jobPostingUrl?: string;
  resumeVersion?: string;
  resumeId?: string | null;
  resumeTitle?: string | null;
  resumeDescription?: string | null;
  status: ApplicationStatus;
  processStage?: ProcessStage | null;
  personalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyOption {
  id: string;
  name: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ApplicationActivity {
  id: string;
  activityType: string;
  description: string;
  occurredAt: string;
}
