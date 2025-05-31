import prisma from '../../lib/prisma';
import { BoundaryIntelligence, ProposedAdjustment } from './BoundaryIntelligence';
import { NotificationService } from '../NotificationService';

export interface AdjustmentPattern {
  type: string;
  indicators: {
    metric: string;
    value: number;
    threshold: number;
    direction: 'above' | 'below';
  }[];
  confidence: number;
}

export interface PerformanceMetrics {
  assignmentId: string;
  timestamp: Date;
  metrics: {
    aiDependencyRate: number;
    strugglingRate: number;
    aiUsageRate: number;
    averageReflectionQuality: number;
    completionRate: number;
    averageTimeOnTask: number;
  };
  patterns: AdjustmentPattern[];
}

export class AutoAdjustmentEngine {
  /**
   * Monitor assignments and propose adjustments when patterns detected
   */
  static async monitorAndPropose(assignmentId: string): Promise<ProposedAdjustment[]> {
    try {
      // Analyze real-time performance
      const performance = await this.analyzeRealtimePerformance(assignmentId);
      
      // Detect patterns that might need adjustment
      const patterns = await this.detectPatterns(performance);
      
      // Generate proposals based on detected patterns
      const proposals: ProposedAdjustment[] = [];
      
      for (const pattern of patterns) {
        const proposal = await this.generateProposal(pattern, performance, assignmentId);
        if (proposal && await this.shouldProposeAdjustment(proposal, assignmentId)) {
          proposals.push(proposal);
        }
      }
      
      // Store proposals for educator review
      for (const proposal of proposals) {
        await this.submitForApproval(proposal);
      }
      
      return proposals;
    } catch (error) {
      console.error('Error monitoring and proposing adjustments:', error);
      throw error;
    }
  }

