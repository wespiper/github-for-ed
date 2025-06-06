/**
 * Performance Profiler for Integration Testing
 * Provides detailed performance metrics and profiling capabilities
 */
export class PerformanceProfiler {
  private isRunning = false;
  private startTime = 0;
  private measurements: Map<string, ProfiledOperation[]> = new Map();
  private activeOperations: Map<string, number> = new Map();

  /**
   * Start performance profiling
   */
  start(): void {
    this.isRunning = true;
    this.startTime = Date.now();
    this.measurements.clear();
    this.activeOperations.clear();
    console.log('[PROFILER] Performance profiling started');
  }

  /**
   * Stop performance profiling
   */
  stop(): void {
    this.isRunning = false;
    console.log('[PROFILER] Performance profiling stopped');
  }

  /**
   * Start timing an operation
   */
  startOperation(operationId: string, metadata?: Record<string, any>): void {
    if (!this.isRunning) return;
    
    this.activeOperations.set(operationId, Date.now());
  }

  /**
   * End timing an operation
   */
  endOperation(operationId: string, result?: 'success' | 'error', metadata?: Record<string, any>): void {
    if (!this.isRunning) return;
    
    const startTime = this.activeOperations.get(operationId);
    if (!startTime) return;

    const duration = Date.now() - startTime;
    const operation: ProfiledOperation = {
      operationId,
      duration,
      result: result || 'success',
      timestamp: Date.now(),
      metadata
    };

    const operationType = operationId.split(':')[0]; // Extract operation type from ID
    if (!this.measurements.has(operationType)) {
      this.measurements.set(operationType, []);
    }
    this.measurements.get(operationType)!.push(operation);

    this.activeOperations.delete(operationId);
  }

  /**
   * Get performance summary
   */
  getSummary(): PerformanceSummary {
    const summary: PerformanceSummary = {
      totalDuration: Date.now() - this.startTime,
      operationTypes: new Map(),
      aggregateMetrics: {
        totalOperations: 0,
        averageDuration: 0,
        p95Duration: 0,
        p99Duration: 0,
        successRate: 0,
        operationsPerSecond: 0
      }
    };

    let allOperations: ProfiledOperation[] = [];

    for (const [operationType, operations] of this.measurements.entries()) {
      const durations = operations.map(op => op.duration).sort((a, b) => a - b);
      const successCount = operations.filter(op => op.result === 'success').length;

      const typeMetrics: OperationTypeMetrics = {
        operationType,
        count: operations.length,
        averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        p50Duration: durations[Math.floor(durations.length * 0.5)] || 0,
        p95Duration: durations[Math.floor(durations.length * 0.95)] || 0,
        p99Duration: durations[Math.floor(durations.length * 0.99)] || 0,
        successRate: (successCount / operations.length) * 100,
        throughput: (operations.length / summary.totalDuration) * 1000
      };

      summary.operationTypes.set(operationType, typeMetrics);
      allOperations = allOperations.concat(operations);
    }

    // Calculate aggregate metrics
    if (allOperations.length > 0) {
      const allDurations = allOperations.map(op => op.duration).sort((a, b) => a - b);
      const successCount = allOperations.filter(op => op.result === 'success').length;

      summary.aggregateMetrics = {
        totalOperations: allOperations.length,
        averageDuration: allDurations.reduce((sum, d) => sum + d, 0) / allDurations.length,
        p95Duration: allDurations[Math.floor(allDurations.length * 0.95)] || 0,
        p99Duration: allDurations[Math.floor(allDurations.length * 0.99)] || 0,
        successRate: (successCount / allOperations.length) * 100,
        operationsPerSecond: (allOperations.length / summary.totalDuration) * 1000
      };
    }

    return summary;
  }

  /**
   * Get detailed metrics for a specific operation type
   */
  getOperationMetrics(operationType: string): OperationTypeMetrics | undefined {
    return this.getSummary().operationTypes.get(operationType);
  }

  /**
   * Export performance data for analysis
   */
  exportData(): PerformanceExport {
    return {
      timestamp: new Date().toISOString(),
      profileDuration: Date.now() - this.startTime,
      summary: this.getSummary(),
      rawOperations: Object.fromEntries(this.measurements.entries())
    };
  }

  /**
   * Reset all measurements
   */
  reset(): void {
    this.measurements.clear();
    this.activeOperations.clear();
    this.startTime = Date.now();
  }
}

export interface ProfiledOperation {
  operationId: string;
  duration: number;
  result: 'success' | 'error';
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface OperationTypeMetrics {
  operationType: string;
  count: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  p50Duration: number;
  p95Duration: number;
  p99Duration: number;
  successRate: number;
  throughput: number;
}

export interface PerformanceSummary {
  totalDuration: number;
  operationTypes: Map<string, OperationTypeMetrics>;
  aggregateMetrics: {
    totalOperations: number;
    averageDuration: number;
    p95Duration: number;
    p99Duration: number;
    successRate: number;
    operationsPerSecond: number;
  };
}

export interface PerformanceExport {
  timestamp: string;
  profileDuration: number;
  summary: PerformanceSummary;
  rawOperations: Record<string, ProfiledOperation[]>;
}