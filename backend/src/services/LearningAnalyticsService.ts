import { Assignment } from '../models/Assignment';
import { AssignmentSubmission } from '../models/AssignmentSubmission';
import { DocumentVersion } from '../models/DocumentVersion';
import { WritingSession } from '../models/WritingSession';
import { User } from '../models/User';
import mongoose from 'mongoose';

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
  learningObjectiveProgress: LearningObjectiveProgress[];
  writingPatterns: {
    preferredWritingTimes: string[]; // hour ranges
    averageSessionLength: number;
    revisionFrequency: number;
    collaborationLevel: number;
  };
  skillDevelopment: {
    bloomsLevelDistribution: Record<number, number>;
    categoryStrengths: Record<string, number>;
    improvementAreas: string[];
  };
}

export interface EducatorInsights {
  courseId: string;
  instructorId: string;
  timeframe: {
    start: Date;
    end: Date;
  };
  classMetrics: {
    totalStudents: number;
    activeStudents: number;
    averageEngagement: number;
    assignmentCompletionRate: number;
  };
  learningObjectiveEffectiveness: {
    objectiveId: string;
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
   * Get comprehensive writing progress metrics for a specific assignment
   */
  static async getWritingProgressMetrics(
    studentId: string, 
    assignmentId: string
  ): Promise<WritingProgressMetrics> {
    this.validateObjectIds({ studentId, assignmentId });
    
    // Get assignment and submission data
    const [assignment, submission] = await Promise.all([
      Assignment.findById(assignmentId),
      AssignmentSubmission.findOne({ assignment: assignmentId, student: studentId })
    ]);
    
    if (!assignment) {
      throw new Error('Assignment not found');
    }
    
    if (!submission) {
      return this.createEmptyProgressMetrics(studentId, assignmentId);
    }
    
    // Get writing sessions and document versions
    const [writingSessions, documentVersions] = await Promise.all([
      WritingSession.find({ 
        assignment: assignmentId, 
        student: studentId 
      }).sort({ startTime: 1 }),
      // TODO: Fix document reference
      // DocumentVersion.find({ 
      //   document: submission.document 
      // }).sort({ createdAt: 1 })
      [] as any[] // Temporary fix
    ]);
    
    return this.calculateProgressMetrics(
      studentId,
      assignmentId,
      assignment,
      submission,
      writingSessions,
      documentVersions
    );
  }
  
  /**
   * Track learning objective progress across assignments
   */
  static async getLearningObjectiveProgress(
    studentId: string,
    courseId: string,
    timeframe?: { start: Date; end: Date }
  ): Promise<LearningObjectiveProgress[]> {
    this.validateObjectIds({ studentId, courseId });
    
    const timeQuery = timeframe ? {
      createdAt: { $gte: timeframe.start, $lte: timeframe.end }
    } : {};
    
    // Get all assignments and submissions for the course
    const assignments = await Assignment.find({ 
      course: courseId,
      ...timeQuery 
    }).populate('learningObjectives');
    
    const submissions = await AssignmentSubmission.find({
      student: studentId,
      assignment: { $in: assignments.map(a => a._id) }
    });
    
    // Group by learning objectives and calculate progress
    const progressMap = new Map<string, LearningObjectiveProgress>();
    
    for (const assignment of assignments) {
      if (!assignment.learningObjectives) continue;
      
      for (const objective of assignment.learningObjectives) {
        const submission = submissions.find(s => 
          s.assignment.toString() === assignment._id.toString()
        );
        
        const progress = this.calculateObjectiveProgress(objective, submission);
        
        if (progressMap.has(objective.id)) {
          const existing = progressMap.get(objective.id)!;
          existing.currentProgress = Math.max(existing.currentProgress, progress.currentProgress);
          existing.evidenceCount += progress.evidenceCount;
          if (progress.lastUpdated > existing.lastUpdated) {
            existing.lastUpdated = progress.lastUpdated;
          }
        } else {
          progressMap.set(objective.id, progress);
        }
      }
    }
    
    return Array.from(progressMap.values());
  }
  
  /**
   * Generate comprehensive student writing analytics
   */
  static async getStudentWritingAnalytics(
    studentId: string,
    courseId: string,
    timeframe: { start: Date; end: Date }
  ): Promise<StudentWritingAnalytics> {
    this.validateObjectIds({ studentId, courseId });
    
    const [overallMetrics, learningObjectiveProgress, writingPatterns, skillDevelopment] = 
      await Promise.all([
        this.calculateOverallMetrics(studentId, courseId, timeframe),
        this.getLearningObjectiveProgress(studentId, courseId, timeframe),
        this.analyzeWritingPatterns(studentId, courseId, timeframe),
        this.analyzeSkillDevelopment(studentId, courseId, timeframe)
      ]);
    
    return {
      studentId,
      courseId,
      timeframe,
      overallMetrics,
      learningObjectiveProgress,
      writingPatterns,
      skillDevelopment
    };
  }
  
  /**
   * Generate educator insights for course management
   */
  static async getEducatorInsights(
    instructorId: string,
    courseId: string,
    timeframe: { start: Date; end: Date }
  ): Promise<EducatorInsights> {
    this.validateObjectIds({ instructorId, courseId });
    
    // Verify instructor access
    const assignment = await Assignment.findOne({ 
      course: courseId, 
      instructor: instructorId 
    });
    
    if (!assignment) {
      throw new Error('Access denied: You can only view insights for your own courses');
    }
    
    const [classMetrics, objectiveEffectiveness, interventionRecommendations, developmentTrends] = 
      await Promise.all([
        this.calculateClassMetrics(courseId, timeframe),
        this.analyzeLearningObjectiveEffectiveness(courseId, timeframe),
        this.generateInterventionRecommendations(courseId, timeframe),
        this.analyzeWritingDevelopmentTrends(courseId, timeframe)
      ]);
    
    return {
      courseId,
      instructorId,
      timeframe,
      classMetrics,
      learningObjectiveEffectiveness: objectiveEffectiveness,
      interventionRecommendations,
      writingDevelopmentTrends: developmentTrends
    };
  }
  
  /**
   * Identify students who may need intervention
   */
  static async identifyAtRiskStudents(
    courseId: string,
    criteria: {
      minimumEngagement?: number;
      maxDaysSinceActivity?: number;
      minimumCompletionRate?: number;
    } = {}
  ): Promise<{
    studentId: string;
    riskLevel: 'low' | 'medium' | 'high';
    reasons: string[];
    lastActivity: Date;
    completionRate: number;
    engagementScore: number;
  }[]> {
    this.validateObjectIds({ courseId });
    
    const {
      minimumEngagement = 0.3,
      maxDaysSinceActivity = 7,
      minimumCompletionRate = 0.5
    } = criteria;
    
    // Get all students in the course
    const assignments = await Assignment.find({ course: courseId });
    const assignmentIds = assignments.map(a => a._id);
    
    const submissions = await AssignmentSubmission.aggregate([
      { $match: { assignment: { $in: assignmentIds } } },
      {
        $group: {
          _id: '$student',
          totalSubmissions: { $sum: 1 },
          completedSubmissions: {
            $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] }
          },
          lastActivity: { $max: '$updatedAt' },
          averageGrade: { $avg: '$grade' }
        }
      }
    ]);
    
