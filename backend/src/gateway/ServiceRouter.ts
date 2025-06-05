import { ServiceDiscoveryClient, ServiceInfo } from '../service-discovery';
import { FastifyRequest, FastifyReply } from 'fastify';

export interface ServiceRoute {
  path: string;
  capability: string;
  serviceType?: 'mcp' | 'http' | 'hybrid';
  authentication?: boolean;
  rateLimit?: {
    max: number;
    timeWindow: string;
  };
  timeout?: number;
}

export interface RouteContext {
  userId?: string;
  role?: string;
  correlationId: string;
  timestamp: number;
}

export class ServiceRouter {
  private serviceDiscovery: ServiceDiscoveryClient;
  private routes = new Map<string, ServiceRoute>();
  private routeStats = new Map<string, { calls: number; errors: number; avgLatency: number }>();

  constructor(serviceDiscovery: ServiceDiscoveryClient) {
    this.serviceDiscovery = serviceDiscovery;
  }

  /**
   * Register a route with the service router
   */
  registerRoute(route: ServiceRoute): void {
    this.routes.set(route.path, route);
    this.routeStats.set(route.path, { calls: 0, errors: 0, avgLatency: 0 });
    console.log(`[SERVICE ROUTER] Registered route: ${route.path} -> capability: ${route.capability}`);
  }

  /**
   * Register multiple routes
   */
  registerRoutes(routes: ServiceRoute[]): void {
    routes.forEach(route => this.registerRoute(route));
  }

  /**
   * Route a request to the appropriate service
   */
  async routeRequest(
    request: FastifyRequest,
    reply: FastifyReply,
    context: RouteContext
  ): Promise<void> {
    const startTime = Date.now();
    const path = this.normalizePath(request.url);
    const route = this.findMatchingRoute(path);

    if (!route) {
      reply.status(404).send({
        error: 'Route not found',
        message: `No route registered for: ${path}`,
        correlationId: context.correlationId
      });
      return;
    }

    try {
      // Update route statistics
      this.updateRouteStats(route.path, 'call');

      // Discover and route to service
      const result = await this.serviceDiscovery.executeWithDiscovery(
        route.capability,
        async (service: ServiceInfo) => {
          return await this.executeServiceCall(service, request, context, route);
        },
        {
          type: route.serviceType,
          fallback: () => this.handleFallback(route, request, context)
        }
      );

      // Calculate latency
      const latency = Date.now() - startTime;
      this.updateRouteLatency(route.path, latency);

      // Send response
      reply.status(200).send(result);

    } catch (error) {
      this.updateRouteStats(route.path, 'error');
      
      console.error(`[SERVICE ROUTER] Error routing ${path}:`, error);
      
      reply.status(500).send({
        error: 'Service routing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        correlationId: context.correlationId
      });
    }
  }

  /**
   * Execute a service call based on service type
   */
  private async executeServiceCall(
    service: ServiceInfo,
    request: FastifyRequest,
    context: RouteContext,
    route: ServiceRoute
  ): Promise<any> {
    switch (service.type) {
      case 'http':
        return await this.executeHttpCall(service, request, context, route);
        
      case 'mcp':
        return await this.executeMcpCall(service, request, context, route);
        
      case 'hybrid':
        // Try HTTP first, fallback to MCP
        try {
          return await this.executeHttpCall(service, request, context, route);
        } catch (error) {
          console.warn(`[SERVICE ROUTER] HTTP call failed for ${service.name}, trying MCP:`, error);
          return await this.executeMcpCall(service, request, context, route);
        }
        
      default:
        throw new Error(`Unsupported service type: ${service.type}`);
    }
  }

