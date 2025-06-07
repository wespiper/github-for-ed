/**
 * High-Performance Privacy-Aware Cache Service
 * 
 * Updated to use optimized privacy operations for sub-200ms response times
 */

import { CacheService, CacheOptions, CacheKeyBuilder, CacheTTL } from './CacheService';
import { OptimizedEncryption, OptimizedAnonymization } from '../privacy/operations/OptimizedEncryption';
import { OptimizedConsentEngine, ConsentPurpose } from '../privacy/consent/OptimizedConsentEngine';
import { getEventBus } from '../events/EventBus';
import { EventTypes } from '../events/events';
import { performance } from 'perf_hooks';

export interface OptimizedPrivacyCacheOptions extends CacheOptions {
  privacyLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  userId?: string;
  purpose: string;
  requiresConsent: boolean;
  anonymizationLevel?: 'none' | 'pseudonymization' | 'anonymization' | 'differential_privacy';
  auditAccess: boolean;
  educationalPurpose?: string;
}

export interface CacheAccessAudit {
  operation: 'get' | 'set' | 'delete';
  key: string;
  privacyLevel: string;
  timestamp: Date;
  accessorId: string;
  success: boolean;
  duration: number;
  dataType?: string;
  consentVerified?: boolean;
}

/**
 * High-performance privacy-enhanced cache service
 * 
 * Features:
 * - <5ms encryption/decryption operations
 * - <2ms consent verification
 * - Batch operations support
 * - Intelligent privacy-aware caching
 * - Zero-PII cache keys
 */
export class OptimizedPrivacyCacheService {
  private baseCache: CacheService;
  private eventBus = getEventBus();
  private consentEngine: OptimizedConsentEngine;
  private encryptionPassword: string;
  
  // Performance tracking
  private stats = {
    operations: 0,
    totalTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    consentChecks: 0,
    encryptionOps: 0
  };

  constructor(
    baseCache: CacheService, 
    consentEngine: OptimizedConsentEngine,
    encryptionPassword: string = process.env.CACHE_ENCRYPTION_KEY || 'default-dev-key'
  ) {
    this.baseCache = baseCache;
    this.consentEngine = consentEngine;
    this.encryptionPassword = encryptionPassword;
  }

  /**
   * High-performance cache get with privacy controls
   * Target: <20ms including consent check and decryption
   */
  async get<T>(
    key: string, 
    options: Partial<OptimizedPrivacyCacheOptions> = {},
    accessorId: string = 'system'
  ): Promise<T | null> {
    const operationStart = performance.now();
    
    try {
      this.stats.operations++;

      // Fast consent verification (target: <2ms)
      if (options.requiresConsent && options.userId && options.purpose) {
        const consentStart = performance.now();
        
        const consentPurpose = this.mapPurposeToConsentPurpose(options.purpose);
        const consentAllowed = this.consentEngine.checkConsent(options.userId, consentPurpose);
        
        const consentDuration = performance.now() - consentStart;
        this.stats.consentChecks++;
        
        if (!consentAllowed) {
          console.warn(`Cache access denied for ${key}: Consent not granted for ${options.purpose}`);
          await this.auditAccess('get', key, options, accessorId, false, performance.now() - operationStart, false);
          return null;
        }
      }

      // Generate privacy-safe cache key
      const privacyKey = this.generatePrivacySafeKey(key, options);
      
      // Get from base cache
      const cacheStart = performance.now();
      const cachedValue = await this.baseCache.get<any>(privacyKey);
      const cacheDuration = performance.now() - cacheStart;

      if (!cachedValue) {
        this.stats.cacheMisses++;
        await this.auditAccess('get', key, options, accessorId, true, performance.now() - operationStart);
        return null;
      }

      this.stats.cacheHits++;

      // Decrypt if encrypted (target: <5ms)
      let finalValue = cachedValue;
      if (this.isEncryptedValue(cachedValue)) {
        const decryptStart = performance.now();
        
        try {
          const decrypted = await OptimizedEncryption.decrypt(
            cachedValue.data.encrypted,
            cachedValue.data.iv,
            cachedValue.data.tag,
            cachedValue.data.salt,
            this.encryptionPassword
          );
          
          finalValue = JSON.parse(decrypted.decrypted);
          this.stats.encryptionOps++;
          
          const decryptDuration = performance.now() - decryptStart;
          console.log(`Cache decryption: ${decryptDuration.toFixed(2)}ms`);
          
        } catch (error) {
          console.error('Failed to decrypt cached value:', error);
          return null;
        }
      }

      // Log privacy event for sensitive data access
      if (options.privacyLevel === 'confidential' || options.privacyLevel === 'restricted') {
        await this.logPrivacyEvent('cache-access', options, accessorId);
      }

      const totalDuration = performance.now() - operationStart;
      await this.auditAccess('get', key, options, accessorId, true, totalDuration, true);

      return finalValue;
      
    } catch (error) {
      const totalDuration = performance.now() - operationStart;
      await this.auditAccess('get', key, options, accessorId, false, totalDuration);
      throw error;
    }
  }

