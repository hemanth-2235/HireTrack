import { db } from './index.ts';
import { applications } from './schema.ts';
import { eq, and, desc, sql } from 'drizzle-orm';

export interface CreateApplicationInput {
  userId: string;
  companyName: string;
  jobTitle: string;
  location?: string;
  jobType?: string;
  applicationDate: string;
  jobUrl?: string;
  salary?: string;
  status?: string;
  recruiterName?: string;
  recruiterEmail?: string;
  notes?: string;
}

export async function getApplications(userId: string) {
  try {
    return await db
      .select()
      .from(applications)
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.applicationDate), desc(applications.id));
  } catch (error) {
    console.error('Error fetching applications:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getApplicationById(id: number, userId: string) {
  try {
    const result = await db
      .select()
      .from(applications)
      .where(and(eq(applications.id, id), eq(applications.userId, userId)))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error('Error fetching application by id:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function createApplication(data: CreateApplicationInput) {
  try {
    const result = await db
      .insert(applications)
      .values({
        userId: data.userId,
        companyName: data.companyName.trim(),
        jobTitle: data.jobTitle.trim(),
        location: data.location?.trim() || 'Remote',
        jobType: data.jobType || 'Full Time',
        applicationDate: data.applicationDate,
        jobUrl: data.jobUrl?.trim() || null,
        salary: data.salary?.trim() || null,
        status: data.status || 'Applied',
        recruiterName: data.recruiterName?.trim() || null,
        recruiterEmail: data.recruiterEmail?.trim() || null,
        notes: data.notes?.trim() || null,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error creating application:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function updateApplication(
  id: number,
  userId: string,
  data: Partial<CreateApplicationInput>
) {
  try {
    const updateData: Record<string, any> = {
      updatedAt: sql`NOW()`,
    };

    if (data.companyName !== undefined) updateData.companyName = data.companyName.trim();
    if (data.jobTitle !== undefined) updateData.jobTitle = data.jobTitle.trim();
    if (data.location !== undefined) updateData.location = data.location.trim();
    if (data.jobType !== undefined) updateData.jobType = data.jobType;
    if (data.applicationDate !== undefined) updateData.applicationDate = data.applicationDate;
    if (data.jobUrl !== undefined) updateData.jobUrl = data.jobUrl ? data.jobUrl.trim() : null;
    if (data.salary !== undefined) updateData.salary = data.salary ? data.salary.trim() : null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.recruiterName !== undefined) updateData.recruiterName = data.recruiterName ? data.recruiterName.trim() : null;
    if (data.recruiterEmail !== undefined) updateData.recruiterEmail = data.recruiterEmail ? data.recruiterEmail.trim() : null;
    if (data.notes !== undefined) updateData.notes = data.notes !== null ? data.notes.trim() : null;

    const result = await db
      .update(applications)
      .set(updateData)
      .where(and(eq(applications.id, id), eq(applications.userId, userId)))
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error('Error updating application:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function deleteApplication(id: number, userId: string) {
  try {
    const result = await db
      .delete(applications)
      .where(and(eq(applications.id, id), eq(applications.userId, userId)))
      .returning({ id: applications.id });
    return result.length > 0;
  } catch (error) {
    console.error('Error deleting application:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}
