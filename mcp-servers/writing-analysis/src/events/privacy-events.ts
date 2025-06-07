/**
 * Privacy-Specific Event Definitions for Writing Analysis MCP Server
 * Integrates with main backend privacy event system
 */

export interface BasePrivacyEvent {
  type: string;
  timestamp: Date;
  correlationId: string;
  userId: string;
  privacyLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  auditRequired: boolean;
}

/**
 * Content Classification Events
 */
export interface ContentClassifiedEvent extends BasePrivacyEvent {
  type: 'CONTENT_CLASSIFIED';
  payload: {
    contentId: string;
    contentType: 'essay' | 'reflection' | 'notes' | 'feedback';
    sensitivityLevel: 'none' | 'low' | 'medium' | 'high';
    sensitivityScore: number;
    sensitiveElements: string[];
    classificationMethod: 'nlp' | 'pattern_matching' | 'ml_model';
    confidence: number;
    recommendations: string[];
    redactionApplied: boolean;
  };
  metadata: {
    academicLevel: string;
    institutionId?: string;
    courseId?: string;
    assignmentId?: string;
  };
}

/**
 * Educational Purpose Validation Events
 */
export interface EducationalPurposeValidatedEvent extends BasePrivacyEvent {
  type: 'EDUCATIONAL_PURPOSE_VALIDATED';
  payload: {
    purpose: string;
    validationResult: 'approved' | 'conditional' | 'rejected';
    score: number;
    criteria: {
      academicRelevance: number;
      learningObjectiveAlignment: number;
      appropriateLevel: number;
      ethicalCompliance: number;
    };
    educationalValue: string;
    recommendations: string[];
    requiredApprovals?: string[];
  };
  metadata: {
    requestType: 'data_access' | 'analysis' | 'research' | 'improvement';
    userRole: 'student' | 'educator' | 'administrator' | 'researcher';
    institutionId?: string;
  };
}

/**
 * AI Boundary Application Events
 */
export interface AIBoundaryAppliedEvent extends BasePrivacyEvent {
  type: 'AI_BOUNDARY_APPLIED';
  payload: {
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
    educationalGuidance: string;
  };
  metadata: {
    studentContext: {
      assignmentType: string;
      reflectionCompleted: boolean;
      progressLevel: number;
      previousViolations?: number;
    };
    boundaryLevel: 'permissive' | 'standard' | 'strict' | 'restrictive';
  };
}

/**
 * Writing Data Access Events
 */
export interface WritingDataAccessedEvent extends BasePrivacyEvent {
  type: 'WRITING_DATA_ACCESSED';
  payload: {
    accessType: 'read' | 'write' | 'update' | 'delete' | 'analyze';
    dataType: 'writing_content' | 'reflection' | 'progress_data' | 'analytics' | 'metadata';
    dataCategory: 'personal' | 'educational' | 'behavioral' | 'performance';
    accessedBy: string;
    accessedByRole: 'student' | 'educator' | 'administrator' | 'system';
    purpose: string;
    dataSize: {
      recordCount: number;
      approximateSize: string;
    };
    retentionPolicy: string;
    encryptionApplied: boolean;
  };
  metadata: {
    educationalContext: {
      courseId?: string;
      assignmentId?: string;
      institutionId?: string;
      semester?: string;
    };
    technicalContext: {
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
      apiEndpoint?: string;
    };
    legalBasis: 'consent' | 'legitimate_interest' | 'legal_obligation' | 'public_interest';
  };
}

/**
 * Privacy Consent Change Events
 */
export interface PrivacyConsentChangedEvent extends BasePrivacyEvent {
  type: 'PRIVACY_CONSENT_CHANGED';
  payload: {
    consentType: 'analytics' | 'research' | 'improvement' | 'marketing' | 'ai_assistance';
    previousState: boolean;
    newState: boolean;
    consentMethod: 'explicit' | 'implied' | 'opt_out' | 'granular';
    effectiveDate: Date;
    expirationDate?: Date;
    granularChoices?: Record<string, boolean>;
  };
  metadata: {
    consentMechanism: 'web_form' | 'api_call' | 'email_link' | 'parent_consent';
    minorStatus: boolean;
    parentConsentRequired: boolean;
    withdrawalMethod?: string;
  };
}

/**
 * Privacy Violation Detection Events
 */
export interface PrivacyViolationDetectedEvent extends BasePrivacyEvent {
  type: 'PRIVACY_VIOLATION_DETECTED';
  payload: {
    violationType: 'consent_violation' | 'data_minimization' | 'purpose_limitation' | 'unauthorized_access';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedUsers: string[];
    potentialImpact: string;
    automaticRemediation: boolean;
    remediationActions: string[];
    requiresManualReview: boolean;
  };
  metadata: {
    detectionMethod: 'automated' | 'user_report' | 'audit' | 'external_notification';
    complianceFramework: 'GDPR' | 'FERPA' | 'COPPA' | 'CCPA' | 'institution_policy';
    reportingRequired: boolean;
    notificationDeadline?: Date;
  };
}

