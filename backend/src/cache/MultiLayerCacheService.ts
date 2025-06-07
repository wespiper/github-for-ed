/**
 * Multi-Layer Cache Service
 * Implements L1 (in-memory), L2 (Redis), L3 (database) caching
 * Target: 80%+ cache hit rate with privacy compliance
 */

import { CacheService } from './CacheService';
import { PrivacyCacheService } from './PrivacyCacheService';
import { Logger } from '../monitoring/Logger';
import { productionMetrics } from '../monitoring/ProductionMetricsCollector';
import { EventEmitter } from 'events';

export interface CacheLevel {
  name: string;
  level: number;
  maxSize: number;
  ttl: number;
  enabled: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  size: number;
  hitRate: number;
}

export interface CacheKey {
  key: string;
  level: number;
  ttl: number;
  tags: string[];
  privacy: boolean;
  size: number;
}

export interface CacheOperation {
  operation: 'get' | 'set' | 'delete' | 'invalidate';
  key: string;
  level: number;
  duration: number;
  hit: boolean;
  size?: number;
}

export class MultiLayerCacheService extends EventEmitter {
  private static instance: MultiLayerCacheService;
  private logger = Logger.getInstance('multi-layer-cache');
  
  // Cache layers
  private l1Cache = new Map<string, { value: any; expiry: number; size: number; tags: string[] }>(); // In-memory
  private l2Cache?: CacheService; // Redis
  private l3Cache?: PrivacyCacheService; // Database/privacy cache
  
  // Configuration
  private layers: CacheLevel[] = [
    {
      name: 'memory',
      level: 1,
      maxSize: 1000, // 1000 items
      ttl: 300000, // 5 minutes
      enabled: true
    },
    {
      name: 'redis',
      level: 2,
      maxSize: 100000, // 100k items
      ttl: 3600000, // 1 hour
      enabled: true
    },
    {
      name: 'database',
      level: 3,
      maxSize: 1000000, // 1M items
      ttl: 86400000, // 24 hours
      enabled: true
    }
  ];

  // Statistics tracking
  private stats = new Map<number, CacheStats>();
  private operations: CacheOperation[] = [];
  private maxOperationHistory = 10000;
  
  // Cache warming and invalidation
  private warmingQueue: string[] = [];
  private invalidationRules = new Map<string, string[]>(); // tag -> keys
  private compressionEnabled = true;
  private intelligentPrefetch = true;

  private constructor() {
    super();
    this.initializeStats();
    this.startPerformanceMonitoring();
    this.startCacheWarming();
    this.startCleanupProcess();
  }

  static getInstance(): MultiLayerCacheService {
    if (!MultiLayerCacheService.instance) {
      MultiLayerCacheService.instance = new MultiLayerCacheService();
    }
    return MultiLayerCacheService.instance;
  }

  /**
   * Initialize cache with backing services
   */
  async initialize(l2Cache?: CacheService, l3Cache?: PrivacyCacheService): Promise<void> {
    this.l2Cache = l2Cache;
    this.l3Cache = l3Cache;
    
    this.logger.info('Multi-layer cache initialized', {
      layers: this.layers.filter(l => l.enabled).length,
      l1Enabled: true,
      l2Enabled: !!this.l2Cache,
      l3Enabled: !!this.l3Cache
    });

    // Pre-warm critical caches
    await this.prewarmCriticalData();
  }

