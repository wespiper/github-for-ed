/**
 * Intervention Repository Interface
 * Privacy-aware intervention tracking and management
 */

import { BaseRepository } from './BaseRepository';
import { PrivacyContext } from '../../types/privacy';

export interface Intervention {
  id: string;
  studentId: string;
  assignmentId?: string;
  type: 'cognitive_load' | 'engagement' | 'quality' | 'progress' | 'reflection';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'active' | 'resolved' | 'dismissed';
  title: string;
  description: string;
  recommendedActions: string[];
  triggerMetrics: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface InterventionAction {
  id: string;
  interventionId: string;
  actionType: 'notification' | 'ui_adjustment' | 'content_suggestion' | 'educator_alert';
  title: string;
  description: string;
  parameters: Record<string, any>;
  status: 'pending' | 'executed' | 'failed' | 'skipped';
  executedAt?: Date;
  result?: Record<string, any>;
  createdAt: Date;
}

export interface InterventionTrigger {
  id: string;
  name: string;
  type: Intervention['type'];
  conditions: Record<string, any>;
  thresholds: Record<string, number>;
  actions: string[];
  active: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface InterventionOutcome {
  id: string;
  interventionId: string;
  outcome: 'successful' | 'partially_successful' | 'unsuccessful' | 'no_response';
  metrics: Record<string, any>;
  feedback?: string;
  timestamp: Date;
}

export interface InterventionAnalytics {
  totalInterventions: number;
  byType: Record<Intervention['type'], number>;
  bySeverity: Record<Intervention['severity'], number>;
  byStatus: Record<Intervention['status'], number>;
  successRate: number;
  averageResolutionTime: number;
  trends: {
    date: Date;
    count: number;
    successRate: number;
  }[];
}

export interface InterventionFilters {
  studentId?: string;
  assignmentId?: string;
  type?: Intervention['type'];
  severity?: Intervention['severity'];
  status?: Intervention['status'];
  fromDate?: Date;
  toDate?: Date;
  activeOnly?: boolean;
}

/**
 * Privacy-aware Intervention Repository
 */
export interface InterventionRepository extends BaseRepository<Intervention> {
  /**
   * Create intervention with privacy context
   */
  createIntervention(
    intervention: Omit<Intervention, 'id' | 'createdAt' | 'updatedAt'>,
    privacyContext: PrivacyContext
  ): Promise<Intervention>;

  /**
   * Find interventions by student with privacy filtering
   */
  findByStudent(
    studentId: string,
    filters: InterventionFilters,
    privacyContext: PrivacyContext
  ): Promise<Intervention[]>;

  /**
   * Find active interventions requiring action
   */
  findActiveInterventions(
    filters: InterventionFilters,
    privacyContext: PrivacyContext
  ): Promise<Intervention[]>;

  /**
   * Update intervention status with audit trail
   */
  updateStatus(
    interventionId: string,
    status: Intervention['status'],
    notes?: string,
    privacyContext?: PrivacyContext
  ): Promise<Intervention>;

  /**
   * Resolve intervention with outcome tracking
   */
  resolveIntervention(
    interventionId: string,
    outcome: Omit<InterventionOutcome, 'id' | 'interventionId' | 'timestamp'>,
    privacyContext: PrivacyContext
  ): Promise<Intervention>;

  /**
   * Create intervention action
   */
  createAction(
    action: Omit<InterventionAction, 'id' | 'createdAt'>,
    privacyContext: PrivacyContext
  ): Promise<InterventionAction>;

  /**
   * Execute intervention action
   */
  executeAction(
    actionId: string,
    result: Record<string, any>,
    privacyContext: PrivacyContext
  ): Promise<InterventionAction>;

  /**
   * Get intervention actions by intervention
   */
  getActionsByIntervention(
    interventionId: string,
    privacyContext: PrivacyContext
  ): Promise<InterventionAction[]>;

  /**
   * Create intervention trigger
   */
  createTrigger(
    trigger: Omit<InterventionTrigger, 'id' | 'createdAt' | 'updatedAt'>,
    privacyContext: PrivacyContext
  ): Promise<InterventionTrigger>;

  /**
   * Update intervention trigger
   */
  updateTrigger(
    triggerId: string,
    updates: Partial<Omit<InterventionTrigger, 'id' | 'createdAt' | 'updatedAt'>>,
    privacyContext: PrivacyContext
  ): Promise<InterventionTrigger>;

  /**
   * Get active triggers
   */
  getActiveTriggers(privacyContext: PrivacyContext): Promise<InterventionTrigger[]>;

  /**
   * Check if student meets intervention triggers
   */
  checkTriggers(
    studentId: string,
    metrics: Record<string, any>,
    privacyContext: PrivacyContext
  ): Promise<{
    triggered: InterventionTrigger[];
    potentialInterventions: Omit<Intervention, 'id' | 'createdAt' | 'updatedAt'>[];
  }>;

  /**
   * Get intervention analytics with privacy aggregation
   */
  getAnalytics(
    filters: InterventionFilters,
    privacyContext: PrivacyContext
  ): Promise<InterventionAnalytics>;

  /**
   * Get intervention effectiveness metrics
   */
  getEffectivenessMetrics(
    filters: InterventionFilters,
    privacyContext: PrivacyContext
  ): Promise<{
    type: Intervention['type'];
    totalInterventions: number;
    successRate: number;
    averageImpact: number;
    mostEffectiveActions: string[];
  }[]>;

  /**
   * Find similar interventions for recommendations
   */
  findSimilarInterventions(
    studentId: string,
    metrics: Record<string, any>,
    privacyContext: PrivacyContext
  ): Promise<{
    intervention: Intervention;
    similarity: number;
    effectiveness: number;
  }[]>;

  /**
   * Bulk create interventions for batch processing
   */
  createBulkInterventions(
    interventions: Omit<Intervention, 'id' | 'createdAt' | 'updatedAt'>[],
    privacyContext: PrivacyContext
  ): Promise<Intervention[]>;
}