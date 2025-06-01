/**
 * Base repository interfaces for data access layer
 */

import { 
  WritingSession, 
  Document, 
  Assignment, 
  User,
  Reflection,
  ReflectionAnalysis,
  StudentProfile,
  AIInteractionLog,
  Prisma
} from '@prisma/client';

/**
 * Base repository interface with common CRUD operations
 */
export interface BaseRepository<T, CreateDTO, UpdateDTO> {
  findById(id: string): Promise<T | null>;
  findMany(filter?: any): Promise<T[]>;
  create(data: CreateDTO): Promise<T>;
  update(id: string, data: UpdateDTO): Promise<T>;
  delete(id: string): Promise<boolean>;
}

/**
 * Writing session repository interface
 */
export interface WritingSessionRepository {
  findById(id: string): Promise<WritingSession | null>;
  findByUser(userId: string, options?: {
    assignmentId?: string;
    documentId?: string;
    startDate?: Date;
    endDate?: Date;
    includeDocument?: boolean;
  }): Promise<WritingSession[]>;
  findByAssignment(assignmentId: string, userId?: string): Promise<WritingSession[]>;
  findByCourse(courseId: string, userId?: string, timeframeDays?: number): Promise<WritingSession[]>;
  create(data: {
    userId: string;
    documentId: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    activity?: any;
  }): Promise<WritingSession>;
  update(id: string, data: Prisma.WritingSessionUpdateInput): Promise<WritingSession>;
  getSessionStats(sessionIds: string[]): Promise<{
    totalDuration: number;
    totalWordsWritten: number;
    totalWordsDeleted: number;
    averageProductivity: number;
  }>;
}

/**
 * Document repository interface
 */
export interface DocumentRepository {
  findById(id: string): Promise<Document | null>;
  findByAssignment(assignmentId: string, userId?: string): Promise<Document[]>;
  findByUser(userId: string): Promise<Document[]>;
  create(data: {
    userId: string;
    assignmentId: string;
    title: string;
    content: string;
    version?: number;
  }): Promise<Document>;
  update(id: string, data: Partial<Document>): Promise<Document>;
  createVersion(documentId: string, content: string): Promise<Document>;
  getVersionHistory(documentId: string): Promise<Document[]>;
}

/**
 * Student profile repository interface
 */
export interface StudentProfileRepository {
  findByUserId(userId: string): Promise<StudentProfile | null>;
  create(data: {
    userId: string;
    learningPreferences?: any;
    writingPatterns?: any;
    strengthsWeaknesses?: any;
  }): Promise<StudentProfile>;
  update(userId: string, data: Partial<StudentProfile>): Promise<StudentProfile>;
  updateLearningMetrics(userId: string, metrics: any): Promise<StudentProfile>;
}

/**
 * Assignment repository interface
 */
export interface AssignmentRepository {
  findById(id: string): Promise<Assignment | null>;
  findByCourse(courseId: string): Promise<Assignment[]>;
  findByStudent(studentId: string, courseId?: string): Promise<Assignment[]>;
  getWithSessions(assignmentId: string, userId?: string): Promise<Assignment & {
    sessions: WritingSession[];
  } | null>;
  create(data: Prisma.AssignmentCreateInput): Promise<Assignment>;
  update(id: string, data: Prisma.AssignmentUpdateInput): Promise<Assignment>;
  delete(id: string): Promise<void>;
  count(where?: Prisma.AssignmentWhereInput): Promise<number>;
  updateAIBoundaries(assignmentId: string, boundaries: any): Promise<Assignment>;
  findByCourseId(courseId: string): Promise<Assignment[]>;
  findWithAIAnalytics(assignmentId: string): Promise<Assignment & {
    analytics: any;
  } | null>;
}

/**
 * Reflection repository interface for student reflection entries
 */
export interface ReflectionRepository {
  findById(id: string): Promise<Reflection | null>;
  findByUser(userId: string, options?: {
    assignmentId?: string;
    documentId?: string;
    type?: string;
    limit?: number;
  }): Promise<Reflection[]>;
  findByAssignment(assignmentId: string, userId?: string): Promise<Reflection[]>;
  create(data: {
    userId: string;
    assignmentId?: string;
    documentId?: string;
    type: string;
    content: string;
    metadata?: any;
    stage?: string;
  }): Promise<Reflection>;
  update(id: string, data: Prisma.ReflectionUpdateInput): Promise<Reflection>;
  delete(id: string): Promise<void>;
  getReflectionStats(userId: string, assignmentId?: string): Promise<{
    totalReflections: number;
    averageWordCount: number;
    reflectionsByType: Record<string, number>;
  }>;
}

