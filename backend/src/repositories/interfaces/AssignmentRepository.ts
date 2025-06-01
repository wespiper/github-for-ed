import { Assignment, AssignmentSubmission, Course, User, AIInteractionLog } from '@prisma/client';
import { BaseRepository } from './BaseRepository';

/**
 * Assignment with related data
 */
export type AssignmentWithRelations = Assignment & {
  course?: Course;
  instructor?: User;
  submissions?: AssignmentSubmission[];
  aiInteractionLogs?: AIInteractionLog[];
};

/**
 * Assignment Repository Interface
 * Handles assignment-specific queries and operations
 */
export interface AssignmentRepository extends BaseRepository<Assignment> {
  /**
   * Find assignments by course
   */
  findByCourseId(courseId: string): Promise<Assignment[]>;

  /**
   * Find assignments by instructor
   */
  findByInstructorId(instructorId: string): Promise<Assignment[]>;

  /**
   * Find assignment with all submissions
   */
  findByIdWithSubmissions(assignmentId: string): Promise<(Assignment & {
    submissions: AssignmentSubmission[];
    course: Course;
  }) | null>;

  /**
   * Find assignments with AI interaction data
   */
  findWithAIAnalytics(courseId?: string): Promise<(Assignment & {
    aiInteractionLogs: AIInteractionLog[];
    submissions: AssignmentSubmission[];
  })[]>;

  /**
   * Find assignments by due date range
   */
  findByDueDateRange(
    start: Date,
    end: Date,
    courseId?: string
  ): Promise<Assignment[]>;

  /**
   * Find assignments with specific AI settings
   */
  findByAISettings(
    settingsCriteria: {
      aiEnabled?: boolean;
      boundaryLevel?: string;
      assistanceTypes?: string[];
    },
    courseId?: string
  ): Promise<Assignment[]>;

  /**
   * Get assignment completion statistics
   */
  getCompletionStats(assignmentId: string): Promise<{
    assignment: Assignment;
    totalStudents: number;
    submittedCount: number;
    draftCount: number;
    notStartedCount: number;
    averageWordCount: number;
    averageTimeSpent: number;
    aiUsageStats: {
      studentsUsingAI: number;
      totalAIInteractions: number;
      averageInteractionsPerStudent: number;
    };
  } | null>;

  /**
   * Find assignments requiring educator attention
   */
  findRequiringAttention(instructorId: string): Promise<(Assignment & {
    submissions: Array<AssignmentSubmission & {
      aiInteractionLogs: AIInteractionLog[];
    }>;
  })[]>;

  /**
   * Get assignment AI boundary recommendations
   */
  getAIBoundaryAnalysis(assignmentId: string): Promise<{
    assignment: Assignment;
    currentSettings: any;
    studentUsagePatterns: Array<{
      studentId: string;
      aiUsageCount: number;
      reflectionQuality: number;
      independenceLevel: string;
    }>;
    recommendations: Array<{
      type: 'increase_restrictions' | 'reduce_restrictions' | 'modify_requirements';
      reason: string;
      affectedStudents: string[];
      impact: string;
    }>;
  } | null>;

  /**
   * Find assignments by learning objectives
   */
  findByLearningObjectives(
    objectives: string[],
    courseId?: string
  ): Promise<Assignment[]>;

  /**
   * Get assignment performance analytics
   */
  getPerformanceAnalytics(
    assignmentId: string,
    timeframe?: { start: Date; end: Date }
  ): Promise<{
    assignment: Assignment;
    submissionMetrics: {
      onTimeSubmissions: number;
      lateSubmissions: number;
      averageWordsPerSubmission: number;
      qualityDistribution: Record<string, number>;
    };
    aiUsageMetrics: {
      totalInteractions: number;
      uniqueStudentsUsingAI: number;
      averageInteractionsPerStudent: number;
      mostCommonAssistanceTypes: Array<{ type: string; count: number }>;
    };
    learningOutcomes: {
      reflectionQualityScore: number;
      independenceTrend: 'increasing' | 'stable' | 'decreasing';
      skillDevelopmentIndicators: string[];
    };
  } | null>;

  /**
   * Find assignments similar to a given assignment
   */
  findSimilarAssignments(
    assignmentId: string,
    similarity: 'learning_objectives' | 'ai_settings' | 'structure'
  ): Promise<Assignment[]>;

  /**
   * Update assignment AI boundaries
   */
  updateAIBoundaries(
    assignmentId: string,
    boundaries: {
      enabled: boolean;
      globalBoundary: string;
      allowedAssistanceTypes: string[];
      stageSpecificSettings: any[];
      requireReflection: boolean;
      reflectionPrompts: string[];
    }
  ): Promise<Assignment>;

  /**
   * Clone assignment with modifications
   */
  cloneAssignment(
    sourceAssignmentId: string,
    targetCourseId: string,
    modifications: Partial<Assignment>
  ): Promise<Assignment>;

  /**
   * Get assignment timeline and milestones
   */
  getTimeline(assignmentId: string): Promise<{
    assignment: Assignment;
    timeline: Array<{
      date: Date;
      event: 'created' | 'published' | 'due' | 'closed';
      description: string;
    }>;
    submissions: Array<{
      studentId: string;
      submittedAt: Date | null;
      status: string;
      wordCount: number;
    }>;
    aiActivity: Array<{
      date: Date;
      studentId: string;
      interactionCount: number;
      assistanceType: string;
    }>;
  } | null>;
}