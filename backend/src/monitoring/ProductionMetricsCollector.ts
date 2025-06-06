/**
 * Production-Grade Metrics Collection System
 * High-performance metrics with <2ms overhead and Prometheus compatibility
 */

import { MetricsCollector } from './MetricsCollector';
import { DistributedTracing, TraceSpan } from './distributed/DistributedTracing';
import { Logger } from './Logger';
import { EventEmitter } from 'events';

export interface PrometheusMetric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  help: string;
  labels: Record<string, string>;
  value: number;
  buckets?: number[]; // For histograms
  quantiles?: number[]; // For summaries
  timestamp: number;
}

export interface AdvancedMetricConfig {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  help: string;
  labelNames: string[];
  buckets?: number[]; // For histograms
  quantiles?: number[]; // For summaries
  enabled: boolean;
  samplingRate: number; // 0-1, for high-volume metrics
}

export interface AlertRule {
  name: string;
  metric: string;
  threshold: number;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  duration: number; // seconds
  labels: Record<string, string>;
  severity: 'critical' | 'warning' | 'info';
  enabled: boolean;
}

export interface PerformanceTarget {
  metric: string;
  target: number;
  tolerance: number; // percentage
  timeWindow: number; // seconds
}

export class ProductionMetricsCollector extends EventEmitter {
  private static instance: ProductionMetricsCollector;
  private baseCollector: MetricsCollector;
  private distributedTracing: DistributedTracing;
  private logger = Logger.getInstance('production-metrics');
  
  private metricsBuffer: PrometheusMetric[] = [];
  private metricConfigs = new Map<string, AdvancedMetricConfig>();
  private alertRules: AlertRule[] = [];
  private performanceTargets: PerformanceTarget[] = [];
  private lastFlush = Date.now();
  private flushInterval = 10000; // 10 seconds
  private maxBufferSize = 10000;
  
  // Performance tracking
  private metricsOverhead: number[] = [];
  private lastPerformanceCheck = Date.now();

  private constructor() {
    super();
    this.baseCollector = MetricsCollector.getInstance();
    this.distributedTracing = new DistributedTracing('production-metrics');
    this.initializeDefaultMetrics();
    this.startPerformanceMonitoring();
    this.startAlertProcessing();
  }

  static getInstance(): ProductionMetricsCollector {
    if (!ProductionMetricsCollector.instance) {
      ProductionMetricsCollector.instance = new ProductionMetricsCollector();
    }
    return ProductionMetricsCollector.instance;
  }

