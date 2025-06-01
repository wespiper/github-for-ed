/**
 * Privacy-Aware Intervention Engine
 * Refactored to use repository pattern and privacy context
 */

import { InterventionRepository, Intervention } from '../repositories/interfaces/InterventionRepository';
import { LearningAnalyticsRepository } from '../repositories/interfaces/LearningAnalyticsRepository';
import { DocumentRepository } from '../repositories/interfaces/DocumentRepository';
import { PrivacyContext } from '../types/privacy';
import { EventBus } from '../events/EventBus';
import { DataAccessAuditedEvent } from '../events/events/PrivacyEvents';

export interface InterventionAlert {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  suggestedActions: string[];
  studentId: string;
  context?: {
    course?: string;
    assignment?: string;
    submission?: string;
  };
  deadline?: Date;
  metrics?: {
    currentValue: number;
    previousValue?: number;
    threshold?: number;
    trend: 'improving' | 'declining' | 'stable';
  };
}

export interface InterventionEngineConfig {
  productivityThreshold: number;
  procrastinationDaysThreshold: number;
  qualityThreshold: number;
  timeManagementThreshold: number;
}

export class PrivacyAwareInterventionEngine {
  private interventionRepo: InterventionRepository;
  private analyticsRepo: LearningAnalyticsRepository;
  private documentRepo: DocumentRepository;
  private eventBus: EventBus;
  private config: InterventionEngineConfig;

  constructor(
    interventionRepo: InterventionRepository,
    analyticsRepo: LearningAnalyticsRepository,
    documentRepo: DocumentRepository,
    eventBus: EventBus,
    config: InterventionEngineConfig = {
      productivityThreshold: 0.6,
      procrastinationDaysThreshold: 3,
      qualityThreshold: 0.7,
      timeManagementThreshold: 2.0
    }
  ) {
    this.interventionRepo = interventionRepo;
    this.analyticsRepo = analyticsRepo;
    this.documentRepo = documentRepo;
    this.eventBus = eventBus;
    this.config = config;
  }

  /**
   * Comprehensive writing progress analysis for a student with privacy controls
   */
  async analyzeStudentWritingProgress(
    studentId: string, 
    privacyContext: PrivacyContext,
    courseId?: string, 
    timeframeDays: number = 7
  ): Promise<InterventionAlert[]> {
    // Verify privacy context allows intervention analysis
    if (!this.canPerformInterventionAnalysis(privacyContext, studentId)) {
      await this.publishPrivacyEvent('intervention_access_denied', studentId, privacyContext);
      return [];
    }

    // Log data access for privacy audit
    await this.publishPrivacyEvent('intervention_analysis_started', studentId, privacyContext);

    try {
      const interventions: InterventionAlert[] = [];

      // Get student analytics with privacy filtering
      const studentAnalytics = await this.analyticsRepo.getStudentAnalytics(
        studentId,
        privacyContext,
        {
          fromDate: new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000),
          toDate: new Date()
        }
      );

      // Get student documents with privacy filtering
      const documents = await this.documentRepo.findByStudent(
        studentId,
        privacyContext,
        {
          fromDate: new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000)
        }
      );

      // 1. Writing Productivity Analysis (privacy-aware)
      const productivityIntervention = await this.analyzeWritingProductivity(
        studentId, studentAnalytics, documents, timeframeDays, privacyContext
      );
      if (productivityIntervention) interventions.push(productivityIntervention);

      // 2. Assignment Progress Detection (privacy-aware)
      const progressIntervention = await this.detectProgressIssues(
        studentId, studentAnalytics, documents, privacyContext
      );
      if (progressIntervention) interventions.push(progressIntervention);

      // 3. Quality Concerns (privacy-aware)
      const qualityIntervention = await this.analyzeWritingQuality(
        studentId, studentAnalytics, privacyContext
      );
      if (qualityIntervention) interventions.push(qualityIntervention);

      // Create intervention records with privacy metadata
      for (const alert of interventions) {
        await this.createInterventionRecord(alert, privacyContext);
      }

