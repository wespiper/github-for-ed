/**
 * Academic Integrity Repository Interface
 * Privacy-aware academic integrity monitoring with educational context
 */

import { BaseRepository } from './BaseRepository';
import { PrivacyContext } from '../../types/privacy';

export interface AcademicIntegrityAnalysis {
  id: string;
  studentId: string;
  assignmentId: string;
  documentId?: string;
  analysisType: 'ai_detection' | 'integrity_check' | 'educational_validation' | 'pattern_analysis';
  result: Record<string, any>;
  confidence: number;
  flags: string[];
  recommendations: string[];
  educationalValue: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIAssistanceLevel {
  id: string;
  studentId: string;
  assignmentId: string;
  contentSample: string; // Encrypted/redacted for privacy
  detectionMethod: string;
  assistanceLevel: 'none' | 'minimal' | 'moderate' | 'significant' | 'generated';
  confidence: number;
  patterns: string[];
  educationalContext: Record<string, any>;
  recommendations: string[];
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface IntegrityReport {
  id: string;
  studentId?: string; // Optional for aggregated reports
  courseId?: string;
  assignmentId?: string;
  reportType: 'individual' | 'class' | 'assignment' | 'course';
  timeframe: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalAnalyses: number;
    integrityScore: number;
    aiUsageFrequency: number;
    educationalAIUse: number;
    concernFlags: number;
  };
  insights: string[];
  recommendations: string[];
  privacyLevel: 'individual' | 'aggregated' | 'anonymous';
  generatedAt: Date;
}

export interface EducationalAIValidation {
  id: string;
  studentId: string;
  assignmentId: string;
  interactionType: 'question' | 'guidance' | 'feedback' | 'collaboration';
  aiContent: string; // Encrypted for privacy
  validationResult: 'approved' | 'flagged' | 'needs_review';
  educationalValue: number;
  boundaryCompliance: boolean;
  learningObjectives: string[];
  recommendations: string[];
  createdAt: Date;
}

export interface IntegritySearchOptions {
  studentId?: string;
  assignmentId?: string;
  courseId?: string;
  analysisType?: AcademicIntegrityAnalysis['analysisType'];
  dateRange?: {
    start: Date;
    end: Date;
  };
  confidenceThreshold?: number;
  flagsContain?: string[];
}

export interface IntegrityAnalytics {
  totalAnalyses: number;
  byAnalysisType: Record<string, number>;
  byAssistanceLevel: Record<string, number>;
  averageConfidence: number;
  integrityTrends: Array<{
    date: Date;
    integrityScore: number;
    aiUsageCount: number;
  }>;
  educationalMetrics: {
    validEducationalAIUse: number;
    boundaryViolations: number;
    averageEducationalValue: number;
  };
}

/**
 * Privacy-aware Academic Integrity Repository
 * Extends BaseRepository with integrity-specific methods
 */
export interface AcademicIntegrityRepository extends BaseRepository<AcademicIntegrityAnalysis> {
  /**
   * Detect AI assistance levels in student work
   */
  detectAIAssistanceLevels(
    studentId: string,
    assignmentId: string,
    content: string,
    privacyContext: PrivacyContext
  ): Promise<AIAssistanceLevel>;

  /**
   * Analyze academic integrity for a submission
   */
  analyzeAcademicIntegrity(
    studentId: string,
    assignmentId: string,
    submissionData: {
      content: string;
      metadata?: Record<string, any>;
      writingPatterns?: Record<string, any>;
    },
    privacyContext: PrivacyContext
  ): Promise<AcademicIntegrityAnalysis>;

  /**
   * Validate educational AI use
   */
  validateEducationalAIUse(
    studentId: string,
    assignmentId: string,
    aiInteraction: {
      type: string;
      content: string;
      context: Record<string, any>;
    },
    privacyContext: PrivacyContext
  ): Promise<EducationalAIValidation>;

