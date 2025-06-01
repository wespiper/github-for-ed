/**
 * Monitoring and observability exports
 */

export { Logger, logger, BoundLogger, LogContext, LogLevel } from './Logger';
export { HealthCheck, HealthStatus } from './HealthCheck';
export { MetricsCollector, metricsCollector, Metric, ServiceMetrics } from './MetricsCollector';

// Re-export convenience middleware (simplified to avoid circular references)
export function createMonitoringMiddleware() {
  return {
    correlationId: Logger.expressMiddleware,
    metrics: MetricsCollector.expressMiddleware,
    health: HealthCheck.handler
  };
}