  /**
   * High-performance cache set with privacy controls
   * Target: <25ms including consent check and encryption
   */
  async set<T>(
    key: string, 
    value: T, 
    options: OptimizedPrivacyCacheOptions,
    accessorId: string = 'system'
  ): Promise<void> {
    const operationStart = performance.now();
    
    try {
      this.stats.operations++;

      // Fast consent verification
      if (options.requiresConsent && options.userId) {
        const consentPurpose = this.mapPurposeToConsentPurpose(options.purpose);
        const consentAllowed = this.consentEngine.checkConsent(options.userId, consentPurpose);
        
        if (!consentAllowed) {
          console.warn(`Cache write denied for ${key}: Consent not granted`);
          return;
        }
      }

      // Determine TTL based on privacy level
      const ttl = this.getPrivacyBasedTTL(options.privacyLevel, options.requiresConsent);
      
      // Prepare final options
      const finalOptions: CacheOptions = {
        ttl,
        namespace: options.namespace
      };

      let finalValue: any = value;

      // Fast anonymization if required (target: <3ms)
      if (options.anonymizationLevel && options.anonymizationLevel !== 'none' && options.userId) {
        const anonymizeStart = performance.now();
        
        if (options.anonymizationLevel === 'anonymization') {
          finalValue = this.anonymizeValue(value, options.userId);
        } else if (options.anonymizationLevel === 'pseudonymization') {
          finalValue = this.pseudonymizeValue(value, options.userId);
        }
        
        const anonymizeDuration = performance.now() - anonymizeStart;
        console.log(`Cache anonymization: ${anonymizeDuration.toFixed(2)}ms`);
      }

      // Fast encryption for sensitive data (target: <10ms)
      if (options.privacyLevel === 'confidential' || options.privacyLevel === 'restricted') {
        const encryptStart = performance.now();
        
        const encrypted = await OptimizedEncryption.encrypt(
          JSON.stringify(finalValue), 
          this.encryptionPassword
        );
        
        finalValue = {
          encrypted: true,
          algorithm: 'aes-256-gcm',
          data: encrypted,
          timestamp: new Date().toISOString(),
          privacyLevel: options.privacyLevel
        };
        
        this.stats.encryptionOps++;
        
        const encryptDuration = performance.now() - encryptStart;
        console.log(`Cache encryption: ${encryptDuration.toFixed(2)}ms`);
      }

      // Generate privacy-safe cache key
      const privacyKey = this.generatePrivacySafeKey(key, options);

      // Store in base cache
      await this.baseCache.set(privacyKey, finalValue, finalOptions);

      // Log privacy event for sensitive data storage
      if (options.privacyLevel === 'confidential' || options.privacyLevel === 'restricted') {
        await this.logPrivacyEvent('cache-storage', options, accessorId, ttl);
      }

      const totalDuration = performance.now() - operationStart;
      await this.auditAccess('set', key, options, accessorId, true, totalDuration, true);
      
    } catch (error) {
      const totalDuration = performance.now() - operationStart;
      await this.auditAccess('set', key, options, accessorId, false, totalDuration);
      throw error;
    }
  }

