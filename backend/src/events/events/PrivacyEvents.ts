import { PrivacyEvent } from '../EventBus';

/**
 * Privacy domain events for educational data protection
 */

/**
 * Data Access Audit Event
 * Fired whenever educational data is accessed for analysis or display
 */
export interface DataAccessAuditedEvent extends PrivacyEvent {
  type: 'privacy.data.accessed';
  category: 'audit';
  payload: {
    accessorId: string;
    dataType: 'student-writing' | 'reflection-data' | 'progress-metrics' | 'assignment-submissions';
    purpose: 'educational-analysis' | 'instructor-review' | 'system-monitoring' | 'academic-integrity';
    educationalJustification: string;
    accessTimestamp: Date;
    dataScope: {
      studentCount?: number;
      recordCount: number;
      timeRange?: {
        start: Date;
        end: Date;
      };
    };
    retentionSchedule?: Date;
  };
}

/**
 * Student Consent Updated Event
 * Fired when student privacy consent preferences change
 */
export interface StudentConsentUpdatedEvent extends PrivacyEvent {
  type: 'privacy.consent.updated';
  category: 'consent';
  payload: {
    consentChanges: ConsentChange[];
    effectiveDate: Date;
    consentVersion: string;
    triggeredBy: 'student' | 'guardian' | 'institution' | 'system';
    impactedServices: string[];
  };
}

export interface ConsentChange {
  consentType: 'ai-analysis' | 'progress-tracking' | 'data-sharing' | 'research-participation';
  previousValue: boolean;
  newValue: boolean;
  reason?: string;
  consentScope: 'course-specific' | 'platform-wide' | 'limited-time';
  expirationDate?: Date;
}

/**
 * Unauthorized Access Attempted Event
 * Fired when someone attempts to access data without proper authorization
 */
export interface UnauthorizedAccessAttemptedEvent extends PrivacyEvent {
  type: 'privacy.access.unauthorized';
  category: 'access';
  payload: {
    attemptedBy: string;
    attemptedByRole: 'student' | 'instructor' | 'admin' | 'system' | 'unknown';
    resource: string;
    resourceType: 'student-data' | 'course-data' | 'analytics' | 'admin-panel';
    reason: string;
    attemptTimestamp: Date;
    sourceIP?: string;
    userAgent?: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    automaticActions: string[];
  };
}

/**
 * Privacy Threshold Exceeded Event
 * Fired when privacy metrics exceed defined thresholds
 */
export interface PrivacyThresholdExceededEvent extends PrivacyEvent {
  type: 'privacy.threshold.exceeded';
  category: 'compliance';
  payload: {
    metric: 'data-access-frequency' | 'retention-period' | 'consent-compliance' | 'anonymization-rate';
    threshold: number;
    actual: number;
    measurementUnit: string;
    timeWindow: {
      start: Date;
      end: Date;
    };
    affectedStudents?: number;
    action: 'alert-only' | 'auto-remediate' | 'require-review' | 'escalate';
    remediationSteps?: string[];
  };
}

/**
 * Data Anonymization Event
 * Fired when student data is anonymized for research or analytics
 */
export interface DataAnonymizedEvent extends PrivacyEvent {
  type: 'privacy.data.anonymized';
  category: 'audit';
  payload: {
    originalDataType: string;
    anonymizationMethod: 'hash' | 'pseudonym' | 'aggregation' | 'k-anonymity';
    anonymizationLevel: 'partial' | 'full' | 'statistical';
    purpose: 'research' | 'analytics' | 'compliance' | 'data-sharing';
    recordCount: number;
    retentionPeriod: number; // days
    reversibilityStatus: 'reversible' | 'irreversible' | 'conditional';
    anonymizationJobId: string;
  };
}

/**
 * Data Retention Policy Event
 * Fired when data retention actions are taken
 */
export interface DataRetentionActionEvent extends PrivacyEvent {
  type: 'privacy.retention.action';
  category: 'compliance';
  payload: {
    action: 'archive' | 'delete' | 'anonymize' | 'export';
    dataType: string;
    reason: 'policy-expiration' | 'student-request' | 'consent-withdrawal' | 'graduation';
    recordCount: number;
    executionTimestamp: Date;
    verificationRequired: boolean;
    backupLocation?: string;
    irreversible: boolean;
  };
}

/**
 * Privacy Risk Assessment Event
 * Fired when privacy risk assessments are completed
 */
export interface PrivacyRiskAssessmentEvent extends PrivacyEvent {
  type: 'privacy.risk.assessed';
  category: 'compliance';
  payload: {
    assessmentType: 'automated' | 'manual' | 'audit';
    riskScore: number; // 0-100
    riskFactors: {
      factor: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }[];
    recommendedActions: string[];
    complianceStatus: 'compliant' | 'at-risk' | 'non-compliant';
    nextAssessmentDue: Date;
    assessmentJobId: string;
  };
}

/**
 * Educational Data Sharing Event
 * Fired when educational data is shared between systems or with third parties
 */
export interface EducationalDataSharingEvent extends PrivacyEvent {
  type: 'privacy.data.shared';
  category: 'audit';
  payload: {
    recipient: string;
    recipientType: 'internal-system' | 'third-party-service' | 'research-institution' | 'parent-institution';
    dataType: string;
    sharingPurpose: string;
    legalBasis: 'consent' | 'legitimate-interest' | 'contract' | 'legal-obligation';
    dataMinimization: boolean;
    encryptionUsed: boolean;
    sharingAgreementId: string;
    studentNotificationRequired: boolean;
    retentionLimitForRecipient?: number; // days
  };
}

/**
 * Consent Verification Event
 * Fired when consent is verified before data processing
 */
export interface ConsentVerificationEvent extends PrivacyEvent {
  type: 'privacy.consent.verified';
  category: 'consent';
  payload: {
    verificationResult: 'valid' | 'expired' | 'insufficient' | 'withdrawn';
    requestedOperation: string;
    consentTypes: string[];
    lastConsentUpdate: Date;
    gracePeriodApplied: boolean;
    fallbackAction: 'proceed-anonymized' | 'request-consent' | 'deny-access' | 'minimal-processing';
  };
}