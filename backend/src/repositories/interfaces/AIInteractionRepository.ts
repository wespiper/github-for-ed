import { AIInteractionLog, ReflectionAnalysis, User, Assignment } from '@prisma/client';
import { BaseRepository } from './BaseRepository';

/**
 * AI Interaction with related data
 */
export type AIInteractionWithRelations = AIInteractionLog & {
  student?: User;
  assignment?: Assignment;
  reflectionAnalyses?: ReflectionAnalysis[];
};

/**
 * AI Interaction Repository Interface
 * Handles AI interaction logging and analytics
 */
export interface AIInteractionRepository extends BaseRepository<AIInteractionLog> {
  /**
   * Find interactions by student
   */
  findByStudentId(
    studentId: string,
    timeframe?: { start: Date; end: Date }
  ): Promise<AIInteractionLog[]>;

  /**
   * Find interactions by assignment
   */
  findByAssignmentId(
    assignmentId: string,
    timeframe?: { start: Date; end: Date }
  ): Promise<AIInteractionLog[]>;

  /**
   * Find interactions by assistance type
   */
  findByAssistanceType(
    assistanceType: string,
    courseId?: string,
    timeframe?: { start: Date; end: Date }
  ): Promise<AIInteractionLog[]>;

  /**
   * Get student's AI usage pattern analysis
   */
  getStudentUsagePattern(
    studentId: string,
    timeframe: { start: Date; end: Date }
  ): Promise<{
    totalInteractions: number;
    assistanceTypes: Record<string, number>;
    writingStages: Record<string, number>;
    reflectionCompletion: {
      completed: number;
      pending: number;
      averageQuality: number;
    };
    usageByDay: Array<{
      date: Date;
      interactionCount: number;
      averageQuality: number;
    }>;
    dependencyIndicators: {
      frequencyScore: number; // 0-100, higher = more dependent
      qualityScore: number;   // 0-100, higher = better reflections
      independenceScore: number; // 0-100, higher = more independent
    };
  } | null>;

  /**
   * Find interactions requiring reflection review
   */
  findPendingReflections(
    assignmentId?: string,
    studentId?: string
  ): Promise<(AIInteractionLog & {
    student: User;
    assignment: Assignment;
  })[]>;

  /**
   * Find high-frequency AI users
   */
  findHighFrequencyUsers(
    courseId: string,
    threshold: number, // interactions per week
    timeframe: { start: Date; end: Date }
  ): Promise<Array<{
    studentId: string;
    student: User;
    interactionCount: number;
    averageQuality: number;
    lastInteraction: Date;
  }>>;

  /**
   * Get assignment AI usage analytics
   */
  getAssignmentAnalytics(assignmentId: string): Promise<{
    totalInteractions: number;
    uniqueStudents: number;
    assistanceTypeDistribution: Record<string, number>;
    writingStageDistribution: Record<string, number>;
    reflectionMetrics: {
      completionRate: number;
      averageQuality: number;
      qualityDistribution: Record<string, number>;
    };
    timePatterns: {
      hourlyDistribution: number[];
      dailyDistribution: number[];
      peakUsageTimes: string[];
    };
    educationalEffectiveness: {
      studentsShowingImprovement: number;
      averageIndependenceGrowth: number;
      successfulInterventions: number;
    };
  } | null>;

  /**
   * Log new AI interaction
   */
  logInteraction(data: {
    studentId: string;
    assignmentId: string;
    assistanceType: string;
    writingStage: string;
    questionText: string;
    questionsGenerated?: number;
    educationallySound: boolean;
    metadata?: any;
  }): Promise<AIInteractionLog>;

  /**
   * Update reflection completion status
   */
  markReflectionCompleted(
    interactionId: string,
    reflectionData: {
      qualityScore: number;
      submittedAt: Date;
      analysisId?: string;
    }
  ): Promise<AIInteractionLog>;

  /**
   * Find interactions by educational effectiveness
   */
  findByEducationalEffectiveness(
    effectiveness: 'high' | 'medium' | 'low',
    timeframe?: { start: Date; end: Date }
  ): Promise<AIInteractionLog[]>;

  /**
   * Get course-wide AI usage trends
   */
  getCourseUsageTrends(
    courseId: string,
    timeframe: { start: Date; end: Date }
  ): Promise<{
    totalInteractions: number;
    trendsOverTime: Array<{
      date: Date;
      interactionCount: number;
      reflectionQuality: number;
      educationalSoundness: number;
    }>;
    studentEngagement: {
      activeStudents: number;
      averageInteractionsPerStudent: number;
      highQualityReflectors: number;
    };
    concerningPatterns: Array<{
      type: 'high_frequency' | 'low_quality_reflections' | 'gaming_system';
      affectedStudents: string[];
      description: string;
      severity: 'low' | 'medium' | 'high';
    }>;
  }>;

  /**
   * Find students showing improvement in independence
   */
  findStudentsShowingIndependence(
    courseId: string,
    timeframe: { start: Date; end: Date }
  ): Promise<Array<{
    studentId: string;
    student: User;
    improvementMetrics: {
      frequencyReduction: number; // percentage decrease
      qualityIncrease: number;    // percentage increase
      independenceScore: number;  // 0-100
    };
    timeline: Array<{
      date: Date;
      interactionCount: number;
      averageQuality: number;
    }>;
  }>>;

  /**
   * Get educator insights for AI coaching
   */
  getEducatorInsights(
    instructorId: string,
    courseId?: string
  ): Promise<{
    overview: {
      totalStudents: number;
      aiActiveStudents: number;
      averageUsageRate: number;
      concerningStudents: number;
    };
    recommendations: Array<{
      type: 'boundary_adjustment' | 'student_intervention' | 'assignment_modification';
      priority: 'low' | 'medium' | 'high';
      description: string;
      affectedEntities: string[]; // student IDs or assignment IDs
      actionItems: string[];
    }>;
    successStories: Array<{
      studentId: string;
      improvement: string;
      timeframe: string;
    }>;
    trendsAndPatterns: {
      usageGrowth: number; // percentage change
      qualityImprovement: number;
      independenceGrowth: number;
      mostEffectiveStrategies: string[];
    };
  }>;

  /**
   * Generate AI usage report for compliance
   */
  generateComplianceReport(
    timeframe: { start: Date; end: Date },
    courseId?: string
  ): Promise<{
    period: { start: Date; end: Date };
    summary: {
      totalInteractions: number;
      totalStudents: number;
      educationallySoundPercentage: number;
      reflectionCompletionRate: number;
    };
    breakdown: {
      byAssistanceType: Record<string, number>;
      byWritingStage: Record<string, number>;
      byEducationalSoundness: Record<string, number>;
    };
    qualityMetrics: {
      averageReflectionQuality: number;
      highQualityInteractions: number;
      interventionsTriggered: number;
    };
    studentOutcomes: {
      studentsShowingIndependence: number;
      studentsNeedingSupport: number;
      improvementTrends: string[];
    };
  }>;
}