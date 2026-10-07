import { db } from './index.ts';
import { applications, interviews } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function seedUserDataIfEmpty(userId: string) {
  try {
    const existing = await db
      .select({ id: applications.id })
      .from(applications)
      .where(eq(applications.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      return false; // Already has data
    }

    // Insert rich sample applications representing real-world job hunt
    const sampleApps = [
      {
        userId,
        companyName: 'Deloitte',
        jobTitle: 'Data Analyst',
        location: 'Hyderabad, India (Hybrid)',
        jobType: 'Full Time',
        applicationDate: '2026-09-15',
        jobUrl: 'https://careers.deloitte.com/jobs/data-analyst',
        salary: '₹14 - ₹18 LPA',
        status: 'Interview',
        recruiterName: 'Johnathan Miller',
        recruiterEmail: 'jmiller@deloitte.com',
        notes: 'Technical Interview: Discussed SQL joins, Python Pandas, window functions, and Power BI dashboard architectures. Follow-up: Send recruiter follow-up email after 3 days.',
      },
      {
        userId,
        companyName: 'TCS',
        jobTitle: 'Data Analyst / Associate Consultant',
        location: 'Bengaluru, India',
        jobType: 'Full Time',
        applicationDate: '2026-09-10',
        jobUrl: 'https://ibegin.tcs.com',
        salary: '₹12 - ₹15 LPA',
        status: 'Interview',
        recruiterName: 'Pooja Sharma',
        recruiterEmail: 'pooja.s@tcs.com',
        notes: 'Cleared technical round 1 on Sept 14. Managerial and scenario-based questions scheduled.',
      },
      {
        userId,
        companyName: 'Infosys',
        jobTitle: 'Full-Stack Developer',
        location: 'Pune, India',
        jobType: 'Full Time',
        applicationDate: '2026-09-08',
        jobUrl: 'https://careers.infosys.com/job/fsd',
        salary: '₹11 - ₹14 LPA',
        status: 'Shortlisted',
        recruiterName: 'Anil Deshmukh',
        recruiterEmail: 'anil.d@infosys.com',
        notes: 'Resume selected through employee referral. Awaiting technical assessment test link.',
      },
      {
        userId,
        companyName: 'Accenture',
        jobTitle: 'Business Systems Analyst',
        location: 'Hyderabad, India',
        jobType: 'Full Time',
        applicationDate: '2026-08-28',
        jobUrl: 'https://accenture.com/careers/analyst',
        salary: '₹13 LPA',
        status: 'Rejected',
        recruiterName: 'Sarah Jenkins',
        recruiterEmail: 's.jenkins@accenture.com',
        notes: 'Feedback: Looking for more experience in SAP integration. Reapply after 6 months.',
      },
      {
        userId,
        companyName: 'Microsoft',
        jobTitle: 'Software Engineer II',
        location: 'Hyderabad, India (Hybrid)',
        jobType: 'Full Time',
        applicationDate: '2026-08-14',
        jobUrl: 'https://careers.microsoft.com',
        salary: '₹32 - ₹38 LPA',
        status: 'Offer',
        recruiterName: 'Kavita Reddy',
        recruiterEmail: 'kavita.r@microsoft.com',
        notes: 'Formal offer received! Base salary ₹34 LPA + stocks & joining bonus. Need to accept by Sept 25.',
      },
      {
        userId,
        companyName: 'Amazon',
        jobTitle: 'Cloud Support Associate',
        location: 'Bengaluru, India',
        jobType: 'Full Time',
        applicationDate: '2026-09-01',
        jobUrl: 'https://amazon.jobs',
        salary: '₹16 LPA',
        status: 'Applied',
        recruiterName: 'Talent Acquisition Team',
        recruiterEmail: 'careers@amazon.com',
        notes: 'Applied via company portal. Application under preliminary screening.',
      },
      {
        userId,
        companyName: 'Google',
        jobTitle: 'Application Engineer',
        location: 'Bengaluru, India',
        jobType: 'Full Time',
        applicationDate: '2026-08-05',
        jobUrl: 'https://careers.google.com',
        salary: '₹35 - ₹42 LPA',
        status: 'Offer',
        recruiterName: 'Vikram Mehta',
        recruiterEmail: 'vmehta@google.com',
        notes: 'Passed Google Hiring Committee review! Offer letter issued for Core Engineering team.',
      },
      {
        userId,
        companyName: 'Wipro',
        jobTitle: 'Senior Software Engineer',
        location: 'Hyderabad, India',
        jobType: 'Full Time',
        applicationDate: '2026-07-20',
        jobUrl: 'https://careers.wipro.com',
        salary: '₹14 LPA',
        status: 'Withdrawn',
        recruiterName: 'Ramesh Babu',
        recruiterEmail: 'rbabu@wipro.com',
        notes: 'Withdrew application after receiving higher offers.',
      },
    ];

    const insertedApps = await db.insert(applications).values(sampleApps).returning();

    // Map interviews to inserted applications
    const deloitteApp = insertedApps.find((a) => a.companyName === 'Deloitte');
    const tcsApp = insertedApps.find((a) => a.companyName === 'TCS');
    const microsoftApp = insertedApps.find((a) => a.companyName === 'Microsoft');

    const sampleInterviews = [];

    if (deloitteApp) {
      sampleInterviews.push({
        applicationId: deloitteApp.id,
        userId,
        companyName: 'Deloitte',
        jobRole: 'Data Analyst',
        interviewDate: '2026-09-22',
        interviewTime: '15:00',
        interviewType: 'Online',
        round: 'Technical',
        interviewer: 'Ravi Teja (Tech Lead)',
        meetingLink: 'https://teams.microsoft.com/deloitte-round2-call',
        notes: 'Prepare Python live coding for data transformation, pandas groupby exercises, and Power BI modeling.',
        status: 'Scheduled',
      });
    }

    if (tcsApp) {
      sampleInterviews.push({
        applicationId: tcsApp.id,
        userId,
        companyName: 'TCS',
        jobRole: 'Data Analyst',
        interviewDate: '2026-09-24',
        interviewTime: '11:30',
        interviewType: 'Online',
        round: 'Managerial',
        interviewer: 'Pooja Sharma & Delivery Head',
        meetingLink: 'https://teams.microsoft.com/tcs-interview',
        notes: 'Review project architecture, client stakeholder management experiences, and Agile methodology questions.',
        status: 'Scheduled',
      });
    }

    if (microsoftApp) {
      sampleInterviews.push({
        applicationId: microsoftApp.id,
        userId,
        companyName: 'Microsoft',
        jobRole: 'Software Engineer II',
        interviewDate: '2026-08-29',
        interviewTime: '14:00',
        interviewType: 'Online',
        round: 'Final',
        interviewer: 'Partner Engineering Director',
        meetingLink: 'https://teams.microsoft.com/msft-round5',
        notes: 'Final leadership and system architecture discussion. Completed and passed with highest recommendation.',
        status: 'Completed',
      });
    }

    if (sampleInterviews.length > 0) {
      await db.insert(interviews).values(sampleInterviews);
    }

    return true;
  } catch (error) {
    console.error('Seed user data error:', error);
    return false;
  }
}
