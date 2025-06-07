import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface ServiceConfig {
  serviceName: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  endpoints: {
    http?: string;
    mcp?: string;
    health?: string;
  };
  database?: {
    url: string;
    maxConnections?: number;
    timeout?: number;
  };
  monitoring: {
    enabled: boolean;
    tracing: boolean;
    metrics: boolean;
    healthCheckInterval: number;
  };
  security: {
    authRequired: boolean;
    rateLimiting: {
      enabled: boolean;
      max: number;
      timeWindow: string;
    };
    cors: {
      enabled: boolean;
      origins: string[];
    };
  };
  features: Record<string, boolean>;
  customSettings: Record<string, any>;
}

export interface GlobalConfig {
  environment: 'development' | 'staging' | 'production';
  services: Record<string, ServiceConfig>;
  shared: {
    database: {
      url: string;
      migrationTimeout: number;
    };
    redis: {
      url?: string;
      enabled: boolean;
    };
    messageQueue: {
      type: 'rabbitmq' | 'inmemory';
      url?: string;
    };
    monitoring: {
      globalEnabled: boolean;
      logLevel: 'debug' | 'info' | 'warn' | 'error';
      cleanupInterval: number;
    };
  };
  apiGateway: {
    port: number;
    host: string;
    timeout: number;
    retries: number;
  };
  circuitBreaker: {
    failureThreshold: number;
    recoveryTimeout: number;
    monitoringPeriod: number;
  };
}

export class ConfigurationManager extends EventEmitter {
  private config: GlobalConfig;
  private configPath: string;
  private watchTimer?: NodeJS.Timeout;

  constructor(configPath?: string) {
    super();
    this.configPath = configPath || join(process.cwd(), 'config', 'services.json');
    this.config = this.getDefaultConfig();
  }

  /**
   * Initialize configuration manager
   */
  async initialize(): Promise<void> {
    try {
      await this.loadConfiguration();
      this.startConfigWatch();
      console.log('[CONFIG MANAGER] Initialized successfully');
    } catch (error) {
      console.error('[CONFIG MANAGER] Failed to initialize:', error);
      console.log('[CONFIG MANAGER] Using default configuration');
    }
  }

