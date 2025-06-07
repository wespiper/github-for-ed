/**
 * Optimized Privacy-Aware Intervention Engine
 * 
 * Updated to use high-performance privacy operations:
 * - OptimizedConsentEngine for sub-2ms consent checks
 * - PrivacyPerformanceOrchestrator for coordinated operations
 * - OptimizedPrivacyAuditLogger for efficient audit logging
 * - Target: <50ms total intervention analysis with full privacy
 */

import { InterventionRepository, Intervention } from '../repositories/interfaces/InterventionRepository';
import { LearningAnalyticsRepository } from '../repositories/interfaces/LearningAnalyticsRepository';
import { DocumentRepository } from '../repositories/interfaces/DocumentRepository';
import { PrivacyContext } from '../types/privacy';
import { OptimizedConsentEngine, ConsentPurpose } from '../privacy/consent/OptimizedConsentEngine';
import { PrivacyPerformanceOrchestrator } from '../privacy/PrivacyPerformanceOrchestrator';
import { OptimizedPrivacyAuditLogger } from '../monitoring/privacy-optimized/OptimizedPrivacyAuditLogger';
import { OptimizedAnonymization } from '../privacy/operations/OptimizedEncryption';
import { EventBus } from '../events/EventBus';
import { performance } from 'perf_hooks';

export interface InterventionAlert {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  suggestedActions: string[];
  studentId: string;
  context?: {
    course?: string;
    assignment?: string;
    submission?: string;
  };
  deadline?: Date;
  metrics?: {
    currentValue: number;
    previousValue?: number;
    threshold?: number;
    trend: 'improving' | 'declining' | 'stable';
  };
  privacyLevel: 'anonymized' | 'aggregated' | 'personalized';
  processingTime?: number;
}

export interface OptimizedInterventionEngineConfig {
  productivityThreshold: number;
  procrastinationDaysThreshold: number;
  qualityThreshold: number;
  timeManagementThreshold: number;
  enableBatchProcessing: boolean;
  maxProcessingTimeMs: number;
  privacyOptimizationLevel: 'standard' | 'aggressive' | 'maximum';
}

export class OptimizedPrivacyAwareInterventionEngine {
  private interventionRepo: InterventionRepository;
  private analyticsRepo: LearningAnalyticsRepository;
  private documentRepo: DocumentRepository;
  private eventBus: EventBus;
  private config: OptimizedInterventionEngineConfig;
  
  // Optimized privacy components
  private consentEngine: OptimizedConsentEngine;
  private privacyOrchestrator: PrivacyPerformanceOrchestrator;
  private auditLogger: OptimizedPrivacyAuditLogger;
  
  // Performance caching
  private interventionCache = new Map<string, {
    data: InterventionAlert[];
    timestamp: number;
    ttl: number;
  }>();
  
  // Performance statistics
  private stats = {
    analyses: 0,
    cacheHits: 0,
    averageTime: 0,
    totalTime: 0,
    consentChecks: 0,
    privacyViolationsPrevented: 0
  };

  constructor(
    interventionRepo: InterventionRepository,
    analyticsRepo: LearningAnalyticsRepository,
    documentRepo: DocumentRepository,
    eventBus: EventBus,
    consentEngine: OptimizedConsentEngine,
    privacyOrchestrator: PrivacyPerformanceOrchestrator,
    auditLogger: OptimizedPrivacyAuditLogger,
    config: Partial<OptimizedInterventionEngineConfig> = {}
  ) {
    this.interventionRepo = interventionRepo;
    this.analyticsRepo = analyticsRepo;
    this.documentRepo = documentRepo;
    this.eventBus = eventBus;
    this.consentEngine = consentEngine;
    this.privacyOrchestrator = privacyOrchestrator;
    this.auditLogger = auditLogger;
    
    this.config = {
      productivityThreshold: config.productivityThreshold || 0.6,
      procrastinationDaysThreshold: config.procrastinationDaysThreshold || 3,
      qualityThreshold: config.qualityThreshold || 0.7,
      timeManagementThreshold: config.timeManagementThreshold || 2.0,
      enableBatchProcessing: config.enableBatchProcessing !== false,
      maxProcessingTimeMs: config.maxProcessingTimeMs || 50,
      privacyOptimizationLevel: config.privacyOptimizationLevel || 'standard'
    };
  }

