// Automated strategy review system that triggers reviews based on conditions
import { v4 as uuidv4 } from 'uuid';
import { TechnicalMilestone } from './technicalMilestoneTracker.js';
import { BusinessGoal, StrategyConversation } from '../types/index.js';
import { ProgressCorrelation } from './progressCorrelationEngine.js';

export interface StrategyReviewTrigger {
  id: string;
  name: string;
  type: 'milestone-based' | 'time-based' | 'metric-based' | 'event-based' | 'threshold-based';
  enabled: boolean;
  conditions: TriggerCondition[];
  actions: TriggerAction[];
  lastTriggered?: string;
  triggerCount: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  created: string;
}

export interface TriggerCondition {
  id: string;
  type: 'milestone-completion' | 'time-elapsed' | 'goal-health' | 'correlation-strength' | 
        'revenue-target' | 'competitive-threat' | 'strategy-gap' | 'custom';
  parameters: Record<string, any>;
  operator: 'equals' | 'greater-than' | 'less-than' | 'contains' | 'between';
  value: any;
  description: string;
}

export interface TriggerAction {
  id: string;
  type: 'create-review' | 'send-alert' | 'update-forecast' | 'generate-report' | 'schedule-meeting';
  parameters: Record<string, any>;
  templateId?: string;
  recipients?: string[];
}

export interface StrategyReview {
  id: string;
  triggerId: string;
  triggerReason: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created: string;
  scheduled?: string;
  completed?: string;
  
  reviewScope: {
    milestones: string[];
    goals: string[];
    timeframe: string;
    focusAreas: string[];
  };
  
  reviewQuestions: ReviewQuestion[];
  recommendations: string[];
  decisions: ReviewDecision[];
  nextSteps: string[];
}

export interface ReviewQuestion {
  id: string;
  question: string;
  category: 'strategic' | 'tactical' | 'operational' | 'competitive';
  priority: 'must-answer' | 'should-answer' | 'nice-to-have';
  context: string;
  suggestedData: string[];
}

export interface ReviewDecision {
  id: string;
  decision: string;
  rationale: string;
  impact: 'high' | 'medium' | 'low';
  implementation: string;
  owner: string;
  deadline: string;
}

export class StrategyReviewAutomation {
  private triggers: Map<string, StrategyReviewTrigger> = new Map();
  private reviews: Map<string, StrategyReview> = new Map();
  private defaultTriggers: StrategyReviewTrigger[] = [];

  constructor() {
    this.initializeDefaultTriggers();
  }

