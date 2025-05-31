import prisma from '../../lib/prisma';
import { LearningAnalyticsService } from '../LearningAnalyticsService';
import { StudentLearningProfileService } from './StudentLearningProfileService';
import { AIBoundaryService } from '../AIBoundaryService';
import { CacheService, CacheKeys, CacheTTL } from '../CacheService';

export interface ClassAnalytics {
  courseId: string;
  assignmentId: string;
  studentCount: number;
  averageAIUsage: number;
  averageReflectionQuality: number;
  strugglingStudentRatio: number;
  overDependentRatio: number;
  underUtilizingRatio: number;
  completionRate: number;
  averageTimeToComplete: number;
  boundaryEffectiveness: {
    questionsPerHour: number;
    currentImpact: number;
    utilizationRate: number;
  };
}

export interface StudentSegment {
  type: 'thriving' | 'progressing' | 'struggling' | 'over-dependent' | 'under-utilizing';
  students: Array<{
    id: string;
    name: string;
    primaryIssue: string;
    metrics: {
      aiUsageRate: number;
      reflectionQuality: number;
      independenceScore: number;
      progressRate: number;
    };
  }>;
}

export interface BoundaryChange {
  parameter: string;
  currentValue: any;
  recommendedValue: any;
  rationale: string;
  expectedImpact: string;
}

export interface BoundaryRecommendation {
  assignmentId: string;
  recommendationType: 'class_wide' | 'individual' | 'temporal';
  
  // Class-wide recommendations
  classAdjustments?: {
    currentEffectiveness: number; // 0-100
    recommendedChanges: BoundaryChange[];
    evidence: string[];
    expectedImpact: string;
  };
  
  // Individual differentiation
  individualAdjustments?: {
    studentId: string;
    currentIssue: string;
    recommendedBoundary: string;
    duration: string;
    monitoringPlan: string;
  }[];
  
  // Temporal optimization
  temporalStrategy?: {
    phase: 'early' | 'middle' | 'late';
    currentSupport: string;
    recommendedSupport: string;
    rationale: string;
  };
}

export interface ProposedAdjustment {
  id?: string;
  type: 'reduce_access' | 'increase_support' | 'modify_complexity' | 'temporal_shift';
  assignmentId: string;
  reason: string;
  specificChange: string;
  affectedStudents: string[];
  expectedOutcome: string;
  evidence: {
    metric: string;
    currentValue: number;
    threshold: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }[];
  requiresApproval: boolean;
  status?: 'pending' | 'approved' | 'rejected' | 'implemented';
  educatorNotes?: string;
}

export class BoundaryIntelligence {
  /**
   * Analyze class performance and recommend boundary adjustments
   */
  static async analyzeBoundaryEffectiveness(
    courseId: string,
    assignmentId: string
  ): Promise<BoundaryRecommendation[]> {
    try {
      // Get comprehensive analytics
      const analytics = await this.gatherClassAnalytics(courseId, assignmentId);
      
      // Segment students by needs
      const segments = await this.segmentStudents(analytics, courseId, assignmentId);
      
      // Analyze boundary effectiveness
      const effectiveness = await this.assessCurrentBoundaries(analytics, assignmentId);
      
      const recommendations: BoundaryRecommendation[] = [];
      
      // Class-wide recommendations
      if (effectiveness.overall < 70) {
        recommendations.push({
          assignmentId,
          recommendationType: 'class_wide',
          classAdjustments: {
            currentEffectiveness: effectiveness.overall,
            recommendedChanges: this.generateClassChanges(analytics, effectiveness),
            evidence: effectiveness.issues,
            expectedImpact: 'Improved engagement and learning outcomes'
          }
        });
      }
      
      // Individual recommendations
      const strugglingSegment = segments.find(s => s.type === 'struggling');
      const overDependentSegment = segments.find(s => s.type === 'over-dependent');
      
      const individualAdjustments: any[] = [];
      
      if (strugglingSegment && strugglingSegment.students.length > 0) {
        individualAdjustments.push(...strugglingSegment.students.map(student => ({
          studentId: student.id,
          currentIssue: student.primaryIssue,
          recommendedBoundary: this.recommendIndividualBoundary(student, 'struggling'),
          duration: '1-2 weeks',
          monitoringPlan: 'Daily progress checks with weekly adjustments'
        })));
      }
      
      if (overDependentSegment && overDependentSegment.students.length > 0) {
        individualAdjustments.push(...overDependentSegment.students.map(student => ({
          studentId: student.id,
          currentIssue: student.primaryIssue,
          recommendedBoundary: this.recommendIndividualBoundary(student, 'over-dependent'),
          duration: '2-3 weeks',
          monitoringPlan: 'Track independence metrics, gradual reduction'
        })));
      }
      
      if (individualAdjustments.length > 0) {
        recommendations.push({
          assignmentId,
          recommendationType: 'individual',
          individualAdjustments
        });
      }
      
      // Temporal recommendations
      const optimalTiming = await this.calculateOptimalTiming(analytics, assignmentId);
      recommendations.push({
        assignmentId,
        recommendationType: 'temporal',
        temporalStrategy: optimalTiming
      });
      
      return recommendations;
    } catch (error) {
      console.error('Error analyzing boundary effectiveness:', error);
      throw error;
    }
  }

