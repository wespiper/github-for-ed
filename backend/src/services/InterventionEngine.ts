import { Types } from 'mongoose';
import { Notification, INotification } from '../models/Notification';
import { WritingSession } from '../models/WritingSession';
import { AssignmentSubmission } from '../models/AssignmentSubmission';
import { Assignment } from '../models/Assignment';
import { User } from '../models/User';

export interface InterventionAlert {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  suggestedActions: string[];
  studentId: string;
  context?: {
    course?: string;
    assignment?: string;
    submission?: string;
  };
  deadline?: Date;
  metrics?: {
    currentValue: number;
    previousValue?: number;
    threshold?: number;
    trend: 'improving' | 'declining' | 'stable';
  };
}

export class InterventionEngine {
  
  /**
   * Comprehensive writing progress analysis for a student
   */
  async analyzeStudentWritingProgress(userId: string, courseId?: string, timeframeDays: number = 7): Promise<InterventionAlert[]> {
    const interventions: InterventionAlert[] = [];
    const startDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000);
    
    // Get writing sessions
    const sessions = await WritingSession.find({
      user: userId,
      startTime: { $gte: startDate }
    }).populate('document', 'course assignment');
    
    // Filter by course if specified
    const filteredSessions = courseId 
      ? sessions.filter((session: any) => session.document?.course?.toString() === courseId)
      : sessions;
    
    // Get assignment submissions
    const submissions = await AssignmentSubmission.find({
      $or: [
        { author: userId },
        { collaborators: userId }
      ],
      lastSavedAt: { $gte: startDate }
    }).populate('assignment', 'course dueDate title');
    
    // 1. Writing Productivity Analysis
    const productivityIntervention = await this.analyzeWritingProductivity(userId, filteredSessions, timeframeDays);
    if (productivityIntervention) interventions.push(productivityIntervention);
    
    // 2. Assignment Procrastination Detection
    const procrastinationIntervention = await this.detectAssignmentProcrastination(userId, submissions);
    if (procrastinationIntervention) interventions.push(procrastinationIntervention);
    
    // 3. Collaboration Pattern Analysis
    const collaborationInterventions = await this.analyzeCollaborationPatterns(userId, submissions);
    interventions.push(...collaborationInterventions);
    
    // 4. Writing Quality Concerns
    const qualityIntervention = await this.analyzeWritingQuality(userId, filteredSessions);
    if (qualityIntervention) interventions.push(qualityIntervention);
    
    // 5. Time Management Issues
    const timeManagementIntervention = await this.analyzeTimeManagement(userId, submissions);
    if (timeManagementIntervention) interventions.push(timeManagementIntervention);
    