/**
 * Reflection Analysis repository interface for quality assessment
 */
export interface ReflectionAnalysisRepository {
  findById(id: string): Promise<ReflectionAnalysis | null>;
  findByStudent(studentId: string, options?: {
    assignmentId?: string;
    limit?: number;
    minQualityScore?: number;
  }): Promise<ReflectionAnalysis[]>;
  findByAssignment(assignmentId: string, options?: {
    minQualityScore?: number;
    limit?: number;
  }): Promise<ReflectionAnalysis[]>;
  create(data: {
    studentId: string;
    assignmentId: string;
    aiInteractionId: string;
    reflectionText: string;
    depthScore: number;
    reasoningChains: number;
    abstractionLevel: number;
    evidenceOfThinking: string[];
    selfAwarenessScore: number;
    recognizesGaps: boolean;
    questionsAssumptions: boolean;
    identifiesLearningProcess: boolean;
    articulatesStruggle: boolean;
    criticalThinkingScore: number;
    challengesAIPrompts: boolean;
    offersAlternatives: boolean;
    evaluatesPerspectives: boolean;
    synthesizesIdeas: boolean;
    growthMindsetScore: number;
    focusOnLearning: boolean;
    embracesChallenge: boolean;
    seeksImprovement: boolean;
    overallQualityScore: number;
    authenticityScore: number;
    progressiveAccessLevel: string;
    recommendations: string[];
  }): Promise<ReflectionAnalysis>;
  update(id: string, data: Prisma.ReflectionAnalysisUpdateInput): Promise<ReflectionAnalysis>;
  getLatestAnalysis(studentId: string, assignmentId?: string): Promise<ReflectionAnalysis | null>;
  getQualityTrends(studentId: string, assignmentId?: string): Promise<{
    trend: 'improving' | 'stable' | 'declining';
    averageQuality: number;
    dataPoints: Array<{
      date: Date;
      qualityScore: number;
      authenticityScore: number;
    }>;
  }>;
  getClassAnalytics(assignmentId: string): Promise<{
    averageQuality: number;
    qualityDistribution: Record<string, number>;
    accessLevelDistribution: Record<string, number>;
    topStrengths: string[];
    commonGrowthAreas: string[];
  }>;
}

/**
 * Student repository interface for user management
 */
export interface StudentRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByCourse(courseId: string): Promise<User[]>;
  create(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role?: 'student' | 'educator' | 'admin';
  }): Promise<User>;
  update(id: string, data: Prisma.UserUpdateInput): Promise<User>;
  delete(id: string): Promise<void>;
  getStudentStats(studentId: string): Promise<{
    totalCourses: number;
    totalAssignments: number;
    completedAssignments: number;
    averageReflectionQuality: number;
  }>;
}

/**
 * AI Interaction Log repository interface
 */
export interface AIInteractionRepository {
  findById(id: string): Promise<AIInteractionLog | null>;
  findByStudent(studentId: string, options?: {
    assignmentId?: string;
    limit?: number;
    assistanceType?: string;
  }): Promise<AIInteractionLog[]>;
  findByAssignment(assignmentId: string, options?: {
    limit?: number;
    educationallySound?: boolean;
  }): Promise<AIInteractionLog[]>;
  create(data: {
    studentId: string;
    assignmentId?: string;
    assistanceType: string;
    questionsGenerated?: number;
    educationallySound: boolean;
    writingStage: string;
    questionText?: string;
    responseId: string;
    metadata?: any;
  }): Promise<AIInteractionLog>;
  update(id: string, data: Prisma.AIInteractionLogUpdateInput): Promise<AIInteractionLog>;
  getInteractionStats(studentId: string, assignmentId?: string): Promise<{
    totalInteractions: number;
    educationallySoundCount: number;
    averageQuestionsPerInteraction: number;
    reflectionCompletionRate: number;
    mostCommonAssistanceTypes: Array<{ type: string; count: number }>;
  }>;
  getBoundaryMetrics(assignmentId: string): Promise<{
    totalRequests: number;
    approvedRequests: number;
    averageResponseQuality: number;
    studentEngagementLevels: Record<string, number>;
  }>;
}