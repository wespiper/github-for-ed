export { ConfigurationManager, ServiceConfig, GlobalConfig } from './ConfigurationManager';

// Export existing configuration modules
export * from './cache';
export * from './messaging';
export * from './migration';
export * from './privacy.config';

// Service configuration factory
import { ConfigurationManager } from './ConfigurationManager';

let globalConfigManager: ConfigurationManager | null = null;

/**
 * Get or create the global configuration manager instance
 */
export function getConfigurationManager(): ConfigurationManager {
  if (!globalConfigManager) {
    globalConfigManager = new ConfigurationManager();
  }
  return globalConfigManager;
}

/**
 * Initialize configuration management
 */
export async function initializeConfiguration(configPath?: string): Promise<ConfigurationManager> {
  if (globalConfigManager) {
    await globalConfigManager.shutdown();
  }
  
  globalConfigManager = new ConfigurationManager(configPath);
  await globalConfigManager.initialize();
  
  return globalConfigManager;
}

/**
 * MCP service configurations
 */
export const MCPServiceConfigs = {
  WRITING_ANALYSIS: {
    serviceName: 'writing-analysis',
    version: '1.0.0',
    endpoints: {
      http: 'http://localhost:3001',
      health: 'http://localhost:3001/health'
    },
    monitoring: {
      enabled: true,
      tracing: true,
      metrics: true,
      healthCheckInterval: 30000
    },
    security: {
      authRequired: true,
      rateLimiting: {
        enabled: true,
        max: 50,
        timeWindow: '1 minute'
      },
      cors: {
        enabled: true,
        origins: ['http://localhost:5173', 'http://localhost:3000']
      }
    },
    features: {
      'privacy-enhancement': true,
      'content-classification': true,
      'ai-boundary-enforcement': true,
      'audit-logging': true
    },
    customSettings: {
      maxAnalysisLength: 10000,
      privacyCheckTimeout: 5000,
      cacheEnabled: true,
      cacheTtl: 300000 // 5 minutes
    }
  },

  STUDENT_PROFILING: {
    serviceName: 'student-profiling',
    version: '1.0.0',
    endpoints: {
      http: 'http://localhost:3002',
      health: 'http://localhost:3002/health'
    },
    monitoring: {
      enabled: true,
      tracing: true,
      metrics: true,
      healthCheckInterval: 30000
    },
    security: {
      authRequired: true,
      rateLimiting: {
        enabled: true,
        max: 30,
        timeWindow: '1 minute'
      },
      cors: {
        enabled: true,
        origins: ['http://localhost:5173', 'http://localhost:3000']
      }
    },
    features: {
      'privacy-dashboard': true,
      'differential-privacy': true,
      'consent-management': true,
      'data-minimization': true
    },
    customSettings: {
      maxProfileDataAge: 86400000, // 24 hours
      privacyChoicesCacheTtl: 600000, // 10 minutes
      differentialPrivacyEpsilon: 1.0,
      minimumCohortSize: 10
    }
  },

  EDUCATOR_ALERTS: {
    serviceName: 'educator-alerts',
    version: '1.0.0',
    endpoints: {
      http: 'http://localhost:3003',
      health: 'http://localhost:3003/health'
    },
    monitoring: {
      enabled: true,
      tracing: true,
      metrics: true,
      healthCheckInterval: 30000
    },
    security: {
      authRequired: true,
      rateLimiting: {
        enabled: true,
        max: 100,
        timeWindow: '1 minute'
      },
      cors: {
        enabled: true,
        origins: ['http://localhost:5173', 'http://localhost:3000']
      }
    },
    features: {
      'real-time-notifications': true,
      'alert-prioritization': true,
      'intervention-tracking': true,
      'effectiveness-measurement': true
    },
    customSettings: {
      alertRetentionDays: 30,
      maxAlertsPerStudent: 10,
      notificationTimeout: 5000,
      escalationThreshold: 3
    }
  },

  ACADEMIC_INTEGRITY: {
    serviceName: 'academic-integrity',
    version: '1.0.0',
    endpoints: {
      http: 'http://localhost:3004',
      health: 'http://localhost:3004/health'
    },
    monitoring: {
      enabled: true,
      tracing: true,
      metrics: true,
      healthCheckInterval: 30000
    },
    security: {
      authRequired: true,
      rateLimiting: {
        enabled: true,
        max: 20,
        timeWindow: '1 minute'
      },
      cors: {
        enabled: true,
        origins: ['http://localhost:5173', 'http://localhost:3000']
      }
    },
    features: {
      'ai-detection': true,
      'integrity-analysis': true,
      'educational-validation': true,
      'detailed-reporting': true
    },
    customSettings: {
      aiDetectionTimeout: 15000,
      integrityAnalysisDepth: 'comprehensive',
      reportRetentionDays: 90,
      confidenceThreshold: 0.7
    }
  },

  EDUCATIONAL_AI_VALIDATOR: {
    serviceName: 'educational-ai-validator',
    version: '1.0.0',
    endpoints: {
      mcp: 'stdio' // MCP-only service
    },
    monitoring: {
      enabled: true,
      tracing: true,
      metrics: false, // No HTTP endpoint for metrics
      healthCheckInterval: 60000
    },
    security: {
      authRequired: false, // MCP services handle auth differently
      rateLimiting: {
        enabled: false,
        max: 0,
        timeWindow: '1 minute'
      },
      cors: {
        enabled: false,
        origins: []
      }
    },
    features: {
      'bounded-enhancement': true,
      'blooms-taxonomy': true,
      'philosophy-enforcement': true,
      'cognitive-load-validation': true
    },
    customSettings: {
      maxValidationTime: 8000,
      bloomsLevels: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'],
      philosophyStrictness: 'high',
      cachingEnabled: false // MCP doesn't support caching yet
    }
  }
} as const;

/**
 * Initialize all MCP service configurations
 */
export async function setupMCPServiceConfigurations(): Promise<void> {
  const configManager = getConfigurationManager();
  
  // Register all MCP service configurations
  Object.values(MCPServiceConfigs).forEach(config => {
    configManager.registerService(config.serviceName, config);
  });

  console.log('[CONFIG] Registered 5 MCP service configurations');
}

/**
 * Get configuration for distributed services setup
 */
export function getDistributedServicesConfig() {
  return {
    serviceDiscovery: {
      healthCheckInterval: 30000,
      healthCheckTimeout: 5000,
      maxFailures: 3,
      registrationTtl: 300000
    },
    circuitBreaker: {
      failureThreshold: 5,
      recoveryTimeout: 30000,
      monitoringPeriod: 60000
    },
    apiGateway: {
      authRequired: true,
      corsEnabled: true,
      rateLimiting: {
        enabled: true,
        global: {
          max: 1000,
          timeWindow: '1 minute'
        }
      },
      monitoring: {
        enabled: true,
        metricsEndpoint: '/gateway/metrics'
      }
    },
    httpClient: {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      circuitBreakerEnabled: true
    },
    monitoring: {
      enableTracing: true,
      enableMetrics: true,
      cleanupInterval: 10 * 60 * 1000,
      maxTraceAge: 60 * 60 * 1000,
      maxMetricAge: 4 * 60 * 60 * 1000
    }
  };
}