/**
 * Student Profiling Repository Interface
 * Extends the privacy-aware repository pattern established in Phase 1 Week 2
 * Integrates with Student Profiling MCP Server functionality
 */

import { StudentProfile, User } from '@prisma/client';
import { PrivacyAwareRepository } from '../interfaces';
import { PrivacyContext, PrivacyMetadata, AnonymizedData, AnalyticsCriteria } from '../../types/privacy';

/**
 * Enhanced Student Profile with privacy and data agency controls
 */
export interface EnhancedStudentProfile extends StudentProfile {
  privacyMetadata?: PrivacyMetadata;
  privacyChoices?: StudentPrivacyChoices;
  dataAccessLog?: DataAccessEntry[];
  learningTrajectory?: LearningMilestone[];
  skillAssessments?: SkillAssessment[];
}

/**
 * Student privacy choices aligned with MCP server functionality
 */
export interface StudentPrivacyChoices {
  educationalSharing: {
    teacher: boolean;
    peer: boolean;
    parent: boolean;
  };
  platformImprovement: {
    anonymousPatterns: boolean;
    featureAnalytics: boolean;
    research: boolean;
  };
  personalBenefits: {
    enhancedAnalytics: boolean;
    portfolio: boolean;
    careerGuidance: boolean;
  };
  privacyControls: {
    retentionPeriod: string;
    sensitiveContent: string;
    thirdParty: string;
  };
}

/**
 * Learning milestone for trajectory tracking
 */
export interface LearningMilestone {
  skill: string;
  level: number;
  evidence?: string[];
  timestamp: Date;
  privacyLevel: 'full' | 'anonymized' | 'aggregate';
}

/**
 * Skill development assessment
 */
export interface SkillAssessment {
  assessmentId: string;
  skills: Array<{
    skillName: string;
    currentLevel: number;
    targetLevel: number;
    progress: number;
  }>;
  sharedWith: string[];
  timestamp: Date;
}

/**
 * Data access entry for privacy dashboard
 */
export interface DataAccessEntry {
  accessId: string;
  requesterId: string;
  requesterType: 'teacher' | 'peer' | 'platform' | 'researcher';
  purpose: string;
  dataTypes: string[];
  timestamp: Date;
  approved: boolean;
  studentBenefit?: string;
}

/**
 * Privacy dashboard data structure
 */
export interface PrivacyDashboard {
  dashboardId: string;
  studentId: string;
  currentChoices: StudentPrivacyChoices;
  dataAccessLog: DataAccessEntry[];
  privacyScore: {
    overallScore: number;
    dataMinimization: number;
    consentCompliance: number;
    accessControl: number;
    dataProtection: number;
  };
  recommendations: PrivacyRecommendation[];
  dataInventory: DataInventoryItem[];
  controls: PrivacyControl[];
  generatedAt: Date;
}

/**
 * Privacy recommendation
 */
export interface PrivacyRecommendation {
  type: 'privacy_enhancement' | 'data_sharing_opportunity' | 'security_alert' | 'learning_benefit';
  title: string;
  description: string;
  actionRequired: boolean;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Data inventory item
 */
export interface DataInventoryItem {
  dataType: string;
  description: string;
  retentionPeriod: string;
  sharedWith: string[];
  purpose: string;
}

/**
 * Privacy control
 */
export interface PrivacyControl {
  controlType: string;
  description: string;
  currentSetting: any;
  availableOptions: any[];
}

/**
 * Student Profiling Repository Interface
 * Implements privacy-aware repository pattern with MCP server alignment
 */
export interface StudentProfilingRepository extends PrivacyAwareRepository<EnhancedStudentProfile, any, any> {
  /**
   * Build comprehensive student profile with privacy controls
   * Aligns with build_student_profile MCP tool
   */
  buildStudentProfile(
    studentId: string,
    requesterContext: {
      userId: string;
      role: 'student' | 'teacher' | 'parent' | 'admin';
      purpose: string;
    },
    includePrivateData: boolean,
    context: PrivacyContext
  ): Promise<EnhancedStudentProfile>;

  /**
   * Manage student privacy choices
   * Aligns with manage_student_privacy_choices MCP tool
   */
  updatePrivacyChoices(
    studentId: string,
    choices: Partial<StudentPrivacyChoices>,
    context: PrivacyContext
  ): Promise<StudentPrivacyChoices>;

