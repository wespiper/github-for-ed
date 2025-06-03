export const PrivacyConfig = {
  // Differential Privacy Parameters
  differentialPrivacy: {
    epsilon: 1.0, // Privacy budget per query
    delta: 1e-5, // Probability of privacy breach
    sensitivity: 1.0, // Query sensitivity
    minCohortSize: 10, // Minimum group size for analytics
    noiseScale: 0.1, // Laplace noise scale
  },

  // Consent Management
  consent: {
    defaultSettings: {
      educationalSharing: {
        teacher: true,
        peer: false,
        parent: false,
      },
      platformImprovement: {
        anonymousPatterns: true,
        featureAnalytics: false,
        research: false,
      },
      personalBenefits: {
        enhancedAnalytics: false,
        portfolio: false,
        careerGuidance: false,
      },
      privacyControls: {
        retentionPeriod: '1_year',
        sensitiveContent: 'blur',
        thirdParty: 'none',
      },
    },
    consentVersion: '1.0',
    minAge: 13,
    parentalConsentRequired: true,
  },

  // Data Retention
  retention: {
    studentProfiles: 365 * 24 * 60 * 60 * 1000, // 1 year in ms
    learningTrajectories: 180 * 24 * 60 * 60 * 1000, // 6 months
    skillAssessments: 90 * 24 * 60 * 60 * 1000, // 3 months
    accessLogs: 30 * 24 * 60 * 60 * 1000, // 30 days
    deletedDataGracePeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
  },

  // Access Control
  accessControl: {
    maxAccessDuration: 24 * 60 * 60 * 1000, // 24 hours
    requireJustification: true,
    autoRevokeOnInactivity: 60 * 60 * 1000, // 1 hour
    auditAllAccess: true,
  },

  // Privacy Metrics
  metrics: {
    privacyScoreWeights: {
      dataMinimization: 0.3,
      consentCompliance: 0.3,
      accessControl: 0.2,
      dataProtection: 0.2,
    },
    alertThresholds: {
      unusualAccess: 3, // Standard deviations
      highDataExposure: 0.8, // Risk score
      lowPrivacyScore: 0.6, // Privacy score
    },
  },

  // Encryption
  encryption: {
    algorithm: 'aes-256-gcm',
    keyRotationPeriod: 90 * 24 * 60 * 60 * 1000, // 90 days
    saltRounds: 12,
  },
};

export type PrivacyConfiguration = typeof PrivacyConfig;