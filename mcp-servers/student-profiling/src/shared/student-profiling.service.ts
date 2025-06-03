import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrivacyConfig } from '../config/privacy.config';

export interface BuildProfileParams {
  studentId: string;
  courseId?: string;
  includePrivateData?: boolean;
  requesterContext?: {
    userId: string;
    role: 'student' | 'teacher' | 'parent' | 'admin';
    purpose: string;
  };
}

export interface StudentProfile {
  profileId: string;
  studentId: string;
  publicProfile: {
    displayName: string;
    grade: number;
    learningGoals: string[];
    interests: string[];
    achievements: Achievement[];
  };
  privateProfile?: {
    learningChallenges: string[];
    accommodations: string[];
    personalNotes: string[];
    sensitiveData: any;
  };
  privacySettings: StudentPrivacyChoices;
  createdAt: Date;
  lastUpdated: Date;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  dateEarned: Date;
  visibility: 'public' | 'teacher' | 'private';
}

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

export interface LearningTrajectory {
  trajectoryId: string;
  studentId: string;
  milestones: LearningMilestone[];
  currentPhase: string;
  projectedPath: string[];
  privacyLevel: 'full' | 'anonymized' | 'aggregate';
}

export interface LearningMilestone {
  id: string;
  skill: string;
  level: number;
  achievedAt: Date;
  evidence: string[];
}

export interface SkillAssessment {
  assessmentId: string;
  studentId: string;
  skills: SkillLevel[];
  overallProgress: number;
  recommendations: string[];
  sharedWith: string[];
}

export interface SkillLevel {
  skillName: string;
  currentLevel: number;
  targetLevel: number;
  progress: number;
  lastAssessed: Date;
}

export interface PersonalizedRecommendation {
  recommendationId: string;
  studentId: string;
  type: 'learning' | 'practice' | 'resource' | 'collaboration';
  title: string;
  description: string;
  rationale: string;
  dataUsed: string[];
  confidenceScore: number;
}

@Injectable()
export class StudentProfilingService {
  private readonly logger = new Logger(StudentProfilingService.name);

  async buildProfile(params: BuildProfileParams): Promise<StudentProfile> {
    this.logger.log(`Building profile for student: ${params.studentId}`);

    // Verify access permissions
    const hasAccess = await this.verifyAccess(params);
    if (!hasAccess) {
      throw new Error('Access denied: Insufficient permissions');
    }

    // Get student privacy choices
    const privacySettings = await this.getStudentPrivacyChoices(params.studentId);

    // Build public profile (always included)
    const publicProfile = await this.buildPublicProfile(params.studentId);

    // Build private profile if authorized and consented
    let privateProfile;
    if (params.includePrivateData && this.canAccessPrivateData(params, privacySettings)) {
      privateProfile = await this.buildPrivateProfile(params.studentId);
    }

    const profile: StudentProfile = {
      profileId: uuidv4(),
      studentId: params.studentId,
      publicProfile,
      privateProfile,
      privacySettings,
      createdAt: new Date(),
      lastUpdated: new Date(),
    };

    // Log access for audit
    await this.logProfileAccess(params, profile.profileId);

    return profile;
  }

  async trackLearningTrajectory(
    studentId: string,
    milestone: LearningMilestone,
    privacyLevel: 'full' | 'anonymized' | 'aggregate' = 'anonymized'
  ): Promise<LearningTrajectory> {
    this.logger.log(`Tracking learning trajectory for student: ${studentId}`);

    // Check consent for trajectory tracking
    const consent = await this.checkTrajectoryConsent(studentId);
    if (!consent) {
      throw new Error('Trajectory tracking not consented');
    }

    // Get or create trajectory
    const trajectory = await this.getOrCreateTrajectory(studentId);

    // Add milestone with privacy controls
    const sanitizedMilestone = this.sanitizeMilestone(milestone, privacyLevel);
    trajectory.milestones.push(sanitizedMilestone);

    // Update trajectory analysis
    trajectory.currentPhase = this.analyzeCurrentPhase(trajectory.milestones);
    trajectory.projectedPath = this.projectLearningPath(trajectory.milestones);
    trajectory.privacyLevel = privacyLevel;

    return trajectory;
  }

