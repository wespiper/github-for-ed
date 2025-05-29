import prisma from '../lib/prisma';

export interface WritingProgressMetrics {
  studentId: string;
  assignmentId: string;
  totalSessions: number;
  totalWritingTime: number; // in minutes
  wordCountProgress: {
    initial: number;
    current: number;
    target?: number;
  };
  versionCount: number;
  lastActivity: Date;
  completionPercentage: number;
  averageSessionDuration: number;
  writingVelocity: number; // words per minute
}

export interface LearningObjectiveProgress {
  objectiveId: string;
  description: string;
  category: string;
  bloomsLevel: number;
  targetWeight: number;
  currentProgress: number; // 0-100%
  evidenceCount: number;
  lastUpdated: Date;
}

export interface StudentWritingAnalytics {
  studentId: string;
  courseId: string;
  timeframe: {
    start: Date;
    end: Date;
  };
  overallMetrics: {
    totalAssignments: number;
    completedAssignments: number;
    averageWordCount: number;
    totalWritingTime: number;
    averageGrade?: number;
  };
  progressMetrics: WritingProgressMetrics[];
  objectiveProgress: LearningObjectiveProgress[];
  writingPatterns: {
    peakProductivityHours: number[];
    averageSessionLength: number;
    procrastinationTendency: number; // 0-1 scale
    revisionIntensity: number; // edits per word written
  };
  collaborationMetrics: {
    collaborativeAssignments: number;
    leadershipInstances: number;
    averageContributionPercentage: number;
    peerFeedbackQuality: number;
  };
}

export interface CourseAnalytics {
  courseId: string;
  instructorId: string;
  timeframe: {
    start: Date;
    end: Date;
  };
  overallClassMetrics: {
    totalStudents: number;
    activeStudents: number;
    averageEngagement: number;
    assignmentCompletionRate: number;
    averageGrade: number;
  };
  assignmentAnalytics: {
    assignmentId: string;
    title: string;
    description: string;
    averageStudentProgress: number;
    strugglingStudentsCount: number;
    recommendedActions: string[];
  }[];
  interventionRecommendations: {
    studentId: string;
    urgency: 'low' | 'medium' | 'high';
    reasons: string[];
    suggestedActions: string[];
  }[];
  writingDevelopmentTrends: {
    overallProgress: number;
    skillGrowthAreas: string[];
    classStrengths: string[];
    concernAreas: string[];
  };
}

export class LearningAnalyticsService {
  
