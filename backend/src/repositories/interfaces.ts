/**
 * Base repository interfaces for data access layer with privacy enhancement
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

import { 
  PrivacyContext, 
  PrivacyMetadata, 
  AuditEntry, 
  AnonymizedData,
  ConsentRecord,
  PrivacyPreservedInsights,
  DocumentWithPrivacy,
  ClassReflectionInsights,
  AnalyticsCriteria,
  InsightCriteria
} from '../types/privacy';

/**
 * Base repository interface with privacy-aware CRUD operations
 */
export interface BaseRepository<T, CreateDTO, UpdateDTO> {
  findById(id: string, context: PrivacyContext): Promise<T | null>;
  findMany(filter: any, context: PrivacyContext): Promise<T[]>;
  create(data: CreateDTO, context: PrivacyContext): Promise<T>;
  update(id: string, data: UpdateDTO, context: PrivacyContext): Promise<T>;
  delete(id: string, context: PrivacyContext): Promise<boolean>;
}

/**
 * Privacy-aware repository interface with audit trail
 */
export interface PrivacyAwareRepository<T, CreateDTO, UpdateDTO> extends BaseRepository<T, CreateDTO, UpdateDTO> {
  /** Find with privacy metadata included */
  findByIdWithPrivacy(id: string, context: PrivacyContext): Promise<(T & { privacyMetadata: PrivacyMetadata }) | null>;
  
  /** Find with consent validation */
  findByIdWithConsent(id: string, context: PrivacyContext): Promise<T | null>;
  
  /** Get anonymized analytics data */
  getAnonymizedAnalytics(criteria: AnalyticsCriteria, context: PrivacyContext): Promise<AnonymizedData>;
  
  /** Audit trail for this repository */
  getAuditTrail(entityId: string, context: PrivacyContext): Promise<AuditEntry[]>;
}

/**
 * Audit repository interface for tracking data access
 */
export interface AuditRepository {
  /** Log a data access operation */
  logAccess(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<AuditEntry>;
  
  /** Get audit trail for a specific entity */
  getEntityAuditTrail(entityType: string, entityId: string, context: PrivacyContext): Promise<AuditEntry[]>;
  
  /** Get audit trail for a user */
  getUserAuditTrail(userId: string, context: PrivacyContext): Promise<AuditEntry[]>;
  
  /** Get audit summary for compliance reporting */
  getAuditSummary(dateRange: { start: Date; end: Date }, context: PrivacyContext): Promise<{
    totalAccesses: number;
    deniedAccesses: number;
    accessesByType: Record<string, number>;
    accessesByUser: Record<string, number>;
  }>;
  
  /** Search audit entries */
  searchAuditEntries(criteria: {
    entityType?: string;
    operation?: string;
    result?: string;
    userId?: string;
    dateRange?: { start: Date; end: Date };
  }, context: PrivacyContext): Promise<AuditEntry[]>;
}

/**
 * Consent repository interface for managing student consent
 */
export interface ConsentRepository {
  /** Get consent record for a student and consent type */
  getConsent(studentId: string, consentType: string, context: PrivacyContext): Promise<ConsentRecord | null>;
  
  /** Get all consent records for a student */
  getStudentConsents(studentId: string, context: PrivacyContext): Promise<ConsentRecord[]>;
  
  /** Record new consent */
  recordConsent(consent: Omit<ConsentRecord, 'id' | 'timestamp'>): Promise<ConsentRecord>;
  
  /** Update consent status */
  updateConsentStatus(consentId: string, status: ConsentRecord['status'], context: PrivacyContext): Promise<ConsentRecord>;
  
  /** Check if consent is valid and current */
  isConsentValid(studentId: string, consentType: string, context: PrivacyContext): Promise<boolean>;
  
  /** Get consent statistics */
  getConsentStatistics(context: PrivacyContext): Promise<{
    totalStudents: number;
    consentsByType: Record<string, { granted: number; denied: number; pending: number }>;
    recentChanges: ConsentRecord[];
  }>;
}

/**
 * Writing session repository interface with privacy awareness
 */
export interface WritingSessionRepository extends PrivacyAwareRepository<WritingSession, any, any> {
  findByUser(userId: string, options: {
    assignmentId?: string;
    documentId?: string;
    startDate?: Date;
    endDate?: Date;
    includeDocument?: boolean;
  }, context: PrivacyContext): Promise<WritingSession[]>;
  
  findByAssignment(assignmentId: string, context: PrivacyContext, userId?: string): Promise<WritingSession[]>;
  
  findByCourse(courseId: string, context: PrivacyContext, userId?: string, timeframeDays?: number): Promise<WritingSession[]>;
  