  private initializeDefaultTriggers() {
    // Milestone completion trigger
    this.defaultTriggers.push({
      id: 'milestone-completion-trigger',
      name: 'Critical Milestone Completion Review',
      type: 'milestone-based',
      enabled: true,
      conditions: [{
        id: 'critical-milestone',
        type: 'milestone-completion',
        parameters: { importance: 'critical', marketTiming: 'critical' },
        operator: 'equals',
        value: true,
        description: 'Triggers when a critical milestone is completed'
      }],
      actions: [{
        id: 'create-strategic-review',
        type: 'create-review',
        parameters: { 
          reviewType: 'milestone-impact',
          urgency: 'high',
          template: 'technical-milestone-strategic-review'
        }
      }],
      triggerCount: 0,
      priority: 'high',
      created: new Date().toISOString()
    });

    // Goal health trigger
    this.defaultTriggers.push({
      id: 'goal-health-trigger',
      name: 'Low Goal Health Alert',
      type: 'metric-based',
      enabled: true,
      conditions: [{
        id: 'low-health-score',
        type: 'goal-health',
        parameters: { metric: 'healthScore' },
        operator: 'less-than',
        value: 40,
        description: 'Triggers when goal health drops below 40%'
      }],
      actions: [{
        id: 'urgent-review',
        type: 'create-review',
        parameters: { 
          reviewType: 'goal-recovery',
          urgency: 'critical',
          template: 'goal-health-crisis'
        }
      }],
      triggerCount: 0,
      priority: 'critical',
      created: new Date().toISOString()
    });

    // Quarterly strategy review
    this.defaultTriggers.push({
      id: 'quarterly-review-trigger',
      name: 'Quarterly Strategic Review',
      type: 'time-based',
      enabled: true,
      conditions: [{
        id: 'quarterly-elapsed',
        type: 'time-elapsed',
        parameters: { unit: 'days', lastReview: 'quarterly-strategic' },
        operator: 'greater-than',
        value: 90,
        description: 'Triggers every 90 days for quarterly review'
      }],
      actions: [{
        id: 'quarterly-comprehensive',
        type: 'create-review',
        parameters: { 
          reviewType: 'quarterly-comprehensive',
          template: 'quarterly-strategy-review',
          includeAllGoals: true,
          includeAllMilestones: true
        }
      }],
      triggerCount: 0,
      priority: 'medium',
      created: new Date().toISOString()
    });

    // Competitive threat trigger
    this.defaultTriggers.push({
      id: 'competitive-threat-trigger',
      name: 'Competitive Threat Response',
      type: 'event-based',
      enabled: true,
      conditions: [{
        id: 'high-threat-detected',
        type: 'competitive-threat',
        parameters: { threatLevel: 'high', probability: 50 },
        operator: 'greater-than',
        value: 50,
        description: 'Triggers when high probability competitive threat detected'
      }],
      actions: [{
        id: 'competitive-response',
        type: 'create-review',
        parameters: { 
          reviewType: 'competitive-response',
          urgency: 'high',
          template: 'competitive-threat-analysis'
        }
      }],
      triggerCount: 0,
      priority: 'high',
      created: new Date().toISOString()
    });

    // Strategy gap trigger
    this.defaultTriggers.push({
      id: 'strategy-gap-trigger',
      name: 'Critical Strategy Gap Detection',
      type: 'threshold-based',
      enabled: true,
      conditions: [{
        id: 'critical-gap',
        type: 'strategy-gap',
        parameters: { severity: 'critical', category: 'any' },
        operator: 'equals',
        value: true,
        description: 'Triggers when critical strategy gaps are identified'
      }],
      actions: [{
        id: 'gap-remediation',
        type: 'create-review',
        parameters: { 
          reviewType: 'gap-remediation',
          urgency: 'critical',
          template: 'strategy-gap-planning'
        }
      }],
      triggerCount: 0,
      priority: 'critical',
      created: new Date().toISOString()
    });
  }

  evaluateTriggers(
    milestones: TechnicalMilestone[],
    goals: BusinessGoal[],
    correlations: ProgressCorrelation[],
    conversations: StrategyConversation[],
    additionalContext?: {
      competitiveThreats?: any[];
      strategyGaps?: any[];
      marketEvents?: any[];
    }
  ): StrategyReview[] {
    const triggeredReviews: StrategyReview[] = [];

    // Initialize default triggers if not already done
    if (this.triggers.size === 0) {
      this.defaultTriggers.forEach(trigger => {
        this.triggers.set(trigger.id, trigger);
      });
    }

    // Evaluate each trigger
    this.triggers.forEach(trigger => {
      if (!trigger.enabled) return;

      const shouldTrigger = this.evaluateTriggerConditions(
        trigger,
        milestones,
        goals,
        correlations,
        conversations,
        additionalContext
      );

      if (shouldTrigger) {
        const review = this.createReviewFromTrigger(
          trigger,
          milestones,
          goals,
          this.getTriggerReason(trigger, milestones, goals, additionalContext)
        );
        
        triggeredReviews.push(review);
        
        // Update trigger metadata
        trigger.lastTriggered = new Date().toISOString();
        trigger.triggerCount++;
      }
    });

    return triggeredReviews;
  }

  private evaluateTriggerConditions(
    trigger: StrategyReviewTrigger,
    milestones: TechnicalMilestone[],
    goals: BusinessGoal[],
    correlations: ProgressCorrelation[],
    conversations: StrategyConversation[],
    context?: any
  ): boolean {
    
    // All conditions must be met (AND logic)
    return trigger.conditions.every(condition => {
      switch (condition.type) {
        case 'milestone-completion':
          return this.evaluateMilestoneCondition(condition, milestones);
        
        case 'time-elapsed':
          return this.evaluateTimeCondition(condition, conversations);
        
        case 'goal-health':
          return this.evaluateGoalHealthCondition(condition, goals);
        
        case 'correlation-strength':
          return this.evaluateCorrelationCondition(condition, correlations);
        
        case 'competitive-threat':
          return this.evaluateCompetitiveThreatCondition(condition, context?.competitiveThreats);
        
        case 'strategy-gap':
          return this.evaluateStrategyGapCondition(condition, context?.strategyGaps);
        
        default:
          return false;
      }
    });
  }

