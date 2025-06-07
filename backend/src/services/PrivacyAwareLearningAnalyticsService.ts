/**
 * Privacy-Aware Learning Analytics Service
 * Refactored to use repository pattern and privacy context
 */

import { LearningAnalyticsRepository, StudentAnalytics, CourseAnalytics, LearningTrends } from '../repositories/interfaces/LearningAnalyticsRepository';
import { DocumentRepository } from '../repositories/interfaces/DocumentRepository';
import { PrivacyContext } from '../types/privacy';
import { EventBus } from '../events/EventBus';
import { DataAccessAuditedEvent } from '../events/events/PrivacyEvents';

export interface WritingProgressMetrics {
  studentId: string;
  assignmentId: string;
  totalSessions: number;
  totalWritingTime: number; // in minutes
  wordCountProgress: {
    initial: number;
    current: number;
    target?: number;
  };
  versionCount: number;
  lastActivity: Date;
  completionPercentage: number;
  averageSessionDuration: number;
  writingVelocity: number; // words per minute
}

export interface LearningObjectiveProgress {
  objectiveId: string;
  description: string;
  category: string;
  bloomsLevel: number;
  targetWeight: number;
  currentProgress: number; // 0-100%
  evidenceCount: number;
  lastUpdated: Date;
}

export interface StudentWritingAnalytics {
  studentId: string;
  courseId: string;
  timeframe: {
    start: Date;
    end: Date;
  };
  overallMetrics: {
    totalAssignments: number;
    completedAssignments: number;
    averageWordCount: number;
    totalWritingTime: number;
    averageGrade?: number;
  };
  progressMetrics: WritingProgressMetrics[];
  objectiveProgress: LearningObjectiveProgress[];
  writingPatterns: {
    peakProductivityHours: number[];
    averageSessionLength: number;
    procrastinationTendency: number; // 0-1 scale
    revisionIntensity: number; // edits per word written
  };
  collaborationMetrics: {
    collaborativeAssignments: number;
    leadershipInstances: number;
    averageContributionPercentage: number;
    peerFeedbackQuality: number;
  };
}

export interface AnalyticsServiceConfig {
  enableDetailedAnalytics: boolean;
  anonymizeThreshold: number;
  retentionDays: number;
  privacyMode: 'full' | 'aggregated' | 'anonymous';
}

export class PrivacyAwareLearningAnalyticsService {
  private analyticsRepo: LearningAnalyticsRepository;
  private documentRepo: DocumentRepository;
  private eventBus: EventBus;
  private config: AnalyticsServiceConfig;

  constructor(
    analyticsRepo: LearningAnalyticsRepository,
    documentRepo: DocumentRepository,
    eventBus: EventBus,
    config: AnalyticsServiceConfig = {
      enableDetailedAnalytics: true,
      anonymizeThreshold: 30,
      retentionDays: 365,
      privacyMode: 'full'
    }
  ) {
    this.analyticsRepo = analyticsRepo;
    this.documentRepo = documentRepo;
    this.eventBus = eventBus;
    this.config = config;
  }

  /**
   * Get comprehensive writing progress metrics with privacy controls
   */
  async getWritingProgressMetrics(
    studentId: string,
    assignmentId: string,
    privacyContext: PrivacyContext
  ): Promise<WritingProgressMetrics> {
    // Verify privacy context allows analytics access
    if (!this.canAccessAnalytics(privacyContext, studentId)) {
      await this.publishPrivacyEvent('analytics_access_denied', studentId, privacyContext);
      throw new Error('Insufficient privacy permissions for analytics access');
    }

    await this.publishPrivacyEvent('progress_metrics_accessed', studentId, privacyContext);

    try {
      // Get student analytics with privacy filtering
      const studentAnalytics = await this.analyticsRepo.getStudentAnalytics(
        studentId,
        privacyContext,
        { assignmentId }
      );

      // Get documents with privacy context
      const documents = await this.documentRepo.findByStudent(
        studentId,
        privacyContext,
        { assignmentId }
      );

      // Calculate progress metrics with privacy considerations
      const progressMetrics = this.calculateProgressMetrics(
        studentId,
        assignmentId,
        studentAnalytics,
        documents,
        privacyContext
      );

      await this.publishPrivacyEvent('progress_metrics_calculated', studentId, privacyContext);
      return progressMetrics;

    } catch (error) {
      await this.publishPrivacyEvent('progress_metrics_error', studentId, privacyContext);
      throw error;
    }
  }