  /**
   * Validate UUID format
   */
  private static validateUUIDs(ids: Record<string, string>): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    for (const [key, value] of Object.entries(ids)) {
      if (!uuidRegex.test(value)) {
        throw new Error(`Invalid ${key}: ${value}`);
      }
    }
  }

  /**
   * Get comprehensive writing progress metrics for a specific assignment
   */
  static async getWritingProgressMetrics(
    studentId: string, 
    assignmentId: string
  ): Promise<WritingProgressMetrics> {
    this.validateUUIDs({ studentId, assignmentId });
    
    // Get assignment details
    const assignment = await prisma.assignment.findUnique({ 
      where: { id: assignmentId },
      select: {
        id: true,
        title: true,
        requirements: true,
        dueDate: true
      }
    });
    
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Get submission for this student
    const submission = await prisma.assignmentSubmission.findFirst({ 
      where: { 
        assignmentId: assignmentId, 
        authorId: studentId 
      },
      select: {
        id: true,
        content: true,
        wordCount: true,
        status: true,
        updatedAt: true,
        createdAt: true
      }
    });

    if (!submission) {
      return this.createEmptyProgressMetrics(studentId, assignmentId);
    }

    // Get documents for this submission
    const submissionDocuments = await prisma.document.findMany({
      where: {
        submissionId: submission.id
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const primaryDocument = submissionDocuments[0];

    // Get writing sessions for this assignment and student
    const writingSessions = await prisma.writingSession.findMany({
      where: {
        userId: studentId,
        document: {
          assignmentId: assignmentId
        }
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        duration: true,
        activity: true,
        createdAt: true,
        documentId: true
      },
      orderBy: { startTime: 'asc' }
    });

    // Get document versions to track writing progression
    const documentVersions = primaryDocument ? await prisma.documentVersion.findMany({
      where: {
        documentId: primaryDocument.id
      },
      select: {
        id: true,
        content: true,
        changes: true,
        createdAt: true,
        version: true
      },
      orderBy: { version: 'asc' }
    }) : [];

    return this.calculateProgressMetrics(
      studentId,
      assignmentId,
      assignment,
      submission,
      writingSessions,
      documentVersions,
      primaryDocument
    );
  }

  /**
   * Calculate comprehensive progress metrics from raw data
   */
  private static calculateProgressMetrics(
    studentId: string,
    assignmentId: string,
    assignment: any,
    submission: any,
    writingSessions: any[],
    documentVersions: any[],
    primaryDocument?: any
  ): WritingProgressMetrics {
    // Helper function to count words in text
    const countWords = (text: string): number => {
      if (!text) return 0;
      return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    // Calculate total writing time and sessions
    const totalSessions = writingSessions.length;
    const totalWritingTime = writingSessions.reduce((sum, session) => {
      return sum + (session.duration || 0);
    }, 0);

    // Calculate average session duration
    const averageSessionDuration = totalSessions > 0 ? totalWritingTime / totalSessions : 0;

    // Extract word count progression
    const currentWordCount = submission.wordCount || (primaryDocument ? countWords(primaryDocument.content) : 0);
    const initialWordCount = documentVersions.length > 0 
      ? countWords(documentVersions[0].content || '') 
      : 0;
    
    // Extract target from assignment requirements if available
    const requirements = assignment.requirements as any;
    const targetWordCount = requirements?.wordCount || requirements?.minimumWords || undefined;

    // Calculate writing velocity (words per minute)
    const totalWordsWritten = writingSessions.reduce((sum, session) => {
      const activity = session.activity as any;
      return sum + (activity?.wordsAdded || 0);
    }, 0);
    const writingVelocity = totalWritingTime > 0 ? totalWordsWritten / totalWritingTime : 0;

    // Calculate completion percentage
    let completionPercentage = 0;
    if (submission.status === 'submitted') {
      completionPercentage = 100;
    } else if (targetWordCount && currentWordCount > 0) {
      completionPercentage = Math.min((currentWordCount / targetWordCount) * 100, 95);
    } else if (currentWordCount > 0) {
      completionPercentage = 50; // Default for in-progress work
    }

    // Get last activity date
    const lastActivity = writingSessions.length > 0 
      ? new Date(Math.max(...writingSessions.map(s => new Date(s.startTime).getTime())))
      : submission.updatedAt;

    return {
      studentId,
      assignmentId,
      totalSessions,
      totalWritingTime,
      wordCountProgress: {
        initial: initialWordCount,
        current: currentWordCount,
        target: targetWordCount
      },
      versionCount: documentVersions.length,
      lastActivity,
      completionPercentage,
      averageSessionDuration,
      writingVelocity
    };
  }

  /**
   * Track learning objective progress across assignments
   */
  static async trackLearningObjectiveProgress(
    studentId: string,
    courseId: string
  ): Promise<LearningObjectiveProgress[]> {
    this.validateUUIDs({ studentId, courseId });
    
    // Get all assignments for the course that have learning objectives
    const assignments = await prisma.assignment.findMany({
      where: { 
        courseId: courseId,
        learningObjectives: {
          not: {}
        }
      },
      select: {
        id: true,
        title: true,
        learningObjectives: true,
        createdAt: true
      }
    });
    
    if (assignments.length === 0) {
      return [];
    }
    
    // Get submissions for this student across all course assignments
    const submissions = await prisma.assignmentSubmission.findMany({
      where: {
        assignmentId: { in: assignments.map(a => a.id) },
        authorId: studentId
      },
      select: {
        id: true,
        assignmentId: true,
        status: true,
        submittedAt: true,
        analytics: true,
        updatedAt: true,
        grade: true
      }
    });
    
    // Build progress tracking for each learning objective
    const objectiveProgressMap = new Map<string, {
      objective: any;
      assignmentCount: number;
      evidenceCount: number;
      totalProgress: number;
      lastUpdated: Date;
      assignmentIds: string[];
    }>();
    
    // Process each assignment
    assignments.forEach(assignment => {
      const learningObjectives = assignment.learningObjectives as any;
      
      if (!learningObjectives || typeof learningObjectives !== 'object') return;
      
      // Handle both array and object formats for learning objectives
      const objectives = Array.isArray(learningObjectives) 
        ? learningObjectives 
        : Object.values(learningObjectives);
      
      objectives.forEach((objective: any) => {
        if (!objective || typeof objective !== 'object') return;
        
        const objectiveId = objective.id || objective._id || `${assignment.id}_${objective.description?.substring(0, 20)}`;
        
        if (!objectiveProgressMap.has(objectiveId)) {
          objectiveProgressMap.set(objectiveId, {
            objective: {
              id: objectiveId,
              description: objective.description || 'Learning Objective',
              category: objective.category || 'general',
              bloomsLevel: objective.bloomsLevel || 1,
              targetWeight: objective.weight || 1.0
            },
            assignmentCount: 0,
            evidenceCount: 0,
            totalProgress: 0,
            lastUpdated: new Date(0),
            assignmentIds: []
          });
        }
        
        const progress = objectiveProgressMap.get(objectiveId)!;
        progress.assignmentCount += 1;
        progress.assignmentIds.push(assignment.id);
        
        // Check if student has submitted this assignment
        const submission = submissions.find(s => s.assignmentId === assignment.id);
        if (submission && submission.submittedAt) {
          progress.evidenceCount += 1;
          
          // Calculate progress based on submission status and grade
          let objectiveProgress = 0;
          if (submission.status === 'submitted') {
            if (submission.grade) {
              const grade = submission.grade as any;
              objectiveProgress = grade.score || grade.percentage || 75; // Default to 75% if submitted
            } else {
              objectiveProgress = 75; // Default progress for submitted work without grade
            }
          } else if (submission.status === 'draft') {
            objectiveProgress = 50; // Partial credit for in-progress work
          }
          
          // Check analytics for specific objective progress if available
          const analytics = submission.analytics as any;
          if (analytics?.objectiveProgress?.[objectiveId]) {
            objectiveProgress = analytics.objectiveProgress[objectiveId];
          }
          
          progress.totalProgress += objectiveProgress;
          
          if (submission.updatedAt > progress.lastUpdated) {
            progress.lastUpdated = submission.updatedAt;
          }
        }
      });
    });
    
    // Convert to final format
    const results: LearningObjectiveProgress[] = [];
    
    objectiveProgressMap.forEach((progress) => {
      const currentProgress = progress.evidenceCount > 0 
        ? progress.totalProgress / progress.evidenceCount 
        : 0;
      
      results.push({
        objectiveId: progress.objective.id,
        description: progress.objective.description,
        category: progress.objective.category,
        bloomsLevel: progress.objective.bloomsLevel,
        targetWeight: progress.objective.targetWeight,
        currentProgress: Math.round(currentProgress),
        evidenceCount: progress.evidenceCount,
        lastUpdated: progress.lastUpdated
      });
    });
    
    // Sort by category and progress
    return results.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return b.currentProgress - a.currentProgress;
    });
  }

  /**
   * Create comprehensive analytics report for a student
   */
  static async generateStudentWritingAnalytics(
    studentId: string,
    courseId: string,
    timeframe?: { start: Date; end: Date }
  ): Promise<StudentWritingAnalytics> {
    this.validateUUIDs({ studentId, courseId });
    
    const defaultTimeframe = timeframe || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date()
    };

    // Get all assignments for the course
    const assignments = await prisma.assignment.findMany({
      where: { 
        courseId: courseId,
        createdAt: {
          gte: defaultTimeframe.start,
          lte: defaultTimeframe.end
        }
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        createdAt: true
      }
    });

    // Get all submissions for this student in the course
    const submissions = await prisma.assignmentSubmission.findMany({
      where: {
        assignmentId: { in: assignments.map(a => a.id) },
        authorId: studentId,
        updatedAt: {
          gte: defaultTimeframe.start,
          lte: defaultTimeframe.end
        }
      },
      select: {
        id: true,
        assignmentId: true,
        status: true,
        wordCount: true,
        submittedAt: true,
        createdAt: true,
        updatedAt: true,
        grade: true,
        collaborationSettings: true
      }
    });

    // Get writing sessions for pattern analysis
    const writingSessions = await prisma.writingSession.findMany({
      where: {
        userId: studentId,
        startTime: {
          gte: defaultTimeframe.start,
          lte: defaultTimeframe.end
        },
        document: {
          assignmentId: { in: assignments.map(a => a.id) }
        }
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        duration: true,
        activity: true,
        documentId: true
      }
    });

    // Calculate overall metrics
    const completedAssignments = submissions.filter(s => s.status === 'submitted').length;
    const totalWritingTime = writingSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    const averageWordCount = submissions.length > 0 
      ? submissions.reduce((sum, s) => sum + s.wordCount, 0) / submissions.length 
      : 0;
    
    // Calculate average grade
    const gradedSubmissions = submissions.filter(s => s.grade);
    const averageGrade = gradedSubmissions.length > 0 
      ? gradedSubmissions.reduce((sum, s) => {
          const grade = s.grade as any;
          return sum + (grade.score || grade.percentage || 0);
        }, 0) / gradedSubmissions.length 
      : undefined;

    // Get progress metrics for each assignment
    const progressMetrics: WritingProgressMetrics[] = [];
    for (const assignment of assignments) {
      const submission = submissions.find(s => s.assignmentId === assignment.id);
      if (submission) {
        try {
          const metrics = await this.getWritingProgressMetrics(studentId, assignment.id);
          progressMetrics.push(metrics);
        } catch (error) {
          // Skip assignments that can't be analyzed
          console.warn(`Skipping progress metrics for assignment ${assignment.id}:`, error);
        }
      }
    }

    // Get learning objective progress
    const objectiveProgress = await this.trackLearningObjectiveProgress(studentId, courseId);

    // Analyze writing patterns
    const writingPatterns = this.analyzeWritingPatterns(writingSessions, assignments, submissions);

    // Analyze collaboration metrics
    const collaborationMetrics = this.analyzeCollaborationMetrics(submissions);

    return {
      studentId,
      courseId,
      timeframe: defaultTimeframe,
      overallMetrics: {
        totalAssignments: assignments.length,
        completedAssignments,
        averageWordCount: Math.round(averageWordCount),
        totalWritingTime,
        averageGrade
      },
      progressMetrics,
      objectiveProgress,
      writingPatterns,
      collaborationMetrics
    };
  }

  /**
   * Analyze writing patterns from session data
   */
  private static analyzeWritingPatterns(
    writingSessions: any[],
    assignments: any[],
    submissions: any[]
  ): {
    peakProductivityHours: number[];
    averageSessionLength: number;
    procrastinationTendency: number;
    revisionIntensity: number;
  } {
    if (writingSessions.length === 0) {
      return {
        peakProductivityHours: [],
        averageSessionLength: 0,
        procrastinationTendency: 0,
        revisionIntensity: 0
      };
    }

    // Calculate peak productivity hours
    const hourCounts = new Array(24).fill(0);
    writingSessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      hourCounts[hour] += session.duration || 0;
    });
    
    const maxHours = Math.max(...hourCounts);
    const peakProductivityHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(({ count }) => count >= maxHours * 0.8)
      .map(({ hour }) => hour);

    // Calculate average session length
    const averageSessionLength = writingSessions.reduce((sum, session) => 
      sum + (session.duration || 0), 0) / writingSessions.length;

    // Calculate procrastination tendency
    let procrastinationScore = 0;
    submissions.forEach(submission => {
      const assignment = assignments.find(a => a.id === submission.assignmentId);
      if (assignment?.dueDate && submission.createdAt) {
        const timeToDeadline = new Date(assignment.dueDate).getTime() - new Date(submission.createdAt).getTime();
        const totalTime = new Date(assignment.dueDate).getTime() - new Date(assignment.createdAt).getTime();
        
        if (totalTime > 0) {
          const procrastinationRatio = 1 - (timeToDeadline / totalTime);
          procrastinationScore += Math.max(0, procrastinationRatio);
        }
      }
    });
    const procrastinationTendency = submissions.length > 0 ? procrastinationScore / submissions.length : 0;

    // Calculate revision intensity (based on writing activity)
    const totalWordsAdded = writingSessions.reduce((sum, session) => {
      const activity = session.activity as any;
      return sum + (activity?.wordsAdded || 0);
    }, 0);
    
    const totalWordsDeleted = writingSessions.reduce((sum, session) => {
      const activity = session.activity as any;
      return sum + (activity?.wordsDeleted || 0);
    }, 0);
    
    const revisionIntensity = totalWordsAdded > 0 ? totalWordsDeleted / totalWordsAdded : 0;

    return {
      peakProductivityHours,
      averageSessionLength: Math.round(averageSessionLength),
      procrastinationTendency: Math.round(procrastinationTendency * 100) / 100,
      revisionIntensity: Math.round(revisionIntensity * 100) / 100
    };
  }

  /**
   * Analyze collaboration metrics from submissions
   */
  private static analyzeCollaborationMetrics(submissions: any[]): {
    collaborativeAssignments: number;
    leadershipInstances: number;
    averageContributionPercentage: number;
    peerFeedbackQuality: number;
  } {
    const collaborativeSubmissions = submissions.filter(s => {
      const settings = s.collaborationSettings as any;
      return settings?.isCollaborative || settings?.allowCollaboration;
    });

    // Simple metrics for now
    const collaborativeAssignments = collaborativeSubmissions.length;
    const leadershipInstances = 0; // Would need collaboration analytics to determine
    const averageContributionPercentage = collaborativeAssignments > 0 ? 75 : 0; // Default assumption
    const peerFeedbackQuality = 0; // Would need feedback data to calculate

    return {
      collaborativeAssignments,
      leadershipInstances,
      averageContributionPercentage,
      peerFeedbackQuality
    };
  }

  /**
   * Generate course-level analytics for educators
   */
  static async generateCourseAnalytics(
    courseId: string,
    instructorId: string,
    timeframe?: { start: Date; end: Date }
  ): Promise<CourseAnalytics> {
    this.validateUUIDs({ courseId, instructorId });
    
    const defaultTimeframe = timeframe || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date()
    };

    // Verify instructor owns this course
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        instructorId: instructorId
      }
    });

    if (!course) {
      throw new Error('Course not found or access denied');
    }

    // Get all students enrolled in the course
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        courseId: courseId,
        status: 'active'
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    const studentIds = enrollments.map(e => e.student.id);

    // Get all assignments for the course in timeframe
    const assignments = await prisma.assignment.findMany({
      where: {
        courseId: courseId,
        createdAt: {
          gte: defaultTimeframe.start,
          lte: defaultTimeframe.end
        }
      },
      select: {
        id: true,
        title: true,
        instructions: true,
        dueDate: true,
        createdAt: true
      }
    });

    // Get all submissions for course assignments
    const submissions = await prisma.assignmentSubmission.findMany({
      where: {
        assignmentId: { in: assignments.map(a => a.id) },
        authorId: { in: studentIds }
      },
      select: {
        id: true,
        assignmentId: true,
        authorId: true,
        status: true,
        wordCount: true,
        submittedAt: true,
        updatedAt: true,
        grade: true
      }
    });

    // Get writing sessions for engagement analysis
    const writingSessions = await prisma.writingSession.findMany({
      where: {
        userId: { in: studentIds },
        startTime: {
          gte: defaultTimeframe.start,
          lte: defaultTimeframe.end
        },
        document: {
          assignmentId: { in: assignments.map(a => a.id) }
        }
      },
      select: {
        userId: true,
        startTime: true,
        duration: true
      }
    });

    // Calculate overall class metrics
    const overallClassMetrics = this.calculateClassMetrics(
      enrollments, 
      submissions, 
      writingSessions, 
      defaultTimeframe
    );

    // Analyze each assignment
    const assignmentAnalytics = assignments.map(assignment => 
      this.analyzeAssignmentPerformance(assignment, submissions, studentIds)
    );

    // Generate intervention recommendations
    const interventionRecommendations = this.generateInterventionRecommendations(
      studentIds, 
      submissions, 
      writingSessions
    );

    // Analyze writing development trends
    const writingDevelopmentTrends = this.analyzeWritingDevelopmentTrends(
      submissions, 
      assignments,
      studentIds
    );

    return {
      courseId,
      instructorId,
      timeframe: defaultTimeframe,
      overallClassMetrics,
      assignmentAnalytics,
      interventionRecommendations,
      writingDevelopmentTrends
    };
  }

  /**
   * Calculate overall class performance metrics
   */
  private static calculateClassMetrics(
    enrollments: any[],
    submissions: any[],
    writingSessions: any[],
    timeframe: { start: Date; end: Date }
  ): {
    totalStudents: number;
    activeStudents: number;
    averageEngagement: number;
    assignmentCompletionRate: number;
    averageGrade: number;
  } {
    const totalStudents = enrollments.length;
    
    // Students with recent activity
    const activeStudentIds = new Set([
      ...submissions.filter(s => s.updatedAt >= timeframe.start).map(s => s.authorId),
      ...writingSessions.filter(s => s.startTime >= timeframe.start).map(s => s.userId)
    ]);
    const activeStudents = activeStudentIds.size;

    // Calculate engagement based on writing session activity
    const totalSessionTime = writingSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    const averageEngagement = totalStudents > 0 ? totalSessionTime / totalStudents : 0;

    // Calculate assignment completion rate
    const submittedAssignments = submissions.filter(s => s.status === 'submitted').length;
    const totalAssignmentOpportunities = submissions.length;
    const assignmentCompletionRate = totalAssignmentOpportunities > 0 
      ? (submittedAssignments / totalAssignmentOpportunities) * 100 
      : 0;

    // Calculate average grade
    const gradedSubmissions = submissions.filter(s => s.grade);
    const averageGrade = gradedSubmissions.length > 0 
      ? gradedSubmissions.reduce((sum, s) => {
          const grade = s.grade as any;
          return sum + (grade.score || grade.percentage || 0);
        }, 0) / gradedSubmissions.length 
      : 0;

    return {
      totalStudents,
      activeStudents,
      averageEngagement: Math.round(averageEngagement),
      assignmentCompletionRate: Math.round(assignmentCompletionRate),
      averageGrade: Math.round(averageGrade)
    };
  }

  /**
   * Analyze performance for individual assignments
   */
  private static analyzeAssignmentPerformance(
    assignment: any,
    allSubmissions: any[],
    studentIds: string[]
  ): {
    assignmentId: string;
    title: string;
    description: string;
    averageStudentProgress: number;
    strugglingStudentsCount: number;
    recommendedActions: string[];
  } {
    const assignmentSubmissions = allSubmissions.filter(s => s.assignmentId === assignment.id);
    
    // Calculate average progress
    const submittedCount = assignmentSubmissions.filter(s => s.status === 'submitted').length;
    const draftCount = assignmentSubmissions.filter(s => s.status === 'draft').length;
    const notStartedCount = studentIds.length - assignmentSubmissions.length;
    
    const averageStudentProgress = studentIds.length > 0 
      ? ((submittedCount * 100) + (draftCount * 50)) / studentIds.length 
      : 0;

    // Identify struggling students (no submission or very low word count)
    const strugglingStudentsCount = notStartedCount + 
      assignmentSubmissions.filter(s => s.wordCount < 50).length;

    // Generate recommendations based on performance
    const recommendedActions: string[] = [];
    
    if (averageStudentProgress < 30) {
      recommendedActions.push('Consider extending deadline or providing additional support');
      recommendedActions.push('Host office hours to address common challenges');
    }
    
    if (strugglingStudentsCount > studentIds.length * 0.3) {
      recommendedActions.push('Reach out to struggling students individually');
      recommendedActions.push('Review assignment clarity and expectations');
    }
    
    if (submittedCount === 0 && assignment.dueDate && assignment.dueDate < new Date()) {
      recommendedActions.push('Send assignment completion reminders');
    }

    return {
      assignmentId: assignment.id,
      title: assignment.title,
      description: assignment.instructions?.substring(0, 100) + '...' || 'No description',
      averageStudentProgress: Math.round(averageStudentProgress),
      strugglingStudentsCount,
      recommendedActions
    };
  }

  /**
   * Generate intervention recommendations for at-risk students
   */
  private static generateInterventionRecommendations(
    studentIds: string[],
    submissions: any[],
    writingSessions: any[]
  ): {
    studentId: string;
    urgency: 'low' | 'medium' | 'high';
    reasons: string[];
    suggestedActions: string[];
  }[] {
    const recommendations: any[] = [];

    studentIds.forEach(studentId => {
      const studentSubmissions = submissions.filter(s => s.authorId === studentId);
      const studentSessions = writingSessions.filter(s => s.userId === studentId);
      
      const reasons: string[] = [];
      const suggestedActions: string[] = [];
      let urgency: 'low' | 'medium' | 'high' = 'low';

      // Check for lack of activity
      if (studentSessions.length === 0) {
        reasons.push('No writing activity recorded');
        suggestedActions.push('Schedule one-on-one check-in');
        urgency = 'high';
      }

      // Check for low submission rate
      const submissionRate = studentSubmissions.filter(s => s.status === 'submitted').length / 
        Math.max(studentSubmissions.length, 1);
      
      if (submissionRate < 0.5) {
        reasons.push('Low assignment completion rate');
        suggestedActions.push('Provide assignment planning support');
        urgency = urgency === 'high' ? 'high' : 'medium';
      }

      // Check for consistently low word counts
      const avgWordCount = studentSubmissions.length > 0 
        ? studentSubmissions.reduce((sum, s) => sum + s.wordCount, 0) / studentSubmissions.length 
        : 0;
      
      if (avgWordCount < 100 && studentSubmissions.length > 0) {
        reasons.push('Consistently low word counts in submissions');
        suggestedActions.push('Offer writing development resources');
        urgency = urgency === 'high' ? 'high' : 'medium';
      }

      // Only add if there are concerns
      if (reasons.length > 0) {
        recommendations.push({
          studentId,
          urgency,
          reasons,
          suggestedActions
        });
      }
    });

    return recommendations;
  }

  /**
   * Analyze overall writing development trends
   */
  private static analyzeWritingDevelopmentTrends(
    submissions: any[],
    _assignments: any[],
    _studentIds: string[]
  ): {
    overallProgress: number;
    skillGrowthAreas: string[];
    classStrengths: string[];
    concernAreas: string[];
  } {
    // Calculate overall progress based on submission trends
    const submittedSubmissions = submissions.filter(s => s.status === 'submitted');
    const overallProgress = submissions.length > 0 
      ? (submittedSubmissions.length / submissions.length) * 100 
      : 0;

    // Analyze word count trends
    const avgWordCount = submissions.length > 0 
      ? submissions.reduce((sum, s) => sum + s.wordCount, 0) / submissions.length 
      : 0;

    const skillGrowthAreas: string[] = [];
    const classStrengths: string[] = [];
    const concernAreas: string[] = [];

    // Analyze patterns
    if (avgWordCount > 500) {
      classStrengths.push('Strong writing volume and engagement');
    } else if (avgWordCount < 200) {
      concernAreas.push('Low writing output across assignments');
      skillGrowthAreas.push('Writing fluency and idea development');
    }

    if (overallProgress > 80) {
      classStrengths.push('High assignment completion rate');
    } else if (overallProgress < 50) {
      concernAreas.push('Low assignment completion rate');
      skillGrowthAreas.push('Time management and assignment planning');
    }

    // Default skill areas if none identified
    if (skillGrowthAreas.length === 0) {
      skillGrowthAreas.push('Continued writing development');
    }

    return {
      overallProgress: Math.round(overallProgress),
      skillGrowthAreas,
      classStrengths,
      concernAreas
    };
  }

  /**
   * Helper method to create empty progress metrics
   */
  private static createEmptyProgressMetrics(
    studentId: string,
    assignmentId: string
  ): WritingProgressMetrics {
    return {
      studentId,
      assignmentId,
      totalSessions: 0,
      totalWritingTime: 0,
      wordCountProgress: {
        initial: 0,
        current: 0
      },
      versionCount: 0,
      lastActivity: new Date(),
      completionPercentage: 0,
      averageSessionDuration: 0,
      writingVelocity: 0
    };
  }
}