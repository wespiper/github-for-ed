import { EventEmitter } from 'events';
import { ServiceRegistry, ServiceInfo } from '../../service-discovery/ServiceRegistry';
import { ServiceDiscoveryClient } from '../../service-discovery/ServiceDiscoveryClient';
import { APIGateway } from '../../gateway/APIGateway';
import { ServiceOrchestrator, WorkflowDefinition } from '../../communication/ServiceOrchestrator';
import { ConfigurationManager } from '../../config/ConfigurationManager';
import { DistributedTracing } from '../../monitoring/distributed/DistributedTracing';
import { ServiceMetricsCollector } from '../../monitoring/distributed/ServiceMetricsCollector';
import { CircuitBreakerService } from '../fallback/CircuitBreakerService';
import { FastifyInstance } from 'fastify';

export interface DistributedServicesConfig {
  gateway: {
    enabled: boolean;
    port: number;
    host: string;
  };
  monitoring: {
    enabled: boolean;
    metricsInterval: number;
    tracingEnabled: boolean;
  };
  orchestration: {
    enabled: boolean;
    maxConcurrentWorkflows: number;
  };
  circuitBreaker: {
    enabled: boolean;
    failureThreshold: number;
    recoveryTimeout: number;
  };
}

export interface ServiceRegistrationInfo {
  name: string;
  type: 'mcp' | 'http' | 'hybrid';
  version: string;
  endpoints: {
    mcp?: string;
    http?: string;
    health?: string;
  };
  capabilities: string[];
  dependencies: string[];
}

export class DistributedServicesManager extends EventEmitter {
  private serviceRegistry: ServiceRegistry;
  private serviceDiscovery: ServiceDiscoveryClient;
  private apiGateway?: APIGateway;
  private orchestrator: ServiceOrchestrator;
  private configManager: ConfigurationManager;
  private tracing: DistributedTracing;
  private metricsCollector: ServiceMetricsCollector;
  private circuitBreaker: CircuitBreakerService;
  private config: DistributedServicesConfig;
  private monitoringTimer?: NodeJS.Timeout;

  constructor(
    fastifyInstance?: FastifyInstance,
    config: Partial<DistributedServicesConfig> = {}
  ) {
    super();
    
    this.config = {
      gateway: {
        enabled: config.gateway?.enabled !== false,
        port: config.gateway?.port || 3000,
        host: config.gateway?.host || '0.0.0.0'
      },
      monitoring: {
        enabled: config.monitoring?.enabled !== false,
        metricsInterval: config.monitoring?.metricsInterval || 30000,
        tracingEnabled: config.monitoring?.tracingEnabled !== false
      },
      orchestration: {
        enabled: config.orchestration?.enabled !== false,
        maxConcurrentWorkflows: config.orchestration?.maxConcurrentWorkflows || 10
      },
      circuitBreaker: {
        enabled: config.circuitBreaker?.enabled !== false,
        failureThreshold: config.circuitBreaker?.failureThreshold || 5,
        recoveryTimeout: config.circuitBreaker?.recoveryTimeout || 30000
      },
      ...config
    };

    // Initialize core services
    this.configManager = new ConfigurationManager();
    this.serviceRegistry = new ServiceRegistry();
    this.circuitBreaker = new CircuitBreakerService();
    this.serviceDiscovery = new ServiceDiscoveryClient(
      this.serviceRegistry,
      this.circuitBreaker
    );
    this.orchestrator = new ServiceOrchestrator(this.serviceDiscovery);
    this.tracing = new DistributedTracing('scribe-tree-backend');
    this.metricsCollector = new ServiceMetricsCollector();

    // Initialize API Gateway if Fastify instance provided
    if (fastifyInstance && this.config.gateway.enabled) {
      this.apiGateway = new APIGateway(fastifyInstance, this.serviceDiscovery);
    }

    this.setupEventListeners();
  }

