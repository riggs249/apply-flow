export type AssessmentStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';

export interface AssessmentRecord {
  id: string;
  applicationId: string;
  position: string;
  companyName: string;
  title: string;
  assessmentType: string;
  instructions?: string;
  dueAt?: string;
  completedAt?: string;
  status: AssessmentStatus;
  result?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
