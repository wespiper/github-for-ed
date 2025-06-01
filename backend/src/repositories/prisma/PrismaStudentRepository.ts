import { PrismaClient, User, StudentProfile, CourseEnrollment, AssignmentSubmission, AIInteractionLog } from '@prisma/client';
import { BasePrismaRepository } from './BasePrismaRepository';
import { StudentRepository, Student } from '../interfaces/StudentRepository';

/**
 * Prisma implementation of StudentRepository
 * Handles student-specific database operations
 */
export class PrismaStudentRepository extends BasePrismaRepository<Student> implements StudentRepository {
  protected modelName = 'user';

  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * Find students by course enrollment
   */
  async findByCourseId(courseId: string): Promise<Student[]> {
    this.validateRequired({ courseId }, ['courseId']);
    
    try {
      const students = await this.prisma.user.findMany({
        where: {
          role: 'student',
          enrollments: {
            some: {
              courseId,
              status: 'active'
            }
          }
        },
        include: {
          enrollments: {
            where: { courseId }
          }
        }
      });

      return students as Student[];
    } catch (error) {
      console.error('Error finding students by course:', error);
      throw new Error(`Failed to find students for course: ${courseId}`);
    }
  }

  /**
   * Find students enrolled in multiple courses
   */
  async findByMultipleCourses(courseIds: string[]): Promise<Student[]> {
    if (!courseIds || courseIds.length === 0) {
      return [];
    }

    try {
      const students = await this.prisma.user.findMany({
        where: {
          role: 'student',
          enrollments: {
            some: {
              courseId: { in: courseIds },
              status: 'active'
            }
          }
        },
        include: {
          enrollments: {
            where: {
              courseId: { in: courseIds }
            }
          }
        }
      });

      return students as Student[];
    } catch (error) {
      console.error('Error finding students by multiple courses:', error);
      throw new Error('Failed to find students for multiple courses');
    }
  }

  /**
   * Find student with their complete profile data
   */
  async findByIdWithProfile(studentId: string): Promise<(Student & { 
    studentProfile: StudentProfile | null;
    enrollments: CourseEnrollment[];
  }) | null> {
    this.validateRequired({ studentId }, ['studentId']);
    
    try {
      const student = await this.prisma.user.findUnique({
        where: { 
          id: studentId,
          role: 'student'
        },
        include: {
          studentProfile: true,
          enrollments: {
            where: { status: 'active' },
            include: {
              course: true
            }
          }
        }
      });

      return student as (Student & { 
        studentProfile: StudentProfile | null;
        enrollments: CourseEnrollment[];
      }) | null;
    } catch (error) {
      console.error('Error finding student with profile:', error);
      throw new Error(`Failed to find student with profile: ${studentId}`);
    }
  }