  /**
   * Initialize the distributed services system
   */
  async initialize(): Promise<void> {
    console.log('[DISTRIBUTED SERVICES] Initializing system...');

    try {
      // Initialize configuration
      await this.configManager.initialize();
      
      // Initialize API Gateway if enabled
      if (this.apiGateway) {
        await this.apiGateway.initialize();
      }

      // Register default service configurations
      await this.registerKnownServices();

      // Start monitoring if enabled
      if (this.config.monitoring.enabled) {
        this.startMonitoring();
      }

      // Register default workflows
      this.registerDefaultWorkflows();

      this.emit('systemInitialized');
      
      console.log('[DISTRIBUTED SERVICES] System initialized successfully');
      
    } catch (error) {
      console.error('[DISTRIBUTED SERVICES] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Register a service with the distributed system
   */
  async registerService(info: ServiceRegistrationInfo): Promise<void> {
    const serviceInfo: ServiceInfo = {
      id: `${info.name}-${Date.now()}`,
      name: info.name,
      version: info.version,
      type: info.type,
      endpoints: info.endpoints,
      metadata: {
        status: 'unknown',
        lastHealthCheck: new Date(),
        capabilities: info.capabilities,
        dependencies: info.dependencies
      },
      registrationTime: new Date(),
      lastSeen: new Date()
    };

    // Register with service registry
    this.serviceRegistry.register(serviceInfo);

    // Register configuration
    this.configManager.registerService(info.name, {
      serviceName: info.name,
      version: info.version,
      endpoints: info.endpoints
    });

    console.log(`[DISTRIBUTED SERVICES] Registered service: ${info.name}`);
    this.emit('serviceRegistered', serviceInfo);
  }

  /**
   * Execute a distributed workflow
   */
  async executeWorkflow(
    workflowId: string,
    input: any,
    correlationId?: string
  ): Promise<any> {
    if (!this.config.orchestration.enabled) {
      throw new Error('Service orchestration is disabled');
    }

    this.tracing.startSpan('workflow.execute', undefined, {
      'workflow.id': workflowId,
      'correlation.id': correlationId
    });

    try {
      const execution = await this.orchestrator.executeWorkflow(
        workflowId,
        input,
        correlationId
      );

      this.metricsCollector.recordBusinessMetric(
        'orchestrator',
        'workflow.completed',
        1,
        { workflow_id: workflowId }
      );

      return execution;

    } catch (error) {
      this.metricsCollector.recordBusinessMetric(
        'orchestrator',
        'workflow.failed',
        1,
        { workflow_id: workflowId }
      );
      throw error;
    }
  }

  /**
   * Call a service capability with automatic discovery and fallback
   */
  async callService<T>(
    capability: string,
    operation: string,
    data: any,
    options: {
      timeout?: number;
      retries?: number;
      fallback?: () => Promise<T>;
    } = {}
  ): Promise<T> {
    const span = this.tracing.startSpan(`service.call.${capability}`, undefined, {
      'service.capability': capability,
      'service.operation': operation
    });

    try {
      const result = await this.serviceDiscovery.executeWithDiscovery(
        capability,
        async (service) => {
          // Record request metrics
          const startTime = Date.now();
          
          try {
            // This would be implemented based on service type (HTTP/MCP)
            const response = await this.callServiceEndpoint(service, operation, data);
            
            const duration = Date.now() - startTime;
            this.metricsCollector.recordRequest(
              service.name,
              operation,
              'POST',
              200,
              duration
            );

            return response;
          } catch (error) {
            const duration = Date.now() - startTime;
            this.metricsCollector.recordRequest(
              service.name,
              operation,
              'POST',
              500,
              duration
            );
            throw error;
          }
        },
        {
          fallback: options.fallback,
          maxAttempts: options.retries
        }
      );

      this.tracing.finishSpan(span.spanId, 'success');
      return result;

    } catch (error) {
      this.tracing.finishSpan(span.spanId, 'error', error as Error);
      throw error;
    }
  }

  /**
   * Get system health status
   */
  getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: number;
    healthyServices: number;
    degradedServices: number;
    unhealthyServices: number;
    uptime: number;
    components: {
      serviceRegistry: 'healthy' | 'unhealthy';
      apiGateway: 'healthy' | 'unhealthy' | 'disabled';
      orchestrator: 'healthy' | 'unhealthy';
      monitoring: 'healthy' | 'unhealthy';
    };
  } {
    const overview = this.metricsCollector.getSystemOverview();
    const registryStats = this.serviceRegistry.getStats();

    // Determine overall system health
    let status: 'healthy' | 'degraded' | 'unhealthy';
    const healthyRatio = overview.healthyServices / Math.max(overview.totalServices, 1);
    
    if (healthyRatio >= 0.8 && overview.errorRate < 0.05) {
      status = 'healthy';
    } else if (healthyRatio >= 0.5 && overview.errorRate < 0.1) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      services: overview.totalServices,
      healthyServices: overview.healthyServices,
      degradedServices: overview.degradedServices,
      unhealthyServices: overview.unhealthyServices,
      uptime: overview.uptime,
      components: {
        serviceRegistry: registryStats.totalServices > 0 ? 'healthy' : 'unhealthy',
        apiGateway: this.apiGateway ? 'healthy' : 'disabled',
        orchestrator: 'healthy', // Could add health checks
        monitoring: this.config.monitoring.enabled ? 'healthy' : 'unhealthy'
      }
    };
  }

  /**
   * Get comprehensive system metrics
   */
  getSystemMetrics(): {
    overview: ReturnType<ServiceMetricsCollector['getSystemOverview']>;
    services: ReturnType<ServiceMetricsCollector['getServiceHealth']>;
    registry: ReturnType<ServiceRegistry['getStats']>;
    discovery: ReturnType<ServiceDiscoveryClient['getDiscoveryStats']>;
    orchestrator: ReturnType<ServiceOrchestrator['getStats']>;
    tracing: ReturnType<DistributedTracing['getStats']>;
    circuitBreaker: ReturnType<CircuitBreakerService['getStats']>;
  } {
    return {
      overview: this.metricsCollector.getSystemOverview(),
      services: this.metricsCollector.getServiceHealth(),
      registry: this.serviceRegistry.getStats(),
      discovery: this.serviceDiscovery.getDiscoveryStats(),
      orchestrator: this.orchestrator.getStats(),
      tracing: this.tracing.getStats(),
      circuitBreaker: this.circuitBreaker.getStats()
    };
  }

  /**
   * Register known MCP services
   */
  private async registerKnownServices(): Promise<void> {
    const knownServices: ServiceRegistrationInfo[] = [
      {
        name: 'writing-analysis',
        type: 'hybrid',
        version: '1.0.0',
        endpoints: {
          http: 'http://localhost:3001',
          health: 'http://localhost:3001/health'
        },
        capabilities: [
          'writing-pattern-analysis',
          'reflection-quality-evaluation',
          'writing-progress-tracking',
          'writing-insights-generation'
        ],
        dependencies: []
      },
      {
        name: 'student-profiling',
        type: 'hybrid',
        version: '1.0.0',
        endpoints: {
          http: 'http://localhost:3002',
          health: 'http://localhost:3002/health'
        },
        capabilities: [
          'student-profile-building',
          'learning-trajectory-tracking',
          'skill-development-assessment',
          'personalized-recommendations'
        ],
        dependencies: []
      },
      {
        name: 'educator-alerts',
        type: 'hybrid',
        version: '1.0.0',
        endpoints: {
          http: 'http://localhost:3003',
          health: 'http://localhost:3003/health'
        },
        capabilities: [
          'educator-alert-creation',
          'educator-alert-listing',
          'educator-alert-management'
        ],
        dependencies: ['student-profiling', 'writing-analysis']
      },
      {
        name: 'academic-integrity',
        type: 'hybrid',
        version: '1.0.0',
        endpoints: {
          http: 'http://localhost:3004',
          health: 'http://localhost:3004/health'
        },
        capabilities: [
          'ai-assistance-detection',
          'integrity-analysis',
          'educational-validation'
        ],
        dependencies: ['writing-analysis']
      },
      {
        name: 'educational-ai-validator',
        type: 'mcp',
        version: '1.0.0',
        endpoints: {
          mcp: 'stdio'
        },
        capabilities: [
          'bounded-enhancement-validation',
          'blooms-taxonomy-analysis',
          'philosophy-enforcement'
        ],
        dependencies: []
      }
    ];

    for (const service of knownServices) {
      await this.registerService(service);
    }
  }

  /**
   * Register default workflows for educational operations
   */
  private registerDefaultWorkflows(): void {
    // Complete student writing analysis workflow
    const writingAnalysisWorkflow: WorkflowDefinition = {
      id: 'complete-writing-analysis',
      name: 'Complete Writing Analysis',
      description: 'Comprehensive analysis of student writing with AI boundaries',
      rollbackOnFailure: false,
      maxConcurrency: 5,
      steps: [
        {
          id: 'analyze-patterns',
          serviceCapability: 'writing-pattern-analysis',
          operation: 'analyze-patterns',
          input: {},
          timeout: 10000
        },
        {
          id: 'evaluate-reflection',
          serviceCapability: 'reflection-quality-evaluation',
          operation: 'evaluate-reflection',
          input: {},
          dependencies: ['analyze-patterns'],
          timeout: 8000
        },
        {
          id: 'check-integrity',
          serviceCapability: 'ai-assistance-detection',
          operation: 'detect-ai',
          input: {},
          dependencies: ['analyze-patterns'],
          timeout: 15000
        },
        {
          id: 'generate-alerts',
          serviceCapability: 'educator-alert-creation',
          operation: 'create-alert',
          input: {},
          dependencies: ['evaluate-reflection', 'check-integrity'],
          optional: true
        }
      ]
    };

    this.orchestrator.registerWorkflow(writingAnalysisWorkflow);
    console.log('[DISTRIBUTED SERVICES] Registered default workflows');
  }

  /**
   * Start monitoring services
   */
  private startMonitoring(): void {
    this.monitoringTimer = setInterval(() => {
      this.performSystemHealthCheck();
    }, this.config.monitoring.metricsInterval);

    console.log('[DISTRIBUTED SERVICES] Monitoring started');
  }

  /**
   * Perform system-wide health check
   */
  private async performSystemHealthCheck(): Promise<void> {
    const services = this.serviceRegistry.getServices();
    
    for (const service of services) {
      try {
        const startTime = Date.now();
        
        // Simulate health check (would be actual HTTP call)
        const isHealthy = Math.random() > 0.1; // 90% success rate
        const responseTime = startTime + Math.random() * 100;
        
        this.metricsCollector.recordHealthCheck(
          service.name,
          isHealthy,
          responseTime,
          isHealthy ? undefined : 'Service unavailable'
        );

      } catch (error) {
        this.metricsCollector.recordHealthCheck(
          service.name,
          false,
          5000,
          (error as Error).message
        );
      }
    }
  }

  /**
   * Call service endpoint (placeholder for actual implementation)
   */
  private async callServiceEndpoint(
    service: ServiceInfo,
    operation: string,
    data: any
  ): Promise<any> {
    // This would implement the actual service call logic
    // Based on service type (HTTP vs MCP)
    
    // For now, simulate a response to avoid unused parameter warnings
    console.log(`Calling ${service.name}.${operation} with data:`, data);
    throw new Error('Service call implementation needed');
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Service registry events
    this.serviceRegistry.on('serviceRegistered', (service) => {
      this.emit('serviceRegistered', service);
    });

    this.serviceRegistry.on('serviceHealthChanged', (service, previousStatus) => {
      this.emit('serviceHealthChanged', service, previousStatus);
    });

    // Metrics events
    this.metricsCollector.on('metricRecorded', (metric) => {
      this.emit('metricRecorded', metric);
    });

    // Orchestrator events
    this.orchestrator.on('workflowCompleted', (execution) => {
      this.emit('workflowCompleted', execution);
    });

    this.orchestrator.on('workflowFailed', (execution, error) => {
      this.emit('workflowFailed', execution, error);
    });
  }

  /**
   * Shutdown the distributed services system
   */
  async shutdown(): Promise<void> {
    console.log('[DISTRIBUTED SERVICES] Shutting down...');

    // Stop monitoring
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }

    // Shutdown components
    if (this.apiGateway) {
      await this.apiGateway.shutdown();
    }

    this.serviceRegistry.shutdown();
    this.configManager.shutdown();

    this.removeAllListeners();
    console.log('[DISTRIBUTED SERVICES] Shutdown complete');
  }
}