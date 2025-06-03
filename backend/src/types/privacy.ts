/**
 * Privacy-related types for educational data protection
 */

/**
 * Privacy context that must be included with all repository operations
 */
export interface PrivacyContext {
  /** ID of the entity making the request */
  requesterId: string;
  
  /** Type of requester for access control */
  requesterType: 'student' | 'educator' | 'system' | 'admin';
  
  /** Educational purpose for accessing the data */
  purpose: string;
  
  /** Optional educational justification for the access */
  educationalJustification?: string;
  
  /** Timestamp of the request */
  timestamp: Date;
  
  /** Optional correlation ID for tracking related operations */
  correlationId?: string;
  
  /** Optional session ID for tracking user sessions */
  sessionId?: string;
  
  /** User ID for tracking (legacy compatibility) */
  userId?: string;
  
  /** Data types being accessed */
  dataTypes?: string[];
  
  /** Data retention category */
  retentionCategory?: string;
  
  /** Whether consent is required */
  consentRequired?: boolean;
}

/**
 * Privacy metadata attached to sensitive data
 */
export interface PrivacyMetadata {
  /** Data sensitivity classification */
  sensitivityLevel: 'public' | 'restricted' | 'private' | 'highly_sensitive';
  
  /** Whether consent is required to access this data */
  consentRequired: boolean;
  
  /** Consent status if applicable */
  consentStatus?: 'granted' | 'denied' | 'pending' | 'expired';
  
  /** Data retention period in days */
  retentionDays?: number;
  
  /** Whether this data can be used for analytics */
  analyticsAllowed: boolean;
  
  /** Whether this data can be aggregated anonymously */
  aggregationAllowed: boolean;
  
  /** Additional privacy flags */
  flags?: {
    pii?: boolean;
    ferpa?: boolean;
    minorData?: boolean;
    researchData?: boolean;
  };
}

/**
 * Audit trail entry for tracking data access
 */
export interface AuditEntry {
  /** Unique identifier for the audit entry */
  id: string;
  
  /** Type of operation performed */
  operation: 'read' | 'create' | 'update' | 'delete' | 'export' | 'share';
  
  /** Entity type that was accessed */
  entityType: string;
  
  /** ID of the entity that was accessed */
  entityId: string;
  
  /** Privacy context of the operation */
  privacyContext: PrivacyContext;
  
  /** Result of the operation */
  result: 'success' | 'denied' | 'error';
  
  /** Reason for denial if applicable */
  denialReason?: string;
  
  /** Metadata about what was accessed or changed */
  accessMetadata?: {
    fieldsAccessed?: string[];
    dataClassification?: string;
    consentRequired?: boolean;
    consentStatus?: string;
    educationalJustification?: string;
  };
  
  /** Timestamp of the operation */
  timestamp: Date;
  
  /** IP address if available */
  ipAddress?: string;
  
  /** User agent if available */
  userAgent?: string;
}

/**
 * Anonymized data for analytics
 */
export interface AnonymizedData<T = any> {
  /** The anonymized data */
  data: T;
  
  /** Minimum cohort size used for k-anonymity */
  cohortSize: number;
  
  /** Date range of the data */
  dateRange: {
    start: Date;
    end: Date;
  };
  
  /** Fields that were anonymized or removed */
  anonymizedFields: string[];
  
  /** Aggregation method used */
  aggregationMethod: 'average' | 'median' | 'count' | 'distribution';
}

/**
 * Consent record for tracking student consent
 */
export interface ConsentRecord {
  /** Unique identifier */
  id: string;
  
  /** Student ID */
  studentId: string;
  
  /** Type of consent */
  consentType: 'data_collection' | 'analytics' | 'ai_interaction' | 'educator_access' | 'research';
  
  /** Consent status */
  status: 'granted' | 'denied' | 'pending' | 'expired' | 'withdrawn';
  
  /** When consent was given/denied */
  timestamp: Date;
  
  /** When consent expires */
  expiresAt?: Date;
  
  /** Version of privacy policy consented to */
  policyVersion: string;
  
  /** Additional metadata */
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    parentConsent?: boolean;
    verificationMethod?: string;
    source?: string;
    [key: string]: any;
  };
}

/**
 * Privacy-preserving insights for educators
 */
export interface PrivacyPreservedInsights {
  /** Insights data with privacy protections applied */
  insights: any;
  
  /** Whether this data is aggregated from multiple students */
  isAggregated: boolean;
  
  /** Minimum cohort size if aggregated */
  cohortSize?: number;
  
  /** Privacy level of the insights */
  privacyLevel: 'high' | 'medium' | 'low';
  
  /** Timestamp when insights were generated */
  generatedAt: Date;
  
  /** How long these insights are valid */
  validUntil: Date;
}

/**
 * Document with privacy awareness
 */
export interface DocumentWithPrivacy {
  /** Document ID */
  id: string;
  
  /** Document content (may be redacted) */
  content: string;
  
  /** Whether content has been redacted */
  isRedacted: boolean;
  
  /** Privacy metadata */
  privacyMetadata: PrivacyMetadata;
  
  /** Original document metadata */
  metadata?: any;
  
  /** Redaction summary if applicable */
  redactionSummary?: {
    totalRedactions: number;
    redactionTypes: string[];
    preservedWordCount: number;
    originalWordCount: number;
  };
}

/**
 * Class reflection insights with privacy protection
 */
export interface ClassReflectionInsights {
  /** Assignment ID */
  assignmentId: string;
  
  /** Number of students in the cohort */
  cohortSize: number;
  
  /** Aggregated quality metrics */
  qualityMetrics: {
    averageDepthScore: number;
    averageSelfAwarenessScore: number;
    averageCriticalThinkingScore: number;
    averageGrowthMindsetScore: number;
    overallQualityDistribution: Record<string, number>;
  };
  
  /** Common themes (anonymized) */
  commonThemes: string[];
  
  /** Growth areas identified across the class */
  growthAreas: string[];
  
  /** Recommended interventions */
  recommendations: string[];
  
  /** Privacy protection applied */
  privacyProtection: {
    minimumCohortSize: number;
    aggregationMethod: string;
    fieldsExcluded: string[];
  };
  
  /** When insights were generated */
  generatedAt: Date;
}

/**
 * Analysis criteria with privacy constraints
 */
export interface AnalyticsCriteria {
  /** Assignment ID filter */
  assignmentId?: string;
  
  /** Course ID filter */
  courseId?: string;
  
  /** Date range */
  dateRange?: {
    start: Date;
    end: Date;
  };
  
  /** Minimum cohort size for k-anonymity */
  minimumCohortSize?: number;
  
  /** Whether to include PII */
  includePII?: boolean;
  
  /** Fields to exclude for privacy */
  excludeFields?: string[];
  
  /** Aggregation level */
  aggregationLevel?: 'individual' | 'class' | 'course' | 'institution';
}

/**
 * Insight criteria with privacy controls
 */
export interface InsightCriteria {
  /** Student ID (only if authorized) */
  studentId?: string;
  
  /** Assignment ID */
  assignmentId?: string;
  
  /** Time period */
  timePeriod?: {
    start: Date;
    end: Date;
  };
  
  /** Type of insights requested */
  insightType: 'progress' | 'engagement' | 'quality' | 'patterns' | 'interventions';
  
  /** Privacy level requested */
  privacyLevel: 'individual' | 'aggregated' | 'anonymous';
  
  /** Whether educator has consent to view individual data */
  hasIndividualConsent?: boolean;
}