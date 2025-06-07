export { DistributedTracing, TraceSpan, TraceContext } from './DistributedTracing';
export { ServiceMetricsCollector, ServiceMetric, ServiceHealth, MetricAggregation } from './ServiceMetricsCollector';

// Unified monitoring facade
import { DistributedTracing } from './DistributedTracing';
import { ServiceMetricsCollector } from './ServiceMetricsCollector';
import { EventEmitter } from 'events';

export interface MonitoringConfig {
  serviceName: string;
  enableTracing: boolean;
  enableMetrics: boolean;
  cleanupInterval: number;
  maxTraceAge: number;
  maxMetricAge: number;
}

export class DistributedMonitor extends EventEmitter {
  private tracing: DistributedTracing;
  private metrics: ServiceMetricsCollector;
  private config: MonitoringConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<MonitoringConfig> = {}) {
    super();
    
    this.config = {
      serviceName: config.serviceName || 'unknown-service',
      enableTracing: config.enableTracing !== false,
      enableMetrics: config.enableMetrics !== false,
      cleanupInterval: config.cleanupInterval || 10 * 60 * 1000, // 10 minutes
      maxTraceAge: config.maxTraceAge || 60 * 60 * 1000, // 1 hour
      maxMetricAge: config.maxMetricAge || 4 * 60 * 60 * 1000, // 4 hours
      ...config
    };

    this.tracing = new DistributedTracing(this.config.serviceName);
    this.metrics = new ServiceMetricsCollector();

    this.setupEventForwarding();
    this.setupCleanup();
  }

  /**
   * Get tracing instance
   */
  getTracing(): DistributedTracing {
    return this.tracing;
  }

  /**
   * Get metrics instance
   */
  getMetrics(): ServiceMetricsCollector {
    return this.metrics;
  }

  /**
   * Monitor an operation with both tracing and metrics
   */
  async monitorOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    options: {
      parentContext?: any;
      tags?: Record<string, any>;
      recordMetrics?: boolean;
      endpoint?: string;
      method?: string;
    } = {}
  ): Promise<T> {
    const startTime = Date.now();
    let span: any = null;
    let success = true;
    let error: Error | null = null;

    try {
      // Start tracing if enabled
      if (this.config.enableTracing) {
        span = this.tracing.startSpan(operationName, options.parentContext, options.tags);
      }

      // Execute operation
      const result = await operation();

      return result;

    } catch (err) {
      success = false;
      error = err as Error;
      throw err;

    } finally {
      const duration = Date.now() - startTime;

      // Finish tracing
      if (this.config.enableTracing && span) {
        this.tracing.finishSpan(span.spanId, success ? 'success' : 'error', error || undefined);
      }

      // Record metrics
      if (this.config.enableMetrics && options.recordMetrics !== false) {
        this.metrics.recordMetric(
          this.config.serviceName,
          `operation.${operationName}.duration`,
          duration,
          { success: success.toString() }
        );

        this.metrics.recordMetric(
          this.config.serviceName,
          `operation.${operationName}.count`,
          1,
          { success: success.toString() }
        );

        if (!success) {
          this.metrics.recordMetric(
            this.config.serviceName,
            `operation.${operationName}.errors`,
            1,
            { error: error?.message || 'unknown' }
          );
        }

        // Record HTTP metrics if provided
        if (options.endpoint && options.method) {
          const statusCode = success ? 200 : 500;
          this.metrics.recordRequest(
            this.config.serviceName,
            options.endpoint,
            options.method,
            statusCode,
            duration
          );
        }
      }
    }
  }

  /**
   * Record health check
   */
  recordHealthCheck(isHealthy: boolean, responseTime: number, error?: string): void {
    if (this.config.enableMetrics) {
      this.metrics.recordHealthCheck(this.config.serviceName, isHealthy, responseTime, error);
    }
  }

  /**
   * Record business metric
   */
  recordBusinessMetric(operation: string, count: number, tags: Record<string, string> = {}): void {
    if (this.config.enableMetrics) {
      this.metrics.recordBusinessMetric(this.config.serviceName, operation, count, tags);
    }
  }

  /**
   * Get monitoring dashboard data
   */
  getDashboardData(): {
    service: {
      name: string;
      uptime: number;
      status: 'healthy' | 'degraded' | 'unhealthy';
    };
    tracing: {
      enabled: boolean;
      stats: any;
    };
    metrics: {
      enabled: boolean;
      overview: any;
      health: any[];
    };
    recent: {
      traces: any[];
      errors: any[];
    };
  } {
    const healthStatus = this.config.enableMetrics 
      ? this.metrics.getServiceHealth(this.config.serviceName)[0]?.status || 'unknown'
      : 'unknown';

    const systemOverview = this.config.enableMetrics 
      ? this.metrics.getSystemOverview()
      : null;

    const tracingStats = this.config.enableTracing 
      ? this.tracing.getStats()
      : null;

    return {
      service: {
        name: this.config.serviceName,
        uptime: systemOverview?.uptime || 0,
        status: healthStatus as any
      },
      tracing: {
        enabled: this.config.enableTracing,
        stats: tracingStats
      },
      metrics: {
        enabled: this.config.enableMetrics,
        overview: systemOverview,
        health: this.config.enableMetrics ? this.metrics.getServiceHealth() : []
      },
      recent: {
        traces: this.config.enableTracing ? this.getRecentTraces(10) : [],
        errors: this.config.enableMetrics ? this.getRecentErrors(10) : []
      }
    };
  }

  /**
   * Get recent traces
   */
  private getRecentTraces(limit: number): any[] {
    if (!this.config.enableTracing) return [];

    const stats = this.tracing.getStats();
    // This would need to be implemented in DistributedTracing
    // For now, return empty array
    return [];
  }

  /**
   * Get recent errors
   */
  private getRecentErrors(limit: number): any[] {
    if (!this.config.enableMetrics) return [];

    // Get error metrics from the last 10 minutes
    const errorMetrics = this.metrics.getTimeSeries(
      'operation.errors',
      10 * 60 * 1000, // 10 minutes
      60 * 1000 // 1 minute buckets
    );

    return errorMetrics
      .filter(point => point.value > 0)
      .slice(-limit);
  }

  /**
   * Setup event forwarding
   */
  private setupEventForwarding(): void {
    // Forward tracing events
    if (this.config.enableTracing) {
      // DistributedTracing doesn't emit events yet, but we could add them
    }

    // Forward metrics events
    if (this.config.enableMetrics) {
      this.metrics.on('metricRecorded', (metric) => {
        this.emit('metricRecorded', metric);
      });

      this.metrics.on('healthCheckRecorded', (health) => {
        this.emit('healthCheckRecorded', health);
      });
    }
  }

  /**
   * Setup cleanup process
   */
  private setupCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      if (this.config.enableTracing) {
        this.tracing.cleanup(this.config.maxTraceAge);
      }

      if (this.config.enableMetrics) {
        this.metrics.cleanup(this.config.maxMetricAge);
      }
    }, this.config.cleanupInterval);
  }

  /**
   * Shutdown monitoring
   */
  shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    this.removeAllListeners();
    console.log(`[DISTRIBUTED MONITOR] Shutdown complete for service: ${this.config.serviceName}`);
  }
}

// Factory function for easy setup
export function createDistributedMonitor(serviceName: string, config: Partial<MonitoringConfig> = {}): DistributedMonitor {
  return new DistributedMonitor({
    serviceName,
    ...config
  });
}