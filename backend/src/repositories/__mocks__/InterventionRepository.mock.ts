/**
 * Mock Intervention Repository Implementation
 * For testing privacy-aware intervention operations
 */

import { 
  InterventionRepository,
  Intervention,
  InterventionAction,
  InterventionTrigger,
  InterventionOutcome,
  InterventionAnalytics,
  InterventionFilters
} from '../interfaces/InterventionRepository';
import { PrivacyContext } from '../../types/privacy';
import { FindManyOptions, CreateData, UpdateData } from '../interfaces/BaseRepository';

export class MockInterventionRepository implements InterventionRepository {
  private interventions: Map<string, Intervention> = new Map();
  private actions: Map<string, InterventionAction> = new Map();
  private triggers: Map<string, InterventionTrigger> = new Map();
  private outcomes: Map<string, InterventionOutcome> = new Map();
  private privacyLogs: Array<{ operation: string; context: PrivacyContext; timestamp: Date }> = [];

  constructor() {
    this.seedTestData();
  }

  async findById(id: string): Promise<Intervention | null> {
    return this.interventions.get(id) || null;
  }

  async findMany(options?: FindManyOptions<Intervention>): Promise<Intervention[]> {
    return Array.from(this.interventions.values());
  }

  async create(data: CreateData<Intervention>): Promise<Intervention> {
    const id = `intervention_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const intervention: Intervention = {
      id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.interventions.set(id, intervention);
    return intervention;
  }

  async update(id: string, data: UpdateData<Intervention>): Promise<Intervention> {
    const existing = this.interventions.get(id);
    if (!existing) {
      throw new Error(`Intervention with id ${id} not found`);
    }

    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date()
    };

    this.interventions.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.interventions.delete(id);
    // Clean up related actions and outcomes
    Array.from(this.actions.values())
      .filter(action => action.interventionId === id)
      .forEach(action => this.actions.delete(action.id));
    
    Array.from(this.outcomes.values())
      .filter(outcome => outcome.interventionId === id)
      .forEach(outcome => this.outcomes.delete(outcome.id));
  }

  async count(options?: any): Promise<number> {
    return this.interventions.size;
  }

  async createIntervention(
    intervention: Omit<Intervention, 'id' | 'createdAt' | 'updatedAt'>,
    privacyContext: PrivacyContext
  ): Promise<Intervention> {
    this.logPrivacyOperation('createIntervention', privacyContext);
    return this.create(intervention);
  }

  async findByStudent(
    studentId: string,
    filters: InterventionFilters,
    privacyContext: PrivacyContext
  ): Promise<Intervention[]> {
    this.logPrivacyOperation('findByStudent', privacyContext);
    
    return Array.from(this.interventions.values())
      .filter(intervention => intervention.studentId === studentId)
      .filter(intervention => this.applyFilters(intervention, filters))
      .filter(intervention => this.respectsPrivacyContext(intervention, privacyContext));
  }

  async findActiveInterventions(
    filters: InterventionFilters,
    privacyContext: PrivacyContext
  ): Promise<Intervention[]> {
    this.logPrivacyOperation('findActiveInterventions', privacyContext);
    
    return Array.from(this.interventions.values())
      .filter(intervention => ['pending', 'active'].includes(intervention.status))
      .filter(intervention => this.applyFilters(intervention, filters))
      .filter(intervention => this.respectsPrivacyContext(intervention, privacyContext));
  }

  async updateStatus(
    interventionId: string,
    status: Intervention['status'],
    notes?: string,
    privacyContext?: PrivacyContext
  ): Promise<Intervention> {
    if (privacyContext) {
      this.logPrivacyOperation('updateStatus', privacyContext);
    }
    
    const intervention = this.interventions.get(interventionId);
    if (!intervention) {
      throw new Error(`Intervention with id ${interventionId} not found`);
    }

    const updated = {
      ...intervention,
      status,
      updatedAt: new Date(),
      resolvedAt: status === 'resolved' ? new Date() : intervention.resolvedAt,
      metadata: {
        ...intervention.metadata,
        statusNotes: notes
      }
    };

    this.interventions.set(interventionId, updated);
    return updated;
  }

  async resolveIntervention(
    interventionId: string,
    outcome: Omit<InterventionOutcome, 'id' | 'interventionId' | 'timestamp'>,
    privacyContext: PrivacyContext
  ): Promise<Intervention> {
    this.logPrivacyOperation('resolveIntervention', privacyContext);
    
    // Create outcome record
    const outcomeId = `outcome_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const interventionOutcome: InterventionOutcome = {
      id: outcomeId,
      interventionId,
      ...outcome,
      timestamp: new Date()
    };
    this.outcomes.set(outcomeId, interventionOutcome);

    // Update intervention status
    return this.updateStatus(interventionId, 'resolved', 'Resolved with outcome', privacyContext);
  }

