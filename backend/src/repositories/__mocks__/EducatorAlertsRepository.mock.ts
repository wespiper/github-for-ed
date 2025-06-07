/**
 * Mock Educator Alerts Repository Implementation
 * For testing privacy-aware educator alert and intervention operations
 */

import { 
  EducatorAlertsRepository,
  EducatorAlert,
  RecommendedAction,
  InterventionRecommendation,
  SuggestedAction,
  InterventionSchedule,
  InterventionEffectiveness,
  EducatorPreferences,
  AlertAnalytics,
  AlertFilters
} from '../interfaces/EducatorAlertsRepository';
import { PrivacyContext, AuditEntry, AnonymizedData, AnalyticsCriteria } from '../../types/privacy';
import { FindManyOptions, CreateData, UpdateData } from '../interfaces/BaseRepository';

export class MockEducatorAlertsRepository implements EducatorAlertsRepository {
  private alerts: Map<string, EducatorAlert> = new Map();
  private recommendations: Map<string, InterventionRecommendation> = new Map();
  private schedules: Map<string, InterventionSchedule> = new Map();
  private effectiveness: Map<string, InterventionEffectiveness> = new Map();
  private preferences: Map<string, EducatorPreferences> = new Map();
  private auditTrail: AuditEntry[] = [];
  private privacyLogs: Array<{ operation: string; context: PrivacyContext; timestamp: Date }> = [];

  constructor() {
    this.seedTestData();
  }

  // Base Repository Methods
  async findById(id: string): Promise<EducatorAlert | null> {
    return this.alerts.get(id) || null;
  }

  async findMany(options?: FindManyOptions<EducatorAlert>): Promise<EducatorAlert[]> {
    return Array.from(this.alerts.values());
  }

  async create(data: CreateData<EducatorAlert>): Promise<EducatorAlert> {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const alert: EducatorAlert = {
      id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.alerts.set(id, alert);
    return alert;
  }

  async update(id: string, data: UpdateData<EducatorAlert>): Promise<EducatorAlert> {
    const existing = this.alerts.get(id);
    if (!existing) {
      throw new Error(`Alert with id ${id} not found`);
    }

    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date()
    };

    this.alerts.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.alerts.delete(id);
  }

  async count(options?: any): Promise<number> {
    return this.alerts.size;
  }

  // Privacy-Aware Educator Alerts Methods
  async generateInterventionRecommendations(
    studentId: string,
    analysisData: Record<string, any>,
    educationalContext: {
      assignmentId?: string;
      courseId?: string;
      learningObjectives?: string[];
    },
    privacyContext: PrivacyContext
  ): Promise<InterventionRecommendation[]> {
    this.logPrivacyOperation('generateInterventionRecommendations', privacyContext);
    this.logAudit('generateInterventionRecommendations', studentId, privacyContext);

    // Generate mock recommendations based on analysis data
    const recommendations: InterventionRecommendation[] = [];
    
    // Check for cognitive load issues
    if (analysisData.cognitiveLoad > 0.8) {
      recommendations.push(this.createMockRecommendation(
        studentId,
        'cognitive_support',
        'High cognitive load detected - recommend breaking tasks into smaller chunks',
        0.85,
        educationalContext
      ));
    }

    // Check for engagement issues
    if (analysisData.engagementScore < 0.4) {
      recommendations.push(this.createMockRecommendation(
        studentId,
        'engagement_boost',
        'Low engagement - recommend interactive elements and choice in assignments',
        0.75,
        educationalContext
      ));
    }

    // Check for quality concerns
    if (analysisData.qualityScore < 0.5) {
      recommendations.push(this.createMockRecommendation(
        studentId,
        'quality_improvement',
        'Writing quality below expectations - recommend targeted feedback and examples',
        0.8,
        educationalContext
      ));
    }

    // Store recommendations
    recommendations.forEach(rec => {
      this.recommendations.set(rec.id, rec);
    });

    return recommendations;
  }

