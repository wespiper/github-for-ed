/**
 * Privacy Configuration for Educational Data Protection
 * Centralized configuration for all privacy-related settings
 */

/**
 * Privacy Configuration Settings
 * These settings control how the application handles student data privacy
 */
export const PrivacyConfig = {
  /** Data retention settings */
  retention: {
    /** Audit log retention period in days (7 years for educational compliance) */
    auditRetentionDays: 2555,
    
    /** Student data retention period in days (post-graduation) */
    studentDataRetentionDays: 2190, // 6 years
    
    /** AI interaction log retention in days */
    aiInteractionRetentionDays: 1095, // 3 years
    
    /** Session data retention in days */
    sessionDataRetentionDays: 365, // 1 year
    
    /** Reflection data retention in days */
    reflectionDataRetentionDays: 2190, // 6 years (educational value)
  },

  /** K-anonymity settings for data aggregation */
  anonymization: {
    /** Minimum cohort size for k-anonymity in analytics */
    minimumCohortSize: 10,
    
    /** Minimum cohort size for class-level insights */
    minimumClassSize: 5,
    
    /** Fields to always exclude from aggregated data */
    excludedFields: [
      'email',
      'firstName', 
      'lastName',
      'studentId',
      'ipAddress',
      'userAgent',
      'personalNotes'
    ],
    
    /** Sensitive content patterns to redact */
    redactionPatterns: [
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN pattern
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email pattern
      /\b\d{3}-\d{3}-\d{4}\b/g, // Phone number pattern
    ]
  },

  /** Default privacy levels */
  defaults: {
    /** Default privacy level for new documents */
    documentPrivacyLevel: 'restricted' as const,
    
    /** Default consent requirement */
    consentRequired: true,
    
    /** Default audit logging enabled */
    auditEnabled: true,
    
    /** Default data minimization enabled */
    dataMinimizationEnabled: true,
    
    /** Default anonymization for analytics */
    anonymizeAnalytics: true
  },

  /** Consent management settings */
  consent: {
    /** Consent validity period in days */
    consentValidityDays: 365,
    
    /** Required consent types for students */
    requiredConsentTypes: [
      'data_collection',
      'analytics',
      'ai_interaction',
      'educator_access'
    ] as const,
    
    /** Grace period for consent renewal in days */
    renewalGracePeriod: 30,
    
    /** Whether parent consent is required for minors */
    parentConsentRequired: true,
    
    /** Age threshold for requiring parent consent */
    parentConsentAge: 18
  },

  /** Access control settings */
  access: {
    /** Maximum age for student data access by educators (days) */
    educatorAccessTimeLimit: 90,
    
    /** Roles that can access audit logs */
    auditAccessRoles: ['admin', 'system'] as const,
    
    /** Roles that can view aggregated analytics */
    analyticsAccessRoles: ['educator', 'admin', 'system'] as const,
    
    /** Roles that can access individual student data */
    individualDataAccessRoles: ['educator', 'admin'] as const,
    
    /** Maximum failed access attempts before lockout */
    maxFailedAccessAttempts: 5,
    
    /** Access attempt lockout period in minutes */
    accessLockoutMinutes: 15
  },

  /** Data classification levels */
  classification: {
    /** Public data - no restrictions */
    public: {
      label: 'Public',
      description: 'Data that can be freely shared',
      auditRequired: false,
      consentRequired: false
    },
    
    /** Restricted data - limited access */
    restricted: {
      label: 'Restricted',
      description: 'Data with limited access requirements',
      auditRequired: true,
      consentRequired: true
    },
    
    /** Private data - strict access controls */
    private: {
      label: 'Private',
      description: 'Data requiring strict access controls',
      auditRequired: true,
      consentRequired: true
    },
    
    /** Highly sensitive data - maximum protection */
    highly_sensitive: {
      label: 'Highly Sensitive',
      description: 'Data requiring maximum protection',
      auditRequired: true,
      consentRequired: true
    }
  },

  /** Educational compliance settings */
  compliance: {
    /** FERPA compliance enabled */
    ferpaCompliance: true,
    
    /** COPPA compliance for students under 13 */
    coppaCompliance: true,
    
    /** GDPR compliance for international students */
    gdprCompliance: true,
    
    /** Data processing purposes */
    processingPurposes: [
      'educational_assessment',
      'learning_analytics',
      'academic_progress_tracking',
      'educational_research',
      'institutional_improvement'
    ] as const,
    
    /** Legal basis for data processing */
    legalBasis: 'legitimate_educational_interest' as const
  },

  /** Feature flags for privacy features */
  features: {
    /** Enable real-time privacy monitoring */
    realTimePrivacyMonitoring: true,
    
    /** Enable automatic data anonymization */
    automaticAnonymization: true,
    
    /** Enable consent dashboard for students */
    consentDashboard: true,
    
    /** Enable privacy impact assessment */
    privacyImpactAssessment: true,
    
    /** Enable data subject rights (GDPR) */
    dataSubjectRights: true,
    
    /** Enable privacy-preserving analytics */
    privacyPreservingAnalytics: true
  },

  /** Cache settings for privacy data */
  cache: {
    /** TTL for consent records in seconds */
    consentCacheTTL: 300, // 5 minutes
    
    /** TTL for access permissions in seconds */
    permissionsCacheTTL: 600, // 10 minutes
    
    /** TTL for anonymized analytics in seconds */
    analyticsCacheTTL: 3600, // 1 hour
    
    /** Whether to cache privacy metadata */
    cachePrivacyMetadata: true
  }
};

