import { Injectable, Logger } from '@nestjs/common';
import { WritingSessionRepository } from '../../repositories/writing-session.repository';
import { StudentPreferenceRepository } from '../../repositories/student-preference.repository';
import { AuditLoggerService } from '../../content-privacy/services/audit-logger.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface WritingProgressRequest {
  userId: string;
  sessionId: string;
  metrics: {
    wordCount: number;
    timeSpent: number;
    revisions: number;
  };
  role: 'student' | 'educator' | 'administrator';
  purpose: string;
  consent?: boolean;
}

export interface WritingProgressResult {
  sessionId: string;
  progressRecorded: boolean;
  privacyCompliant: boolean;
  aggregatedMetrics?: {
    totalWords: number;
    totalTime: number;
    averageWordsPerMinute: number;
  };
}

@Injectable()
export class WritingProgressTrackerService {
  private readonly logger = new Logger(WritingProgressTrackerService.name);

  constructor(
    private writingSessionRepository: WritingSessionRepository,
    private studentPreferenceRepository: StudentPreferenceRepository,
    private auditLogger: AuditLoggerService,
    private eventEmitter: EventEmitter2,
  ) {}

  async trackProgress(request: WritingProgressRequest): Promise<WritingProgressResult> {
    this.logger.log(`Tracking progress for session ${request.sessionId}`);

    // Check consent and preferences
    const preferences = await this.studentPreferenceRepository.getPreferences(request.userId);
    const hasConsent = request.consent || preferences.consentStatus.general;

    if (!hasConsent) {
      this.logger.warn('No consent for progress tracking', { userId: request.userId });
      return {
        sessionId: request.sessionId,
        progressRecorded: false,
        privacyCompliant: false,
      };
    }

    // Update session with privacy-aware data
    const privacyAwareMetrics = this.applyPrivacyFilters(request.metrics, preferences);
    
    await this.writingSessionRepository.updateProgress(
      request.sessionId,
      privacyAwareMetrics
    );

    // Log the access
    await this.auditLogger.logAccess({
      accessType: 'write',
      dataType: 'writing_progress',
      userId: request.userId,
      accessedBy: request.userId,
      purpose: request.purpose,
    });

    // Calculate aggregated metrics for privacy-safe sharing
    const aggregatedMetrics = await this.calculateAggregatedMetrics(
      request.userId,
      request.sessionId
    );

    // Emit progress event
    await this.eventEmitter.emit('writing.progress.updated', {
      userId: request.userId,
      sessionId: request.sessionId,
      metrics: privacyAwareMetrics,
      timestamp: new Date(),
    });

    // Check for intervention triggers
    await this.checkInterventionTriggers(request.userId, aggregatedMetrics);

    return {
      sessionId: request.sessionId,
      progressRecorded: true,
      privacyCompliant: true,
      aggregatedMetrics: preferences.privacySettings.allowAnalytics ? aggregatedMetrics : undefined,
    };
  }

  private applyPrivacyFilters(metrics: any, preferences: any): any {
    const filtered = { ...metrics };

    // Apply differential privacy noise if configured
    if (preferences.privacySettings.differentialPrivacy) {
      filtered.wordCount = this.addDifferentialNoise(metrics.wordCount, 0.1);
      filtered.timeSpent = this.addDifferentialNoise(metrics.timeSpent, 0.1);
    }

    // Round to reduce precision
    filtered.wordCount = Math.round(filtered.wordCount / 10) * 10;
    filtered.timeSpent = Math.round(filtered.timeSpent / 60) * 60;

    return filtered;
  }

  private addDifferentialNoise(value: number, epsilon: number): number {
    // Simplified Laplace noise
    const b = 1 / epsilon;
    const u = Math.random() - 0.5;
    const noise = -b * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
    return Math.max(0, value + noise);
  }

  private async calculateAggregatedMetrics(userId: string, sessionId: string): Promise<any> {
    const session = await this.writingSessionRepository.findById(sessionId);
    
    if (!session) {
      return null;
    }

    const wordsPerMinute = session.timeSpent > 0 
      ? (session.wordCount / (session.timeSpent / 60)) 
      : 0;

    return {
      totalWords: session.wordCount,
      totalTime: session.timeSpent,
      averageWordsPerMinute: Math.round(wordsPerMinute * 10) / 10,
    };
  }

  private async checkInterventionTriggers(userId: string, metrics: any): Promise<void> {
    if (!metrics) return;

    const triggers = [];

    // Check for writing blocks (low words per minute)
    if (metrics.averageWordsPerMinute < 5 && metrics.totalTime > 600) {
      triggers.push('writing_block_detected');
    }

    // Check for marathon sessions
    if (metrics.totalTime > 7200) { // 2 hours
      triggers.push('extended_session');
    }

    if (triggers.length > 0) {
      await this.eventEmitter.emit('intervention.needed', {
        userId,
        triggers,
        metrics,
        timestamp: new Date(),
      });
    }
  }
}