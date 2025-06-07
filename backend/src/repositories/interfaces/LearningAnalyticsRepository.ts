/**
 * Learning Analytics Repository Interface
 * Privacy-aware analytics with educational insights
 */

import { BaseRepository } from './BaseRepository';
import { PrivacyContext } from '../../types/privacy';

export interface LearningMetric {
  id: string;
  studentId: string;
  assignmentId?: string;
  courseId?: string;
  metricType: 'progress' | 'engagement' | 'quality' | 'reflection' | 'collaboration';
  metricName: string;
  value: number;
  metadata?: Record<string, any>;
  timestamp: Date;
  createdAt: Date;
}

export interface ProgressSnapshot {
  id: string;
  studentId: string;
  assignmentId: string;
  overallProgress: number;
  writingQuality: number;
  reflectionDepth: number;
  aiInteractionCount: number;
  collaborationScore: number;
  timestamp: Date;
}

export interface CourseAnalytics {
  courseId: string;
  totalStudents: number;
  averageProgress: number;
  averageQuality: number;
  averageReflectionDepth: number;
  engagementTrends: TimeSeriesData[];
  qualityDistribution: DistributionData[];
}

export interface StudentAnalytics {
  studentId: string;
  overallProgress: number;
  strengthAreas: string[];
  improvementAreas: string[];
  progressTrend: 'improving' | 'stable' | 'declining';
  metrics: LearningMetric[];
  snapshots: ProgressSnapshot[];
}

export interface TimeSeriesData {
  date: Date;
  value: number;
  metadata?: Record<string, any>;
}

export interface DistributionData {
  range: string;
  count: number;
  percentage: number;
}

export interface AnalyticsFilters {
  studentId?: string;
  assignmentId?: string;
  courseId?: string;
  metricTypes?: string[];
  fromDate?: Date;
  toDate?: Date;
  aggregation?: 'daily' | 'weekly' | 'monthly';
}

export interface LearningTrends {
  progressTrend: TimeSeriesData[];
  qualityTrend: TimeSeriesData[];
  engagementTrend: TimeSeriesData[];
  reflectionTrend: TimeSeriesData[];
}

/**
 * Privacy-aware Learning Analytics Repository
 */
export interface LearningAnalyticsRepository extends BaseRepository<LearningMetric> {
  /**
   * Record a learning metric with privacy context
   */
  recordMetric(
    metric: Omit<LearningMetric, 'id' | 'createdAt'>,
    privacyContext: PrivacyContext
  ): Promise<LearningMetric>;

  /**
   * Get student analytics with privacy filtering
   */
  getStudentAnalytics(
    studentId: string,
    privacyContext: PrivacyContext,
    filters?: AnalyticsFilters
  ): Promise<StudentAnalytics>;

  /**
   * Get course analytics with privacy aggregation
   */
  getCourseAnalytics(
    courseId: string,
    privacyContext: PrivacyContext,
    filters?: AnalyticsFilters
  ): Promise<CourseAnalytics>;

  /**
   * Create progress snapshot
   */
  createProgressSnapshot(
    snapshot: Omit<ProgressSnapshot, 'id'>,
    privacyContext: PrivacyContext
  ): Promise<ProgressSnapshot>;

  /**
   * Get learning trends with privacy aggregation
   */
  getLearningTrends(
    filters: AnalyticsFilters,
    privacyContext: PrivacyContext
  ): Promise<LearningTrends>;

  /**
   * Get metrics by type with privacy filtering
   */
  getMetricsByType(
    metricType: LearningMetric['metricType'],
    filters: AnalyticsFilters,
    privacyContext: PrivacyContext
  ): Promise<LearningMetric[]>;

  /**
   * Get aggregated metrics for dashboard
   */
  getDashboardMetrics(
    filters: AnalyticsFilters,
    privacyContext: PrivacyContext
  ): Promise<{
    totalMetrics: number;
    averageProgress: number;
    activeStudents: number;
    recentActivity: TimeSeriesData[];
  }>;

  /**
   * Compare student performance with privacy aggregation
   */
  compareStudentPerformance(
    studentId: string,
    comparison: 'course' | 'assignment' | 'global',
    privacyContext: PrivacyContext
  ): Promise<{
    studentMetrics: StudentAnalytics;
    benchmarkMetrics: {
      averageProgress: number;
      averageQuality: number;
      percentileRank: number;
    };
  }>;

  /**
   * Get learning objective progress
   */
  getLearningObjectiveProgress(
    studentId: string,
    assignmentId: string,
    privacyContext: PrivacyContext
  ): Promise<{
    objectiveId: string;
    progress: number;
    evidence: string[];
    lastUpdated: Date;
  }[]>;

  /**
   * Bulk record metrics for batch operations
   */
  recordMetricsBatch(
    metrics: Omit<LearningMetric, 'id' | 'createdAt'>[],
    privacyContext: PrivacyContext
  ): Promise<LearningMetric[]>;
}