  /**
   * Execute HTTP service call
   */
  private async executeHttpCall(
    service: ServiceInfo,
    request: FastifyRequest,
    context: RouteContext,
    route: ServiceRoute
  ): Promise<any> {
    if (!service.endpoints.http) {
      throw new Error(`Service ${service.name} has no HTTP endpoint`);
    }

    const timeout = route.timeout || 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const url = `${service.endpoints.http}${request.url}`;
      const response = await fetch(url, {
        method: request.method,
        headers: {
          ...request.headers,
          'x-correlation-id': context.correlationId,
          'x-user-id': context.userId || '',
          'x-user-role': context.role || '',
          'x-forwarded-from': 'api-gateway'
        },
        body: request.method !== 'GET' ? JSON.stringify(request.body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Execute MCP service call
   */
  private async executeMcpCall(
    service: ServiceInfo,
    request: FastifyRequest,
    context: RouteContext,
    route: ServiceRoute
  ): Promise<any> {
    // For now, this is a placeholder for MCP calls
    // In a real implementation, you would use an MCP client
    throw new Error('MCP calls not yet implemented in service router');
  }

  /**
   * Handle fallback when no services are available
   */
  private async handleFallback(
    route: ServiceRoute,
    request: FastifyRequest,
    context: RouteContext
  ): Promise<any> {
    console.warn(`[SERVICE ROUTER] Using fallback for capability: ${route.capability}`);
    
    return {
      message: 'Service temporarily unavailable, using fallback',
      capability: route.capability,
      correlationId: context.correlationId,
      fallback: true
    };
  }

  /**
   * Find matching route for a path
   */
  private findMatchingRoute(path: string): ServiceRoute | undefined {
    // Exact match first
    const exactMatch = this.routes.get(path);
    if (exactMatch) {
      return exactMatch;
    }

    // Pattern matching for parameterized routes
    for (const [routePath, route] of this.routes) {
      if (this.matchesPattern(path, routePath)) {
        return route;
      }
    }

    return undefined;
  }

  /**
   * Check if path matches a route pattern
   */
  private matchesPattern(path: string, pattern: string): boolean {
    // Convert pattern like "/api/users/:id" to regex
    const regexPattern = pattern
      .replace(/:[^/]+/g, '[^/]+')
      .replace(/\*/g, '.*');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }

  /**
   * Normalize request path
   */
  private normalizePath(url: string): string {
    // Remove query parameters
    const [path] = url.split('?');
    
    // Remove trailing slash
    return path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
  }

  /**
   * Update route statistics
   */
  private updateRouteStats(routePath: string, type: 'call' | 'error'): void {
    const stats = this.routeStats.get(routePath);
    if (stats) {
      if (type === 'call') {
        stats.calls++;
      } else {
        stats.errors++;
      }
    }
  }

  /**
   * Update route latency statistics
   */
  private updateRouteLatency(routePath: string, latency: number): void {
    const stats = this.routeStats.get(routePath);
    if (stats) {
      // Simple moving average
      stats.avgLatency = (stats.avgLatency + latency) / 2;
    }
  }

  /**
   * Get routing statistics
   */
  getRoutingStats(): {
    routes: Record<string, { calls: number; errors: number; avgLatency: number }>;
    discovery: any;
  } {
    return {
      routes: Object.fromEntries(this.routeStats),
      discovery: this.serviceDiscovery.getDiscoveryStats()
    };
  }

  /**
   * Get registered routes
   */
  getRoutes(): ServiceRoute[] {
    return Array.from(this.routes.values());
  }

  /**
   * Health check for the router
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    routes: number;
    availableServices: Record<string, number>;
  }> {
    const routes = this.getRoutes();
    const availableServices: Record<string, number> = {};

    // Check service availability for each capability
    for (const route of routes) {
      const services = await this.serviceDiscovery.discoverServices(route.capability, route.serviceType);
      availableServices[route.capability] = services.length;
    }

    const totalCapabilities = Object.keys(availableServices).length;
    const availableCapabilities = Object.values(availableServices).filter(count => count > 0).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (availableCapabilities === totalCapabilities) {
      status = 'healthy';
    } else if (availableCapabilities > 0) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      routes: routes.length,
      availableServices
    };
  }
}