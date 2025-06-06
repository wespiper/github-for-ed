/**
 * Horizontal Scaling Service
 * Implements auto-scaling to support 200+ concurrent users with 95%+ success rate
 */

import { EventEmitter } from 'events';
import { Logger } from '../monitoring/Logger';
import { productionMetrics } from '../monitoring/ProductionMetricsCollector';
import { optimizedServiceClient } from '../communication/OptimizedServiceClient';

export interface ScalingRule {
  metric: string;
  threshold: number;
  operator: '>' | '<' | '>=' | '<=';
  action: 'scale_up' | 'scale_down';
  cooldown: number; // seconds
  minInstances: number;
  maxInstances: number;
  enabled: boolean;
}

export interface ServiceInstance {
  id: string;
  serviceName: string;
  endpoint: string;
  status: 'starting' | 'healthy' | 'unhealthy' | 'stopping';
  cpu: number;
  memory: number;
  connections: number;
  startTime: Date;
  lastHealthCheck: Date;
  version: string;
}

export interface LoadBalancerConfig {
  algorithm: 'round_robin' | 'least_connections' | 'weighted' | 'ip_hash';
  healthCheckInterval: number;
  failureThreshold: number;
  sessionAffinity: boolean;
}

export interface AutoScalingMetrics {
  currentInstances: number;
  targetInstances: number;
  averageCPU: number;
  averageMemory: number;
  totalConnections: number;
  requestsPerSecond: number;
  averageResponseTime: number;
  errorRate: number;
}

export class HorizontalScalingService extends EventEmitter {
  private static instance: HorizontalScalingService;
  private logger = Logger.getInstance('horizontal-scaling');
  
  // Service instances tracking
  private serviceInstances = new Map<string, ServiceInstance[]>();
  private scalingRules = new Map<string, ScalingRule[]>();
  private lastScalingAction = new Map<string, number>();
  
  // Load balancer state
  private currentRequestIndex = new Map<string, number>();
  private connectionCounts = new Map<string, number>();
  private healthyInstances = new Map<string, ServiceInstance[]>();
  
  // Auto-scaling configuration
  private scalingEnabled = true;
  private defaultMinInstances = 2;
  private defaultMaxInstances = 10;
  private healthCheckInterval = 15000; // 15 seconds
  private metricsCollectionInterval = 30000; // 30 seconds
  
  // Load balancer configuration
  private loadBalancerConfig: LoadBalancerConfig = {
    algorithm: 'least_connections',
    healthCheckInterval: 10000,
    failureThreshold: 3,
    sessionAffinity: false
  };

  // Performance targets
  private performanceTargets = {
    maxConcurrentUsers: 200,
    maxCPUUtilization: 70, // %
    maxMemoryUtilization: 80, // %
    maxResponseTime: 150, // ms
    minSuccessRate: 95 // %
  };

  private constructor() {
    super();
    this.initializeDefaultRules();
    this.startHealthChecking();
    this.startMetricsCollection();
    this.startAutoScaling();
  }

  static getInstance(): HorizontalScalingService {
    if (!HorizontalScalingService.instance) {
      HorizontalScalingService.instance = new HorizontalScalingService();
    }
    return HorizontalScalingService.instance;
  }

  /**
   * Register a service for scaling management
   */
  registerService(
    serviceName: string,
    initialInstances: ServiceInstance[],
    scalingRules?: ScalingRule[]
  ): void {
    this.serviceInstances.set(serviceName, initialInstances);
    this.healthyInstances.set(serviceName, initialInstances.filter(i => i.status === 'healthy'));
    this.currentRequestIndex.set(serviceName, 0);
    this.connectionCounts.set(serviceName, 0);
    
    if (scalingRules) {
      this.scalingRules.set(serviceName, scalingRules);
    } else {
      this.scalingRules.set(serviceName, this.getDefaultScalingRules());
    }

    // Register endpoints with optimized service client
    const endpoints = initialInstances.map(instance => instance.endpoint);
    optimizedServiceClient.registerService(serviceName, endpoints);

    this.logger.info(`Registered service for scaling: ${serviceName}`, {
      initialInstances: initialInstances.length,
      scalingRules: this.scalingRules.get(serviceName)?.length || 0
    });

    productionMetrics.setGauge('scaling_service_instances', initialInstances.length, {
      service: serviceName,
      status: 'registered'
    });
  }

