export interface PrivacyContext {
  readonly studentId: string;
  readonly requesterRole: 'student' | 'teacher' | 'admin' | 'parent';
  readonly purpose: 'cognitive_assessment' | 'intervention' | 'analytics' | 'monitoring';
  readonly consentLevel: 'none' | 'basic' | 'standard' | 'enhanced';
  readonly sessionId: string;
  readonly timestamp: Date;
}

export interface ConsentPreferences {
  readonly cognitiveMonitoring: boolean;
  readonly behavioralAnalytics: boolean;
  readonly interventionAlerts: boolean;
  readonly anonymizedInsights: boolean;
  readonly parentNotifications: boolean;
  readonly dataSharing: 'none' | 'classroom' | 'institution' | 'research';
  readonly retentionPeriod: 'session' | 'week' | 'month' | 'semester';
}

export interface CognitiveEvent {
  readonly eventType: 'keystroke' | 'pause' | 'scroll' | 'focus' | 'blur' | 'edit' | 'delete';
  readonly timestamp: number;
  readonly sessionId: string;
  readonly anonymizedMetrics: {
    readonly duration?: number;
    readonly frequency?: number;
    readonly pattern?: string;
  };
  // No direct student identifiers or content
}

export interface AnonymizedPattern {
  readonly patternId: string;
  readonly cohortSize: number; // Minimum 5 for k-anonymity
  readonly confidence: number;
  readonly educationalContext: string;
  readonly timeframe: 'session' | 'day' | 'week';
  readonly metrics: Record<string, number>;
}

export interface PrivacyConfig {
  readonly encryptionKey: string;
  readonly minCohortSize: number; // Default: 5 for k-anonymity
  readonly maxRetentionHours: number; // Default: 24
  readonly allowedPurposes: string[];
  readonly requireParentConsent: boolean;
  readonly enableDifferentialPrivacy: boolean;
  readonly epsilonValue: number; // Differential privacy parameter
  readonly deltaValue: number; // Differential privacy parameter
}

export interface InterventionContext {
  readonly urgency: 'low' | 'medium' | 'high';
  readonly type: 'cognitive_load' | 'engagement' | 'struggle' | 'success';
  readonly anonymizedTriggers: string[];
  readonly suggestedActions: string[];
  readonly consentRequired: boolean;
}

export interface PrivacyViolation {
  readonly violationType: 'pii_exposure' | 'consent_missing' | 'purpose_mismatch' | 'retention_exceeded';
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly timestamp: Date;
  readonly context: string;
  readonly remediation: string[];
}

export interface EphemeralBuffer<T> {
  add(item: T): void;
  getAggregate(): any;
  clear(): void;
  size(): number;
  isExpired(): boolean;
}

export interface PrivacyAuditLog {
  readonly action: string;
  readonly timestamp: Date;
  readonly hashedStudentId: string;
  readonly purpose: string;
  readonly consentLevel: string;
  readonly dataMinimized: boolean;
  readonly complianceScore: number;
}