  async createAction(
    action: Omit<InterventionAction, 'id' | 'createdAt'>,
    privacyContext: PrivacyContext
  ): Promise<InterventionAction> {
    this.logPrivacyOperation('createAction', privacyContext);
    
    const id = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const interventionAction: InterventionAction = {
      id,
      ...action,
      createdAt: new Date()
    };
    
    this.actions.set(id, interventionAction);
    return interventionAction;
  }

  async executeAction(
    actionId: string,
    result: Record<string, any>,
    privacyContext: PrivacyContext
  ): Promise<InterventionAction> {
    this.logPrivacyOperation('executeAction', privacyContext);
    
    const action = this.actions.get(actionId);
    if (!action) {
      throw new Error(`Action with id ${actionId} not found`);
    }

    const updated = {
      ...action,
      status: 'executed' as const,
      executedAt: new Date(),
      result
    };

    this.actions.set(actionId, updated);
    return updated;
  }

  async getActionsByIntervention(
    interventionId: string,
    privacyContext: PrivacyContext
  ): Promise<InterventionAction[]> {
    this.logPrivacyOperation('getActionsByIntervention', privacyContext);
    
    return Array.from(this.actions.values())
      .filter(action => action.interventionId === interventionId);
  }

  async createTrigger(
    trigger: Omit<InterventionTrigger, 'id' | 'createdAt' | 'updatedAt'>,
    privacyContext: PrivacyContext
  ): Promise<InterventionTrigger> {
    this.logPrivacyOperation('createTrigger', privacyContext);
    
    const id = `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const interventionTrigger: InterventionTrigger = {
      id,
      ...trigger,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.triggers.set(id, interventionTrigger);
    return interventionTrigger;
  }

  async updateTrigger(
    triggerId: string,
    updates: Partial<Omit<InterventionTrigger, 'id' | 'createdAt' | 'updatedAt'>>,
    privacyContext: PrivacyContext
  ): Promise<InterventionTrigger> {
    this.logPrivacyOperation('updateTrigger', privacyContext);
    
    const existing = this.triggers.get(triggerId);
    if (!existing) {
      throw new Error(`Trigger with id ${triggerId} not found`);
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };

    this.triggers.set(triggerId, updated);
    return updated;
  }

  async getActiveTriggers(privacyContext: PrivacyContext): Promise<InterventionTrigger[]> {
    this.logPrivacyOperation('getActiveTriggers', privacyContext);
    
    return Array.from(this.triggers.values())
      .filter(trigger => trigger.active);
  }

  async checkTriggers(
    studentId: string,
    metrics: Record<string, any>,
    privacyContext: PrivacyContext
  ): Promise<{
    triggered: InterventionTrigger[];
    potentialInterventions: Omit<Intervention, 'id' | 'createdAt' | 'updatedAt'>[];
  }> {
    this.logPrivacyOperation('checkTriggers', privacyContext);
    
    const activeTriggers = await this.getActiveTriggers(privacyContext);
    const triggered: InterventionTrigger[] = [];
    const potentialInterventions: Omit<Intervention, 'id' | 'createdAt' | 'updatedAt'>[] = [];

    for (const trigger of activeTriggers) {
      if (this.evaluateTriggerConditions(trigger, metrics)) {
        triggered.push(trigger);
        
        // Generate potential intervention based on trigger
        const intervention: Omit<Intervention, 'id' | 'createdAt' | 'updatedAt'> = {
          studentId,
          type: trigger.type,
          severity: this.determineSeverityFromMetrics(metrics, trigger),
          status: 'pending',
          title: `${trigger.name} Detected`,
          description: `Trigger "${trigger.name}" has been activated based on current metrics.`,
          recommendedActions: trigger.actions,
          triggerMetrics: metrics,
          metadata: {
            triggerId: trigger.id,
            triggerName: trigger.name
          }
        };
        
        potentialInterventions.push(intervention);
      }
    }

    return { triggered, potentialInterventions };
  }

  async getAnalytics(
    filters: InterventionFilters,
    privacyContext: PrivacyContext
  ): Promise<InterventionAnalytics> {
    this.logPrivacyOperation('getAnalytics', privacyContext);
    
    const interventions = Array.from(this.interventions.values())
      .filter(intervention => this.applyFilters(intervention, filters))
      .filter(intervention => this.respectsPrivacyContext(intervention, privacyContext));

    const totalInterventions = interventions.length;
    const successfulOutcomes = Array.from(this.outcomes.values())
      .filter(outcome => ['successful', 'partially_successful'].includes(outcome.outcome)).length;

    const byType = interventions.reduce((acc, intervention) => {
      acc[intervention.type] = (acc[intervention.type] || 0) + 1;
      return acc;
    }, {} as Record<Intervention['type'], number>);

    const bySeverity = interventions.reduce((acc, intervention) => {
      acc[intervention.severity] = (acc[intervention.severity] || 0) + 1;
      return acc;
    }, {} as Record<Intervention['severity'], number>);

    const byStatus = interventions.reduce((acc, intervention) => {
      acc[intervention.status] = (acc[intervention.status] || 0) + 1;
      return acc;
    }, {} as Record<Intervention['status'], number>);

    return {
      totalInterventions,
      byType,
      bySeverity,
      byStatus,
      successRate: totalInterventions > 0 ? successfulOutcomes / totalInterventions : 0,
      averageResolutionTime: this.calculateAverageResolutionTime(interventions),
      trends: this.generateTrendData(interventions)
    };
  }

  async getEffectivenessMetrics(
    filters: InterventionFilters,
    privacyContext: PrivacyContext
  ): Promise<{
    type: Intervention['type'];
    totalInterventions: number;
    successRate: number;
    averageImpact: number;
    mostEffectiveActions: string[];
  }[]> {
    this.logPrivacyOperation('getEffectivenessMetrics', privacyContext);
    
    const interventions = Array.from(this.interventions.values())
      .filter(intervention => this.applyFilters(intervention, filters))
      .filter(intervention => this.respectsPrivacyContext(intervention, privacyContext));

    const typeGroups = interventions.reduce((acc, intervention) => {
      if (!acc[intervention.type]) {
        acc[intervention.type] = [];
      }
      acc[intervention.type].push(intervention);
      return acc;
    }, {} as Record<Intervention['type'], Intervention[]>);

    return Object.entries(typeGroups).map(([type, interventions]) => ({
      type: type as Intervention['type'],
      totalInterventions: interventions.length,
      successRate: 0.75, // Mock success rate
      averageImpact: 0.8, // Mock impact score
      mostEffectiveActions: ['notification', 'educator_alert'] // Mock effective actions
    }));
  }

  async findSimilarInterventions(
    studentId: string,
    metrics: Record<string, any>,
    privacyContext: PrivacyContext
  ): Promise<{
    intervention: Intervention;
    similarity: number;
    effectiveness: number;
  }[]> {
    this.logPrivacyOperation('findSimilarInterventions', privacyContext);
    
    // Mock similar interventions - in real implementation would use ML/similarity algorithms
    const interventions = Array.from(this.interventions.values())
      .filter(intervention => intervention.studentId !== studentId)
      .filter(intervention => this.respectsPrivacyContext(intervention, privacyContext))
      .slice(0, 5);

    return interventions.map(intervention => ({
      intervention,
      similarity: Math.random() * 0.5 + 0.5, // Mock similarity score 0.5-1.0
      effectiveness: Math.random() * 0.3 + 0.7 // Mock effectiveness score 0.7-1.0
    }));
  }

  async createBulkInterventions(
    interventions: Omit<Intervention, 'id' | 'createdAt' | 'updatedAt'>[],
    privacyContext: PrivacyContext
  ): Promise<Intervention[]> {
    this.logPrivacyOperation('createBulkInterventions', privacyContext);
    
    const created: Intervention[] = [];
    for (const intervention of interventions) {
      const result = await this.create(intervention);
      created.push(result);
    }
    return created;
  }

  // Helper methods and test utilities
  private logPrivacyOperation(operation: string, context: PrivacyContext) {
    this.privacyLogs.push({ operation, context, timestamp: new Date() });
  }

  private applyFilters(intervention: Intervention, filters: InterventionFilters): boolean {
    if (filters.studentId && intervention.studentId !== filters.studentId) return false;
    if (filters.assignmentId && intervention.assignmentId !== filters.assignmentId) return false;
    if (filters.type && intervention.type !== filters.type) return false;
    if (filters.severity && intervention.severity !== filters.severity) return false;
    if (filters.status && intervention.status !== filters.status) return false;
    if (filters.fromDate && intervention.createdAt < filters.fromDate) return false;
    if (filters.toDate && intervention.createdAt > filters.toDate) return false;
    if (filters.activeOnly && !['pending', 'active'].includes(intervention.status)) return false;
    
    return true;
  }

  private respectsPrivacyContext(intervention: Intervention, context: PrivacyContext): boolean {
    // Basic privacy filtering
    return context.requesterType === 'admin' || 
           context.requesterType === 'educator' ||
           (context.requesterType === 'student' && intervention.studentId === context.requesterId);
  }

  private evaluateTriggerConditions(trigger: InterventionTrigger, metrics: Record<string, any>): boolean {
    // Mock trigger evaluation - in real implementation would evaluate actual conditions
    return Math.random() > 0.7; // 30% chance of triggering
  }

  private determineSeverityFromMetrics(metrics: Record<string, any>, trigger: InterventionTrigger): Intervention['severity'] {
    // Mock severity determination based on metrics
    const values = Object.values(metrics).filter(v => typeof v === 'number') as number[];
    const avgValue = values.reduce((sum, v) => sum + v, 0) / values.length;
    
    if (avgValue < 0.3) return 'critical';
    if (avgValue < 0.6) return 'high';
    if (avgValue < 0.8) return 'medium';
    return 'low';
  }

  private calculateAverageResolutionTime(interventions: Intervention[]): number {
    const resolved = interventions.filter(i => i.resolvedAt);
    if (resolved.length === 0) return 0;
    
    const totalTime = resolved.reduce((sum, intervention) => {
      const resolutionTime = intervention.resolvedAt!.getTime() - intervention.createdAt.getTime();
      return sum + resolutionTime;
    }, 0);
    
    return totalTime / resolved.length / (1000 * 60 * 60); // Convert to hours
  }

  private generateTrendData(interventions: Intervention[]): any[] {
    // Mock trend data generation
    const now = new Date();
    const trends = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      trends.push({
        date,
        count: Math.floor(Math.random() * 10),
        successRate: Math.random() * 0.3 + 0.7
      });
    }
    
    return trends;
  }

  // Test utilities
  getPrivacyLogs() {
    return this.privacyLogs;
  }

  clearPrivacyLogs() {
    this.privacyLogs = [];
  }

  reset() {
    this.interventions.clear();
    this.actions.clear();
    this.triggers.clear();
    this.outcomes.clear();
    this.privacyLogs = [];
    this.seedTestData();
  }

  private seedTestData() {
    // Add test intervention
    const testIntervention = {
      studentId: 'student_1',
      assignmentId: 'assignment_1',
      type: 'progress' as const,
      severity: 'medium' as const,
      status: 'pending' as const,
      title: 'Writing Progress Concern',
      description: 'Student may need additional support with writing progress.',
      recommendedActions: ['Schedule check-in', 'Provide resources'],
      triggerMetrics: { progress: 0.4, quality: 0.6 }
    };

    this.create(testIntervention);

    // Add test trigger
    const testTrigger = {
      name: 'Low Progress Alert',
      type: 'progress' as const,
      conditions: { progress: { lt: 0.5 } },
      thresholds: { progress: 0.5 },
      actions: ['notification', 'educator_alert'],
      active: true
    };

    const triggerId = `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const trigger: InterventionTrigger = {
      id: triggerId,
      ...testTrigger,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.triggers.set(triggerId, trigger);
  }
}