/**
 * Mock Learning Analytics Repository Implementation
 * For testing privacy-aware analytics operations
 */

import { 
  LearningAnalyticsRepository,
  LearningMetric,
  ProgressSnapshot,
  StudentAnalytics,
  CourseAnalytics,
  LearningTrends,
  TimeSeriesData,
  AnalyticsFilters
} from '../interfaces/LearningAnalyticsRepository';
import { PrivacyContext } from '../../types/privacy';
import { FindManyOptions, CreateData, UpdateData } from '../interfaces/BaseRepository';

export class MockLearningAnalyticsRepository implements LearningAnalyticsRepository {
  private metrics: Map<string, LearningMetric> = new Map();
  private snapshots: Map<string, ProgressSnapshot> = new Map();
  private privacyLogs: Array<{ operation: string; context: PrivacyContext; timestamp: Date }> = [];

  constructor() {
    this.seedTestData();
  }

  async findById(id: string): Promise<LearningMetric | null> {
    return this.metrics.get(id) || null;
  }

  async findMany(options?: FindManyOptions<LearningMetric>): Promise<LearningMetric[]> {
    return Array.from(this.metrics.values());
  }

  async create(data: CreateData<LearningMetric>): Promise<LearningMetric> {
    const id = `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const metric: LearningMetric = {
      id,
      ...data,
      createdAt: new Date()
    };
    
    this.metrics.set(id, metric);
    return metric;
  }

  async update(id: string, data: UpdateData<LearningMetric>): Promise<LearningMetric> {
    const existing = this.metrics.get(id);
    if (!existing) {
      throw new Error(`Metric with id ${id} not found`);
    }

    const updated = { ...existing, ...data };
    this.metrics.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.metrics.delete(id);
  }

  async count(options?: any): Promise<number> {
    return this.metrics.size;
  }

  async recordMetric(
    metric: Omit<LearningMetric, 'id' | 'createdAt'>,
    privacyContext: PrivacyContext
  ): Promise<LearningMetric> {
    this.logPrivacyOperation('recordMetric', privacyContext);
    return this.create(metric);
  }

  async getStudentAnalytics(
    studentId: string,
    privacyContext: PrivacyContext,
    filters?: AnalyticsFilters
  ): Promise<StudentAnalytics> {
    this.logPrivacyOperation('getStudentAnalytics', privacyContext);
    
    const studentMetrics = Array.from(this.metrics.values())
      .filter(metric => metric.studentId === studentId)
      .filter(metric => this.applyFilters(metric, filters));

    const studentSnapshots = Array.from(this.snapshots.values())
      .filter(snapshot => snapshot.studentId === studentId);

    // Calculate analytics based on privacy context
    const overallProgress = this.calculatePrivacyAwareProgress(studentMetrics, privacyContext);
    
    return {
      studentId,
      overallProgress,
      strengthAreas: this.identifyStrengthAreas(studentMetrics, privacyContext),
      improvementAreas: this.identifyImprovementAreas(studentMetrics, privacyContext),
      progressTrend: this.calculateProgressTrend(studentMetrics),
      metrics: this.filterMetricsByPrivacy(studentMetrics, privacyContext),
      snapshots: this.filterSnapshotsByPrivacy(studentSnapshots, privacyContext)
    };
  }

  async getCourseAnalytics(
    courseId: string,
    privacyContext: PrivacyContext,
    filters?: AnalyticsFilters
  ): Promise<CourseAnalytics> {
    this.logPrivacyOperation('getCourseAnalytics', privacyContext);
    
    const courseMetrics = Array.from(this.metrics.values())
      .filter(metric => metric.courseId === courseId)
      .filter(metric => this.applyFilters(metric, filters));

    // Apply privacy aggregation
    const studentIds = [...new Set(courseMetrics.map(m => m.studentId))];
    
    return {
      courseId,
      totalStudents: studentIds.length,
      averageProgress: this.calculateAverageMetric(courseMetrics, 'progress'),
      averageQuality: this.calculateAverageMetric(courseMetrics, 'quality'),
      averageReflectionDepth: this.calculateAverageMetric(courseMetrics, 'reflection'),
      engagementTrends: this.generateTimeSeriesData(courseMetrics, 'engagement'),
      qualityDistribution: this.generateDistributionData(courseMetrics, 'quality')
    };
  }

  async createProgressSnapshot(
    snapshot: Omit<ProgressSnapshot, 'id'>,
    privacyContext: PrivacyContext
  ): Promise<ProgressSnapshot> {
    this.logPrivacyOperation('createProgressSnapshot', privacyContext);
    
    const id = `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const progressSnapshot: ProgressSnapshot = { id, ...snapshot };
    
    this.snapshots.set(id, progressSnapshot);
    return progressSnapshot;
  }

