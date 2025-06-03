/**
 * Educator Alerts Service with Triple-Tier Fallback Architecture
 * 
 * Tier 1: MCP Protocol (when available)
 * Tier 2: HTTP REST API via Fastify (service-to-service communication)
 * Tier 3: Repository Pattern (database fallback)
 */

import { ServiceFactory } from '../container/ServiceFactory';
import { 
  EducatorAlertsRepository,
  EducatorAlert,
  RecommendedAction,
  InterventionRecommendation,
  InterventionSchedule,
  InterventionEffectiveness,
  EducatorPreferences,
  AlertAnalytics,
  AlertFilters
} from '../repositories/interfaces/EducatorAlertsRepository';
import { PrivacyContext, AuditEntry, AnonymizedData, AnalyticsCriteria } from '../types/privacy';
import { EventBus } from '../events/EventBus';
import { Logger } from '../monitoring/Logger';

export interface EducatorAlertsMCPClient {
  generateInterventionRecommendations(params: any): Promise<any>;
  sendEducatorAlerts(params: any): Promise<any>;
  scheduleInterventionActions(params: any): Promise<any>;
  trackInterventionEffectiveness(params: any): Promise<any>;
  isConnected(): boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export interface EducatorAlertsHttpClient {
  generateInterventionRecommendations(params: any): Promise<any>;
  sendEducatorAlerts(params: any): Promise<any>;
  scheduleInterventionActions(params: any): Promise<any>;
  trackInterventionEffectiveness(params: any): Promise<any>;
  isHealthy(): Promise<boolean>;
}

/**
 * HTTP client implementation for Fastify server communication
 */
export class FastifyEducatorAlertsClient implements EducatorAlertsHttpClient {
  constructor(private baseUrl: string = 'http://localhost:3001') {}

  async generateInterventionRecommendations(params: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/educator-alerts/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return response.json();
  }

  async sendEducatorAlerts(params: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/educator-alerts/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return response.json();
  }

  async scheduleInterventionActions(params: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/educator-alerts/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return response.json();
  }

  async trackInterventionEffectiveness(params: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/educator-alerts/track-effectiveness`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return response.json();
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/educator-alerts/health`);
      const data = await response.json();
      return response.ok && data.success;
    } catch {
      return false;
    }
  }
}

/**
 * Service configuration options
 */
export interface EducatorAlertsServiceConfig {
  preferredTier: 'mcp' | 'http' | 'repository';
  enableFallback: boolean;
  timeouts: {
    mcp: number;
    http: number;
    repository: number;
  };
  retryAttempts: {
    mcp: number;
    http: number;
  };
  healthCheckInterval: number;
}

/**
 * Default service configuration
 */
const DEFAULT_CONFIG: EducatorAlertsServiceConfig = {
  preferredTier: 'mcp',
  enableFallback: true,
  timeouts: {
    mcp: 5000,     // 5 seconds
    http: 3000,    // 3 seconds
    repository: 1000 // 1 second
  },
  retryAttempts: {
    mcp: 2,
    http: 1
  },
  healthCheckInterval: 30000 // 30 seconds
};

/**
 * Triple-tier educator alerts service implementation
 */
export class EducatorAlertsService {
  private mcpClient?: EducatorAlertsMCPClient;
  private httpClient?: EducatorAlertsHttpClient;
  private repository: EducatorAlertsRepository;
  private eventBus: EventBus;
  private logger: Logger;
  private config: EducatorAlertsServiceConfig;
  private healthStatus: {
    mcp: boolean;
    http: boolean;
    repository: boolean;
  };