  /**
   * Batch cache operations for high throughput
   */
  async setBatch<T>(
    items: Array<{
      key: string;
      value: T;
      options: OptimizedPrivacyCacheOptions;
    }>,
    accessorId: string = 'system'
  ): Promise<void> {
    const operationStart = performance.now();
    
    try {
      // Batch consent checks for efficiency
      const userPurposes = items
        .filter(item => item.options.requiresConsent && item.options.userId)
        .map(item => ({
          userId: item.options.userId!,
          purpose: this.mapPurposeToConsentPurpose(item.options.purpose)
        }));

      const consentResults = this.consentEngine.checkConsentBatch(userPurposes);
      
      // Process items in parallel where possible
      const setPromises = items.map(async (item, index) => {
        // Skip if consent was checked and denied
        if (item.options.requiresConsent && item.options.userId) {
          const consentIndex = userPurposes.findIndex(up => up.userId === item.options.userId);
          if (consentIndex >= 0 && !consentResults[consentIndex]) {
            return;
          }
        }
        
        return this.set(item.key, item.value, item.options, accessorId);
      });

      await Promise.all(setPromises);
      
      const totalDuration = performance.now() - operationStart;
      console.log(`Batch cache set: ${items.length} items in ${totalDuration.toFixed(2)}ms`);
      
    } catch (error) {
      console.error('Batch cache set failed:', error);
      throw error;
    }
  }

  /**
   * Delete with audit trail
   */
  async delete(
    key: string, 
    options: Partial<OptimizedPrivacyCacheOptions> = {},
    accessorId: string = 'system'
  ): Promise<boolean> {
    const operationStart = performance.now();
    
    try {
      const privacyKey = this.generatePrivacySafeKey(key, options);
      const result = await this.baseCache.delete(privacyKey);
      
      const totalDuration = performance.now() - operationStart;
      await this.auditAccess('delete', key, options, accessorId, true, totalDuration);

      return result;
    } catch (error) {
      const totalDuration = performance.now() - operationStart;
      await this.auditAccess('delete', key, options, accessorId, false, totalDuration);
      throw error;
    }
  }

  /**
   * High-performance consent-based cache invalidation
   */
  async invalidateUserCache(userId: string, reason: string = 'consent-change'): Promise<void> {
    const operationStart = performance.now();
    
    // Use anonymized user ID for cache key patterns
    const userHash = OptimizedAnonymization.anonymize(userId, 'user');
    
    const patterns = [
      `privacy:*:${userHash}:*`,
      `user:*:${userHash}:*`,
      `consent:${userHash}:*`
    ];

    let totalDeleted = 0;
    for (const pattern of patterns) {
      const deleted = await this.baseCache.deletePattern?.(pattern) || 0;
      totalDeleted += deleted;
    }

    // Invalidate consent cache for this user
    this.consentEngine.updateUserConsent(userId, {});

    // Log privacy event
    await this.eventBus.publish({
      type: EventTypes.DATA_RETENTION_ACTION,
      correlationId: this.generateCorrelationId(),
      timestamp: new Date(),
      payload: {
        action: 'delete',
        dataType: 'user-cache-data',
        reason,
        recordCount: totalDeleted,
        executionTimestamp: new Date(),
        verificationRequired: false,
        irreversible: true
      },
      metadata: {
        source: 'optimized-privacy-cache-service'
      }
    });

    const duration = performance.now() - operationStart;
    console.log(`User cache invalidation: ${totalDeleted} items in ${duration.toFixed(2)}ms`);
  }

