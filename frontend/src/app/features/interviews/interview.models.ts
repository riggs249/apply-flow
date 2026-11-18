export type InterviewOutcome = 'PENDING' | 'PASSED' | 'FAILED' | 'RESCHEDULED' | 'CANCELLED';

export interface InterviewRecord {
  id: string;
  applicationId: string;
  position: string;
  companyName: string;
  scheduledAt: string;
  interviewType: string;
  interviewer?: string;
  interviewerContact?: string;
  locationOrMeetingUrl?: string;
  preparationNotes?: string;
  reflection?: string;
  outcome: InterviewOutcome;
  createdAt: string;
  updatedAt: string;
}