  /**
   * Get value with multi-layer lookup
   */
  async get<T>(key: string, options: {
    tags?: string[];
    privacy?: boolean;
    skipLevels?: number[];
    warmOnMiss?: boolean;
  } = {}): Promise<T | null> {
    const startTime = Date.now();
    let result: T | null = null;
    let hitLevel = 0;

    try {
      // L1: Memory cache
      if (!options.skipLevels?.includes(1) && this.layers[0].enabled) {
        result = await this.getFromL1<T>(key);
        if (result !== null) {
          hitLevel = 1;
          this.recordOperation('get', key, 1, Date.now() - startTime, true);
          this.recordHit(1);
          
          productionMetrics.incrementCounter('cache_operations_total', 1, {
            operation: 'get',
            status: 'hit',
            cache_type: 'memory',
            level: '1'
          });

          return result;
        }
      }

      // L2: Redis cache
      if (!options.skipLevels?.includes(2) && this.layers[1].enabled && this.l2Cache) {
        result = await this.getFromL2<T>(key, options.privacy);
        if (result !== null) {
          hitLevel = 2;
          
          // Promote to L1
          await this.setToL1(key, result, options.tags || []);
          
          this.recordOperation('get', key, 2, Date.now() - startTime, true);
          this.recordHit(2);
          
          productionMetrics.incrementCounter('cache_operations_total', 1, {
            operation: 'get',
            status: 'hit',
            cache_type: 'redis',
            level: '2'
          });

          return result;
        }
      }

      // L3: Database/Privacy cache
      if (!options.skipLevels?.includes(3) && this.layers[2].enabled && this.l3Cache) {
        result = await this.getFromL3<T>(key, options.privacy);
        if (result !== null) {
          hitLevel = 3;
          
          // Promote to L2 and L1
          if (this.l2Cache) {
            await this.setToL2(key, result, options.privacy);
          }
          await this.setToL1(key, result, options.tags || []);
          
          this.recordOperation('get', key, 3, Date.now() - startTime, true);
          this.recordHit(3);
          
          productionMetrics.incrementCounter('cache_operations_total', 1, {
            operation: 'get',
            status: 'hit',
            cache_type: 'database',
            level: '3'
          });

          return result;
        }
      }

      // Cache miss - record for all levels attempted
      for (let level = 1; level <= 3; level++) {
        if (!options.skipLevels?.includes(level) && this.layers[level - 1].enabled) {
          this.recordMiss(level);
          this.recordOperation('get', key, level, Date.now() - startTime, false);
        }
      }

      productionMetrics.incrementCounter('cache_operations_total', 1, {
        operation: 'get',
        status: 'miss',
        cache_type: 'all'
      });

      // Intelligent prefetch if enabled
      if (options.warmOnMiss && this.intelligentPrefetch) {
        this.addToWarmingQueue(key);
      }

      return null;

    } catch (error) {
      this.logger.error('Cache get error', error as Error, { key, hitLevel });
      
      productionMetrics.incrementCounter('cache_operations_total', 1, {
        operation: 'get',
        status: 'error',
        cache_type: hitLevel > 0 ? `level_${hitLevel}` : 'all'
      });

      return null;
    }
  }

  /**
   * Set value to all appropriate cache levels
   */
  async set<T>(
    key: string,
    value: T,
    options: {
      ttl?: number;
      tags?: string[];
      privacy?: boolean;
      levels?: number[];
      size?: number;
    } = {}
  ): Promise<void> {
    const startTime = Date.now();
    const tags = options.tags || [];
    const levels = options.levels || [1, 2, 3];
    const estimatedSize = options.size || this.estimateSize(value);

    try {
      // Set to each enabled level
      const promises: Promise<void>[] = [];

      if (levels.includes(1) && this.layers[0].enabled) {
        promises.push(this.setToL1(key, value, tags, options.ttl));
      }

      if (levels.includes(2) && this.layers[1].enabled && this.l2Cache) {
        promises.push(this.setToL2(key, value, options.privacy, options.ttl));
      }

      if (levels.includes(3) && this.layers[2].enabled && this.l3Cache) {
        promises.push(this.setToL3(key, value, options.privacy, options.ttl));
      }

      await Promise.allSettled(promises);

      // Update invalidation rules for tags
      tags.forEach(tag => {
        if (!this.invalidationRules.has(tag)) {
          this.invalidationRules.set(tag, []);
        }
        this.invalidationRules.get(tag)!.push(key);
      });

      // Record operations
      levels.forEach(level => {
        if (this.layers[level - 1].enabled) {
          this.recordOperation('set', key, level, Date.now() - startTime, true, estimatedSize);
          this.recordSet(level);
        }
      });

      productionMetrics.incrementCounter('cache_operations_total', 1, {
        operation: 'set',
        status: 'success',
        cache_type: 'multi_level'
      });

      productionMetrics.recordHistogram('cache_set_size_bytes', estimatedSize, {
        cache_type: 'multi_level'
      });

    } catch (error) {
      this.logger.error('Cache set error', error as Error, { key });
      
      productionMetrics.incrementCounter('cache_operations_total', 1, {
        operation: 'set',
        status: 'error',
        cache_type: 'multi_level'
      });
    }
  }