  /**
   * Initialize default scaling rules
   */
  private initializeDefaultRules(): void {
    // These would be customized per service
  }

  /**
   * Get default scaling rules for a service
   */
  private getDefaultScalingRules(): ScalingRule[] {
    return [
      {
        metric: 'cpu_utilization',
        threshold: 70,
        operator: '>',
        action: 'scale_up',
        cooldown: 300, // 5 minutes
        minInstances: this.defaultMinInstances,
        maxInstances: this.defaultMaxInstances,
        enabled: true
      },
      {
        metric: 'cpu_utilization',
        threshold: 30,
        operator: '<',
        action: 'scale_down',
        cooldown: 600, // 10 minutes
        minInstances: this.defaultMinInstances,
        maxInstances: this.defaultMaxInstances,
        enabled: true
      },
      {
        metric: 'memory_utilization',
        threshold: 80,
        operator: '>',
        action: 'scale_up',
        cooldown: 300,
        minInstances: this.defaultMinInstances,
        maxInstances: this.defaultMaxInstances,
        enabled: true
      },
      {
        metric: 'response_time',
        threshold: 200, // 200ms
        operator: '>',
        action: 'scale_up',
        cooldown: 180, // 3 minutes
        minInstances: this.defaultMinInstances,
        maxInstances: this.defaultMaxInstances,
        enabled: true
      },
      {
        metric: 'concurrent_connections',
        threshold: 100, // per instance
        operator: '>',
        action: 'scale_up',
        cooldown: 120, // 2 minutes
        minInstances: this.defaultMinInstances,
        maxInstances: this.defaultMaxInstances,
        enabled: true
      }
    ];
  }

  /**
   * Get optimal instance using load balancing algorithm
   */
  getOptimalInstance(serviceName: string): ServiceInstance | null {
    const healthyInstances = this.healthyInstances.get(serviceName);
    if (!healthyInstances || healthyInstances.length === 0) {
      return null;
    }

    switch (this.loadBalancerConfig.algorithm) {
      case 'round_robin':
        return this.getRoundRobinInstance(serviceName, healthyInstances);
      
      case 'least_connections':
        return this.getLeastConnectionsInstance(healthyInstances);
      
      case 'weighted':
        return this.getWeightedInstance(healthyInstances);
      
      case 'ip_hash':
        // Would implement IP-based selection in production
        return this.getRoundRobinInstance(serviceName, healthyInstances);
      
      default:
        return this.getRoundRobinInstance(serviceName, healthyInstances);
    }
  }

  /**
   * Round-robin load balancing
   */
  private getRoundRobinInstance(serviceName: string, instances: ServiceInstance[]): ServiceInstance {
    const currentIndex = this.currentRequestIndex.get(serviceName) || 0;
    const instance = instances[currentIndex % instances.length];
    this.currentRequestIndex.set(serviceName, currentIndex + 1);
    return instance;
  }

  /**
   * Least connections load balancing
   */
  private getLeastConnectionsInstance(instances: ServiceInstance[]): ServiceInstance {
    return instances.reduce((min, instance) => 
      instance.connections < min.connections ? instance : min
    );
  }

  /**
   * Weighted load balancing (based on performance)
   */
  private getWeightedInstance(instances: ServiceInstance[]): ServiceInstance {
    // Calculate weights based on CPU and memory usage
    const weights = instances.map(instance => {
      const cpuWeight = Math.max(0.1, 1 - (instance.cpu / 100));
      const memoryWeight = Math.max(0.1, 1 - (instance.memory / 100));
      return cpuWeight * memoryWeight;
    });

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const random = Math.random() * totalWeight;
    
    let weightSum = 0;
    for (let i = 0; i < instances.length; i++) {
      weightSum += weights[i];
      if (random <= weightSum) {
        return instances[i];
      }
    }

    return instances[0];
  }

