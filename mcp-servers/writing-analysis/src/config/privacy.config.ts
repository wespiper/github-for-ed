import { registerAs } from '@nestjs/config';

export interface PrivacyConfig {
  contentClassification: {
    thresholds: {
      high: number;
      medium: number;
      low: number;
    };
  };
  educationalValidation: {
    minScore: number;
    requireJustification: boolean;
  };
  aiBoundaries: {
    strictMode: boolean;
    blockDirectAnswers: boolean;
    maxContextLength: number;
  };
  audit: {
    enabled: boolean;
    retentionDays: number;
    logSensitiveAccess: boolean;
  };
  consent: {
    defaultRequired: boolean;
    minorExtraProtections: boolean;
    cacheTtl: number;
  };
  dataMinimization: {
    autoRedactPii: boolean;
    anonymizeAfterDays: number;
    aggregateMinCohortSize: number;
  };
  differentialPrivacy: {
    enabled: boolean;
    epsilon: number;
    delta: number;
  };
  performance: {
    maxPrivacyCheckMs: number;
    cacheResults: boolean;
    cacheTtl: number;
  };
  encryption: {
    algorithm: string;
    keyRotationDays: number;
  };
}

export default registerAs('privacy', (): PrivacyConfig => ({
  contentClassification: {
    thresholds: {
      high: parseFloat(process.env.SENSITIVITY_THRESHOLD_HIGH || '0.9'),
      medium: parseFloat(process.env.SENSITIVITY_THRESHOLD_MEDIUM || '0.7'),
      low: parseFloat(process.env.SENSITIVITY_THRESHOLD_LOW || '0.5'),
    },
  },
  educationalValidation: {
    minScore: parseFloat(process.env.EDUCATIONAL_PURPOSE_MIN_SCORE || '0.8'),
    requireJustification: process.env.REQUIRE_EDUCATIONAL_JUSTIFICATION === 'true',
  },
  aiBoundaries: {
    strictMode: process.env.AI_BOUNDARY_STRICT_MODE === 'true',
    blockDirectAnswers: process.env.BLOCK_DIRECT_ANSWERS === 'true',
    maxContextLength: parseInt(process.env.MAX_AI_CONTEXT_LENGTH || '500', 10),
  },
  audit: {
    enabled: process.env.ENABLE_AUDIT_LOGGING === 'true',
    retentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS || '365', 10),
    logSensitiveAccess: process.env.LOG_SENSITIVE_ACCESS === 'true',
  },
  consent: {
    defaultRequired: process.env.DEFAULT_CONSENT_REQUIRED === 'true',
    minorExtraProtections: process.env.MINOR_EXTRA_PROTECTIONS === 'true',
    cacheTtl: parseInt(process.env.CONSENT_CACHE_TTL || '3600', 10),
  },
  dataMinimization: {
    autoRedactPii: process.env.AUTO_REDACT_PII === 'true',
    anonymizeAfterDays: parseInt(process.env.ANONYMIZE_AFTER_DAYS || '30', 10),
    aggregateMinCohortSize: parseInt(process.env.AGGREGATE_MIN_COHORT_SIZE || '5', 10),
  },
  differentialPrivacy: {
    enabled: process.env.ENABLE_DIFFERENTIAL_PRIVACY === 'true',
    epsilon: parseFloat(process.env.PRIVACY_EPSILON || '1.0'),
    delta: parseFloat(process.env.PRIVACY_DELTA || '0.00001'),
  },
  performance: {
    maxPrivacyCheckMs: parseInt(process.env.MAX_PRIVACY_CHECK_MS || '50', 10),
    cacheResults: process.env.CACHE_PRIVACY_RESULTS === 'true',
    cacheTtl: parseInt(process.env.PRIVACY_CACHE_TTL || '300', 10),
  },
  encryption: {
    algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-cbc',
    keyRotationDays: parseInt(process.env.ENCRYPTION_KEY_ROTATION_DAYS || '90', 10),
  },
}));