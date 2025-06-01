/**
 * Structured logging with correlation ID support
 */

import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  correlationId?: string;
  userId?: string;
  courseId?: string;
  assignmentId?: string;
  service?: string;
  method?: string;
  duration?: number;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  correlationId: string;
  context: LogContext;
  error?: Error;
}

export class Logger {
  private static instance: Logger;
  private serviceName: string;

  private constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  static getInstance(serviceName: string = 'scribe-tree'): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(serviceName);
    }
    return Logger.instance;
  }

  /**
   * Extract correlation ID from various sources
   */
  static getCorrelationId(source?: Request | LogContext | string): string {
    if (typeof source === 'string') {
      return source;
    }
    
    if (source && typeof source === 'object') {
      // From Express request
      if ('headers' in source) {
        return (source.headers['x-correlation-id'] as string) || 
               (source.headers['x-request-id'] as string) ||
               uuidv4();
      }
      
      // From LogContext
      if ('correlationId' in source && source.correlationId) {
        return source.correlationId;
      }
    }
    
    return uuidv4();
  }

  /**
   * Create a child logger with specific context
   */
  child(context: LogContext): BoundLogger {
    return new BoundLogger(this, context);
  }

  /**
   * Log methods
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | LogContext, context?: LogContext): void {
    if (error instanceof Error) {
      this.log('error', message, context, error);
    } else {
      this.log('error', message, error);
    }
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      correlationId: Logger.getCorrelationId(context),
      context: {
        service: this.serviceName,
        ...context
      }
    };

    if (error) {
      entry.error = error;
      entry.context.errorMessage = error.message;
      entry.context.errorStack = error.stack;
    }

    // In production, this would send to a logging service
    // For now, format for console
    this.writeLog(entry);
  }

  /**
   * Write log entry to output
   */
  private writeLog(entry: LogEntry): void {
    const { timestamp, level, message, correlationId, context, error } = entry;
    
    // Structured format for parsing
    const structured = {
      timestamp: timestamp.toISOString(),
      level,
      correlationId,
      service: context.service,
      message,
      ...context
    };

    // Remove service from context to avoid duplication
    delete structured.service;

    switch (level) {
      case 'debug':
        console.debug(JSON.stringify(structured));
        break;
      case 'info':
        console.info(JSON.stringify(structured));
        break;
      case 'warn':
        console.warn(JSON.stringify(structured));
        break;
      case 'error':
        console.error(JSON.stringify(structured));
        if (error) {
          console.error(error);
        }
        break;
    }
  }

  /**
   * Create middleware for Express to add correlation IDs
   */
  static expressMiddleware() {
    return (req: Request & { correlationId?: string }, res: any, next: any) => {
      const correlationId = Logger.getCorrelationId(req);
      req.correlationId = correlationId;
      res.setHeader('X-Correlation-ID', correlationId);
      next();
    };
  }
}

/**
 * Bound logger with preset context
 */
export class BoundLogger {
  constructor(
    private parent: Logger,
    private boundContext: LogContext
  ) {}

  debug(message: string, context?: LogContext): void {
    this.parent.debug(message, { ...this.boundContext, ...context });
  }

  info(message: string, context?: LogContext): void {
    this.parent.info(message, { ...this.boundContext, ...context });
  }

  warn(message: string, context?: LogContext): void {
    this.parent.warn(message, { ...this.boundContext, ...context });
  }

  error(message: string, error?: Error | LogContext, context?: LogContext): void {
    if (error instanceof Error) {
      this.parent.error(message, error, { ...this.boundContext, ...context });
    } else {
      this.parent.error(message, { ...this.boundContext, ...error });
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();