  createSession(data: {
    userId: string;
    documentId: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    activity?: any;
  }, context: PrivacyContext): Promise<WritingSession>;
  
  updateSession(id: string, data: Prisma.WritingSessionUpdateInput, context: PrivacyContext): Promise<WritingSession>;
  
  getSessionStats(sessionIds: string[], context: PrivacyContext): Promise<{
    totalDuration: number;
    totalWordsWritten: number;
    totalWordsDeleted: number;
    averageProductivity: number;
  }>;
  
  /** Get privacy-preserving aggregated session analytics */
  getAggregatedSessionAnalytics(criteria: AnalyticsCriteria, context: PrivacyContext): Promise<AnonymizedData>;
}

/**
 * Document repository interface with content protection
 */
export interface DocumentRepository extends PrivacyAwareRepository<Document, any, any> {
  findByAssignment(assignmentId: string, context: PrivacyContext, userId?: string): Promise<Document[]>;
  
  findByUser(userId: string, context: PrivacyContext): Promise<Document[]>;
  
  /** Find document with privacy metadata */
  findByIdWithPrivacy(id: string, context: PrivacyContext): Promise<DocumentWithPrivacy | null>;
  
  createDocument(data: {
    userId: string;
    assignmentId: string;
    title: string;
    content: string;
    version?: number;
    sensitivityLevel?: 'public' | 'restricted' | 'private' | 'highly_sensitive';
  }, context: PrivacyContext): Promise<Document>;
  
  updateDocument(id: string, data: Partial<Document>, context: PrivacyContext): Promise<Document>;
  
  createVersion(documentId: string, content: string, context: PrivacyContext): Promise<Document>;
  
  getVersionHistory(documentId: string, context: PrivacyContext): Promise<Document[]>;
  
  /** Get redacted document content based on access level */
  getRedactedDocument(id: string, context: PrivacyContext): Promise<DocumentWithPrivacy | null>;
  
  /** Content filtering based on access rights */
  getFilteredContent(id: string, accessLevel: 'full' | 'educator' | 'anonymous', context: PrivacyContext): Promise<string>;
}

/**
 * Student profile repository interface with privacy controls
 */
export interface StudentProfileRepository extends PrivacyAwareRepository<StudentProfile, any, any> {
  findByUserId(userId: string, context: PrivacyContext): Promise<StudentProfile | null>;
  
  createProfile(data: {
    userId: string;
    learningPreferences?: any;
    writingPatterns?: any;
    strengthsWeaknesses?: any;
  }, context: PrivacyContext): Promise<StudentProfile>;
  
  updateProfile(userId: string, data: Partial<StudentProfile>, context: PrivacyContext): Promise<StudentProfile>;
  
  updateLearningMetrics(userId: string, metrics: any, context: PrivacyContext): Promise<StudentProfile>;
  
  /** Get anonymized learning patterns for educator insights */
  getAnonymizedLearningPatterns(criteria: AnalyticsCriteria, context: PrivacyContext): Promise<AnonymizedData>;
}

/**
 * Assignment repository interface with educator access validation
 */
export interface AssignmentRepository extends PrivacyAwareRepository<Assignment, any, any> {
  findByCourse(courseId: string, context: PrivacyContext): Promise<Assignment[]>;
  
  findByStudent(studentId: string, context: PrivacyContext, courseId?: string): Promise<Assignment[]>;
  
  getWithSessions(assignmentId: string, context: PrivacyContext, userId?: string): Promise<Assignment & {
    sessions: WritingSession[];
  } | null>;
  
  createAssignment(data: Prisma.AssignmentCreateInput, context: PrivacyContext): Promise<Assignment>;
  
  updateAssignment(id: string, data: Prisma.AssignmentUpdateInput, context: PrivacyContext): Promise<Assignment>;
  
  deleteAssignment(id: string, context: PrivacyContext): Promise<void>;
  
  count(where: Prisma.AssignmentWhereInput, context: PrivacyContext): Promise<number>;
  
  updateAIBoundaries(assignmentId: string, boundaries: any, context: PrivacyContext): Promise<Assignment>;
  
  findByCourseId(courseId: string, context: PrivacyContext): Promise<Assignment[]>;
  
  findWithAIAnalytics(assignmentId: string, context: PrivacyContext): Promise<Assignment & {
    analytics: any;
  } | null>;
  
  /** Get privacy-preserving assignment analytics */
  getAssignmentAnalytics(assignmentId: string, context: PrivacyContext): Promise<PrivacyPreservedInsights>;
}

/**
 * Reflection repository interface with privacy controls
 */
export interface ReflectionRepository extends PrivacyAwareRepository<Reflection, any, any> {
  findByUser(userId: string, options: {
    assignmentId?: string;
    documentId?: string;
    type?: string;
    limit?: number;
  }, context: PrivacyContext): Promise<Reflection[]>;
  