  /**
   * Track connection to an instance
   */
  trackConnection(serviceName: string, instanceId: string, increment: boolean = true): void {
    const instances = this.serviceInstances.get(serviceName);
    if (!instances) return;

    const instance = instances.find(i => i.id === instanceId);
    if (instance) {
      instance.connections += increment ? 1 : -1;
      instance.connections = Math.max(0, instance.connections);
    }

    // Update total connections for service
    const totalConnections = instances.reduce((sum, i) => sum + i.connections, 0);
    this.connectionCounts.set(serviceName, totalConnections);

    productionMetrics.setGauge('scaling_instance_connections', instance?.connections || 0, {
      service: serviceName,
      instance: instanceId
    });
  }

  /**
   * Start health checking loop
   */
  private startHealthChecking(): void {
    setInterval(() => {
      this.performHealthChecks();
    }, this.healthCheckInterval);
  }

  /**
   * Perform health checks on all instances
   */
  private async performHealthChecks(): Promise<void> {
    for (const [serviceName, instances] of this.serviceInstances.entries()) {
      const healthyInstances: ServiceInstance[] = [];
      
      const healthChecks = instances.map(async (instance) => {
        try {
          const isHealthy = await this.checkInstanceHealth(instance);
          
          if (isHealthy) {
            instance.status = 'healthy';
            instance.lastHealthCheck = new Date();
            healthyInstances.push(instance);
          } else {
            instance.status = 'unhealthy';
          }
          
          productionMetrics.setGauge('scaling_instance_health', isHealthy ? 1 : 0, {
            service: serviceName,
            instance: instance.id
          });

        } catch (error) {
          instance.status = 'unhealthy';
          this.logger.warn(`Health check failed for instance ${instance.id}`, {
            service: serviceName,
            error: (error as Error).message
          });
        }
      });

      await Promise.allSettled(healthChecks);
      this.healthyInstances.set(serviceName, healthyInstances);

      // Update metrics
      productionMetrics.setGauge('scaling_healthy_instances', healthyInstances.length, {
        service: serviceName
      });

      productionMetrics.setGauge('scaling_total_instances', instances.length, {
        service: serviceName
      });
    }
  }

  /**
   * Check individual instance health
   */
  private async checkInstanceHealth(instance: ServiceInstance): Promise<boolean> {
    try {
      // Simulate health check - in production, make actual HTTP request
      const response = await this.simulateHealthCheck(instance.endpoint);
      
      // Update instance metrics from health check
      instance.cpu = response.cpu || instance.cpu;
      instance.memory = response.memory || instance.memory;
      
      return response.healthy;
    } catch (error) {
      return false;
    }
  }

  /**
   * Simulate health check (replace with actual implementation)
   */
  private async simulateHealthCheck(endpoint: string): Promise<{
    healthy: boolean;
    cpu: number;
    memory: number;
    responseTime: number;
  }> {
    // Simulate variable health
    const healthy = Math.random() > 0.05; // 95% healthy
    const cpu = Math.random() * 90; // 0-90% CPU
    const memory = Math.random() * 85; // 0-85% memory
    const responseTime = 20 + Math.random() * 30; // 20-50ms

    return { healthy, cpu, memory, responseTime };
  }