  /**
   * Generate privacy-safe cache key (no PII)
   */
  private generatePrivacySafeKey(originalKey: string, options: Partial<OptimizedPrivacyCacheOptions>): string {
    const privacyLevel = options.privacyLevel || 'public';
    const purpose = options.purpose || 'general';
    
    // Anonymize user ID if present
    const userContext = options.userId ? 
      OptimizedAnonymization.anonymize(options.userId, 'user') : 
      'anonymous';
    
    // Create privacy-safe key structure
    return `privacy:${privacyLevel}:${userContext}:${purpose}:${this.hashKey(originalKey)}`;
  }

  /**
   * Fast key hashing
   */
  private hashKey(key: string): string {
    return OptimizedAnonymization.anonymize(key, 'cache-key');
  }

  /**
   * Map purpose to consent purpose enum
   */
  private mapPurposeToConsentPurpose(purpose: string): ConsentPurpose {
    switch (purpose.toLowerCase()) {
      case 'analytics': return ConsentPurpose.ANALYTICS;
      case 'educational': return ConsentPurpose.EDUCATIONAL;
      case 'improvement': return ConsentPurpose.IMPROVEMENT;
      case 'research': return ConsentPurpose.RESEARCH;
      default: return ConsentPurpose.NECESSARY;
    }
  }

  /**
   * Get privacy-based TTL with optimized defaults
   */
  private getPrivacyBasedTTL(privacyLevel: string, requiresConsent: boolean): number {
    switch (privacyLevel) {
      case 'public':
        return OptimizedPrivacyCacheTTL.PUBLIC_EDUCATIONAL;

      case 'internal':
        return requiresConsent ? 
          OptimizedPrivacyCacheTTL.USER_CONSENTED : 
          OptimizedPrivacyCacheTTL.USER_SESSION;

      case 'confidential':
        return requiresConsent ? 
          OptimizedPrivacyCacheTTL.SENSITIVE_CONSENTED : 
          OptimizedPrivacyCacheTTL.SENSITIVE_MINIMAL;

      case 'restricted':
        return OptimizedPrivacyCacheTTL.SENSITIVE_MINIMAL;

      default:
        return CacheTTL.WRITING_SESSION;
    }
  }

  /**
   * Fast anonymization using optimized operations
   */
  private anonymizeValue<T>(value: T, userId: string): T {
    if (typeof value !== 'object' || value === null) {
      return value;
    }

    const anonymized = { ...value } as any;
    
    // Use optimized anonymization for sensitive fields
    const sensitiveFields = ['userId', 'studentId', 'email', 'fullName', 'personalInfo'];
    sensitiveFields.forEach(field => {
      if (anonymized[field]) {
        anonymized[`${field}Hash`] = OptimizedAnonymization.anonymize(
          anonymized[field], 
          field
        );
        delete anonymized[field];
      }
    });

    return anonymized;
  }

  /**
   * Fast pseudonymization using optimized operations
   */
  private pseudonymizeValue<T>(value: T, userId: string): T {
    if (typeof value !== 'object' || value === null) {
      return value;
    }

    const pseudonymized = { ...value } as any;
    
    // Use optimized pseudonymization
    if (pseudonymized.userId) {
      pseudonymized.userPseudonym = OptimizedAnonymization.pseudonymize(
        pseudonymized.userId, 
        'user'
      );
      delete pseudonymized.userId;
    }

    return pseudonymized;
  }

  /**
   * Check if value is encrypted
   */
  private isEncryptedValue(value: any): boolean {
    return value && 
           typeof value === 'object' && 
           value.encrypted === true && 
           value.data && 
           value.data.encrypted;
  }

  /**
   * Log privacy event
   */
  private async logPrivacyEvent(
    eventType: string, 
    options: Partial<OptimizedPrivacyCacheOptions>, 
    accessorId: string,
    ttl?: number
  ): Promise<void> {
    await this.eventBus.publish({
      type: EventTypes.DATA_ACCESS_AUDITED,
      correlationId: this.generateCorrelationId(),
      timestamp: new Date(),
      payload: {
        accessorId,
        dataType: 'cached-privacy-data',
        purpose: eventType,
        educationalJustification: options.educationalPurpose || 'Educational data caching',
        accessTimestamp: new Date(),
        dataScope: {
          recordCount: 1
        },
        retentionSchedule: ttl ? new Date(Date.now() + (ttl * 1000)) : undefined
      },
      metadata: {
        source: 'optimized-privacy-cache-service',
        privacyLevel: options.privacyLevel
      }
    });
  }