  /**
   * Find students with recent AI interactions
   */
  async findWithRecentAIActivity(
    timeframe: { start: Date; end: Date },
    courseId?: string
  ): Promise<(Student & { aiInteractionLogs: AIInteractionLog[] })[]> {
    try {
      const whereClause: any = {
        role: 'student',
        aiInteractionLogs: {
          some: this.buildDateRangeWhere('createdAt', timeframe)
        }
      };

      if (courseId) {
        whereClause.enrollments = {
          some: {
            courseId,
            status: 'active'
          }
        };
      }

      const students = await this.prisma.user.findMany({
        where: whereClause,
        include: {
          aiInteractionLogs: {
            where: this.buildDateRangeWhere('createdAt', timeframe),
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      return students as (Student & { aiInteractionLogs: AIInteractionLog[] })[];
    } catch (error) {
      console.error('Error finding students with recent AI activity:', error);
      throw new Error('Failed to find students with recent AI activity');
    }
  }

  /**
   * Find students by assignment with their submissions
   */
  async findByAssignmentWithSubmissions(assignmentId: string): Promise<(Student & {
    submissions: AssignmentSubmission[];
  })[]> {
    this.validateRequired({ assignmentId }, ['assignmentId']);
    
    try {
      const students = await this.prisma.user.findMany({
        where: {
          role: 'student',
          submissions: {
            some: { assignmentId }
          }
        },
        include: {
          submissions: {
            where: { assignmentId }
          }
        }
      });

      return students as (Student & { submissions: AssignmentSubmission[] })[];
    } catch (error) {
      console.error('Error finding students by assignment:', error);
      throw new Error(`Failed to find students for assignment: ${assignmentId}`);
    }
  }

  /**
   * Search students by name or email
   */
  async searchByNameOrEmail(query: string, courseId?: string): Promise<Student[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    try {
      const whereClause: any = {
        role: 'student',
        ...this.buildTextSearchWhere(['firstName', 'lastName', 'email'], query)
      };

      if (courseId) {
        whereClause.enrollments = {
          some: {
            courseId,
            status: 'active'
          }
        };
      }

      const students = await this.prisma.user.findMany({
        where: whereClause,
        orderBy: [
          { firstName: 'asc' },
          { lastName: 'asc' }
        ]
      });

      return students as Student[];
    } catch (error) {
      console.error('Error searching students:', error);
      throw new Error('Failed to search students');
    }
  }

  /**
   * Get student learning analytics data
   */
  async findLearningAnalytics(
    studentId: string,
    timeframe: { start: Date; end: Date }
  ): Promise<{
    student: Student;
    totalSubmissions: number;
    averageWordCount: number;
    aiInteractionCount: number;
    reflectionQuality: number;
    courseProgress: Array<{
      courseId: string;
      completedAssignments: number;
      totalAssignments: number;
    }>;
  } | null> {
    this.validateRequired({ studentId }, ['studentId']);
    
    try {
      const student = await this.prisma.user.findUnique({
        where: { 
          id: studentId,
          role: 'student'
        },
        include: {
          submissions: {
            where: this.buildDateRangeWhere('createdAt', timeframe)
          },
          aiInteractionLogs: {
            where: this.buildDateRangeWhere('createdAt', timeframe)
          },
          enrollments: {
            include: {
              course: {
                include: {
                  assignments: true
                }
              }
            }
          }
        }
      });

      if (!student) return null;

      // Calculate analytics
      const totalSubmissions = student.submissions.length;
      const averageWordCount = totalSubmissions > 0 
        ? student.submissions.reduce((sum, sub) => sum + (sub.wordCount || 0), 0) / totalSubmissions
        : 0;
      const aiInteractionCount = student.aiInteractionLogs.length;
      
      // Calculate reflection quality (from AI interaction logs)
      const reflectionsWithQuality = student.aiInteractionLogs.filter(log => 
        log.reflectionCompleted && log.reflectionQualityScore
      );
      const reflectionQuality = reflectionsWithQuality.length > 0
        ? reflectionsWithQuality.reduce((sum, log) => sum + (log.reflectionQualityScore || 0), 0) / reflectionsWithQuality.length
        : 0;

      // Calculate course progress
      const courseProgress = student.enrollments.map(enrollment => {
        const totalAssignments = enrollment.course.assignments.length;
        const completedAssignments = student.submissions.filter(sub => 
          sub.assignmentId && 
          enrollment.course.assignments.some(assignment => assignment.id === sub.assignmentId) &&
          sub.status === 'submitted'
        ).length;

        return {
          courseId: enrollment.courseId,
          completedAssignments,
          totalAssignments
        };
      });

      return {
        student: student as Student,
        totalSubmissions,
        averageWordCount,
        aiInteractionCount,
        reflectionQuality,
        courseProgress
      };
    } catch (error) {
      console.error('Error getting student learning analytics:', error);
      throw new Error(`Failed to get learning analytics for student: ${studentId}`);
    }
  }

  /**
   * Find students who may need intervention based on AI usage patterns
   */
  async findStudentsNeedingIntervention(courseId: string): Promise<(Student & {
    aiInteractionLogs: AIInteractionLog[];
    submissions: AssignmentSubmission[];
  })[]> {
    this.validateRequired({ courseId }, ['courseId']);
    
    try {
      // Find students with concerning AI usage patterns
      const students = await this.prisma.user.findMany({
        where: {
          role: 'student',
          enrollments: {
            some: {
              courseId,
              status: 'active'
            }
          },
          OR: [
            // High frequency users (more than 10 interactions in last week)
            {
              aiInteractionLogs: {
                some: {
                  createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  }
                }
              }
            },
            // Low reflection quality
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
          aiInteractionLogs: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
              }
            },
            orderBy: { createdAt: 'desc' }
          },
          submissions: {
            where: {
              assignment: {
                courseId
              }
            }
          }
        }
      });

      // Filter students who actually need intervention
      const studentsNeedingIntervention = students.filter(student => {
        const recentInteractions = student.aiInteractionLogs.filter(log => 
          log.createdAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );
        
        const lowQualityReflections = student.aiInteractionLogs.filter(log => 
          log.reflectionCompleted && (log.reflectionQualityScore || 0) < 30
        );

        return recentInteractions.length > 10 || 
               (lowQualityReflections.length > 3 && student.aiInteractionLogs.length > 5);
      });

      return studentsNeedingIntervention as (Student & {
        aiInteractionLogs: AIInteractionLog[];
        submissions: AssignmentSubmission[];
      })[];
    } catch (error) {
      console.error('Error finding students needing intervention:', error);
      throw new Error(`Failed to find students needing intervention for course: ${courseId}`);
    }
  }

  /**
   * Get student performance metrics for an assignment
   */
  async getAssignmentPerformance(
    studentId: string,
    assignmentId: string
  ): Promise<{
    student: Student;
    submission: AssignmentSubmission | null;
    aiInteractions: AIInteractionLog[];
    reflectionQuality: number;
    timeSpent: number;
    wordCount: number;
  } | null> {
    this.validateRequired({ studentId, assignmentId }, ['studentId', 'assignmentId']);
    
    try {
      const student = await this.prisma.user.findUnique({
        where: { 
          id: studentId,
          role: 'student'
        },
        include: {
          submissions: {
            where: { assignmentId }
          },
          aiInteractionLogs: {
            where: { assignmentId }
          },
          writingSessions: {
            where: {
              document: {
                assignmentId
              }
            }
          }
        }
      });

      if (!student) return null;

      const submission = student.submissions[0] || null;
      const aiInteractions = student.aiInteractionLogs;
      
      // Calculate reflection quality
      const reflectionsWithQuality = aiInteractions.filter(log => 
        log.reflectionCompleted && log.reflectionQualityScore
      );
      const reflectionQuality = reflectionsWithQuality.length > 0
        ? reflectionsWithQuality.reduce((sum, log) => sum + (log.reflectionQualityScore || 0), 0) / reflectionsWithQuality.length
        : 0;

      // Calculate time spent
      const timeSpent = student.writingSessions.reduce((sum, session) => 
        sum + (session.duration || 0), 0
      ) / 60; // Convert to minutes

      const wordCount = submission?.wordCount || 0;

      return {
        student: student as Student,
        submission,
        aiInteractions,
        reflectionQuality,
        timeSpent,
        wordCount
      };
    } catch (error) {
      console.error('Error getting assignment performance:', error);
      throw new Error(`Failed to get assignment performance for student: ${studentId}`);
    }
  }

  /**
   * Find students with similar learning profiles
   */
  async findSimilarLearningProfiles(
    studentId: string,
    courseId?: string
  ): Promise<(Student & { studentProfile: StudentProfile })[]> {
    this.validateRequired({ studentId }, ['studentId']);
    
    try {
      // First get the target student's profile
      const targetStudent = await this.prisma.user.findUnique({
        where: { id: studentId },
        include: { studentProfile: true }
      });

      if (!targetStudent?.studentProfile) {
        return [];
      }

      const profile = targetStudent.studentProfile;
      
      const whereClause: any = {
        role: 'student',
        id: { not: studentId },
        studentProfile: {
          isNot: null,
          // Find students with similar metrics (within 20 points)
          AND: [
            {
              evidenceAnalysis: {
                gte: Math.max(0, profile.evidenceAnalysis - 20),
                lte: Math.min(100, profile.evidenceAnalysis + 20)
              }
            },
            {
              metacognition: {
                gte: Math.max(0, profile.metacognition - 20),
                lte: Math.min(100, profile.metacognition + 20)
              }
            }
          ]
        }
      };

      if (courseId) {
        whereClause.enrollments = {
          some: {
            courseId,
            status: 'active'
          }
        };
      }

      const similarStudents = await this.prisma.user.findMany({
        where: whereClause,
        include: {
          studentProfile: true
        },
        take: 10 // Limit to 10 similar students
      });

      return similarStudents as (Student & { studentProfile: StudentProfile })[];
    } catch (error) {
      console.error('Error finding similar learning profiles:', error);
      throw new Error(`Failed to find similar learning profiles for student: ${studentId}`);
    }
  }

  /**
   * Update student's learning profile
   */
  async updateLearningProfile(
    studentId: string,
    profileData: Partial<StudentProfile>
  ): Promise<StudentProfile> {
    this.validateRequired({ studentId }, ['studentId']);
    
    try {
      const profile = await this.prisma.studentProfile.upsert({
        where: { studentId },
        create: {
          studentId,
          questionComplexity: profileData.questionComplexity,
          preferredLearningStyle: profileData.preferredLearningStyle,
          averageReflectionDepth: profileData.averageReflectionDepth,
          bestRespondsTo: profileData.bestRespondsTo as any,
          strugglesWith: profileData.strugglesWith as any,
          evidenceAnalysis: profileData.evidenceAnalysis,
          perspectiveTaking: profileData.perspectiveTaking,
          logicalReasoning: profileData.logicalReasoning,
          creativeThinking: profileData.creativeThinking,
          organizationalSkills: profileData.organizationalSkills,
          metacognition: profileData.metacognition,
          currentCognitiveLoad: profileData.currentCognitiveLoad,
          emotionalState: profileData.emotionalState,
          currentFocus: profileData.currentFocus,
          recentBreakthrough: profileData.recentBreakthrough,
          strugglingDuration: profileData.strugglingDuration,
          lastSuccessfulInteraction: profileData.lastSuccessfulInteraction,
          lastActivityTime: profileData.lastActivityTime,
          aiRequestFrequency: profileData.aiRequestFrequency,
          independentWorkStreak: profileData.independentWorkStreak,
          qualityWithoutAI: profileData.qualityWithoutAI,
          independenceTrend: profileData.independenceTrend,
          lastMilestone: profileData.lastMilestone,
          bestTimeOfDay: profileData.bestTimeOfDay,
          averageSessionLength: profileData.averageSessionLength,
          breakFrequency: profileData.breakFrequency,
          productivityPattern: profileData.productivityPattern,
          sessionMetrics: profileData.sessionMetrics as any
        },
        update: {
          questionComplexity: profileData.questionComplexity,
          preferredLearningStyle: profileData.preferredLearningStyle,
          averageReflectionDepth: profileData.averageReflectionDepth,
          bestRespondsTo: profileData.bestRespondsTo as any,
          strugglesWith: profileData.strugglesWith as any,
          evidenceAnalysis: profileData.evidenceAnalysis,
          perspectiveTaking: profileData.perspectiveTaking,
          logicalReasoning: profileData.logicalReasoning,
          creativeThinking: profileData.creativeThinking,
          organizationalSkills: profileData.organizationalSkills,
          metacognition: profileData.metacognition,
          currentCognitiveLoad: profileData.currentCognitiveLoad,
          emotionalState: profileData.emotionalState,
          currentFocus: profileData.currentFocus,
          recentBreakthrough: profileData.recentBreakthrough,
          strugglingDuration: profileData.strugglingDuration,
          lastSuccessfulInteraction: profileData.lastSuccessfulInteraction,
          lastActivityTime: profileData.lastActivityTime,
          aiRequestFrequency: profileData.aiRequestFrequency,
          independentWorkStreak: profileData.independentWorkStreak,
          qualityWithoutAI: profileData.qualityWithoutAI,
          independenceTrend: profileData.independenceTrend,
          lastMilestone: profileData.lastMilestone,
          bestTimeOfDay: profileData.bestTimeOfDay,
          averageSessionLength: profileData.averageSessionLength,
          breakFrequency: profileData.breakFrequency,
          productivityPattern: profileData.productivityPattern,
          sessionMetrics: profileData.sessionMetrics as any
        }
      });

      return profile;
    } catch (error) {
      console.error('Error updating learning profile:', error);
      throw new Error(`Failed to update learning profile for student: ${studentId}`);
    }
  }

  /**
   * Track student's writing session activity
   */
  async logWritingActivity(
    studentId: string,
    documentId: string,
    activityData: {
      sessionLength: number;
      wordsWritten: number;
      aiInteractions: number;
      breaks: number;
    }
  ): Promise<void> {
    this.validateRequired({ studentId, documentId }, ['studentId', 'documentId']);
    
    try {
      await this.prisma.writingSession.create({
        data: {
          userId: studentId,
          documentId,
          startTime: new Date(),
          endTime: new Date(Date.now() + activityData.sessionLength * 1000),
          duration: activityData.sessionLength,
          activity: {
            wordsWritten: activityData.wordsWritten,
            aiInteractions: activityData.aiInteractions,
            breaks: activityData.breaks
          }
        }
      });
    } catch (error) {
      console.error('Error logging writing activity:', error);
      throw new Error(`Failed to log writing activity for student: ${studentId}`);
    }
  }

  protected createTransactionalInstance(prismaTransaction: any): this {
    return new PrismaStudentRepository(prismaTransaction) as this;
  }
}