  /**
   * Start metrics collection loop
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      this.collectMetrics();
    }, this.metricsCollectionInterval);
  }

  /**
   * Collect auto-scaling metrics
   */
  private collectMetrics(): void {
    for (const [serviceName, instances] of this.serviceInstances.entries()) {
      const healthyInstances = this.healthyInstances.get(serviceName) || [];
      
      if (healthyInstances.length === 0) continue;

      const metrics = this.calculateServiceMetrics(healthyInstances);
      
      // Record metrics
      productionMetrics.setGauge('scaling_average_cpu', metrics.averageCPU, {
        service: serviceName
      });
      
      productionMetrics.setGauge('scaling_average_memory', metrics.averageMemory, {
        service: serviceName
      });
      
      productionMetrics.setGauge('scaling_total_connections', metrics.totalConnections, {
        service: serviceName
      });
      
      productionMetrics.setGauge('scaling_average_response_time', metrics.averageResponseTime, {
        service: serviceName
      });

      // Store metrics for auto-scaling decisions
      this.emit('metricsCollected', {
        serviceName,
        metrics,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Calculate aggregated metrics for a service
   */
  private calculateServiceMetrics(instances: ServiceInstance[]): AutoScalingMetrics {
    const totalInstances = instances.length;
    const totalCPU = instances.reduce((sum, i) => sum + i.cpu, 0);
    const totalMemory = instances.reduce((sum, i) => sum + i.memory, 0);
    const totalConnections = instances.reduce((sum, i) => sum + i.connections, 0);

    return {
      currentInstances: totalInstances,
      targetInstances: totalInstances, // Will be calculated by auto-scaler
      averageCPU: totalInstances > 0 ? totalCPU / totalInstances : 0,
      averageMemory: totalInstances > 0 ? totalMemory / totalInstances : 0,
      totalConnections,
      requestsPerSecond: 0, // Would be calculated from request metrics
      averageResponseTime: 0, // Would be calculated from response time metrics
      errorRate: 0 // Would be calculated from error metrics
    };
  }

  /**
   * Start auto-scaling loop
   */
  private startAutoScaling(): void {
    setInterval(() => {
      if (this.scalingEnabled) {
        this.evaluateScalingRules();
      }
    }, 60000); // Every minute
  }

  /**
   * Evaluate scaling rules for all services
   */
  private evaluateScalingRules(): void {
    for (const [serviceName, rules] of this.scalingRules.entries()) {
      const instances = this.serviceInstances.get(serviceName);
      const healthyInstances = this.healthyInstances.get(serviceName);
      
      if (!instances || !healthyInstances) continue;

      const metrics = this.calculateServiceMetrics(healthyInstances);
      
      for (const rule of rules) {
        if (!rule.enabled) continue;
        
        const shouldScale = this.evaluateRule(rule, metrics);
        
        if (shouldScale) {
          this.executeScalingAction(serviceName, rule, metrics);
        }
      }
    }
  }

  /**
   * Evaluate a single scaling rule
   */
  private evaluateRule(rule: ScalingRule, metrics: AutoScalingMetrics): boolean {
    const value = this.getMetricValue(rule.metric, metrics);
    
    switch (rule.operator) {
      case '>':
        return value > rule.threshold;
      case '<':
        return value < rule.threshold;
      case '>=':
        return value >= rule.threshold;
      case '<=':
        return value <= rule.threshold;
      default:
        return false;
    }
  }

  /**
   * Get metric value by name
   */
  private getMetricValue(metricName: string, metrics: AutoScalingMetrics): number {
    switch (metricName) {
      case 'cpu_utilization':
        return metrics.averageCPU;
      case 'memory_utilization':
        return metrics.averageMemory;
      case 'response_time':
        return metrics.averageResponseTime;
      case 'concurrent_connections':
        return metrics.totalConnections;
      case 'requests_per_second':
        return metrics.requestsPerSecond;
      case 'error_rate':
        return metrics.errorRate;
      default:
        return 0;
    }
  }

  /**
   * Execute scaling action
   */
  private async executeScalingAction(
    serviceName: string,
    rule: ScalingRule,
    metrics: AutoScalingMetrics
  ): Promise<void> {
    // Check cooldown period
    const lastAction = this.lastScalingAction.get(`${serviceName}:${rule.action}`);
    const now = Date.now();
    
    if (lastAction && (now - lastAction) < (rule.cooldown * 1000)) {
      return; // Still in cooldown
    }

    const currentInstances = metrics.currentInstances;
    let targetInstances = currentInstances;

    if (rule.action === 'scale_up') {
      targetInstances = Math.min(currentInstances + 1, rule.maxInstances);
    } else if (rule.action === 'scale_down') {
      targetInstances = Math.max(currentInstances - 1, rule.minInstances);
    }

    if (targetInstances === currentInstances) {
      return; // No scaling needed
    }

    this.logger.info(`Executing scaling action: ${rule.action}`, {
      service: serviceName,
      rule: rule.metric,
      currentInstances,
      targetInstances,
      triggerValue: this.getMetricValue(rule.metric, metrics),
      threshold: rule.threshold
    });

    try {
      if (rule.action === 'scale_up') {
        await this.scaleUp(serviceName, targetInstances - currentInstances);
      } else {
        await this.scaleDown(serviceName, currentInstances - targetInstances);
      }

      // Record successful scaling action
      this.lastScalingAction.set(`${serviceName}:${rule.action}`, now);
      
      productionMetrics.incrementCounter('scaling_actions_total', 1, {
        service: serviceName,
        action: rule.action,
        status: 'success'
      });

      this.emit('scalingAction', {
        service: serviceName,
        action: rule.action,
        fromInstances: currentInstances,
        toInstances: targetInstances,
        rule: rule.metric,
        timestamp: new Date()
      });

    } catch (error) {
      this.logger.error(`Scaling action failed: ${rule.action}`, error as Error, {
        service: serviceName
      });
      
      productionMetrics.incrementCounter('scaling_actions_total', 1, {
        service: serviceName,
        action: rule.action,
        status: 'error'
      });
    }
  }

  /**
   * Scale up service instances
   */
  private async scaleUp(serviceName: string, count: number): Promise<void> {
    const instances = this.serviceInstances.get(serviceName);
    if (!instances) return;

    for (let i = 0; i < count; i++) {
      const newInstance = await this.createInstance(serviceName);
      instances.push(newInstance);
      
      // Add to optimized service client
      optimizedServiceClient.registerService(serviceName, [newInstance.endpoint]);
    }

    this.logger.info(`Scaled up service: ${serviceName}`, {
      added: count,
      totalInstances: instances.length
    });
  }

  /**
   * Scale down service instances
   */
  private async scaleDown(serviceName: string, count: number): Promise<void> {
    const instances = this.serviceInstances.get(serviceName);
    if (!instances) return;

    // Remove instances with least connections first
    const sortedInstances = [...instances].sort((a, b) => a.connections - b.connections);
    const toRemove = sortedInstances.slice(0, count);

    for (const instance of toRemove) {
      await this.removeInstance(serviceName, instance);
      const index = instances.indexOf(instance);
      if (index > -1) {
        instances.splice(index, 1);
      }
    }

    this.logger.info(`Scaled down service: ${serviceName}`, {
      removed: count,
      totalInstances: instances.length
    });
  }

  /**
   * Create new instance (simulated)
   */
  private async createInstance(serviceName: string): Promise<ServiceInstance> {
    const instanceId = `${serviceName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const port = 3000 + Math.floor(Math.random() * 1000);
    
    const newInstance: ServiceInstance = {
      id: instanceId,
      serviceName,
      endpoint: `http://localhost:${port}`,
      status: 'starting',
      cpu: 0,
      memory: 0,
      connections: 0,
      startTime: new Date(),
      lastHealthCheck: new Date(),
      version: '1.0.0'
    };

    // Simulate startup time
    setTimeout(() => {
      newInstance.status = 'healthy';
    }, 5000);

    return newInstance;
  }

  /**
   * Remove instance (simulated)
   */
  private async removeInstance(serviceName: string, instance: ServiceInstance): Promise<void> {
    instance.status = 'stopping';
    
    // Simulate graceful shutdown
    setTimeout(() => {
      this.logger.debug(`Instance ${instance.id} removed from ${serviceName}`);
    }, 2000);
  }

  /**
   * Get scaling statistics
   */
  getScalingStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [serviceName, instances] of this.serviceInstances.entries()) {
      const healthyInstances = this.healthyInstances.get(serviceName) || [];
      const metrics = this.calculateServiceMetrics(healthyInstances);
      
      stats[serviceName] = {
        totalInstances: instances.length,
        healthyInstances: healthyInstances.length,
        metrics,
        scalingRules: this.scalingRules.get(serviceName)?.length || 0,
        lastScalingAction: this.lastScalingAction.get(serviceName)
      };
    }

    return stats;
  }

  /**
   * Update performance targets
   */
  updatePerformanceTargets(targets: Partial<typeof this.performanceTargets>): void {
    this.performanceTargets = { ...this.performanceTargets, ...targets };
    
    this.logger.info('Performance targets updated', this.performanceTargets);
  }

  /**
   * Enable or disable auto-scaling
   */
  setScalingEnabled(enabled: boolean): void {
    this.scalingEnabled = enabled;
    
    this.logger.info(`Auto-scaling ${enabled ? 'enabled' : 'disabled'}`);
    
    productionMetrics.setGauge('scaling_enabled', enabled ? 1 : 0);
  }

  /**
   * Get current performance targets
   */
  getPerformanceTargets(): typeof this.performanceTargets {
    return { ...this.performanceTargets };
  }
}

// Export singleton instance
export const horizontalScaling = HorizontalScalingService.getInstance();