  findByAssignment(assignmentId: string, context: PrivacyContext, userId?: string): Promise<Reflection[]>;
  
  /** Store reflection with privacy metadata */
  storeReflection(data: {
    userId: string;
    assignmentId?: string;
    documentId?: string;
    type: string;
    content: string;
    metadata?: any;
    stage?: string;
  }, context: PrivacyContext): Promise<Reflection>;
  
  updateReflection(id: string, data: Prisma.ReflectionUpdateInput, context: PrivacyContext): Promise<Reflection>;
  
  deleteReflection(id: string, context: PrivacyContext): Promise<void>;
  
  getReflectionStats(userId: string, context: PrivacyContext, assignmentId?: string): Promise<{
    totalReflections: number;
    averageWordCount: number;
    reflectionsByType: Record<string, number>;
  }>;
  
  /** Get reflections for educator with appropriate access controls */
  getReflectionsForEducator(studentId: string, educatorContext: PrivacyContext): Promise<Reflection[]>;
  
  /** Get anonymized class reflection insights */
  getAnonymizedClassInsights(classId: string, context: PrivacyContext): Promise<ClassReflectionInsights>;
}

/**
 * Reflection Analysis repository interface with privacy protection
 */
export interface ReflectionAnalysisRepository extends PrivacyAwareRepository<ReflectionAnalysis, any, any> {
  findByStudent(studentId: string, options: {
    assignmentId?: string;
    limit?: number;
    minQualityScore?: number;
  }, context: PrivacyContext): Promise<ReflectionAnalysis[]>;
  
  findByAssignment(assignmentId: string, options: {
    minQualityScore?: number;
    limit?: number;
  }, context: PrivacyContext): Promise<ReflectionAnalysis[]>;
  createAnalysis(data: {
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
  }, context: PrivacyContext): Promise<ReflectionAnalysis>;
  
  updateAnalysis(id: string, data: Prisma.ReflectionAnalysisUpdateInput, context: PrivacyContext): Promise<ReflectionAnalysis>;
  
  getLatestAnalysis(studentId: string, context: PrivacyContext, assignmentId?: string): Promise<ReflectionAnalysis | null>;
  
  getQualityTrends(studentId: string, context: PrivacyContext, assignmentId?: string): Promise<{
    trend: 'improving' | 'stable' | 'declining';
    averageQuality: number;
    dataPoints: Array<{
      date: Date;
      qualityScore: number;
      authenticityScore: number;
    }>;
  }>;
  
  /** Get privacy-preserving class analytics */
  getClassAnalytics(assignmentId: string, context: PrivacyContext): Promise<{
    averageQuality: number;
    qualityDistribution: Record<string, number>;
    accessLevelDistribution: Record<string, number>;
    topStrengths: string[];
    commonGrowthAreas: string[];
  }>;
}

/**
 * Student repository interface with privacy-aware methods
 */
export interface StudentRepository extends PrivacyAwareRepository<User, any, any> {
  findByEmail(email: string, context: PrivacyContext): Promise<User | null>;
  
  findByCourse(courseId: string, context: PrivacyContext): Promise<User[]>;
  
  createStudent(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role?: 'student' | 'educator' | 'admin';
  }, context: PrivacyContext): Promise<User>;
  
  updateStudent(id: string, data: Prisma.UserUpdateInput, context: PrivacyContext): Promise<User>;
  
  deleteStudent(id: string, context: PrivacyContext): Promise<void>;
  
  getStudentStats(studentId: string, context: PrivacyContext): Promise<{
    totalCourses: number;
    totalAssignments: number;
    completedAssignments: number;
    averageReflectionQuality: number;
  }>;
  
  /** Get anonymized student analytics for educator insights */
  getAnonymizedStudentAnalytics(criteria: AnalyticsCriteria, context: PrivacyContext): Promise<AnonymizedData>;
}

/**
 * Student Profiling Repository with privacy controls and data agency
 */
export interface StudentProfilingRepository extends PrivacyAwareRepository<any, any, any> {
  buildStudentProfile(
    studentId: string,
    requesterContext: {
      userId: string;
      role: 'student' | 'teacher' | 'parent' | 'admin';
      purpose: string;
    },
    includePrivateData: boolean,
    context: PrivacyContext
  ): Promise<any>;

  updatePrivacyChoices(
    studentId: string,
    choices: any,
    context: PrivacyContext
  ): Promise<any>;

  generatePrivacyPreservingAnalytics(
    cohortIds: string[],
    metrics: string[],
    epsilon?: number,
    delta?: number,
    context: PrivacyContext
  ): Promise<AnonymizedData>;

