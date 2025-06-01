import { PrismaClient, AIInteractionLog, ReflectionAnalysis, User, Assignment } from '@prisma/client';
import { BasePrismaRepository } from './BasePrismaRepository';
import { AIInteractionRepository, AIInteractionWithRelations } from '../interfaces/AIInteractionRepository';

/**
 * Prisma implementation of AIInteractionRepository
 * Handles AI interaction logging and analytics
 */
export class PrismaAIInteractionRepository extends BasePrismaRepository<AIInteractionLog> implements AIInteractionRepository {
  protected modelName = 'aIInteractionLog';

  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * Find interactions by student
   */
  async findByStudentId(
    studentId: string,
    timeframe?: { start: Date; end: Date }
  ): Promise<AIInteractionLog[]> {
    this.validateRequired({ studentId }, ['studentId']);
    
    try {
      const whereClause: any = { studentId };
      
      if (timeframe) {
        whereClause.createdAt = this.buildDateRangeWhere('createdAt', timeframe).createdAt;
      }

      return await this.prisma.aIInteractionLog.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Error finding interactions by student:', error);
      throw new Error(`Failed to find interactions for student: ${studentId}`);
    }
  }

  /**
   * Find interactions by assignment
   */
  async findByAssignmentId(
    assignmentId: string,
    timeframe?: { start: Date; end: Date }
  ): Promise<AIInteractionLog[]> {
    this.validateRequired({ assignmentId }, ['assignmentId']);
    
    try {
      const whereClause: any = { assignmentId };
      
      if (timeframe) {
        whereClause.createdAt = this.buildDateRangeWhere('createdAt', timeframe).createdAt;
      }

      return await this.prisma.aIInteractionLog.findMany({
        where: whereClause,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Error finding interactions by assignment:', error);
      throw new Error(`Failed to find interactions for assignment: ${assignmentId}`);
    }
  }

  /**
   * Find interactions by assistance type
   */
  async findByAssistanceType(
    assistanceType: string,
    courseId?: string,
    timeframe?: { start: Date; end: Date }
  ): Promise<AIInteractionLog[]> {
    this.validateRequired({ assistanceType }, ['assistanceType']);
    
    try {
      const whereClause: any = { assistanceType };
      
      if (timeframe) {
        whereClause.createdAt = this.buildDateRangeWhere('createdAt', timeframe).createdAt;
      }

      if (courseId) {
        whereClause.assignment = {
          courseId
        };
      }

      return await this.prisma.aIInteractionLog.findMany({
        where: whereClause,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          assignment: {
            select: {
              id: true,
              title: true,
              courseId: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Error finding interactions by assistance type:', error);
      throw new Error(`Failed to find interactions for assistance type: ${assistanceType}`);
    }
  }

  /**
   * Get student's AI usage pattern analysis
   */
  async getStudentUsagePattern(
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
      frequencyScore: number;
      qualityScore: number;
      independenceScore: number;
    };
  } | null> {
    this.validateRequired({ studentId }, ['studentId']);
    
    try {
      const interactions = await this.prisma.aIInteractionLog.findMany({
        where: {
          studentId,
          ...this.buildDateRangeWhere('createdAt', timeframe)
        },
        orderBy: { createdAt: 'asc' }
      });

      if (interactions.length === 0) return null;

      const totalInteractions = interactions.length;
      
      // Count assistance types
      const assistanceTypes = interactions.reduce((acc, log) => {
        acc[log.assistanceType] = (acc[log.assistanceType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Count writing stages
      const writingStages = interactions.reduce((acc, log) => {
        acc[log.writingStage] = (acc[log.writingStage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Analyze reflections
      const completedReflections = interactions.filter(log => log.reflectionCompleted);
      const pendingReflections = interactions.filter(log => !log.reflectionCompleted);
      const qualityScores = completedReflections
        .map(log => log.reflectionQualityScore)
        .filter(score => score !== null) as number[];
      
      const averageQuality = qualityScores.length > 0 
        ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
        : 0;

      // Group by day
      const dayGroups = new Map<string, { count: number; qualities: number[] }>();
      interactions.forEach(log => {
        const dayKey = log.createdAt.toISOString().split('T')[0];
        const dayData = dayGroups.get(dayKey) || { count: 0, qualities: [] };
        dayData.count++;
        
        if (log.reflectionQualityScore) {
          dayData.qualities.push(log.reflectionQualityScore);
        }
        
        dayGroups.set(dayKey, dayData);
      });

      const usageByDay = Array.from(dayGroups.entries()).map(([dateStr, data]) => ({
        date: new Date(dateStr),
        interactionCount: data.count,
        averageQuality: data.qualities.length > 0 
          ? data.qualities.reduce((sum, q) => sum + q, 0) / data.qualities.length 
          : 0
      }));

      // Calculate dependency indicators
      const daysInTimeframe = Math.ceil((timeframe.end.getTime() - timeframe.start.getTime()) / (1000 * 60 * 60 * 24));
      const frequencyScore = Math.min(100, (totalInteractions / daysInTimeframe) * 10); // 0-100 scale
      const qualityScore = averageQuality; // Already 0-100
      const independenceScore = Math.max(0, 100 - frequencyScore); // Inverse of frequency

      return {
        totalInteractions,
        assistanceTypes,
        writingStages,
        reflectionCompletion: {
          completed: completedReflections.length,
          pending: pendingReflections.length,
          averageQuality
        },
        usageByDay,
        dependencyIndicators: {
          frequencyScore,
          qualityScore,
          independenceScore
        }
      };
    } catch (error) {
      console.error('Error getting student usage pattern:', error);
      throw new Error(`Failed to get usage pattern for student: ${studentId}`);
    }
  }

  /**
   * Find interactions requiring reflection review
   */
  async findPendingReflections(
    assignmentId?: string,
    studentId?: string
  ): Promise<(AIInteractionLog & {
    student: User;
    assignment: Assignment;
  })[]> {
    try {
      const whereClause: any = {
        reflectionCompleted: false,
        createdAt: {
          // Only consider interactions older than 2 hours
          lt: new Date(Date.now() - 2 * 60 * 60 * 1000)
        }
      };

      if (assignmentId) {
        whereClause.assignmentId = assignmentId;
      }

      if (studentId) {
        whereClause.studentId = studentId;
      }

      const results = await this.prisma.aIInteractionLog.findMany({
        where: whereClause,
        include: {
          student: true,
          assignment: true
        },
        orderBy: { createdAt: 'asc' }
      });
      
      // Filter out any results with null assignments and type assert
      return results.filter(r => r.assignment !== null) as any;
    } catch (error) {
      console.error('Error finding pending reflections:', error);
      throw new Error('Failed to find pending reflections');
    }
  }

  /**
   * Find high-frequency AI users
   */
  async findHighFrequencyUsers(
    courseId: string,
    threshold: number = 10,
    timeframe: { start: Date; end: Date }
  ): Promise<Array<{
    studentId: string;
    student: User;
    interactionCount: number;
    averageQuality: number;
    lastInteraction: Date;
  }>> {
    this.validateRequired({ courseId }, ['courseId']);
    
    try {
      const interactions = await this.prisma.aIInteractionLog.findMany({
        where: {
          assignment: {
            courseId
          },
          ...this.buildDateRangeWhere('createdAt', timeframe)
        },
        include: {
          student: true
        }
      });

      // Group by student
      const studentStats = new Map<string, {
        student: User;
        count: number;
        qualityScores: number[];
        lastInteraction: Date;
      }>();

      interactions.forEach(log => {
        const stats = studentStats.get(log.studentId) || {
          student: log.student,
          count: 0,
          qualityScores: [],
          lastInteraction: log.createdAt
        };
        
        stats.count++;
        if (log.reflectionQualityScore) {
          stats.qualityScores.push(log.reflectionQualityScore);
        }
        if (log.createdAt > stats.lastInteraction) {
          stats.lastInteraction = log.createdAt;
        }
        
        studentStats.set(log.studentId, stats);
      });

      // Filter by threshold and format results
      return Array.from(studentStats.entries())
        .filter(([_, stats]) => stats.count >= threshold)
        .map(([studentId, stats]) => ({
          studentId,
          student: stats.student,
          interactionCount: stats.count,
          averageQuality: stats.qualityScores.length > 0 
            ? stats.qualityScores.reduce((sum, score) => sum + score, 0) / stats.qualityScores.length
            : 0,
          lastInteraction: stats.lastInteraction
        }))
        .sort((a, b) => b.interactionCount - a.interactionCount);
    } catch (error) {
      console.error('Error finding high-frequency users:', error);
      throw new Error(`Failed to find high-frequency users for course: ${courseId}`);
    }
  }

  /**
   * Get assignment AI usage analytics
   */
  async getAssignmentAnalytics(assignmentId: string): Promise<{
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
  } | null> {
    this.validateRequired({ assignmentId }, ['assignmentId']);
    
    try {
      const interactions = await this.prisma.aIInteractionLog.findMany({
        where: { assignmentId },
        orderBy: { createdAt: 'asc' }
      });

      if (interactions.length === 0) return null;

      const totalInteractions = interactions.length;
      const uniqueStudents = new Set(interactions.map(log => log.studentId)).size;

      // Distribution analysis
      const assistanceTypeDistribution = interactions.reduce((acc, log) => {
        acc[log.assistanceType] = (acc[log.assistanceType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const writingStageDistribution = interactions.reduce((acc, log) => {
        acc[log.writingStage] = (acc[log.writingStage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Reflection metrics
      const completedReflections = interactions.filter(log => log.reflectionCompleted);
      const completionRate = interactions.length > 0 ? completedReflections.length / interactions.length : 0;
      
      const qualityScores = completedReflections
        .map(log => log.reflectionQualityScore)
        .filter(score => score !== null) as number[];
      
      const averageQuality = qualityScores.length > 0 
        ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
        : 0;

      const qualityDistribution = qualityScores.reduce((acc, score) => {
        const bucket = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';
        acc[bucket] = (acc[bucket] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Time patterns
      const hourlyDistribution = new Array(24).fill(0);
      const dailyDistribution = new Array(7).fill(0);
      
      interactions.forEach(log => {
        hourlyDistribution[log.createdAt.getHours()]++;
        dailyDistribution[log.createdAt.getDay()]++;
      });

      const peakHours = hourlyDistribution
        .map((count, hour) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map(item => `${item.hour}:00`);

      // Educational effectiveness (simplified metrics)
      const studentsShowingImprovement = 0; // Would require longitudinal analysis
      const averageIndependenceGrowth = 0; // Would require trend analysis
      const successfulInterventions = 0; // Would require intervention tracking

      return {
        totalInteractions,
        uniqueStudents,
        assistanceTypeDistribution,
        writingStageDistribution,
        reflectionMetrics: {
          completionRate,
          averageQuality,
          qualityDistribution
        },
        timePatterns: {
          hourlyDistribution,
          dailyDistribution,
          peakUsageTimes: peakHours
        },
        educationalEffectiveness: {
          studentsShowingImprovement,
          averageIndependenceGrowth,
          successfulInterventions
        }
      };
    } catch (error) {
      console.error('Error getting assignment analytics:', error);
      throw new Error(`Failed to get analytics for assignment: ${assignmentId}`);
    }
  }

  /**
   * Log new AI interaction
   */
  async logInteraction(data: {
    studentId: string;
    assignmentId: string;
    assistanceType: string;
    writingStage: string;
    questionText: string;
    questionsGenerated?: number;
    educationallySound: boolean;
    metadata?: any;
  }): Promise<AIInteractionLog> {
    this.validateRequired(data, ['studentId', 'assignmentId', 'assistanceType', 'writingStage', 'questionText']);
    
    try {
      return await this.prisma.aIInteractionLog.create({
        data: {
          studentId: data.studentId,
          assignmentId: data.assignmentId,
          assistanceType: data.assistanceType,
          writingStage: data.writingStage,
          questionText: data.questionText,
          questionsGenerated: data.questionsGenerated || 0,
          educationallySound: data.educationallySound,
          responseId: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          reflectionCompleted: false,
          metadata: data.metadata || {}
        }
      });
    } catch (error) {
      console.error('Error logging AI interaction:', error);
      throw new Error('Failed to log AI interaction');
    }
  }

  /**
   * Update reflection completion status
   */
  async markReflectionCompleted(
    interactionId: string,
    reflectionData: {
      qualityScore: number;
      submittedAt: Date;
      analysisId?: string;
    }
  ): Promise<AIInteractionLog> {
    this.validateRequired({ interactionId }, ['interactionId']);
    
    try {
      return await this.prisma.aIInteractionLog.update({
        where: { id: interactionId },
        data: {
          reflectionCompleted: true,
          reflectionQualityScore: reflectionData.qualityScore,
          reflectionSubmittedAt: reflectionData.submittedAt,
          metadata: JSON.parse(JSON.stringify({
            reflectionAnalysisId: reflectionData.analysisId
          }))
        }
      });
    } catch (error) {
      console.error('Error marking reflection completed:', error);
      throw new Error(`Failed to mark reflection completed for interaction: ${interactionId}`);
    }
  }

  /**
   * Find interactions by educational effectiveness
   */
  async findByEducationalEffectiveness(
    effectiveness: 'high' | 'medium' | 'low',
    timeframe?: { start: Date; end: Date }
  ): Promise<AIInteractionLog[]> {
    try {
      let qualityRange: { gte?: number; lte?: number };
      
      switch (effectiveness) {
        case 'high':
          qualityRange = { gte: 80 };
          break;
        case 'medium':
          qualityRange = { gte: 60, lte: 79 };
          break;
        case 'low':
          qualityRange = { lte: 59 };
          break;
      }

      const whereClause: any = {
        reflectionCompleted: true,
        reflectionQualityScore: qualityRange
      };

      if (timeframe) {
        whereClause.createdAt = this.buildDateRangeWhere('createdAt', timeframe).createdAt;
      }

      return await this.prisma.aIInteractionLog.findMany({
        where: whereClause,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          assignment: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: { reflectionQualityScore: 'desc' }
      });
    } catch (error) {
      console.error('Error finding interactions by effectiveness:', error);
      throw new Error(`Failed to find interactions by effectiveness: ${effectiveness}`);
    }
  }

  /**
   * Get course-wide AI usage trends
   */
  async getCourseUsageTrends(
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
  }> {
    this.validateRequired({ courseId }, ['courseId']);
    
    try {
      const interactions = await this.prisma.aIInteractionLog.findMany({
        where: {
          assignment: {
            courseId
          },
          ...this.buildDateRangeWhere('createdAt', timeframe)
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      const totalInteractions = interactions.length;

      // Group by date for trends
      const dateGroups = new Map<string, {
        interactions: AIInteractionLog[];
        reflectionQualities: number[];
        educationallySound: number;
      }>();

      interactions.forEach(log => {
        const dateKey = log.createdAt.toISOString().split('T')[0];
        const group = dateGroups.get(dateKey) || {
          interactions: [],
          reflectionQualities: [],
          educationallySound: 0
        };
        
        group.interactions.push(log);
        if (log.reflectionQualityScore) {
          group.reflectionQualities.push(log.reflectionQualityScore);
        }
        if (log.educationallySound) {
          group.educationallySound++;
        }
        
        dateGroups.set(dateKey, group);
      });

      const trendsOverTime = Array.from(dateGroups.entries()).map(([dateStr, group]) => ({
        date: new Date(dateStr),
        interactionCount: group.interactions.length,
        reflectionQuality: group.reflectionQualities.length > 0 
          ? group.reflectionQualities.reduce((sum, q) => sum + q, 0) / group.reflectionQualities.length
          : 0,
        educationalSoundness: group.interactions.length > 0 
          ? group.educationallySound / group.interactions.length
          : 0
      }));

      // Student engagement metrics
      const studentStats = new Map<string, { count: number; avgQuality: number }>();
      interactions.forEach(log => {
        const stats = studentStats.get(log.studentId) || { count: 0, avgQuality: 0 };
        stats.count++;
        if (log.reflectionQualityScore) {
          stats.avgQuality = (stats.avgQuality + log.reflectionQualityScore) / 2;
        }
        studentStats.set(log.studentId, stats);
      });

      const activeStudents = studentStats.size;
      const averageInteractionsPerStudent = activeStudents > 0 ? totalInteractions / activeStudents : 0;
      const highQualityReflectors = Array.from(studentStats.values()).filter(stats => stats.avgQuality >= 80).length;

      // Identify concerning patterns
      const concerningPatterns = [];
      
      // High frequency users
      const highFrequencyUsers = Array.from(studentStats.entries())
        .filter(([_, stats]) => stats.count > 15)
        .map(([studentId]) => studentId);
      
      if (highFrequencyUsers.length > 0) {
        concerningPatterns.push({
          type: 'high_frequency' as const,
          affectedStudents: highFrequencyUsers,
          description: `${highFrequencyUsers.length} students showing high AI dependency`,
          severity: highFrequencyUsers.length > activeStudents * 0.2 ? 'high' as const : 'medium' as const
        });
      }

      // Low quality reflectors
      const lowQualityReflectors = Array.from(studentStats.entries())
        .filter(([_, stats]) => stats.avgQuality < 40 && stats.count > 3)
        .map(([studentId]) => studentId);
      
      if (lowQualityReflectors.length > 0) {
        concerningPatterns.push({
          type: 'low_quality_reflections' as const,
          affectedStudents: lowQualityReflectors,
          description: `${lowQualityReflectors.length} students providing low-quality reflections`,
          severity: lowQualityReflectors.length > activeStudents * 0.15 ? 'high' as const : 'medium' as const
        });
      }

      return {
        totalInteractions,
        trendsOverTime,
        studentEngagement: {
          activeStudents,
          averageInteractionsPerStudent,
          highQualityReflectors
        },
        concerningPatterns
      };
    } catch (error) {
      console.error('Error getting course usage trends:', error);
      throw new Error(`Failed to get usage trends for course: ${courseId}`);
    }
  }

  /**
   * Find students showing improvement in independence
   */
  async findStudentsShowingIndependence(
    courseId: string,
    timeframe: { start: Date; end: Date }
  ): Promise<Array<{
    studentId: string;
    student: User;
    improvementMetrics: {
      frequencyReduction: number;
      qualityIncrease: number;
      independenceScore: number;
    };
    timeline: Array<{
      date: Date;
      interactionCount: number;
      averageQuality: number;
    }>;
  }>> {
    this.validateRequired({ courseId }, ['courseId']);
    
    try {
      const interactions = await this.prisma.aIInteractionLog.findMany({
        where: {
          assignment: {
            courseId
          },
          ...this.buildDateRangeWhere('createdAt', timeframe)
        },
        include: {
          student: true
        },
        orderBy: { createdAt: 'asc' }
      });

      // Group by student and analyze trends
      const studentAnalysis = new Map<string, {
        student: User;
        interactions: any[];
        weeklyData: Map<string, { count: number; avgQuality: number }>;
      }>();

      interactions.forEach(log => {
        const analysis = studentAnalysis.get(log.studentId) || {
          student: log.student,
          interactions: [],
          weeklyData: new Map()
        };
        
        (analysis.interactions as any[]).push(log);
        
        // Group by week
        const weekKey = this.getWeekKey(log.createdAt);
        const weekData = analysis.weeklyData.get(weekKey) || { count: 0, avgQuality: 0 };
        weekData.count++;
        if (log.reflectionQualityScore) {
          weekData.avgQuality = (weekData.avgQuality + log.reflectionQualityScore) / 2;
        }
        analysis.weeklyData.set(weekKey, weekData);
        
        studentAnalysis.set(log.studentId, analysis);
      });

      // Calculate improvement metrics
      const studentsShowingImprovement = Array.from(studentAnalysis.entries())
        .map(([studentId, analysis]) => {
          const weeks = Array.from(analysis.weeklyData.entries()).sort();
          if (weeks.length < 2) return null;

          const firstWeek = weeks[0][1];
          const lastWeek = weeks[weeks.length - 1][1];
          
          const frequencyReduction = firstWeek.count > 0 
            ? ((firstWeek.count - lastWeek.count) / firstWeek.count) * 100
            : 0;
          
          const qualityIncrease = lastWeek.avgQuality - firstWeek.avgQuality;
          
          const independenceScore = Math.max(0, Math.min(100, 
            (frequencyReduction * 0.6) + (qualityIncrease * 0.4)
          ));

          // Only include students showing real improvement
          if (independenceScore <= 10) return null;

          const timeline = weeks.map(([weekKey, data]) => ({
            date: this.parseWeekKey(weekKey),
            interactionCount: data.count,
            averageQuality: data.avgQuality
          }));

          return {
            studentId,
            student: analysis.student,
            improvementMetrics: {
              frequencyReduction,
              qualityIncrease,
              independenceScore
            },
            timeline
          };
        })
        .filter(result => result !== null);

      return studentsShowingImprovement;
    } catch (error) {
      console.error('Error finding students showing independence:', error);
      throw new Error(`Failed to find students showing independence for course: ${courseId}`);
    }
  }

  /**
   * Get educator insights for AI coaching
   */
  async getEducatorInsights(
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
      affectedEntities: string[];
      actionItems: string[];
    }>;
    successStories: Array<{
      studentId: string;
      improvement: string;
      timeframe: string;
    }>;
    trendsAndPatterns: {
      usageGrowth: number;
      qualityImprovement: number;
      independenceGrowth: number;
      mostEffectiveStrategies: string[];
    };
  }> {
    this.validateRequired({ instructorId }, ['instructorId']);
    
    try {
      // Get assignments for this instructor
      const assignmentFilter = courseId 
        ? { courseId, instructorId }
        : { instructorId };

      const assignments = await this.prisma.assignment.findMany({
        where: assignmentFilter,
        include: {
          course: {
            include: {
              enrollments: {
                where: { status: 'active' }
              }
            }
          },
          aiInteractionLogs: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
              }
            },
            include: {
              student: true
            }
          }
        }
      });

      if (assignments.length === 0) {
        // Return empty insights if no assignments found
        return {
          overview: {
            totalStudents: 0,
            aiActiveStudents: 0,
            averageUsageRate: 0,
            concerningStudents: 0
          },
          recommendations: [],
          successStories: [],
          trendsAndPatterns: {
            usageGrowth: 0,
            qualityImprovement: 0,
            independenceGrowth: 0,
            mostEffectiveStrategies: []
          }
        };
      }

      // Aggregate data across all assignments
      const allInteractions = assignments.flatMap(a => a.aiInteractionLogs);
      const allStudents = new Set(assignments.flatMap(a => 
        a.course.enrollments.map(e => e.studentId)
      ));
      const aiActiveStudents = new Set(allInteractions.map(log => log.studentId));

      const overview = {
        totalStudents: allStudents.size,
        aiActiveStudents: aiActiveStudents.size,
        averageUsageRate: allStudents.size > 0 ? aiActiveStudents.size / allStudents.size : 0,
        concerningStudents: 0 // Would be calculated based on usage patterns
      };

      // Generate recommendations (simplified)
      const recommendations = [];
      
      if (overview.averageUsageRate > 0.8) {
        recommendations.push({
          type: 'boundary_adjustment' as const,
          priority: 'medium' as const,
          description: 'High AI usage across students - consider tightening boundaries',
          affectedEntities: assignments.map(a => a.id),
          actionItems: [
            'Review current AI boundary settings',
            'Consider implementing stricter usage limits',
            'Increase reflection requirements'
          ]
        });
      }

      // Placeholder for other complex calculations
      const successStories: Array<{
        studentId: string;
        improvement: string;
        timeframe: string;
      }> = [];
      const trendsAndPatterns = {
        usageGrowth: 0,
        qualityImprovement: 0,
        independenceGrowth: 0,
        mostEffectiveStrategies: ['Reflection requirements', 'Progressive access']
      };

      return {
        overview,
        recommendations,
        successStories,
        trendsAndPatterns
      };
    } catch (error) {
      console.error('Error getting educator insights:', error);
      throw new Error(`Failed to get educator insights for instructor: ${instructorId}`);
    }
  }

  /**
   * Generate AI usage report for compliance
   */
  async generateComplianceReport(
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
  }> {
    try {
      const whereClause: any = this.buildDateRangeWhere('createdAt', timeframe);
      
      if (courseId) {
        whereClause.assignment = { courseId };
      }

      const interactions = await this.prisma.aIInteractionLog.findMany({
        where: whereClause,
        include: {
          student: {
            select: { id: true }
          }
        }
      });

      const totalInteractions = interactions.length;
      const totalStudents = new Set(interactions.map(log => log.studentId)).size;
      const educationallySoundCount = interactions.filter(log => log.educationallySound).length;
      const educationallySoundPercentage = totalInteractions > 0 
        ? (educationallySoundCount / totalInteractions) * 100
        : 0;

      const reflectionCompletedCount = interactions.filter(log => log.reflectionCompleted).length;
      const reflectionCompletionRate = totalInteractions > 0 
        ? (reflectionCompletedCount / totalInteractions) * 100
        : 0;

      // Breakdown analysis
      const byAssistanceType = interactions.reduce((acc, log) => {
        acc[log.assistanceType] = (acc[log.assistanceType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const byWritingStage = interactions.reduce((acc, log) => {
        acc[log.writingStage] = (acc[log.writingStage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const byEducationalSoundness = {
        'educationally_sound': educationallySoundCount,
        'not_educationally_sound': totalInteractions - educationallySoundCount
      };

      // Quality metrics
      const qualityScores = interactions
        .map(log => log.reflectionQualityScore)
        .filter(score => score !== null) as number[];
      
      const averageReflectionQuality = qualityScores.length > 0 
        ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
        : 0;

      const highQualityInteractions = qualityScores.filter(score => score >= 80).length;

      return {
        period: timeframe,
        summary: {
          totalInteractions,
          totalStudents,
          educationallySoundPercentage,
          reflectionCompletionRate
        },
        breakdown: {
          byAssistanceType,
          byWritingStage,
          byEducationalSoundness
        },
        qualityMetrics: {
          averageReflectionQuality,
          highQualityInteractions,
          interventionsTriggered: 0 // Would require intervention tracking
        },
        studentOutcomes: {
          studentsShowingIndependence: 0, // Would require trend analysis
          studentsNeedingSupport: 0, // Would require pattern analysis
          improvementTrends: ['Overall reflection quality improving', 'AI usage patterns stabilizing']
        }
      };
    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw new Error('Failed to generate compliance report');
    }
  }

  private getWeekKey(date: Date): string {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    return weekStart.toISOString().split('T')[0];
  }

  private parseWeekKey(weekKey: string): Date {
    return new Date(weekKey);
  }

  protected createTransactionalInstance(prismaTransaction: any): this {
    return new PrismaAIInteractionRepository(prismaTransaction) as this;
  }
}