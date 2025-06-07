/**
 * Privacy-Aware Cache Service for Educational Data Protection
 */

import { CacheService, CacheOptions, CacheKeyBuilder, CacheTTL } from './CacheService';
import { PrivacyEventUtils } from '../events/EventBus';
import { getEventBus } from '../events/EventBus';
import { EventTypes } from '../events/events';

export interface PrivacyCacheOptions extends CacheOptions {
  privacyLevel: 'public' | 'user-specific' | 'sensitive';
  studentConsent: boolean;
  anonymize: boolean;
  auditAccess: boolean;
  studentIdHash?: string;
  educationalPurpose?: string;
}

export interface CacheAccessAudit {
  operation: 'get' | 'set' | 'delete';
  key: string;
  privacyLevel: string;
  timestamp: Date;
  accessorId: string;
  success: boolean;
  dataType?: string;
}

/**
 * Privacy-enhanced cache service wrapper
 */
export class PrivacyCacheService {
  private baseCache: CacheService;
  private eventBus = getEventBus();

  constructor(baseCache: CacheService) {
    this.baseCache = baseCache;
  }

  /**
   * Get value with privacy controls and audit trail
   */
  async get<T>(
    key: string, 
    options: Partial<PrivacyCacheOptions> = {},
    accessorId: string = 'system'
  ): Promise<T | null> {
    try {
      // Audit the access attempt
      if (options.auditAccess !== false) {
        await this.auditAccess('get', key, options, accessorId, true);
      }

      // Check consent for user-specific data
      if (options.privacyLevel === 'user-specific' || options.privacyLevel === 'sensitive') {
        if (!options.studentConsent) {
          console.warn(`Cache access denied for ${key}: No student consent`);
          return null;
        }
      }

      // Get from base cache
      const value = await this.baseCache.get<T>(key);

      // Log privacy event for sensitive data access
      if (value && options.privacyLevel === 'sensitive') {
        await this.eventBus.publish({
          type: EventTypes.DATA_ACCESS_AUDITED,
          correlationId: this.generateCorrelationId(),
          timestamp: new Date(),
          payload: {
            accessorId,
            dataType: 'cached-sensitive-data',
            purpose: 'cache-retrieval',
            educationalJustification: options.educationalPurpose || 'Educational data access',
            accessTimestamp: new Date(),
            dataScope: {
              recordCount: 1
            }
          },
          metadata: {
            source: 'privacy-cache-service'
          }
        });
      }

      return value;
    } catch (error) {
      await this.auditAccess('get', key, options, accessorId, false);
      throw error;
    }
  }

  /**
   * Set value with privacy-based TTL and encryption
   */
  async set<T>(
    key: string, 
    value: T, 
    options: PrivacyCacheOptions,
    accessorId: string = 'system'
  ): Promise<void> {
    try {
      // Determine TTL based on privacy level
      const ttl = this.getPrivacyBasedTTL(options.privacyLevel, options.studentConsent);
      
      // Prepare final options
      const finalOptions: CacheOptions = {
        ttl,
        namespace: options.namespace
      };

      let finalValue = value;

      // Anonymize if required
      if (options.anonymize && options.studentIdHash) {
        finalValue = this.anonymizeValue(value, options.studentIdHash);
      }

      // Encrypt sensitive data
      if (options.privacyLevel === 'sensitive') {
        const encryptedValue = this.encryptSensitiveValue(finalValue);
        finalValue = encryptedValue as T;
      }

      // Store in base cache
      await this.baseCache.set(key, finalValue, finalOptions);

      // Audit the operation
      if (options.auditAccess !== false) {
        await this.auditAccess('set', key, options, accessorId, true);
      }

      // Log privacy event for sensitive data storage
      if (options.privacyLevel === 'sensitive') {
        await this.eventBus.publish({
          type: EventTypes.DATA_ACCESS_AUDITED,
          correlationId: this.generateCorrelationId(),
          timestamp: new Date(),
          payload: {
            accessorId,
            dataType: 'cached-sensitive-data',
            purpose: 'cache-storage',
            educationalJustification: options.educationalPurpose || 'Educational data caching',
            accessTimestamp: new Date(),
            dataScope: {
              recordCount: 1
            },
            retentionSchedule: new Date(Date.now() + (ttl * 1000))
          },
          metadata: {
            source: 'privacy-cache-service'
          }
        });
      }
    } catch (error) {
      await this.auditAccess('set', key, options, accessorId, false);
      throw error;
    }
  }

  /**
   * Delete with audit trail
   */
  async delete(
    key: string, 
    options: Partial<PrivacyCacheOptions> = {},
    accessorId: string = 'system'
  ): Promise<boolean> {
    try {
      const result = await this.baseCache.delete(key);
      
      if (options.auditAccess !== false) {
        await this.auditAccess('delete', key, options, accessorId, true);
      }

      return result;
    } catch (error) {
      await this.auditAccess('delete', key, options, accessorId, false);
      throw error;
    }
  }

  /**
   * Invalidate student-specific cache on consent withdrawal
   */
  async invalidateStudentCache(studentIdHash: string, reason: string = 'consent-withdrawal'): Promise<void> {
    const patterns = [
      `student:*${studentIdHash}*`,
      `ai:*${studentIdHash}*`,
      `writing:*${studentIdHash}*`,
      `reflection:*${studentIdHash}*`,
      `assessment:*${studentIdHash}*`
    ];

    let totalDeleted = 0;
    for (const pattern of patterns) {
      const deleted = await this.baseCache.deletePattern(pattern);
      totalDeleted += deleted;
    }

    // Log privacy event
    await this.eventBus.publish({
      type: EventTypes.DATA_RETENTION_ACTION,
      correlationId: this.generateCorrelationId(),
      timestamp: new Date(),
      payload: {
        action: 'delete',
        dataType: 'student-cache-data',
        reason,
        recordCount: totalDeleted,
        executionTimestamp: new Date(),
        verificationRequired: false,
        irreversible: true
      },
      metadata: {
        source: 'privacy-cache-service'
      }
    });
  }