  /**
   * Get current privacy choices for a student
   */
  getPrivacyChoices(
    studentId: string,
    context: PrivacyContext
  ): Promise<StudentPrivacyChoices>;

  /**
   * Generate privacy-preserving analytics with differential privacy
   * Aligns with generate_privacy_preserving_analytics MCP tool
   */
  generatePrivacyPreservingAnalytics(
    cohortIds: string[],
    metrics: string[],
    epsilon?: number,
    delta?: number,
    context: PrivacyContext
  ): Promise<AnonymizedData>;

  /**
   * Validate data access request
   * Aligns with validate_data_access_requests MCP tool
   */
  validateDataAccessRequest(
    requesterId: string,
    requesterType: 'teacher' | 'peer' | 'platform' | 'researcher',
    studentId: string,
    purpose: string,
    dataTypes: string[],
    studentBenefit: string | undefined,
    context: PrivacyContext
  ): Promise<{
    approved: boolean;
    reasoning: string;
    conditions?: string[];
    expirationDate?: Date;
  }>;

  /**
   * Create student privacy dashboard
   * Aligns with create_student_privacy_dashboard MCP tool
   */
  createPrivacyDashboard(
    studentId: string,
    includeRecommendations: boolean,
    timeRange: string,
    context: PrivacyContext
  ): Promise<PrivacyDashboard>;

  /**
   * Track learning trajectory with privacy controls
   * Aligns with track_learning_trajectory MCP tool
   */
  trackLearningTrajectory(
    studentId: string,
    milestone: {
      skill: string;
      level: number;
      evidence?: string[];
    },
    privacyLevel: 'full' | 'anonymized' | 'aggregate',
    context: PrivacyContext
  ): Promise<LearningMilestone>;

  /**
   * Get learning trajectory for a student
   */
  getLearningTrajectory(
    studentId: string,
    context: PrivacyContext
  ): Promise<LearningMilestone[]>;

  /**
   * Assess skill development with sharing controls
   * Aligns with assess_skill_development MCP tool
   */
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
  ): Promise<SkillAssessment>;

  /**
   * Get skill assessments for a student
   */
  getSkillAssessments(
    studentId: string,
    context: PrivacyContext
  ): Promise<SkillAssessment[]>;

  /**
   * Generate personalized recommendations with value exchange
   * Aligns with generate_personalized_recommendations MCP tool
   */
  generatePersonalizedRecommendations(
    studentId: string,
    useEnhancedData: boolean,
    recommendationTypes: string[] | undefined,
    context: PrivacyContext
  ): Promise<{
    recommendations: Array<{
      type: string;
      title: string;
      description: string;
      rationale: string;
      priority: 'low' | 'medium' | 'high';
      actionItems?: string[];
    }>;
    enhancedDataUsed: boolean;
    valueExchange?: {
      dataShared: string[];
      benefitsProvided: string[];
      trustScore: number;
    };
  }>;

  /**
   * Log data access for audit trail
   */
  logDataAccess(
    studentId: string,
    accessEntry: Omit<DataAccessEntry, 'accessId' | 'timestamp'>,
    context: PrivacyContext
  ): Promise<DataAccessEntry>;

  /**
   * Get data access log for a student
   */
  getDataAccessLog(
    studentId: string,
    timeRange?: { start: Date; end: Date },
    context: PrivacyContext
  ): Promise<DataAccessEntry[]>;

  /**
   * Calculate privacy score for a student
   */
  calculatePrivacyScore(
    studentId: string,
    context: PrivacyContext
  ): Promise<{
    overallScore: number;
    dataMinimization: number;
    consentCompliance: number;
    accessControl: number;
    dataProtection: number;
    recommendations: string[];
  }>;

  /**
   * Get aggregated privacy metrics for educators/administrators
   */
  getAggregatedPrivacyMetrics(
    criteria: AnalyticsCriteria,
    context: PrivacyContext
  ): Promise<AnonymizedData>;

  /**
   * Find students with similar privacy preferences
   */
  findStudentsWithSimilarPrivacyPreferences(
    studentId: string,
    context: PrivacyContext
  ): Promise<AnonymizedData>;

  /**
   * Get consent compliance statistics
   */
  getConsentComplianceStatistics(
    cohortIds: string[],
    context: PrivacyContext
  ): Promise<{
    totalStudents: number;
    consentRates: Record<string, number>;
    privacyScoreDistribution: Record<string, number>;
    commonPrivacyChoices: Record<string, number>;
  }>;
}