/**
 * Production Environment Configuration
 * Privacy-Enhanced Production Infrastructure Setup
 */

export interface ProductionConfig {
  environment: string;
  privacy: PrivacyConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  messaging: MessagingConfig;
  kubernetes: KubernetesConfig;
  monitoring: MonitoringConfig;
  compliance: ComplianceConfig;
}

export interface PrivacyConfig {
  dataResidency: {
    primaryRegion: string;
    allowedRegions: string[];
    dataLocalizations: Record<string, string[]>;
  };
  encryption: {
    atRest: {
      algorithm: 'AES-256-GCM';
      keyRotationDays: number;
      keyManagementService: string;
    };
    inTransit: {
      minTlsVersion: '1.2' | '1.3';
      cipherSuites: string[];
      certificateAuthority: string;
    };
  };
  logging: {
    piiRedaction: boolean;
    tokenization: boolean;
    retentionDays: number;
    minimumLogLevel: 'error' | 'warn' | 'info' | 'debug';
  };
  backup: {
    encryptionRequired: boolean;
    retentionPeriod: number;
    geographicRestrictions: string[];
    automaticErasure: boolean;
  };
}

export interface DatabaseConfig {
  clusters: {
    primary: {
      host: string;
      port: number;
      ssl: boolean;
      encryption: boolean;
      backups: {
        automated: boolean;
        encrypted: boolean;
        retention: number;
        crossRegion: boolean;
      };
    };
    readonly: DatabaseCluster[];
  };
  privacy: {
    columnEncryption: string[];
    tokenizedFields: string[];
    pseudonymizedIds: boolean;
    rightToErasure: boolean;
  };
}

export interface DatabaseCluster {
  host: string;
  port: number;
  region: string;
  ssl: boolean;
  encryption: boolean;
}

export interface RedisConfig {
  clusters: {
    cache: RedisCluster;
    sessions: RedisCluster;
    privacy: RedisCluster; // Dedicated privacy-aware cache
  };
  privacy: {
    encryptedStorage: boolean;
    consentBasedTtl: boolean;
    piiExclusion: boolean;
    anonymizedMetrics: boolean;
  };
}

export interface RedisCluster {
  host: string;
  port: number;
  ssl: boolean;
  encryption: boolean;
  sentinel: boolean;
}

export interface MessagingConfig {
  rabbitmq: {
    clusters: RabbitMQCluster[];
    privacy: {
      encryptedMessages: boolean;
      piiFiltering: boolean;
      auditTrail: boolean;
      messageRetention: number;
    };
  };
}

export interface RabbitMQCluster {
  host: string;
  port: number;
  ssl: boolean;
  management: boolean;
  highAvailability: boolean;
}

export interface KubernetesConfig {
  cluster: {
    provider: 'AWS' | 'GCP' | 'Azure' | 'on-premise';
    version: string;
    nodeGroups: NodeGroup[];
  };
  security: {
    rbac: boolean;
    networkPolicies: boolean;
    podSecurityPolicies: boolean;
    secretsEncryption: boolean;
  };
  privacy: {
    namespaceIsolation: boolean;
    dataLocalityPolicies: boolean;
    privacyAnnotations: boolean;
    complianceLabels: boolean;
  };
}

export interface NodeGroup {
  name: string;
  instanceType: string;
  minSize: number;
  maxSize: number;
  desiredSize: number;
  labels: Record<string, string>;
}

export interface MonitoringConfig {
  prometheus: {
    endpoint: string;
    retention: string;
    privacy: {
      metricsAnonymization: boolean;
      piiExclusion: boolean;
      consentBasedCollection: boolean;
    };
  };
  grafana: {
    endpoint: string;
    auth: string;
    privacy: {
      dashboardAccess: 'role-based';
      dataMinimization: boolean;
      anonymizedViews: boolean;
    };
  };
  alerting: {
    privacyIncidents: boolean;
    breachDetection: boolean;
    complianceViolations: boolean;
    performanceThresholds: PerformanceThresholds;
  };
}

export interface PerformanceThresholds {
  responseTime: number;
  errorRate: number;
  privacyCompliance: number;
  systemAvailability: number;
}

export interface ComplianceConfig {
  regulations: {
    ferpa: boolean;
    coppa: boolean;
    gdpr: boolean;
    ccpa: boolean;
    stateLaws: string[];
  };
  certifications: {
    soc2Type2: boolean;
    iso27001: boolean;
    privacyShield: boolean;
    coppaCompliant: boolean;
  };
  auditTrail: {
    immutable: boolean;
    encrypted: boolean;
    retention: number;
    crossReference: boolean;
  };
}

