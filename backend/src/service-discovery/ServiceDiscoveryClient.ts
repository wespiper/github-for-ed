import { ServiceRegistry, ServiceInfo } from './ServiceRegistry';
import { CircuitBreakerService } from '../services/fallback/CircuitBreakerService';

export interface ServiceDiscoveryConfig {
  retryAttempts: number;
  retryDelay: number;
  loadBalancing: 'round-robin' | 'random' | 'health-weighted';
  circuitBreakerEnabled: boolean;
}

export class ServiceDiscoveryClient {
  private serviceRegistry: ServiceRegistry;
  private circuitBreaker: CircuitBreakerService;
  private roundRobinCounters = new Map<string, number>();
  private config: ServiceDiscoveryConfig;

  constructor(
    serviceRegistry: ServiceRegistry,
    circuitBreaker: CircuitBreakerService,
    config: Partial<ServiceDiscoveryConfig> = {}
  ) {
    this.serviceRegistry = serviceRegistry;
    this.circuitBreaker = circuitBreaker;
    this.config = {
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      loadBalancing: config.loadBalancing || 'health-weighted',
      circuitBreakerEnabled: config.circuitBreakerEnabled !== false,
      ...config
    };
  }

  /**
   * Discover services by capability with intelligent routing
   */
  async discoverServices(capability: string, type?: 'mcp' | 'http' | 'hybrid'): Promise<ServiceInfo[]> {
    let services = this.serviceRegistry.getServicesByCapability(capability);
    
    if (type) {
      services = services.filter(s => s.type === type);
    }

    // Filter to only healthy services
    const healthyServices = services.filter(s => s.metadata.status === 'healthy');
    
    if (healthyServices.length === 0) {
      console.warn(`[SERVICE DISCOVERY] No healthy services found for capability: ${capability}`);
      // Return all services as fallback, but caller should handle gracefully
      return services;
    }

    return healthyServices;
  }

  /**
   * Get the best available service for a capability
   */
  async getBestService(capability: string, type?: 'mcp' | 'http' | 'hybrid'): Promise<ServiceInfo | null> {
    const services = await this.discoverServices(capability, type);
    
    if (services.length === 0) {
      return null;
    }

    if (services.length === 1) {
      return services[0];
    }

    return this.selectServiceByLoadBalancing(services, capability);
  }

  /**
   * Execute a service call with circuit breaker protection
   */
  async executeServiceCall<T>(
    serviceInfo: ServiceInfo,
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    if (!this.config.circuitBreakerEnabled) {
      return await operation();
    }

    return await this.circuitBreaker.execute(
      `service-${serviceInfo.id}`,
      operation,
      fallback
    );
  }

  /**
   * Execute operation with automatic service discovery and failover
   */
  async executeWithDiscovery<T>(
    capability: string,
    operation: (service: ServiceInfo) => Promise<T>,
    options: {
      type?: 'mcp' | 'http' | 'hybrid';
      fallback?: () => Promise<T>;
      maxAttempts?: number;
    } = {}
  ): Promise<T> {
    const maxAttempts = options.maxAttempts || this.config.retryAttempts;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const service = await this.getBestService(capability, options.type);
        
        if (!service) {
          throw new Error(`No available services for capability: ${capability}`);
        }

        // Execute with circuit breaker protection
        return await this.executeServiceCall(
          service,
          () => operation(service),
          options.fallback
        );

      } catch (error) {
        lastError = error as Error;
        console.warn(`[SERVICE DISCOVERY] Attempt ${attempt}/${maxAttempts} failed for capability ${capability}:`, error);

        if (attempt < maxAttempts) {
          await this.delay(this.config.retryDelay * attempt); // Exponential backoff
        }
      }
    }

    // If we have a fallback, try it as last resort
    if (options.fallback) {
      try {
        console.log(`[SERVICE DISCOVERY] Using fallback for capability: ${capability}`);
        return await options.fallback();
      } catch (fallbackError) {
        console.error(`[SERVICE DISCOVERY] Fallback also failed for capability ${capability}:`, fallbackError);
      }
    }

    throw lastError || new Error(`All attempts failed for capability: ${capability}`);
  }

  /**
   * Select service based on load balancing strategy
   */
  private selectServiceByLoadBalancing(services: ServiceInfo[], capability: string): ServiceInfo {
    switch (this.config.loadBalancing) {
      case 'round-robin':
        return this.selectRoundRobin(services, capability);
        
      case 'random':
        return services[Math.floor(Math.random() * services.length)];
        
      case 'health-weighted':
      default:
        return this.selectHealthWeighted(services);
    }
  }

  /**
   * Round-robin service selection
   */
  private selectRoundRobin(services: ServiceInfo[], capability: string): ServiceInfo {
    const counter = this.roundRobinCounters.get(capability) || 0;
    const selectedIndex = counter % services.length;
    this.roundRobinCounters.set(capability, counter + 1);
    return services[selectedIndex];
  }

  /**
   * Health-weighted service selection (prefers recently healthy services)
   */
  private selectHealthWeighted(services: ServiceInfo[]): ServiceInfo {
    // Sort by health check recency (more recent = higher priority)
    const sortedServices = services.sort((a, b) => {
      const aTime = a.metadata.lastHealthCheck.getTime();
      const bTime = b.metadata.lastHealthCheck.getTime();
      return bTime - aTime; // Descending order (most recent first)
    });

    // Weight selection towards healthier services
    const weights = sortedServices.map((_, index) => {
      return Math.max(1, sortedServices.length - index);
    });

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const random = Math.random() * totalWeight;

    let weightSum = 0;
    for (let i = 0; i < sortedServices.length; i++) {
      weightSum += weights[i];
      if (random <= weightSum) {
        return sortedServices[i];
      }
    }

    // Fallback to first service
    return sortedServices[0];
  }

  /**
   * Get service discovery statistics
   */
  getDiscoveryStats(): {
    registry: ReturnType<ServiceRegistry['getStats']>;
    roundRobinCounters: Record<string, number>;
    circuitBreakerStats: any;
  } {
    return {
      registry: this.serviceRegistry.getStats(),
      roundRobinCounters: Object.fromEntries(this.roundRobinCounters),
      circuitBreakerStats: this.circuitBreaker.getStats()
    };
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if a service is available for a capability
   */
  async isServiceAvailable(capability: string, type?: 'mcp' | 'http' | 'hybrid'): Promise<boolean> {
    const service = await this.getBestService(capability, type);
    return service !== null && service.metadata.status === 'healthy';
  }

  /**
   * Get service health status
   */
  getServiceHealth(serviceId: string): 'healthy' | 'unhealthy' | 'unknown' | null {
    const service = this.serviceRegistry.getService(serviceId);
    return service ? service.metadata.status : null;
  }

  /**
   * Force refresh of service discovery cache
   */
  async refreshServices(): Promise<void> {
    // Trigger immediate health checks for all services
    const services = this.serviceRegistry.getServices();
    console.log(`[SERVICE DISCOVERY] Refreshing ${services.length} services`);
    
    // The ServiceRegistry will handle the actual health checks
    // This is mainly for logging and potential future cache clearing
  }
}