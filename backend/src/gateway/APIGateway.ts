import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ServiceRouter, ServiceRoute, RouteContext } from './ServiceRouter';
import { ServiceDiscoveryClient } from '../service-discovery';
import { v4 as uuidv4 } from 'uuid';

export interface GatewayConfig {
  authRequired: boolean;
  corsEnabled: boolean;
  rateLimiting: {
    enabled: boolean;
    global: {
      max: number;
      timeWindow: string;
    };
  };
  monitoring: {
    enabled: boolean;
    metricsEndpoint: string;
  };
}

export class APIGateway {
  private fastify: FastifyInstance;
  private serviceRouter: ServiceRouter;
  private serviceDiscovery: ServiceDiscoveryClient;
  private config: GatewayConfig;

  constructor(
    fastify: FastifyInstance,
    serviceDiscovery: ServiceDiscoveryClient,
    config: Partial<GatewayConfig> = {}
  ) {
    this.fastify = fastify;
    this.serviceDiscovery = serviceDiscovery;
    this.serviceRouter = new ServiceRouter(serviceDiscovery);
    this.config = {
      authRequired: config.authRequired !== false,
      corsEnabled: config.corsEnabled !== false,
      rateLimiting: {
        enabled: config.rateLimiting?.enabled !== false,
        global: {
          max: config.rateLimiting?.global?.max || 100,
          timeWindow: config.rateLimiting?.global?.timeWindow || '1 minute'
        }
      },
      monitoring: {
        enabled: config.monitoring?.enabled !== false,
        metricsEndpoint: config.monitoring?.metricsEndpoint || '/gateway/metrics'
      },
      ...config
    };
  }

  /**
   * Initialize the API gateway with middleware and routes
   */
  async initialize(): Promise<void> {
    console.log('[API GATEWAY] Initializing...');

    // Setup middleware
    await this.setupMiddleware();

    // Register gateway routes
    this.registerGatewayRoutes();

    // Setup service routes
    this.setupServiceRoutes();

    console.log('[API GATEWAY] Initialization complete');
  }