  async assessSkillDevelopment(
    studentId: string,
    skills: SkillLevel[],
    sharedWith: string[] = []
  ): Promise<SkillAssessment> {
    this.logger.log(`Assessing skills for student: ${studentId}`);

    // Verify sharing permissions
    for (const userId of sharedWith) {
      const canShare = await this.canShareSkillsWith(studentId, userId);
      if (!canShare) {
        throw new Error(`Cannot share skills with user: ${userId}`);
      }
    }

    const assessment: SkillAssessment = {
      assessmentId: uuidv4(),
      studentId,
      skills,
      overallProgress: this.calculateOverallProgress(skills),
      recommendations: await this.generateSkillRecommendations(skills),
      sharedWith,
    };

    return assessment;
  }

  async generatePersonalizedRecommendations(
    studentId: string,
    options: { useEnhancedData?: boolean } = {}
  ): Promise<PersonalizedRecommendation[]> {
    this.logger.log(`Generating recommendations for student: ${studentId}`);

    // Check what data we can use
    const privacyChoices = await this.getStudentPrivacyChoices(studentId);
    const dataScope = this.determineDataScope(privacyChoices, options.useEnhancedData);

    // Generate recommendations based on available data
    const recommendations = await this.generateRecommendations(studentId, dataScope);

    // Add transparency about data usage
    return recommendations.map(rec => ({
      ...rec,
      dataUsed: dataScope,
      confidenceScore: this.calculateConfidence(dataScope),
    }));
  }

  // Private helper methods
  private async verifyAccess(params: BuildProfileParams): Promise<boolean> {
    if (!params.requesterContext) return false;

    const { userId, role, purpose } = params.requesterContext;

    // Students can always access their own profile
    if (userId === params.studentId) return true;

    // Check role-based access
    switch (role) {
      case 'teacher':
        return await this.verifyTeacherAccess(userId, params.studentId, purpose);
      case 'parent':
        return await this.verifyParentAccess(userId, params.studentId);
      case 'admin':
        return true; // Admins have access with audit
      default:
        return false;
    }
  }

  private async getStudentPrivacyChoices(studentId: string): Promise<StudentPrivacyChoices> {
    // In real implementation, fetch from database
    // For now, return default settings
    return PrivacyConfig.consent.defaultSettings;
  }

  private canAccessPrivateData(
    params: BuildProfileParams,
    privacySettings: StudentPrivacyChoices
  ): boolean {
    if (!params.requesterContext) return false;

    const { userId, role } = params.requesterContext;

    // Self-access always allowed
    if (userId === params.studentId) return true;

    // Check privacy settings
    switch (role) {
      case 'teacher':
        return privacySettings.educationalSharing.teacher;
      case 'parent':
        return privacySettings.educationalSharing.parent;
      default:
        return false;
    }
  }

  private async buildPublicProfile(studentId: string): Promise<StudentProfile['publicProfile']> {
    // Mock implementation - replace with actual data fetching
    return {
      displayName: 'Student ' + studentId.slice(0, 6),
      grade: 10,
      learningGoals: ['Improve writing skills', 'Master essay structure'],
      interests: ['Creative writing', 'Science fiction'],
      achievements: [
        {
          id: uuidv4(),
          title: 'Essay Excellence',
          description: 'Completed 10 essays with high quality',
          dateEarned: new Date(),
          visibility: 'public',
        },
      ],
    };
  }

  private async buildPrivateProfile(studentId: string): Promise<StudentProfile['privateProfile']> {
    // Mock implementation - replace with actual data fetching
    return {
      learningChallenges: ['Organizing thoughts', 'Time management'],
      accommodations: ['Extended time for assignments'],
      personalNotes: ['Prefers visual learning aids'],
      sensitiveData: {
        // Encrypted sensitive information
      },
    };
  }

  private async logProfileAccess(params: BuildProfileParams, profileId: string): Promise<void> {
    // Log access for audit trail
    this.logger.log(`Profile access logged: ${profileId} by ${params.requesterContext?.userId}`);
  }

  private async checkTrajectoryConsent(studentId: string): Promise<boolean> {
    const privacyChoices = await this.getStudentPrivacyChoices(studentId);
    return privacyChoices.platformImprovement.anonymousPatterns;
  }

  private async getOrCreateTrajectory(studentId: string): Promise<LearningTrajectory> {
    // Mock implementation - replace with database fetch
    return {
      trajectoryId: uuidv4(),
      studentId,
      milestones: [],
      currentPhase: 'Beginning',
      projectedPath: ['Foundation', 'Development', 'Mastery'],
      privacyLevel: 'anonymized',
    };
  }

  private sanitizeMilestone(
    milestone: LearningMilestone,
    privacyLevel: string
  ): LearningMilestone {
    if (privacyLevel === 'aggregate') {
      // Remove identifying information
      return {
        ...milestone,
        evidence: milestone.evidence.map(() => '[REDACTED]'),
      };
    }
    return milestone;
  }

