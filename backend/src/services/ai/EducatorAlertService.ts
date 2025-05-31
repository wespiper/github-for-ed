import prisma from '../../lib/prisma';
import { CognitiveLoadIndicators } from './CognitiveLoadDetector';
import { InterventionDecision } from './RealTimeInterventionEngine';
import { WritingProcessInsights } from './WritingProcessAnalyzer';
import { StudentLearningProfile } from './StudentLearningProfileService';
import { randomUUID } from 'crypto';

export interface EducatorAlert {
  id: string;
  type: AlertType;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  studentId: string;
  studentName: string;
  courseId?: string;
  assignmentId?: string;
  title: string;
  message: string;
  data: any;
  actionItems: ActionItem[];
  createdAt: Date;
  expiresAt?: Date;
  category: AlertCategory;
}

export type AlertType = 
  | 'cognitive_overload'
  | 'writing_struggle'
  | 'intervention_needed'
  | 'pattern_change'
  | 'milestone_reached'
  | 'collaboration_issue'
  | 'deadline_risk'
  | 'breakthrough_moment'
  | 'support_request';

export type AlertCategory = 
  | 'immediate_attention'
  | 'academic_support'
  | 'positive_reinforcement'
  | 'administrative'
  | 'insight';

export interface ActionItem {
  label: string;
  action: string;
  data?: any;
}

export interface AlertPreferences {
  educatorId: string;
  enabledTypes: AlertType[];
  priorityThreshold: 'low' | 'medium' | 'high' | 'urgent';
  quietHours?: {
    start: number; // Hour in 24h format
    end: number;
  };
  aggregationPreference: 'immediate' | 'batched' | 'summary';
  channels: Array<'in_app' | 'email' | 'sms'>;
}

export interface AlertBatch {
  educatorId: string;
  alerts: EducatorAlert[];
  summary: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export class EducatorAlertService {
  private static readonly DEFAULT_PREFERENCES: Partial<AlertPreferences> = {
    priorityThreshold: 'medium',
    aggregationPreference: 'batched',
    channels: ['in_app']
  };

  /**
   * Create alert for cognitive overload detection
   */
  static async createCognitiveOverloadAlert(
    studentId: string,
    assignmentId: string,
    cognitiveLoad: CognitiveLoadIndicators,
    intervention?: InterventionDecision
  ): Promise<EducatorAlert | null> {
    // Only alert for sustained overload
    if (cognitiveLoad.estimatedLoad !== 'overload' || cognitiveLoad.confidence < 0.8) {
      return null;
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { firstName: true, lastName: true }
    });

    if (!student) return null;

    const alert: EducatorAlert = {
      id: randomUUID(),
      type: 'cognitive_overload',
      priority: 'high',
      studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      assignmentId,
      title: 'Student Experiencing Cognitive Overload',
      message: `${student.firstName} is showing signs of cognitive overload with ${Math.round(cognitiveLoad.confidence * 100)}% confidence. Key indicators: ${cognitiveLoad.factors.slice(0, 2).join(', ')}.`,
      data: {
        cognitiveLoad,
        intervention,
        indicators: {
          deletionRatio: cognitiveLoad.deletionRatio,
          cursorThrashing: cognitiveLoad.cursorThrashing,
          timeOnTask: cognitiveLoad.timeOnTask
        }
      },
      actionItems: [
        {
          label: 'View Writing Session',
          action: 'view_session',
          data: { studentId, assignmentId }
        },
        {
          label: 'Send Encouragement',
          action: 'send_message',
          data: { studentId, type: 'encouragement' }
        },
        {
          label: 'Schedule Check-in',
          action: 'schedule_meeting',
          data: { studentId }
        }
      ],
      createdAt: new Date(),
      category: 'immediate_attention'
    };

    return alert;
  }

