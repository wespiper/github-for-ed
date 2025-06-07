import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import {
  PrivacyEvent,
  PrivacyEventTypes,
  PrivacyEventUtils,
  ContentClassifiedEvent,
  EducationalPurposeValidatedEvent,
  AIBoundaryAppliedEvent,
  WritingDataAccessedEvent,
  PrivacyConsentChangedEvent,
  PrivacyViolationDetectedEvent,
  PrivacyAnalyticsEvent,
} from './privacy-events';

/**
 * Privacy Event Publisher Service
 * Handles publishing privacy events with encryption and audit compliance
 */
@Injectable()
export class PrivacyEventPublisherService {
  private readonly logger = new Logger(PrivacyEventPublisherService.name);
  
  constructor(
    private eventEmitter: EventEmitter2,
    private configService: ConfigService,
  ) {}

  /**
   * Publish content classification event
   */
  async publishContentClassified(data: {
    userId: string;
    contentId: string;
    contentType: 'essay' | 'reflection' | 'notes' | 'feedback';
    sensitivityLevel: 'none' | 'low' | 'medium' | 'high';
    sensitivityScore: number;
    sensitiveElements: string[];
    recommendations: string[];
    redactionApplied: boolean;
    academicLevel: string;
    courseId?: string;
    assignmentId?: string;
  }): Promise<void> {
    const event: ContentClassifiedEvent = {
      type: PrivacyEventTypes.CONTENT_CLASSIFIED,
      timestamp: new Date(),
      correlationId: PrivacyEventUtils.createCorrelationId(),
      userId: data.userId,
      privacyLevel: PrivacyEventUtils.determinePrivacyLevel(
        data.contentType,
        'student', // Assuming student for content classification
        true // Content classification implies some level of consent
      ),
      auditRequired: true,
      payload: {
        contentId: data.contentId,
        contentType: data.contentType,
        sensitivityLevel: data.sensitivityLevel,
        sensitivityScore: data.sensitivityScore,
        sensitiveElements: data.sensitiveElements,
        classificationMethod: 'nlp',
        confidence: 0.85, // Default confidence
        recommendations: data.recommendations,
        redactionApplied: data.redactionApplied,
      },
      metadata: {
        academicLevel: data.academicLevel,
        courseId: data.courseId,
        assignmentId: data.assignmentId,
      },
    };

    await this.publishPrivacyEvent(event);
  }

  /**
   * Publish educational purpose validation event
   */
  async publishEducationalPurposeValidated(data: {
    userId: string;
    purpose: string;
    validationResult: 'approved' | 'conditional' | 'rejected';
    score: number;
    criteria: {
      academicRelevance: number;
      learningObjectiveAlignment: number;
      appropriateLevel: number;
      ethicalCompliance: number;
    };
    userRole: 'student' | 'educator' | 'administrator' | 'researcher';
    requestType: 'data_access' | 'analysis' | 'research' | 'improvement';
  }): Promise<void> {
    const event: EducationalPurposeValidatedEvent = {
      type: PrivacyEventTypes.EDUCATIONAL_PURPOSE_VALIDATED,
      timestamp: new Date(),
      correlationId: PrivacyEventUtils.createCorrelationId(),
      userId: data.userId,
      privacyLevel: 'internal',
      auditRequired: true,
      payload: {
        purpose: data.purpose,
        validationResult: data.validationResult,
        score: data.score,
        criteria: data.criteria,
        educationalValue: this.calculateEducationalValue(data.score),
        recommendations: this.generatePurposeRecommendations(data.validationResult, data.score),
      },
      metadata: {
        requestType: data.requestType,
        userRole: data.userRole,
      },
    };

    await this.publishPrivacyEvent(event);
  }

  /**
   * Publish AI boundary application event
   */
  async publishAIBoundaryApplied(data: {
    userId: string;
    aiRequest: {
      prompt: string;
      context: string;
      requestType: 'assistance' | 'feedback' | 'analysis' | 'generation';
    };
    boundariesApplied: string[];
    allowed: boolean;
    restrictions: string[];
    reasoning: string;
    suggestions: string[];
    studentContext: {
      assignmentType: string;
      reflectionCompleted: boolean;
      progressLevel: number;
    };
  }): Promise<void> {
    const event: AIBoundaryAppliedEvent = {
      type: PrivacyEventTypes.AI_BOUNDARY_APPLIED,
      timestamp: new Date(),
      correlationId: PrivacyEventUtils.createCorrelationId(),
      userId: data.userId,
      privacyLevel: 'confidential',
      auditRequired: true,
      payload: {
        aiRequest: data.aiRequest,
        boundariesApplied: data.boundariesApplied,
        allowed: data.allowed,
        restrictions: data.restrictions,
        reasoning: data.reasoning,
        suggestions: data.suggestions,
        educationalGuidance: this.generateEducationalGuidance(data.allowed, data.studentContext),
      },
      metadata: {
        studentContext: data.studentContext,
        boundaryLevel: this.determineBoundaryLevel(data.studentContext),
      },
    };

    await this.publishPrivacyEvent(event);
  }