  /**
   * Auto-adjust boundaries based on real-time data (with educator approval)
   */
  static async proposeAutoAdjustments(
    assignmentId: string
  ): Promise<ProposedAdjustment[]> {
    try {
      const currentBoundaries = await this.getCurrentBoundaries(assignmentId);
      const performance = await this.getRealtimePerformance(assignmentId);
      
      const proposals: ProposedAdjustment[] = [];
      
      // Detect over-dependence pattern
      if (performance.aiDependencyRate > 0.7) {
        proposals.push({
          type: 'reduce_access',
          assignmentId,
          reason: 'High AI dependency detected across multiple students',
          specificChange: 'Reduce AI interactions from 5/hour to 3/hour',
          affectedStudents: performance.dependentStudents,
          expectedOutcome: 'Increased independent thinking',
          evidence: [{
            metric: 'AI Dependency Rate',
            currentValue: performance.aiDependencyRate,
            threshold: 0.7,
            trend: performance.dependencyTrend
          }],
          requiresApproval: true
        });
      }
      
      // Detect under-utilization
      if (performance.aiUsageRate < 0.2 && performance.strugglingRate > 0.3) {
        proposals.push({
          type: 'increase_support',
          assignmentId,
          reason: 'Students struggling but not using available AI support',
          specificChange: 'Add proactive AI prompts at struggle detection',
          affectedStudents: performance.strugglingStudents,
          expectedOutcome: 'Better support utilization',
          evidence: [
            {
              metric: 'AI Usage Rate',
              currentValue: performance.aiUsageRate,
              threshold: 0.2,
              trend: 'stable'
            },
            {
              metric: 'Struggling Student Rate',
              currentValue: performance.strugglingRate,
              threshold: 0.3,
              trend: 'increasing'
            }
          ],
          requiresApproval: true
        });
      }
      
      // Detect need for complexity adjustment
      if (performance.averageReflectionQuality < 50 && performance.aiUsageRate > 0.5) {
        proposals.push({
          type: 'modify_complexity',
          assignmentId,
          reason: 'Low reflection quality despite high AI usage suggests questions may be too complex',
          specificChange: 'Simplify AI question complexity to match student level',
          affectedStudents: performance.lowReflectionStudents,
          expectedOutcome: 'Improved reflection quality and engagement',
          evidence: [{
            metric: 'Average Reflection Quality',
            currentValue: performance.averageReflectionQuality,
            threshold: 50,
            trend: 'decreasing'
          }],
          requiresApproval: true
        });
      }
      
      return proposals;
    } catch (error) {
      console.error('Error proposing auto adjustments:', error);
      throw error;
    }
  }

