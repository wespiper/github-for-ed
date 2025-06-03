/**
 * Educator Alerts Repository Interface
 * Privacy-aware educator alert and intervention recommendation management
 */

import { BaseRepository } from './BaseRepository';
import { PrivacyContext, AuditEntry, AnonymizedData, AnalyticsCriteria } from '../../types/privacy';

export interface EducatorAlert {
  id: string;
  educatorId: string;
  studentId: string;
  assignmentId?: string;
  courseId?: string;
  alertType: 'intervention_needed' | 'progress_concern' | 'academic_integrity' | 'engagement_drop' | 'quality_decline' | 'urgent_support';
  severity: 'low' | 'medium' | 'high' | 'critical' | 'urgent';
  status: 'pending' | 'acknowledged' | 'addressed' | 'dismissed' | 'escalated';
  title: string;
  description: string;
  recommendedActions: RecommendedAction[];
  triggerData: Record<string, any>;
  metadata?: Record<string, any>;
  acknowledgedAt?: Date;
  addressedAt?: Date;
  dismissedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecommendedAction {
  id: string;
  type: 'contact_student' | 'schedule_meeting' | 'provide_feedback' | 'modify_assignment' | 'refer_support' | 'adjust_ai_boundaries';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedTime: string; // e.g., "5 minutes", "30 minutes", "1 hour"
  parameters?: Record<string, any>;
  completed: boolean;
  completedAt?: Date;
  notes?: string;
}

export interface InterventionRecommendation {
  id: string;
  studentId: string;
  assignmentId?: string;
  type: 'cognitive_support' | 'engagement_boost' | 'quality_improvement' | 'progress_acceleration' | 'reflection_enhancement';
  confidence: number; // 0-1 confidence score
  rationale: string;
  suggestedActions: SuggestedAction[];
  expectedOutcomes: string[];
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  evidenceData: Record<string, any>;
  generatedAt: Date;
  implementedAt?: Date;
  effectivenessScore?: number;
}

export interface SuggestedAction {
  actionType: 'notification' | 'ui_adjustment' | 'content_suggestion' | 'meeting_request' | 'assignment_modification';
  description: string;
  parameters: Record<string, any>;
  urgency: 'low' | 'medium' | 'high' | 'immediate';
  expectedDuration: string;
}

export interface InterventionSchedule {
  id: string;
  interventionId: string;
  educatorId: string;
  studentId: string;
  scheduledType: 'meeting' | 'check_in' | 'feedback_session' | 'support_call' | 'progress_review';
  scheduledFor: Date;
  duration: number; // minutes
  location?: string;
  virtualMeetingUrl?: string;
  agenda: string[];
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  remindersSent: Date[];
  completedAt?: Date;
  notes?: string;
  followUpRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InterventionEffectiveness {
  id: string;
  interventionId: string;
  measurementType: 'pre_post' | 'longitudinal' | 'immediate' | 'delayed';
  metrics: {
    engagementScore?: number;
    qualityScore?: number;
    progressRate?: number;
    reflectionDepth?: number;
    cognitiveLoad?: number;
    [key: string]: any;
  };
  baselineData: Record<string, any>;
  postInterventionData: Record<string, any>;
  improvementScore: number; // -1 to 1, where 1 is significant improvement
  confidenceLevel: number; // 0-1 statistical confidence
  measurementDate: Date;
  notes?: string;
  followUpRecommendations: string[];
}

export interface EducatorPreferences {
  educatorId: string;
  alertFrequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  alertTypes: EducatorAlert['alertType'][];
  notificationChannels: ('in_app' | 'email' | 'sms' | 'slack')[];
  minimumSeverity: EducatorAlert['severity'];
  quietHours: {
    start: string; // HH:MM format
    end: string; // HH:MM format
    timezone: string;
  };
  batchAlerts: boolean;
  customFilters: {
    courses?: string[];
    students?: string[];
    assignmentTypes?: string[];
  };
}

export interface AlertAnalytics {
  totalAlerts: number;
  byType: Record<EducatorAlert['alertType'], number>;
  bySeverity: Record<EducatorAlert['severity'], number>;
  byStatus: Record<EducatorAlert['status'], number>;
  responseTime: {
    average: number; // minutes
    median: number;
    percentile95: number;
  };
  resolutionRate: number;
  trends: {
    date: Date;
    alertCount: number;
    resolutionRate: number;
  }[];
  mostEffectiveActions: {
    actionType: string;
    successRate: number;
    averageImpact: number;
  }[];
}

export interface AlertFilters {
  educatorId?: string;
  studentId?: string;
  assignmentId?: string;
  courseId?: string;
  alertType?: EducatorAlert['alertType'];
  severity?: EducatorAlert['severity'];
  status?: EducatorAlert['status'];
  fromDate?: Date;
  toDate?: Date;
  unacknowledgedOnly?: boolean;
  urgentOnly?: boolean;
}

/**
 * Privacy-aware Educator Alerts Repository
 * Extends BaseRepository with educator-specific alert and intervention functionality
 */
export interface EducatorAlertsRepository extends BaseRepository<EducatorAlert> {
  /**
   * Generate intervention recommendations based on student data analysis
   */
  generateInterventionRecommendations(
    studentId: string,
    analysisData: Record<string, any>,
    educationalContext: {
      assignmentId?: string;
      courseId?: string;
      learningObjectives?: string[];
    },
    privacyContext: PrivacyContext
  ): Promise<InterventionRecommendation[]>;