      await this.publishPrivacyEvent('intervention_analysis_completed', studentId, privacyContext);
      return interventions;

    } catch (error) {
      await this.publishPrivacyEvent('intervention_analysis_error', studentId, privacyContext);
      throw error;
    }
  }

  /**
   * Analyze writing productivity with privacy context
   */
  private async analyzeWritingProductivity(
    studentId: string,
    analytics: any,
    documents: any[],
    timeframeDays: number,
    privacyContext: PrivacyContext
  ): Promise<InterventionAlert | null> {
    if (documents.length === 0) {
      return {
        type: 'no_recent_activity',
        severity: 'warning',
        title: 'No Recent Writing Activity',
        message: `Student has not engaged in any writing activities for ${timeframeDays} days.`,
        suggestedActions: [
          'Schedule one-on-one check-in meeting',
          'Send encouraging message with assignment reminders',
          'Provide writing support resources',
          'Consider extending deadlines if appropriate'
        ],
        studentId,
        metrics: {
          currentValue: 0,
          threshold: 1,
          trend: 'declining'
        }
      };
    }

    // Calculate productivity metrics from privacy-filtered data
    const currentProgress = analytics.overallProgress || 0;
    const progressTrend = analytics.progressTrend || 'stable';

    // Check for productivity decline using privacy-safe thresholds
    if (currentProgress < this.config.productivityThreshold && progressTrend === 'declining') {
      return {
        type: 'writing_productivity_decline',
        severity: 'warning',
        title: 'Writing Productivity Declining',
        message: `Student's writing progress appears to be declining based on available data.`,
        suggestedActions: [
          'Schedule writing conference to understand barriers',
          'Break assignments into smaller, manageable chunks',
          'Provide writing process scaffolding',
          'Recommend time management strategies'
        ],
        studentId,
        metrics: {
          currentValue: currentProgress,
          threshold: this.config.productivityThreshold,
          trend: progressTrend as any
        }
      };
    }

    return null;
  }

  /**
   * Detect progress issues with privacy awareness
   */
  private async detectProgressIssues(
    studentId: string,
    analytics: any,
    documents: any[],
    privacyContext: PrivacyContext
  ): Promise<InterventionAlert | null> {
    // Only analyze if privacy context allows progress tracking
    if (!this.canAnalyzeProgress(privacyContext)) {
      return null;
    }

    const inProgressDocuments = documents.filter(doc => doc.status === 'in_progress');
    const overdueDocuments = documents.filter(doc => 
      doc.status !== 'submitted' && 
      doc.assignment?.dueDate && 
      new Date(doc.assignment.dueDate) < new Date()
    );

    if (overdueDocuments.length > 0) {
      return {
        type: 'assignment_overdue',
        severity: 'critical',
        title: 'Assignments Past Due',
        message: `Student has ${overdueDocuments.length} overdue assignment(s).`,
        suggestedActions: [
          'Contact student immediately about overdue work',
          'Discuss challenges and potential solutions',
          'Consider deadline extension if appropriate',
          'Provide additional support resources'
        ],
        studentId,
        metrics: {
          currentValue: overdueDocuments.length,
          threshold: 0,
          trend: 'declining'
        }
      };
    }

    return null;
  }

  /**
   * Analyze writing quality with privacy protections
   */
  private async analyzeWritingQuality(
    studentId: string,
    analytics: any,
    privacyContext: PrivacyContext
  ): Promise<InterventionAlert | null> {
    // Only analyze if privacy context allows quality assessment
    if (!this.canAnalyzeQuality(privacyContext)) {
      return null;
    }

    const qualityScore = analytics.averageQuality || 0;
    const reflectionDepth = analytics.averageReflectionDepth || 0;

    if (qualityScore < this.config.qualityThreshold && reflectionDepth < 0.5) {
      return {
        type: 'writing_quality_concern',
        severity: 'warning',
        title: 'Writing Quality Needs Attention',
        message: 'Student may benefit from additional writing support and feedback.',
        suggestedActions: [
          'Provide targeted writing feedback',
          'Suggest writing resources and tutorials',
          'Schedule writing center consultation',
          'Consider peer review opportunities'
        ],
        studentId,
        metrics: {
          currentValue: qualityScore,
          threshold: this.config.qualityThreshold,
          trend: 'stable'
        }
      };
    }

    return null;
  }

  /**
   * Create intervention record with privacy metadata
   */
  private async createInterventionRecord(
    alert: InterventionAlert,
    privacyContext: PrivacyContext
  ): Promise<Intervention> {
    const intervention: Omit<Intervention, 'id' | 'createdAt' | 'updatedAt'> = {
      studentId: alert.studentId,
      assignmentId: alert.context?.assignment,
      type: this.mapAlertTypeToInterventionType(alert.type),
      severity: this.mapAlertSeverityToInterventionSeverity(alert.severity),
      status: 'pending',
      title: alert.title,
      description: alert.message,
      recommendedActions: alert.suggestedActions,
      triggerMetrics: alert.metrics || {},
      metadata: {
        privacyContext: {
          requesterId: privacyContext.requesterId,
          purpose: privacyContext.purpose,
          timestamp: privacyContext.timestamp
        },
        originalAlertType: alert.type
      }
    };

    return await this.interventionRepo.createIntervention(intervention, privacyContext);
  }

  /**
   * Check if privacy context allows intervention analysis
   */
  private canPerformInterventionAnalysis(privacyContext: PrivacyContext, studentId: string): boolean {
    // Educators, system, admin can analyze any student
    if (['educator', 'system', 'admin'].includes(privacyContext.requesterType)) {
      return true;
    }
    
    // Students can only analyze their own data
    if (privacyContext.requesterType === 'student' && privacyContext.requesterId === studentId) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if privacy context allows progress analysis
   */
  private canAnalyzeProgress(privacyContext: PrivacyContext): boolean {
    return privacyContext.purpose.includes('educational') || 
           privacyContext.purpose.includes('intervention');
  }

  /**
   * Check if privacy context allows quality analysis
   */
  private canAnalyzeQuality(privacyContext: PrivacyContext): boolean {
    return privacyContext.purpose.includes('educational') || 
           privacyContext.purpose.includes('assessment');
  }

  /**
   * Publish privacy event for audit trail
   */
  private async publishPrivacyEvent(
    eventType: string,
    studentId: string,
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
        educationalJustification: `Intervention analysis: ${eventType}`,
        accessTimestamp: new Date(),
        dataScope: {
          recordCount: 1
        }
      }
    });
  }

  private mapAlertTypeToInterventionType(alertType: string): Intervention['type'] {
    const typeMap: Record<string, Intervention['type']> = {
      'no_recent_activity': 'engagement',
      'writing_productivity_decline': 'progress',
      'assignment_overdue': 'progress',
      'writing_quality_concern': 'quality',
      'cognitive_load_high': 'cognitive_load',
      'reflection_quality_low': 'reflection'
    };
    return typeMap[alertType] || 'progress';
  }

  private mapAlertSeverityToInterventionSeverity(alertSeverity: string): Intervention['severity'] {
    const severityMap: Record<string, Intervention['severity']> = {
      'info': 'low',
      'warning': 'medium',
      'critical': 'high'
    };
    return severityMap[alertSeverity] || 'medium';
  }
}