/**
 * In-memory caching service for performance optimization
 * Uses Map with TTL (Time To Live) for automatic expiration
 */

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

export class CacheService {
  private static cache = new Map<string, CacheEntry<any>>();
  private static cleanupInterval: NodeJS.Timeout | null = null;

  // Start periodic cleanup of expired entries (disabled in test environment)
  static {
    if (process.env.NODE_ENV !== 'test') {
      this.startCleanup();
    }
  }

  /**
   * Get cached data
   */
  static get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Set cached data with TTL in seconds
   */
  static set<T>(key: string, data: T, ttl: number = 300): void {
    const expiry = Date.now() + (ttl * 1000);
    this.cache.set(key, { data, expiry });
  }

  /**
   * Delete cached data
   */
  static delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  static clear(): void {
    this.cache.clear();
  }

  /**
   * Clear cache entries matching a pattern
   */
  static clearPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Get cache size
   */
  static size(): number {
    return this.cache.size;
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private static startCleanup(): void {
    if (this.cleanupInterval) return;
    
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];
      
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiry) {
          keysToDelete.push(key);
        }
      }
      
      keysToDelete.forEach(key => this.cache.delete(key));
      
      if (keysToDelete.length > 0) {
        console.log(`Cache cleanup: removed ${keysToDelete.length} expired entries`);
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Stop cleanup interval (for testing)
   */
  static stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Cache key generators for consistency
export const CacheKeys = {
  studentProfile: (studentId: string) => `profile:${studentId}`,
  classAnalytics: (courseId: string, assignmentId: string) => `analytics:${courseId}:${assignmentId}`,
  boundaryEffectiveness: (assignmentId: string) => `boundary:effectiveness:${assignmentId}`,
  aiInteractions: (studentId: string, assignmentId: string) => `interactions:${studentId}:${assignmentId}`,
  reflectionAnalysis: (reflectionId: string) => `reflection:${reflectionId}`,
  assignment: (assignmentId: string) => `assignment:${assignmentId}`,
  course: (courseId: string) => `course:${courseId}`,
  
  // Pattern for clearing related cache
  studentPattern: (studentId: string) => `.*:${studentId}.*`,
  assignmentPattern: (assignmentId: string) => `.*:${assignmentId}.*`,
  coursePattern: (courseId: string) => `.*:${courseId}.*`
};

// Cache TTL values in seconds
export const CacheTTL = {
  studentProfile: 300,        // 5 minutes
  classAnalytics: 600,        // 10 minutes
  boundaryEffectiveness: 900, // 15 minutes
  aiInteractions: 300,        // 5 minutes
  reflectionAnalysis: 1800,   // 30 minutes (unlikely to change)
  assignment: 600,            // 10 minutes
  course: 1800               // 30 minutes
};