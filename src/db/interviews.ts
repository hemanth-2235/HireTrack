import { db } from './index.ts';
import { interviews } from './schema.ts';
import { eq, and, desc } from 'drizzle-orm';

export interface CreateInterviewInput {
  applicationId: number;
  userId: string;
  companyName: string;
  jobRole: string;
  interviewDate: string;
  interviewTime: string;
  interviewType?: string;
  round?: string;
  interviewer?: string;
  meetingLink?: string;
  notes?: string;
  status?: string;
}

export async function getInterviews(userId: string) {
  try {
    return await db
      .select()
      .from(interviews)
      .where(eq(interviews.userId, userId))
      .orderBy(desc(interviews.interviewDate), desc(interviews.interviewTime));
  } catch (error) {
    console.error('Error fetching interviews:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getInterviewsByApplication(applicationId: number, userId: string) {
  try {
    return await db
      .select()
      .from(interviews)
      .where(and(eq(interviews.applicationId, applicationId), eq(interviews.userId, userId)))
      .orderBy(desc(interviews.interviewDate), desc(interviews.interviewTime));
  } catch (error) {
    console.error('Error fetching application interviews:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function createInterview(data: CreateInterviewInput) {
  try {
    const result = await db
      .insert(interviews)
      .values({
        applicationId: data.applicationId,
        userId: data.userId,
        companyName: data.companyName.trim(),
        jobRole: data.jobRole.trim(),
        interviewDate: data.interviewDate,
        interviewTime: data.interviewTime,
        interviewType: data.interviewType || 'Online',
        round: data.round || 'Technical',
        interviewer: data.interviewer?.trim() || null,
        meetingLink: data.meetingLink?.trim() || null,
        notes: data.notes?.trim() || null,
        status: data.status || 'Scheduled',
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error creating interview:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function updateInterview(
  id: number,
  userId: string,
  data: Partial<CreateInterviewInput>
) {
  try {
    const updateData: Record<string, any> = {};

    if (data.companyName !== undefined) updateData.companyName = data.companyName.trim();
    if (data.jobRole !== undefined) updateData.jobRole = data.jobRole.trim();
    if (data.interviewDate !== undefined) updateData.interviewDate = data.interviewDate;
    if (data.interviewTime !== undefined) updateData.interviewTime = data.interviewTime;
    if (data.interviewType !== undefined) updateData.interviewType = data.interviewType;
    if (data.round !== undefined) updateData.round = data.round;
    if (data.interviewer !== undefined) updateData.interviewer = data.interviewer ? data.interviewer.trim() : null;
    if (data.meetingLink !== undefined) updateData.meetingLink = data.meetingLink ? data.meetingLink.trim() : null;
    if (data.notes !== undefined) updateData.notes = data.notes !== null ? data.notes.trim() : null;
    if (data.status !== undefined) updateData.status = data.status;

    const result = await db
      .update(interviews)
      .set(updateData)
      .where(and(eq(interviews.id, id), eq(interviews.userId, userId)))
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error('Error updating interview:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function deleteInterview(id: number, userId: string) {
  try {
    const result = await db
      .delete(interviews)
      .where(and(eq(interviews.id, id), eq(interviews.userId, userId)))
      .returning({ id: interviews.id });
    return result.length > 0;
  } catch (error) {
    console.error('Error deleting interview:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}
