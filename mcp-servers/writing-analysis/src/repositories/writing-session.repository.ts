import { Injectable } from '@nestjs/common';

@Injectable()
export class WritingSessionRepository {
  async create(data: any): Promise<any> {
    // Mock implementation
    return { id: 'session-123', ...data };
  }

  async findById(id: string): Promise<any> {
    // Mock implementation
    return { id, wordCount: 500, timeSpent: 1800 };
  }

  async updateProgress(sessionId: string, metrics: any): Promise<any> {
    // Mock implementation
    return { sessionId, ...metrics, updated: true };
  }
}