  /**
   * Create alert for writing struggle patterns
   */
  static async createWritingStruggleAlert(
    studentId: string,
    assignmentId: string,
    insights: WritingProcessInsights
  ): Promise<EducatorAlert | null> {
    // Check for significant struggle indicators
    const unresolvedStruggles = insights.strugglePoints.filter(sp => !sp.resolved);
    if (unresolvedStruggles.length < 2) return null;

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { firstName: true, lastName: true }
    });

    if (!student) return null;

    const totalStruggleTime = unresolvedStruggles.reduce((sum, sp) => sum + sp.duration, 0);

    const alert: EducatorAlert = {
      id: randomUUID(),
      type: 'writing_struggle',
      priority: totalStruggleTime > 60 ? 'high' : 'medium',
      studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      assignmentId,
      title: 'Persistent Writing Struggles Detected',
      message: `${student.firstName} has experienced ${unresolvedStruggles.length} unresolved struggle periods totaling ${Math.round(totalStruggleTime)} minutes. Pattern: ${insights.dominantPattern.type} writer.`,
      data: {
        insights,
        strugglePoints: unresolvedStruggles,
        recommendations: insights.processRecommendations
      },
      actionItems: [
        {
          label: 'View Process Analysis',
          action: 'view_analysis',
          data: { studentId, assignmentId }
        },
        {
          label: 'Provide Scaffolding',
          action: 'provide_support',
          data: { 
            studentId, 
            assignmentId,
            suggestedSupport: insights.interventionSuggestions[0]
          }
        }
      ],
      createdAt: new Date(),
      category: 'academic_support'
    };

    return alert;
  }

  /**
   * Create alert for positive breakthroughs
   */
  static async createBreakthroughAlert(
    studentId: string,
    assignmentId: string,
    profile: StudentLearningProfile,
    achievement: string
  ): Promise<EducatorAlert> {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { firstName: true, lastName: true }
    });

    const studentName = student ? `${student.firstName} ${student.lastName}` : 'Student';

    return {
      id: randomUUID(),
      type: 'breakthrough_moment',
      priority: 'low',
      studentId,
      studentName,
      assignmentId,
      title: 'Student Breakthrough Detected! 🎉',
      message: `${student?.firstName} has achieved ${achievement}. This represents significant progress from their typical pattern.`,
      data: {
        achievement,
        previousState: profile.currentState,
        strengths: profile.strengths
      },
      actionItems: [
        {
          label: 'Send Congratulations',
          action: 'send_message',
          data: { studentId, type: 'congratulations' }
        },
        {
          label: 'Note Achievement',
          action: 'add_note',
          data: { studentId, achievement }
        }
      ],
      createdAt: new Date(),
      category: 'positive_reinforcement'
    };
  }

  /**
   * Create alert for pattern changes
   */
  static async createPatternChangeAlert(
    studentId: string,
    courseId: string,
    oldPattern: string,
    newPattern: string,
    confidence: number
  ): Promise<EducatorAlert> {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { firstName: true, lastName: true }
    });

    const studentName = student ? `${student.firstName} ${student.lastName}` : 'Student';

    return {
      id: randomUUID(),
      type: 'pattern_change',
      priority: 'medium',
      studentId,
      studentName,
      courseId,
      title: 'Writing Pattern Evolution Detected',
      message: `${student?.firstName}'s writing pattern has shifted from ${oldPattern} to ${newPattern} (${Math.round(confidence * 100)}% confidence). This may indicate growth or a need for support.`,
      data: {
        oldPattern,
        newPattern,
        confidence,
        implications: this.getPatternChangeImplications(oldPattern, newPattern)
      },
      actionItems: [
        {
          label: 'Review Pattern History',
          action: 'view_patterns',
          data: { studentId, courseId }
        },
        {
          label: 'Adjust Support Strategy',
          action: 'update_support',
          data: { studentId, newPattern }
        }
      ],
      createdAt: new Date(),
      category: 'insight'
    };
  }

  /**
   * Create alert for deadline risks
   */
  static async createDeadlineRiskAlert(
    studentId: string,
    assignmentId: string,
    assignmentTitle: string,
    hoursUntilDue: number,
    completionPercentage: number
  ): Promise<EducatorAlert> {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { firstName: true, lastName: true }
    });

    const studentName = student ? `${student.firstName} ${student.lastName}` : 'Student';

    const priority: EducatorAlert['priority'] = 
      hoursUntilDue < 24 ? 'urgent' :
      hoursUntilDue < 48 ? 'high' : 'medium';

    return {
      id: randomUUID(),
      type: 'deadline_risk',
      priority,
      studentId,
      studentName,
      assignmentId,
      title: 'Assignment Deadline Risk',
      message: `${student?.firstName} has only completed ${completionPercentage}% of "${assignmentTitle}" with ${Math.round(hoursUntilDue)} hours until deadline.`,
      data: {
        assignmentTitle,
        hoursUntilDue,
        completionPercentage,
        estimatedTimeNeeded: this.estimateTimeNeeded(completionPercentage)
      },
      actionItems: [
        {
          label: 'Contact Student',
          action: 'send_message',
          data: { studentId, urgency: 'high' }
        },
        {
          label: 'Consider Extension',
          action: 'manage_deadline',
          data: { assignmentId, studentId }
        },
        {
          label: 'Provide Emergency Support',
          action: 'emergency_support',
          data: { studentId, assignmentId }
        }
      ],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + hoursUntilDue * 60 * 60 * 1000),
      category: 'immediate_attention'
    };
  }

  /**
   * Get educator preferences
   */
  static async getEducatorPreferences(educatorId: string): Promise<AlertPreferences> {
    // In a real implementation, this would fetch from a preferences table
    // For now, return defaults with all alert types enabled
    return {
      educatorId,
      enabledTypes: [
        'cognitive_overload',
        'writing_struggle',
        'intervention_needed',
        'pattern_change',
        'milestone_reached',
        'collaboration_issue',
        'deadline_risk',
        'breakthrough_moment',
        'support_request'
      ],
      ...this.DEFAULT_PREFERENCES
    } as AlertPreferences;
  }

  /**
   * Send alert to educator
   */
  static async sendAlert(
    alert: EducatorAlert,
    educatorId: string
  ): Promise<void> {
    const preferences = await this.getEducatorPreferences(educatorId);

    // Check if alert type is enabled
    if (!preferences.enabledTypes.includes(alert.type)) {
      return;
    }

    // Check priority threshold
    if (!this.meetsThreshold(alert.priority, preferences.priorityThreshold)) {
      return;
    }

    // Check quiet hours
    if (this.isQuietHours(preferences.quietHours)) {
      await this.queueForLater(alert, educatorId);
      return;
    }

    // Handle based on aggregation preference
    switch (preferences.aggregationPreference) {
      case 'immediate':
        await this.sendImmediate(alert, educatorId, preferences.channels);
        break;
      case 'batched':
        await this.addToBatch(alert, educatorId);
        break;
      case 'summary':
        await this.addToSummary(alert, educatorId);
        break;
    }
  }

  /**
   * Send batched alerts
   */
  static async sendBatchedAlerts(educatorId: string): Promise<void> {
    const batch = await this.getBatchedAlerts(educatorId);
    if (batch.alerts.length === 0) return;

    await this.getEducatorPreferences(educatorId);
    
    // Create summary notification
    const summary = this.createBatchSummary(batch);
    
    await prisma.notification.create({
      data: {
        id: randomUUID(),
        recipientId: educatorId,
        type: 'alert_batch',
        priority: batch.priority,
        title: `${batch.alerts.length} Student Alerts`,
        message: summary,
        category: 'educational_alert',
        context: {
          alertCount: batch.alerts.length,
          alertTypes: batch.alerts.map(a => a.type),
          batchId: batch.educatorId
        },
        status: 'unread'
      }
    });

    // Clear the batch
    await this.clearBatch(educatorId);
  }

  /**
   * Get alerts for educator dashboard
   */
  static async getEducatorAlerts(
    educatorId: string,
    filters?: {
      types?: AlertType[];
      priority?: EducatorAlert['priority'];
      studentId?: string;
      courseId?: string;
      category?: AlertCategory;
      timeframe?: number; // hours
    }
  ): Promise<EducatorAlert[]> {
    // Get educator's courses and students
    await prisma.course.findMany({
      where: { instructorId: educatorId },
      include: {
        enrollments: {
          include: {
            student: true
          }
        }
      }
    });

    // Student IDs would be used to filter alerts
    // const studentIds = courses.flatMap(course => 
    //   course.enrollments.map(e => e.studentId)
    // );

    // In a real implementation, alerts would be stored in database
    // For now, return mock data based on recent activity
    const alerts: EducatorAlert[] = [];

    // This would actually query stored alerts
    return alerts.filter(alert => {
      if (filters?.types && !filters.types.includes(alert.type)) return false;
      if (filters?.priority && alert.priority !== filters.priority) return false;
      if (filters?.studentId && alert.studentId !== filters.studentId) return false;
      if (filters?.courseId && alert.courseId !== filters.courseId) return false;
      if (filters?.category && alert.category !== filters.category) return false;
      if (filters?.timeframe) {
        const cutoff = new Date(Date.now() - filters.timeframe * 60 * 60 * 1000);
        if (alert.createdAt < cutoff) return false;
      }
      return true;
    });
  }

  /**
   * Create intervention needed alert
   */
  static async createInterventionNeededAlert(
    studentId: string,
    assignmentId: string,
    interventionDecision: InterventionDecision,
    profile: StudentLearningProfile
  ): Promise<EducatorAlert | null> {
    if (!interventionDecision.shouldIntervene) return null;

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { firstName: true, lastName: true }
    });

    if (!student) return null;

    const alert: EducatorAlert = {
      id: randomUUID(),
      type: 'intervention_needed',
      priority: interventionDecision.intervention?.priority || 'medium',
      studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      assignmentId,
      title: 'Student Needs Intervention',
      message: `${student.firstName} requires intervention: ${interventionDecision.reason}. Current state: ${profile.currentState.emotionalState}.`,
      data: {
        intervention: interventionDecision.intervention,
        profile: profile.currentState,
        reason: interventionDecision.reason
      },
      actionItems: [
        {
          label: 'Review Intervention',
          action: 'review_intervention',
          data: { 
            studentId, 
            interventionId: interventionDecision.intervention?.id 
          }
        },
        {
          label: 'Override Automated Support',
          action: 'manual_intervention',
          data: { studentId, assignmentId }
        }
      ],
      createdAt: new Date(),
      category: 'academic_support'
    };

    return alert;
  }

  /**
   * Helper methods
   */
  private static getPatternChangeImplications(oldPattern: string, newPattern: string): string[] {
    const implications: string[] = [];

    // Positive changes
    if (oldPattern === 'perfectionist' && newPattern === 'linear') {
      implications.push('Student may be developing healthier writing habits');
      implications.push('Less revision paralysis observed');
    }
    
    if (oldPattern === 'exploratory' && newPattern === 'linear') {
      implications.push('Student showing more focused approach');
      implications.push('May indicate improved planning skills');
    }

    // Concerning changes
    if (oldPattern === 'linear' && newPattern === 'perfectionist') {
      implications.push('Student may be experiencing increased anxiety');
      implications.push('Consider stress management support');
    }

    if (newPattern === 'recursive' && oldPattern !== 'recursive') {
      implications.push('Increased revision activity detected');
      implications.push('May benefit from structured revision strategies');
    }

    return implications;
  }

  private static estimateTimeNeeded(completionPercentage: number): number {
    // Rough estimate based on completion
    const remainingWork = 100 - completionPercentage;
    return Math.ceil(remainingWork / 20); // Assume 20% per hour
  }

  private static meetsThreshold(
    alertPriority: EducatorAlert['priority'],
    threshold: EducatorAlert['priority']
  ): boolean {
    const priorities = ['low', 'medium', 'high', 'urgent'];
    return priorities.indexOf(alertPriority) >= priorities.indexOf(threshold);
  }

  private static isQuietHours(quietHours?: { start: number; end: number }): boolean {
    if (!quietHours) return false;
    
    const now = new Date();
    const currentHour = now.getHours();
    
    if (quietHours.start <= quietHours.end) {
      return currentHour >= quietHours.start && currentHour < quietHours.end;
    } else {
      // Handles overnight quiet hours (e.g., 22:00 - 08:00)
      return currentHour >= quietHours.start || currentHour < quietHours.end;
    }
  }

  private static async queueForLater(_alert: EducatorAlert, educatorId: string): Promise<void> {
    // In real implementation, store in queue for later delivery
    console.log(`Queuing alert for ${educatorId} until quiet hours end`);
  }

  private static async sendImmediate(
    alert: EducatorAlert,
    educatorId: string,
    channels: Array<'in_app' | 'email' | 'sms'>
  ): Promise<void> {
    if (channels.includes('in_app')) {
      await prisma.notification.create({
        data: {
          id: randomUUID(),
          recipientId: educatorId,
          type: alert.type,
          priority: alert.priority,
          title: alert.title,
          message: alert.message,
          category: 'educational_alert',
          context: alert.data,
          status: 'unread'
        }
      });
    }

    // Email and SMS would be handled by external services
    if (channels.includes('email')) {
      // await emailService.send(...)
    }
    
    if (channels.includes('sms')) {
      // await smsService.send(...)
    }
  }

  private static async addToBatch(_alert: EducatorAlert, educatorId: string): Promise<void> {
    // In real implementation, store in batch storage
    // For now, we'll use in-memory storage (not production-ready)
    console.log(`Adding alert to batch for ${educatorId}`);
  }

  private static async addToSummary(_alert: EducatorAlert, educatorId: string): Promise<void> {
    // In real implementation, store for daily/weekly summary
    console.log(`Adding alert to summary for ${educatorId}`);
  }

  private static async getBatchedAlerts(educatorId: string): Promise<AlertBatch> {
    // In real implementation, fetch from batch storage
    return {
      educatorId,
      alerts: [],
      summary: '',
      priority: 'medium'
    };
  }

  private static createBatchSummary(batch: AlertBatch): string {
    const typeCount = new Map<AlertType, number>();
    batch.alerts.forEach(alert => {
      typeCount.set(alert.type, (typeCount.get(alert.type) || 0) + 1);
    });

    const summaryParts: string[] = [];
    typeCount.forEach((count, type) => {
      summaryParts.push(`${count} ${type.replace('_', ' ')} alert${count > 1 ? 's' : ''}`);
    });

    return `You have ${summaryParts.join(', ')}. ${batch.alerts.filter(a => a.priority === 'urgent').length} require immediate attention.`;
  }

  private static async clearBatch(educatorId: string): Promise<void> {
    // In real implementation, clear batch storage
    console.log(`Clearing batch for ${educatorId}`);
  }

  /**
   * Create support request alert when student explicitly asks for help
   */
  static async createSupportRequestAlert(
    studentId: string,
    assignmentId: string,
    requestType: string,
    message: string
  ): Promise<EducatorAlert> {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { firstName: true, lastName: true }
    });

    const studentName = student ? `${student.firstName} ${student.lastName}` : 'Student';

    return {
      id: randomUUID(),
      type: 'support_request',
      priority: 'high',
      studentId,
      studentName,
      assignmentId,
      title: 'Student Support Request',
      message: `${student?.firstName} has requested help: "${message}"`,
      data: {
        requestType,
        originalMessage: message,
        timestamp: new Date()
      },
      actionItems: [
        {
          label: 'Respond to Student',
          action: 'send_message',
          data: { studentId, inReplyTo: message }
        },
        {
          label: 'Schedule Meeting',
          action: 'schedule_meeting',
          data: { studentId, topic: requestType }
        },
        {
          label: 'View Assignment Progress',
          action: 'view_progress',
          data: { studentId, assignmentId }
        }
      ],
      createdAt: new Date(),
      category: 'immediate_attention'
    };
  }
}