  constructor(
    config: Partial<EducatorAlertsServiceConfig> = {},
    mcpClient?: EducatorAlertsMCPClient,
    httpClient?: EducatorAlertsHttpClient
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.mcpClient = mcpClient;
    this.httpClient = httpClient;
    
    const serviceFactory = ServiceFactory.getInstance();
    this.repository = serviceFactory.getEducatorAlertsRepository();
    this.eventBus = serviceFactory.getEventBus();
    this.logger = new Logger('EducatorAlertsService');
    
    // Use MCP client from ServiceFactory if not provided
    if (!this.mcpClient) {
      try {
        this.mcpClient = serviceFactory.getEducatorAlertsMCPClient();
      } catch (error) {
        this.logger.warn('MCP client not available from ServiceFactory, falling back to HTTP/Repository');
      }
    }
    
    this.healthStatus = {
      mcp: false,
      http: false,
      repository: true // Repository is always available
    };

    this.startHealthChecks();
  }

  /**
   * Generate intervention recommendations with fallback
   */
  async generateInterventionRecommendations(
    studentId: string,
    analysisData: Record<string, any>,
    educationalContext: {
      assignmentId?: string;
      courseId?: string;
      learningObjectives?: string[];
    },
    privacyContext: PrivacyContext
  ): Promise<InterventionRecommendation[]> {
    const operation = 'generateInterventionRecommendations';
    this.logger.info(`${operation} started for student ${studentId}`);

    try {
      // Tier 1: MCP Protocol
      if (this.shouldUseMCP() && this.mcpClient) {
        try {
          const result = await this.executeWithTimeout(
            () => this.mcpClient!.generateInterventionRecommendations({
              studentId,
              analysisData,
              educationalContext,
              privacyContext
            }),
            this.config.timeouts.mcp
          );
          
          this.logger.info(`${operation} succeeded via MCP`);
          await this.logEvent(operation, studentId, 'success', 'mcp', privacyContext);
          return result;
        } catch (error) {
          this.logger.warn(`${operation} failed via MCP:`, error);
          await this.logEvent(operation, studentId, 'failed', 'mcp', privacyContext);
          
          if (!this.config.enableFallback) {
            throw error;
          }
        }
      }

      // Tier 2: HTTP REST API
      if (this.shouldUseHttp() && this.httpClient) {
        try {
          const result = await this.executeWithTimeout(
            () => this.httpClient!.generateInterventionRecommendations({
              studentId,
              analysisData,
              educationalContext,
              privacyContext
            }),
            this.config.timeouts.http
          );
          
          this.logger.info(`${operation} succeeded via HTTP`);
          await this.logEvent(operation, studentId, 'success', 'http', privacyContext);
          return result;
        } catch (error) {
          this.logger.warn(`${operation} failed via HTTP:`, error);
          await this.logEvent(operation, studentId, 'failed', 'http', privacyContext);
          
          if (!this.config.enableFallback) {
            throw error;
          }
        }
      }

      // Tier 3: Repository Pattern (fallback)
      const result = await this.executeWithTimeout(
        () => this.repository.generateInterventionRecommendations(
          studentId,
          analysisData,
          educationalContext,
          privacyContext
        ),
        this.config.timeouts.repository
      );
      
      this.logger.info(`${operation} succeeded via Repository`);
      await this.logEvent(operation, studentId, 'success', 'repository', privacyContext);
      return result;

    } catch (error) {
      this.logger.error(`${operation} failed on all tiers:`, error);
      await this.logEvent(operation, studentId, 'failed', 'all_tiers', privacyContext);
      throw new Error(`Failed to generate intervention recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send educator alerts with fallback
   */
  async sendEducatorAlerts(
    alerts: Omit<EducatorAlert, 'id' | 'createdAt' | 'updatedAt'>[],
    deliveryOptions: {
      immediate?: boolean;
      channels?: ('in_app' | 'email' | 'sms')[];
      batchWithOthers?: boolean;
    },
    privacyContext: PrivacyContext
  ): Promise<{
    sent: EducatorAlert[];
    failed: { alert: Omit<EducatorAlert, 'id' | 'createdAt' | 'updatedAt'>; reason: string }[];
    queued: EducatorAlert[];
  }> {
    const operation = 'sendEducatorAlerts';
    this.logger.info(`${operation} started for ${alerts.length} alerts`);

    try {
      // Tier 1: MCP Protocol
      if (this.shouldUseMCP() && this.mcpClient) {
        try {
          const result = await this.executeWithTimeout(
            () => this.mcpClient!.sendEducatorAlerts({
              alerts,
              deliveryOptions,
              privacyContext
            }),
            this.config.timeouts.mcp
          );
          
          this.logger.info(`${operation} succeeded via MCP`);
          await this.logEvent(operation, 'bulk_alerts', 'success', 'mcp', privacyContext);
          return result;
        } catch (error) {
          this.logger.warn(`${operation} failed via MCP:`, error);
          await this.logEvent(operation, 'bulk_alerts', 'failed', 'mcp', privacyContext);
          
          if (!this.config.enableFallback) {
            throw error;
          }
        }
      }

      // Tier 2: HTTP REST API
      if (this.shouldUseHttp() && this.httpClient) {
        try {
          const result = await this.executeWithTimeout(
            () => this.httpClient!.sendEducatorAlerts({
              alerts,
              deliveryOptions,
              privacyContext
            }),
            this.config.timeouts.http
          );
          
          this.logger.info(`${operation} succeeded via HTTP`);
          await this.logEvent(operation, 'bulk_alerts', 'success', 'http', privacyContext);
          return result;
        } catch (error) {
          this.logger.warn(`${operation} failed via HTTP:`, error);
          await this.logEvent(operation, 'bulk_alerts', 'failed', 'http', privacyContext);
          
          if (!this.config.enableFallback) {
            throw error;
          }
        }
      }

      // Tier 3: Repository Pattern (fallback)
      const result = await this.executeWithTimeout(
        () => this.repository.sendEducatorAlerts(alerts, deliveryOptions, privacyContext),
        this.config.timeouts.repository
      );
      
      this.logger.info(`${operation} succeeded via Repository`);
      await this.logEvent(operation, 'bulk_alerts', 'success', 'repository', privacyContext);
      return result;

    } catch (error) {
      this.logger.error(`${operation} failed on all tiers:`, error);
      await this.logEvent(operation, 'bulk_alerts', 'failed', 'all_tiers', privacyContext);
      throw new Error(`Failed to send educator alerts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Schedule intervention actions with fallback
   */
  async scheduleInterventionActions(
    interventionId: string,
    scheduleData: Omit<InterventionSchedule, 'id' | 'createdAt' | 'updatedAt'>,
    reminderSettings: {
      sendReminders: boolean;
      reminderTimes: string[];
      includePreparation?: boolean;
    },
    privacyContext: PrivacyContext
  ): Promise<InterventionSchedule> {
    const operation = 'scheduleInterventionActions';
    this.logger.info(`${operation} started for intervention ${interventionId}`);

    try {
      // Tier 1: MCP Protocol
      if (this.shouldUseMCP() && this.mcpClient) {
        try {
          const result = await this.executeWithTimeout(
            () => this.mcpClient!.scheduleInterventionActions({
              interventionId,
              scheduleData,
              reminderSettings,
              privacyContext
            }),
            this.config.timeouts.mcp
          );
          
          this.logger.info(`${operation} succeeded via MCP`);
          await this.logEvent(operation, interventionId, 'success', 'mcp', privacyContext);
          return result;
        } catch (error) {
          this.logger.warn(`${operation} failed via MCP:`, error);
          await this.logEvent(operation, interventionId, 'failed', 'mcp', privacyContext);
          
          if (!this.config.enableFallback) {
            throw error;
          }
        }
      }

      // Tier 2: HTTP REST API
      if (this.shouldUseHttp() && this.httpClient) {
        try {
          const result = await this.executeWithTimeout(
            () => this.httpClient!.scheduleInterventionActions({
              interventionId,
              scheduleData,
              reminderSettings,
              privacyContext
            }),
            this.config.timeouts.http
          );
          
          this.logger.info(`${operation} succeeded via HTTP`);
          await this.logEvent(operation, interventionId, 'success', 'http', privacyContext);
          return result;
        } catch (error) {
          this.logger.warn(`${operation} failed via HTTP:`, error);
          await this.logEvent(operation, interventionId, 'failed', 'http', privacyContext);
          
          if (!this.config.enableFallback) {
            throw error;
          }
        }
      }

      // Tier 3: Repository Pattern (fallback)
      const result = await this.executeWithTimeout(
        () => this.repository.scheduleInterventionActions(
          interventionId,
          scheduleData,
          reminderSettings,
          privacyContext
        ),
        this.config.timeouts.repository
      );
      
      this.logger.info(`${operation} succeeded via Repository`);
      await this.logEvent(operation, interventionId, 'success', 'repository', privacyContext);
      return result;

    } catch (error) {
      this.logger.error(`${operation} failed on all tiers:`, error);
      await this.logEvent(operation, interventionId, 'failed', 'all_tiers', privacyContext);
      throw new Error(`Failed to schedule intervention actions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Track intervention effectiveness with fallback
   */
  async trackInterventionEffectiveness(
    interventionId: string,
    measurementData: Omit<InterventionEffectiveness, 'id' | 'measurementDate'>,
    comparisonPeriod: {
      baseline: { start: Date; end: Date };
      measurement: { start: Date; end: Date };
    },
    privacyContext: PrivacyContext
  ): Promise<InterventionEffectiveness> {
    const operation = 'trackInterventionEffectiveness';
    this.logger.info(`${operation} started for intervention ${interventionId}`);

    try {
      // Tier 1: MCP Protocol
      if (this.shouldUseMCP() && this.mcpClient) {
        try {
          const result = await this.executeWithTimeout(
            () => this.mcpClient!.trackInterventionEffectiveness({
              interventionId,
              measurementData,
              comparisonPeriod,
              privacyContext
            }),
            this.config.timeouts.mcp
          );
          
          this.logger.info(`${operation} succeeded via MCP`);
          await this.logEvent(operation, interventionId, 'success', 'mcp', privacyContext);
          return result;
        } catch (error) {
          this.logger.warn(`${operation} failed via MCP:`, error);
          await this.logEvent(operation, interventionId, 'failed', 'mcp', privacyContext);
          
          if (!this.config.enableFallback) {
            throw error;
          }
        }
      }

      // Tier 2: HTTP REST API
      if (this.shouldUseHttp() && this.httpClient) {
        try {
          const result = await this.executeWithTimeout(
            () => this.httpClient!.trackInterventionEffectiveness({
              interventionId,
              measurementData,
              comparisonPeriod,
              privacyContext
            }),
            this.config.timeouts.http
          );
          
          this.logger.info(`${operation} succeeded via HTTP`);
          await this.logEvent(operation, interventionId, 'success', 'http', privacyContext);
          return result;
        } catch (error) {
          this.logger.warn(`${operation} failed via HTTP:`, error);
          await this.logEvent(operation, interventionId, 'failed', 'http', privacyContext);
          
          if (!this.config.enableFallback) {
            throw error;
          }
        }
      }

      // Tier 3: Repository Pattern (fallback)
      const result = await this.executeWithTimeout(
        () => this.repository.trackInterventionEffectiveness(
          interventionId,
          measurementData,
          comparisonPeriod,
          privacyContext
        ),
        this.config.timeouts.repository
      );
      
      this.logger.info(`${operation} succeeded via Repository`);
      await this.logEvent(operation, interventionId, 'success', 'repository', privacyContext);
      return result;

    } catch (error) {
      this.logger.error(`${operation} failed on all tiers:`, error);
      await this.logEvent(operation, interventionId, 'failed', 'all_tiers', privacyContext);
      throw new Error(`Failed to track intervention effectiveness: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Repository-only methods (these always use repository tier)
   */
  async findByEducator(
    educatorId: string,
    filters: AlertFilters,
    privacyContext: PrivacyContext
  ): Promise<EducatorAlert[]> {
    return this.repository.findByEducator(educatorId, filters, privacyContext);
  }

  async getUrgentAlerts(
    educatorId: string,
    privacyContext: PrivacyContext
  ): Promise<EducatorAlert[]> {
    return this.repository.getUrgentAlerts(educatorId, privacyContext);
  }

  async acknowledgeAlerts(
    alertIds: string[],
    acknowledgmentData: {
      acknowledgedBy: string;
      notes?: string;
      plannedActions?: string[];
    },
    privacyContext: PrivacyContext
  ): Promise<EducatorAlert[]> {
    return this.repository.acknowledgeAlerts(alertIds, acknowledgmentData, privacyContext);
  }

  async getEducatorPreferences(
    educatorId: string,
    privacyContext: PrivacyContext
  ): Promise<EducatorPreferences | null> {
    return this.repository.getEducatorPreferences(educatorId, privacyContext);
  }

  async getAlertAnalytics(
    filters: AlertFilters,
    criteria: AnalyticsCriteria,
    privacyContext: PrivacyContext
  ): Promise<AnonymizedData<AlertAnalytics>> {
    return this.repository.getAlertAnalytics(filters, criteria, privacyContext);
  }

  // Health and Diagnostic Methods
  getHealthStatus() {
    return { ...this.healthStatus };
  }

  getActiveServices() {
    return {
      mcp: this.healthStatus.mcp && !!this.mcpClient,
      http: this.healthStatus.http && !!this.httpClient,
      repository: this.healthStatus.repository
    };
  }

  getCurrentTier(): 'mcp' | 'http' | 'repository' {
    if (this.shouldUseMCP()) return 'mcp';
    if (this.shouldUseHttp()) return 'http';
    return 'repository';
  }

  // Private Helper Methods
  private shouldUseMCP(): boolean {
    return (this.config.preferredTier === 'mcp' || this.config.enableFallback) && 
           this.healthStatus.mcp && 
           !!this.mcpClient;
  }

  private shouldUseHttp(): boolean {
    return (this.config.preferredTier === 'http' || this.config.enableFallback) && 
           this.healthStatus.http && 
           !!this.httpClient;
  }

  private async executeWithTimeout<T>(operation: () => Promise<T>, timeout: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);

      operation()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  private async logEvent(
    operation: string, 
    entityId: string, 
    result: 'success' | 'failed', 
    tier: 'mcp' | 'http' | 'repository' | 'all_tiers',
    privacyContext: PrivacyContext
  ): Promise<void> {
    try {
      await this.eventBus.publish({
        type: 'educator_alerts_operation',
        correlationId: privacyContext.correlationId || `ea_${Date.now()}`,
        timestamp: new Date(),
        payload: {
          operation,
          entityId,
          result,
          tier,
          userId: privacyContext.requesterId
        },
        metadata: {
          service: 'EducatorAlertsService',
          privacyContext
        }
      });
    } catch (error) {
      this.logger.warn('Failed to log event:', error);
    }
  }

  private startHealthChecks(): void {
    setInterval(async () => {
      await this.checkHealth();
    }, this.config.healthCheckInterval);

    // Initial health check
    setTimeout(() => this.checkHealth(), 1000);
  }

  private async checkHealth(): Promise<void> {
    // Check MCP health
    if (this.mcpClient) {
      try {
        this.healthStatus.mcp = this.mcpClient.isConnected();
      } catch (error) {
        this.healthStatus.mcp = false;
      }
    }

    // Check HTTP health
    if (this.httpClient) {
      try {
        this.healthStatus.http = await this.httpClient.isHealthy();
      } catch (error) {
        this.healthStatus.http = false;
      }
    }

    // Repository is always available (unless catastrophic failure)
    this.healthStatus.repository = true;
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down EducatorAlertsService');
    
    if (this.mcpClient) {
      try {
        await this.mcpClient.disconnect();
      } catch (error) {
        this.logger.warn('Error disconnecting MCP client:', error);
      }
    }
  }
}