  /**
   * Optimized audit access logging
   */
  private async auditAccess(
    operation: 'get' | 'set' | 'delete',
    key: string,
    options: Partial<OptimizedPrivacyCacheOptions>,
    accessorId: string,
    success: boolean,
    duration: number,
    consentVerified?: boolean
  ): Promise<void> {
    if (options.auditAccess === false) return;

    const audit: CacheAccessAudit = {
      operation,
      key: this.hashKey(key), // Use hashed key for audit (no PII)
      privacyLevel: options.privacyLevel || 'public',
      timestamp: new Date(),
      accessorId,
      success,
      duration,
      dataType: this.inferDataTypeFromKey(key),
      consentVerified
    };

    // In production, this would go to an optimized audit log system
    console.log(`Optimized Cache Audit: ${JSON.stringify(audit)}`);
  }

  /**
   * Infer data type from cache key (privacy-safe)
   */
  private inferDataTypeFromKey(key: string): string {
    if (key.includes('student')) return 'student-data';
    if (key.includes('ai')) return 'ai-interaction';
    if (key.includes('writing')) return 'writing-data';
    if (key.includes('reflection')) return 'reflection-data';
    if (key.includes('assessment')) return 'assessment-data';
    if (key.includes('analytics')) return 'analytics-data';
    return 'general-data';
  }

  /**
   * Generate correlation ID for events
   */
  private generateCorrelationId(): string {
    return `opt-cache-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    operations: number;
    averageTime: number;
    cacheHitRate: number;
    consentChecks: number;
    encryptionOperations: number;
  } {
    return {
      operations: this.stats.operations,
      averageTime: this.stats.operations > 0 ? this.stats.totalTime / this.stats.operations : 0,
      cacheHitRate: this.stats.operations > 0 ? 
        (this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses)) * 100 : 0,
      consentChecks: this.stats.consentChecks,
      encryptionOperations: this.stats.encryptionOps
    };
  }
}

/**
 * Optimized privacy-aware cache key builder
 */
export class OptimizedPrivacyCacheKeyBuilder {
  /**
   * Build privacy-safe student profile key
   */
  static studentProfile(userId: string, privacyLevel: string = 'internal'): string {
    const userHash = OptimizedAnonymization.anonymize(userId, 'user');
    return `student:${privacyLevel}:${userHash}:profile`;
  }

  /**
   * Build privacy-safe learning state key
   */
  static learningState(userId: string, courseId: string): string {
    const userHash = OptimizedAnonymization.anonymize(userId, 'user');
    const courseHash = OptimizedAnonymization.anonymize(courseId, 'course');
    return `learning:internal:${userHash}:${courseHash}:state`;
  }

  /**
   * Build privacy-safe AI interaction key
   */
  static aiInteraction(userId: string, sessionId: string): string {
    const userHash = OptimizedAnonymization.anonymize(userId, 'user');
    const sessionHash = OptimizedAnonymization.anonymize(sessionId, 'session');
    return `ai:confidential:${userHash}:${sessionHash}:interactions`;
  }

  /**
   * Build anonymized analytics key
   */
  static anonymizedAnalytics(metricType: string, timeWindow: string): string {
    return `analytics:public:anonymous:${metricType}:${timeWindow}`;
  }

  /**
   * Build consent status key
   */
  static consentStatus(userId: string): string {
    const userHash = OptimizedAnonymization.anonymize(userId, 'user');
    return `consent:internal:${userHash}:status`;
  }
}

/**
 * Optimized privacy-aware TTL strategies
 */
export const OptimizedPrivacyCacheTTL = {
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