/**
 * Environment-specific privacy settings
 */
export const getPrivacyConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  const envConfigs = {
    development: {
      ...PrivacyConfig,
      defaults: {
        ...PrivacyConfig.defaults,
        auditEnabled: true, // Always audit in development
        dataMinimizationEnabled: false, // Allow full data for debugging
      },
      features: {
        ...PrivacyConfig.features,
        realTimePrivacyMonitoring: false, // Disable for performance
      }
    },
    
    test: {
      ...PrivacyConfig,
      retention: {
        ...PrivacyConfig.retention,
        auditRetentionDays: 1, // Short retention for tests
        studentDataRetentionDays: 1,
        aiInteractionRetentionDays: 1,
        sessionDataRetentionDays: 1,
        reflectionDataRetentionDays: 1,
      },
      anonymization: {
        ...PrivacyConfig.anonymization,
        minimumCohortSize: 2, // Lower threshold for testing
        minimumClassSize: 2,
      },
      cache: {
        ...PrivacyConfig.cache,
        consentCacheTTL: 10, // Short cache for testing
        permissionsCacheTTL: 10,
        analyticsCacheTTL: 10,
      }
    },
    
    production: {
      ...PrivacyConfig,
      defaults: {
        ...PrivacyConfig.defaults,
        auditEnabled: true,
        dataMinimizationEnabled: true,
        anonymizeAnalytics: true,
      },
      features: {
        ...PrivacyConfig.features,
        realTimePrivacyMonitoring: true,
        automaticAnonymization: true,
      }
    }
  };
  
  return envConfigs[env as keyof typeof envConfigs] || envConfigs.development;
};

/**
 * Privacy context validation utilities
 */
export const PrivacyUtils = {
  /**
   * Validate that a privacy context is complete and valid
   */
  validatePrivacyContext(context: any): boolean {
    return !!(
      context &&
      context.requesterId &&
      context.requesterType &&
      context.purpose &&
      context.timestamp
    );
  },

  /**
   * Check if a requester has permission for a specific operation
   */
  hasPermission(
    requesterType: string, 
    operation: string, 
    entityType: string
  ): boolean {
    const config = getPrivacyConfig();
    
    switch (operation) {
      case 'audit_access':
        return config.access.auditAccessRoles.includes(requesterType as any);
      case 'analytics_access':
        return config.access.analyticsAccessRoles.includes(requesterType as any);
      case 'individual_data_access':
        return config.access.individualDataAccessRoles.includes(requesterType as any);
      default:
        return true; // Allow by default, specific restrictions handled in repositories
    }
  },

  /**
   * Get data classification for entity type
   */
  getDataClassification(entityType: string): keyof typeof PrivacyConfig.classification {
    const sensitiveEntities = ['reflection', 'ai_interaction', 'student_profile'];
    const privateEntities = ['document', 'writing_session'];
    
    if (sensitiveEntities.includes(entityType)) {
      return 'highly_sensitive';
    } else if (privateEntities.includes(entityType)) {
      return 'private';
    } else {
      return 'restricted';
    }
  },

  /**
   * Check if consent is required for operation
   */
  isConsentRequired(
    operation: string, 
    entityType: string, 
    requesterType: string
  ): boolean {
    const config = getPrivacyConfig();
    const classification = this.getDataClassification(entityType);
    
    // System operations don't require consent
    if (requesterType === 'system') {
      return false;
    }
    
    // Admin operations don't require consent
    if (requesterType === 'admin') {
      return false;
    }
    
    // Check classification requirements
    return config.classification[classification].consentRequired;
  },

  /**
   * Generate privacy metadata for an entity
   */
  generatePrivacyMetadata(entityType: string): any {
    const config = getPrivacyConfig();
    const classification = this.getDataClassification(entityType);
    
    return {
      sensitivityLevel: classification,
      consentRequired: config.classification[classification].consentRequired,
      consentStatus: 'pending',
      analyticsAllowed: config.defaults.anonymizeAnalytics,
      aggregationAllowed: true,
      flags: {
        ferpa: config.compliance.ferpaCompliance,
        pii: ['student', 'user', 'profile'].some(type => entityType.includes(type))
      }
    };
  }
};

/**
 * Type exports for privacy configuration
 */
export type PrivacyConfigType = typeof PrivacyConfig;
export type ConsentType = typeof PrivacyConfig.consent.requiredConsentTypes[number];
export type ProcessingPurpose = typeof PrivacyConfig.compliance.processingPurposes[number];
export type DataClassification = keyof typeof PrivacyConfig.classification;