import { WritingSession, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { WritingSessionRepository as IWritingSessionRepository } from './interfaces';

/**
 * Prisma implementation of WritingSessionRepository
 */
export class PrismaWritingSessionRepository implements IWritingSessionRepository {
  async findById(id: string): Promise<WritingSession | null> {
    return await prisma.writingSession.findUnique({
      where: { id }
    });
  }

  async findByUser(userId: string, options?: {
    assignmentId?: string;
    documentId?: string;
    startDate?: Date;
    endDate?: Date;
    includeDocument?: boolean;
  }): Promise<WritingSession[]> {
    const where: any = { userId };

    if (options?.assignmentId) {
      where.document = { assignmentId: options.assignmentId };
    }
    if (options?.documentId) {
      where.documentId = options.documentId;
    }
    if (options?.startDate || options?.endDate) {
      where.startTime = {};
      if (options.startDate) where.startTime.gte = options.startDate;
      if (options.endDate) where.startTime.lte = options.endDate;
    }

    return await prisma.writingSession.findMany({
      where,
      include: options?.includeDocument ? { document: true } : undefined,
      orderBy: { startTime: 'asc' }
    });
  }

  async findByAssignment(assignmentId: string, userId?: string): Promise<WritingSession[]> {
    const where: any = {
      document: { assignmentId }
    };
    if (userId) where.userId = userId;

    return await prisma.writingSession.findMany({
      where,
      include: { document: true },
      orderBy: { startTime: 'asc' }
    });
  }

  async findByCourse(courseId: string, userId?: string, timeframeDays?: number): Promise<WritingSession[]> {
    const where: any = {
      document: {
        assignment: { courseId }
      }
    };
    
    if (userId) where.userId = userId;
    if (timeframeDays) {
      const startDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000);
      where.startTime = { gte: startDate };
    }

    return await prisma.writingSession.findMany({
      where,
      include: {
        document: {
          include: {
            assignment: true
          }
        }
      },
      orderBy: { startTime: 'asc' }
    });
  }

  async create(data: {
    userId: string;
    documentId: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    activity?: any;
  }): Promise<WritingSession> {
    return await prisma.writingSession.create({
      data
    });
  }

  async update(id: string, data: Prisma.WritingSessionUpdateInput): Promise<WritingSession> {
    return await prisma.writingSession.update({
      where: { id },
      data
    });
  }

  async getSessionStats(sessionIds: string[]): Promise<{
    totalDuration: number;
    totalWordsWritten: number;
    totalWordsDeleted: number;
    averageProductivity: number;
  }> {
    const sessions = await prisma.writingSession.findMany({
      where: { id: { in: sessionIds } }
    });

    let totalDuration = 0;
    let totalWordsWritten = 0;
    let totalWordsDeleted = 0;

    sessions.forEach(session => {
      totalDuration += session.duration || 0;
      const activity = session.activity as any;
      if (activity) {
        totalWordsWritten += activity.wordsAdded || 0;
        totalWordsDeleted += activity.wordsDeleted || 0;
      }
    });

    const averageProductivity = totalDuration > 0 
      ? (totalWordsWritten / (totalDuration / 60)) 
      : 0;

    return {
      totalDuration,
      totalWordsWritten,
      totalWordsDeleted,
      averageProductivity
    };
  }
}