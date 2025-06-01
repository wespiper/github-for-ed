/**
 * Metrics collection for service interactions
 */

import { EventBus } from '../events/EventBus';
import { CacheService } from '../cache/CacheService';
import { Logger } from './Logger';

export interface Metric {
  name: string;
  value: number;
  tags: Record<string, string>;
  timestamp: Date;
}

export interface ServiceMetrics {
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

export class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics: Map<string, number[]> = new Map();
  private counters: Map<string, number> = new Map();
  private logger = Logger.getInstance('metrics');

  private constructor(
    private cache?: CacheService,
    private eventBus?: EventBus
  ) {
    // Flush metrics periodically
    setInterval(() => this.flush(), 60000); // Every minute
  }

  static getInstance(cache?: CacheService, eventBus?: EventBus): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector(cache, eventBus);
    }
    return MetricsCollector.instance;
  }

  /**
   * Record a timing metric
   */
  recordTiming(name: string, duration: number, tags?: Record<string, string>): void {
    const key = this.buildKey(name, tags);
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    this.metrics.get(key)!.push(duration);
    
    // Keep only last 1000 values to prevent memory issues
    const values = this.metrics.get(key)!;
    if (values.length > 1000) {
      this.metrics.set(key, values.slice(-1000));
    }
  }

  /**
   * Increment a counter
   */
  increment(name: string, value: number = 1, tags?: Record<string, string>): void {
    const key = this.buildKey(name, tags);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }

  /**
   * Get service metrics
   */
  getServiceMetrics(serviceName: string): ServiceMetrics {
    const requestKey = this.buildKey('request.count', { service: serviceName });
    const errorKey = this.buildKey('request.error', { service: serviceName });
    const timingKey = this.buildKey('request.duration', { service: serviceName });
    
    const timings = this.metrics.get(timingKey) || [];
    const sortedTimings = [...timings].sort((a, b) => a - b);
    
    return {
      requestCount: this.counters.get(requestKey) || 0,
      errorCount: this.counters.get(errorKey) || 0,
      averageResponseTime: this.calculateAverage(timings),
      p95ResponseTime: this.calculatePercentile(sortedTimings, 0.95),
      p99ResponseTime: this.calculatePercentile(sortedTimings, 0.99)
    };
  }

  /**
   * Create Express middleware for automatic request timing
   */
  static expressMiddleware() {
    const collector = MetricsCollector.getInstance();
    
    return (req: any, res: any, next: any) => {
      const start = Date.now();
      const service = req.baseUrl?.split('/')[1] || 'unknown';
      
      // Increment request counter
      collector.increment('request.count', 1, {
        service,
        method: req.method,
        path: req.route?.path || req.path
      });
      
      // Override res.end to capture timing
      const originalEnd = res.end;
      res.end = function(...args: any[]) {
        const duration = Date.now() - start;
        
        // Record timing
        collector.recordTiming('request.duration', duration, {
          service,
          method: req.method,
          path: req.route?.path || req.path,
          status: res.statusCode.toString()
        });
        
        // Increment error counter if applicable
        if (res.statusCode >= 400) {
          collector.increment('request.error', 1, {
            service,
            method: req.method,
            path: req.route?.path || req.path,
            status: res.statusCode.toString()
          });
        }
        
        // Call original end
        originalEnd.apply(res, args);
      };
      
      next();
    };
  }

  /**
   * Helper to build metric key
   */
  private buildKey(name: string, tags?: Record<string, string>): string {
    if (!tags || Object.keys(tags).length === 0) {
      return name;
    }
    
    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
    
    return `${name}{${tagString}}`;
  }

  /**
   * Calculate average of values
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;
    
    const index = Math.ceil(sortedValues.length * percentile) - 1;
    return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
  }

  /**
   * Flush metrics to storage/monitoring service
   */
  private async flush(): Promise<void> {
    try {
      // Log current metrics
      this.logger.info('Flushing metrics', {
        counters: this.counters.size,
        timings: this.metrics.size
      });

      // In production, this would send to a metrics service
      // For now, cache aggregated metrics
      if (this.cache) {
        const timestamp = Date.now();
        
        // Store counters
        for (const [key, value] of this.counters.entries()) {
          await this.cache.set(
            `metrics:counter:${key}:${timestamp}`,
            value,
            { ttl: 3600 } // 1 hour
          );
        }
        
        // Store timing summaries
        for (const [key, values] of this.metrics.entries()) {
          if (values.length > 0) {
            const sorted = [...values].sort((a, b) => a - b);
            const summary = {
              count: values.length,
              min: sorted[0],
              max: sorted[sorted.length - 1],
              avg: this.calculateAverage(values),
              p50: this.calculatePercentile(sorted, 0.5),
              p95: this.calculatePercentile(sorted, 0.95),
              p99: this.calculatePercentile(sorted, 0.99)
            };
            
            await this.cache.set(
              `metrics:timing:${key}:${timestamp}`,
              summary,
              { ttl: 3600 }
            );
          }
        }
      }

      // Reset counters and clear old timing data
      this.counters.clear();
      for (const [key, values] of this.metrics.entries()) {
        // Keep only recent values
        if (values.length > 100) {
          this.metrics.set(key, values.slice(-100));
        }
      }
    } catch (error) {
      this.logger.error('Failed to flush metrics', error as Error);
    }
  }

  /**
   * Get all current metrics (for debugging/monitoring)
   */
  getAllMetrics(): { counters: Record<string, number>; timings: Record<string, any> } {
    const counters: Record<string, number> = {};
    const timings: Record<string, any> = {};
    
    for (const [key, value] of this.counters.entries()) {
      counters[key] = value;
    }
    
    for (const [key, values] of this.metrics.entries()) {
      if (values.length > 0) {
        const sorted = [...values].sort((a, b) => a - b);
        timings[key] = {
          count: values.length,
          min: sorted[0],
          max: sorted[sorted.length - 1],
          avg: this.calculateAverage(values),
          p50: this.calculatePercentile(sorted, 0.5),
          p95: this.calculatePercentile(sorted, 0.95),
          p99: this.calculatePercentile(sorted, 0.99)
        };
      }
    }
    
    return { counters, timings };
  }
}

// Export singleton instance
export const metricsCollector = MetricsCollector.getInstance();