/**
 * Privacy Analytics Events
 */
export interface PrivacyAnalyticsEvent extends BasePrivacyEvent {
  type: 'PRIVACY_ANALYTICS_GENERATED';
  payload: {
    analyticsType: 'class_insights' | 'individual_progress' | 'institutional_trends';
    aggregationLevel: 'individual' | 'class' | 'institution' | 'anonymous_cohort';
    privacyTechniques: string[];
    differentialPrivacy: {
      enabled: boolean;
      epsilon?: number;
      delta?: number;
    };
    dataMinimization: {
      fieldsRemoved: string[];
      fieldsAnonymized: string[];
      retentionPeriod: string;
    };
  };
  metadata: {
    recipientRole: 'student' | 'educator' | 'administrator' | 'researcher';
    educationalPurpose: string;
    consentBasis: string[];
    sharingRestrictions: string[];
  };
}

/**
 * Union type for all privacy events
 */
export type PrivacyEvent = 
  | ContentClassifiedEvent
  | EducationalPurposeValidatedEvent
  | AIBoundaryAppliedEvent
  | WritingDataAccessedEvent
  | PrivacyConsentChangedEvent
  | PrivacyViolationDetectedEvent
  | PrivacyAnalyticsEvent;

/**
 * Privacy Event Types Enum
 */
export enum PrivacyEventTypes {
  CONTENT_CLASSIFIED = 'CONTENT_CLASSIFIED',
  EDUCATIONAL_PURPOSE_VALIDATED = 'EDUCATIONAL_PURPOSE_VALIDATED',
  AI_BOUNDARY_APPLIED = 'AI_BOUNDARY_APPLIED',
  WRITING_DATA_ACCESSED = 'WRITING_DATA_ACCESSED',
  PRIVACY_CONSENT_CHANGED = 'PRIVACY_CONSENT_CHANGED',
  PRIVACY_VIOLATION_DETECTED = 'PRIVACY_VIOLATION_DETECTED',
  PRIVACY_ANALYTICS_GENERATED = 'PRIVACY_ANALYTICS_GENERATED',
}

/**
 * Privacy Event Utility Functions
 */
export class PrivacyEventUtils {
  /**
   * Create a correlation ID for privacy event chains
   */
  static createCorrelationId(): string {
    return `privacy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Determine privacy level based on content and context
   */
  static determinePrivacyLevel(
    contentType: string,
    userRole: string,
    hasConsent: boolean
  ): 'public' | 'internal' | 'confidential' | 'restricted' {
    if (contentType.includes('reflection') || contentType.includes('personal')) {
      return hasConsent ? 'confidential' : 'restricted';
    }
    
    if (userRole === 'student' && !hasConsent) {
      return 'restricted';
    }
    
    if (contentType.includes('analytics') || contentType.includes('progress')) {
      return 'confidential';
    }
    
    return 'internal';
  }

  /**
   * Check if event requires immediate audit logging
   */
  static requiresAudit(event: PrivacyEvent): boolean {
    const criticalTypes = [
      PrivacyEventTypes.PRIVACY_VIOLATION_DETECTED,
      PrivacyEventTypes.WRITING_DATA_ACCESSED,
      PrivacyEventTypes.AI_BOUNDARY_APPLIED,
    ];
    
    return criticalTypes.includes(event.type as PrivacyEventTypes) || 
           event.privacyLevel === 'restricted';
  }

  /**
   * Sanitize event for external logging
   */
  static sanitizeForLogging(event: PrivacyEvent): Partial<PrivacyEvent> {
    const sanitized = {
      type: event.type,
      timestamp: event.timestamp,
      correlationId: event.correlationId,
      userId: this.hashUserId(event.userId),
      privacyLevel: event.privacyLevel,
      auditRequired: event.auditRequired,
    };

    // Remove sensitive payload data for external logs
    return sanitized;
  }

  /**
   * Hash user ID for privacy-safe logging
   */
  private static hashUserId(userId: string): string {
    // Simple hash - in production would use proper cryptographic hash
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(userId).digest('hex').substring(0, 16);
  }

  /**
   * Validate privacy event structure
   */
  static validateEvent(event: Partial<PrivacyEvent>): boolean {
    if (!event.type || !event.timestamp || !event.userId) {
      return false;
    }

    if (!Object.values(PrivacyEventTypes).includes(event.type as PrivacyEventTypes)) {
      return false;
    }

    return true;
  }
}