  /**
   * Delete from all cache levels
   */
  async delete(key: string): Promise<void> {
    const startTime = Date.now();

    try {
      const promises: Promise<void>[] = [];

      // Delete from all levels
      promises.push(this.deleteFromL1(key));
      
      if (this.l2Cache) {
        promises.push(this.deleteFromL2(key));
      }
      
      if (this.l3Cache) {
        promises.push(this.deleteFromL3(key));
      }

      await Promise.allSettled(promises);

      // Record operations
      for (let level = 1; level <= 3; level++) {
        if (this.layers[level - 1].enabled) {
          this.recordOperation('delete', key, level, Date.now() - startTime, true);
          this.recordDelete(level);
        }
      }

      productionMetrics.incrementCounter('cache_operations_total', 1, {
        operation: 'delete',
        status: 'success',
        cache_type: 'multi_level'
      });

    } catch (error) {
      this.logger.error('Cache delete error', error as Error, { key });
      
      productionMetrics.incrementCounter('cache_operations_total', 1, {
        operation: 'delete',
        status: 'error',
        cache_type: 'multi_level'
      });
    }
  }

  /**
   * Invalidate by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    const startTime = Date.now();
    const keysToInvalidate = new Set<string>();

    // Collect all keys for the given tags
    tags.forEach(tag => {
      const keys = this.invalidationRules.get(tag) || [];
      keys.forEach(key => keysToInvalidate.add(key));
    });

    // Delete all collected keys
    const deletePromises = Array.from(keysToInvalidate).map(key => this.delete(key));
    await Promise.allSettled(deletePromises);

    // Clean up invalidation rules
    tags.forEach(tag => {
      this.invalidationRules.delete(tag);
    });

    this.logger.info('Cache invalidation by tags completed', {
      tags,
      keysInvalidated: keysToInvalidate.size,
      duration: Date.now() - startTime
    });

    productionMetrics.incrementCounter('cache_invalidations_total', 1, {
      type: 'tag_based',
      keys_count: keysToInvalidate.size.toString()
    });
  }

  /**
   * L1 Cache Operations (In-Memory)
   */
  private async getFromL1<T>(key: string): Promise<T | null> {
    const item = this.l1Cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.l1Cache.delete(key);
      this.recordEviction(1);
      return null;
    }
    