  async getLearningTrends(
    filters: AnalyticsFilters,
    privacyContext: PrivacyContext
  ): Promise<LearningTrends> {
    this.logPrivacyOperation('getLearningTrends', privacyContext);
    
    const filteredMetrics = Array.from(this.metrics.values())
      .filter(metric => this.applyFilters(metric, filters));

    return {
      progressTrend: this.generateTimeSeriesData(filteredMetrics, 'progress'),
      qualityTrend: this.generateTimeSeriesData(filteredMetrics, 'quality'),
      engagementTrend: this.generateTimeSeriesData(filteredMetrics, 'engagement'),
      reflectionTrend: this.generateTimeSeriesData(filteredMetrics, 'reflection')
    };
  }

  async getMetricsByType(
    metricType: LearningMetric['metricType'],
    filters: AnalyticsFilters,
    privacyContext: PrivacyContext
  ): Promise<LearningMetric[]> {
    this.logPrivacyOperation('getMetricsByType', privacyContext);
    
    return Array.from(this.metrics.values())
      .filter(metric => metric.metricType === metricType)
      .filter(metric => this.applyFilters(metric, filters))
      .filter(metric => this.respectsPrivacyContext(metric, privacyContext));
  }

  async getDashboardMetrics(
    filters: AnalyticsFilters,
    privacyContext: PrivacyContext
  ): Promise<{
    totalMetrics: number;
    averageProgress: number;
    activeStudents: number;
    recentActivity: TimeSeriesData[];
  }> {
    this.logPrivacyOperation('getDashboardMetrics', privacyContext);
    
    const filteredMetrics = Array.from(this.metrics.values())
      .filter(metric => this.applyFilters(metric, filters))
      .filter(metric => this.respectsPrivacyContext(metric, privacyContext));

    const activeStudents = new Set(filteredMetrics.map(m => m.studentId)).size;
    
    return {
      totalMetrics: filteredMetrics.length,
      averageProgress: this.calculateAverageMetric(filteredMetrics, 'progress'),
      activeStudents,
      recentActivity: this.generateTimeSeriesData(filteredMetrics, 'engagement').slice(-7)
    };
  }

  async compareStudentPerformance(
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
  }> {
    this.logPrivacyOperation('compareStudentPerformance', privacyContext);
    
    const studentMetrics = await this.getStudentAnalytics(studentId, privacyContext);
    
    // Generate benchmark data (mock implementation)
    const benchmarkMetrics = {
      averageProgress: 0.75,
      averageQuality: 0.8,
      percentileRank: 65
    };

    return { studentMetrics, benchmarkMetrics };
  }

  async getLearningObjectiveProgress(
    studentId: string,
    assignmentId: string,
    privacyContext: PrivacyContext
  ): Promise<{
    objectiveId: string;
    progress: number;
    evidence: string[];
    lastUpdated: Date;
  }[]> {
    this.logPrivacyOperation('getLearningObjectiveProgress', privacyContext);
    
    // Mock learning objectives progress
    return [
      {
        objectiveId: 'obj_1',
        progress: 0.8,
        evidence: ['Reflection quality improved', 'Citation usage correct'],
        lastUpdated: new Date()
      },
      {
        objectiveId: 'obj_2',
        progress: 0.6,
        evidence: ['Thesis development clear'],
        lastUpdated: new Date()
      }
    ];
  }

  async recordMetricsBatch(
    metrics: Omit<LearningMetric, 'id' | 'createdAt'>[],
    privacyContext: PrivacyContext
  ): Promise<LearningMetric[]> {
    this.logPrivacyOperation('recordMetricsBatch', privacyContext);
    
    const createdMetrics: LearningMetric[] = [];
    for (const metric of metrics) {
      const created = await this.create(metric);
      createdMetrics.push(created);
    }
    return createdMetrics;
  }

  // Test utilities and privacy helpers
  private logPrivacyOperation(operation: string, context: PrivacyContext) {
    this.privacyLogs.push({ operation, context, timestamp: new Date() });
  }

  private applyFilters(metric: LearningMetric, filters?: AnalyticsFilters): boolean {
    if (!filters) return true;
    
    if (filters.studentId && metric.studentId !== filters.studentId) return false;
    if (filters.assignmentId && metric.assignmentId !== filters.assignmentId) return false;
    if (filters.courseId && metric.courseId !== filters.courseId) return false;
    if (filters.metricTypes && !filters.metricTypes.includes(metric.metricType)) return false;
    if (filters.fromDate && metric.timestamp < filters.fromDate) return false;
    if (filters.toDate && metric.timestamp > filters.toDate) return false;
    
    return true;
  }