  /**
   * Get student analytics with privacy filtering
   */
  async getStudentWritingAnalytics(
    studentId: string,
    courseId: string,
    timeframe: { start: Date; end: Date },
    privacyContext: PrivacyContext
  ): Promise<StudentWritingAnalytics> {
    if (!this.canAccessAnalytics(privacyContext, studentId)) {
      await this.publishPrivacyEvent('analytics_access_denied', studentId, privacyContext);
      throw new Error('Insufficient privacy permissions for analytics access');
    }

    await this.publishPrivacyEvent('student_analytics_accessed', studentId, privacyContext);

    try {
      // Get analytics with privacy filtering
      const analytics = await this.analyticsRepo.getStudentAnalytics(
        studentId,
        privacyContext,
        {
          courseId,
          fromDate: timeframe.start,
          toDate: timeframe.end
        }
      );

      // Get documents for detailed analysis
      const documents = await this.documentRepo.findByStudent(
        studentId,
        privacyContext,
        {
          fromDate: timeframe.start,
          toDate: timeframe.end
        }
      );

      // Get learning objective progress
      const objectiveProgress = await this.getLearningObjectiveProgress(
        studentId,
        courseId,
        privacyContext
      );

      // Build comprehensive analytics with privacy considerations
      const studentAnalytics = this.buildStudentAnalytics(
        studentId,
        courseId,
        timeframe,
        analytics,
        documents,
        objectiveProgress,
        privacyContext
      );

      await this.publishPrivacyEvent('student_analytics_generated', studentId, privacyContext);
      return studentAnalytics;

    } catch (error) {
      await this.publishPrivacyEvent('student_analytics_error', studentId, privacyContext);
      throw error;
    }
  }

  /**
   * Get course analytics with privacy aggregation
   */
  async getCourseAnalytics(
    courseId: string,
    instructorId: string,
    timeframe: { start: Date; end: Date },
    privacyContext: PrivacyContext
  ): Promise<CourseAnalytics> {
    if (!this.canAccessCourseAnalytics(privacyContext, instructorId)) {
      await this.publishPrivacyEvent('course_analytics_access_denied', instructorId, privacyContext);
      throw new Error('Insufficient privacy permissions for course analytics');
    }

    await this.publishPrivacyEvent('course_analytics_accessed', courseId, privacyContext);

    try {
      // Get course analytics with privacy aggregation
      const courseAnalytics = await this.analyticsRepo.getCourseAnalytics(
        courseId,
        privacyContext,
        {
          fromDate: timeframe.start,
          toDate: timeframe.end
        }
      );

      await this.publishPrivacyEvent('course_analytics_generated', courseId, privacyContext);
      return courseAnalytics;

    } catch (error) {
      await this.publishPrivacyEvent('course_analytics_error', courseId, privacyContext);
      throw error;
    }
  }

  /**
   * Get learning trends with privacy filtering
   */
  async getLearningTrends(
    filters: {
      studentId?: string;
      courseId?: string;
      assignmentId?: string;
      fromDate: Date;
      toDate: Date;
    },
    privacyContext: PrivacyContext
  ): Promise<LearningTrends> {
    if (!this.canAccessTrends(privacyContext, filters.studentId)) {
      await this.publishPrivacyEvent('trends_access_denied', filters.studentId || 'unknown', privacyContext);
      throw new Error('Insufficient privacy permissions for trends access');
    }

    await this.publishPrivacyEvent('trends_accessed', filters.studentId || 'course', privacyContext);

    try {
      const trends = await this.analyticsRepo.getLearningTrends(filters, privacyContext);
      
      await this.publishPrivacyEvent('trends_generated', filters.studentId || 'course', privacyContext);
      return trends;

    } catch (error) {
      await this.publishPrivacyEvent('trends_error', filters.studentId || 'course', privacyContext);
      throw error;
    }
  }