  private analyzeCurrentPhase(milestones: LearningMilestone[]): string {
    const totalMilestones = milestones.length;
    if (totalMilestones < 5) return 'Beginning';
    if (totalMilestones < 15) return 'Developing';
    if (totalMilestones < 30) return 'Proficient';
    return 'Advanced';
  }

  private projectLearningPath(milestones: LearningMilestone[]): string[] {
    // Simple projection based on current progress
    const currentPhase = this.analyzeCurrentPhase(milestones);
    const phases = ['Beginning', 'Developing', 'Proficient', 'Advanced', 'Master'];
    const currentIndex = phases.indexOf(currentPhase);
    return phases.slice(currentIndex + 1);
  }

  private async canShareSkillsWith(studentId: string, userId: string): Promise<boolean> {
    // Check privacy settings and relationships
    const privacyChoices = await this.getStudentPrivacyChoices(studentId);
    // Implement actual permission checking
    return true;
  }

  private calculateOverallProgress(skills: SkillLevel[]): number {
    if (skills.length === 0) return 0;
    const totalProgress = skills.reduce((sum, skill) => sum + skill.progress, 0);
    return Math.round(totalProgress / skills.length);
  }

  private async generateSkillRecommendations(skills: SkillLevel[]): Promise<string[]> {
    const recommendations: string[] = [];
    
    for (const skill of skills) {
      if (skill.progress < 0.3) {
        recommendations.push(`Focus on foundational exercises for ${skill.skillName}`);
      } else if (skill.progress < 0.7) {
        recommendations.push(`Practice intermediate ${skill.skillName} techniques`);
      } else {
        recommendations.push(`Challenge yourself with advanced ${skill.skillName} projects`);
      }
    }

    return recommendations;
  }

  private async verifyTeacherAccess(
    teacherId: string,
    studentId: string,
    purpose: string
  ): Promise<boolean> {
    // Verify teacher-student relationship and legitimate educational interest
    this.logger.log(`Verifying teacher access: ${teacherId} for student ${studentId}`);
    // Mock implementation - check actual enrollment
    return true;
  }

  private async verifyParentAccess(parentId: string, studentId: string): Promise<boolean> {
    // Verify parent-child relationship
    this.logger.log(`Verifying parent access: ${parentId} for student ${studentId}`);
    // Mock implementation - check actual relationship
    return true;
  }

  private determineDataScope(
    privacyChoices: StudentPrivacyChoices,
    useEnhanced?: boolean
  ): string[] {
    const dataScope: string[] = ['basic_performance'];

    if (privacyChoices.platformImprovement.anonymousPatterns) {
      dataScope.push('learning_patterns');
    }

    if (privacyChoices.personalBenefits.enhancedAnalytics && useEnhanced) {
      dataScope.push('detailed_analytics', 'peer_comparisons');
    }

    if (privacyChoices.personalBenefits.careerGuidance) {
      dataScope.push('career_insights');
    }

    return dataScope;
  }

  private async generateRecommendations(
    studentId: string,
    dataScope: string[]
  ): Promise<PersonalizedRecommendation[]> {
    // Generate recommendations based on available data
    const recommendations: PersonalizedRecommendation[] = [];

    // Basic recommendations (always available)
    recommendations.push({
      recommendationId: uuidv4(),
      studentId,
      type: 'learning',
      title: 'Daily Writing Practice',
      description: 'Spend 15 minutes on free writing exercises',
      rationale: 'Consistent practice improves writing fluency',
      dataUsed: ['basic_performance'],
      confidenceScore: 0.7,
    });

    // Enhanced recommendations if more data available
    if (dataScope.includes('detailed_analytics')) {
      recommendations.push({
        recommendationId: uuidv4(),
        studentId,
        type: 'resource',
        title: 'Advanced Essay Structure Guide',
        description: 'Based on your writing patterns, this guide addresses your specific needs',
        rationale: 'Your essays show strong ideas but could benefit from better structure',
        dataUsed: ['detailed_analytics', 'learning_patterns'],
        confidenceScore: 0.85,
      });
    }

    return recommendations;
  }

  private calculateConfidence(dataScope: string[]): number {
    // More data = higher confidence
    const baseConfidence = 0.6;
    const confidenceBoost = dataScope.length * 0.1;
    return Math.min(0.95, baseConfidence + confidenceBoost);
  }
}