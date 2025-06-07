/**
 * Mock Student Profiling Repository for testing
 * Implements privacy-aware repository pattern established in Phase 1 Week 2
 * Supports Student Profiling MCP Server integration testing
 */

import { StudentProfilingRepository, EnhancedStudentProfile, StudentPrivacyChoices, LearningMilestone, SkillAssessment, DataAccessEntry, PrivacyDashboard } from '../interfaces/StudentProfilingRepository';
import { PrivacyContext, PrivacyMetadata, AnonymizedData, AuditEntry, AnalyticsCriteria } from '../../types/privacy';

export class MockStudentProfilingRepository implements StudentProfilingRepository {
  private profiles: Map<string, EnhancedStudentProfile> = new Map();
  private privacyChoices: Map<string, StudentPrivacyChoices> = new Map();
  private learningTrajectories: Map<string, LearningMilestone[]> = new Map();
  private skillAssessments: Map<string, SkillAssessment[]> = new Map();
  private dataAccessLogs: Map<string, DataAccessEntry[]> = new Map();
  private auditTrail: AuditEntry[] = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Mock student profile
    const mockProfile: EnhancedStudentProfile = {
      id: 'profile-1',
      userId: 'student-123',
      learningPreferences: { preferredFeedbackType: 'detailed', workPace: 'moderate' },
      writingPatterns: { averageSessionLength: 45, preferredTimeOfDay: 'morning' },
      strengthsWeaknesses: { strengths: ['analysis', 'creativity'], weaknesses: ['grammar', 'organization'] },
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-06-01'),
      privacyMetadata: {
        classification: 'restricted',
        lastAccessed: new Date(),
        accessCount: 5,
        retentionPeriod: '7-years',
        consentStatus: 'granted'
      }
    };

    // Mock privacy choices
    const mockPrivacyChoices: StudentPrivacyChoices = {
      educationalSharing: {
        teacher: true,
        peer: false,
        parent: true
      },
      platformImprovement: {
        anonymousPatterns: true,
        featureAnalytics: false,
        research: true
      },
      personalBenefits: {
        enhancedAnalytics: true,
        portfolio: true,
        careerGuidance: false
      },
      privacyControls: {
        retentionPeriod: '7-years',
        sensitiveContent: 'exclude',
        thirdParty: 'none'
      }
    };

    // Mock learning milestones
    const mockMilestones: LearningMilestone[] = [
      {
        skill: 'analytical-writing',
        level: 7,
        evidence: ['improved thesis development', 'better argument structure'],
        timestamp: new Date('2025-05-15'),
        privacyLevel: 'anonymized'
      },
      {
        skill: 'research-skills',
        level: 6,
        evidence: ['found credible sources', 'proper citation format'],
        timestamp: new Date('2025-05-20'),
        privacyLevel: 'full'
      }
    ];

    // Mock skill assessment
    const mockSkillAssessment: SkillAssessment = {
      assessmentId: 'assessment-1',
      skills: [
        { skillName: 'critical-thinking', currentLevel: 7, targetLevel: 9, progress: 0.6 },
        { skillName: 'writing-clarity', currentLevel: 6, targetLevel: 8, progress: 0.4 }
      ],
      sharedWith: ['teacher-456'],
      timestamp: new Date('2025-06-01')
    };

    // Mock data access entries
    const mockDataAccess: DataAccessEntry[] = [
      {
        accessId: 'access-1',
        requesterId: 'teacher-456',
        requesterType: 'teacher',
        purpose: 'grade_assignment',
        dataTypes: ['writing_patterns', 'reflection_quality'],
        timestamp: new Date('2025-06-01'),
        approved: true,
        studentBenefit: 'Personalized feedback on writing improvement'
      }
    ];

