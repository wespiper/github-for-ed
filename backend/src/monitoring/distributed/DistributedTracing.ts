import { v4 as uuidv4 } from 'uuid';

export interface TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  serviceName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'pending' | 'success' | 'error';
  tags: Record<string, any>;
  logs: Array<{
    timestamp: number;
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    fields?: Record<string, any>;
  }>;
}

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  baggage?: Record<string, any>;
}

export class DistributedTracing {
  private spans = new Map<string, TraceSpan>();
  private activeSpans = new Map<string, string>(); // correlationId -> spanId
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * Start a new trace or continue an existing one
   */
  startSpan(
    operationName: string,
    parentContext?: TraceContext,
    tags: Record<string, any> = {}
  ): TraceSpan {
    const traceId = parentContext?.traceId || uuidv4();
    const spanId = uuidv4();
    const parentSpanId = parentContext?.spanId;

    const span: TraceSpan = {
      traceId,
      spanId,
      parentSpanId,
      operationName,
      serviceName: this.serviceName,
      startTime: Date.now(),
      status: 'pending',
      tags: {
        'service.name': this.serviceName,
        'operation.name': operationName,
        ...tags
      },
      logs: []
    };

    this.spans.set(spanId, span);
    
    console.log(`[DISTRIBUTED TRACING] Started span: ${operationName} (${spanId}) in trace ${traceId}`);
    return span;
  }

  /**
   * Finish a span
   */
  finishSpan(spanId: string, status: 'success' | 'error' = 'success', error?: Error): void {
    const span = this.spans.get(spanId);
    if (!span) {
      console.warn(`[DISTRIBUTED TRACING] Span not found: ${spanId}`);
      return;
    }

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;

    if (error) {
      span.tags['error'] = true;
      span.tags['error.message'] = error.message;
      span.tags['error.stack'] = error.stack;
      
      this.logToSpan(spanId, 'error', `Operation failed: ${error.message}`, {
        error: error.message,
        stack: error.stack
      });
    }

    console.log(`[DISTRIBUTED TRACING] Finished span: ${span.operationName} (${spanId}) - ${status} in ${span.duration}ms`);
    
    // Clean up active span tracking
    for (const [correlationId, activeSpanId] of this.activeSpans) {
      if (activeSpanId === spanId) {
        this.activeSpans.delete(correlationId);
        break;
      }
    }
  }

  /**
   * Add a log entry to a span
   */
  logToSpan(
    spanId: string,
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    fields?: Record<string, any>
  ): void {
    const span = this.spans.get(spanId);
    if (!span) {
      return;
    }

    span.logs.push({
      timestamp: Date.now(),
      level,
      message,
      fields
    });
  }

  /**
   * Add tags to a span
   */
  setSpanTags(spanId: string, tags: Record<string, any>): void {
    const span = this.spans.get(spanId);
    if (!span) {
      return;
    }

    span.tags = { ...span.tags, ...tags };
  }

  /**
   * Get a span by ID
   */
  getSpan(spanId: string): TraceSpan | undefined {
    return this.spans.get(spanId);
  }

  /**
   * Get all spans for a trace
   */
  getTrace(traceId: string): TraceSpan[] {
    return Array.from(this.spans.values())
      .filter(span => span.traceId === traceId)
      .sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * Create trace context for propagation
   */
  createTraceContext(span: TraceSpan, baggage?: Record<string, any>): TraceContext {
    return {
      traceId: span.traceId,
      spanId: span.spanId,
      baggage
    };
  }

  /**
   * Extract trace context from headers
   */
  extractTraceContext(headers: Record<string, string>): TraceContext | undefined {
    const traceId = headers['x-trace-id'];
    const spanId = headers['x-span-id'];
    const parentSpanId = headers['x-parent-span-id'];

    if (!traceId || !spanId) {
      return undefined;
    }

    return {
      traceId,
      spanId: parentSpanId || spanId,
      parentSpanId
    };
  }

  /**
   * Inject trace context into headers
   */
  injectTraceContext(context: TraceContext): Record<string, string> {
    const headers: Record<string, string> = {
      'x-trace-id': context.traceId,
      'x-span-id': context.spanId
    };

    if (context.parentSpanId) {
      headers['x-parent-span-id'] = context.parentSpanId;
    }

    return headers;
  }

  /**
   * Track active span for correlation ID
   */
  setActiveSpan(correlationId: string, spanId: string): void {
    this.activeSpans.set(correlationId, spanId);
  }

  /**
   * Get active span for correlation ID
   */
  getActiveSpan(correlationId: string): TraceSpan | undefined {
    const spanId = this.activeSpans.get(correlationId);
    return spanId ? this.spans.get(spanId) : undefined;
  }

  /**
   * Trace a function execution
   */
  async traceFunction<T>(
    operationName: string,
    fn: (span: TraceSpan) => Promise<T>,
    parentContext?: TraceContext,
    tags?: Record<string, any>
  ): Promise<T> {
    const span = this.startSpan(operationName, parentContext, tags);
    
    try {
      const result = await fn(span);
      this.finishSpan(span.spanId, 'success');
      return result;
    } catch (error) {
      this.finishSpan(span.spanId, 'error', error as Error);
      throw error;
    }
  }

  /**
   * Get tracing statistics
   */
  getStats(): {
    totalSpans: number;
    activeSpans: number;
    completedSpans: number;
    errorSpans: number;
    traces: number;
    averageDuration: number;
  } {
    const spans = Array.from(this.spans.values());
    const completedSpans = spans.filter(s => s.status !== 'pending');
    const errorSpans = spans.filter(s => s.status === 'error');
    const uniqueTraces = new Set(spans.map(s => s.traceId));
    
    const totalDuration = completedSpans.reduce((sum, span) => sum + (span.duration || 0), 0);
    const averageDuration = completedSpans.length > 0 ? totalDuration / completedSpans.length : 0;

    return {
      totalSpans: spans.length,
      activeSpans: spans.filter(s => s.status === 'pending').length,
      completedSpans: completedSpans.length,
      errorSpans: errorSpans.length,
      traces: uniqueTraces.size,
      averageDuration: Math.round(averageDuration)
    };
  }

  /**
   * Clean up old completed spans
   */
  cleanup(maxAge: number = 60 * 60 * 1000): number { // 1 hour default
    const cutoff = Date.now() - maxAge;
    let cleaned = 0;

    for (const [spanId, span] of this.spans) {
      if (span.endTime && span.endTime < cutoff) {
        this.spans.delete(spanId);
        cleaned++;
      }
    }

    console.log(`[DISTRIBUTED TRACING] Cleaned up ${cleaned} old spans`);
    return cleaned;
  }

  /**
   * Export spans in a format suitable for external tracing systems
   */
  exportSpans(traceId?: string): TraceSpan[] {
    let spans = Array.from(this.spans.values());
    
    if (traceId) {
      spans = spans.filter(span => span.traceId === traceId);
    }

    return spans.map(span => ({ ...span })); // Return copies
  }
}