    const atRiskStudents = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxDaysSinceActivity);
    
    for (const studentData of submissions) {
      const completionRate = studentData.completedSubmissions / assignments.length;
      const daysSinceActivity = Math.floor(
        (Date.now() - new Date(studentData.lastActivity).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Calculate engagement score based on activity patterns
      const engagementScore = await this.calculateEngagementScore(
        studentData._id.toString(), 
        courseId
      );
      
      const reasons = [];
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      
      if (completionRate < minimumCompletionRate) {
        reasons.push(`Low completion rate: ${Math.round(completionRate * 100)}%`);
        riskLevel = 'medium';
      }
      
      if (daysSinceActivity > maxDaysSinceActivity) {
        reasons.push(`Inactive for ${daysSinceActivity} days`);
        riskLevel = 'high';
      }
      
      if (engagementScore < minimumEngagement) {
        reasons.push(`Low engagement score: ${Math.round(engagementScore * 100)}%`);
        if (riskLevel === 'low') riskLevel = 'medium';
      }
      
      if (reasons.length > 0) {
        atRiskStudents.push({
          studentId: studentData._id.toString(),
          riskLevel,
          reasons,
          lastActivity: studentData.lastActivity,
          completionRate,
          engagementScore
        });
      }
    }
    
    return atRiskStudents.sort((a, b) => {
      const riskOrder = { high: 3, medium: 2, low: 1 };
      return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
    });
  }
  
  // Private helper methods
  
  private static validateObjectIds(ids: Record<string, string>): void {
    for (const [key, id] of Object.entries(ids)) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid ${key}: ${id}`);
      }
    }
  }
  
  private static createEmptyProgressMetrics(
    studentId: string, 
    assignmentId: string
  ): WritingProgressMetrics {
    return {
      studentId,
      assignmentId,
      totalSessions: 0,
      totalWritingTime: 0,
      wordCountProgress: { initial: 0, current: 0 },
      versionCount: 0,
      lastActivity: new Date(),
      completionPercentage: 0,
      averageSessionDuration: 0,
      writingVelocity: 0
    };
  }
  
  private static calculateProgressMetrics(
    studentId: string,
    assignmentId: string,
    assignment: any,
    submission: any,
    writingSessions: any[],
    documentVersions: any[]
  ): WritingProgressMetrics {
    const totalWritingTime = writingSessions.reduce(
      (sum, session) => sum + (session.duration || 0), 0
    );
    
    const wordCounts = documentVersions.map(v => v.wordCount || 0);
    const initialWordCount = wordCounts[0] || 0;
    const currentWordCount = wordCounts[wordCounts.length - 1] || 0;
    
    const averageSessionDuration = writingSessions.length > 0 
      ? totalWritingTime / writingSessions.length 
      : 0;
    
    const writingVelocity = totalWritingTime > 0 
      ? (currentWordCount - initialWordCount) / totalWritingTime 
      : 0;
    
    // Calculate completion percentage based on submission status and requirements
    let completionPercentage = 0;
    if (submission.status === 'submitted') {
      completionPercentage = 100;
    } else if (submission.status === 'in_progress') {
      // Estimate based on word count and requirements
      const targetWordCount = assignment.requirements?.wordCount || 1000;
      completionPercentage = Math.min(95, (currentWordCount / targetWordCount) * 100);
    }
    
    return {
      studentId,
      assignmentId,
      totalSessions: writingSessions.length,
      totalWritingTime,
      wordCountProgress: {
        initial: initialWordCount,
        current: currentWordCount,
        target: assignment.requirements?.wordCount
      },
      versionCount: documentVersions.length,
      lastActivity: submission.updatedAt,
      completionPercentage,
      averageSessionDuration,
      writingVelocity
    };
  }
  
  private static calculateObjectiveProgress(
    objective: any, 
    submission: any
  ): LearningObjectiveProgress {
    // Calculate progress based on submission status and quality
    let currentProgress = 0;
    let evidenceCount = 0;
    let lastUpdated = new Date();
    
    if (submission) {
      evidenceCount = 1;
      lastUpdated = submission.updatedAt;
      
      if (submission.status === 'submitted') {
        if (submission.grade !== undefined) {
          // Use actual grade if available
          currentProgress = Math.max(0, Math.min(100, submission.grade));
        } else {
          // Estimate based on completion
          currentProgress = 75; // Assume good progress for completed work
        }
      } else if (submission.status === 'in_progress') {
        currentProgress = 40; // Partial progress for work in progress
      }
    }
    
    return {
      objectiveId: objective.id,
      description: objective.description,
      category: objective.category,
      bloomsLevel: objective.bloomsLevel,
      targetWeight: objective.weight,
      currentProgress,
      evidenceCount,
      lastUpdated
    };
  }
  
  private static async calculateOverallMetrics(
    studentId: string,
    courseId: string,
    timeframe: { start: Date; end: Date }
  ) {
    const assignments = await Assignment.find({
      course: courseId,
      createdAt: { $gte: timeframe.start, $lte: timeframe.end }
    });
    
    const submissions = await AssignmentSubmission.find({
      student: studentId,
      assignment: { $in: assignments.map(a => a._id) }
    });
    
    const completedSubmissions = submissions.filter(s => s.status === 'submitted');
    const totalWordCount = submissions.reduce((sum, s) => sum + (s.wordCount || 0), 0);
    const averageGrade = completedSubmissions.length > 0
      ? completedSubmissions.reduce((sum, s) => sum + (s.grade?.score || 0), 0) / completedSubmissions.length
      : undefined;
    
    // Calculate total writing time from sessions
    const writingSessions = await WritingSession.find({
      user: studentId,
      assignment: { $in: assignments.map(a => a._id) },
      startTime: { $gte: timeframe.start, $lte: timeframe.end }
    });
    
    const totalWritingTime = writingSessions.reduce(
      (sum, session) => sum + (session.duration || 0), 0
    );
    
    return {
      totalAssignments: assignments.length,
      completedAssignments: completedSubmissions.length,
      averageWordCount: submissions.length > 0 ? totalWordCount / submissions.length : 0,
      totalWritingTime,
      averageGrade
    };
  }
  
  private static async analyzeWritingPatterns(
    studentId: string,
    courseId: string,
    timeframe: { start: Date; end: Date }
  ) {
    const assignments = await Assignment.find({
      course: courseId,
      createdAt: { $gte: timeframe.start, $lte: timeframe.end }
    });
    
    const writingSessions = await WritingSession.find({
      user: studentId,
      assignment: { $in: assignments.map(a => a._id) },
      startTime: { $gte: timeframe.start, $lte: timeframe.end }
    });
    
    // Analyze preferred writing times
    const hourCounts = new Array(24).fill(0);
    writingSessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      hourCounts[hour]++;
    });
    
    const preferredWritingTimes = [];
    const maxCount = Math.max(...hourCounts);
    if (maxCount > 0) {
      for (let i = 0; i < 24; i++) {
        if (hourCounts[i] >= maxCount * 0.5) {
          preferredWritingTimes.push(`${i}:00-${i + 1}:00`);
        }
      }
    }
    
    const averageSessionLength = writingSessions.length > 0
      ? writingSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / writingSessions.length
      : 0;
    
    // Get document versions for revision analysis
    const submissions = await AssignmentSubmission.find({
      student: studentId,
      assignment: { $in: assignments.map(a => a._id) }
    });
    
    let totalVersions = 0;
    // TODO: Fix document reference - may need to be through different relationship
    // for (const submission of submissions) {
    //   if (submission.document) {
    //     const versions = await DocumentVersion.countDocuments({
    //       document: submission.document
    //     });
    //     totalVersions += versions;
    //   }
    // }
    
    const revisionFrequency = submissions.length > 0 
      ? totalVersions / submissions.length 
      : 0;
    
    return {
      preferredWritingTimes,
      averageSessionLength,
      revisionFrequency,
      collaborationLevel: 0 // Placeholder for future collaboration features
    };
  }
  
  private static async analyzeSkillDevelopment(
    studentId: string,
    courseId: string,
    timeframe: { start: Date; end: Date }
  ) {
    const learningObjectives = await this.getLearningObjectiveProgress(
      studentId, 
      courseId, 
      timeframe
    );
    
    // Analyze Bloom's level distribution
    const bloomsLevelDistribution: Record<number, number> = {};
    const categoryStrengths: Record<string, number> = {};
    
    learningObjectives.forEach(objective => {
      bloomsLevelDistribution[objective.bloomsLevel] = 
        (bloomsLevelDistribution[objective.bloomsLevel] || 0) + objective.currentProgress;
      
      categoryStrengths[objective.category] = 
        (categoryStrengths[objective.category] || 0) + objective.currentProgress;
    });
    
    // Identify improvement areas (objectives with low progress)
    const improvementAreas = learningObjectives
      .filter(obj => obj.currentProgress < 60)
      .map(obj => obj.category)
      .filter((category, index, arr) => arr.indexOf(category) === index);
    
    return {
      bloomsLevelDistribution,
      categoryStrengths,
      improvementAreas
    };
  }
  
  private static async calculateClassMetrics(
    courseId: string,
    timeframe: { start: Date; end: Date }
  ) {
    const assignments = await Assignment.find({
      course: courseId,
      createdAt: { $gte: timeframe.start, $lte: timeframe.end }
    });
    
    const submissions = await AssignmentSubmission.find({
      assignment: { $in: assignments.map(a => a._id) }
    });
    
    // Get unique students
    const uniqueStudents = new Set(submissions.map(s => s.author.toString()));
    const totalStudents = uniqueStudents.size;
    
    // Calculate active students (students with recent activity)
    const recentCutoff = new Date();
    recentCutoff.setDate(recentCutoff.getDate() - 7);
    const activeStudents = submissions.filter(s => s.updatedAt >= recentCutoff).length;
    
    // Calculate completion rate
    const totalPossibleSubmissions = assignments.length * totalStudents;
    const completedSubmissions = submissions.filter(s => s.status === 'submitted').length;
    const assignmentCompletionRate = totalPossibleSubmissions > 0 
      ? completedSubmissions / totalPossibleSubmissions 
      : 0;
    
    // Calculate average engagement (simplified metric)
    const averageEngagement = totalStudents > 0 ? activeStudents / totalStudents : 0;
    
    return {
      totalStudents,
      activeStudents,
      averageEngagement,
      assignmentCompletionRate
    };
  }
  
  private static async analyzeLearningObjectiveEffectiveness(
    courseId: string,
    timeframe: { start: Date; end: Date }
  ) {
    const assignments = await Assignment.find({
      course: courseId,
      createdAt: { $gte: timeframe.start, $lte: timeframe.end }
    });
    
    const objectiveMap = new Map();
    
    // Collect all learning objectives and their progress across students
    for (const assignment of assignments) {
      if (!assignment.learningObjectives) continue;
      
      const submissions = await AssignmentSubmission.find({
        assignment: assignment._id
      });
      
      for (const objective of assignment.learningObjectives) {
        if (!objectiveMap.has(objective.id)) {
          objectiveMap.set(objective.id, {
            objectiveId: objective.id,
            description: objective.description,
            progressData: [],
            strugglingCount: 0
          });
        }
        
        const objectiveData = objectiveMap.get(objective.id);
        
        for (const submission of submissions) {
          const progress = this.calculateObjectiveProgress(objective, submission);
          objectiveData.progressData.push(progress.currentProgress);
          
          if (progress.currentProgress < 60) {
            objectiveData.strugglingCount++;
          }
        }
      }
    }
    
    // Generate effectiveness analysis
    return Array.from(objectiveMap.values()).map(data => {
      const averageProgress = data.progressData.length > 0
        ? data.progressData.reduce((sum: number, p: number) => sum + p, 0) / data.progressData.length
        : 0;
      
      const recommendedActions = [];
      if (averageProgress < 50) {
        recommendedActions.push('Consider breaking down into smaller objectives');
        recommendedActions.push('Provide additional scaffolding materials');
      } else if (averageProgress < 70) {
        recommendedActions.push('Review assignment instructions for clarity');
        recommendedActions.push('Consider peer collaboration opportunities');
      }
      
      if (data.strugglingCount > data.progressData.length * 0.3) {
        recommendedActions.push('Identify students needing individual support');
      }
      
      return {
        objectiveId: data.objectiveId,
        description: data.description,
        averageStudentProgress: averageProgress,
        strugglingStudentsCount: data.strugglingCount,
        recommendedActions
      };
    });
  }
  
  private static async generateInterventionRecommendations(
    courseId: string,
    timeframe: { start: Date; end: Date }
  ) {
    const atRiskStudents = await this.identifyAtRiskStudents(courseId, {
      minimumEngagement: 0.3,
      maxDaysSinceActivity: 7,
      minimumCompletionRate: 0.5
    });
    
    return atRiskStudents.map(student => ({
      studentId: student.studentId,
      urgency: student.riskLevel,
      reasons: student.reasons,
      suggestedActions: this.generateActionRecommendations(student)
    }));
  }
  
  private static generateActionRecommendations(student: any): string[] {
    const actions = [];
    
    if (student.completionRate < 0.5) {
      actions.push('Schedule one-on-one check-in meeting');
      actions.push('Review assignment requirements and deadlines');
    }
    
    if (student.reasons.some((r: string) => r.includes('Inactive'))) {
      actions.push('Send encouraging check-in message');
      actions.push('Offer flexible deadline if appropriate');
    }
    
    if (student.engagementScore < 0.3) {
      actions.push('Explore alternative assignment formats');
      actions.push('Connect with academic support services');
    }
    
    actions.push('Monitor progress weekly');
    
    return actions;
  }
  
  private static async analyzeWritingDevelopmentTrends(
    courseId: string,
    timeframe: { start: Date; end: Date }
  ) {
    const assignments = await Assignment.find({
      course: courseId,
      createdAt: { $gte: timeframe.start, $lte: timeframe.end }
    });
    
    const submissions = await AssignmentSubmission.find({
      assignment: { $in: assignments.map(a => a._id) }
    });
    
    // Calculate overall progress (simplified)
    const completedSubmissions = submissions.filter(s => s.status === 'submitted');
    const overallProgress = submissions.length > 0 
      ? completedSubmissions.length / submissions.length 
      : 0;
    
    // Analyze skill categories from learning objectives
    const skillCategories = new Set();
    const categoryProgress = new Map();
    
    for (const assignment of assignments) {
      if (assignment.learningObjectives) {
        assignment.learningObjectives.forEach((obj: any) => {
          skillCategories.add(obj.category);
          if (!categoryProgress.has(obj.category)) {
            categoryProgress.set(obj.category, []);
          }
        });
      }
    }
    
    // Generate trend analysis (simplified)
    const skillGrowthAreas = Array.from(skillCategories).slice(0, 3) as string[];
    const classStrengths = overallProgress > 0.7 
      ? ['Assignment completion', 'Student engagement'] 
      : ['Student participation'];
    const concernAreas = overallProgress < 0.5 
      ? ['Assignment completion rates', 'Student engagement']
      : [];
    
    return {
      overallProgress,
      skillGrowthAreas,
      classStrengths,
      concernAreas
    };
  }
  
  private static async calculateEngagementScore(
    studentId: string,
    courseId: string
  ): Promise<number> {
    const assignments = await Assignment.find({ course: courseId });
    const assignmentIds = assignments.map(a => a._id);
    
    const [submissions, writingSessions] = await Promise.all([
      AssignmentSubmission.find({
        student: studentId,
        assignment: { $in: assignmentIds }
      }),
      WritingSession.find({
        student: studentId,
        assignment: { $in: assignmentIds }
      })
    ]);
    
    // Calculate engagement based on multiple factors
    const submissionRate = assignments.length > 0 
      ? submissions.length / assignments.length 
      : 0;
    
    const averageSessionLength = writingSessions.length > 0
      ? writingSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / writingSessions.length
      : 0;
    
    const recentActivity = writingSessions.filter(s => {
      const daysSince = (Date.now() - s.startTime.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    }).length;
    
    // Weighted engagement score
    const engagementScore = (
      submissionRate * 0.5 +
      Math.min(averageSessionLength / 60, 1) * 0.3 + // Normalize to 0-1 based on 60 min sessions
      Math.min(recentActivity / 3, 1) * 0.2 // Normalize based on 3 recent sessions
    );
    
    return Math.max(0, Math.min(1, engagementScore));
  }
}