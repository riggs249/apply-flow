export type ReminderType =
  | 'RECRUITER_FOLLOW_UP'
  | 'UPCOMING_INTERVIEW'
  | 'ASSESSMENT_DEADLINE'
  | 'APPLICATION_DEADLINE'
  | 'CUSTOM';

export type ReminderStatus = 'PENDING' | 'OVERDUE' | 'COMPLETED' | 'CANCELLED';

export interface ReminderRecord {
  id: string;
  applicationId?: string;
  applicationPosition?: string;
  companyName?: string;
  title: string;
  description?: string;
  reminderType: ReminderType;
  status: ReminderStatus;
  remindAt: string;
  completedAt?: string;
  timingState: 'UPCOMING' | 'OVERDUE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}
