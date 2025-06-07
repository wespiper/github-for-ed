export { ServiceRouter, ServiceRoute, RouteContext } from './ServiceRouter';
export { APIGateway, GatewayConfig } from './APIGateway';

// Gateway factory for easy setup
import { FastifyInstance } from 'fastify';
import { ServiceRegistry, ServiceDiscoveryClient } from '../service-discovery';
import { CircuitBreakerService } from '../services/fallback/CircuitBreakerService';
import { APIGateway, GatewayConfig } from './APIGateway';

export class GatewayFactory {
  /**
   * Create a complete API gateway setup with service discovery
   */
  static async createGateway(
    fastify: FastifyInstance,
    config: Partial<GatewayConfig> = {}
  ): Promise<{
    gateway: APIGateway;
    serviceRegistry: ServiceRegistry;
    serviceDiscovery: ServiceDiscoveryClient;
    circuitBreaker: CircuitBreakerService;
  }> {
    // Create service infrastructure
    const serviceRegistry = new ServiceRegistry({
      healthCheckInterval: 30000,
      healthCheckTimeout: 5000,
      maxFailures: 3,
      registrationTtl: 300000
    });

    const circuitBreaker = new CircuitBreakerService({
      failureThreshold: 5,
      recoveryTimeout: 30000,
      monitoringPeriod: 60000
    });

    const serviceDiscovery = new ServiceDiscoveryClient(
      serviceRegistry,
      circuitBreaker,
      {
        retryAttempts: 3,
        retryDelay: 1000,
        loadBalancing: 'health-weighted',
        circuitBreakerEnabled: true
      }
    );

    // Create gateway
    const gateway = new APIGateway(fastify, serviceDiscovery, config);

    // Initialize gateway
    await gateway.initialize();

    return {
      gateway,
      serviceRegistry,
      serviceDiscovery,
      circuitBreaker
    };
  }

  /**
   * Register MCP services with the service registry
   */
  static registerMCPServices(serviceRegistry: ServiceRegistry): void {
    // Writing Analysis MCP Server
    serviceRegistry.register({
      id: 'writing-analysis-mcp',
      name: 'Writing Analysis Service',
      version: '1.0.0',
      type: 'hybrid',
      endpoints: {
        http: 'http://localhost:3001',
        health: 'http://localhost:3001/health'
      },
      metadata: {
        capabilities: [
          'writing-pattern-analysis',
          'reflection-quality-evaluation', 
          'writing-progress-tracking',
          'writing-insights-generation',
          'content-sensitivity-classification',
          'educational-purpose-validation',
          'ai-boundary-application',
          'writing-data-audit'
        ],
        dependencies: []
      }
    });

    // Student Profiling MCP Server
    serviceRegistry.register({
      id: 'student-profiling-mcp',
      name: 'Student Profiling Service',
      version: '1.0.0',
      type: 'hybrid',
      endpoints: {
        http: 'http://localhost:3002',
        health: 'http://localhost:3002/health'
      },
      metadata: {
        capabilities: [
          'student-profile-building',
          'learning-trajectory-tracking',
          'skill-development-assessment',
          'personalized-recommendations',
          'privacy-choice-management',
          'privacy-preserving-analytics',
          'data-access-validation',
          'privacy-dashboard-creation'
        ],
        dependencies: []
      }
    });

    // Educator Alerts MCP Server
    serviceRegistry.register({
      id: 'educator-alerts-mcp',
      name: 'Educator Alerts Service',
      version: '1.0.0',
      type: 'hybrid',
      endpoints: {
        http: 'http://localhost:3003',
        health: 'http://localhost:3003/health'
      },
      metadata: {
        capabilities: [
          'educator-alert-creation',
          'educator-alert-listing',
          'educator-alert-management',
          'intervention-tracking'
        ],
        dependencies: ['writing-analysis-mcp', 'student-profiling-mcp']
      }
    });

    // Academic Integrity MCP Server
    serviceRegistry.register({
      id: 'academic-integrity-mcp',
      name: 'Academic Integrity Service',
      version: '1.0.0',
      type: 'hybrid',
      endpoints: {
        http: 'http://localhost:3004',
        health: 'http://localhost:3004/health'
      },
      metadata: {
        capabilities: [
          'ai-assistance-detection',
          'integrity-analysis',
          'educational-validation',
          'integrity-reporting'
        ],
        dependencies: ['writing-analysis-mcp']
      }
    });

    // Educational AI Validator MCP Server
    serviceRegistry.register({
      id: 'educational-ai-validator-mcp',
      name: 'Educational AI Validator Service',
      version: '1.0.0',
      type: 'mcp',
      endpoints: {
        mcp: 'stdio',
        health: undefined
      },
      metadata: {
        capabilities: [
          'bounded-enhancement-validation',
          'blooms-taxonomy-analysis',
          'philosophy-enforcement',
          'educational-rationale-generation',
          'dependency-risk-detection',
          'reflection-requirement-validation',
          'cognitive-load-validation',
          'progressive-access-validation'
        ],
        dependencies: []
      }
    });

    console.log('[GATEWAY FACTORY] Registered 5 MCP services with service registry');
  }
}