  /**
   * Load configuration from file
   */
  async loadConfiguration(): Promise<void> {
    try {
      const configData = await fs.readFile(this.configPath, 'utf-8');
      const loadedConfig = JSON.parse(configData);
      
      // Merge with defaults
      this.config = this.mergeWithDefaults(loadedConfig);
      
      // Override with environment variables
      this.applyEnvironmentOverrides();
      
      this.emit('configLoaded', this.config);
      console.log('[CONFIG MANAGER] Configuration loaded successfully');
      
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        console.log('[CONFIG MANAGER] Config file not found, creating default config');
        await this.saveConfiguration();
      } else {
        throw error;
      }
    }
  }

  /**
   * Save current configuration to file
   */
  async saveConfiguration(): Promise<void> {
    try {
      // Ensure config directory exists
      const configDir = join(this.configPath, '..');
      await fs.mkdir(configDir, { recursive: true });
      
      // Save configuration
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
      console.log('[CONFIG MANAGER] Configuration saved successfully');
      
    } catch (error) {
      console.error('[CONFIG MANAGER] Failed to save configuration:', error);
      throw error;
    }
  }

  /**
   * Get configuration for a specific service
   */
  getServiceConfig(serviceName: string): ServiceConfig | undefined {
    return this.config.services[serviceName];
  }

  /**
   * Update service configuration
   */
  updateServiceConfig(serviceName: string, updates: Partial<ServiceConfig>): void {
    if (!this.config.services[serviceName]) {
      this.config.services[serviceName] = this.getDefaultServiceConfig(serviceName);
    }

    this.config.services[serviceName] = {
      ...this.config.services[serviceName],
      ...updates
    };

    this.emit('serviceConfigUpdated', serviceName, this.config.services[serviceName]);
  }

  /**
   * Register a new service
   */
  registerService(serviceName: string, config: Partial<ServiceConfig>): void {
    const serviceConfig = {
      ...this.getDefaultServiceConfig(serviceName),
      ...config
    };

    this.config.services[serviceName] = serviceConfig;
    this.emit('serviceRegistered', serviceName, serviceConfig);
    
    console.log(`[CONFIG MANAGER] Registered service: ${serviceName}`);
  }

  /**
   * Get global configuration
   */
  getGlobalConfig(): GlobalConfig {
    return { ...this.config };
  }

  /**
   * Update global configuration
   */
  updateGlobalConfig(updates: Partial<GlobalConfig>): void {
    this.config = this.deepMerge(this.config, updates);
    this.emit('globalConfigUpdated', this.config);
  }

  /**
   * Get feature flag value
   */
  getFeatureFlag(serviceName: string, featureName: string): boolean {
    const serviceConfig = this.getServiceConfig(serviceName);
    return serviceConfig?.features[featureName] || false;
  }

  /**
   * Set feature flag
   */
  setFeatureFlag(serviceName: string, featureName: string, enabled: boolean): void {
    if (!this.config.services[serviceName]) {
      this.registerService(serviceName, {});
    }

    this.config.services[serviceName].features[featureName] = enabled;
    this.emit('featureFlagUpdated', serviceName, featureName, enabled);
  }

  /**
   * Get environment-specific configuration
   */
  getEnvironmentConfig(): Partial<GlobalConfig> {
    const env = process.env.NODE_ENV as 'development' | 'staging' | 'production' || 'development';
    
    const envConfigs = {
      development: {
        shared: {
          monitoring: { logLevel: 'debug' as const },
          messageQueue: { type: 'inmemory' as const }
        },
        apiGateway: { timeout: 30000, retries: 3 }
      },
      staging: {
        shared: {
          monitoring: { logLevel: 'info' as const },
          messageQueue: { type: 'rabbitmq' as const }
        },
        apiGateway: { timeout: 15000, retries: 2 }
      },
      production: {
        shared: {
          monitoring: { logLevel: 'warn' as const },
          messageQueue: { type: 'rabbitmq' as const }
        },
        apiGateway: { timeout: 10000, retries: 1 }
      }
    };

    return envConfigs[env] || envConfigs.development;
  }

  /**
   * Validate configuration
   */
  validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate global config
    if (!this.config.shared.database.url) {
      errors.push('Database URL is required');
    }

    if (this.config.apiGateway.port < 1 || this.config.apiGateway.port > 65535) {
      errors.push('API Gateway port must be between 1 and 65535');
    }

    // Validate service configs
    for (const [serviceName, serviceConfig] of Object.entries(this.config.services)) {
      if (!serviceConfig.serviceName) {
        errors.push(`Service ${serviceName} is missing serviceName`);
      }

      if (!serviceConfig.version) {
        errors.push(`Service ${serviceName} is missing version`);
      }

      if (serviceConfig.endpoints.http && !this.isValidUrl(serviceConfig.endpoints.http)) {
        errors.push(`Service ${serviceName} has invalid HTTP endpoint`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): GlobalConfig {
    return {
      environment: (process.env.NODE_ENV as any) || 'development',
      services: {},
      shared: {
        database: {
          url: process.env.DATABASE_URL || 'postgresql://localhost:5432/scribe_tree',
          migrationTimeout: 60000
        },
        redis: {
          url: process.env.REDIS_URL,
          enabled: !!process.env.REDIS_URL
        },
        messageQueue: {
          type: process.env.MESSAGE_QUEUE_TYPE as any || 'inmemory',
          url: process.env.RABBITMQ_URL
        },
        monitoring: {
          globalEnabled: true,
          logLevel: 'info',
          cleanupInterval: 10 * 60 * 1000 // 10 minutes
        }
      },
      apiGateway: {
        port: parseInt(process.env.GATEWAY_PORT || '3000'),
        host: process.env.GATEWAY_HOST || '0.0.0.0',
        timeout: 30000,
        retries: 3
      },
      circuitBreaker: {
        failureThreshold: 5,
        recoveryTimeout: 30000,
        monitoringPeriod: 60000
      }
    };
  }

  /**
   * Get default service configuration
   */
  private getDefaultServiceConfig(serviceName: string): ServiceConfig {
    return {
      serviceName,
      version: '1.0.0',
      environment: this.config.environment,
      endpoints: {},
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
          origins: ['*']
        }
      },
      features: {},
      customSettings: {}
    };
  }

  /**
   * Merge configuration with defaults
   */
  private mergeWithDefaults(loadedConfig: any): GlobalConfig {
    return this.deepMerge(this.getDefaultConfig(), loadedConfig);
  }

  /**
   * Apply environment variable overrides
   */
  private applyEnvironmentOverrides(): void {
    // Override from environment variables
    if (process.env.DATABASE_URL) {
      this.config.shared.database.url = process.env.DATABASE_URL;
    }

    if (process.env.REDIS_URL) {
      this.config.shared.redis.url = process.env.REDIS_URL;
      this.config.shared.redis.enabled = true;
    }

    if (process.env.GATEWAY_PORT) {
      this.config.apiGateway.port = parseInt(process.env.GATEWAY_PORT);
    }

    if (process.env.LOG_LEVEL) {
      this.config.shared.monitoring.logLevel = process.env.LOG_LEVEL as any;
    }
  }

  /**
   * Start watching configuration file for changes
   */
  private startConfigWatch(): void {
    if (this.watchTimer) {
      clearInterval(this.watchTimer);
    }

    // Poll for changes every 30 seconds
    this.watchTimer = setInterval(async () => {
      try {
        const stats = await fs.stat(this.configPath);
        // This is a simple implementation - in production you'd want proper file watching
        // For now, we just emit that config should be reloaded
        this.emit('configFileChanged');
      } catch (error) {
        // File doesn't exist or can't be accessed
      }
    }, 30000);
  }

  /**
   * Deep merge objects
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Shutdown configuration manager
   */
  shutdown(): void {
    if (this.watchTimer) {
      clearInterval(this.watchTimer);
      this.watchTimer = undefined;
    }
    
    this.removeAllListeners();
    console.log('[CONFIG MANAGER] Shutdown complete');
  }
}