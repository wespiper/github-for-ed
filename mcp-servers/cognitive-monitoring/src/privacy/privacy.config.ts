import { PrivacyConfig } from './privacy.types';

export const PRIVACY_CONFIG: PrivacyConfig = {
  encryptionKey: process.env.PRIVACY_ENCRYPTION_KEY || 'cognitive-monitoring-key-2025',
  minCohortSize: 5, // K-anonymity requirement
  maxRetentionHours: 24, // Ephemeral data retention
  allowedPurposes: [
    'cognitive_assessment',
    'intervention',
    'analytics', 
    'monitoring'
  ],
  requireParentConsent: true,
  enableDifferentialPrivacy: true,
  epsilonValue: 0.1, // Low epsilon for strong privacy
  deltaValue: 1e-5, // Very small delta for high privacy guarantee
};

export const CONSENT_DEFAULTS = {
  cognitiveMonitoring: false, // Opt-in required
  behavioralAnalytics: false, // Opt-in required
  interventionAlerts: true, // Default enabled for educational benefit
  anonymizedInsights: true, // Default enabled, no individual data
  parentNotifications: true, // Default enabled for transparency
  dataSharing: 'none' as const, // No sharing by default
  retentionPeriod: 'session' as const, // Minimal retention by default
};

export const PRIVACY_THRESHOLDS = {
  HIGH_COGNITIVE_LOAD: 0.8,
  INTERVENTION_REQUIRED: 0.7,
  PATTERN_CONFIDENCE: 0.6,
  ANONYMIZATION_THRESHOLD: 5, // Minimum students in pattern
  MAX_PROCESSING_TIME_MS: 40, // Performance requirement
  CONSENT_CACHE_TTL_MS: 300000, // 5 minutes
};

export const EDUCATIONAL_CONTEXTS = [
  'essay_writing',
  'creative_writing',
  'research_paper',
  'peer_review',
  'reflection',
  'discussion',
  'assignment_submission',
  'revision_process'
];

// Privacy-safe error messages (no student data exposure)
export const PRIVACY_SAFE_ERRORS = {
  CONSENT_REQUIRED: 'Educational monitoring requires updated consent preferences',
  INSUFFICIENT_DATA: 'Analysis requires minimum classroom participation',
  PRIVACY_VIOLATION: 'Operation blocked to protect student privacy',
  RATE_LIMITED: 'Processing temporarily limited for privacy protection',
  INVALID_CONTEXT: 'Educational context not recognized for privacy assessment',
};