  /**
   * Generate integrity reports with privacy controls
   */
  generateIntegrityReports(
    criteria: {
      reportType: IntegrityReport['reportType'];
      targetId?: string; // studentId, courseId, or assignmentId based on reportType
      timeframe: {
        start: Date;
        end: Date;
      };
      includeIndividualData?: boolean;
    },
    privacyContext: PrivacyContext
  ): Promise<IntegrityReport>;

  /**
   * Find integrity analyses with privacy filtering
   */
  findIntegrityAnalyses(
    options: IntegritySearchOptions,
    privacyContext: PrivacyContext
  ): Promise<AcademicIntegrityAnalysis[]>;

  /**
   * Get AI assistance levels by student
   */
  findAIAssistanceLevelsByStudent(
    studentId: string,
    timeframe: { start: Date; end: Date },
    privacyContext: PrivacyContext
  ): Promise<AIAssistanceLevel[]>;

  /**
   * Find educational AI validations
   */
  findEducationalAIValidations(
    criteria: {
      studentId?: string;
      assignmentId?: string;
      validationResult?: EducationalAIValidation['validationResult'];
      dateRange?: { start: Date; end: Date };
    },
    privacyContext: PrivacyContext
  ): Promise<EducationalAIValidation[]>;

  /**
   * Get integrity analytics with privacy preservation
   */
  getIntegrityAnalytics(
    criteria: {
      courseId?: string;
      assignmentId?: string;
      timeframe: { start: Date; end: Date };
      aggregationLevel: 'individual' | 'class' | 'course';
    },
    privacyContext: PrivacyContext
  ): Promise<IntegrityAnalytics>;

  /**
   * Find students needing integrity intervention
   */
  findStudentsNeedingIntervention(
    courseId: string,
    thresholds: {
      integrityScore?: number;
      aiUsageFrequency?: number;
      boundaryViolations?: number;
    },
    privacyContext: PrivacyContext
  ): Promise<Array<{
    studentId: string;
    integrityScore: number;
    concernFlags: string[];
    recommendations: string[];
    lastAnalysis: Date;
  }>>;

  /**
   * Track integrity patterns over time
   */
  trackIntegrityPatterns(
    studentId: string,
    timeframe: { start: Date; end: Date },
    privacyContext: PrivacyContext
  ): Promise<{
    trend: 'improving' | 'stable' | 'declining';
    integrityScores: Array<{
      date: Date;
      score: number;
      analysis: string;
    }>;
    aiUsagePattern: Array<{
      date: Date;
      level: string;
      educational: boolean;
    }>;
    recommendations: string[];
  }>;

  /**
   * Validate writing consistency for integrity analysis
   */
  analyzeWritingConsistency(
    studentId: string,
    submissionHistory: Array<{
      assignmentId: string;
      content: string;
      timestamp: Date;
    }>,
    privacyContext: PrivacyContext
  ): Promise<{
    consistencyScore: number;
    anomalies: Array<{
      assignmentId: string;
      anomalyType: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
    recommendations: string[];
  }>;

  /**
   * Create integrity alert for educator notification
   */
  createIntegrityAlert(
    alert: {
      studentId: string;
      assignmentId: string;
      alertType: 'ai_detection' | 'integrity_concern' | 'boundary_violation';
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      recommendations: string[];
      evidence: Record<string, any>;
    },
    privacyContext: PrivacyContext
  ): Promise<{
    id: string;
    created: boolean;
    notificationSent: boolean;
  }>;

  /**
   * Get integrity summary for dashboard
   */
  getIntegritySummary(
    targetId: string,
    targetType: 'student' | 'assignment' | 'course',
    timeframe: { start: Date; end: Date },
    privacyContext: PrivacyContext
  ): Promise<{
    overallScore: number;
    totalAnalyses: number;
    alerts: {
      total: number;
      bySeverity: Record<string, number>;
      recent: Array<{
        type: string;
        severity: string;
        date: Date;
        resolved: boolean;
      }>;
    };
    trends: {
      integrityTrend: 'improving' | 'stable' | 'declining';
      aiUsageTrend: 'decreasing' | 'stable' | 'increasing';
      educationalValueTrend: 'improving' | 'stable' | 'declining';
    };
    recommendations: string[];
  }>;
}