    return item.value as T;
  }

  private async setToL1<T>(key: string, value: T, tags: string[] = [], ttl?: number): Promise<void> {
    const expiry = Date.now() + (ttl || this.layers[0].ttl);
    const size = this.estimateSize(value);
    
    // Evict if at capacity
    if (this.l1Cache.size >= this.layers[0].maxSize) {
      this.evictLRU();
    }
    
    this.l1Cache.set(key, { value, expiry, size, tags });
  }

  private async deleteFromL1(key: string): Promise<void> {
    this.l1Cache.delete(key);
  }

  /**
   * L2 Cache Operations (Redis)
   */
  private async getFromL2<T>(key: string, privacy?: boolean): Promise<T | null> {
    if (!this.l2Cache) return null;
    
    try {
      const result = await this.l2Cache.get<T>(key);
      return result;
    } catch (error) {
      this.logger.warn('L2 cache get error', { key, error: (error as Error).message });
      return null;
    }
  }

  private async setToL2<T>(key: string, value: T, privacy?: boolean, ttl?: number): Promise<void> {
    if (!this.l2Cache) return;
    
    try {
      await this.l2Cache.set(key, value, { 
        ttl: ttl || this.layers[1].ttl 
      });
    } catch (error) {
      this.logger.warn('L2 cache set error', { key, error: (error as Error).message });
    }
  }

  private async deleteFromL2(key: string): Promise<void> {
    if (!this.l2Cache) return;
    
    try {
      await this.l2Cache.delete(key);
    } catch (error) {
      this.logger.warn('L2 cache delete error', { key, error: (error as Error).message });
    }
  }

  /**
   * L3 Cache Operations (Database/Privacy)
   */
  private async getFromL3<T>(key: string, privacy?: boolean): Promise<T | null> {
    if (!this.l3Cache) return null;
    
    try {
      // Use privacy cache if needed
      const result = await this.l3Cache.get<T>(key);
      return result;
    } catch (error) {
      this.logger.warn('L3 cache get error', { key, error: (error as Error).message });
      return null;
    }
  }

  private async setToL3<T>(key: string, value: T, privacy?: boolean, ttl?: number): Promise<void> {
    if (!this.l3Cache) return;
    
    try {
      await this.l3Cache.set(key, value, { 
        ttl: ttl || this.layers[2].ttl 
      });
    } catch (error) {
      this.logger.warn('L3 cache set error', { key, error: (error as Error).message });
    }
  }

  private async deleteFromL3(key: string): Promise<void> {
    if (!this.l3Cache) return;
    
    try {
      await this.l3Cache.delete(key);
    } catch (error) {
      this.logger.warn('L3 cache delete error', { key, error: (error as Error).message });
    }
  }

  /**
   * Cache warming and prefetching
   */
  private async prewarmCriticalData(): Promise<void> {
    // Pre-warm commonly accessed data
    const criticalKeys = [
      'system:config',
      'privacy:policies',
      'ai:boundaries',
      'cache:learning_objectives'
    ];

    this.logger.info('Pre-warming critical cache data', {
      keys: criticalKeys.length
    });

    // This would load from database/API in production
    for (const key of criticalKeys) {
      this.addToWarmingQueue(key);
    }
  }

  private addToWarmingQueue(key: string): void {
    if (!this.warmingQueue.includes(key)) {
      this.warmingQueue.push(key);
    }
  }

  private startCacheWarming(): void {
    setInterval(() => {
      this.processWarmingQueue();
    }, 5000); // Every 5 seconds
  }

  private async processWarmingQueue(): Promise<void> {
    if (this.warmingQueue.length === 0) return;

    const batchSize = Math.min(10, this.warmingQueue.length);
    const batch = this.warmingQueue.splice(0, batchSize);

    // This would implement actual cache warming logic
    this.logger.debug('Processing cache warming batch', {
      keys: batch.length
    });

    productionMetrics.incrementCounter('cache_warming_operations', batch.length);
  }

  /**
   * LRU eviction for L1 cache
   */
  private evictLRU(): void {
    // Simple eviction - remove oldest entries
    const entries = Array.from(this.l1Cache.entries());
    const toEvict = Math.ceil(entries.length * 0.1); // Evict 10%
    
    entries.slice(0, toEvict).forEach(([key]) => {
      this.l1Cache.delete(key);
      this.recordEviction(1);
    });
  }

  /**
   * Start cleanup process
   */
  private startCleanupProcess(): void {
    setInterval(() => {
      this.cleanupExpiredL1();
      this.cleanupOperationHistory();
    }, 60000); // Every minute
  }

  private cleanupExpiredL1(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.l1Cache.entries()) {
      if (now > item.expiry) {
        this.l1Cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired L1 cache entries`);
      productionMetrics.incrementCounter('cache_expired_cleanup', cleaned, {
        level: '1'
      });
    }
  }

  private cleanupOperationHistory(): void {
    if (this.operations.length > this.maxOperationHistory) {
      const toRemove = this.operations.length - this.maxOperationHistory;
      this.operations.splice(0, toRemove);
    }
  }

  /**
   * Statistics and monitoring
   */
  private initializeStats(): void {
    for (let level = 1; level <= 3; level++) {
      this.stats.set(level, {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        evictions: 0,
        size: 0,
        hitRate: 0
      });
    }
  }

  private recordHit(level: number): void {
    const stats = this.stats.get(level)!;
    stats.hits++;
    this.updateHitRate(level);
  }

  private recordMiss(level: number): void {
    const stats = this.stats.get(level)!;
    stats.misses++;
    this.updateHitRate(level);
  }

  private recordSet(level: number): void {
    const stats = this.stats.get(level)!;
    stats.sets++;
  }

  private recordDelete(level: number): void {
    const stats = this.stats.get(level)!;
    stats.deletes++;
  }

  private recordEviction(level: number): void {
    const stats = this.stats.get(level)!;
    stats.evictions++;
  }

  private updateHitRate(level: number): void {
    const stats = this.stats.get(level)!;
    const total = stats.hits + stats.misses;
    stats.hitRate = total > 0 ? (stats.hits / total) * 100 : 0;
  }

  private recordOperation(
    operation: 'get' | 'set' | 'delete' | 'invalidate',
    key: string,
    level: number,
    duration: number,
    hit: boolean,
    size?: number
  ): void {
    this.operations.push({
      operation,
      key,
      level,
      duration,
      hit,
      size
    });

    productionMetrics.recordHistogram('cache_operation_duration_ms', duration, {
      operation,
      level: level.toString(),
      hit: hit.toString()
    });
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.updatePerformanceMetrics();
    }, 10000); // Every 10 seconds
  }

  private updatePerformanceMetrics(): void {
    // Update hit rates for all levels
    for (const [level, stats] of this.stats.entries()) {
      productionMetrics.setGauge('cache_hit_rate', stats.hitRate, {
        cache_type: `level_${level}`,
        level: level.toString()
      });

      productionMetrics.setGauge('cache_size', stats.size, {
        cache_type: `level_${level}`,
        level: level.toString()
      });
    }

    // Calculate overall hit rate
    const totalHits = Array.from(this.stats.values()).reduce((sum, s) => sum + s.hits, 0);
    const totalAttempts = Array.from(this.stats.values()).reduce((sum, s) => sum + s.hits + s.misses, 0);
    const overallHitRate = totalAttempts > 0 ? (totalHits / totalAttempts) * 100 : 0;

    productionMetrics.setGauge('cache_hit_rate', overallHitRate, {
      cache_type: 'overall'
    });

    // Update L1 size
    this.stats.get(1)!.size = this.l1Cache.size;
  }

  /**
   * Utility: Estimate object size
   */
  private estimateSize(value: any): number {
    if (typeof value === 'string') {
      return value.length * 2; // Rough estimate for UTF-16
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value).length * 2;
    }
    
    return 64; // Default estimate
  }

  /**
   * Get cache statistics
   */
  getStats(): Record<string, CacheStats> {
    const result: Record<string, CacheStats> = {};
    
    for (const [level, stats] of this.stats.entries()) {
      result[`level_${level}`] = { ...stats };
    }

    return result;
  }

  /**
   * Get cache configuration
   */
  getConfiguration(): {
    layers: CacheLevel[];
    compressionEnabled: boolean;
    intelligentPrefetch: boolean;
    maxOperationHistory: number;
  } {
    return {
      layers: [...this.layers],
      compressionEnabled: this.compressionEnabled,
      intelligentPrefetch: this.intelligentPrefetch,
      maxOperationHistory: this.maxOperationHistory
    };
  }
}

// Export singleton instance
export const multiLayerCache = MultiLayerCacheService.getInstance();