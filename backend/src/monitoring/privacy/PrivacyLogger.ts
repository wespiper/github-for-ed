import { PIIDetector } from './PIIDetector';
import { Logger } from '../Logger';
import { PrivacyContext } from '../../types/privacy';

interface PrivacyLogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context: any;
  piiRedacted: boolean;
  originalHasPII: boolean;
  correlationId?: string;
  userId?: string;
  timestamp: Date;
}

interface PrivacyLogConfig {
  enablePIIDetection: boolean;
  enableAutoRedaction: boolean;
  logPIIAttempts: boolean;
  hashUserIds: boolean;
  preserveCorrelationIds: boolean;
  maxLogLength: number;
}

export class PrivacyLogger {
  private static instance: PrivacyLogger;
  private piiDetector: PIIDetector;
  private baseLogger: Logger;
  private config: PrivacyLogConfig;

  private constructor() {
    this.piiDetector = PIIDetector.getInstance();
    this.baseLogger = Logger.getInstance();
    this.config = {
      enablePIIDetection: true,
      enableAutoRedaction: true,
      logPIIAttempts: true,
      hashUserIds: true,
      preserveCorrelationIds: true,
      maxLogLength: 10000
    };
  }

  public static getInstance(): PrivacyLogger {
    if (!PrivacyLogger.instance) {
      PrivacyLogger.instance = new PrivacyLogger();
    }
    return PrivacyLogger.instance;
  }

  public info(message: string, context?: any, privacyContext?: PrivacyContext): void {
    this.logWithPIIProtection('info', message, context, privacyContext);
  }

  public warn(message: string, context?: any, privacyContext?: PrivacyContext): void {
    this.logWithPIIProtection('warn', message, context, privacyContext);
  }

  public error(message: string, context?: any, privacyContext?: PrivacyContext): void {
    this.logWithPIIProtection('error', message, context, privacyContext);
  }

  public debug(message: string, context?: any, privacyContext?: PrivacyContext): void {
    this.logWithPIIProtection('debug', message, context, privacyContext);
  }