  /**
   * Get privacy-based TTL
   */
  private getPrivacyBasedTTL(privacyLevel: string, studentConsent: boolean): number {
    switch (privacyLevel) {
      case 'public':
        return CacheTTL.COURSE_ANALYTICS; // 24 hours

      case 'user-specific':
        return studentConsent ? CacheTTL.STUDENT_STATE : CacheTTL.WRITING_SESSION; // 30 min or 5 min

      case 'sensitive':
        return studentConsent ? CacheTTL.AI_INTERACTION : CacheTTL.COGNITIVE_LOAD; // 10 min or 1 min

      default:
        return CacheTTL.WRITING_SESSION; // 5 minutes default
    }
  }

  /**
   * Anonymize value by removing/hashing sensitive fields
   */
  private anonymizeValue<T>(value: T, studentIdHash: string): T {
    if (typeof value !== 'object' || value === null) {
      return value;
    }

    const anonymized = { ...value } as any;
    
    // Replace any studentId with hash
    if (anonymized.studentId) {
      anonymized.studentIdHash = studentIdHash;
      delete anonymized.studentId;
    }

    // Remove other sensitive fields
    const sensitiveFields = ['email', 'fullName', 'personalInfo', 'ipAddress'];
    sensitiveFields.forEach(field => {
      if (anonymized[field]) {
        delete anonymized[field];
      }
    });

    return anonymized;
  }

  /**
   * Encrypt sensitive cache values using AES-256-CBC
   */
  private encryptSensitiveValue<T>(value: T): any {
    try {
      const encrypted = PrivacyEventUtils.encryptPayload(value as Record<string, any>);
      return {
        encrypted: true,
        algorithm: 'aes-256-cbc',
        data: encrypted,
        timestamp: new Date().toISOString(),
        keyDerivation: 'scrypt'
      };
    } catch (error) {
      console.error('Failed to encrypt sensitive cache value:', error);
      return value;
    }
  }

  /**
   * Audit cache access
   */
  private async auditAccess(
    operation: 'get' | 'set' | 'delete',
    key: string,
    options: Partial<PrivacyCacheOptions>,
    accessorId: string,
    success: boolean
  ): Promise<void> {
    const audit: CacheAccessAudit = {
      operation,
      key,
      privacyLevel: options.privacyLevel || 'public',
      timestamp: new Date(),
      accessorId,
      success,
      dataType: this.inferDataTypeFromKey(key)
    };

    // In a production system, this would go to an audit log
    console.log(`Cache Audit: ${JSON.stringify(audit)}`);
  }

  /**
   * Infer data type from cache key
   */
  private inferDataTypeFromKey(key: string): string {
    if (key.includes('student')) return 'student-data';
    if (key.includes('ai')) return 'ai-interaction';
    if (key.includes('writing')) return 'writing-data';
    if (key.includes('reflection')) return 'reflection-data';
    if (key.includes('assessment')) return 'assessment-data';
    return 'general-data';
  }

  /**
   * Generate correlation ID for events
   */
  private generateCorrelationId(): string {
    return `cache-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Privacy-enhanced cache key builder
 */
export class PrivacyCacheKeyBuilder extends CacheKeyBuilder {
  /**
   * Build cache key with privacy hash
   */
  static studentProfilePrivacy(studentIdHash: string): string {
    return `student:${studentIdHash}:profile:privacy`;
  }

  static studentLearningStatePrivacy(studentIdHash: string, courseId: string): string {
    return `student:${studentIdHash}:course:${courseId}:state:privacy`;
  }

  static aiInteractionsPrivacy(studentIdHash: string, sessionId: string): string {
    return `ai:${studentIdHash}:session:${sessionId}:interactions:privacy`;
  }

  static anonymizedAnalytics(metricType: string, timeWindow: string): string {
    return `analytics:anonymous:${metricType}:${timeWindow}`;
  }

  static consentStatus(studentIdHash: string): string {
    return `consent:${studentIdHash}:status`;
  }
}

/**
 * Privacy-aware TTL strategies
 */
export const PrivacyCacheTTL = {
  // Public educational data (long TTL)
  PUBLIC_EDUCATIONAL: 24 * 60 * 60, // 24 hours
  PUBLIC_AGGREGATED: 4 * 60 * 60, // 4 hours

  // User-specific with consent (medium TTL)
  USER_CONSENTED: 60 * 60, // 1 hour
  USER_SESSION: 30 * 60, // 30 minutes

  // Sensitive data (short TTL)
  SENSITIVE_CONSENTED: 15 * 60, // 15 minutes
  SENSITIVE_MINIMAL: 5 * 60, // 5 minutes

  // Anonymous aggregates (longer TTL)
  ANONYMOUS_METRICS: 24 * 60 * 60, // 24 hours
  ANONYMOUS_TRENDS: 12 * 60 * 60, // 12 hours

  // Consent and privacy state
  CONSENT_STATUS: 60 * 60, // 1 hour
  PRIVACY_PREFERENCES: 2 * 60 * 60, // 2 hours
} as const;