  validateDataAccessRequest(
    requesterId: string,
    requesterType: 'teacher' | 'peer' | 'platform' | 'researcher',
    studentId: string,
    purpose: string,
    dataTypes: string[],
    studentBenefit: string | undefined,
    context: PrivacyContext
  ): Promise<any>;

  createPrivacyDashboard(
    studentId: string,
    includeRecommendations: boolean,
    timeRange: string,
    context: PrivacyContext
  ): Promise<any>;

  trackLearningTrajectory(
    studentId: string,
    milestone: {
      skill: string;
      level: number;
      evidence?: string[];
    },
    privacyLevel: 'full' | 'anonymized' | 'aggregate',
    context: PrivacyContext
  ): Promise<any>;

  assessSkillDevelopment(
    studentId: string,
    skills: Array<{
      skillName: string;
      currentLevel: number;
      targetLevel: number;
      progress: number;
    }>,
    sharedWith: string[],
    context: PrivacyContext
  ): Promise<any>;

  generatePersonalizedRecommendations(
    studentId: string,
    useEnhancedData: boolean,
    recommendationTypes: string[] | undefined,
    context: PrivacyContext
  ): Promise<any>;
}

/**
 * Educator Alerts Repository Interface for alert and intervention management
 */
export interface EducatorAlertsRepository extends PrivacyAwareRepository<any, any, any> {
  generateInterventionRecommendations(
    studentId: string,
    analysisData: Record<string, any>,
    educationalContext: {
      assignmentId?: string;
      courseId?: string;
      learningObjectives?: string[];
    },
    privacyContext: PrivacyContext
  ): Promise<any[]>;

  sendEducatorAlerts(
    alerts: any[],
    deliveryOptions: {
      immediate?: boolean;
      channels?: ('in_app' | 'email' | 'sms')[];
      batchWithOthers?: boolean;
    },
    privacyContext: PrivacyContext
  ): Promise<{
    sent: any[];
    failed: { alert: any; reason: string }[];
    queued: any[];
  }>;

  scheduleInterventionActions(
    interventionId: string,
    scheduleData: any,
    reminderSettings: {
      sendReminders: boolean;
      reminderTimes: string[];
      includePreparation?: boolean;
    },
    privacyContext: PrivacyContext
  ): Promise<any>;

  trackInterventionEffectiveness(
    interventionId: string,
    measurementData: any,
    comparisonPeriod: {
      baseline: { start: Date; end: Date };
      measurement: { start: Date; end: Date };
    },
    privacyContext: PrivacyContext
  ): Promise<any>;
}

/**
 * AI Interaction Repository with comprehensive audit trail
 */
export interface AIInteractionRepository extends PrivacyAwareRepository<AIInteractionLog, any, any> {
  findByStudent(studentId: string, options: {
    assignmentId?: string;
    limit?: number;
    assistanceType?: string;
  }, context: PrivacyContext): Promise<AIInteractionLog[]>;
  
  findByAssignment(assignmentId: string, options: {
    limit?: number;
    educationallySound?: boolean;
  }, context: PrivacyContext): Promise<AIInteractionLog[]>;
  
  /** Log AI interaction with comprehensive audit trail */
  logInteraction(data: {
    studentId: string;
    assignmentId?: string;
    assistanceType: string;
    questionsGenerated?: number;
    educationallySound: boolean;
    writingStage: string;
    questionText?: string;
    responseId: string;
    metadata?: any;
  }, context: PrivacyContext): Promise<AIInteractionLog>;
  
  updateInteraction(id: string, data: Prisma.AIInteractionLogUpdateInput, context: PrivacyContext): Promise<AIInteractionLog>;
  
  /** Get interactions with privacy filtering */
  getInteractionsWithPrivacy(studentId: string, context: PrivacyContext): Promise<AIInteractionLog[]>;
  
  getInteractionStats(studentId: string, context: PrivacyContext, assignmentId?: string): Promise<{
    totalInteractions: number;
    educationallySoundCount: number;
    averageQuestionsPerInteraction: number;
    reflectionCompletionRate: number;
    mostCommonAssistanceTypes: Array<{ type: string; count: number }>;
  }>;
  
  getBoundaryMetrics(assignmentId: string, context: PrivacyContext): Promise<{
    totalRequests: number;
    approvedRequests: number;
    averageResponseQuality: number;
    studentEngagementLevels: Record<string, number>;
  }>;
  
  /** Get aggregated insights with privacy preservation */
  getAggregatedInsights(criteria: InsightCriteria, context: PrivacyContext): Promise<PrivacyPreservedInsights>;
  
  /** Anonymous aggregation methods for educator analytics */
  getAnonymousInteractionPatterns(assignmentId: string, context: PrivacyContext): Promise<AnonymizedData>;
}