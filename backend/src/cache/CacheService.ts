/**
 * Cache Service Interface for Educational Data Patterns
 */

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  namespace?: string; // Optional namespace for key grouping
}

export interface CacheService {
  /**
   * Get a value from cache
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set a value in cache
   */
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;

  /**
   * Delete a value from cache
   */
  delete(key: string): Promise<boolean>;

  /**
   * Delete multiple keys matching a pattern
   */
  deletePattern(pattern: string): Promise<number>;

  /**
   * Check if a key exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get remaining TTL for a key
   */
  ttl(key: string): Promise<number>;

  /**
   * Invalidate all cache entries in a namespace
   */
  invalidateNamespace(namespace: string): Promise<number>;

  /**
   * Get all keys matching a pattern
   */
  keys(pattern: string): Promise<string[]>;

  /**
   * Increment a numeric value
   */
  increment(key: string, delta?: number): Promise<number>;

  /**
   * Decrement a numeric value
   */
  decrement(key: string, delta?: number): Promise<number>;
}

/**
 * Educational cache key patterns
 */
export class CacheKeyBuilder {
  // Student profile and state
  static studentProfile(studentId: string): string {
    return `student:${studentId}:profile`;
  }

  static studentLearningState(studentId: string, courseId: string): string {
    return `student:${studentId}:course:${courseId}:state`;
  }

  static studentCognitiveLoad(studentId: string): string {
    return `student:${studentId}:cognitive_load`;
  }

  // AI interactions and analysis
  static aiInteractions(studentId: string, sessionId: string): string {
    return `ai:${studentId}:session:${sessionId}:interactions`;
  }

  static aiAnalysisResult(type: string, documentId: string): string {
    return `ai:analysis:${type}:document:${documentId}`;
  }

  static aiBoundaryState(studentId: string, assignmentId: string): string {
    return `ai:boundary:${studentId}:assignment:${assignmentId}`;
  }

  // Writing process and patterns
  static writingPattern(studentId: string, patternType: string): string {
    return `writing:${studentId}:pattern:${patternType}`;
  }

  static writingSession(sessionId: string): string {
    return `writing:session:${sessionId}`;
  }

  static documentVersion(documentId: string, version: number): string {
    return `document:${documentId}:version:${version}`;
  }

  // Reflection and assessment
  static reflectionQuality(reflectionId: string): string {
    return `reflection:${reflectionId}:quality`;
  }

  static assessmentCache(assignmentId: string, studentId: string): string {
    return `assessment:${assignmentId}:student:${studentId}`;
  }

  // Course and assignment data
  static courseAnalytics(courseId: string, metric: string): string {
    return `course:${courseId}:analytics:${metric}`;
  }

  static assignmentStats(assignmentId: string): string {
    return `assignment:${assignmentId}:stats`;
  }

  // Intervention and monitoring
  static interventionState(studentId: string, interventionId: string): string {
    return `intervention:${studentId}:${interventionId}:state`;
  }

  static monitoringMetric(metricType: string, entityId: string): string {
    return `monitoring:${metricType}:${entityId}`;
  }
}

/**
 * Cache TTL strategies for different data types
 */
export const CacheTTL = {
  // Real-time data (short TTL)
  COGNITIVE_LOAD: 60, // 1 minute
  WRITING_SESSION: 300, // 5 minutes
  AI_INTERACTION: 600, // 10 minutes
  
  // Session data (medium TTL)
  STUDENT_STATE: 1800, // 30 minutes
  DOCUMENT_VERSION: 3600, // 1 hour
  BOUNDARY_STATE: 3600, // 1 hour
  
  // Analysis results (longer TTL)
  REFLECTION_QUALITY: 7200, // 2 hours
  WRITING_PATTERN: 14400, // 4 hours
  ASSESSMENT_RESULT: 21600, // 6 hours
  
  // Static data (long TTL)
  COURSE_ANALYTICS: 86400, // 24 hours
  ASSIGNMENT_STATS: 43200, // 12 hours
  STUDENT_PROFILE: 86400, // 24 hours
} as const;