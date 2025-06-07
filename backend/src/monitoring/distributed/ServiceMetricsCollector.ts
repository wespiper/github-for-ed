import { EventEmitter } from 'events';

export interface ServiceMetric {
  timestamp: number;
  serviceName: string;
  metricName: string;
  value: number;
  tags: Record<string, string>;
}

export interface ServiceHealth {
  serviceName: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
  uptime: number;
}

export interface MetricAggregation {
  metricName: string;
  count: number;
  min: number;
  max: number;
  avg: number;
  sum: number;
  percentiles: {
    p50: number;
    p95: number;
    p99: number;
  };
}

export class ServiceMetricsCollector extends EventEmitter {
  private metrics: ServiceMetric[] = [];
  private healthChecks = new Map<string, ServiceHealth>();
  private aggregationCache = new Map<string, MetricAggregation>();
  private startTime = Date.now();

  constructor() {
    super();
    this.setupCleanupTimer();
  }

  /**
   * Record a metric
   */
  recordMetric(
    serviceName: string,
    metricName: string,
    value: number,
    tags: Record<string, string> = {}
  ): void {
    const metric: ServiceMetric = {
      timestamp: Date.now(),
      serviceName,
      metricName,
      value,
      tags
    };

    this.metrics.push(metric);
    this.invalidateAggregationCache(metricName);
    
    // Emit metric event for real-time monitoring
    this.emit('metricRecorded', metric);

    // Auto-cleanup if we have too many metrics
    if (this.metrics.length > 100000) {
      this.cleanup(60 * 60 * 1000); // Keep last hour
    }
  }

  /**
   * Record service health check
   */
  recordHealthCheck(
    serviceName: string,
    isHealthy: boolean,
    responseTime: number,
    error?: string
  ): void {
    const existing = this.healthChecks.get(serviceName);
    const now = Date.now();

    // Calculate error rate (simple moving average)
    const errorRate = existing 
      ? (existing.errorRate * 0.9) + (isHealthy ? 0 : 0.1)
      : (isHealthy ? 0 : 1);

    // Calculate throughput (requests per second)
    const timeDiff = existing ? (now - existing.lastCheck) / 1000 : 1;
    const throughput = existing 
      ? (existing.throughput * 0.9) + (1 / timeDiff * 0.1)
      : 1;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (isHealthy && responseTime < 1000 && errorRate < 0.05) {
      status = 'healthy';
    } else if (isHealthy && responseTime < 3000 && errorRate < 0.1) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    const health: ServiceHealth = {
      serviceName,
      status,
      lastCheck: now,
      responseTime,
      errorRate,
      throughput,
      uptime: existing ? existing.uptime + (now - existing.lastCheck) : 0
    };

    this.healthChecks.set(serviceName, health);
    this.emit('healthCheckRecorded', health);

    // Record metrics
    this.recordMetric(serviceName, 'health.response_time', responseTime, { status: status });
    this.recordMetric(serviceName, 'health.error_rate', errorRate, { status: status });
    this.recordMetric(serviceName, 'health.throughput', throughput, { status: status });

    if (error) {
      this.recordMetric(serviceName, 'health.errors', 1, { error: error });
    }
  }

  /**
   * Record request metrics
   */
  recordRequest(
    serviceName: string,
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number
  ): void {
    const tags = {
      endpoint,
      method,
      status_code: statusCode.toString(),
      status_class: `${Math.floor(statusCode / 100)}xx`
    };

    this.recordMetric(serviceName, 'http.request.duration', duration, tags);
    this.recordMetric(serviceName, 'http.request.count', 1, tags);

    if (statusCode >= 400) {
      this.recordMetric(serviceName, 'http.request.errors', 1, tags);
    }
  }

  /**
   * Record business metrics
   */
  recordBusinessMetric(
    serviceName: string,
    operation: string,
    count: number,
    tags: Record<string, string> = {}
  ): void {
    this.recordMetric(serviceName, `business.${operation}`, count, tags);
  }

  /**
   * Get aggregated metrics
   */
  getAggregatedMetrics(
    metricName: string,
    timeWindow: number = 60 * 1000, // 1 minute default
    serviceName?: string
  ): MetricAggregation | null {
    const cacheKey = `${metricName}:${timeWindow}:${serviceName || 'all'}`;
    
    // Check cache first
    const cached = this.aggregationCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const cutoff = Date.now() - timeWindow;
    let filteredMetrics = this.metrics.filter(m => 
      m.timestamp >= cutoff && 
      m.metricName === metricName
    );

    if (serviceName) {
      filteredMetrics = filteredMetrics.filter(m => m.serviceName === serviceName);
    }

    if (filteredMetrics.length === 0) {
      return null;
    }

    const values = filteredMetrics.map(m => m.value).sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const count = values.length;

    const aggregation: MetricAggregation = {
      metricName,
      count,
      min: values[0],
      max: values[values.length - 1],
      avg: sum / count,
      sum,
      percentiles: {
        p50: this.percentile(values, 50),
        p95: this.percentile(values, 95),
        p99: this.percentile(values, 99)
      }
    };

    // Cache for 30 seconds
    this.aggregationCache.set(cacheKey, aggregation);
    setTimeout(() => this.aggregationCache.delete(cacheKey), 30000);

    return aggregation;
  }

