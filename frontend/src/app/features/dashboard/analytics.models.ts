export interface AnalyticsMetrics {
  totalApplications: number;
  activeApplications: number;
  interviewsScheduled: number;
  offersReceived: number;
  rejections: number;
  pendingFollowUps: number;
  applicationResponseRate: number;
  interviewConversionRate: number;
}

export interface AnalyticsPoint {
  label: string;
  value: number;
}

export interface InterviewConversionPoint {
  label: string;
  applications: number;
  interviews: number;
  conversionRate: number;
}

export interface AnalyticsResponse {
  metrics: AnalyticsMetrics;
  monthlyApplications: AnalyticsPoint[];
  recruitmentStages: AnalyticsPoint[];
  applicationOutcomes: AnalyticsPoint[];
  interviewConversion: InterviewConversionPoint[];
  employmentTypes: AnalyticsPoint[];
}