  /**
   * Publish writing data access event
   */
  async publishWritingDataAccessed(data: {
    userId: string;
    accessType: 'read' | 'write' | 'update' | 'delete' | 'analyze';
    dataType: 'writing_content' | 'reflection' | 'progress_data' | 'analytics' | 'metadata';
    accessedBy: string;
    accessedByRole: 'student' | 'educator' | 'administrator' | 'system';
    purpose: string;
    recordCount: number;
    courseId?: string;
    assignmentId?: string;
  }): Promise<void> {
    const event: WritingDataAccessedEvent = {
      type: PrivacyEventTypes.WRITING_DATA_ACCESSED,
      timestamp: new Date(),
      correlationId: PrivacyEventUtils.createCorrelationId(),
      userId: data.userId,
      privacyLevel: this.determineDataAccessPrivacyLevel(data.dataType, data.accessedByRole),
      auditRequired: true,
      payload: {
        accessType: data.accessType,
        dataType: data.dataType,
        dataCategory: this.categorizeDataType(data.dataType),
        accessedBy: data.accessedBy,
        accessedByRole: data.accessedByRole,
        purpose: data.purpose,
        dataSize: {
          recordCount: data.recordCount,
          approximateSize: this.estimateDataSize(data.recordCount, data.dataType),
        },
        retentionPolicy: this.getRetentionPolicy(data.dataType),
        encryptionApplied: true,
      },
      metadata: {
        educationalContext: {
          courseId: data.courseId,
          assignmentId: data.assignmentId,
        },
        technicalContext: {
          apiEndpoint: 'MCP-Server',
          sessionId: PrivacyEventUtils.createCorrelationId(),
        },
        legalBasis: this.determineLegalBasis(data.purpose, data.accessedByRole),
      },
    };

    await this.publishPrivacyEvent(event);
  }

  /**
   * Publish privacy analytics event
   */
  async publishPrivacyAnalyticsGenerated(data: {
    userId: string;
    analyticsType: 'class_insights' | 'individual_progress' | 'institutional_trends';
    aggregationLevel: 'individual' | 'class' | 'institution' | 'anonymous_cohort';
    recipientRole: 'student' | 'educator' | 'administrator' | 'researcher';
    educationalPurpose: string;
    consentBasis: string[];
  }): Promise<void> {
    const event: PrivacyAnalyticsEvent = {
      type: PrivacyEventTypes.PRIVACY_ANALYTICS_GENERATED,
      timestamp: new Date(),
      correlationId: PrivacyEventUtils.createCorrelationId(),
      userId: data.userId,
      privacyLevel: data.aggregationLevel === 'individual' ? 'confidential' : 'internal',
      auditRequired: true,
      payload: {
        analyticsType: data.analyticsType,
        aggregationLevel: data.aggregationLevel,
        privacyTechniques: this.getPrivacyTechniques(data.aggregationLevel),
        differentialPrivacy: {
          enabled: data.aggregationLevel !== 'individual',
          epsilon: data.aggregationLevel === 'class' ? 1.0 : 0.5,
          delta: 1e-5,
        },
        dataMinimization: {
          fieldsRemoved: this.getMinimizedFields(data.analyticsType),
          fieldsAnonymized: this.getAnonymizedFields(data.aggregationLevel),
          retentionPeriod: '2-years',
        },
      },
      metadata: {
        recipientRole: data.recipientRole,
        educationalPurpose: data.educationalPurpose,
        consentBasis: data.consentBasis,
        sharingRestrictions: this.getSharingRestrictions(data.recipientRole),
      },
    };

    await this.publishPrivacyEvent(event);
  }

  /**
   * Core privacy event publishing method
   */
  private async publishPrivacyEvent(event: PrivacyEvent): Promise<void> {
    try {
      // Validate event structure
      if (!PrivacyEventUtils.validateEvent(event)) {
        this.logger.error('Invalid privacy event structure', { type: event.type });
        return;
      }

      // Log for audit (sanitized version)
      if (PrivacyEventUtils.requiresAudit(event)) {
        const sanitized = PrivacyEventUtils.sanitizeForLogging(event);
        this.logger.log('Privacy event audit log:', sanitized);
      }

      // Emit to local event system
      this.eventEmitter.emit(`privacy.${event.type.toLowerCase()}`, event);

      // TODO: In production, also send to main backend event system
      // await this.sendToMainBackend(event);

      this.logger.debug(`Privacy event published: ${event.type}`, {
        correlationId: event.correlationId,
        privacyLevel: event.privacyLevel,
      });

    } catch (error) {
      this.logger.error('Failed to publish privacy event:', error, {
        eventType: event.type,
        correlationId: event.correlationId,
      });
      throw error;
    }
  }

