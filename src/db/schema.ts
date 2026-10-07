import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  name: text('name'),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // References Firebase Auth UID
  companyName: text('company_name').notNull(),
  jobTitle: text('job_title').notNull(),
  location: text('location').default('Remote'),
  jobType: text('job_type').default('Full Time'), // Full Time, Part Time, Contract, Internship, Remote
  applicationDate: text('application_date').notNull(), // Format: YYYY-MM-DD
  jobUrl: text('job_url'),
  salary: text('salary'),
  status: text('status').notNull().default('Applied'), // Applied, Shortlisted, Interview, Offer, Rejected, Withdrawn
  recruiterName: text('recruiter_name'),
  recruiterEmail: text('recruiter_email'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const interviews = pgTable('interviews', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id')
    .references(() => applications.id, { onDelete: 'cascade' })
    .notNull(),
  userId: text('user_id').notNull(), // References Firebase Auth UID
  companyName: text('company_name').notNull(),
  jobRole: text('job_role').notNull(),
  interviewDate: text('interview_date').notNull(), // YYYY-MM-DD
  interviewTime: text('interview_time').notNull(), // HH:MM
  interviewType: text('interview_type').default('Online'), // Online, Phone, In-person
  round: text('round').default('Technical'), // HR, Technical, Managerial, Final
  interviewer: text('interviewer'),
  meetingLink: text('meeting_link'),
  notes: text('notes'),
  status: text('status').default('Scheduled'), // Scheduled, Completed, Cancelled, Passed
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  user: one(users, {
    fields: [applications.userId],
    references: [users.uid],
  }),
  interviews: many(interviews),
}));

export const interviewsRelations = relations(interviews, ({ one }) => ({
  application: one(applications, {
    fields: [interviews.applicationId],
    references: [applications.id],
  }),
}));