  /**
   * Setup gateway middleware
   */
  private async setupMiddleware(): Promise<void> {
    // CORS support
    if (this.config.corsEnabled) {
      await this.fastify.register(require('@fastify/cors'), {
        origin: true,
        credentials: true
      });
    }

    // Rate limiting
    if (this.config.rateLimiting.enabled) {
      await this.fastify.register(require('@fastify/rate-limit'), {
        max: this.config.rateLimiting.global.max,
        timeWindow: this.config.rateLimiting.global.timeWindow
      });
    }

    // Request logging and correlation ID
    this.fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
      const correlationId = (request.headers['x-correlation-id'] as string) || uuidv4();
      request.headers['x-correlation-id'] = correlationId;
      
      console.log(`[API GATEWAY] ${request.method} ${request.url} - ${correlationId}`);
    });

    // Authentication hook (if enabled)
    if (this.config.authRequired) {
      this.fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
        // Skip auth for health checks and gateway management
        if (request.url.startsWith('/gateway/') || request.url === '/health') {
          return;
        }

        const token = request.headers.authorization?.replace('Bearer ', '');
        if (!token) {
          reply.status(401).send({ error: 'Authentication required' });
          return;
        }

        // Add user context to request (simplified)
        (request as any).user = { id: 'user123', role: 'student' }; // This would come from JWT
      });
    }
  }

  /**
   * Register gateway management routes
   */
  private registerGatewayRoutes(): void {
    // Health check
    this.fastify.get('/gateway/health', async (request: FastifyRequest, reply: FastifyReply) => {
      const health = await this.serviceRouter.healthCheck();
      const status = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 206 : 503;
      
      reply.status(status).send({
        gateway: 'healthy',
        router: health,
        timestamp: new Date().toISOString()
      });
    });

    // Metrics endpoint
    if (this.config.monitoring.enabled) {
      this.fastify.get(this.config.monitoring.metricsEndpoint, async (request: FastifyRequest, reply: FastifyReply) => {
        const stats = this.serviceRouter.getRoutingStats();
        reply.send({
          gateway: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            routes: this.serviceRouter.getRoutes().length
          },
          routing: stats,
          timestamp: new Date().toISOString()
        });
      });
    }

    // Service discovery info
    this.fastify.get('/gateway/services', async (request: FastifyRequest, reply: FastifyReply) => {
      const stats = this.serviceDiscovery.getDiscoveryStats();
      reply.send(stats);
    });

    // Route information
    this.fastify.get('/gateway/routes', async (request: FastifyRequest, reply: FastifyReply) => {
      const routes = this.serviceRouter.getRoutes();
      reply.send({ routes, count: routes.length });
    });
  }

  /**
   * Setup service routes for MCP services
   */
  private setupServiceRoutes(): void {
    // Define routes for each MCP service capability
    const serviceRoutes: ServiceRoute[] = [
      // Writing Analysis Service routes
      {
        path: '/api/writing-analysis/analyze-patterns',
        capability: 'writing-pattern-analysis',
        serviceType: 'hybrid',
        authentication: true,
        timeout: 10000
      },
      {
        path: '/api/writing-analysis/evaluate-reflection',
        capability: 'reflection-quality-evaluation',
        serviceType: 'hybrid',
        authentication: true,
        timeout: 8000
      },
      {
        path: '/api/writing-analysis/track-progress',
        capability: 'writing-progress-tracking',
        serviceType: 'hybrid',
        authentication: true
      },
      {
        path: '/api/writing-analysis/generate-insights',
        capability: 'writing-insights-generation',
        serviceType: 'hybrid',
        authentication: true,
        timeout: 15000
      },

      // Student Profiling Service routes
      {
        path: '/api/student-profiling/build-profile',
        capability: 'student-profile-building',
        serviceType: 'hybrid',
        authentication: true,
        timeout: 12000
      },
      {
        path: '/api/student-profiling/track-trajectory',
        capability: 'learning-trajectory-tracking',
        serviceType: 'hybrid',
        authentication: true
      },
      {
        path: '/api/student-profiling/assess-skills',
        capability: 'skill-development-assessment',
        serviceType: 'hybrid',
        authentication: true
      },
      {
        path: '/api/student-profiling/generate-recommendations',
        capability: 'personalized-recommendations',
        serviceType: 'hybrid',
        authentication: true,
        timeout: 10000
      },

      // Educator Alerts Service routes
      {
        path: '/api/educator-alerts/create',
        capability: 'educator-alert-creation',
        serviceType: 'hybrid',
        authentication: true
      },
      {
        path: '/api/educator-alerts/list',
        capability: 'educator-alert-listing',
        serviceType: 'hybrid',
        authentication: true
      },
      {
        path: '/api/educator-alerts/:alertId',
        capability: 'educator-alert-management',
        serviceType: 'hybrid',
        authentication: true
      },

      // Academic Integrity Service routes
      {
        path: '/api/academic-integrity/detect-ai',
        capability: 'ai-assistance-detection',
        serviceType: 'hybrid',
        authentication: true,
        timeout: 15000
      },
      {
        path: '/api/academic-integrity/analyze-integrity',
        capability: 'integrity-analysis',
        serviceType: 'hybrid',
        authentication: true,
        timeout: 12000
      },
      {
        path: '/api/academic-integrity/validate-educational',
        capability: 'educational-validation',
        serviceType: 'hybrid',
        authentication: true
      },

      // Educational AI Validator Service routes
      {
        path: '/api/educational-ai/validate-enhancement',
        capability: 'bounded-enhancement-validation',
        serviceType: 'mcp',
        authentication: true,
        timeout: 8000
      },
      {
        path: '/api/educational-ai/analyze-blooms',
        capability: 'blooms-taxonomy-analysis',
        serviceType: 'mcp',
        authentication: true
      },
      {
        path: '/api/educational-ai/enforce-philosophy',
        capability: 'philosophy-enforcement',
        serviceType: 'mcp',
        authentication: true
      }
    ];

    // Register all service routes
    this.serviceRouter.registerRoutes(serviceRoutes);

    // Create a catch-all handler for registered routes
    this.fastify.all('/api/*', async (request: FastifyRequest, reply: FastifyReply) => {
      const context: RouteContext = {
        userId: (request as any).user?.id,
        role: (request as any).user?.role,
        correlationId: request.headers['x-correlation-id'] as string,
        timestamp: Date.now()
      };

      await this.serviceRouter.routeRequest(request, reply, context);
    });

    console.log(`[API GATEWAY] Registered ${serviceRoutes.length} service routes`);
  }

  /**
   * Register additional custom routes
   */
  registerCustomRoute(route: ServiceRoute): void {
    this.serviceRouter.registerRoute(route);
  }

  /**
   * Start the API gateway
   */
  async start(port: number = 3000, host: string = '0.0.0.0'): Promise<void> {
    try {
      await this.fastify.listen({ port, host });
      console.log(`[API GATEWAY] Server running on http://${host}:${port}`);
    } catch (error) {
      console.error('[API GATEWAY] Failed to start:', error);
      throw error;
    }
  }

  /**
   * Shutdown the gateway gracefully
   */
  async shutdown(): Promise<void> {
    console.log('[API GATEWAY] Shutting down...');
    await this.fastify.close();
    console.log('[API GATEWAY] Shutdown complete');
  }

  /**
   * Get gateway statistics
   */
  getStats(): {
    uptime: number;
    routes: number;
    routing: any;
    memory: NodeJS.MemoryUsage;
  } {
    return {
      uptime: process.uptime(),
      routes: this.serviceRouter.getRoutes().length,
      routing: this.serviceRouter.getRoutingStats(),
      memory: process.memoryUsage()
    };
  }
}