  /**
   * Send educator alerts with privacy-aware content filtering
   */
  sendEducatorAlerts(
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
  }>;

  /**
   * Schedule intervention actions with calendar integration
   */
  scheduleInterventionActions(
    interventionId: string,
    scheduleData: Omit<InterventionSchedule, 'id' | 'createdAt' | 'updatedAt'>,
    reminderSettings: {
      sendReminders: boolean;
      reminderTimes: string[]; // e.g., ["24h", "1h", "15m"]
      includePreparation?: boolean;
    },
    privacyContext: PrivacyContext
  ): Promise<InterventionSchedule>;

  /**
   * Track intervention effectiveness with longitudinal measurement
   */
  trackInterventionEffectiveness(
    interventionId: string,
    measurementData: Omit<InterventionEffectiveness, 'id' | 'measurementDate'>,
    comparisonPeriod: {
      baseline: { start: Date; end: Date };
      measurement: { start: Date; end: Date };
    },
    privacyContext: PrivacyContext
  ): Promise<InterventionEffectiveness>;

  /**
   * Find alerts by educator with privacy filtering
   */
  findByEducator(
    educatorId: string,
    filters: AlertFilters,
    privacyContext: PrivacyContext
  ): Promise<EducatorAlert[]>;

  /**
   * Find alerts by student (with educator authorization)
   */
  findByStudent(
    studentId: string,
    filters: AlertFilters,
    privacyContext: PrivacyContext
  ): Promise<EducatorAlert[]>;

  /**
   * Get urgent alerts requiring immediate attention
   */
  getUrgentAlerts(
    educatorId: string,
    privacyContext: PrivacyContext
  ): Promise<EducatorAlert[]>;

  /**
   * Acknowledge alerts and update status
   */
  acknowledgeAlerts(
    alertIds: string[],
    acknowledgmentData: {
      acknowledgedBy: string;
      notes?: string;
      plannedActions?: string[];
    },
    privacyContext: PrivacyContext
  ): Promise<EducatorAlert[]>;

  /**
   * Mark alerts as addressed with outcome tracking
   */
  markAlertsAddressed(
    alertIds: string[],
    addressData: {
      addressedBy: string;
      actions_taken: string[];
      outcome: 'resolved' | 'improved' | 'ongoing' | 'escalated';
      notes?: string;
      followUpRequired?: boolean;
    },
    privacyContext: PrivacyContext
  ): Promise<EducatorAlert[]>;

  /**
   * Get educator alert preferences
   */
  getEducatorPreferences(
    educatorId: string,
    privacyContext: PrivacyContext
  ): Promise<EducatorPreferences | null>;

  /**
   * Update educator alert preferences
   */
  updateEducatorPreferences(
    educatorId: string,
    preferences: Partial<EducatorPreferences>,
    privacyContext: PrivacyContext
  ): Promise<EducatorPreferences>;

  /**
   * Get alert analytics with privacy aggregation
   */
  getAlertAnalytics(
    filters: AlertFilters,
    criteria: AnalyticsCriteria,
    privacyContext: PrivacyContext
  ): Promise<AnonymizedData<AlertAnalytics>>;

  /**
   * Get intervention recommendations by type
   */
  getRecommendationsByType(
    type: InterventionRecommendation['type'],
    filters: {
      studentId?: string;
      assignmentId?: string;
      confidence_threshold?: number;
      timeframe?: InterventionRecommendation['timeframe'];
    },
    privacyContext: PrivacyContext
  ): Promise<InterventionRecommendation[]>;

  /**
   * Get scheduled interventions for educator
   */
  getScheduledInterventions(
    educatorId: string,
    dateRange: { start: Date; end: Date },
    privacyContext: PrivacyContext
  ): Promise<InterventionSchedule[]>;

  /**
   * Update intervention schedule
   */
  updateInterventionSchedule(
    scheduleId: string,
    updates: Partial<Omit<InterventionSchedule, 'id' | 'createdAt' | 'updatedAt'>>,
    privacyContext: PrivacyContext
  ): Promise<InterventionSchedule>;

  /**
   * Get effectiveness measurements for intervention
   */
  getEffectivenessMeasurements(
    interventionId: string,
    privacyContext: PrivacyContext
  ): Promise<InterventionEffectiveness[]>;

  /**
   * Bulk create alerts for multiple students
   */
  createBulkAlerts(
    alerts: Omit<EducatorAlert, 'id' | 'createdAt' | 'updatedAt'>[],
    privacyContext: PrivacyContext
  ): Promise<EducatorAlert[]>;

  /**
   * Get audit trail for alert operations
   */
  getAuditTrail(
    entityId: string,
    privacyContext: PrivacyContext
  ): Promise<AuditEntry[]>;

  /**
   * Find similar interventions for recommendation enhancement
   */
  findSimilarInterventions(
    studentProfile: Record<string, any>,
    contextData: Record<string, any>,
    privacyContext: PrivacyContext
  ): Promise<{
    recommendation: InterventionRecommendation;
    similarity: number;
    effectiveness: number;
  }[]>;

  /**
   * Get alert delivery status and metrics
   */
  getAlertDeliveryMetrics(
    filters: AlertFilters,
    privacyContext: PrivacyContext
  ): Promise<{
    totalSent: number;
    deliveryRate: number;
    channelMetrics: Record<string, { sent: number; delivered: number; failed: number }>;
    averageDeliveryTime: number;
    acknowledgmentRate: number;
  }>;
}