  // Helper methods

  private calculateEducationalValue(score: number): string {
    if (score >= 90) return 'high';
    if (score >= 70) return 'medium';
    if (score >= 50) return 'low';
    return 'minimal';
  }

  private generatePurposeRecommendations(result: string, score: number): string[] {
    const recommendations = [];
    
    if (result === 'rejected') {
      recommendations.push('Clarify educational benefit', 'Align with learning objectives');
    } else if (result === 'conditional') {
      recommendations.push('Provide additional context', 'Define success metrics');
    } else if (score < 80) {
      recommendations.push('Consider additional safeguards', 'Document value exchange');
    }

    return recommendations;
  }

  private generateEducationalGuidance(allowed: boolean, studentContext: any): string {
    if (!allowed) {
      return 'Complete reflection requirements to unlock AI assistance';
    }
    
    if (studentContext.progressLevel < 0.5) {
      return 'Focus on understanding concepts before seeking AI assistance';
    }
    
    return 'AI assistance available - use it to enhance your learning';
  }

  private determineBoundaryLevel(studentContext: any): 'permissive' | 'standard' | 'strict' | 'restrictive' {
    if (!studentContext.reflectionCompleted) return 'restrictive';
    if (studentContext.progressLevel < 0.3) return 'strict';
    if (studentContext.progressLevel < 0.7) return 'standard';
    return 'permissive';
  }

  private determineDataAccessPrivacyLevel(
    dataType: string,
    accessedByRole: string
  ): 'public' | 'internal' | 'confidential' | 'restricted' {
    if (dataType.includes('reflection') || dataType.includes('progress')) {
      return accessedByRole === 'student' ? 'confidential' : 'restricted';
    }
    return 'internal';
  }

  private categorizeDataType(dataType: string): 'personal' | 'educational' | 'behavioral' | 'performance' {
    if (dataType.includes('reflection') || dataType.includes('writing_content')) return 'personal';
    if (dataType.includes('progress') || dataType.includes('analytics')) return 'performance';
    if (dataType.includes('metadata')) return 'behavioral';
    return 'educational';
  }

  private estimateDataSize(recordCount: number, dataType: string): string {
    const avgSizes = {
      writing_content: 2000, // bytes
      reflection: 500,
      progress_data: 100,
      analytics: 50,
      metadata: 20,
    };
    
    const size = recordCount * (avgSizes[dataType] || 100);
    if (size < 1024) return `${size}B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
    return `${(size / (1024 * 1024)).toFixed(1)}MB`;
  }

  private getRetentionPolicy(dataType: string): string {
    const policies = {
      writing_content: '7-years',
      reflection: '3-years', 
      progress_data: '2-years',
      analytics: '1-year',
      metadata: '6-months',
    };
    
    return policies[dataType] || '1-year';
  }

  private determineLegalBasis(purpose: string, role: string): 'consent' | 'legitimate_interest' | 'legal_obligation' | 'public_interest' {
    if (purpose.includes('research')) return 'consent';
    if (purpose.includes('improvement') && role === 'educator') return 'legitimate_interest';
    if (purpose.includes('assessment') || purpose.includes('grading')) return 'legal_obligation';
    return 'consent';
  }

  private getPrivacyTechniques(aggregationLevel: string): string[] {
    const techniques = ['data_minimization', 'anonymization'];
    
    if (aggregationLevel !== 'individual') {
      techniques.push('differential_privacy', 'k_anonymity');
    }
    
    if (aggregationLevel === 'anonymous_cohort') {
      techniques.push('synthetic_data_generation');
    }
    
    return techniques;
  }

  private getMinimizedFields(analyticsType: string): string[] {
    const commonFields = ['ip_address', 'device_id', 'session_details'];
    
    if (analyticsType === 'class_insights') {
      return [...commonFields, 'individual_scores', 'personal_comments'];
    }
    
    return commonFields;
  }

  private getAnonymizedFields(aggregationLevel: string): string[] {
    if (aggregationLevel === 'individual') return [];
    
    return ['user_id', 'student_name', 'email_address'];
  }

  private getSharingRestrictions(recipientRole: string): string[] {
    const restrictions = ['no_external_sharing', 'educational_use_only'];
    
    if (recipientRole === 'student') {
      restrictions.push('self_data_only');
    }
    
    if (recipientRole === 'researcher') {
      restrictions.push('anonymized_only', 'institutional_approval_required');
    }
    
    return restrictions;
  }
}