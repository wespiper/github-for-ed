import { PrismaClient, Assignment, AssignmentSubmission, Course, User, AIInteractionLog } from '@prisma/client';
import { BasePrismaRepository } from './BasePrismaRepository';
import { AssignmentRepository, AssignmentWithRelations } from '../interfaces/AssignmentRepository';

/**
 * Prisma implementation of AssignmentRepository
 * Handles assignment-specific database operations
 */
export class PrismaAssignmentRepository extends BasePrismaRepository<Assignment> implements AssignmentRepository {
  protected modelName = 'assignment';

  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * Find assignments by course
   */
  async findByCourseId(courseId: string): Promise<Assignment[]> {
    this.validateRequired({ courseId }, ['courseId']);
    
    try {
      return await this.prisma.assignment.findMany({
        where: { courseId },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Error finding assignments by course:', error);
      throw new Error(`Failed to find assignments for course: ${courseId}`);
    }
  }

  /**
   * Find assignments by instructor
   */
  async findByInstructorId(instructorId: string): Promise<Assignment[]> {
    this.validateRequired({ instructorId }, ['instructorId']);
    
    try {
      return await this.prisma.assignment.findMany({
        where: { instructorId },
        include: {
          course: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Error finding assignments by instructor:', error);
      throw new Error(`Failed to find assignments for instructor: ${instructorId}`);
    }
  }

  /**
   * Find assignment with all submissions
   */
  async findByIdWithSubmissions(assignmentId: string): Promise<(Assignment & {
    submissions: AssignmentSubmission[];
    course: Course;
  }) | null> {
    this.validateRequired({ assignmentId }, ['assignmentId']);
    
    try {
      return await this.prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: {
          submissions: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          course: true
        }
      });
    } catch (error) {
      console.error('Error finding assignment with submissions:', error);
      throw new Error(`Failed to find assignment with submissions: ${assignmentId}`);
    }
  }

  /**
   * Find assignments with AI interaction data
   */
  async findWithAIAnalytics(courseId?: string): Promise<(Assignment & {
    aiInteractionLogs: AIInteractionLog[];
    submissions: AssignmentSubmission[];
  })[]> {
    try {
      const whereClause = courseId ? { courseId } : {};
      
      return await this.prisma.assignment.findMany({
        where: whereClause,
        include: {
          aiInteractionLogs: {
            orderBy: { createdAt: 'desc' }
          },
          submissions: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Error finding assignments with AI analytics:', error);
      throw new Error('Failed to find assignments with AI analytics');
    }
  }

  /**
   * Find assignments by due date range
   */
  async findByDueDateRange(
    start: Date,
    end: Date,
    courseId?: string
  ): Promise<Assignment[]> {
    try {
      const whereClause: any = {
        dueDate: {
          gte: start,
          lte: end
        }
      };

      if (courseId) {
        whereClause.courseId = courseId;
      }

      return await this.prisma.assignment.findMany({
        where: whereClause,
        orderBy: { dueDate: 'asc' }
      });
    } catch (error) {
      console.error('Error finding assignments by due date range:', error);
      throw new Error('Failed to find assignments by due date range');
    }
  }

  /**
   * Find assignments with specific AI settings
   */
  async findByAISettings(
    settingsCriteria: {
      aiEnabled?: boolean;
      boundaryLevel?: string;
      assistanceTypes?: string[];
    },
    courseId?: string
  ): Promise<Assignment[]> {
    try {
      const whereClause: any = {};

      if (courseId) {
        whereClause.courseId = courseId;
      }

      // Build AI settings filter
      if (settingsCriteria.aiEnabled !== undefined) {
        whereClause.aiSettings = {
          path: ['enabled'],
          equals: settingsCriteria.aiEnabled
        };
      }

      return await this.prisma.assignment.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Error finding assignments by AI settings:', error);
      throw new Error('Failed to find assignments by AI settings');
    }
  }

  /**
   * Get assignment completion statistics
   */
  async getCompletionStats(assignmentId: string): Promise<{
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
  } | null> {
    this.validateRequired({ assignmentId }, ['assignmentId']);
    
    try {
      const assignment = await this.prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: {
          course: {
            include: {
              enrollments: {
                where: { status: 'active' }
              }
            }
          },
          submissions: true,
          aiInteractionLogs: true
        }
      });

      if (!assignment) return null;

      const totalStudents = assignment.course.enrollments.length;
      const submissions = assignment.submissions;
      
      const submittedCount = submissions.filter(s => s.status === 'submitted').length;
      const draftCount = submissions.filter(s => s.status === 'draft' || s.status === 'in_progress').length;
      const notStartedCount = totalStudents - submissions.length;
      
      const averageWordCount = submissions.length > 0
        ? submissions.reduce((sum, s) => sum + (s.wordCount || 0), 0) / submissions.length
        : 0;

      // Calculate AI usage statistics
      const studentsWithAI = new Set(assignment.aiInteractionLogs.map(log => log.studentId));
      const studentsUsingAI = studentsWithAI.size;
      const totalAIInteractions = assignment.aiInteractionLogs.length;
      const averageInteractionsPerStudent = studentsUsingAI > 0 
        ? totalAIInteractions / studentsUsingAI 
        : 0;

      // Note: Average time spent would require writing session data
      const averageTimeSpent = 0; // Placeholder

      return {
        assignment,
        totalStudents,
        submittedCount,
        draftCount,
        notStartedCount,
        averageWordCount,
        averageTimeSpent,
        aiUsageStats: {
          studentsUsingAI,
          totalAIInteractions,
          averageInteractionsPerStudent
        }
      };
    } catch (error) {
      console.error('Error getting completion stats:', error);
      throw new Error(`Failed to get completion stats for assignment: ${assignmentId}`);
    }
  }

  /**
   * Find assignments requiring educator attention
   */
  async findRequiringAttention(instructorId: string): Promise<(Assignment & {
    submissions: Array<AssignmentSubmission & {
      aiInteractionLogs: AIInteractionLog[];
    }>;
  })[]> {
    this.validateRequired({ instructorId }, ['instructorId']);
    
    try {
      return await this.prisma.assignment.findMany({
        where: {
          instructorId,
          OR: [
            // Assignments with high AI usage
            {
              aiInteractionLogs: {
                some: {
                  createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  }
                }
              }
            },
            // Assignments with low reflection quality
            {
              aiInteractionLogs: {
                some: {
                  reflectionCompleted: true,
                  reflectionQualityScore: {
                    lt: 30
                  }
                }
              }
            }
          ]
        },
        include: {
          submissions: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              },
              // Note: aiInteractionLogs would need to be added to submission model
              // For now, we'll use assignment-level AI logs
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      }) as any;
    } catch (error) {
      console.error('Error finding assignments requiring attention:', error);
      throw new Error(`Failed to find assignments requiring attention for instructor: ${instructorId}`);
    }
  }

  /**
   * Get assignment AI boundary analysis
   */
  async getAIBoundaryAnalysis(assignmentId: string): Promise<{
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
  } | null> {
    this.validateRequired({ assignmentId }, ['assignmentId']);
    
    try {
      const assignment = await this.prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: {
          aiInteractionLogs: {
            include: {
              student: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      if (!assignment) return null;

      // Analyze student usage patterns
      const studentStats = new Map<string, { count: number; reflections: number; totalQuality: number }>();
      
      assignment.aiInteractionLogs.forEach(log => {
        const stats = studentStats.get(log.studentId) || { count: 0, reflections: 0, totalQuality: 0 };
        stats.count++;
        
        if (log.reflectionCompleted && log.reflectionQualityScore) {
          stats.reflections++;
          stats.totalQuality += log.reflectionQualityScore;
        }
        
        studentStats.set(log.studentId, stats);
      });

      const studentUsagePatterns = Array.from(studentStats.entries()).map(([studentId, stats]) => ({
        studentId,
        aiUsageCount: stats.count,
        reflectionQuality: stats.reflections > 0 ? stats.totalQuality / stats.reflections : 0,
        independenceLevel: stats.count > 10 ? 'low' : stats.count > 5 ? 'medium' : 'high'
      }));

      // Generate recommendations based on patterns
      const recommendations = [];
      const highUsageStudents = studentUsagePatterns.filter(p => p.aiUsageCount > 10);
      const lowQualityStudents = studentUsagePatterns.filter(p => p.reflectionQuality < 30);

      if (highUsageStudents.length > studentUsagePatterns.length * 0.3) {
        recommendations.push({
          type: 'increase_restrictions' as const,
          reason: 'High percentage of students showing over-reliance on AI assistance',
          affectedStudents: highUsageStudents.map(s => s.studentId),
          impact: 'May improve student independence and critical thinking'
        });
      }

      if (lowQualityStudents.length > 3) {
        recommendations.push({
          type: 'modify_requirements' as const,
          reason: 'Multiple students providing low-quality reflections',
          affectedStudents: lowQualityStudents.map(s => s.studentId),
          impact: 'Could improve reflection quality and learning outcomes'
        });
      }

      return {
        assignment,
        currentSettings: assignment.aiSettings,
        studentUsagePatterns,
        recommendations
      };
    } catch (error) {
      console.error('Error getting AI boundary analysis:', error);
      throw new Error(`Failed to get AI boundary analysis for assignment: ${assignmentId}`);
    }
  }

  /**
   * Find assignments by learning objectives
   */
  async findByLearningObjectives(
    objectives: string[],
    courseId?: string
  ): Promise<Assignment[]> {
    if (!objectives || objectives.length === 0) {
      return [];
    }

    try {
      const whereClause: any = {};

      if (courseId) {
        whereClause.courseId = courseId;
      }

      // Search in learning objectives JSON field
      return await this.prisma.assignment.findMany({
        where: {
          ...whereClause,
          learningObjectives: {
            array_contains: objectives
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Error finding assignments by learning objectives:', error);
      throw new Error('Failed to find assignments by learning objectives');
    }
  }

  /**
   * Get assignment performance analytics
   */
  async getPerformanceAnalytics(
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
  } | null> {
    this.validateRequired({ assignmentId }, ['assignmentId']);
    
    try {
      const assignment = await this.prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: {
          submissions: true,
          aiInteractionLogs: timeframe 
            ? {
                where: this.buildDateRangeWhere('createdAt', timeframe)
              }
            : true
        }
      });

      if (!assignment) return null;

      // Calculate submission metrics
      const submissions = assignment.submissions;
      const onTimeSubmissions = submissions.filter(s => 
        s.submittedAt && assignment.dueDate && s.submittedAt <= assignment.dueDate
      ).length;
      const lateSubmissions = submissions.filter(s => 
        s.submittedAt && assignment.dueDate && s.submittedAt > assignment.dueDate
      ).length;
      const averageWordsPerSubmission = submissions.length > 0
        ? submissions.reduce((sum, s) => sum + (s.wordCount || 0), 0) / submissions.length
        : 0;

      // Calculate AI usage metrics
      const aiLogs = assignment.aiInteractionLogs;
      const uniqueStudentsUsingAI = new Set(aiLogs.map(log => log.studentId)).size;
      const averageInteractionsPerStudent = uniqueStudentsUsingAI > 0 
        ? aiLogs.length / uniqueStudentsUsingAI 
        : 0;

      // Get most common assistance types
      const assistanceTypeCounts = aiLogs.reduce((acc, log) => {
        acc[log.assistanceType] = (acc[log.assistanceType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const mostCommonAssistanceTypes = Object.entries(assistanceTypeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate learning outcomes
      const reflectionsWithQuality = aiLogs.filter(log => 
        log.reflectionCompleted && log.reflectionQualityScore
      );
      const reflectionQualityScore = reflectionsWithQuality.length > 0
        ? reflectionsWithQuality.reduce((sum, log) => sum + (log.reflectionQualityScore || 0), 0) / reflectionsWithQuality.length
        : 0;

      // Analyze independence trend (simplified)
      const independenceTrend = 'stable' as const; // Would require time-series analysis

      const skillDevelopmentIndicators = [
        reflectionQualityScore > 70 ? 'High-quality reflections' : 'Developing reflection skills',
        averageInteractionsPerStudent < 5 ? 'Good independence' : 'High AI reliance'
      ];

      return {
        assignment,
        submissionMetrics: {
          onTimeSubmissions,
          lateSubmissions,
          averageWordsPerSubmission,
          qualityDistribution: {} // Placeholder
        },
        aiUsageMetrics: {
          totalInteractions: aiLogs.length,
          uniqueStudentsUsingAI,
          averageInteractionsPerStudent,
          mostCommonAssistanceTypes
        },
        learningOutcomes: {
          reflectionQualityScore,
          independenceTrend,
          skillDevelopmentIndicators
        }
      };
    } catch (error) {
      console.error('Error getting performance analytics:', error);
      throw new Error(`Failed to get performance analytics for assignment: ${assignmentId}`);
    }
  }

  /**
   * Find assignments similar to a given assignment
   */
  async findSimilarAssignments(
    assignmentId: string,
    similarity: 'learning_objectives' | 'ai_settings' | 'structure'
  ): Promise<Assignment[]> {
    this.validateRequired({ assignmentId }, ['assignmentId']);
    
    try {
      const sourceAssignment = await this.prisma.assignment.findUnique({
        where: { id: assignmentId }
      });

      if (!sourceAssignment) {
        return [];
      }

      let whereClause: any = {
        id: { not: assignmentId }
      };

      // For now, return assignments from the same course as a simple similarity
      whereClause.courseId = sourceAssignment.courseId;

      return await this.prisma.assignment.findMany({
        where: whereClause,
        take: 10
      });
    } catch (error) {
      console.error('Error finding similar assignments:', error);
      throw new Error(`Failed to find similar assignments for: ${assignmentId}`);
    }
  }

  /**
   * Update assignment AI boundaries
   */
  async updateAIBoundaries(
    assignmentId: string,
    boundaries: {
      enabled: boolean;
      globalBoundary: string;
      allowedAssistanceTypes: string[];
      stageSpecificSettings: any[];
      requireReflection: boolean;
      reflectionPrompts: string[];
    }
  ): Promise<Assignment> {
    this.validateRequired({ assignmentId }, ['assignmentId']);
    
    try {
      return await this.prisma.assignment.update({
        where: { id: assignmentId },
        data: {
          aiSettings: boundaries
        }
      });
    } catch (error) {
      console.error('Error updating AI boundaries:', error);
      throw new Error(`Failed to update AI boundaries for assignment: ${assignmentId}`);
    }
  }

  /**
   * Clone assignment with modifications
   */
  async cloneAssignment(
    sourceAssignmentId: string,
    targetCourseId: string,
    modifications: Partial<Assignment>
  ): Promise<Assignment> {
    this.validateRequired({ sourceAssignmentId, targetCourseId }, ['sourceAssignmentId', 'targetCourseId']);
    
    try {
      const sourceAssignment = await this.prisma.assignment.findUnique({
        where: { id: sourceAssignmentId }
      });

      if (!sourceAssignment) {
        throw new Error(`Source assignment not found: ${sourceAssignmentId}`);
      }

      const { id, createdAt, updatedAt, ...assignmentData } = sourceAssignment;
      
      return await this.prisma.assignment.create({
        data: {
          title: modifications.title || `${sourceAssignment.title} (Copy)`,
          courseId: targetCourseId,
          instructorId: assignmentData.instructorId,
          status: assignmentData.status,
          instructions: assignmentData.instructions,
          requirements: assignmentData.requirements as any,
          writingStages: assignmentData.writingStages as any,
          learningObjectives: assignmentData.learningObjectives as any,
          aiSettings: assignmentData.aiSettings as any,
          aiBoundarySettings: assignmentData.aiBoundarySettings as any,
          gradingCriteria: assignmentData.gradingCriteria as any,
          dueDate: assignmentData.dueDate,
          stageDueDates: assignmentData.stageDueDates as any,
          type: assignmentData.type,
          collaborationSettings: assignmentData.collaborationSettings as any,
          versionControlSettings: assignmentData.versionControlSettings as any,
          templateId: assignmentData.templateId,
          ...modifications
        }
      });
    } catch (error) {
      console.error('Error cloning assignment:', error);
      throw new Error(`Failed to clone assignment: ${sourceAssignmentId}`);
    }
  }

  /**
   * Get assignment timeline and milestones
   */
  async getTimeline(assignmentId: string): Promise<{
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
  } | null> {
    this.validateRequired({ assignmentId }, ['assignmentId']);
    
    try {
      const assignment = await this.prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: {
          submissions: {
            select: {
              authorId: true,
              submittedAt: true,
              status: true,
              wordCount: true
            }
          },
          aiInteractionLogs: {
            select: {
              studentId: true,
              assistanceType: true,
              createdAt: true
            },
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (!assignment) return null;

      // Build timeline
      const timeline: Array<{
        date: Date;
        event: 'created' | 'published' | 'due' | 'closed';
        description: string;
      }> = [
        {
          date: assignment.createdAt,
          event: 'created',
          description: 'Assignment created'
        }
      ];

      if (assignment.dueDate) {
        timeline.push({
          date: assignment.dueDate,
          event: 'due',
          description: 'Assignment due'
        });
      }

      // Group AI activity by date and student
      const aiActivityMap = new Map<string, Map<string, { count: number; types: Set<string> }>>();
      
      assignment.aiInteractionLogs.forEach(log => {
        const dateKey = log.createdAt.toISOString().split('T')[0];
        const studentMap = aiActivityMap.get(dateKey) || new Map();
        const studentData = studentMap.get(log.studentId) || { count: 0, types: new Set() };
        
        studentData.count++;
        studentData.types.add(log.assistanceType);
        
        studentMap.set(log.studentId, studentData);
        aiActivityMap.set(dateKey, studentMap);
      });

      const aiActivity = Array.from(aiActivityMap.entries()).flatMap(([dateStr, studentMap]) => 
        Array.from(studentMap.entries()).map(([studentId, data]) => ({
          date: new Date(dateStr),
          studentId,
          interactionCount: data.count,
          assistanceType: Array.from(data.types).join(', ')
        }))
      );

      return {
        assignment,
        timeline: timeline.sort((a, b) => a.date.getTime() - b.date.getTime()),
        submissions: assignment.submissions.map(sub => ({
          studentId: sub.authorId,
          submittedAt: sub.submittedAt,
          status: sub.status,
          wordCount: sub.wordCount || 0
        })),
        aiActivity
      };
    } catch (error) {
      console.error('Error getting assignment timeline:', error);
      throw new Error(`Failed to get timeline for assignment: ${assignmentId}`);
    }
  }

  protected createTransactionalInstance(prismaTransaction: any): this {
    return new PrismaAssignmentRepository(prismaTransaction) as this;
  }
}