  /**
   * Gather comprehensive class analytics
   */
  private static async gatherClassAnalytics(
    courseId: string,
    assignmentId: string
  ): Promise<ClassAnalytics> {
    // Check cache first
    const cacheKey = CacheKeys.classAnalytics(courseId, assignmentId);
    const cached = CacheService.get<ClassAnalytics>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get all students in the course
    const students = await prisma.user.findMany({
      where: {
        enrollments: {
          some: { courseId }
        }
      },
      include: {
        studentProfile: true
      }
    });

    const studentIds = students.map(s => s.id);

    // Get writing sessions
    const sessions = await prisma.writingSession.findMany({
      where: {
        userId: { in: studentIds },
        document: { assignmentId }
      },
      select: {
        userId: true,
        duration: true,
        activity: true,
        document: {
          select: {
            assignmentId: true
          }
        }
      }
    });

    // Get AI interactions
    const interactions = await prisma.aIInteractionLog.findMany({
      where: {
        studentId: { in: studentIds },
        assignmentId
      },
      include: {
        reflectionAnalyses: true
      }
    });

    // Get submissions
    const submissions = await prisma.assignmentSubmission.findMany({
      where: {
        assignmentId,
        authorId: { in: studentIds }
      }
    });

    // Get current boundaries
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { 
        aiBoundarySettings: true,
        dueDate: true,
        createdAt: true
      }
    });

    // Calculate metrics
    const totalStudents = students.length;
    const completedSubmissions = submissions.filter(s => s.submittedAt !== null).length;
    
    // AI usage metrics
    const studentsWithAI = new Set(interactions.map(i => i.studentId)).size;
    const totalInteractions = interactions.length;
    const averageInteractionsPerStudent = totalInteractions / (studentsWithAI || 1);
    
    // Reflection quality
    const reflectionScores = interactions
      .filter(i => i.reflectionAnalyses && i.reflectionAnalyses.length > 0)
      .map(i => i.reflectionAnalyses[0].overallQualityScore);
    const averageReflectionQuality = reflectionScores.length > 0
      ? reflectionScores.reduce((a: number, b: number) => a + b, 0) / reflectionScores.length
      : 0;
    
    // Time metrics
    const sessionDurations = sessions.map(s => s.duration || 0);
    const averageTimeToComplete = sessionDurations.length > 0
      ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
      : 0;

    // Identify struggling students
    const strugglingCount = students.filter(s => {
      const profile = s.studentProfile;
      return profile && (
        profile.currentCognitiveLoad === 'high' ||
        profile.currentCognitiveLoad === 'overload' ||
        profile.independenceTrend === 'decreasing'
      );
    }).length;

    // Identify over-dependent students
    const overDependentCount = students.filter(s => {
      const studentInteractions = interactions.filter(i => i.studentId === s.id);
      const studentSessions = sessions.filter(sess => sess.userId === s.id);
      const totalSessionTime = studentSessions.reduce((acc, sess) => acc + (sess.duration || 0), 0) / 3600; // in hours
      const interactionsPerHour = totalSessionTime > 0 ? studentInteractions.length / totalSessionTime : 0;
      
      return interactionsPerHour > 5; // More than 5 interactions per hour
    }).length;

    // Under-utilizing students
    const underUtilizingCount = students.filter(s => {
      const hasInteractions = interactions.some(i => i.studentId === s.id);
      const profile = s.studentProfile;
      const isStruggling = profile && (
        profile.currentCognitiveLoad === 'high' ||
        profile.currentCognitiveLoad === 'overload'
      );
      
      return !hasInteractions && isStruggling;
    }).length;

    const currentBoundaries = assignment?.aiBoundarySettings as any || {};
    const questionsPerHour = currentBoundaries.questionsPerHour || 5;

    const analytics = {
      courseId,
      assignmentId,
      studentCount: totalStudents,
      averageAIUsage: averageInteractionsPerStudent,
      averageReflectionQuality,
      strugglingStudentRatio: strugglingCount / totalStudents,
      overDependentRatio: overDependentCount / totalStudents,
      underUtilizingRatio: underUtilizingCount / totalStudents,
      completionRate: completedSubmissions / totalStudents,
      averageTimeToComplete,
      boundaryEffectiveness: {
        questionsPerHour,
        currentImpact: this.calculateImpact(averageReflectionQuality, completedSubmissions / totalStudents),
        utilizationRate: studentsWithAI / totalStudents
      }
    };

    // Cache the analytics
    CacheService.set(cacheKey, analytics, CacheTTL.classAnalytics);

    return analytics;
  }

  /**
   * Segment students by their needs and patterns
   */
  private static async segmentStudents(
    analytics: ClassAnalytics,
    courseId: string,
    assignmentId: string
  ): Promise<StudentSegment[]> {
    const students = await prisma.user.findMany({
      where: {
        enrollments: {
          some: { courseId }
        }
      },
      include: {
        studentProfile: true,
        aiInteractionLogs: {
          where: { assignmentId },
          include: { reflectionAnalyses: true }
        },
        writingSessions: {
          where: { document: { assignmentId } }
        }
      }
    });

    const segments: StudentSegment[] = [
      { type: 'thriving', students: [] },
      { type: 'progressing', students: [] },
      { type: 'struggling', students: [] },
      { type: 'over-dependent', students: [] },
      { type: 'under-utilizing', students: [] }
    ];

    for (const student of students) {
      const profile = student.studentProfile;
      const interactions = student.aiInteractionLogs || [];
      const sessions = student.writingSessions || [];
      
      // Calculate metrics
      const totalSessionTime = sessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 3600; // in hours
      const aiUsageRate = totalSessionTime > 0 ? interactions.length / totalSessionTime : 0;
      
      const reflectionScores = interactions
        .filter(i => i.reflectionAnalyses && i.reflectionAnalyses.length > 0)
        .map(i => i.reflectionAnalyses[0].overallQualityScore);
      const avgReflectionQuality = reflectionScores.length > 0
        ? reflectionScores.reduce((a: number, b: number) => a + b, 0) / reflectionScores.length
        : 0;
      
      const independenceScore = profile?.qualityWithoutAI || 50;
      
      // Progress rate (words per hour)
      const latestSession = sessions.sort((a: any, b: any) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      )[0];
      const progressRate = latestSession?.activity 
        ? (latestSession.activity as any).wordsAdded / ((latestSession.duration || 1) / 3600)
        : 0;

      const studentMetrics = {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        primaryIssue: '',
        metrics: {
          aiUsageRate,
          reflectionQuality: avgReflectionQuality,
          independenceScore,
          progressRate
        }
      };

      // Segment logic
      if (aiUsageRate > 5) {
        studentMetrics.primaryIssue = 'Excessive AI dependency';
        segments.find(s => s.type === 'over-dependent')!.students.push(studentMetrics);
      } else if (profile?.currentCognitiveLoad === 'overload' || profile?.currentCognitiveLoad === 'high') {
        if (aiUsageRate < 1) {
          studentMetrics.primaryIssue = 'Struggling without using available support';
          segments.find(s => s.type === 'under-utilizing')!.students.push(studentMetrics);
        } else {
          studentMetrics.primaryIssue = 'High cognitive load despite AI usage';
          segments.find(s => s.type === 'struggling')!.students.push(studentMetrics);
        }
      } else if (avgReflectionQuality >= 70 && independenceScore >= 70) {
        studentMetrics.primaryIssue = 'Excellent balance of AI usage and independence';
        segments.find(s => s.type === 'thriving')!.students.push(studentMetrics);
      } else {
        studentMetrics.primaryIssue = 'Making steady progress';
        segments.find(s => s.type === 'progressing')!.students.push(studentMetrics);
      }
    }

    return segments.filter(s => s.students.length > 0);
  }

  /**
   * Assess current boundary effectiveness
   */
  private static async assessCurrentBoundaries(
    analytics: ClassAnalytics,
    assignmentId: string
  ): Promise<{ overall: number; issues: string[] }> {
    const issues: string[] = [];
    let effectivenessScore = 100;

    // Check for over-dependence
    if (analytics.overDependentRatio > 0.3) {
      issues.push(`${Math.round(analytics.overDependentRatio * 100)}% of students show AI over-dependence`);
      effectivenessScore -= 20;
    }

    // Check for under-utilization
    if (analytics.underUtilizingRatio > 0.2) {
      issues.push(`${Math.round(analytics.underUtilizingRatio * 100)}% of struggling students not using AI support`);
      effectivenessScore -= 15;
    }

    // Check reflection quality
    if (analytics.averageReflectionQuality < 60) {
      issues.push(`Average reflection quality (${Math.round(analytics.averageReflectionQuality)}%) below target`);
      effectivenessScore -= 15;
    }

    // Check completion rate
    if (analytics.completionRate < 0.7) {
      issues.push(`Low completion rate (${Math.round(analytics.completionRate * 100)}%)`);
      effectivenessScore -= 10;
    }

    // Check utilization rate
    if (analytics.boundaryEffectiveness.utilizationRate < 0.5) {
      issues.push(`Low AI utilization rate (${Math.round(analytics.boundaryEffectiveness.utilizationRate * 100)}%)`);
      effectivenessScore -= 10;
    }

    return {
      overall: Math.max(0, effectivenessScore),
      issues
    };
  }

  /**
   * Generate class-wide boundary changes
   */
  private static generateClassChanges(
    analytics: ClassAnalytics,
    effectiveness: { overall: number; issues: string[] }
  ): BoundaryChange[] {
    const changes: BoundaryChange[] = [];

    // Address over-dependence
    if (analytics.overDependentRatio > 0.3) {
      changes.push({
        parameter: 'questionsPerHour',
        currentValue: analytics.boundaryEffectiveness.questionsPerHour,
        recommendedValue: Math.max(2, analytics.boundaryEffectiveness.questionsPerHour - 2),
        rationale: 'High AI dependency detected - reducing access to encourage independent thinking',
        expectedImpact: '20-30% reduction in AI requests, improved independent problem-solving'
      });

      changes.push({
        parameter: 'reflectionRequirement',
        currentValue: 'basic',
        recommendedValue: 'analytical',
        rationale: 'Requiring deeper reflection to ensure meaningful AI usage',
        expectedImpact: 'Improved reflection quality and reduced superficial AI requests'
      });
    }

    // Address under-utilization
    if (analytics.underUtilizingRatio > 0.2) {
      changes.push({
        parameter: 'proactivePrompts',
        currentValue: false,
        recommendedValue: true,
        rationale: 'Enable proactive AI suggestions when struggle detected',
        expectedImpact: 'Better support utilization by struggling students'
      });

      changes.push({
        parameter: 'struggleDetectionSensitivity',
        currentValue: 'normal',
        recommendedValue: 'high',
        rationale: 'Increase sensitivity to detect struggling students earlier',
        expectedImpact: 'Earlier intervention and support for at-risk students'
      });
    }

    // Address low reflection quality
    if (analytics.averageReflectionQuality < 60) {
      changes.push({
        parameter: 'questionComplexity',
        currentValue: 'adaptive',
        recommendedValue: 'simplified',
        rationale: 'Simplify questions to improve engagement and reflection quality',
        expectedImpact: '15-20% improvement in reflection quality scores'
      });
    }

    return changes;
  }

  /**
   * Recommend individual boundary adjustments
   */
  private static recommendIndividualBoundary(
    student: any,
    segmentType: string
  ): string {
    switch (segmentType) {
      case 'over-dependent':
        return 'Gradual reduction: 3 questions/hour week 1, 2 questions/hour week 2, with emphasis on reflection depth';
      
      case 'struggling':
        if (student.metrics.aiUsageRate < 1) {
          return 'Increase access to 8 questions/hour with proactive prompts and simplified questions';
        } else {
          return 'Maintain current access but switch to more scaffolded, step-by-step questions';
        }
      
      case 'under-utilizing':
        return 'Enable push notifications for AI assistance, reduce barriers with quick-access prompts';
      
      default:
        return 'Maintain current boundaries with continued monitoring';
    }
  }

  /**
   * Calculate optimal temporal strategy
   */
  private static async calculateOptimalTiming(
    analytics: ClassAnalytics,
    assignmentId: string
  ): Promise<any> {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: {
        createdAt: true,
        dueDate: true
      }
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    const now = new Date();
    const totalDuration = assignment.dueDate!.getTime() - assignment.createdAt.getTime();
    const elapsed = now.getTime() - assignment.createdAt.getTime();
    const progress = elapsed / totalDuration;

    let phase: 'early' | 'middle' | 'late';
    let currentSupport: string;
    let recommendedSupport: string;
    let rationale: string;

    if (progress < 0.33) {
      phase = 'early';
      currentSupport = `${analytics.boundaryEffectiveness.questionsPerHour} questions/hour`;
      
      if (analytics.strugglingStudentRatio > 0.3) {
        recommendedSupport = 'Increase to 7-8 questions/hour with brainstorming focus';
        rationale = 'Early phase requires more support for idea generation and topic exploration';
      } else {
        recommendedSupport = 'Maintain current level with emphasis on exploratory questions';
        rationale = 'Current support level appropriate for early exploration phase';
      }
    } else if (progress < 0.67) {
      phase = 'middle';
      currentSupport = `${analytics.boundaryEffectiveness.questionsPerHour} questions/hour`;
      recommendedSupport = 'Moderate at 4-5 questions/hour focusing on structure and argument development';
      rationale = 'Middle phase should balance support with independence building';
    } else {
      phase = 'late';
      currentSupport = `${analytics.boundaryEffectiveness.questionsPerHour} questions/hour`;
      recommendedSupport = 'Reduce to 2-3 questions/hour for revision and polish only';
      rationale = 'Late phase should emphasize independent refinement with minimal AI assistance';
    }

    return {
      phase,
      currentSupport,
      recommendedSupport,
      rationale
    };
  }

  /**
   * Calculate impact score
   */
  private static calculateImpact(reflectionQuality: number, completionRate: number): number {
    return Math.round((reflectionQuality * 0.6 + completionRate * 100 * 0.4));
  }

  /**
   * Get current boundaries for an assignment
   */
  private static async getCurrentBoundaries(assignmentId: string): Promise<any> {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { aiBoundarySettings: true }
    });

    return assignment?.aiBoundarySettings || {
      questionsPerHour: 5,
      reflectionRequirement: 'basic',
      complexityLevel: 'adaptive'
    };
  }

  /**
   * Get real-time performance metrics
   */
  private static async getRealtimePerformance(assignmentId: string): Promise<any> {
    const course = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { courseId: true }
    });

    if (!course) throw new Error('Assignment not found');

    const students = await prisma.user.findMany({
      where: {
        enrollments: {
          some: { courseId: course.courseId }
        }
      },
      include: {
        studentProfile: true,
        aiInteractionLogs: {
          where: { 
            assignmentId,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          },
          include: { reflectionAnalyses: true }
        },
        writingSessions: {
          where: { 
            document: { assignmentId },
            startTime: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        }
      }
    });

    const totalStudents = students.length;
    let dependentCount = 0;
    let strugglingCount = 0;
    let totalAIUsage = 0;
    let totalReflectionQuality = 0;
    let reflectionCount = 0;
    const dependentStudents: string[] = [];
    const strugglingStudents: string[] = [];
    const lowReflectionStudents: string[] = [];

    // Track dependency trend
    const weeklyInteractions: number[] = [];
    
    for (const student of students) {
      const interactions = student.aiInteractionLogs;
      const sessions = student.writingSessions;
      const profile = student.studentProfile;
      
      // Calculate usage rate
      const totalSessionTime = sessions.reduce((acc: number, s: any) => acc + (s.duration || 0), 0) / 3600; // hours
      const usageRate = totalSessionTime > 0 ? interactions.length / totalSessionTime : 0;
      
      if (usageRate > 5) {
        dependentCount++;
        dependentStudents.push(student.id);
      }
      
      if (profile?.currentCognitiveLoad === 'high' || profile?.currentCognitiveLoad === 'overload') {
        strugglingCount++;
        strugglingStudents.push(student.id);
      }
      
      // Reflection quality
      const reflections = interactions.filter((i: any) => i.reflectionAnalyses && i.reflectionAnalyses.length > 0);
      reflections.forEach((r: any) => {
        const quality = r.reflectionAnalyses[0].overallQualityScore;
        totalReflectionQuality += quality;
        reflectionCount++;
        
        if (quality < 50) {
          lowReflectionStudents.push(student.id);
        }
      });
      
      if (interactions.length > 0) {
        totalAIUsage++;
      }
      
      // Weekly trend
      weeklyInteractions.push(interactions.length);
    }

    // Calculate trends
    const avgInteractionsLastWeek = weeklyInteractions.reduce((a, b) => a + b, 0) / weeklyInteractions.length;
    const dependencyTrend = avgInteractionsLastWeek > 20 ? 'increasing' : 
                           avgInteractionsLastWeek < 10 ? 'decreasing' : 'stable';

    return {
      aiDependencyRate: dependentCount / totalStudents,
      strugglingRate: strugglingCount / totalStudents,
      aiUsageRate: totalAIUsage / totalStudents,
      averageReflectionQuality: reflectionCount > 0 ? totalReflectionQuality / reflectionCount : 0,
      dependentStudents: [...new Set(dependentStudents)],
      strugglingStudents: [...new Set(strugglingStudents)],
      lowReflectionStudents: [...new Set(lowReflectionStudents)],
      dependencyTrend
    };
  }
}