    return interventions;
  }
  
  /**
   * Analyze writing productivity trends
   */
  private async analyzeWritingProductivity(userId: string, sessions: any[], timeframeDays: number): Promise<InterventionAlert | null> {
    if (sessions.length === 0) {
      return {
        type: 'no_recent_activity',
        severity: 'warning',
        title: 'No Recent Writing Activity',
        message: `Student has not engaged in any writing activities for ${timeframeDays} days.`,
        suggestedActions: [
          'Schedule one-on-one check-in meeting',
          'Send encouraging message with assignment reminders',
          'Provide writing support resources',
          'Consider extending deadlines if appropriate'
        ],
        studentId: userId,
        metrics: {
          currentValue: 0,
          previousValue: undefined,
          threshold: 1,
          trend: 'declining'
        }
      };
    }
    
    // Calculate current productivity metrics
    const totalWordsWritten = sessions.reduce((sum, session) => sum + session.activity.wordsAdded, 0);
    const totalWritingTime = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    const averageWordsPerSession = totalWordsWritten / sessions.length;
    
    // Get historical data for comparison
    const historicalStartDate = new Date(Date.now() - (timeframeDays * 2) * 24 * 60 * 60 * 1000);
    const historicalEndDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000);
    
    const historicalSessions = await WritingSession.find({
      user: userId,
      startTime: { $gte: historicalStartDate, $lt: historicalEndDate }
    });
    
    if (historicalSessions.length > 0) {
      const historicalWordsWritten = historicalSessions.reduce((sum, session) => sum + session.activity.wordsAdded, 0);
      const productivityChange = ((totalWordsWritten - historicalWordsWritten) / historicalWordsWritten) * 100;
      
      // Detect significant productivity decline
      if (productivityChange < -40 && totalWordsWritten < 200) {
        return {
          type: 'writing_productivity_decline',
          severity: 'warning',
          title: 'Writing Productivity Declining',
          message: `Student's writing output has decreased by ${Math.abs(Math.round(productivityChange))}% compared to the previous ${timeframeDays} days.`,
          suggestedActions: [
            'Schedule writing conference to understand barriers',
            'Break assignments into smaller, manageable chunks',
            'Provide writing process scaffolding',
            'Recommend time management strategies'
          ],
          studentId: userId,
          metrics: {
            currentValue: totalWordsWritten,
            previousValue: historicalWordsWritten,
            threshold: historicalWordsWritten * 0.6, // 40% decline threshold
            trend: 'declining'
          }
        };
      }
    }
    
    // Check for extremely low word count relative to time spent
    if (totalWritingTime > 120 && averageWordsPerSession < 20) { // 2+ hours, <20 words per session
      return {
        type: 'word_count_below_expected',
        severity: 'warning',
        title: 'Low Writing Output Despite Time Investment',
        message: `Student is spending significant time writing (${Math.round(totalWritingTime / 60)} hours) but producing few words (${Math.round(averageWordsPerSession)} per session).`,
        suggestedActions: [
          'Investigate potential writing blocks or anxiety',
          'Provide pre-writing strategies and outlining tools',
          'Consider alternative assignment formats',
          'Offer writing center resources'
        ],
        studentId: userId,
        metrics: {
          currentValue: averageWordsPerSession,
          threshold: 50,
          trend: 'stable'
        }
      };
    }
    
    return null;
  }
  
  /**
   * Detect assignment procrastination patterns
   */
  private async detectAssignmentProcrastination(userId: string, submissions: any[]): Promise<InterventionAlert | null> {
    if (submissions.length === 0) return null;
    
    const procrastinationPattern = submissions.filter(submission => {
      const assignment = submission.assignment;
      if (!assignment?.dueDate) return false;
      
      const dueDate = new Date(assignment.dueDate);
      const firstEditDate = new Date(submission.createdAt);
      const timeUntilDue = dueDate.getTime() - firstEditDate.getTime();
      const hoursUntilDue = timeUntilDue / (1000 * 60 * 60);
      
      // Started within 24 hours of deadline
      return hoursUntilDue <= 24;
    });
    
    const procrastinationRate = procrastinationPattern.length / submissions.length;
    
    if (procrastinationRate >= 0.6 && submissions.length >= 2) { // 60%+ procrastination rate
      return {
        type: 'assignment_procrastination',
        severity: 'critical',
        title: 'Consistent Assignment Procrastination',
        message: `Student consistently starts assignments within 24 hours of the deadline (${procrastinationPattern.length} out of ${submissions.length} assignments).`,
        suggestedActions: [
          'Implement milestone check-ins and interim deadlines',
          'Teach time management and planning strategies',
          'Create assignment timeline templates',
          'Set up automated progress reminders',
          'Consider anxiety assessment if pattern persists'
        ],
        studentId: userId,
        metrics: {
          currentValue: procrastinationRate * 100,
          threshold: 40,
          trend: procrastinationRate > 0.8 ? 'declining' : 'stable'
        }
      };
    }
    
    return null;
  }
  
  /**
   * Analyze collaboration patterns and health
   */
  private async analyzeCollaborationPatterns(userId: string, submissions: any[]): Promise<InterventionAlert[]> {
    const interventions: InterventionAlert[] = [];
    
    const collaborativeSubmissions = submissions.filter(sub => sub.collaboration.isCollaborative);
    
    if (collaborativeSubmissions.length === 0) return interventions;
    
    // Analyze contribution imbalance
    for (const submission of collaborativeSubmissions) {
      const userStats = submission.analytics.collaborationMetrics.contributorStats.find(
        (stat: any) => stat.user.toString() === userId
      );
      
      if (!userStats) continue;
      
      const allStats = submission.analytics.collaborationMetrics.contributorStats;
      const totalWords = allStats.reduce((sum: number, stat: any) => sum + stat.wordsContributed, 0);
      const userContributionPercentage = (userStats.wordsContributed / totalWords) * 100;
      const expectedContribution = 100 / allStats.length; // Equal contribution expected
      
      // Check for significant under-contribution
      if (userContributionPercentage < expectedContribution * 0.5) { // Less than half expected
        interventions.push({
          type: 'low_collaboration_participation',
          severity: 'warning',
          title: 'Low Collaboration Participation',
          message: `Student contributed only ${Math.round(userContributionPercentage)}% to collaborative assignment "${submission.assignment.title}" (expected ~${Math.round(expectedContribution)}%).`,
          suggestedActions: [
            'Facilitate team meeting to discuss role distribution',
            'Provide collaboration guidelines and expectations',
            'Assign specific responsibilities to each team member',
            'Check for interpersonal conflicts or technical barriers'
          ],
          studentId: userId,
          context: {
            assignment: submission.assignment._id,
            submission: submission._id
          },
          metrics: {
            currentValue: userContributionPercentage,
            threshold: expectedContribution * 0.7,
            trend: 'declining'
          }
        });
      }
      
      // Check for over-contribution (potential group dynamic issue)
      if (userContributionPercentage > expectedContribution * 1.8) { // More than 80% above expected
        interventions.push({
          type: 'collaboration_imbalance',
          severity: 'info',
          title: 'Collaboration Imbalance Detected',
          message: `Student contributed ${Math.round(userContributionPercentage)}% to collaborative assignment, significantly more than teammates.`,
          suggestedActions: [
            'Monitor for potential burnout or team conflicts',
            'Encourage more equitable task distribution',
            'Provide team communication strategies',
            'Consider individual recognition for extra effort'
          ],
          studentId: userId,
          context: {
            assignment: submission.assignment._id,
            submission: submission._id
          },
          metrics: {
            currentValue: userContributionPercentage,
            threshold: expectedContribution * 1.5,
            trend: 'stable'
          }
        });
      }
    }
    
    return interventions;
  }
  
  /**
   * Analyze writing quality indicators
   */
  private async analyzeWritingQuality(userId: string, sessions: any[]): Promise<InterventionAlert | null> {
    if (sessions.length === 0) return null;
    
    // Calculate deletion-to-addition ratio
    const totalWordsAdded = sessions.reduce((sum, session) => sum + session.activity.wordsAdded, 0);
    const totalWordsDeleted = sessions.reduce((sum, session) => sum + session.activity.wordsDeleted, 0);
    
    if (totalWordsAdded === 0) return null;
    
    const deletionRatio = totalWordsDeleted / totalWordsAdded;
    
    // High deletion ratio might indicate struggle with writing quality or confidence
    if (deletionRatio > 0.8 && totalWordsDeleted > 100) {
      return {
        type: 'frequent_deletions',
        severity: 'info',
        title: 'High Revision Activity Detected',
        message: `Student is deleting ${Math.round(deletionRatio * 100)}% of written content, suggesting potential writing confidence or quality concerns.`,
        suggestedActions: [
          'Encourage freewriting and first-draft completion',
          'Provide revision strategies focused on content before editing',
          'Offer writing confidence building exercises',
          'Suggest outlining before drafting to reduce uncertainty'
        ],
        studentId: userId,
        metrics: {
          currentValue: deletionRatio * 100,
          threshold: 50,
          trend: 'stable'
        }
      };
    }
    
    return null;
  }
  
  /**
   * Analyze time management patterns
   */
  private async analyzeTimeManagement(userId: string, submissions: any[]): Promise<InterventionAlert | null> {
    if (submissions.length === 0) return null;
    
    const upcomingDeadlines = submissions
      .filter(sub => {
        const dueDate = new Date(sub.assignment.dueDate);
        const now = new Date();
        const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysUntilDue <= 3 && daysUntilDue > 0; // Due within 3 days
      })
      .filter(sub => sub.wordCount < 100); // Minimal progress
    
    if (upcomingDeadlines.length >= 2) {
      return {
        type: 'time_management_issue',
        severity: 'critical',
        title: 'Multiple Deadlines Approaching with Minimal Progress',
        message: `Student has ${upcomingDeadlines.length} assignments due within 3 days with minimal progress (< 100 words each).`,
        suggestedActions: [
          'Schedule urgent academic support meeting',
          'Help prioritize assignments by importance and time required',
          'Consider deadline extensions if appropriate',
          'Provide crisis time management strategies',
          'Connect with academic advisor or counseling services'
        ],
        studentId: userId,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours to respond
        metrics: {
          currentValue: upcomingDeadlines.length,
          threshold: 1,
          trend: 'declining'
        }
      };
    }
    
    return null;
  }
  
  /**
   * Create notification from intervention alert
   */
  async createInterventionNotification(alert: InterventionAlert, instructorId: string): Promise<INotification> {
    // Determine appropriate deadline for intervention
    let deadline = alert.deadline;
    if (!deadline) {
      const urgencyHours = alert.severity === 'critical' ? 24 : alert.severity === 'warning' ? 72 : 168; // 24h, 3d, or 1w
      deadline = new Date(Date.now() + urgencyHours * 60 * 60 * 1000);
    }
    
    const notification = new Notification({
      recipient: instructorId,
      type: alert.type as any,
      priority: alert.severity === 'critical' ? 'urgent' : alert.severity === 'warning' ? 'high' : 'medium',
      title: alert.title,
      message: alert.message,
      category: 'educational_intervention',
      context: alert.context,
      intervention: {
        type: alert.type as any,
        severity: alert.severity,
        suggestedActions: alert.suggestedActions,
        deadline
      },
      relatedMetrics: alert.metrics ? {
        student: new Types.ObjectId(alert.studentId),
        metricType: 'writing_progress',
        ...alert.metrics
      } : undefined,
      actionRequired: true,
      actionUrl: `/students/${alert.studentId}/intervention`
    });
    
    await notification.save();
    return notification;
  }
  
  /**
   * Run intervention analysis for all students in a course
   */
  async runCourseInterventionAnalysis(courseId: string): Promise<InterventionAlert[]> {
    // Get all students in the course
    const course = await Assignment.findOne({ course: courseId }).populate({
      path: 'course',
      populate: { path: 'students' }
    });
    
    if (!course) return [];
    
    const students = (course as any).course.students;
    const allInterventions: InterventionAlert[] = [];
    
    // Analyze each student
    for (const student of students) {
      try {
        const interventions = await this.analyzeStudentWritingProgress(student._id.toString(), courseId);
        allInterventions.push(...interventions);
      } catch (error) {
        console.error(`Error analyzing student ${student._id}:`, error);
      }
    }
    
    return allInterventions;
  }
  
  /**
   * Get intervention summary for educator dashboard
   */
  async getInterventionSummary(instructorId: string, courseId?: string): Promise<{
    totalInterventions: number;
    criticalInterventions: number;
    commonIssues: { type: string; count: number }[];
    studentsAtRisk: number;
    recentTrends: { improving: number; declining: number; stable: number };
  }> {
    const query: any = {
      recipient: instructorId,
      category: 'educational_intervention',
      'intervention.resolvedAt': { $exists: false }
    };
    
    if (courseId) {
      query['context.course'] = courseId;
    }
    
    const interventions = await Notification.find(query);
    
    const criticalInterventions = interventions.filter(n => n.intervention?.severity === 'critical').length;
    
    // Count common issues
    const issueTypes = interventions.reduce((acc: any, notification) => {
      const type = notification.intervention?.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    const commonIssues = Object.entries(issueTypes)
      .map(([type, count]) => ({ type, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Count unique students at risk
    const studentsAtRisk = new Set(
      interventions
        .map(n => n.relatedMetrics?.student?.toString())
        .filter(Boolean)
    ).size;
    
    // Analyze trends
    const trends = interventions.reduce((acc: any, notification) => {
      const trend = notification.relatedMetrics?.trend;
      if (trend) {
        acc[trend] = (acc[trend] || 0) + 1;
      }
      return acc;
    }, {});
    
    return {
      totalInterventions: interventions.length,
      criticalInterventions,
      commonIssues,
      studentsAtRisk,
      recentTrends: {
        improving: trends.improving || 0,
        declining: trends.declining || 0,
        stable: trends.stable || 0
      }
    };
  }
}