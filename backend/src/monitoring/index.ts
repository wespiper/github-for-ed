/**
 * Monitoring and observability exports
 */

export { Logger, logger, BoundLogger, LogContext, LogLevel } from './Logger';
export { HealthCheck, HealthStatus } from './HealthCheck';
export { MetricsCollector, metricsCollector, Metric, ServiceMetrics } from './MetricsCollector';

// Re-export convenience middleware (simplified to avoid circular references)
export function createMonitoringMiddleware() {
  const { Logger } = require('./Logger');
  const { MetricsCollector } = require('./MetricsCollector');
  const { HealthCheck } = require('./HealthCheck');
  
  return {
    correlationId: Logger.expressMiddleware,
    metrics: MetricsCollector.expressMiddleware,
    health: HealthCheck.handler
  };
}