  /**
   * Initialize default production metrics
   */
  private initializeDefaultMetrics(): void {
    const defaultConfigs: AdvancedMetricConfig[] = [
      {
        name: 'http_requests_total',
        type: 'counter',
        help: 'Total HTTP requests processed',
        labelNames: ['method', 'status', 'service', 'endpoint'],
        enabled: true,
        samplingRate: 1.0
      },
      {
        name: 'http_request_duration_seconds',
        type: 'histogram',
        help: 'HTTP request duration in seconds',
        labelNames: ['method', 'service', 'endpoint'],
        buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
        enabled: true,
        samplingRate: 1.0
      },
      {
        name: 'mcp_tool_calls_total',
        type: 'counter',
        help: 'Total MCP tool calls',
        labelNames: ['service', 'tool', 'status'],
        enabled: true,
        samplingRate: 1.0
      },
      {
        name: 'mcp_tool_duration_seconds',
        type: 'histogram',
        help: 'MCP tool execution duration',
        labelNames: ['service', 'tool'],
        buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1],
        enabled: true,
        samplingRate: 1.0
      },
      {
        name: 'cache_operations_total',
        type: 'counter',
        help: 'Total cache operations',
        labelNames: ['operation', 'status', 'cache_type'],
        enabled: true,
        samplingRate: 1.0
      },
      {
        name: 'cache_hit_rate',
        type: 'gauge',
        help: 'Cache hit rate percentage',
        labelNames: ['cache_type'],
        enabled: true,
        samplingRate: 1.0
      },
      {
        name: 'database_query_duration_seconds',
        type: 'histogram',
        help: 'Database query duration',
        labelNames: ['query_type', 'table'],
        buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5],
        enabled: true,
        samplingRate: 1.0
      },
      {
        name: 'privacy_operations_total',
        type: 'counter',
        help: 'Privacy operations performed',
        labelNames: ['operation_type', 'compliance_level'],
        enabled: true,
        samplingRate: 1.0
      },
      {
        name: 'event_bus_messages_total',
        type: 'counter',
        help: 'Event bus messages processed',
        labelNames: ['event_type', 'status'],
        enabled: true,
        samplingRate: 1.0
      },
      {
        name: 'concurrent_users',
        type: 'gauge',
        help: 'Current number of concurrent users',
        labelNames: ['service'],
        enabled: true,
        samplingRate: 1.0
      }
    ];

    defaultConfigs.forEach(config => {
      this.metricConfigs.set(config.name, config);
    });

    // Initialize default alert rules
    this.initializeDefaultAlerts();
    
    // Initialize performance targets
    this.initializePerformanceTargets();
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultAlerts(): void {
    this.alertRules = [
      {
        name: 'high_response_time',
        metric: 'http_request_duration_seconds',
        threshold: 0.15, // 150ms
        operator: '>',
        duration: 60,
        labels: {},
        severity: 'warning',
        enabled: true
      },
      {
        name: 'critical_response_time',
        metric: 'http_request_duration_seconds',
        threshold: 0.5, // 500ms
        operator: '>',
        duration: 30,
        labels: {},
        severity: 'critical',
        enabled: true
      },
      {
        name: 'low_cache_hit_rate',
        metric: 'cache_hit_rate',
        threshold: 60, // 60%
        operator: '<',
        duration: 300,
        labels: {},
        severity: 'warning',
        enabled: true
      },
      {
        name: 'high_error_rate',
        metric: 'http_requests_total',
        threshold: 5, // 5% error rate
        operator: '>',
        duration: 120,
        labels: { status: '5xx' },
        severity: 'critical',
        enabled: true
      },
      {
        name: 'privacy_compliance_alert',
        metric: 'privacy_operations_total',
        threshold: 95, // 95% compliance
        operator: '<',
        duration: 60,
        labels: { compliance_level: 'non_compliant' },
        severity: 'critical',
        enabled: true
      }
    ];
  }

  /**
   * Initialize performance targets
   */
  private initializePerformanceTargets(): void {
    this.performanceTargets = [
      {
        metric: 'http_request_duration_seconds',
        target: 0.15, // 150ms
        tolerance: 10, // 10%
        timeWindow: 300 // 5 minutes
      },
      {
        metric: 'cache_hit_rate',
        target: 80, // 80%
        tolerance: 5, // 5%
        timeWindow: 600 // 10 minutes
      },
      {
        metric: 'concurrent_users',
        target: 200, // 200 users
        tolerance: 5, // 5%
        timeWindow: 300 // 5 minutes
      }
    ];
  }

  /**
   * Record a metric with high performance
   */
  recordMetric(
    name: string,
    value: number,
    labels: Record<string, string> = {},
    timestamp?: number
  ): void {
    const startTime = process.hrtime.bigint();
    
    const config = this.metricConfigs.get(name);
    if (!config || !config.enabled) {
      return;
    }

    // Apply sampling
    if (config.samplingRate < 1.0 && Math.random() > config.samplingRate) {
      return;
    }

    const metric: PrometheusMetric = {
      name,
      type: config.type,
      help: config.help,
      labels,
      value,
      timestamp: timestamp || Date.now()
    };

    if (config.buckets) {
      metric.buckets = config.buckets;
    }
    if (config.quantiles) {
      metric.quantiles = config.quantiles;
    }

    this.metricsBuffer.push(metric);

    // Track overhead
    const endTime = process.hrtime.bigint();
    const overhead = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    this.metricsOverhead.push(overhead);

    // Flush if buffer is full
    if (this.metricsBuffer.length >= this.maxBufferSize) {
      this.flush();
    }

    // Also record in base collector for compatibility
    this.baseCollector.recordTiming(name, value, labels);
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(
    name: string,
    value: number = 1,
    labels: Record<string, string> = {}
  ): void {
    this.recordMetric(name, value, labels);
    this.baseCollector.increment(name, value, labels);
  }

  /**
   * Set a gauge metric
   */
  setGauge(
    name: string,
    value: number,
    labels: Record<string, string> = {}
  ): void {
    this.recordMetric(name, value, labels);
  }

  /**
   * Record histogram value
   */
  recordHistogram(
    name: string,
    value: number,
    labels: Record<string, string> = {}
  ): void {
    this.recordMetric(name, value, labels);
  }

  /**
   * Start performance monitoring loop
   */
  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.checkPerformance();
      this.checkTargets();
      this.cleanup();
    }, 30000); // Every 30 seconds
  }

  /**
   * Check metrics collection performance
   */
  private checkPerformance(): void {
    if (this.metricsOverhead.length === 0) return;

    const avgOverhead = this.metricsOverhead.reduce((a, b) => a + b, 0) / this.metricsOverhead.length;
    const maxOverhead = Math.max(...this.metricsOverhead);

    // Alert if overhead exceeds 2ms target
    if (avgOverhead > 2) {
      this.logger.warn('Metrics collection overhead exceeds target', {
        avgOverhead,
        maxOverhead,
        target: 2
      });
      
      this.emit('performance_alert', {
        type: 'metrics_overhead',
        avgOverhead,
        maxOverhead,
        threshold: 2
      });
    }

    // Record performance metrics
    this.setGauge('metrics_collection_overhead_ms', avgOverhead);
    this.setGauge('metrics_buffer_size', this.metricsBuffer.length);

    // Reset overhead tracking
    this.metricsOverhead = [];
  }

  /**
   * Check performance targets
   */
  private checkTargets(): void {
    this.performanceTargets.forEach(target => {
      // This would check against historical data in production
      // For now, just emit target tracking events
      this.emit('target_check', {
        metric: target.metric,
        target: target.target,
        tolerance: target.tolerance,
        timeWindow: target.timeWindow
      });
    });
  }

  /**
   * Start alert processing loop
   */
  private startAlertProcessing(): void {
    setInterval(() => {
      this.processAlerts();
    }, 15000); // Every 15 seconds
  }

  /**
   * Process alert rules
   */
  private processAlerts(): void {
    this.alertRules.forEach(rule => {
      if (!rule.enabled) return;

      // This would evaluate against time-series data in production
      // For now, emit alert processing events
      this.emit('alert_evaluated', {
        rule: rule.name,
        metric: rule.metric,
        threshold: rule.threshold,
        severity: rule.severity
      });
    });
  }

  /**
   * Flush metrics buffer
   */
  async flush(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    const metrics = [...this.metricsBuffer];
    this.metricsBuffer = [];
    this.lastFlush = Date.now();

    try {
      // In production, this would send to Prometheus pushgateway
      // or be scraped by Prometheus
      this.logger.info('Flushing metrics', {
        count: metrics.length,
        types: this.getMetricTypeCount(metrics)
      });

      // Emit metrics for external processing
      this.emit('metrics_flushed', {
        metrics,
        timestamp: Date.now(),
        count: metrics.length
      });

    } catch (error) {
      this.logger.error('Failed to flush metrics', error as Error);
      
      // Re-add metrics to buffer with limit
      const keepCount = Math.max(0, this.maxBufferSize - this.metricsBuffer.length);
      this.metricsBuffer.unshift(...metrics.slice(0, keepCount));
    }
  }

  /**
   * Get metric type count for logging
   */
  private getMetricTypeCount(metrics: PrometheusMetric[]): Record<string, number> {
    const counts: Record<string, number> = {};
    metrics.forEach(metric => {
      counts[metric.type] = (counts[metric.type] || 0) + 1;
    });
    return counts;
  }

  /**
   * Add custom metric configuration
   */
  addMetricConfig(config: AdvancedMetricConfig): void {
    this.metricConfigs.set(config.name, config);
  }

  /**
   * Add alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule);
  }

  /**
   * Get current metrics in Prometheus format
   */
  getPrometheusMetrics(): string {
    const lines: string[] = [];
    const metricGroups = new Map<string, PrometheusMetric[]>();

    // Group metrics by name
    this.metricsBuffer.forEach(metric => {
      if (!metricGroups.has(metric.name)) {
        metricGroups.set(metric.name, []);
      }
      metricGroups.get(metric.name)!.push(metric);
    });

    // Format for Prometheus
    metricGroups.forEach((metrics, name) => {
      const config = this.metricConfigs.get(name);
      if (!config) return;

      lines.push(`# HELP ${name} ${config.help}`);
      lines.push(`# TYPE ${name} ${config.type}`);

      metrics.forEach(metric => {
        const labelStr = Object.entries(metric.labels)
          .map(([k, v]) => `${k}="${v}"`)
          .join(',');
        
        const labelPart = labelStr ? `{${labelStr}}` : '';
        lines.push(`${name}${labelPart} ${metric.value} ${metric.timestamp}`);
      });
    });

    return lines.join('\n');
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    bufferSize: number;
    flushInterval: number;
    avgOverhead: number;
    metricsPerSecond: number;
    alertRules: number;
    activeConfigs: number;
  } {
    const avgOverhead = this.metricsOverhead.length > 0 
      ? this.metricsOverhead.reduce((a, b) => a + b, 0) / this.metricsOverhead.length 
      : 0;

    const timeSinceFlush = Date.now() - this.lastFlush;
    const metricsPerSecond = timeSinceFlush > 0 
      ? (this.metricsBuffer.length / timeSinceFlush) * 1000 
      : 0;

    return {
      bufferSize: this.metricsBuffer.length,
      flushInterval: this.flushInterval,
      avgOverhead,
      metricsPerSecond,
      alertRules: this.alertRules.filter(r => r.enabled).length,
      activeConfigs: Array.from(this.metricConfigs.values()).filter(c => c.enabled).length
    };
  }

  /**
   * Cleanup old data
   */
  private cleanup(): void {
    // Limit overhead tracking
    if (this.metricsOverhead.length > 1000) {
      this.metricsOverhead = this.metricsOverhead.slice(-500);
    }

    // Clean up distributed tracing
    this.distributedTracing.cleanup();
  }

  /**
   * Create MCP tool tracking middleware
   */
  createMCPMiddleware() {
    return {
      before: (toolName: string, args: any) => {
        const span = this.distributedTracing.startSpan(`mcp:${toolName}`, undefined, {
          'mcp.tool': toolName,
          'mcp.args_count': Object.keys(args || {}).length
        });
        
        this.incrementCounter('mcp_tool_calls_total', 1, {
          service: 'mcp',
          tool: toolName,
          status: 'started'
        });

        return span;
      },
      after: (span: TraceSpan, result: any, error?: Error) => {
        const duration = Date.now() - span.startTime;
        const toolName = span.tags['mcp.tool'];
        
        this.recordHistogram('mcp_tool_duration_seconds', duration / 1000, {
          service: 'mcp',
          tool: toolName
        });

        this.incrementCounter('mcp_tool_calls_total', 1, {
          service: 'mcp',
          tool: toolName,
          status: error ? 'error' : 'success'
        });

        this.distributedTracing.finishSpan(
          span.spanId, 
          error ? 'error' : 'success', 
          error
        );
      }
    };
  }

  /**
   * Force flush for shutdown
   */
  async forceFlush(): Promise<void> {
    await this.flush();
  }
}

// Export singleton instance
export const productionMetrics = ProductionMetricsCollector.getInstance();