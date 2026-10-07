export type ApplicationStatus =
  | 'Applied'
  | 'Shortlisted'
  | 'Interview'
  | 'Offer'
  | 'Rejected'
  | 'Withdrawn';

export type JobType =
  | 'Full Time'
  | 'Part Time'
  | 'Contract'
  | 'Internship'
  | 'Remote';

export type InterviewType = 'Online' | 'Phone' | 'In-person';

export type InterviewRound = 'HR' | 'Technical' | 'Managerial' | 'Final';

export type InterviewStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'Passed';

export interface JobApplication {
  id: number;
  userId: string;
  companyName: string;
  jobTitle: string;
  location: string;
  jobType: string;
  applicationDate: string;
  jobUrl?: string | null;
  salary?: string | null;
  status: ApplicationStatus;
  recruiterName?: string | null;
  recruiterEmail?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface Interview {
  id: number;
  applicationId: number;
  userId: string;
  companyName: string;
  jobRole: string;
  interviewDate: string;
  interviewTime: string;
  interviewType: InterviewType;
  round: InterviewRound;
  interviewer?: string | null;
  meetingLink?: string | null;
  notes?: string | null;
  status: InterviewStatus;
  createdAt?: string | null;
}

export interface AnalyticsOverview {
  totalApplications: number;
  applicationsThisMonth: number;
  appliedCount: number;
  shortlistedCount: number;
  interviewCount: number;
  offerCount: number;
  rejectedCount: number;
  withdrawnCount: number;
  totalInterviews: number;
  upcomingInterviews: number;
  completedInterviews: number;
  interviewConversionRate: number; // percentage
  offerConversionRate: number; // percentage
  statusDistribution: { status: ApplicationStatus; count: number; color: string }[];
  monthlyDistribution: { month: string; count: number }[];
  topCompanies: { company: string; count: number }[];
  funnelData: { stage: string; count: number; percentage: number }[];
}

export interface UserProfile {
  uid: string;
  email: string;
  name?: string | null;
}
