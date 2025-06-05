import { EventEmitter } from 'events';

export interface ServiceInfo {
  id: string;
  name: string;
  version: string;
  type: 'mcp' | 'http' | 'hybrid';
  endpoints: {
    mcp?: string;
    http?: string;
    health?: string;
  };
  metadata: {
    status: 'healthy' | 'unhealthy' | 'unknown';
    lastHealthCheck: Date;
    capabilities: string[];
    dependencies: string[];
  };
  registrationTime: Date;
  lastSeen: Date;
}

export interface ServiceRegistryConfig {
  healthCheckInterval: number;
  healthCheckTimeout: number;
  maxFailures: number;
  registrationTtl: number;
}

export class ServiceRegistry extends EventEmitter {
  private services = new Map<string, ServiceInfo>();
  private healthCheckTimers = new Map<string, NodeJS.Timeout>();
  private config: ServiceRegistryConfig;

  constructor(config: Partial<ServiceRegistryConfig> = {}) {
    super();
    this.config = {
      healthCheckInterval: config.healthCheckInterval || 30000, // 30 seconds
      healthCheckTimeout: config.healthCheckTimeout || 5000,   // 5 seconds
      maxFailures: config.maxFailures || 3,
      registrationTtl: config.registrationTtl || 300000,       // 5 minutes
      ...config
    };
  }

  /**
   * Register a service with the registry
   */
  register(serviceInfo: Omit<ServiceInfo, 'registrationTime' | 'lastSeen' | 'metadata'>): void {
    const service: ServiceInfo = {
      ...serviceInfo,
      registrationTime: new Date(),
      lastSeen: new Date(),
      metadata: {
        status: 'unknown',
        lastHealthCheck: new Date(),
        capabilities: serviceInfo.metadata?.capabilities || [],
        dependencies: serviceInfo.metadata?.dependencies || []
      }
    };

    this.services.set(service.id, service);
    this.startHealthCheck(service.id);
    
    this.emit('serviceRegistered', service);
    console.log(`[SERVICE REGISTRY] Registered service: ${service.name} (${service.id})`);
  }

  /**
   * Unregister a service from the registry
   */
  unregister(serviceId: string): boolean {
    const service = this.services.get(serviceId);
    if (!service) {
      return false;
    }

    this.stopHealthCheck(serviceId);
    this.services.delete(serviceId);
    
    this.emit('serviceUnregistered', service);
    console.log(`[SERVICE REGISTRY] Unregistered service: ${service.name} (${serviceId})`);
    return true;
  }

  /**
   * Get service information by ID
   */
  getService(serviceId: string): ServiceInfo | undefined {
    return this.services.get(serviceId);
  }

  /**
   * Get all services, optionally filtered by type
   */
  getServices(type?: 'mcp' | 'http' | 'hybrid'): ServiceInfo[] {
    const services = Array.from(this.services.values());
    return type ? services.filter(s => s.type === type) : services;
  }

  /**
   * Get healthy services, optionally filtered by type
   */
  getHealthyServices(type?: 'mcp' | 'http' | 'hybrid'): ServiceInfo[] {
    return this.getServices(type).filter(s => s.metadata.status === 'healthy');
  }

  /**
   * Find services by capability
   */
  getServicesByCapability(capability: string): ServiceInfo[] {
    return Array.from(this.services.values())
      .filter(s => s.metadata.capabilities.includes(capability));
  }

  /**
   * Update service health status
   */
  updateServiceHealth(serviceId: string, status: 'healthy' | 'unhealthy', metadata?: any): void {
    const service = this.services.get(serviceId);
    if (!service) {
      return;
    }

    const previousStatus = service.metadata.status;
    service.metadata.status = status;
    service.metadata.lastHealthCheck = new Date();
    service.lastSeen = new Date();

    if (metadata) {
      service.metadata = { ...service.metadata, ...metadata };
    }

    if (previousStatus !== status) {
      this.emit('serviceHealthChanged', service, previousStatus);
      console.log(`[SERVICE REGISTRY] Health changed: ${service.name} (${serviceId}) ${previousStatus} -> ${status}`);
    }
  }

  /**
   * Start health check monitoring for a service
   */
  private startHealthCheck(serviceId: string): void {
    this.stopHealthCheck(serviceId); // Clear any existing timer

    const timer = setInterval(async () => {
      await this.performHealthCheck(serviceId);
    }, this.config.healthCheckInterval);

    this.healthCheckTimers.set(serviceId, timer);

    // Perform initial health check
    setImmediate(() => this.performHealthCheck(serviceId));
  }

  /**
   * Stop health check monitoring for a service
   */
  private stopHealthCheck(serviceId: string): void {
    const timer = this.healthCheckTimers.get(serviceId);
    if (timer) {
      clearInterval(timer);
      this.healthCheckTimers.delete(serviceId);
    }
  }

  /**
   * Perform health check for a service
   */
  private async performHealthCheck(serviceId: string): Promise<void> {
    const service = this.services.get(serviceId);
    if (!service) {
      return;
    }

    try {
      // Check TTL first
      const timeSinceLastSeen = Date.now() - service.lastSeen.getTime();
      if (timeSinceLastSeen > this.config.registrationTtl) {
        console.log(`[SERVICE REGISTRY] Service ${service.name} (${serviceId}) expired, removing`);
        this.unregister(serviceId);
        return;
      }

      let isHealthy = false;

      // Try HTTP health check first if available
      if (service.endpoints.health) {
        isHealthy = await this.performHttpHealthCheck(service.endpoints.health);
      } else if (service.endpoints.http) {
        // Fallback to HTTP endpoint ping
        isHealthy = await this.performHttpHealthCheck(`${service.endpoints.http}/health`);
      } else if (service.type === 'mcp' && service.endpoints.mcp) {
        // MCP services are considered healthy if they're registered
        // TODO: Implement actual MCP health check when MCP client supports it
        isHealthy = true;
      }

      this.updateServiceHealth(serviceId, isHealthy ? 'healthy' : 'unhealthy');

    } catch (error) {
      console.error(`[SERVICE REGISTRY] Health check failed for ${service.name} (${serviceId}):`, error);
      this.updateServiceHealth(serviceId, 'unhealthy');
    }
  }

  /**
   * Perform HTTP health check
   */
  private async performHttpHealthCheck(healthUrl: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.healthCheckTimeout);

      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'ServiceRegistry/1.0'
        }
      });

      clearTimeout(timeoutId);
      return response.ok;

    } catch (error) {
      return false;
    }
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalServices: number;
    healthyServices: number;
    unhealthyServices: number;
    unknownServices: number;
    servicesByType: Record<string, number>;
  } {
    const services = Array.from(this.services.values());
    
    return {
      totalServices: services.length,
      healthyServices: services.filter(s => s.metadata.status === 'healthy').length,
      unhealthyServices: services.filter(s => s.metadata.status === 'unhealthy').length,
      unknownServices: services.filter(s => s.metadata.status === 'unknown').length,
      servicesByType: services.reduce((acc, service) => {
        acc[service.type] = (acc[service.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  /**
   * Cleanup and shutdown
   */
  shutdown(): void {
    // Stop all health check timers
    for (const [serviceId] of this.healthCheckTimers) {
      this.stopHealthCheck(serviceId);
    }

    // Clear services
    this.services.clear();
    this.removeAllListeners();

    console.log('[SERVICE REGISTRY] Shutdown complete');
  }
}