  private evaluateMilestoneCondition(condition: TriggerCondition, milestones: TechnicalMilestone[]): boolean {
    const criticalMilestones = milestones.filter(m => 
      m.status === 'completed' &&
      m.businessContext.strategicImportance >= 80 &&
      m.businessContext.marketTiming === 'critical'
    );

    // Check if any critical milestone was completed recently (last 7 days)
    const recentCritical = criticalMilestones.some(m => {
      if (!m.completionDate) return false;
      const daysSinceCompletion = (Date.now() - new Date(m.completionDate).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCompletion <= 7;
    });

    return recentCritical;
  }

  private evaluateTimeCondition(condition: TriggerCondition, conversations: StrategyConversation[]): boolean {
    const relevantConversations = conversations.filter(c => 
      c.type === condition.parameters.lastReview
    );

    if (relevantConversations.length === 0) return true; // No previous review, should trigger

    const lastReview = relevantConversations
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    const daysSinceLastReview = (Date.now() - new Date(lastReview.timestamp).getTime()) / (1000 * 60 * 60 * 24);

    return this.evaluateOperator(daysSinceLastReview, condition.operator, condition.value);
  }

  private evaluateGoalHealthCondition(condition: TriggerCondition, goals: BusinessGoal[]): boolean {
    // Check if any goal has critically low health
    return goals.some(goal => {
      const healthScore = this.calculateGoalHealth(goal);
      return this.evaluateOperator(healthScore, condition.operator, condition.value);
    });
  }

  private evaluateCorrelationCondition(condition: TriggerCondition, correlations: ProgressCorrelation[]): boolean {
    const avgCorrelation = correlations.reduce((sum, c) => sum + Math.abs(c.correlationStrength), 0) / correlations.length;
    return this.evaluateOperator(avgCorrelation, condition.operator, condition.value);
  }

  private evaluateCompetitiveThreatCondition(condition: TriggerCondition, threats?: any[]): boolean {
    if (!threats || threats.length === 0) return false;

    return threats.some(threat => 
      threat.probability >= condition.value && 
      threat.impact === 'critical'
    );
  }

  private evaluateStrategyGapCondition(condition: TriggerCondition, gaps?: any[]): boolean {
    if (!gaps || gaps.length === 0) return false;

    return gaps.some(gap => 
      gap.severity === condition.parameters.severity
    );
  }

  private evaluateOperator(value: any, operator: string, target: any): boolean {
    switch (operator) {
      case 'equals':
        return value === target;
      case 'greater-than':
        return value > target;
      case 'less-than':
        return value < target;
      case 'between':
        return value >= target[0] && value <= target[1];
      case 'contains':
        return String(value).includes(String(target));
      default:
        return false;
    }
  }

  private calculateGoalHealth(goal: BusinessGoal): number {
    // Simplified health calculation
    const progressWeight = 0.4;
    const confidenceWeight = 0.3;
    const momentumWeight = 0.3;

    // Calculate progress score
    const progressScore = goal.milestones.filter(m => m.status === 'completed').length / goal.milestones.length * 100;
    
    // Use confidence directly
    const confidenceScore = goal.confidence || 50;
    
    // Calculate momentum (simplified - would normally look at progress history)
    const momentumScore = goal.status === 'active' ? 70 : 30;

    return (
      progressScore * progressWeight +
      confidenceScore * confidenceWeight +
      momentumScore * momentumWeight
    );
  }

  private createReviewFromTrigger(
    trigger: StrategyReviewTrigger,
    milestones: TechnicalMilestone[],
    goals: BusinessGoal[],
    triggerReason: string
  ): StrategyReview {
    
    const review: StrategyReview = {
      id: uuidv4(),
      triggerId: trigger.id,
      triggerReason,
      status: 'pending',
      priority: trigger.priority,
      created: new Date().toISOString(),
      scheduled: this.calculateReviewSchedule(trigger.priority),
      
      reviewScope: {
        milestones: this.selectRelevantMilestones(trigger, milestones),
        goals: this.selectRelevantGoals(trigger, goals),
        timeframe: this.determineReviewTimeframe(trigger),
        focusAreas: this.determineFocusAreas(trigger)
      },
      
      reviewQuestions: this.generateReviewQuestions(trigger, triggerReason),
      recommendations: [],
      decisions: [],
      nextSteps: []
    };

    // Store the review
    this.reviews.set(review.id, review);

    return review;
  }

  private getTriggerReason(
    trigger: StrategyReviewTrigger,
    milestones: TechnicalMilestone[],
    goals: BusinessGoal[],
    context?: any
  ): string {
    switch (trigger.type) {
      case 'milestone-based':
        const criticalMilestone = milestones.find(m => 
          m.status === 'completed' && 
          m.businessContext.strategicImportance >= 80
        );
        return `Critical milestone "${criticalMilestone?.name}" completed - strategic impact assessment needed`;
      
      case 'metric-based':
        const lowHealthGoal = goals.find(g => this.calculateGoalHealth(g) < 40);
        return `Goal "${lowHealthGoal?.title}" health critically low - intervention required`;
      
      case 'time-based':
        return `Scheduled ${trigger.name} - regular strategic review cycle`;
      
      case 'event-based':
        return `Competitive threat detected - strategic response planning required`;
      
      case 'threshold-based':
        return `Critical strategy gap identified - remediation planning needed`;
      
      default:
        return `Strategic review triggered by ${trigger.name}`;
    }
  }

  private calculateReviewSchedule(priority: string): string {
    const now = new Date();
    
    switch (priority) {
      case 'critical':
        // Schedule within 24 hours
        now.setHours(now.getHours() + 24);
        break;
      case 'high':
        // Schedule within 3 days
        now.setDate(now.getDate() + 3);
        break;
      case 'medium':
        // Schedule within 1 week
        now.setDate(now.getDate() + 7);
        break;
      case 'low':
        // Schedule within 2 weeks
        now.setDate(now.getDate() + 14);
        break;
    }
    
    return now.toISOString();
  }

  private selectRelevantMilestones(trigger: StrategyReviewTrigger, milestones: TechnicalMilestone[]): string[] {
    switch (trigger.type) {
      case 'milestone-based':
        // Include recently completed critical milestones
        return milestones
          .filter(m => m.status === 'completed' && m.businessContext.strategicImportance >= 70)
          .slice(0, 5)
          .map(m => m.id);
      
      case 'time-based':
        // Include all milestones from the review period
        return milestones.map(m => m.id);
      
      default:
        // Include in-progress and recently completed
        return milestones
          .filter(m => m.status === 'in-progress' || m.status === 'completed')
          .slice(0, 10)
          .map(m => m.id);
    }
  }

  private selectRelevantGoals(trigger: StrategyReviewTrigger, goals: BusinessGoal[]): string[] {
    switch (trigger.type) {
      case 'metric-based':
        // Focus on unhealthy goals
        return goals
          .filter(g => this.calculateGoalHealth(g) < 60)
          .map(g => g.id);
      
      case 'time-based':
        // Include all active goals
        return goals
          .filter(g => g.status === 'active' || g.status === 'blocked')
          .map(g => g.id);
      
      default:
        // Include high-priority goals
        return goals
          .filter(g => g.confidence >= 70)
          .map(g => g.id);
    }
  }

  private determineReviewTimeframe(trigger: StrategyReviewTrigger): string {
    switch (trigger.type) {
      case 'time-based':
        return '90-days'; // Quarterly review
      case 'milestone-based':
        return '30-days'; // Recent activity
      default:
        return '60-days'; // Default lookback
    }
  }

  private determineFocusAreas(trigger: StrategyReviewTrigger): string[] {
    switch (trigger.type) {
      case 'milestone-based':
        return ['technical-achievement', 'market-impact', 'revenue-opportunity'];
      case 'metric-based':
        return ['goal-health', 'execution-barriers', 'resource-allocation'];
      case 'event-based':
        return ['competitive-response', 'market-positioning', 'strategic-defense'];
      case 'time-based':
        return ['overall-progress', 'strategic-alignment', 'future-planning'];
      default:
        return ['general-review'];
    }
  }

  private generateReviewQuestions(trigger: StrategyReviewTrigger, reason: string): ReviewQuestion[] {
    const questions: ReviewQuestion[] = [];

    // Add trigger-specific questions
    switch (trigger.type) {
      case 'milestone-based':
        questions.push(
          {
            id: uuidv4(),
            question: 'How does this milestone achievement change our competitive position?',
            category: 'strategic',
            priority: 'must-answer',
            context: reason,
            suggestedData: ['competitive analysis', 'market positioning metrics']
          },
          {
            id: uuidv4(),
            question: 'What immediate go-to-market opportunities does this create?',
            category: 'tactical',
            priority: 'must-answer',
            context: 'New capabilities often create sales opportunities',
            suggestedData: ['customer feedback', 'sales pipeline']
          }
        );
        break;
      
      case 'metric-based':
        questions.push(
          {
            id: uuidv4(),
            question: 'What are the root causes of the goal health decline?',
            category: 'operational',
            priority: 'must-answer',
            context: reason,
            suggestedData: ['progress history', 'blocker analysis']
          },
          {
            id: uuidv4(),
            question: 'Should we pivot, persevere, or abandon this goal?',
            category: 'strategic',
            priority: 'must-answer',
            context: 'Low health may indicate fundamental issues',
            suggestedData: ['market validation', 'resource constraints']
          }
        );
        break;
      
      case 'event-based':
        questions.push(
          {
            id: uuidv4(),
            question: 'How quickly must we respond to this competitive threat?',
            category: 'competitive',
            priority: 'must-answer',
            context: reason,
            suggestedData: ['threat timeline', 'response options']
          },
          {
            id: uuidv4(),
            question: 'What unique advantages can we leverage in our response?',
            category: 'strategic',
            priority: 'must-answer',
            context: 'Focus on differentiation rather than feature parity',
            suggestedData: ['competitive advantages', 'unique capabilities']
          }
        );
        break;
    }

    // Add standard strategic questions
    questions.push(
      {
        id: uuidv4(),
        question: 'Are our current priorities still aligned with market opportunities?',
        category: 'strategic',
        priority: 'should-answer',
        context: 'Regular validation of strategic direction',
        suggestedData: ['market trends', 'customer feedback']
      },
      {
        id: uuidv4(),
        question: 'What strategic decisions need to be made in the next 30 days?',
        category: 'tactical',
        priority: 'should-answer',
        context: 'Identify upcoming decision points',
        suggestedData: ['roadmap', 'milestone dependencies']
      }
    );

    return questions;
  }

  createCustomTrigger(trigger: Omit<StrategyReviewTrigger, 'id' | 'created' | 'triggerCount'>): StrategyReviewTrigger {
    const newTrigger: StrategyReviewTrigger = {
      ...trigger,
      id: uuidv4(),
      created: new Date().toISOString(),
      triggerCount: 0
    };

    this.triggers.set(newTrigger.id, newTrigger);
    return newTrigger;
  }

  updateTrigger(triggerId: string, updates: Partial<StrategyReviewTrigger>): StrategyReviewTrigger | null {
    const trigger = this.triggers.get(triggerId);
    if (!trigger) return null;

    const updatedTrigger = { ...trigger, ...updates };
    this.triggers.set(triggerId, updatedTrigger);
    return updatedTrigger;
  }

  getTriggers(): StrategyReviewTrigger[] {
    return Array.from(this.triggers.values());
  }

  getReviews(status?: string): StrategyReview[] {
    const reviews = Array.from(this.reviews.values());
    if (status) {
      return reviews.filter(r => r.status === status);
    }
    return reviews;
  }

  completeReview(
    reviewId: string,
    decisions: ReviewDecision[],
    nextSteps: string[]
  ): StrategyReview | null {
    const review = this.reviews.get(reviewId);
    if (!review) return null;

    review.status = 'completed';
    review.completed = new Date().toISOString();
    review.decisions = decisions;
    review.nextSteps = nextSteps;

    this.reviews.set(reviewId, review);
    return review;
  }
}