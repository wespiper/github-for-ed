import { performance } from 'perf_hooks';

/**
 * High-performance consent engine with O(1) lookups and sub-5ms response times
 * 
 * Performance targets:
 * - Consent check: <2ms per operation
 * - Batch checks: 50K checks/second
 * - Cache hit rate: 99% for repeated checks
 * - Memory usage: <50MB for 100K users
 */
export class OptimizedConsentEngine {
  // In-memory consent matrix using bit operations for maximum performance
  private consentMatrix = new Map<string, ConsentBitMask>();
  private consentCache = new Map<string, ConsentResult>();
  private consentTimestamps = new Map<string, number>();
  
  // Pre-computed consent patterns for common operations
  private consentPatterns = new Map<string, number>();
  
  // Performance tracking
  private stats = {
    checks: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageCheckTime: 0,
    matrixSize: 0
  };

  constructor() {
    this.initializeConsentPatterns();
  }

  /**
   * Initialize common consent patterns for fast lookups
   */
  private initializeConsentPatterns(): void {
    // Pre-compute bit masks for common consent combinations
    this.consentPatterns.set('basic_analytics', ConsentPurpose.ANALYTICS | ConsentPurpose.IMPROVEMENT);
    this.consentPatterns.set('educational_insights', ConsentPurpose.EDUCATIONAL | ConsentPurpose.ANALYTICS);
    this.consentPatterns.set('full_platform', ConsentPurpose.ALL);
    this.consentPatterns.set('minimal_privacy', ConsentPurpose.NECESSARY);
  }

  /**
   * O(1) consent checking with bit masking
   */
  checkConsent(userId: string, purpose: ConsentPurpose): boolean {
    const start = performance.now();
    this.stats.checks++;

    try {
      // Check cache first for sub-millisecond performance
      const cacheKey = `${userId}:${purpose}`;
      const cached = this.consentCache.get(cacheKey);
      
      if (cached && this.isCacheValid(cached)) {
        this.stats.cacheHits++;
        return cached.allowed;
      }

      this.stats.cacheMisses++;

      // Get user consent mask
      const userConsent = this.consentMatrix.get(userId);
      if (!userConsent) {
        // Default to necessary operations only for unknown users
        const result = (ConsentPurpose.NECESSARY & purpose) === purpose;
        this.cacheResult(cacheKey, result);
        return result;
      }

      // Perform bit mask operation for O(1) lookup
      const allowed = (userConsent.mask & purpose) === purpose;
      
      // Cache the result
      this.cacheResult(cacheKey, allowed);
      
      return allowed;

    } finally {
      const duration = performance.now() - start;
      this.updateAverageCheckTime(duration);
    }
  }

  /**
   * Batch consent checking for high-throughput operations
   */
  checkConsentBatch(requests: ConsentRequest[]): boolean[] {
    const start = performance.now();
    
    const results = new Array(requests.length);
    
    // Process in chunks for optimal cache performance
    const chunkSize = 100;
    for (let i = 0; i < requests.length; i += chunkSize) {
      const chunk = requests.slice(i, i + chunkSize);
      
      for (let j = 0; j < chunk.length; j++) {
        const request = chunk[j];
        results[i + j] = this.checkConsent(request.userId, request.purpose);
      }
    }
    
    const duration = performance.now() - start;
    console.log(`Batch consent check: ${requests.length} requests in ${duration.toFixed(2)}ms`);
    
    return results;
  }

  /**
   * Pre-compute consent matrix for O(1) lookups
   */
  async precomputeConsentMatrix(users: UserConsentData[]): Promise<void> {
    const start = performance.now();
    
    // Clear existing matrix
    this.consentMatrix.clear();
    this.consentCache.clear();
    
    // Build optimized consent matrix
    for (const user of users) {
      const mask = this.buildConsentMask(user.consents);
      this.consentMatrix.set(user.userId, {
        mask,
        timestamp: user.lastUpdated || Date.now(),
        version: user.version || 1
      });
    }
    
    // Update statistics
    this.stats.matrixSize = this.consentMatrix.size;
    
    const duration = performance.now() - start;
    console.log(`Consent matrix precomputed: ${users.length} users in ${duration.toFixed(2)}ms`);
  }

  /**
   * Build consent bit mask from user consent data
   */
  private buildConsentMask(consents: Record<string, boolean>): number {
    let mask = 0;
    
    // Map consent types to bit positions
    if (consents.analytics) mask |= ConsentPurpose.ANALYTICS;
    if (consents.improvement) mask |= ConsentPurpose.IMPROVEMENT;
    if (consents.educational) mask |= ConsentPurpose.EDUCATIONAL;
    if (consents.research) mask |= ConsentPurpose.RESEARCH;
    if (consents.marketing) mask |= ConsentPurpose.MARKETING;
    if (consents.sharing) mask |= ConsentPurpose.SHARING;
    
    // Always include necessary operations
    mask |= ConsentPurpose.NECESSARY;
    
    return mask;
  }

