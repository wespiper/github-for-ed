export { ServiceRegistry, ServiceInfo, ServiceRegistryConfig } from './ServiceRegistry';
export { ServiceDiscoveryClient, ServiceDiscoveryConfig } from './ServiceDiscoveryClient';

// Service startup orchestration
export class ServiceOrchestrator {
  private serviceRegistry: ServiceRegistry;
  private discoveryClient: ServiceDiscoveryClient;
  private startupOrder: string[] = [];
  private startedServices = new Set<string>();

  constructor(serviceRegistry: ServiceRegistry, discoveryClient: ServiceDiscoveryClient) {
    this.serviceRegistry = serviceRegistry;
    this.discoveryClient = discoveryClient;
  }

  /**
   * Define service startup order based on dependencies
   */
  defineStartupOrder(services: string[]): void {
    this.startupOrder = [...services];
  }

  /**
   * Start services in dependency order
   */
  async startServices(): Promise<void> {
    console.log('[SERVICE ORCHESTRATOR] Starting services in dependency order...');
    
    for (const serviceId of this.startupOrder) {
      await this.startService(serviceId);
    }

    console.log('[SERVICE ORCHESTRATOR] All services started successfully');
  }

  /**
   * Start a specific service
   */
  private async startService(serviceId: string): Promise<void> {
    if (this.startedServices.has(serviceId)) {
      return;
    }

    const service = this.serviceRegistry.getService(serviceId);
    if (!service) {
      throw new Error(`Service not found: ${serviceId}`);
    }

    // Wait for dependencies to be healthy
    await this.waitForDependencies(service);

    // Service startup logic would go here
    // For now, we just mark it as started
    this.startedServices.add(serviceId);
    
    console.log(`[SERVICE ORCHESTRATOR] Started service: ${service.name} (${serviceId})`);
  }

  /**
   * Wait for service dependencies to be healthy
   */
  private async waitForDependencies(service: ServiceInfo): Promise<void> {
    const dependencies = service.metadata.dependencies;
    
    if (dependencies.length === 0) {
      return;
    }

    console.log(`[SERVICE ORCHESTRATOR] Waiting for dependencies of ${service.name}: ${dependencies.join(', ')}`);

    const maxWaitTime = 60000; // 60 seconds
    const checkInterval = 1000; // 1 second
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const healthyDependencies = dependencies.filter(depId => {
        const depService = this.serviceRegistry.getService(depId);
        return depService && depService.metadata.status === 'healthy';
      });

      if (healthyDependencies.length === dependencies.length) {
        console.log(`[SERVICE ORCHESTRATOR] All dependencies ready for ${service.name}`);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    throw new Error(`Timeout waiting for dependencies of ${service.name}: ${dependencies.join(', ')}`);
  }

  /**
   * Get orchestration status
   */
  getStatus(): {
    totalServices: number;
    startedServices: number;
    pendingServices: string[];
    failedServices: string[];
  } {
    const totalServices = this.startupOrder.length;
    const startedServices = this.startedServices.size;
    const pendingServices = this.startupOrder.filter(id => !this.startedServices.has(id));
    
    // Check for failed services (registered but unhealthy)
    const failedServices = this.startupOrder.filter(id => {
      const service = this.serviceRegistry.getService(id);
      return service && service.metadata.status === 'unhealthy';
    });

    return {
      totalServices,
      startedServices,
      pendingServices,
      failedServices
    };
  }
}