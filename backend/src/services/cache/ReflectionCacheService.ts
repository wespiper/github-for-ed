import { ReflectionAnalysis } from '../ai/ReflectionAnalysisService';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class ReflectionCacheService {
  private static cache = new Map<string, CacheEntry<any>>();
  private static readonly DEFAULT_TTL = 15 * 60 * 1000; // 15 minutes
  private static readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

  static {
    // Start cleanup interval
    setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Get cached reflection analysis
   */
  static getCachedAnalysis(
    studentId: string,
    assignmentId: string,
    reflectionHash: string
  ): ReflectionAnalysis | null {
    const key = this.generateKey('analysis', studentId, assignmentId, reflectionHash);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Cache reflection analysis
   */
  static cacheAnalysis(
    studentId: string,
    assignmentId: string,
    reflectionHash: string,
    analysis: ReflectionAnalysis,
    ttl: number = this.DEFAULT_TTL
  ): void {
    const key = this.generateKey('analysis', studentId, assignmentId, reflectionHash);
    this.cache.set(key, {
      data: analysis,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Get cached reflection history
   */
  static getCachedHistory(
    studentId: string,
    assignmentId?: string
  ): any | null {
    const key = this.generateKey('history', studentId, assignmentId || 'all');
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Cache reflection history
   */
  static cacheHistory(
    studentId: string,
    history: any,
    assignmentId?: string,
    ttl: number = this.DEFAULT_TTL
  ): void {
    const key = this.generateKey('history', studentId, assignmentId || 'all');
    this.cache.set(key, {
      data: history,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Invalidate cache for a student
   */
  static invalidateStudent(studentId: string): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (key.includes(studentId)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Generate cache key
   */
  private static generateKey(...parts: string[]): string {
    return parts.join(':');
  }

  /**
   * Create hash from reflection text for cache key
   */
  static hashReflection(reflection: string): string {
    // Simple hash function for demo - in production use crypto
    let hash = 0;
    for (let i = 0; i < reflection.length; i++) {
      const char = reflection.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Cleanup expired entries
   */
  private static cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now > entry.timestamp + entry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Get cache stats for monitoring
   */
  static getStats(): {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  } {
    // In a real implementation, track hits/misses
    return {
      size: this.cache.size,
      hits: 0, // Would track this
      misses: 0, // Would track this
      hitRate: 0
    };
  }

  /**
   * Clear all cache entries
   */
  static clear(): void {
    this.cache.clear();
  }
}