  private logWithPIIProtection(
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    context?: any,
    privacyContext?: PrivacyContext
  ): void {
    try {
      // Create sanitized log entry
      const sanitizedEntry = this.createSanitizedLogEntry(
        level,
        message,
        context,
        privacyContext
      );

      // Log using base logger with sanitized content
      this.baseLogger[level](sanitizedEntry.message, {
        ...sanitizedEntry.context,
        pii_protection: {
          redacted: sanitizedEntry.piiRedacted,
          had_pii: sanitizedEntry.originalHasPII,
          correlation_id: sanitizedEntry.correlationId
        }
      });

      // Log PII detection attempts if enabled
      if (this.config.logPIIAttempts && sanitizedEntry.originalHasPII) {
        this.logPIIAttempt(sanitizedEntry, privacyContext);
      }

    } catch (error) {
      // Fallback logging without privacy protection to avoid losing critical errors
      this.baseLogger.error('PRIVACY_LOGGER_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        original_level: level,
        timestamp: new Date().toISOString()
      });
    }
  }

  private createSanitizedLogEntry(
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    context?: any,
    privacyContext?: PrivacyContext
  ): PrivacyLogEntry {
    const timestamp = new Date();
    let sanitizedMessage = message;
    let sanitizedContext = { ...context };
    let piiRedacted = false;
    let originalHasPII = false;

    // Sanitize message
    if (this.config.enablePIIDetection && message) {
      const messageDetection = this.piiDetector.detectAndRedact(message);
      originalHasPII = messageDetection.hasPII;
      
      if (this.config.enableAutoRedaction && messageDetection.hasPII) {
        sanitizedMessage = messageDetection.redactedContent;
        piiRedacted = true;
      }
    }

    // Sanitize context object
    if (this.config.enablePIIDetection && context) {
      const contextSanitization = this.sanitizeObject(context);
      sanitizedContext = contextSanitization.sanitized;
      
      if (contextSanitization.hadPII) {
        originalHasPII = true;
        piiRedacted = piiRedacted || this.config.enableAutoRedaction;
      }
    }

    // Process privacy context
    if (privacyContext) {
      sanitizedContext = this.applyPrivacyContext(sanitizedContext, privacyContext);
    }

    // Truncate if necessary
    if (this.config.maxLogLength > 0) {
      sanitizedMessage = this.truncateContent(sanitizedMessage, this.config.maxLogLength);
    }

    return {
      level,
      message: sanitizedMessage,
      context: sanitizedContext,
      piiRedacted,
      originalHasPII,
      correlationId: privacyContext?.correlationId,
      userId: privacyContext?.userId,
      timestamp
    };
  }

  private sanitizeObject(obj: any): { sanitized: any; hadPII: boolean } {
    if (!obj || typeof obj !== 'object') {
      return { sanitized: obj, hadPII: false };
    }

    let hadPII = false;
    const sanitized: any = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        const detection = this.piiDetector.detectAndRedact(value);
        
        if (detection.hasPII) {
          hadPII = true;
          sanitized[key] = this.config.enableAutoRedaction 
            ? detection.redactedContent 
            : value;
        } else {
          sanitized[key] = value;
        }
      } else if (typeof value === 'object' && value !== null) {
        const nestedResult = this.sanitizeObject(value);
        sanitized[key] = nestedResult.sanitized;
        hadPII = hadPII || nestedResult.hadPII;
      } else {
        sanitized[key] = value;
      }
    }

    return { sanitized, hadPII };
  }

  private applyPrivacyContext(context: any, privacyContext: PrivacyContext): any {
    const result = { ...context };

    // Hash user IDs if configured
    if (this.config.hashUserIds && privacyContext.userId) {
      result.user_id_hash = this.hashUserId(privacyContext.userId);
      delete result.userId; // Remove original user ID
    }

    // Add privacy metadata
    result.privacy_context = {
      purpose: privacyContext.purpose,
      data_types: privacyContext.dataTypes,
      retention_category: privacyContext.retentionCategory,
      consent_required: privacyContext.consentRequired
    };

    // Preserve correlation ID if configured
    if (this.config.preserveCorrelationIds && privacyContext.correlationId) {
      result.correlation_id = privacyContext.correlationId;
    }

    return result;
  }

  private hashUserId(userId: string): string {
    // Simple hash implementation - in production, use crypto module
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `user_${Math.abs(hash).toString(16)}`;
  }

  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }
    
    return content.substring(0, maxLength - 20) + '...[TRUNCATED]';
  }

  private logPIIAttempt(logEntry: PrivacyLogEntry, privacyContext?: PrivacyContext): void {
    this.baseLogger.warn('PII_DETECTED_IN_LOG', {
      log_level: logEntry.level,
      detection_timestamp: logEntry.timestamp.toISOString(),
      correlation_id: logEntry.correlationId,
      privacy_purpose: privacyContext?.purpose,
      redaction_applied: logEntry.piiRedacted,
      user_context: privacyContext?.userId ? this.hashUserId(privacyContext.userId) : 'anonymous'
    });
  }

  public logSecurityEvent(
    eventType: 'unauthorized_access' | 'data_breach' | 'privacy_violation' | 'consent_violation',
    details: any,
    privacyContext?: PrivacyContext
  ): void {
    const sanitizedDetails = this.sanitizeObject(details);
    
    this.baseLogger.error('SECURITY_EVENT', {
      event_type: eventType,
      details: sanitizedDetails.sanitized,
      had_pii: sanitizedDetails.hadPII,
      privacy_context: privacyContext,
      timestamp: new Date().toISOString(),
      correlation_id: privacyContext?.correlationId
    });
  }

  public logPrivacyCompliance(
    complianceType: 'gdpr' | 'ferpa' | 'coppa' | 'ccpa',
    action: 'data_access' | 'data_deletion' | 'consent_update' | 'data_export',
    metadata: any,
    privacyContext?: PrivacyContext
  ): void {
    const sanitizedMetadata = this.sanitizeObject(metadata);
    
    this.baseLogger.info('PRIVACY_COMPLIANCE', {
      compliance_type: complianceType,
      action,
      metadata: sanitizedMetadata.sanitized,
      privacy_context: privacyContext,
      timestamp: new Date().toISOString(),
      correlation_id: privacyContext?.correlationId
    });
  }

  public updateConfig(newConfig: Partial<PrivacyLogConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    this.baseLogger.info('PRIVACY_LOGGER_CONFIG_UPDATED', {
      config: this.config,
      timestamp: new Date().toISOString()
    });
  }

  public getLogStats(): {
    totalLogs: number;
    piiDetections: number;
    redactedLogs: number;
    securityEvents: number;
  } {
    // This would be enhanced with actual metrics collection
    return {
      totalLogs: 0, // Placeholder
      piiDetections: 0, // Placeholder
      redactedLogs: 0, // Placeholder
      securityEvents: 0 // Placeholder
    };
  }
}