  async sendEducatorAlerts(
    alerts: Omit<EducatorAlert, 'id' | 'createdAt' | 'updatedAt'>[],
    deliveryOptions: {
      immediate?: boolean;
      channels?: ('in_app' | 'email' | 'sms')[];
      batchWithOthers?: boolean;
    },
    privacyContext: PrivacyContext
  ): Promise<{
    sent: EducatorAlert[];
    failed: { alert: Omit<EducatorAlert, 'id' | 'createdAt' | 'updatedAt'>; reason: string }[];
    queued: EducatorAlert[];
  }> {
    this.logPrivacyOperation('sendEducatorAlerts', privacyContext);

    const sent: EducatorAlert[] = [];
    const failed: { alert: Omit<EducatorAlert, 'id' | 'createdAt' | 'updatedAt'>; reason: string }[] = [];
    const queued: EducatorAlert[] = [];

    for (const alertData of alerts) {
      try {
        // Check educator preferences
        const prefs = await this.getEducatorPreferences(alertData.educatorId, privacyContext);
        
        if (prefs && !this.shouldSendAlert(alertData, prefs)) {
          const queuedAlert = await this.create(alertData);
          queued.push(queuedAlert);
          continue;
        }

        // Create and send alert
        const alert = await this.create(alertData);
        this.logAudit('sendEducatorAlert', alert.id, privacyContext);
        
        // Mock sending logic - in real implementation would integrate with notification services
        if (deliveryOptions.immediate) {
          sent.push(alert);
        } else {
          queued.push(alert);
        }
      } catch (error) {
        failed.push({ 
          alert: alertData, 
          reason: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return { sent, failed, queued };
  }

  async scheduleInterventionActions(
    interventionId: string,
    scheduleData: Omit<InterventionSchedule, 'id' | 'createdAt' | 'updatedAt'>,
    reminderSettings: {
      sendReminders: boolean;
      reminderTimes: string[];
      includePreparation?: boolean;
    },
    privacyContext: PrivacyContext
  ): Promise<InterventionSchedule> {
    this.logPrivacyOperation('scheduleInterventionActions', privacyContext);
    this.logAudit('scheduleInterventionActions', interventionId, privacyContext);

    const id = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const schedule: InterventionSchedule = {
      id,
      ...scheduleData,
      interventionId, // Override the interventionId from scheduleData with the parameter
      remindersSent: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.schedules.set(id, schedule);
    
    // Mock reminder scheduling
    if (reminderSettings.sendReminders) {
      schedule.remindersSent = reminderSettings.reminderTimes.map(() => new Date());
    }

    return schedule;
  }

  async trackInterventionEffectiveness(
    interventionId: string,
    measurementData: Omit<InterventionEffectiveness, 'id' | 'measurementDate'>,
    comparisonPeriod: {
      baseline: { start: Date; end: Date };
      measurement: { start: Date; end: Date };
    },
    privacyContext: PrivacyContext
  ): Promise<InterventionEffectiveness> {
    this.logPrivacyOperation('trackInterventionEffectiveness', privacyContext);
    this.logAudit('trackInterventionEffectiveness', interventionId, privacyContext);

    const id = `effectiveness_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const effectiveness: InterventionEffectiveness = {
      id,
      ...measurementData,
      interventionId, // Override the interventionId from measurementData with the parameter
      measurementDate: new Date(),
      // Calculate mock improvement score based on baseline vs measurement
      improvementScore: this.calculateMockImprovement(measurementData.baselineData, measurementData.postInterventionData)
    };

    this.effectiveness.set(id, effectiveness);
    return effectiveness;
  }

  async findByEducator(
    educatorId: string,
    filters: AlertFilters,
    privacyContext: PrivacyContext
  ): Promise<EducatorAlert[]> {
    this.logPrivacyOperation('findByEducator', privacyContext);

    return Array.from(this.alerts.values())
      .filter(alert => alert.educatorId === educatorId)
      .filter(alert => this.applyFilters(alert, filters))
      .filter(alert => this.respectsPrivacyContext(alert, privacyContext));
  }

  async findByStudent(
    studentId: string,
    filters: AlertFilters,
    privacyContext: PrivacyContext
  ): Promise<EducatorAlert[]> {
    this.logPrivacyOperation('findByStudent', privacyContext);

    // Ensure educator has permission to view student alerts
    if (privacyContext.requesterType !== 'educator' && privacyContext.requesterType !== 'admin') {
      throw new Error('Insufficient permissions to view student alerts');
    }

    return Array.from(this.alerts.values())
      .filter(alert => alert.studentId === studentId)
      .filter(alert => this.applyFilters(alert, filters))
      .filter(alert => this.respectsPrivacyContext(alert, privacyContext));
  }

  async getUrgentAlerts(
    educatorId: string,
    privacyContext: PrivacyContext
  ): Promise<EducatorAlert[]> {
    this.logPrivacyOperation('getUrgentAlerts', privacyContext);

    return Array.from(this.alerts.values())
      .filter(alert => alert.educatorId === educatorId)
      .filter(alert => alert.severity === 'urgent' || alert.severity === 'critical')
      .filter(alert => alert.status === 'pending')
      .filter(alert => this.respectsPrivacyContext(alert, privacyContext))
      .sort((a, b) => {
        const severityOrder = { 'urgent': 4, 'critical': 3, 'high': 2, 'medium': 1, 'low': 0 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
  }

  async acknowledgeAlerts(
    alertIds: string[],
    acknowledgmentData: {
      acknowledgedBy: string;
      notes?: string;
      plannedActions?: string[];
    },
    privacyContext: PrivacyContext
  ): Promise<EducatorAlert[]> {
    this.logPrivacyOperation('acknowledgeAlerts', privacyContext);

    const acknowledged: EducatorAlert[] = [];
    
    for (const alertId of alertIds) {
      const alert = this.alerts.get(alertId);
      if (alert) {
        const updated = {
          ...alert,
          status: 'acknowledged' as const,
          acknowledgedAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            ...alert.metadata,
            acknowledgment: acknowledgmentData
          }
        };
        
        this.alerts.set(alertId, updated);
        acknowledged.push(updated);
        this.logAudit('acknowledgeAlert', alertId, privacyContext);
      }
    }

    return acknowledged;
  }

  async markAlertsAddressed(
    alertIds: string[],
    addressData: {
      addressedBy: string;
      actions_taken: string[];
      outcome: 'resolved' | 'improved' | 'ongoing' | 'escalated';
      notes?: string;
      followUpRequired?: boolean;
    },
    privacyContext: PrivacyContext
  ): Promise<EducatorAlert[]> {
    this.logPrivacyOperation('markAlertsAddressed', privacyContext);

    const addressed: EducatorAlert[] = [];
    
    for (const alertId of alertIds) {
      const alert = this.alerts.get(alertId);
      if (alert) {
        const updated = {
          ...alert,
          status: 'addressed' as const,
          addressedAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            ...alert.metadata,
            resolution: addressData
          }
        };
        
        this.alerts.set(alertId, updated);
        addressed.push(updated);
        this.logAudit('markAlertAddressed', alertId, privacyContext);
      }
    }

    return addressed;
  }

  async getEducatorPreferences(
    educatorId: string,
    privacyContext: PrivacyContext
  ): Promise<EducatorPreferences | null> {
    this.logPrivacyOperation('getEducatorPreferences', privacyContext);
    return this.preferences.get(educatorId) || null;
  }

  async updateEducatorPreferences(
    educatorId: string,
    preferences: Partial<EducatorPreferences>,
    privacyContext: PrivacyContext
  ): Promise<EducatorPreferences> {
    this.logPrivacyOperation('updateEducatorPreferences', privacyContext);

    const existing = this.preferences.get(educatorId) || this.createDefaultPreferences(educatorId);
    const updated = { ...existing, ...preferences };
    
    this.preferences.set(educatorId, updated);
    this.logAudit('updateEducatorPreferences', educatorId, privacyContext);
    
    return updated;
  }

  async getAlertAnalytics(
    filters: AlertFilters,
    criteria: AnalyticsCriteria,
    privacyContext: PrivacyContext
  ): Promise<AnonymizedData<AlertAnalytics>> {
    this.logPrivacyOperation('getAlertAnalytics', privacyContext);

    const alerts = Array.from(this.alerts.values())
      .filter(alert => this.applyFilters(alert, filters))
      .filter(alert => this.respectsPrivacyContext(alert, privacyContext));

    const analytics = this.calculateAlertAnalytics(alerts);
    
    return {
      data: analytics,
      cohortSize: alerts.length,
      dateRange: {
        start: criteria.dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: criteria.dateRange?.end || new Date()
      },
      anonymizedFields: ['studentId', 'educatorId'],
      aggregationMethod: 'count'
    };
  }

  async getRecommendationsByType(
    type: InterventionRecommendation['type'],
    filters: {
      studentId?: string;
      assignmentId?: string;
      confidence_threshold?: number;
      timeframe?: InterventionRecommendation['timeframe'];
    },
    privacyContext: PrivacyContext
  ): Promise<InterventionRecommendation[]> {
    this.logPrivacyOperation('getRecommendationsByType', privacyContext);

    return Array.from(this.recommendations.values())
      .filter(rec => rec.type === type)
      .filter(rec => !filters.studentId || rec.studentId === filters.studentId)
      .filter(rec => !filters.assignmentId || rec.assignmentId === filters.assignmentId)
      .filter(rec => !filters.confidence_threshold || rec.confidence >= filters.confidence_threshold)
      .filter(rec => !filters.timeframe || rec.timeframe === filters.timeframe)
      .filter(rec => this.respectsPrivacyContext({ studentId: rec.studentId } as any, privacyContext));
  }

  async getScheduledInterventions(
    educatorId: string,
    dateRange: { start: Date; end: Date },
    privacyContext: PrivacyContext
  ): Promise<InterventionSchedule[]> {
    this.logPrivacyOperation('getScheduledInterventions', privacyContext);

    return Array.from(this.schedules.values())
      .filter(schedule => schedule.educatorId === educatorId)
      .filter(schedule => schedule.scheduledFor >= dateRange.start && schedule.scheduledFor <= dateRange.end)
      .filter(schedule => this.respectsPrivacyContext({ studentId: schedule.studentId } as any, privacyContext));
  }

  async updateInterventionSchedule(
    scheduleId: string,
    updates: Partial<Omit<InterventionSchedule, 'id' | 'createdAt' | 'updatedAt'>>,
    privacyContext: PrivacyContext
  ): Promise<InterventionSchedule> {
    this.logPrivacyOperation('updateInterventionSchedule', privacyContext);

    const existing = this.schedules.get(scheduleId);
    if (!existing) {
      throw new Error(`Schedule with id ${scheduleId} not found`);
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };

    this.schedules.set(scheduleId, updated);
    this.logAudit('updateInterventionSchedule', scheduleId, privacyContext);
    
    return updated;
  }

  async getEffectivenessMeasurements(
    interventionId: string,
    privacyContext: PrivacyContext
  ): Promise<InterventionEffectiveness[]> {
    this.logPrivacyOperation('getEffectivenessMeasurements', privacyContext);

    return Array.from(this.effectiveness.values())
      .filter(eff => eff.interventionId === interventionId);
  }

  async createBulkAlerts(
    alerts: Omit<EducatorAlert, 'id' | 'createdAt' | 'updatedAt'>[],
    privacyContext: PrivacyContext
  ): Promise<EducatorAlert[]> {
    this.logPrivacyOperation('createBulkAlerts', privacyContext);

    const created: EducatorAlert[] = [];
    for (const alertData of alerts) {
      const alert = await this.create(alertData);
      created.push(alert);
      this.logAudit('createBulkAlert', alert.id, privacyContext);
    }
    return created;
  }

  async getAuditTrail(
    entityId: string,
    privacyContext: PrivacyContext
  ): Promise<AuditEntry[]> {
    this.logPrivacyOperation('getAuditTrail', privacyContext);

    return this.auditTrail
      .filter(entry => entry.entityId === entityId)
      .filter(entry => this.respectsPrivacyContext({ studentId: entry.entityId } as any, privacyContext));
  }

  async findSimilarInterventions(
    studentProfile: Record<string, any>,
    contextData: Record<string, any>,
    privacyContext: PrivacyContext
  ): Promise<{
    recommendation: InterventionRecommendation;
    similarity: number;
    effectiveness: number;
  }[]> {
    this.logPrivacyOperation('findSimilarInterventions', privacyContext);

    // Mock similarity matching - in real implementation would use ML algorithms
    const recommendations = Array.from(this.recommendations.values())
      .filter(rec => this.respectsPrivacyContext({ studentId: rec.studentId } as any, privacyContext))
      .slice(0, 5);

    return recommendations.map(recommendation => ({
      recommendation,
      similarity: Math.random() * 0.5 + 0.5, // Mock similarity score 0.5-1.0
      effectiveness: Math.random() * 0.3 + 0.7 // Mock effectiveness score 0.7-1.0
    }));
  }

  async getAlertDeliveryMetrics(
    filters: AlertFilters,
    privacyContext: PrivacyContext
  ): Promise<{
    totalSent: number;
    deliveryRate: number;
    channelMetrics: Record<string, { sent: number; delivered: number; failed: number }>;
    averageDeliveryTime: number;
    acknowledgmentRate: number;
  }> {
    this.logPrivacyOperation('getAlertDeliveryMetrics', privacyContext);

    const alerts = Array.from(this.alerts.values())
      .filter(alert => this.applyFilters(alert, filters))
      .filter(alert => this.respectsPrivacyContext(alert, privacyContext));

    const acknowledged = alerts.filter(alert => alert.status === 'acknowledged' || alert.status === 'addressed').length;

    return {
      totalSent: alerts.length,
      deliveryRate: 0.95, // Mock delivery rate
      channelMetrics: {
        in_app: { sent: alerts.length, delivered: Math.floor(alerts.length * 0.98), failed: Math.floor(alerts.length * 0.02) },
        email: { sent: Math.floor(alerts.length * 0.7), delivered: Math.floor(alerts.length * 0.65), failed: Math.floor(alerts.length * 0.05) },
        sms: { sent: Math.floor(alerts.length * 0.3), delivered: Math.floor(alerts.length * 0.28), failed: Math.floor(alerts.length * 0.02) }
      },
      averageDeliveryTime: 2.5, // Mock average delivery time in minutes
      acknowledgmentRate: acknowledged / alerts.length
    };
  }

  // Helper Methods
  private logPrivacyOperation(operation: string, context: PrivacyContext) {
    this.privacyLogs.push({ operation, context, timestamp: new Date() });
  }

  private logAudit(operation: string, entityId: string, context: PrivacyContext) {
    const auditEntry: AuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation: operation.includes('create') ? 'create' : 
                operation.includes('update') ? 'update' : 
                operation.includes('delete') ? 'delete' : 'read',
      entityType: 'educator_alert',
      entityId,
      privacyContext: context,
      result: 'success',
      timestamp: new Date(),
      accessMetadata: {
        fieldsAccessed: ['id', 'educatorId', 'studentId', 'alertType', 'severity'],
        educationalJustification: context.educationalJustification
      }
    };
    this.auditTrail.push(auditEntry);
  }

  private createMockRecommendation(
    studentId: string,
    type: InterventionRecommendation['type'],
    rationale: string,
    confidence: number,
    educationalContext: any
  ): InterventionRecommendation {
    const id = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const suggestedActions: SuggestedAction[] = [
      {
        actionType: 'notification',
        description: 'Send immediate notification to educator',
        parameters: { priority: 'high', channels: ['in_app', 'email'] },
        urgency: 'high',
        expectedDuration: '5 minutes'
      },
      {
        actionType: 'meeting_request',
        description: 'Schedule one-on-one meeting with student',
        parameters: { duration: 30, type: 'intervention' },
        urgency: 'medium',
        expectedDuration: '30 minutes'
      }
    ];

    return {
      id,
      studentId,
      assignmentId: educationalContext.assignmentId,
      type,
      confidence,
      rationale,
      suggestedActions,
      expectedOutcomes: ['Improved engagement', 'Better understanding', 'Increased motivation'],
      timeframe: 'short_term',
      evidenceData: { analysisScore: confidence, contextualFactors: ['time_pressure', 'complexity'] },
      generatedAt: new Date()
    };
  }

  private shouldSendAlert(alertData: Omit<EducatorAlert, 'id' | 'createdAt' | 'updatedAt'>, prefs: EducatorPreferences): boolean {
    // Check if alert type is enabled
    if (!prefs.alertTypes.includes(alertData.alertType)) return false;
    
    // Check minimum severity
    const severityOrder = { 'low': 0, 'medium': 1, 'high': 2, 'critical': 3, 'urgent': 4 };
    if (severityOrder[alertData.severity] < severityOrder[prefs.minimumSeverity]) return false;
    
    // Check quiet hours (mock implementation)
    const now = new Date();
    const currentHour = now.getHours();
    const quietStart = parseInt(prefs.quietHours.start.split(':')[0]);
    const quietEnd = parseInt(prefs.quietHours.end.split(':')[0]);
    
    if (currentHour >= quietStart || currentHour <= quietEnd) {
      return alertData.severity === 'urgent' || alertData.severity === 'critical';
    }
    
    return true;
  }

  private applyFilters(alert: EducatorAlert, filters: AlertFilters): boolean {
    if (filters.educatorId && alert.educatorId !== filters.educatorId) return false;
    if (filters.studentId && alert.studentId !== filters.studentId) return false;
    if (filters.assignmentId && alert.assignmentId !== filters.assignmentId) return false;
    if (filters.courseId && alert.courseId !== filters.courseId) return false;
    if (filters.alertType && alert.alertType !== filters.alertType) return false;
    if (filters.severity && alert.severity !== filters.severity) return false;
    if (filters.status && alert.status !== filters.status) return false;
    if (filters.fromDate && alert.createdAt < filters.fromDate) return false;
    if (filters.toDate && alert.createdAt > filters.toDate) return false;
    if (filters.unacknowledgedOnly && alert.status !== 'pending') return false;
    if (filters.urgentOnly && !['urgent', 'critical'].includes(alert.severity)) return false;
    
    return true;
  }

  private respectsPrivacyContext(alert: Partial<EducatorAlert>, context: PrivacyContext): boolean {
    // Basic privacy filtering - educators can see alerts for their students
    return context.requesterType === 'admin' || 
           context.requesterType === 'educator' ||
           (context.requesterType === 'student' && alert.studentId === context.requesterId);
  }

  private calculateMockImprovement(baseline: Record<string, any>, measurement: Record<string, any>): number {
    // Mock improvement calculation
    const baselineAvg = Object.values(baseline).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0) / Object.keys(baseline).length;
    const measurementAvg = Object.values(measurement).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0) / Object.keys(measurement).length;
    
    return (measurementAvg - baselineAvg) / baselineAvg;
  }

  private calculateAlertAnalytics(alerts: EducatorAlert[]): AlertAnalytics {
    const totalAlerts = alerts.length;
    
    const byType = alerts.reduce((acc, alert) => {
      acc[alert.alertType] = (acc[alert.alertType] || 0) + 1;
      return acc;
    }, {} as Record<EducatorAlert['alertType'], number>);

    const bySeverity = alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<EducatorAlert['severity'], number>);

    const byStatus = alerts.reduce((acc, alert) => {
      acc[alert.status] = (acc[alert.status] || 0) + 1;
      return acc;
    }, {} as Record<EducatorAlert['status'], number>);

    const addressed = alerts.filter(alert => alert.addressedAt);
    const totalResponseTime = addressed.reduce((sum, alert) => {
      if (alert.addressedAt && alert.createdAt) {
        return sum + (alert.addressedAt.getTime() - alert.createdAt.getTime());
      }
      return sum;
    }, 0);

    return {
      totalAlerts,
      byType,
      bySeverity,
      byStatus,
      responseTime: {
        average: addressed.length > 0 ? totalResponseTime / addressed.length / (1000 * 60) : 0, // minutes
        median: 45, // Mock median
        percentile95: 120 // Mock 95th percentile
      },
      resolutionRate: addressed.length / totalAlerts,
      trends: this.generateMockTrends(),
      mostEffectiveActions: [
        { actionType: 'contact_student', successRate: 0.85, averageImpact: 0.7 },
        { actionType: 'schedule_meeting', successRate: 0.78, averageImpact: 0.8 },
        { actionType: 'provide_feedback', successRate: 0.92, averageImpact: 0.6 }
      ]
    };
  }

  private generateMockTrends(): { date: Date; alertCount: number; resolutionRate: number }[] {
    const trends = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      trends.push({
        date,
        alertCount: Math.floor(Math.random() * 20) + 5,
        resolutionRate: Math.random() * 0.3 + 0.7
      });
    }
    
    return trends;
  }

  private createDefaultPreferences(educatorId: string): EducatorPreferences {
    return {
      educatorId,
      alertFrequency: 'immediate',
      alertTypes: ['intervention_needed', 'progress_concern', 'engagement_drop'],
      notificationChannels: ['in_app', 'email'],
      minimumSeverity: 'medium',
      quietHours: {
        start: '22:00',
        end: '07:00',
        timezone: 'America/New_York'
      },
      batchAlerts: false,
      customFilters: {}
    };
  }

  // Missing BaseRepository methods
  async findByIdWithPrivacy(id: string, privacyContext: PrivacyContext): Promise<EducatorAlert | null> {
    await this.logPrivacyOperation('findByIdWithPrivacy', privacyContext);
    return this.findById(id);
  }

  async findByIdWithConsent(id: string, privacyContext: PrivacyContext): Promise<EducatorAlert | null> {
    await this.logPrivacyOperation('findByIdWithConsent', privacyContext);
    // Mock consent verification - in real implementation would check consent
    return this.findById(id);
  }

  async getAnonymizedAnalytics(criteria: AnalyticsCriteria, privacyContext: PrivacyContext): Promise<AnonymizedData<any>> {
    await this.logPrivacyOperation('getAnonymizedAnalytics', privacyContext);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return {
      data: { totalRecords: this.alerts.size },
      cohortSize: Math.max(10, this.alerts.size),
      dateRange: {
        start: weekAgo,
        end: now
      },
      anonymizedFields: ['studentId', 'educatorId'],
      aggregationMethod: 'count'
    };
  }

  // Test utilities
  getPrivacyLogs() {
    return this.privacyLogs;
  }

  clearPrivacyLogs() {
    this.privacyLogs = [];
  }

  getAuditLogs() {
    return this.auditTrail;
  }

  reset() {
    this.alerts.clear();
    this.recommendations.clear();
    this.schedules.clear();
    this.effectiveness.clear();
    this.preferences.clear();
    this.auditTrail = [];
    this.privacyLogs = [];
    this.seedTestData();
  }

  private seedTestData() {
    // Add test alert
    const testAlert = {
      educatorId: 'educator_1',
      studentId: 'student_1',
      assignmentId: 'assignment_1',
      courseId: 'course_1',
      alertType: 'intervention_needed' as const,
      severity: 'high' as const,
      status: 'pending' as const,
      title: 'Student Needs Support',
      description: 'Student showing signs of cognitive overload and declining engagement.',
      recommendedActions: [
        {
          id: 'action_1',
          type: 'contact_student' as const,
          title: 'Contact Student',
          description: 'Reach out to discuss current challenges',
          priority: 'high' as const,
          estimatedTime: '15 minutes',
          completed: false
        }
      ],
      triggerData: { cognitiveLoad: 0.9, engagement: 0.3, qualityScore: 0.4 }
    };

    this.create(testAlert);

    // Add test preferences
    this.preferences.set('educator_1', this.createDefaultPreferences('educator_1'));
  }
}