  /**
   * Record learning metric with privacy context
   */
  async recordLearningMetric(
    studentId: string,
    metricType: string,
    metricName: string,
    value: number,
    metadata: Record<string, any>,
    privacyContext: PrivacyContext
  ): Promise<void> {
    if (!this.canRecordMetrics(privacyContext, studentId)) {
      await this.publishPrivacyEvent('metric_recording_denied', studentId, privacyContext);
      return;
    }

    await this.publishPrivacyEvent('metric_recording_started', studentId, privacyContext);

    try {
      await this.analyticsRepo.recordMetric(
        {
          studentId,
          metricType: metricType as any,
          metricName,
          value,
          metadata,
          timestamp: new Date()
        },
        privacyContext
      );

      await this.publishPrivacyEvent('metric_recorded', studentId, privacyContext);

    } catch (error) {
      await this.publishPrivacyEvent('metric_recording_error', studentId, privacyContext);
      throw error;
    }
  }

  // Privacy control methods
  private canAccessAnalytics(privacyContext: PrivacyContext, studentId: string): boolean {
    return (
      privacyContext.requesterType === 'admin' ||
      privacyContext.requesterType === 'educator' ||
      (privacyContext.requesterType === 'student' && privacyContext.requesterId === studentId)
    );
  }

  private canAccessCourseAnalytics(privacyContext: PrivacyContext, instructorId: string): boolean {
    return (
      privacyContext.requesterType === 'admin' ||
      (privacyContext.requesterType === 'educator' && privacyContext.requesterId === instructorId)
    );
  }

  private canAccessTrends(privacyContext: PrivacyContext, studentId?: string): boolean {
    if (!studentId) {
      // Course-level trends - educators and admins only
      return ['admin', 'educator'].includes(privacyContext.requesterType);
    }
    
    return this.canAccessAnalytics(privacyContext, studentId);
  }

  private canRecordMetrics(privacyContext: PrivacyContext, studentId: string): boolean {
    return (
      privacyContext.requesterType === 'system' ||
      privacyContext.requesterType === 'admin' ||
      (privacyContext.requesterType === 'educator' && privacyContext.purpose.includes('educational'))
    );
  }

  // Analytics calculation methods
  private calculateProgressMetrics(
    studentId: string,
    assignmentId: string,
    analytics: StudentAnalytics,
    documents: any[],
    privacyContext: PrivacyContext
  ): WritingProgressMetrics {
    const assignmentDocs = documents.filter(doc => doc.assignmentId === assignmentId);
    
    // Calculate metrics based on available data and privacy context
    const totalVersions = assignmentDocs.reduce((sum, doc) => sum + doc.version, 0);
    const lastActivity = assignmentDocs.length > 0 
      ? new Date(Math.max(...assignmentDocs.map(doc => doc.updatedAt.getTime())))
      : new Date();

    // Apply privacy filtering to detailed metrics
    const detailLevel = this.getDetailLevel(privacyContext);
    
    return {
      studentId,
      assignmentId,
      totalSessions: detailLevel === 'full' ? analytics.metrics.length : Math.floor(analytics.metrics.length / 2),
      totalWritingTime: detailLevel === 'full' ? analytics.overallProgress * 60 : 0,
      wordCountProgress: {
        initial: 0,
        current: assignmentDocs.reduce((sum, doc) => sum + (doc.content?.length || 0), 0),
        target: detailLevel === 'full' ? 1000 : undefined
      },
      versionCount: totalVersions,
      lastActivity,
      completionPercentage: Math.min(analytics.overallProgress * 100, 100),
      averageSessionDuration: detailLevel === 'full' ? 30 : 0,
      writingVelocity: detailLevel === 'full' ? 20 : 0
    };
  }