  /**
   * Update user consent with instant cache invalidation
   */
  updateUserConsent(userId: string, consents: Record<string, boolean>): void {
    const mask = this.buildConsentMask(consents);
    
    this.consentMatrix.set(userId, {
      mask,
      timestamp: Date.now(),
      version: (this.consentMatrix.get(userId)?.version || 0) + 1
    });

    // Invalidate related cache entries
    this.invalidateUserCache(userId);
    
    // Update timestamp for change tracking
    this.consentTimestamps.set(userId, Date.now());
  }

  /**
   * Invalidate cache entries for a specific user
   */
  private invalidateUserCache(userId: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.consentCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.consentCache.delete(key));
  }

  /**
   * Check if consent checking can be bypassed for fully anonymized data
   */
  canBypassConsent(dataType: DataType, anonymizationLevel: AnonymizationLevel): boolean {
    // Fully anonymized data doesn't require consent checking
    if (anonymizationLevel === AnonymizationLevel.FULL_ANONYMIZATION) {
      return true;
    }
    
    // Aggregated data above minimum threshold doesn't require individual consent
    if (dataType === DataType.AGGREGATED && anonymizationLevel >= AnonymizationLevel.K_ANONYMITY) {
      return true;
    }
    
    return false;
  }

  /**
   * Efficient consent pre-computation for common operations
   */
  precomputeCommonOperations(userId: string): void {
    const commonPurposes = [
      ConsentPurpose.ANALYTICS,
      ConsentPurpose.EDUCATIONAL,
      ConsentPurpose.IMPROVEMENT,
      this.consentPatterns.get('basic_analytics')!,
      this.consentPatterns.get('educational_insights')!
    ];
    
    for (const purpose of commonPurposes) {
      const cacheKey = `${userId}:${purpose}`;
      if (!this.consentCache.has(cacheKey)) {
        const allowed = this.checkConsent(userId, purpose as ConsentPurpose);
        this.cacheResult(cacheKey, allowed, 300000); // 5 minutes TTL
      }
    }
  }

  /**
   * Cache consent result with TTL
   */
  private cacheResult(key: string, allowed: boolean, ttl: number = 60000): void {
    this.consentCache.set(key, {
      allowed,
      timestamp: Date.now(),
      ttl
    });
    
    // Cleanup old cache entries periodically
    if (this.consentCache.size > 10000) {
      this.cleanupCache();
    }
  }

  /**
   * Check if cached result is still valid
   */
  private isCacheValid(result: ConsentResult): boolean {
    return (Date.now() - result.timestamp) < result.ttl;
  }

  /**
   * Update average check time for performance monitoring
   */
  private updateAverageCheckTime(duration: number): void {
    this.stats.averageCheckTime = 
      (this.stats.averageCheckTime * (this.stats.checks - 1) + duration) / this.stats.checks;
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, result] of this.consentCache.entries()) {
      if (now - result.timestamp > result.ttl) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.consentCache.delete(key));
  }

  /**
   * Get detailed performance statistics
   */
  getPerformanceStats(): ConsentEngineStats {
    const cacheHitRate = this.stats.checks > 0 ? 
      (this.stats.cacheHits / this.stats.checks) * 100 : 0;
    
    return {
      ...this.stats,
      cacheHitRate,
      cacheSize: this.consentCache.size,
      matrixEfficiency: this.consentMatrix.size > 0 ? 
        (this.stats.checks / this.consentMatrix.size) : 0
    };
  }

  /**
   * Clear all caches and reset statistics
   */
  reset(): void {
    this.consentMatrix.clear();
    this.consentCache.clear();
    this.consentTimestamps.clear();
    
    this.stats = {
      checks: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageCheckTime: 0,
      matrixSize: 0
    };
  }
}

// Consent purpose bit flags for efficient operations
export enum ConsentPurpose {
  NECESSARY = 1 << 0,     // Always allowed
  ANALYTICS = 1 << 1,     // Analytics and insights
  IMPROVEMENT = 1 << 2,   // Platform improvement
  EDUCATIONAL = 1 << 3,   // Educational purposes
  RESEARCH = 1 << 4,      // Research and studies
  MARKETING = 1 << 5,     // Marketing communications
  SHARING = 1 << 6,       // Data sharing with third parties
  ALL = (1 << 7) - 1      // All purposes
}

export enum DataType {
  PERSONAL = 'personal',
  EDUCATIONAL = 'educational',
  AGGREGATED = 'aggregated',
  ANONYMOUS = 'anonymous'
}

export enum AnonymizationLevel {
  NONE = 0,
  PSEUDONYMIZATION = 1,
  K_ANONYMITY = 2,
  DIFFERENTIAL_PRIVACY = 3,
  FULL_ANONYMIZATION = 4
}

interface ConsentBitMask {
  mask: number;
  timestamp: number;
  version: number;
}

interface ConsentResult {
  allowed: boolean;
  timestamp: number;
  ttl: number;
}

interface ConsentRequest {
  userId: string;
  purpose: ConsentPurpose;
}

interface UserConsentData {
  userId: string;
  consents: Record<string, boolean>;
  lastUpdated?: number;
  version?: number;
}

interface ConsentEngineStats {
  checks: number;
  cacheHits: number;
  cacheMisses: number;
  averageCheckTime: number;
  matrixSize: number;
  cacheHitRate: number;
  cacheSize: number;
  matrixEfficiency: number;
}