  /**
   * Get service health status
   */
  getServiceHealth(serviceName?: string): ServiceHealth[] {
    const health = Array.from(this.healthChecks.values());
    return serviceName 
      ? health.filter(h => h.serviceName === serviceName)
      : health;
  }

  /**
   * Get system overview metrics
   */
  getSystemOverview(): {
    totalServices: number;
    healthyServices: number;
    degradedServices: number;
    unhealthyServices: number;
    totalRequests: number;
    errorRate: number;
    avgResponseTime: number;
    uptime: number;
  } {
    const health = Array.from(this.healthChecks.values());
    const totalServices = health.length;
    const healthyServices = health.filter(h => h.status === 'healthy').length;
    const degradedServices = health.filter(h => h.status === 'degraded').length;
    const unhealthyServices = health.filter(h => h.status === 'unhealthy').length;

    // Calculate system-wide metrics
    const requestMetrics = this.getAggregatedMetrics('http.request.count', 60 * 1000);
    const durationMetrics = this.getAggregatedMetrics('http.request.duration', 60 * 1000);
    const errorMetrics = this.getAggregatedMetrics('http.request.errors', 60 * 1000);

    const totalRequests = requestMetrics?.sum || 0;
    const totalErrors = errorMetrics?.sum || 0;
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;
    const avgResponseTime = durationMetrics?.avg || 0;
    const uptime = Date.now() - this.startTime;

    return {
      totalServices,
      healthyServices,
      degradedServices,
      unhealthyServices,
      totalRequests,
      errorRate,
      avgResponseTime,
      uptime
    };
  }

  /**
   * Get metrics for a time series chart
   */
  getTimeSeries(
    metricName: string,
    timeWindow: number = 60 * 60 * 1000, // 1 hour
    bucketSize: number = 60 * 1000, // 1 minute buckets
    serviceName?: string
  ): Array<{ timestamp: number; value: number }> {
    const cutoff = Date.now() - timeWindow;
    let filteredMetrics = this.metrics.filter(m => 
      m.timestamp >= cutoff && 
      m.metricName === metricName
    );

    if (serviceName) {
      filteredMetrics = filteredMetrics.filter(m => m.serviceName === serviceName);
    }

    // Group into time buckets
    const buckets = new Map<number, number[]>();
    
    filteredMetrics.forEach(metric => {
      const bucketTime = Math.floor(metric.timestamp / bucketSize) * bucketSize;
      if (!buckets.has(bucketTime)) {
        buckets.set(bucketTime, []);
      }
      buckets.get(bucketTime)!.push(metric.value);
    });

    // Calculate average for each bucket
    return Array.from(buckets.entries())
      .map(([timestamp, values]) => ({
        timestamp,
        value: values.reduce((sum, val) => sum + val, 0) / values.length
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Calculate percentile
   */
  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    
    const index = Math.ceil(values.length * (p / 100)) - 1;
    return values[Math.max(0, Math.min(index, values.length - 1))];
  }

  /**
   * Invalidate aggregation cache
   */
  private invalidateAggregationCache(metricName: string): void {
    for (const key of this.aggregationCache.keys()) {
      if (key.startsWith(`${metricName}:`)) {
        this.aggregationCache.delete(key);
      }
    }
  }

  /**
   * Setup cleanup timer
   */
  private setupCleanupTimer(): void {
    // Clean up old metrics every 10 minutes
    setInterval(() => {
      this.cleanup(4 * 60 * 60 * 1000); // Keep last 4 hours
    }, 10 * 60 * 1000);
  }

  /**
   * Clean up old metrics
   */
  cleanup(maxAge: number): number {
    const cutoff = Date.now() - maxAge;
    const initialLength = this.metrics.length;
    
    this.metrics = this.metrics.filter(metric => metric.timestamp >= cutoff);
    
    const cleaned = initialLength - this.metrics.length;
    if (cleaned > 0) {
      console.log(`[METRICS COLLECTOR] Cleaned up ${cleaned} old metrics`);
    }
    
    return cleaned;
  }

  /**
   * Get collector statistics
   */
  getStats(): {
    totalMetrics: number;
    servicesTracked: number;
    oldestMetric: number;
    newestMetric: number;
    memoryUsage: number;
  } {
    const serviceNames = new Set(this.metrics.map(m => m.serviceName));
    const timestamps = this.metrics.map(m => m.timestamp);
    
    return {
      totalMetrics: this.metrics.length,
      servicesTracked: serviceNames.size,
      oldestMetric: Math.min(...timestamps) || 0,
      newestMetric: Math.max(...timestamps) || 0,
      memoryUsage: JSON.stringify(this.metrics).length // Rough estimate
    };
  }
}