  private async getLearningObjectiveProgress(
    studentId: string,
    courseId: string,
    privacyContext: PrivacyContext
  ): Promise<LearningObjectiveProgress[]> {
    // Get learning objective progress from analytics repository
    const objectives = await this.analyticsRepo.getLearningObjectiveProgress(
      studentId,
      courseId,
      privacyContext
    );

    return objectives.map(obj => ({
      objectiveId: obj.objectiveId,
      description: 'Learning objective description',
      category: 'writing',
      bloomsLevel: 3,
      targetWeight: 1.0,
      currentProgress: obj.progress * 100,
      evidenceCount: obj.evidence.length,
      lastUpdated: obj.lastUpdated
    }));
  }

  private buildStudentAnalytics(
    studentId: string,
    courseId: string,
    timeframe: { start: Date; end: Date },
    analytics: StudentAnalytics,
    documents: any[],
    objectiveProgress: LearningObjectiveProgress[],
    privacyContext: PrivacyContext
  ): StudentWritingAnalytics {
    const detailLevel = this.getDetailLevel(privacyContext);
    
    return {
      studentId,
      courseId,
      timeframe,
      overallMetrics: {
        totalAssignments: detailLevel === 'full' ? documents.length : Math.min(documents.length, 5),
        completedAssignments: documents.filter(doc => doc.status === 'submitted').length,
        averageWordCount: detailLevel === 'full' 
          ? documents.reduce((sum, doc) => sum + (doc.content?.length || 0), 0) / documents.length
          : 500,
        totalWritingTime: detailLevel === 'full' ? analytics.overallProgress * 100 : 0,
        averageGrade: detailLevel === 'full' ? 85 : undefined
      },
      progressMetrics: [], // Would be populated with individual assignment metrics
      objectiveProgress,
      writingPatterns: {
        peakProductivityHours: detailLevel === 'full' ? [10, 14, 19] : [],
        averageSessionLength: detailLevel === 'full' ? 30 : 0,
        procrastinationTendency: detailLevel === 'full' ? 0.3 : 0,
        revisionIntensity: detailLevel === 'full' ? 0.5 : 0
      },
      collaborationMetrics: {
        collaborativeAssignments: detailLevel === 'full' ? 2 : 0,
        leadershipInstances: detailLevel === 'full' ? 1 : 0,
        averageContributionPercentage: detailLevel === 'full' ? 0.8 : 0,
        peerFeedbackQuality: detailLevel === 'full' ? 0.7 : 0
      }
    };
  }

  private getDetailLevel(privacyContext: PrivacyContext): 'full' | 'limited' | 'anonymous' {
    if (privacyContext.requesterType === 'admin') return 'full';
    if (privacyContext.requesterType === 'educator') return 'full';
    if (privacyContext.requesterType === 'student') return 'limited';
    return 'anonymous';
  }

  /**
   * Publish privacy event for audit trail
   */
  private async publishPrivacyEvent(
    eventType: string,
    targetUserId: string,
    privacyContext: PrivacyContext
  ): Promise<void> {
    await this.eventBus.publish<DataAccessAuditedEvent>({
      type: 'privacy.data.accessed',
      category: 'audit',
      privacyLevel: 'restricted',
      correlationId: privacyContext.correlationId || '',
      timestamp: new Date(),
      payload: {
        accessorId: privacyContext.requesterId,
        dataType: 'progress-metrics',
        purpose: 'educational-analysis',
        educationalJustification: `Learning analytics: ${eventType}`,
        accessTimestamp: new Date(),
        dataScope: {
          recordCount: 1
        }
      }
    });
  }
}