  private respectsPrivacyContext(metric: LearningMetric, context: PrivacyContext): boolean {
    // Basic privacy filtering - in real implementation would be more sophisticated
    return context.requesterType === 'admin' || 
           context.requesterType === 'educator' ||
           (context.requesterType === 'student' && metric.studentId === context.requesterId);
  }

  private calculatePrivacyAwareProgress(metrics: LearningMetric[], context: PrivacyContext): number {
    const progressMetrics = metrics.filter(m => m.metricType === 'progress');
    if (progressMetrics.length === 0) return 0;
    
    const sum = progressMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / progressMetrics.length;
  }

  private identifyStrengthAreas(metrics: LearningMetric[], context: PrivacyContext): string[] {
    // Mock implementation - would analyze actual metrics in real version
    return ['writing_clarity', 'research_skills'];
  }

  private identifyImprovementAreas(metrics: LearningMetric[], context: PrivacyContext): string[] {
    // Mock implementation - would analyze actual metrics in real version
    return ['citation_format', 'conclusion_strength'];
  }

  private calculateProgressTrend(metrics: LearningMetric[]): 'improving' | 'stable' | 'declining' {
    // Simple trend calculation - would be more sophisticated in real implementation
    const progressMetrics = metrics
      .filter(m => m.metricType === 'progress')
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    if (progressMetrics.length < 2) return 'stable';
    
    const recent = progressMetrics.slice(-3);
    const earlier = progressMetrics.slice(-6, -3);
    
    const recentAvg = recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
    const earlierAvg = earlier.length > 0 ? earlier.reduce((sum, m) => sum + m.value, 0) / earlier.length : recentAvg;
    
    if (recentAvg > earlierAvg * 1.1) return 'improving';
    if (recentAvg < earlierAvg * 0.9) return 'declining';
    return 'stable';
  }

  private filterMetricsByPrivacy(metrics: LearningMetric[], context: PrivacyContext): LearningMetric[] {
    return metrics.filter(metric => this.respectsPrivacyContext(metric, context));
  }

  private filterSnapshotsByPrivacy(snapshots: ProgressSnapshot[], context: PrivacyContext): ProgressSnapshot[] {
    return snapshots.filter(snapshot => 
      context.requesterType === 'admin' || 
      context.requesterType === 'educator' ||
      (context.requesterType === 'student' && snapshot.studentId === context.requesterId)
    );
  }

  private calculateAverageMetric(metrics: LearningMetric[], type: string): number {
    const typeMetrics = metrics.filter(m => m.metricName.includes(type));
    if (typeMetrics.length === 0) return 0;
    
    const sum = typeMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / typeMetrics.length;
  }

  private generateTimeSeriesData(metrics: LearningMetric[], type: string): TimeSeriesData[] {
    // Mock time series data generation
    const now = new Date();
    const data: TimeSeriesData[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      data.push({
        date,
        value: Math.random() * 100,
        metadata: { type }
      });
    }
    
    return data;
  }

  private generateDistributionData(metrics: LearningMetric[], type: string): any[] {
    // Mock distribution data
    return [
      { range: '0-20', count: 5, percentage: 10 },
      { range: '21-40', count: 10, percentage: 20 },
      { range: '41-60', count: 15, percentage: 30 },
      { range: '61-80', count: 15, percentage: 30 },
      { range: '81-100', count: 5, percentage: 10 }
    ];
  }

  // Test utilities
  getPrivacyLogs() {
    return this.privacyLogs;
  }

  clearPrivacyLogs() {
    this.privacyLogs = [];
  }

  reset() {
    this.metrics.clear();
    this.snapshots.clear();
    this.privacyLogs = [];
    this.seedTestData();
  }

  private seedTestData() {
    // Add test metrics
    const testMetrics = [
      {
        studentId: 'student_1',
        assignmentId: 'assignment_1',
        courseId: 'course_1',
        metricType: 'progress' as const,
        metricName: 'overall_progress',
        value: 0.75,
        timestamp: new Date()
      },
      {
        studentId: 'student_1',
        assignmentId: 'assignment_1',
        courseId: 'course_1',
        metricType: 'quality' as const,
        metricName: 'writing_quality',
        value: 0.8,
        timestamp: new Date()
      }
    ];

    testMetrics.forEach(metric => {
      this.create(metric);
    });
  }
}