export const PRODUCTION_CONFIG: ProductionConfig = {
  environment: 'production',
  privacy: {
    dataResidency: {
      primaryRegion: 'us-east-1',
      allowedRegions: ['us-east-1', 'us-west-2', 'eu-west-1'],
      dataLocalizations: {
        'us': ['us-east-1', 'us-west-2'],
        'eu': ['eu-west-1', 'eu-central-1'],
        'ca': ['ca-central-1']
      }
    },
    encryption: {
      atRest: {
        algorithm: 'AES-256-GCM',
        keyRotationDays: 90,
        keyManagementService: 'AWS-KMS'
      },
      inTransit: {
        minTlsVersion: '1.3',
        cipherSuites: [
          'TLS_AES_256_GCM_SHA384',
          'TLS_CHACHA20_POLY1305_SHA256',
          'TLS_AES_128_GCM_SHA256'
        ],
        certificateAuthority: 'LetsEncrypt'
      }
    },
    logging: {
      piiRedaction: true,
      tokenization: true,
      retentionDays: 90,
      minimumLogLevel: 'warn'
    },
    backup: {
      encryptionRequired: true,
      retentionPeriod: 2555, // 7 years for FERPA compliance
      geographicRestrictions: ['us', 'eu'],
      automaticErasure: true
    }
  },
  database: {
    clusters: {
      primary: {
        host: 'scribe-tree-primary.cluster.amazonaws.com',
        port: 5432,
        ssl: true,
        encryption: true,
        backups: {
          automated: true,
          encrypted: true,
          retention: 30,
          crossRegion: true
        }
      },
      readonly: [
        {
          host: 'scribe-tree-readonly-1.cluster.amazonaws.com',
          port: 5432,
          region: 'us-east-1',
          ssl: true,
          encryption: true
        },
        {
          host: 'scribe-tree-readonly-2.cluster.amazonaws.com',
          port: 5432,
          region: 'us-west-2',
          ssl: true,
          encryption: true
        }
      ]
    },
    privacy: {
      columnEncryption: [
        'student_data.personal_info',
        'assignments.content',
        'submissions.writing_content',
        'reflections.content'
      ],
      tokenizedFields: [
        'users.email',
        'students.student_id',
        'educators.employee_id'
      ],
      pseudonymizedIds: true,
      rightToErasure: true
    }
  },
  redis: {
    clusters: {
      cache: {
        host: 'scribe-tree-cache.cluster.amazonaws.com',
        port: 6379,
        ssl: true,
        encryption: true,
        sentinel: true
      },
      sessions: {
        host: 'scribe-tree-sessions.cluster.amazonaws.com',
        port: 6379,
        ssl: true,
        encryption: true,
        sentinel: true
      },
      privacy: {
        host: 'scribe-tree-privacy.cluster.amazonaws.com',
        port: 6379,
        ssl: true,
        encryption: true,
        sentinel: true
      }
    },
    privacy: {
      encryptedStorage: true,
      consentBasedTtl: true,
      piiExclusion: true,
      anonymizedMetrics: true
    }
  },
  messaging: {
    rabbitmq: {
      clusters: [
        {
          host: 'scribe-tree-mq-1.amazonaws.com',
          port: 5671,
          ssl: true,
          management: true,
          highAvailability: true
        },
        {
          host: 'scribe-tree-mq-2.amazonaws.com',
          port: 5671,
          ssl: true,
          management: true,
          highAvailability: true
        }
      ],
      privacy: {
        encryptedMessages: true,
        piiFiltering: true,
        auditTrail: true,
        messageRetention: 90
      }
    }
  },
  kubernetes: {
    cluster: {
      provider: 'AWS',
      version: '1.27',
      nodeGroups: [
        {
          name: 'privacy-services',
          instanceType: 'm6i.large',
          minSize: 2,
          maxSize: 10,
          desiredSize: 3,
          labels: {
            'privacy-level': 'high',
            'compliance': 'ferpa-gdpr'
          }
        },
        {
          name: 'general-services',
          instanceType: 'm6i.medium',
          minSize: 3,
          maxSize: 15,
          desiredSize: 5,
          labels: {
            'privacy-level': 'standard',
            'workload': 'general'
          }
        }
      ]
    },
    security: {
      rbac: true,
      networkPolicies: true,
      podSecurityPolicies: true,
      secretsEncryption: true
    },
    privacy: {
      namespaceIsolation: true,
      dataLocalityPolicies: true,
      privacyAnnotations: true,
      complianceLabels: true
    }
  },
  monitoring: {
    prometheus: {
      endpoint: 'https://prometheus.scribe-tree.com',
      retention: '90d',
      privacy: {
        metricsAnonymization: true,
        piiExclusion: true,
        consentBasedCollection: true
      }
    },
    grafana: {
      endpoint: 'https://grafana.scribe-tree.com',
      auth: 'oauth2',
      privacy: {
        dashboardAccess: 'role-based',
        dataMinimization: true,
        anonymizedViews: true
      }
    },
    alerting: {
      privacyIncidents: true,
      breachDetection: true,
      complianceViolations: true,
      performanceThresholds: {
        responseTime: 50, // ms
        errorRate: 0.1, // %
        privacyCompliance: 99.0, // %
        systemAvailability: 99.9 // %
      }
    }
  },
  compliance: {
    regulations: {
      ferpa: true,
      coppa: true,
      gdpr: true,
      ccpa: true,
      stateLaws: ['NY-SHIELD', 'IL-BIPA', 'CA-SB-1001']
    },
    certifications: {
      soc2Type2: true,
      iso27001: true,
      privacyShield: false, // Deprecated
      coppaCompliant: true
    },
    auditTrail: {
      immutable: true,
      encrypted: true,
      retention: 2555, // 7 years
      crossReference: true
    }
  }
};

export class ProductionConfigValidator {
  public static validate(config: ProductionConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Privacy validation
    if (!config.privacy.encryption.atRest.algorithm.includes('AES-256')) {
      errors.push('Production requires AES-256 encryption at rest');
    }

    if (!config.privacy.encryption.inTransit.minTlsVersion.includes('1.3')) {
      warnings.push('Consider TLS 1.3 for enhanced security');
    }

    if (!config.privacy.logging.piiRedaction) {
      errors.push('PII redaction must be enabled in production');
    }

    // Database validation
    if (!config.database.clusters.primary.ssl) {
      errors.push('SSL must be enabled for production database');
    }

    if (!config.database.privacy.rightToErasure) {
      errors.push('Right to erasure must be implemented for GDPR compliance');
    }

    // Compliance validation
    if (!config.compliance.regulations.ferpa) {
      errors.push('FERPA compliance required for educational platform');
    }

    if (!config.compliance.auditTrail.immutable) {
      errors.push('Immutable audit trail required for compliance');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}