  /**
   * High-performance intervention analysis with comprehensive privacy protection
   * Target: <50ms total processing time including privacy controls
   */
  async analyzeStudentWritingProgress(
    studentId: string, 
    privacyContext: PrivacyContext,
    courseId?: string, 
    timeframeDays: number = 7
  ): Promise<InterventionAlert[]> {
    const operationStart = performance.now();
    
    try {
      this.stats.analyses++;

      // Check cache first for performance (target: <1ms)
      const cacheKey = this.generateCacheKey(studentId, courseId, timeframeDays);
      const cached = this.interventionCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        this.stats.cacheHits++;
        console.log(`Intervention cache hit for ${studentId}`);
        return this.anonymizeInterventionsIfNeeded(cached.data, privacyContext);
      }

      // Fast consent verification (target: <2ms)
      const consentStart = performance.now();
      const requiredPurposes = [
        ConsentPurpose.EDUCATIONAL,
        ConsentPurpose.ANALYTICS,
        ConsentPurpose.IMPROVEMENT
      ];
      
      const consentAllowed = this.checkBatchConsent(studentId, requiredPurposes);
      this.stats.consentChecks++;
      
      if (!consentAllowed) {
        await this.logPrivacyEvent('intervention_access_denied', studentId, privacyContext);
        this.stats.privacyViolationsPrevented++;
        return [];
      }
      
      const consentDuration = performance.now() - consentStart;
      console.log(`Consent verification: ${consentDuration.toFixed(2)}ms`);

      // Log privacy-aware audit event (target: <5ms)
      await this.auditLogger.logAuditEvent({
        category: 'data_access',
        action: 'intervention_analysis',
        userId: studentId,
        resourceType: 'student_writing_data',
        resourceId: `analysis_${Date.now()}`,
        outcome: 'success',
        metadata: {
          courseId,
          timeframeDays,
          privacyLevel: privacyContext.privacyLevel
        },
        privacyLevel: privacyContext.privacyLevel,
        educationalJustification: 'Educational intervention analysis for student support'
      });

      // High-performance data retrieval with privacy orchestration
      const dataRetrievalStart = performance.now();
      
      const [studentAnalytics, documents] = await Promise.all([
        this.getPrivacyAwareAnalytics(studentId, privacyContext, timeframeDays),
        this.getPrivacyAwareDocuments(studentId, privacyContext, courseId)
      ]);
      
      const dataRetrievalDuration = performance.now() - dataRetrievalStart;
      console.log(`Data retrieval: ${dataRetrievalDuration.toFixed(2)}ms`);

      // Fast intervention analysis (target: <30ms)
      const analysisStart = performance.now();
      const interventions = await this.performOptimizedInterventionAnalysis(
        studentId,
        studentAnalytics,
        documents,
        privacyContext
      );
      const analysisDuration = performance.now() - analysisStart;

      // Cache the results for performance
      this.interventionCache.set(cacheKey, {
        data: interventions,
        timestamp: Date.now(),
        ttl: this.getCacheTTL(privacyContext.privacyLevel)
      });

      const totalDuration = performance.now() - operationStart;
      this.updatePerformanceStats(totalDuration);

      console.log(`Intervention analysis completed in ${totalDuration.toFixed(2)}ms (target: <50ms)`);
      
      // Add processing time to interventions for transparency
      const enrichedInterventions = interventions.map(intervention => ({
        ...intervention,
        processingTime: totalDuration
      }));

      return this.anonymizeInterventionsIfNeeded(enrichedInterventions, privacyContext);

    } catch (error) {
      const totalDuration = performance.now() - operationStart;
      
      await this.auditLogger.logAuditEvent({
        category: 'data_access',
        action: 'intervention_analysis',
        userId: studentId,
        resourceType: 'student_writing_data',
        outcome: 'failure',
        metadata: {
          error: error.message,
          duration: totalDuration
        }
      });

      console.error('Optimized intervention analysis failed:', error);
      throw error;
    }
  }

  /**
   * Batch intervention analysis for high throughput
   * Target: 10x performance improvement over individual analyses
   */
  async analyzeBatchStudentProgress(
    requests: Array<{
      studentId: string;
      privacyContext: PrivacyContext;
      courseId?: string;
      timeframeDays?: number;
    }>
  ): Promise<Array<{
    studentId: string;
    interventions: InterventionAlert[];
    success: boolean;
    error?: string;
  }>> {
    const operationStart = performance.now();
    
    try {
      // Batch consent checking for efficiency
      const consentRequests = requests.map(req => ({
        userId: req.studentId,
        purpose: ConsentPurpose.EDUCATIONAL | ConsentPurpose.ANALYTICS
      }));
      
      const consentResults = this.consentEngine.checkConsentBatch(consentRequests);
      
      // Process requests in parallel with consent verification
      const analysisPromises = requests.map(async (request, index) => {
        const studentId = request.studentId;
        
        try {
          // Check if consent was granted
          if (!consentResults[index]) {
            await this.logPrivacyEvent('batch_intervention_access_denied', studentId, request.privacyContext);
            return {
              studentId,
              interventions: [],
              success: false,
              error: 'Consent not granted'
            };
          }

          const interventions = await this.analyzeStudentWritingProgress(
            studentId,
            request.privacyContext,
            request.courseId,
            request.timeframeDays
          );

          return {
            studentId,
            interventions,
            success: true
          };

        } catch (error) {
          return {
            studentId,
            interventions: [],
            success: false,
            error: error.message
          };
        }
      });

      const results = await Promise.all(analysisPromises);
      
      const totalDuration = performance.now() - operationStart;
      const successfulAnalyses = results.filter(r => r.success).length;
      
      console.log(`Batch intervention analysis: ${successfulAnalyses}/${requests.length} successful in ${totalDuration.toFixed(2)}ms`);
      
      return results;

    } catch (error) {
      console.error('Batch intervention analysis failed:', error);
      throw error;
    }
  }

  /**
   * Real-time intervention monitoring with privacy protection
   */
  async monitorRealTimeInterventions(
    studentIds: string[],
    privacyContext: PrivacyContext
  ): Promise<Map<string, InterventionAlert[]>> {
    const monitoringStart = performance.now();
    const results = new Map<string, InterventionAlert[]>();

    try {
      // Batch processing for efficiency
      const batchRequests = studentIds.map(studentId => ({
        studentId,
        privacyContext,
        timeframeDays: 1 // Real-time monitoring focuses on recent activity
      }));

      const batchResults = await this.analyzeBatchStudentProgress(batchRequests);
      
      // Convert to map format
      for (const result of batchResults) {
        if (result.success) {
          results.set(result.studentId, result.interventions);
        }
      }

      const duration = performance.now() - monitoringStart;
      console.log(`Real-time monitoring: ${studentIds.length} students in ${duration.toFixed(2)}ms`);

      return results;

    } catch (error) {
      console.error('Real-time intervention monitoring failed:', error);
      throw error;
    }
  }

  /**
   * Check multiple consent purposes efficiently
   */
  private checkBatchConsent(userId: string, purposes: ConsentPurpose[]): boolean {
    // Use optimized consent engine for efficient batch checking
    return purposes.every(purpose => 
      this.consentEngine.checkConsent(userId, purpose)
    );
  }

  /**
   * Get privacy-aware analytics with optimized data access
   */
  private async getPrivacyAwareAnalytics(
    studentId: string,
    privacyContext: PrivacyContext,
    timeframeDays: number
  ): Promise<any> {
    const fromDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000);
    const toDate = new Date();

    try {
      return await this.analyticsRepo.getStudentAnalytics(
        studentId,
        privacyContext,
        { fromDate, toDate }
      );
    } catch (error) {
      console.error('Privacy-aware analytics retrieval failed:', error);
      return null;
    }
  }

  /**
   * Get privacy-aware documents with optimized access
   */
  private async getPrivacyAwareDocuments(
    studentId: string,
    privacyContext: PrivacyContext,
    courseId?: string
  ): Promise<any[]> {
    try {
      return await this.documentRepo.findByStudent(
        studentId,
        privacyContext,
        { courseId, limit: 50 }
      );
    } catch (error) {
      console.error('Privacy-aware document retrieval failed:', error);
      return [];
    }
  }

  /**
   * Perform optimized intervention analysis
   */
  private async performOptimizedInterventionAnalysis(
    studentId: string,
    analytics: any,
    documents: any[],
    privacyContext: PrivacyContext
  ): Promise<InterventionAlert[]> {
    const interventions: InterventionAlert[] = [];

    if (!analytics || !documents) {
      return interventions;
    }

    // Productivity analysis (optimized)
    if (analytics.productivity < this.config.productivityThreshold) {
      interventions.push({
        type: 'productivity',
        severity: analytics.productivity < 0.3 ? 'critical' : 'warning',
        title: 'Writing Productivity Concern',
        message: `Student's writing productivity is below optimal levels (${(analytics.productivity * 100).toFixed(1)}%)`,
        suggestedActions: [
          'Review writing process and identify bottlenecks',
          'Implement time management strategies',
          'Consider breaking assignments into smaller tasks'
        ],
        studentId,
        metrics: {
          currentValue: analytics.productivity,
          threshold: this.config.productivityThreshold,
          trend: analytics.productivityTrend || 'stable'
        },
        privacyLevel: this.determinePrivacyLevel(privacyContext)
      });
    }

    // Procrastination analysis (optimized)
    if (analytics.daysSinceLastSubmission > this.config.procrastinationDaysThreshold) {
      interventions.push({
        type: 'procrastination',
        severity: analytics.daysSinceLastSubmission > 7 ? 'critical' : 'warning',
        title: 'Potential Procrastination Pattern',
        message: `No recent writing activity detected (${analytics.daysSinceLastSubmission} days)`,
        suggestedActions: [
          'Check in with student about assignment progress',
          'Provide deadline reminders and scaffolding',
          'Offer writing support resources'
        ],
        studentId,
        metrics: {
          currentValue: analytics.daysSinceLastSubmission,
          threshold: this.config.procrastinationDaysThreshold,
          trend: 'declining'
        },
        privacyLevel: this.determinePrivacyLevel(privacyContext)
      });
    }

    // Quality analysis (optimized)
    if (analytics.averageQualityScore < this.config.qualityThreshold) {
      interventions.push({
        type: 'quality',
        severity: analytics.averageQualityScore < 0.5 ? 'critical' : 'warning',
        title: 'Writing Quality Below Expectations',
        message: `Recent submissions show quality concerns (${(analytics.averageQualityScore * 100).toFixed(1)}%)`,
        suggestedActions: [
          'Provide targeted feedback on writing techniques',
          'Recommend writing resources and tutorials',
          'Consider one-on-one writing support'
        ],
        studentId,
        metrics: {
          currentValue: analytics.averageQualityScore,
          threshold: this.config.qualityThreshold,
          trend: analytics.qualityTrend || 'stable'
        },
        privacyLevel: this.determinePrivacyLevel(privacyContext)
      });
    }

    return interventions;
  }

  /**
   * Anonymize interventions based on privacy context
   */
  private anonymizeInterventionsIfNeeded(
    interventions: InterventionAlert[],
    privacyContext: PrivacyContext
  ): InterventionAlert[] {
    if (privacyContext.privacyLevel === 'public' || privacyContext.privacyLevel === 'internal') {
      return interventions.map(intervention => ({
        ...intervention,
        studentId: OptimizedAnonymization.anonymize(intervention.studentId, 'student'),
        privacyLevel: 'anonymized'
      }));
    }

    return interventions;
  }

  /**
   * Determine privacy level for intervention
   */
  private determinePrivacyLevel(privacyContext: PrivacyContext): 'anonymized' | 'aggregated' | 'personalized' {
    switch (privacyContext.privacyLevel) {
      case 'public':
        return 'anonymized';
      case 'internal':
        return 'aggregated';
      default:
        return 'personalized';
    }
  }

  /**
   * Generate cache key for interventions
   */
  private generateCacheKey(studentId: string, courseId?: string, timeframeDays?: number): string {
    const userHash = OptimizedAnonymization.anonymize(studentId, 'user');
    const courseHash = courseId ? OptimizedAnonymization.anonymize(courseId, 'course') : 'all';
    return `intervention:${userHash}:${courseHash}:${timeframeDays || 7}`;
  }

  /**
   * Get cache TTL based on privacy level
   */
  private getCacheTTL(privacyLevel: string): number {
    switch (privacyLevel) {
      case 'public':
        return 60 * 60 * 1000; // 1 hour
      case 'internal':
        return 30 * 60 * 1000; // 30 minutes
      case 'confidential':
        return 15 * 60 * 1000; // 15 minutes
      default:
        return 5 * 60 * 1000; // 5 minutes
    }
  }

  /**
   * Log privacy event with optimized audit logger
   */
  private async logPrivacyEvent(
    action: string,
    studentId: string,
    privacyContext: PrivacyContext
  ): Promise<void> {
    await this.auditLogger.logAuditEvent({
      category: 'data_access',
      action,
      userId: studentId,
      resourceType: 'intervention_analysis',
      outcome: 'success',
      metadata: {
        privacyLevel: privacyContext.privacyLevel,
        purpose: privacyContext.purpose
      },
      educationalJustification: 'Privacy-aware intervention analysis audit'
    });
  }

  /**
   * Update performance statistics
   */
  private updatePerformanceStats(duration: number): void {
    this.stats.totalTime += duration;
    this.stats.averageTime = this.stats.totalTime / this.stats.analyses;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    analyses: number;
    cacheHitRate: number;
    averageTime: number;
    consentChecks: number;
    privacyViolationsPrevented: number;
    targetMetricsStatus: {
      averageTimeUnderTarget: boolean;
      cacheEffective: boolean;
      privacyCompliant: boolean;
    };
  } {
    return {
      analyses: this.stats.analyses,
      cacheHitRate: this.stats.analyses > 0 ? (this.stats.cacheHits / this.stats.analyses) * 100 : 0,
      averageTime: this.stats.averageTime,
      consentChecks: this.stats.consentChecks,
      privacyViolationsPrevented: this.stats.privacyViolationsPrevented,
      targetMetricsStatus: {
        averageTimeUnderTarget: this.stats.averageTime < this.config.maxProcessingTimeMs,
        cacheEffective: this.stats.analyses > 0 ? (this.stats.cacheHits / this.stats.analyses) > 0.3 : false,
        privacyCompliant: this.stats.privacyViolationsPrevented === 0 || 
                          (this.stats.privacyViolationsPrevented / this.stats.analyses) < 0.01
      }
    };
  }

  /**
   * Clear intervention cache
   */
  clearCache(): void {
    this.interventionCache.clear();
  }
}