  /**
   * Analyze real-time performance metrics
   */
  private static async analyzeRealtimePerformance(assignmentId: string): Promise<PerformanceMetrics> {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: {
          include: {
            enrollments: true
          }
        }
      }
    });

    if (!assignment) throw new Error('Assignment not found');

    const studentIds = assignment.course.enrollments.map((e: any) => e.studentId);
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get recent metrics
    const [interactions, sessions, submissions, profiles] = await Promise.all([
      prisma.aIInteractionLog.findMany({
        where: {
          assignmentId,
          studentId: { in: studentIds },
          createdAt: { gte: oneWeekAgo }
        },
        include: { reflectionAnalyses: true }
      }),
      prisma.writingSession.findMany({
        where: {
          userId: { in: studentIds },
          document: { assignmentId },
          startTime: { gte: oneWeekAgo }
        },
        select: {
          userId: true,
          duration: true,
          activity: true,
          startTime: true
        }
      }),
      prisma.assignmentSubmission.findMany({
        where: {
          assignmentId,
          authorId: { in: studentIds }
        }
      }),
      prisma.studentProfile.findMany({
        where: {
          studentId: { in: studentIds }
        }
      })
    ]);

    // Calculate metrics
    const totalStudents = studentIds.length;
    const studentsWithHighLoad = profiles.filter(p => 
      p.currentCognitiveLoad === 'high' || p.currentCognitiveLoad === 'overload'
    ).length;
    
    const studentsUsingAI = new Set(interactions.map(i => i.studentId)).size;
    const completedSubmissions = submissions.filter(s => s.submittedAt !== null).length;
    
    // AI dependency calculation
    const dependentStudents = new Set<string>();
    studentIds.forEach((studentId: string) => {
      const studentInteractions = interactions.filter(i => i.studentId === studentId);
      const studentSessions = sessions.filter(s => s.userId === studentId);
      const totalHours = studentSessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 3600;
      
      if (totalHours > 0 && studentInteractions.length / totalHours > 5) {
        dependentStudents.add(studentId);
      }
    });
    
    // Reflection quality
    const reflectionScores = interactions
      .filter(i => i.reflectionAnalyses && i.reflectionAnalyses.length > 0)
      .map(i => i.reflectionAnalyses[0].overallQualityScore);
    const avgReflectionQuality = reflectionScores.length > 0
      ? reflectionScores.reduce((a: number, b: number) => a + b, 0) / reflectionScores.length
      : 0;
    
    // Average time on task
    const totalTime = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const avgTimeOnTask = sessions.length > 0 ? totalTime / sessions.length : 0;

    return {
      assignmentId,
      timestamp: now,
      metrics: {
        aiDependencyRate: dependentStudents.size / totalStudents,
        strugglingRate: studentsWithHighLoad / totalStudents,
        aiUsageRate: studentsUsingAI / totalStudents,
        averageReflectionQuality: avgReflectionQuality,
        completionRate: completedSubmissions / totalStudents,
        averageTimeOnTask: avgTimeOnTask / 60 // in minutes
      },
      patterns: []
    };
  }

  /**
   * Detect patterns that might require boundary adjustments
   */
  private static async detectPatterns(performance: PerformanceMetrics): Promise<AdjustmentPattern[]> {
    const patterns: AdjustmentPattern[] = [];
    const metrics = performance.metrics;

    // Pattern 1: Over-dependence
    if (metrics.aiDependencyRate > 0.6) {
      patterns.push({
        type: 'over_dependence',
        indicators: [{
          metric: 'aiDependencyRate',
          value: metrics.aiDependencyRate,
          threshold: 0.6,
          direction: 'above'
        }],
        confidence: metrics.aiDependencyRate > 0.7 ? 0.9 : 0.7
      });
    }

    // Pattern 2: Under-utilization with struggle
    if (metrics.aiUsageRate < 0.3 && metrics.strugglingRate > 0.4) {
      patterns.push({
        type: 'under_utilization',
        indicators: [
          {
            metric: 'aiUsageRate',
            value: metrics.aiUsageRate,
            threshold: 0.3,
            direction: 'below'
          },
          {
            metric: 'strugglingRate',
            value: metrics.strugglingRate,
            threshold: 0.4,
            direction: 'above'
          }
        ],
        confidence: 0.8
      });
    }

    // Pattern 3: Low engagement
    if (metrics.averageReflectionQuality < 40 && metrics.aiUsageRate > 0.5) {
      patterns.push({
        type: 'low_engagement',
        indicators: [
          {
            metric: 'averageReflectionQuality',
            value: metrics.averageReflectionQuality,
            threshold: 40,
            direction: 'below'
          },
          {
            metric: 'aiUsageRate',
            value: metrics.aiUsageRate,
            threshold: 0.5,
            direction: 'above'
          }
        ],
        confidence: 0.75
      });
    }

    // Pattern 4: Completion challenges
    if (metrics.completionRate < 0.5 && metrics.averageTimeOnTask > 120) {
      patterns.push({
        type: 'completion_challenges',
        indicators: [
          {
            metric: 'completionRate',
            value: metrics.completionRate,
            threshold: 0.5,
            direction: 'below'
          },
          {
            metric: 'averageTimeOnTask',
            value: metrics.averageTimeOnTask,
            threshold: 120,
            direction: 'above'
          }
        ],
        confidence: 0.85
      });
    }

    return patterns;
  }

  /**
   * Generate a proposal based on detected pattern
   */
  private static async generateProposal(
    pattern: AdjustmentPattern,
    performance: PerformanceMetrics,
    assignmentId: string
  ): Promise<ProposedAdjustment | null> {
    // Get affected students for the pattern
    const affectedStudents = await this.getAffectedStudents(pattern, assignmentId);
    
    switch (pattern.type) {
      case 'over_dependence':
        return {
          type: 'reduce_access',
          assignmentId,
          reason: `High AI dependency detected: ${Math.round(pattern.indicators[0].value * 100)}% of students are over-reliant on AI assistance`,
          specificChange: 'Reduce AI question limit from current setting to 3 questions per hour, increase reflection requirements to "analytical" level',
          affectedStudents,
          expectedOutcome: 'Students will develop stronger independent thinking skills and deeper engagement with their writing',
          evidence: pattern.indicators.map(ind => ({
            metric: this.formatMetricName(ind.metric),
            currentValue: ind.value,
            threshold: ind.threshold,
            trend: 'stable' // Would need historical data for actual trend
          })),
          requiresApproval: true
        };

      case 'under_utilization':
        return {
          type: 'increase_support',
          assignmentId,
          reason: `${Math.round(pattern.indicators[1].value * 100)}% of students are struggling but only ${Math.round(pattern.indicators[0].value * 100)}% are using AI support`,
          specificChange: 'Enable proactive AI prompts when struggle patterns detected, simplify initial question complexity',
          affectedStudents,
          expectedOutcome: 'Struggling students will receive timely support, reducing frustration and improving progress',
          evidence: pattern.indicators.map(ind => ({
            metric: this.formatMetricName(ind.metric),
            currentValue: ind.value,
            threshold: ind.threshold,
            trend: 'stable'
          })),
          requiresApproval: true
        };

      case 'low_engagement':
        return {
          type: 'modify_complexity',
          assignmentId,
          reason: `Low reflection quality (${Math.round(pattern.indicators[0].value)}%) despite moderate AI usage suggests mismatched question complexity`,
          specificChange: 'Adjust AI question complexity to "simplified" mode, add more concrete examples in prompts',
          affectedStudents,
          expectedOutcome: 'Improved reflection quality and deeper engagement with AI assistance',
          evidence: pattern.indicators.map(ind => ({
            metric: this.formatMetricName(ind.metric),
            currentValue: ind.value,
            threshold: ind.threshold,
            trend: 'decreasing'
          })),
          requiresApproval: true
        };

      case 'completion_challenges':
        return {
          type: 'temporal_shift',
          assignmentId,
          reason: `Low completion rate (${Math.round(pattern.indicators[0].value * 100)}%) with high time investment suggests need for staged support`,
          specificChange: 'Implement progressive AI support: higher access in early stages, tapering off as students progress',
          affectedStudents,
          expectedOutcome: 'Better scaffolding will help students maintain momentum and complete assignments',
          evidence: pattern.indicators.map(ind => ({
            metric: this.formatMetricName(ind.metric),
            currentValue: ind.value,
            threshold: ind.threshold,
            trend: 'stable'
          })),
          requiresApproval: true
        };

      default:
        return null;
    }
  }

  /**
   * Get students affected by a specific pattern
   */
  private static async getAffectedStudents(
    pattern: AdjustmentPattern,
    assignmentId: string
  ): Promise<string[]> {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: {
          include: {
            enrollments: {
              include: {
                student: {
                  include: {
                    studentProfile: true,
                    aiInteractionLogs: {
                      where: { assignmentId },
                      orderBy: { createdAt: 'desc' },
                      take: 10
                    },
                    writingSessions: {
                      where: { document: { assignmentId } },
                      orderBy: { startTime: 'desc' },
                      take: 5
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!assignment) return [];

    const affectedStudents: string[] = [];

    for (const enrollment of assignment.course.enrollments) {
      const student = enrollment.student;
      const profile = student.studentProfile;
      const interactions = student.aiInteractionLogs || [];
      const sessions = student.writingSessions || [];

      let isAffected = false;

      switch (pattern.type) {
        case 'over_dependence':
          const totalHours = sessions.reduce((acc: number, s: any) => acc + (s.duration || 0), 0) / 3600;
          const interactionsPerHour = totalHours > 0 ? interactions.length / totalHours : 0;
          isAffected = interactionsPerHour > 5;
          break;

        case 'under_utilization':
          const hasHighLoad = profile?.currentCognitiveLoad === 'high' || 
                             profile?.currentCognitiveLoad === 'overload';
          const hasLowAIUsage = interactions.length < 2;
          isAffected = hasHighLoad && hasLowAIUsage;
          break;

        case 'low_engagement':
          const hasInteractions = interactions.length > 0;
          const avgReflectionQuality = interactions
            .filter((i: any) => i.reflectionAnalyses && i.reflectionAnalyses.length > 0)
            .reduce((acc: number, i: any) => acc + (i.reflectionAnalyses[0]?.overallQualityScore || 0), 0) / 
            (interactions.filter((i: any) => i.reflectionAnalyses && i.reflectionAnalyses.length > 0).length || 1);
          isAffected = hasInteractions && avgReflectionQuality < 40;
          break;

        case 'completion_challenges':
          const submission = await prisma.assignmentSubmission.findFirst({
            where: { assignmentId, authorId: student.id }
          });
          const notSubmitted = !submission || !submission.submittedAt;
          const highTimeInvestment = sessions.reduce((acc: number, s: any) => acc + (s.duration || 0), 0) > 7200; // 2 hours
          isAffected = notSubmitted && highTimeInvestment;
          break;
      }

      if (isAffected) {
        affectedStudents.push(student.id);
      }
    }

    return affectedStudents;
  }

  /**
   * Check if we should propose this adjustment
   */
  private static async shouldProposeAdjustment(
    proposal: ProposedAdjustment,
    assignmentId: string
  ): Promise<boolean> {
    // Check for recent similar proposals
    const recentProposals = await prisma.boundaryProposal.findMany({
      where: {
        assignmentId,
        type: proposal.type,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });

    // Don't propose if similar proposal exists in last week
    if (recentProposals.length > 0) {
      return false;
    }

    // Don't propose if too few students affected
    if (proposal.affectedStudents.length < 3) {
      return false;
    }

    // Check confidence based on evidence
    const avgEvidence = proposal.evidence.reduce((acc, e) => {
      const deviation = Math.abs(e.currentValue - e.threshold) / e.threshold;
      return acc + deviation;
    }, 0) / proposal.evidence.length;

    // Only propose if significant deviation from thresholds
    return avgEvidence > 0.2;
  }

  /**
   * Submit proposal for educator approval
   */
  static async submitForApproval(proposal: ProposedAdjustment): Promise<void> {
    try {
      // Store proposal in database
      const storedProposal = await prisma.boundaryProposal.create({
        data: {
          assignmentId: proposal.assignmentId,
          type: proposal.type,
          reason: proposal.reason,
          specificChange: proposal.specificChange,
          affectedStudents: proposal.affectedStudents,
          expectedOutcome: proposal.expectedOutcome,
          evidence: proposal.evidence,
          status: 'pending'
        }
      });

      // Get assignment and course info for notification
      const assignment = await prisma.assignment.findUnique({
        where: { id: proposal.assignmentId },
        include: {
          course: {
            include: { instructor: true }
          }
        }
      });

      if (!assignment) return;

      // Notify educator
      await NotificationService.createNotification({
        userId: assignment.course.instructorId,
        type: 'boundary_proposal',
        title: 'AI Boundary Adjustment Proposed',
        message: `A new boundary adjustment has been proposed for "${assignment.title}": ${proposal.reason}`,
        priority: 'medium',
        metadata: {
          proposalId: storedProposal.id,
          assignmentId: proposal.assignmentId,
          type: proposal.type,
          affectedCount: proposal.affectedStudents.length
        }
      });

      console.log(`Boundary proposal submitted for assignment ${proposal.assignmentId}`);
    } catch (error) {
      console.error('Error submitting proposal for approval:', error);
      throw error;
    }
  }

  /**
   * Approve a proposal and implement changes
   */
  static async approveProposal(
    proposalId: string,
    educatorId: string,
    educatorNotes?: string
  ): Promise<void> {
    try {
      // Get the proposal
      const proposal = await prisma.boundaryProposal.findUnique({
        where: { id: proposalId },
        include: { assignment: true }
      });

      if (!proposal) throw new Error('Proposal not found');
      if (proposal.status !== 'pending') throw new Error('Proposal already processed');

      // Update proposal status
      await prisma.boundaryProposal.update({
        where: { id: proposalId },
        data: {
          status: 'approved',
          approvedBy: educatorId,
          approvedAt: new Date(),
          educatorNotes
        }
      });

      // Implement the changes
      await this.implementProposal(proposal);

      // Log the adjustment
      await prisma.boundaryAdjustmentLog.create({
        data: {
          assignmentId: proposal.assignmentId,
          proposalId: proposal.id,
          previousValue: proposal.assignment.aiBoundarySettings || {},
          newValue: await this.calculateNewBoundaries(proposal),
          reason: proposal.reason,
          implementedBy: educatorId
        }
      });

      // Notify affected students
      for (const studentId of proposal.affectedStudents) {
        await NotificationService.createNotification({
          userId: studentId,
          type: 'boundary_adjusted',
          title: 'AI Support Settings Updated',
          message: 'Your educator has adjusted the AI support settings for this assignment to better support your learning.',
          priority: 'low',
          metadata: {
            assignmentId: proposal.assignmentId,
            changeType: proposal.type
          }
        });
      }
    } catch (error) {
      console.error('Error approving proposal:', error);
      throw error;
    }
  }

  /**
   * Reject a proposal
   */
  static async rejectProposal(
    proposalId: string,
    educatorId: string,
    reason: string
  ): Promise<void> {
    await prisma.boundaryProposal.update({
      where: { id: proposalId },
      data: {
        status: 'rejected',
        educatorNotes: reason,
        approvedBy: educatorId,
        approvedAt: new Date()
      }
    });
  }

  /**
   * Implement approved proposal changes
   */
  private static async implementProposal(proposal: any): Promise<void> {
    const newBoundaries = await this.calculateNewBoundaries(proposal);

    await prisma.assignment.update({
      where: { id: proposal.assignmentId },
      data: {
        aiBoundarySettings: newBoundaries,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Calculate new boundary settings based on proposal
   */
  private static async calculateNewBoundaries(proposal: any): Promise<any> {
    const currentBoundaries = proposal.assignment.aiBoundarySettings as any || {
      questionsPerHour: 5,
      reflectionRequirement: 'basic',
      complexityLevel: 'adaptive',
      proactivePrompts: false
    };

    const newBoundaries = { ...currentBoundaries };

    switch (proposal.type) {
      case 'reduce_access':
        newBoundaries.questionsPerHour = 3;
        newBoundaries.reflectionRequirement = 'analytical';
        break;

      case 'increase_support':
        newBoundaries.proactivePrompts = true;
        newBoundaries.complexityLevel = 'simplified';
        newBoundaries.struggleDetection = true;
        break;

      case 'modify_complexity':
        newBoundaries.complexityLevel = 'simplified';
        newBoundaries.includeExamples = true;
        break;

      case 'temporal_shift':
        newBoundaries.temporalStrategy = {
          early: { questionsPerHour: 8, complexity: 'simplified' },
          middle: { questionsPerHour: 5, complexity: 'adaptive' },
          late: { questionsPerHour: 2, complexity: 'advanced' }
        };
        break;
    }

    return newBoundaries;
  }

  /**
   * Format metric name for display
   */
  private static formatMetricName(metric: string): string {
    const names: Record<string, string> = {
      aiDependencyRate: 'AI Dependency Rate',
      strugglingRate: 'Struggling Student Rate',
      aiUsageRate: 'AI Usage Rate',
      averageReflectionQuality: 'Average Reflection Quality',
      completionRate: 'Assignment Completion Rate',
      averageTimeOnTask: 'Average Time on Task'
    };
    return names[metric] || metric;
  }
}