    this.profiles.set('student-123', mockProfile);
    this.privacyChoices.set('student-123', mockPrivacyChoices);
    this.learningTrajectories.set('student-123', mockMilestones);
    this.skillAssessments.set('student-123', [mockSkillAssessment]);
    this.dataAccessLogs.set('student-123', mockDataAccess);
  }

  private logAudit(operation: string, entityId: string, context: PrivacyContext): void {
    this.auditTrail.push({
      id: `audit-${Date.now()}`,
      entityType: 'student_profile',
      entityId,
      operation,
      userId: context.requesterId,
      userType: context.requesterType,
      timestamp: new Date(),
      result: 'success',
      metadata: {
        purpose: context.purpose,
        educationalJustification: context.educationalJustification
      }
    });
  }

  // Base repository methods (simplified for mock)
  async findById(id: string, context: PrivacyContext): Promise<EnhancedStudentProfile | null> {
    this.logAudit('findById', id, context);
    return this.profiles.get(id) || null;
  }

  async findMany(filter: any, context: PrivacyContext): Promise<EnhancedStudentProfile[]> {
    this.logAudit('findMany', 'multiple', context);
    return Array.from(this.profiles.values());
  }

  async create(data: any, context: PrivacyContext): Promise<EnhancedStudentProfile> {
    const profile: EnhancedStudentProfile = {
      id: `profile-${Date.now()}`,
      userId: data.userId,
      learningPreferences: data.learningPreferences || {},
      writingPatterns: data.writingPatterns || {},
      strengthsWeaknesses: data.strengthsWeaknesses || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      privacyMetadata: {
        classification: 'restricted',
        lastAccessed: new Date(),
        accessCount: 0,
        retentionPeriod: '7-years',
        consentStatus: 'pending'
      }
    };
    
    this.profiles.set(profile.id, profile);
    this.logAudit('create', profile.id, context);
    return profile;
  }

  async update(id: string, data: any, context: PrivacyContext): Promise<EnhancedStudentProfile> {
    const existing = this.profiles.get(id);
    if (!existing) throw new Error('Profile not found');
    
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.profiles.set(id, updated);
    this.logAudit('update', id, context);
    return updated;
  }

  async delete(id: string, context: PrivacyContext): Promise<boolean> {
    const deleted = this.profiles.delete(id);
    if (deleted) {
      this.logAudit('delete', id, context);
    }
    return deleted;
  }

  // Privacy-aware repository methods
  async findByIdWithPrivacy(id: string, context: PrivacyContext): Promise<(EnhancedStudentProfile & { privacyMetadata: PrivacyMetadata }) | null> {
    this.logAudit('findByIdWithPrivacy', id, context);
    const profile = this.profiles.get(id);
    if (!profile) return null;
    
    return {
      ...profile,
      privacyMetadata: profile.privacyMetadata || {
        classification: 'restricted',
        lastAccessed: new Date(),
        accessCount: 1,
        retentionPeriod: '7-years',
        consentStatus: 'granted'
      }
    };
  }

  async findByIdWithConsent(id: string, context: PrivacyContext): Promise<EnhancedStudentProfile | null> {
    this.logAudit('findByIdWithConsent', id, context);
    // Mock consent check - in real implementation, this would validate consent
    return this.profiles.get(id) || null;
  }

  async getAnonymizedAnalytics(criteria: AnalyticsCriteria, context: PrivacyContext): Promise<AnonymizedData> {
    this.logAudit('getAnonymizedAnalytics', 'aggregate', context);
    return {
      totalRecords: this.profiles.size,
      aggregatedMetrics: {
        averageLearningLevel: 6.5,
        commonStrengths: ['analysis', 'creativity'],
        improvementAreas: ['grammar', 'organization']
      },
      privacyPreserved: true,
      anonymizationMethod: 'k-anonymity',
      minimumCohortSize: 10
    };
  }

  async getAuditTrail(entityId: string, context: PrivacyContext): Promise<AuditEntry[]> {
    return this.auditTrail.filter(entry => entry.entityId === entityId);
  }

  // Student Profiling specific methods
  async buildStudentProfile(
    studentId: string,
    requesterContext: {
      userId: string;
      role: 'student' | 'teacher' | 'parent' | 'admin';
      purpose: string;
    },
    includePrivateData: boolean,
    context: PrivacyContext
  ): Promise<EnhancedStudentProfile> {
    this.logAudit('buildStudentProfile', studentId, context);
    
    let profile = this.profiles.get(studentId);
    if (!profile) {
      // Create new profile if it doesn't exist
      profile = await this.create({
        userId: studentId,
        learningPreferences: {},
        writingPatterns: {},
        strengthsWeaknesses: {}
      }, context);
    }

    // Filter private data based on includePrivateData flag
    if (!includePrivateData && requesterContext.role !== 'student') {
      return {
        ...profile,
        strengthsWeaknesses: undefined, // Hide sensitive data
        privacyMetadata: {
          ...profile.privacyMetadata,
          accessCount: (profile.privacyMetadata?.accessCount || 0) + 1,
          lastAccessed: new Date()
        }
      };
    }

    return profile;
  }

  async updatePrivacyChoices(
    studentId: string,
    choices: Partial<StudentPrivacyChoices>,
    context: PrivacyContext
  ): Promise<StudentPrivacyChoices> {
    this.logAudit('updatePrivacyChoices', studentId, context);
    
    const existing = this.privacyChoices.get(studentId) || this.getDefaultPrivacyChoices();
    const updated = { ...existing, ...choices };
    this.privacyChoices.set(studentId, updated);
    
    return updated;
  }

  async getPrivacyChoices(studentId: string, context: PrivacyContext): Promise<StudentPrivacyChoices> {
    this.logAudit('getPrivacyChoices', studentId, context);
    return this.privacyChoices.get(studentId) || this.getDefaultPrivacyChoices();
  }

  async generatePrivacyPreservingAnalytics(
    cohortIds: string[],
    metrics: string[],
    epsilon: number = 1.0,
    delta: number = 0.00001,
    context: PrivacyContext
  ): Promise<AnonymizedData> {
    this.logAudit('generatePrivacyPreservingAnalytics', cohortIds.join(','), context);
    
    // Mock differential privacy analytics
    const baseMetrics = {
      averageScore: 75.5,
      completionRate: 0.85,
      engagementLevel: 7.2
    };

    // Add Laplace noise for differential privacy
    const noisyMetrics = Object.fromEntries(
      Object.entries(baseMetrics).map(([key, value]) => [
        key,
        typeof value === 'number' ? value + (Math.random() - 0.5) * epsilon : value
      ])
    );

    return {
      totalRecords: cohortIds.length,
      aggregatedMetrics: noisyMetrics,
      privacyPreserved: true,
      anonymizationMethod: 'differential-privacy',
      privacyParameters: { epsilon, delta },
      minimumCohortSize: 10
    };
  }

  async validateDataAccessRequest(
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
  }> {
    this.logAudit('validateDataAccessRequest', studentId, context);
    
    // Mock access validation logic
    const privacyChoices = this.privacyChoices.get(studentId);
    const isEducationalPurpose = purpose.includes('grade') || purpose.includes('feedback') || purpose.includes('assessment');
    const hasStudentBenefit = studentBenefit && studentBenefit.length > 0;
    
    const approved = requesterType === 'teacher' && isEducationalPurpose && hasStudentBenefit;
    
    return {
      approved,
      reasoning: approved 
        ? 'Request approved for legitimate educational purpose with clear student benefit'
        : 'Request denied due to insufficient justification or privacy settings',
      conditions: approved ? ['Data must be used only for stated purpose', 'Must be deleted after 30 days'] : undefined,
      expirationDate: approved ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined
    };
  }

  async createPrivacyDashboard(
    studentId: string,
    includeRecommendations: boolean,
    timeRange: string,
    context: PrivacyContext
  ): Promise<PrivacyDashboard> {
    this.logAudit('createPrivacyDashboard', studentId, context);
    
    const privacyChoices = this.privacyChoices.get(studentId) || this.getDefaultPrivacyChoices();
    const dataAccessLog = this.dataAccessLogs.get(studentId) || [];
    
    return {
      dashboardId: `dashboard-${studentId}-${Date.now()}`,
      studentId,
      currentChoices: privacyChoices,
      dataAccessLog,
      privacyScore: {
        overallScore: 85,
        dataMinimization: 90,
        consentCompliance: 95,
        accessControl: 80,
        dataProtection: 75
      },
      recommendations: includeRecommendations ? [
        {
          type: 'privacy_enhancement',
          title: 'Consider enabling enhanced analytics',
          description: 'This would provide better learning insights while maintaining privacy',
          actionRequired: false,
          priority: 'medium'
        }
      ] : [],
      dataInventory: [
        {
          dataType: 'writing_patterns',
          description: 'Analysis of writing habits and productivity',
          retentionPeriod: '7-years',
          sharedWith: ['teacher'],
          purpose: 'Educational improvement'
        }
      ],
      controls: [
        {
          controlType: 'data_sharing',
          description: 'Control who can access your learning data',
          currentSetting: privacyChoices.educationalSharing,
          availableOptions: [true, false]
        }
      ],
      generatedAt: new Date()
    };
  }

  async trackLearningTrajectory(
    studentId: string,
    milestone: {
      skill: string;
      level: number;
      evidence?: string[];
    },
    privacyLevel: 'full' | 'anonymized' | 'aggregate',
    context: PrivacyContext
  ): Promise<LearningMilestone> {
    this.logAudit('trackLearningTrajectory', studentId, context);
    
    const newMilestone: LearningMilestone = {
      skill: milestone.skill,
      level: milestone.level,
      evidence: milestone.evidence,
      timestamp: new Date(),
      privacyLevel
    };
    
    const existing = this.learningTrajectories.get(studentId) || [];
    existing.push(newMilestone);
    this.learningTrajectories.set(studentId, existing);
    
    return newMilestone;
  }

  async getLearningTrajectory(studentId: string, context: PrivacyContext): Promise<LearningMilestone[]> {
    this.logAudit('getLearningTrajectory', studentId, context);
    return this.learningTrajectories.get(studentId) || [];
  }

  async assessSkillDevelopment(
    studentId: string,
    skills: Array<{
      skillName: string;
      currentLevel: number;
      targetLevel: number;
      progress: number;
    }>,
    sharedWith: string[],
    context: PrivacyContext
  ): Promise<SkillAssessment> {
    this.logAudit('assessSkillDevelopment', studentId, context);
    
    const assessment: SkillAssessment = {
      assessmentId: `assessment-${Date.now()}`,
      skills,
      sharedWith,
      timestamp: new Date()
    };
    
    const existing = this.skillAssessments.get(studentId) || [];
    existing.push(assessment);
    this.skillAssessments.set(studentId, existing);
    
    return assessment;
  }

  async getSkillAssessments(studentId: string, context: PrivacyContext): Promise<SkillAssessment[]> {
    this.logAudit('getSkillAssessments', studentId, context);
    return this.skillAssessments.get(studentId) || [];
  }

  async generatePersonalizedRecommendations(
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
  }> {
    this.logAudit('generatePersonalizedRecommendations', studentId, context);
    
    const profile = this.profiles.get(studentId);
    
    return {
      recommendations: [
        {
          type: 'writing_improvement',
          title: 'Focus on paragraph organization',
          description: 'Your writing would benefit from clearer paragraph structure',
          rationale: 'Analysis of recent writing patterns shows room for improvement in organization',
          priority: 'medium',
          actionItems: ['Use topic sentences', 'Create clear transitions', 'Practice outlining']
        }
      ],
      enhancedDataUsed: useEnhancedData,
      valueExchange: useEnhancedData ? {
        dataShared: ['writing_patterns', 'learning_preferences'],
        benefitsProvided: ['personalized_feedback', 'adaptive_assignments'],
        trustScore: 8.5
      } : undefined
    };
  }

  async logDataAccess(
    studentId: string,
    accessEntry: Omit<DataAccessEntry, 'accessId' | 'timestamp'>,
    context: PrivacyContext
  ): Promise<DataAccessEntry> {
    this.logAudit('logDataAccess', studentId, context);
    
    const entry: DataAccessEntry = {
      ...accessEntry,
      accessId: `access-${Date.now()}`,
      timestamp: new Date()
    };
    
    const existing = this.dataAccessLogs.get(studentId) || [];
    existing.push(entry);
    this.dataAccessLogs.set(studentId, existing);
    
    return entry;
  }

  async getDataAccessLog(
    studentId: string,
    timeRange?: { start: Date; end: Date },
    context?: PrivacyContext
  ): Promise<DataAccessEntry[]> {
    if (context) {
      this.logAudit('getDataAccessLog', studentId, context);
    }
    
    let entries = this.dataAccessLogs.get(studentId) || [];
    
    if (timeRange) {
      entries = entries.filter(entry => 
        entry.timestamp >= timeRange.start && entry.timestamp <= timeRange.end
      );
    }
    
    return entries;
  }

  async calculatePrivacyScore(
    studentId: string,
    context: PrivacyContext
  ): Promise<{
    overallScore: number;
    dataMinimization: number;
    consentCompliance: number;
    accessControl: number;
    dataProtection: number;
    recommendations: string[];
  }> {
    this.logAudit('calculatePrivacyScore', studentId, context);
    
    return {
      overallScore: 85,
      dataMinimization: 90,
      consentCompliance: 95,
      accessControl: 80,
      dataProtection: 75,
      recommendations: [
        'Consider enabling two-factor authentication',
        'Review data sharing preferences quarterly',
        'Monitor access logs regularly'
      ]
    };
  }

  async getAggregatedPrivacyMetrics(
    criteria: AnalyticsCriteria,
    context: PrivacyContext
  ): Promise<AnonymizedData> {
    this.logAudit('getAggregatedPrivacyMetrics', 'aggregate', context);
    
    return {
      totalRecords: this.profiles.size,
      aggregatedMetrics: {
        averagePrivacyScore: 82.5,
        consentRate: 0.92,
        dataAccessFrequency: 3.2
      },
      privacyPreserved: true,
      anonymizationMethod: 'k-anonymity',
      minimumCohortSize: 10
    };
  }

  async findStudentsWithSimilarPrivacyPreferences(
    studentId: string,
    context: PrivacyContext
  ): Promise<AnonymizedData> {
    this.logAudit('findStudentsWithSimilarPrivacyPreferences', studentId, context);
    
    return {
      totalRecords: 15,
      aggregatedMetrics: {
        similarityScore: 0.85,
        commonPreferences: ['teacher_sharing_enabled', 'research_participation'],
        clusterSize: 15
      },
      privacyPreserved: true,
      anonymizationMethod: 'clustering',
      minimumCohortSize: 10
    };
  }

  async getConsentComplianceStatistics(
    cohortIds: string[],
    context: PrivacyContext
  ): Promise<{
    totalStudents: number;
    consentRates: Record<string, number>;
    privacyScoreDistribution: Record<string, number>;
    commonPrivacyChoices: Record<string, number>;
  }> {
    this.logAudit('getConsentComplianceStatistics', cohortIds.join(','), context);
    
    return {
      totalStudents: cohortIds.length,
      consentRates: {
        educational_sharing: 0.85,
        research_participation: 0.62,
        enhanced_analytics: 0.71
      },
      privacyScoreDistribution: {
        'high (80-100)': 0.45,
        'medium (60-79)': 0.38,
        'low (0-59)': 0.17
      },
      commonPrivacyChoices: {
        teacher_access: 0.92,
        peer_sharing: 0.23,
        parent_visibility: 0.67
      }
    };
  }

  private getDefaultPrivacyChoices(): StudentPrivacyChoices {
    return {
      educationalSharing: {
        teacher: true,
        peer: false,
        parent: true
      },
      platformImprovement: {
        anonymousPatterns: true,
        featureAnalytics: false,
        research: false
      },
      personalBenefits: {
        enhancedAnalytics: false,
        portfolio: true,
        careerGuidance: false
      },
      privacyControls: {
        retentionPeriod: '7-years',
        sensitiveContent: 'exclude',
        thirdParty: 'none'
      }
    };
  }
}