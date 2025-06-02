// Progress correlation engine that connects technical milestones to business outcomes
import { TechnicalMilestone, BusinessImpactProjection } from './technicalMilestoneTracker.js';
import { BusinessGoal, StrategyConversation } from '../types/index.js';

export interface CorrelationInsight {
  id: string;
  type: 'positive' | 'negative' | 'neutral' | 'unexpected';
  strength: number; // 0-100
  description: string;
  technicalPattern: string;
  businessOutcome: string;
  evidence: string[];
  confidence: number; // 0-100
  recommendations: string[];
  timeframe: string;
}

export interface ProgressCorrelation {
  technicalMilestoneId: string;
  businessGoalId: string;
  correlationStrength: number; // -100 to 100
  impactDelay: number; // Days between technical completion and business impact
  multiplierEffect: number; // How much business progress per unit of technical progress
  lastUpdated: string;
}

export interface PredictiveModel {
  id: string;
  name: string;
  description: string;
  accuracy: number; // 0-100 based on historical predictions
  parameters: {
    technicalFactors: string[];
    businessFactors: string[];
    externalFactors: string[];
  };
  predictions: PredictiveInsight[];
  lastTraining: string;
}

export interface PredictiveInsight {
  id: string;
  type: 'revenue-projection' | 'milestone-impact' | 'risk-alert' | 'opportunity-identification';
  prediction: string;
  confidence: number; // 0-100
  timeframe: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  supporting_data: string[];
  generated: string;
}

export class ProgressCorrelationEngine {
  private correlations: Map<string, ProgressCorrelation> = new Map();
  private insights: Map<string, CorrelationInsight> = new Map();
  private models: Map<string, PredictiveModel> = new Map();

  constructor() {
    this.initializeScribeTreeModels();
  }

  private initializeScribeTreeModels() {
    // Scribe Tree specific predictive models based on educational technology patterns
    const privacyModel: PredictiveModel = {
      id: 'privacy-business-impact',
      name: 'Privacy Implementation Business Impact Model',
      description: 'Predicts business outcomes from privacy-by-design implementations',
      accuracy: 85,
      parameters: {
        technicalFactors: ['gdpr-compliance', 'ferpa-compliance', 'encryption-strength', 'audit-completeness'],
        businessFactors: ['institutional-trust', 'regulatory-requirements', 'competitive-positioning'],
        externalFactors: ['privacy-regulation-trends', 'educational-policy-changes', 'market-awareness']
      },
      predictions: [],
      lastTraining: new Date().toISOString()
    };

    const aiPhilosophyModel: PredictiveModel = {
      id: 'bounded-enhancement-impact',
      name: 'Bounded Enhancement Market Impact Model',
      description: 'Predicts market response to anti-dependency AI approach',
      accuracy: 90,
      parameters: {
        technicalFactors: ['ai-boundary-sophistication', 'reflection-quality-assessment', 'transparency-level'],
        businessFactors: ['educator-adoption', 'student-engagement', 'academic-integrity-improvement'],
        externalFactors: ['ai-dependency-awareness', 'educational-ai-regulation', 'competitor-approaches']
      },
      predictions: [],
      lastTraining: new Date().toISOString()
    };

    const architectureModel: PredictiveModel = {
      id: 'microservices-scalability',
      name: 'Microservices Architecture Business Scaling Model',
      description: 'Predicts scalability and business growth from architecture improvements',
      accuracy: 78,
      parameters: {
        technicalFactors: ['service-decomposition', 'performance-improvement', 'deployment-frequency'],
        businessFactors: ['customer-growth', 'feature-velocity', 'operational-efficiency'],
        externalFactors: ['market-demand', 'competitive-pressure', 'technical-talent-availability']
      },
      predictions: [],
      lastTraining: new Date().toISOString()
    };

    this.models.set(privacyModel.id, privacyModel);
    this.models.set(aiPhilosophyModel.id, aiPhilosophyModel);
    this.models.set(architectureModel.id, architectureModel);
  }

  analyzeCorrelation(
    milestone: TechnicalMilestone, 
    businessGoals: BusinessGoal[], 
    historicalData?: { milestones: TechnicalMilestone[], goals: BusinessGoal[] }
  ): ProgressCorrelation[] {
    const correlations: ProgressCorrelation[] = [];

    for (const goal of businessGoals) {
      const correlation = this.calculateCorrelation(milestone, goal, historicalData);
      if (correlation.correlationStrength >= 30) { // Only track meaningful correlations
        correlations.push(correlation);
        this.correlations.set(`${milestone.id}-${goal.id}`, correlation);
      }
    }

    return correlations;
  }

  private calculateCorrelation(
    milestone: TechnicalMilestone, 
    goal: BusinessGoal, 
    historicalData?: { milestones: TechnicalMilestone[], goals: BusinessGoal[] }
  ): ProgressCorrelation {
    let correlationStrength = 0;
    let impactDelay = 30; // Default 30 days
    let multiplierEffect = 1.0;

    // Direct goal linkage
    if (milestone.linkedGoals.includes(goal.id)) {
      correlationStrength += 40;
      impactDelay = 7; // Direct links have faster impact
      multiplierEffect = 1.5;
    }

    // Category-based correlation analysis
    correlationStrength += this.analyzeCategoryCorrelation(milestone, goal);

    // Strategic importance alignment
    const importanceAlignment = this.calculateImportanceAlignment(milestone, goal);
    correlationStrength += importanceAlignment;

    // Historical pattern analysis
    if (historicalData) {
      const historicalPattern = this.analyzeHistoricalPatterns(milestone, goal, historicalData);
      correlationStrength += historicalPattern.strengthAdjustment;
      impactDelay = historicalPattern.delayAdjustment;
      multiplierEffect = historicalPattern.multiplierAdjustment;
    }

    // Scribe Tree specific correlation patterns
    const scribeTreeBonus = this.calculateScribeTreeSpecificCorrelation(milestone, goal);
    correlationStrength += scribeTreeBonus;

    return {
      technicalMilestoneId: milestone.id,
      businessGoalId: goal.id,
      correlationStrength: Math.min(100, Math.max(-100, correlationStrength)),
      impactDelay,
      multiplierEffect,
      lastUpdated: new Date().toISOString()
    };
  }

  private analyzeCategoryCorrelation(milestone: TechnicalMilestone, goal: BusinessGoal): number {
    const correlationMatrix: Record<string, Record<string, number>> = {
      'architecture': {
        'technical': 30,
        'operational': 25,
        'revenue': 15,
        'product': 20,
        'market': 10
      },
      'security': {
        'technical': 20,
        'operational': 15,
        'revenue': 25,
        'product': 20,
        'market': 30
      },
      'feature': {
        'technical': 15,
        'operational': 10,
        'revenue': 30,
        'product': 35,
        'market': 25
      },
      'performance': {
        'technical': 25,
        'operational': 30,
        'revenue': 20,
        'product': 25,
        'market': 15
      },
      'integration': {
        'technical': 20,
        'operational': 25,
        'revenue': 20,
        'product': 30,
        'market': 20
      },
      'infrastructure': {
        'technical': 35,
        'operational': 30,
        'revenue': 10,
        'product': 15,
        'market': 5
      }
    };

    return correlationMatrix[milestone.category]?.[goal.category] || 0;
  }

  private calculateImportanceAlignment(milestone: TechnicalMilestone, goal: BusinessGoal): number {
    const milestoneImportance = milestone.businessContext.strategicImportance;
    const goalImportance = goal.confidence; // Using confidence as proxy for importance
    
    const alignmentScore = 100 - Math.abs(milestoneImportance - goalImportance);
    return Math.round(alignmentScore * 0.2); // Scale to 0-20 points
  }

  private analyzeHistoricalPatterns(
    milestone: TechnicalMilestone, 
    goal: BusinessGoal, 
    historicalData: { milestones: TechnicalMilestone[], goals: BusinessGoal[] }
  ): { strengthAdjustment: number, delayAdjustment: number, multiplierAdjustment: number } {
    // Find similar historical milestones
    const similarMilestones = historicalData.milestones.filter(m => 
      m.category === milestone.category && 
      Math.abs(m.businessContext.strategicImportance - milestone.businessContext.strategicImportance) < 20
    );

    if (similarMilestones.length === 0) {
      return { strengthAdjustment: 0, delayAdjustment: 30, multiplierAdjustment: 1.0 };
    }

    // Calculate average historical performance
    const completedSimilar = similarMilestones.filter(m => m.status === 'completed');
    const successRate = completedSimilar.length / similarMilestones.length;
    
    let strengthAdjustment = 0;
    let delayAdjustment = 30;
    let multiplierAdjustment = 1.0;

    if (successRate > 0.8) {
      strengthAdjustment = 15;
      delayAdjustment = 20;
      multiplierAdjustment = 1.3;
    } else if (successRate > 0.6) {
      strengthAdjustment = 5;
      delayAdjustment = 25;
      multiplierAdjustment = 1.1;
    } else if (successRate < 0.4) {
      strengthAdjustment = -10;
      delayAdjustment = 45;
      multiplierAdjustment = 0.8;
    }

    return { strengthAdjustment, delayAdjustment, multiplierAdjustment };
  }

  private calculateScribeTreeSpecificCorrelation(milestone: TechnicalMilestone, goal: BusinessGoal): number {
    let bonus = 0;

    // Privacy-revenue correlation (strong in education market)
    if (milestone.name.toLowerCase().includes('privacy') && goal.category === 'revenue') {
      bonus += 25;
    }

    // AI philosophy-market correlation (unique positioning)
    if (milestone.name.toLowerCase().includes('bounded enhancement') && goal.category === 'market') {
      bonus += 30;
    }

    // Microservices-scaling correlation
    if (milestone.name.toLowerCase().includes('microservices') && goal.category === 'technical') {
      bonus += 20;
    }

    // Educational AI-product correlation
    if (milestone.name.toLowerCase().includes('educational') && goal.category === 'product') {
      bonus += 20;
    }

    return bonus;
  }

  generateCorrelationInsights(correlations: ProgressCorrelation[], milestones: TechnicalMilestone[], goals: BusinessGoal[]): CorrelationInsight[] {
    const insights: CorrelationInsight[] = [];

    // Strong positive correlations
    const strongPositive = correlations.filter(c => c.correlationStrength >= 70);
    for (const correlation of strongPositive) {
      const insight = this.createCorrelationInsight(correlation, milestones, goals, 'positive');
      if (insight) insights.push(insight);
    }

    // Unexpected patterns
    const unexpected = correlations.filter(c => 
      Math.abs(c.correlationStrength) >= 50 && 
      this.isUnexpectedPattern(c, milestones, goals)
    );
    for (const correlation of unexpected) {
      const insight = this.createCorrelationInsight(correlation, milestones, goals, 'unexpected');
      if (insight) insights.push(insight);
    }

    // Store insights
    insights.forEach(insight => this.insights.set(insight.id, insight));

    return insights;
  }

  private createCorrelationInsight(
    correlation: ProgressCorrelation, 
    milestones: TechnicalMilestone[], 
    goals: BusinessGoal[], 
    type: CorrelationInsight['type']
  ): CorrelationInsight | null {
    const milestone = milestones.find(m => m.id === correlation.technicalMilestoneId);
    const goal = goals.find(g => g.id === correlation.businessGoalId);

    if (!milestone || !goal) return null;

    const insightId = `insight-${correlation.technicalMilestoneId}-${correlation.businessGoalId}`;

    let description = '';
    let recommendations: string[] = [];

    if (type === 'positive') {
      description = `Strong positive correlation (${correlation.correlationStrength}%) between ${milestone.name} and ${goal.title}. Expected business impact in ${correlation.impactDelay} days with ${correlation.multiplierEffect}x multiplier effect.`;
      recommendations = [
        'Prioritize completion of this technical milestone for maximum business impact',
        'Prepare business processes to capitalize on expected outcomes',
        'Monitor progress closely and adjust business strategy as needed'
      ];
    } else if (type === 'unexpected') {
      description = `Unexpected strong correlation (${correlation.correlationStrength}%) discovered between ${milestone.name} and ${goal.title}. This pattern was not initially anticipated.`;
      recommendations = [
        'Investigate the underlying reasons for this correlation',
        'Consider adjusting business strategy to leverage this unexpected connection',
        'Document this pattern for future strategic planning'
      ];
    }

    return {
      id: insightId,
      type,
      strength: Math.abs(correlation.correlationStrength),
      description,
      technicalPattern: milestone.name,
      businessOutcome: goal.title,
      evidence: [
        `Correlation strength: ${correlation.correlationStrength}%`,
        `Impact delay: ${correlation.impactDelay} days`,
        `Multiplier effect: ${correlation.multiplierEffect}x`
      ],
      confidence: this.calculateInsightConfidence(correlation, milestone, goal),
      recommendations,
      timeframe: `${correlation.impactDelay} days`
    };
  }

  private isUnexpectedPattern(correlation: ProgressCorrelation, milestones: TechnicalMilestone[], goals: BusinessGoal[]): boolean {
    const milestone = milestones.find(m => m.id === correlation.technicalMilestoneId);
    const goal = goals.find(g => g.id === correlation.businessGoalId);

    if (!milestone || !goal) return false;

    // Pattern is unexpected if categories don't typically correlate strongly
    const expectedCorrelation = this.analyzeCategoryCorrelation(milestone, goal);
    return Math.abs(correlation.correlationStrength) > expectedCorrelation + 30;
  }

  private calculateInsightConfidence(correlation: ProgressCorrelation, milestone: TechnicalMilestone, goal: BusinessGoal): number {
    let confidence = 50; // Base confidence

    // Higher confidence for direct links
    if (milestone.linkedGoals.includes(goal.id)) {
      confidence += 30;
    }

    // Higher confidence for strong correlations
    if (Math.abs(correlation.correlationStrength) >= 80) {
      confidence += 20;
    } else if (Math.abs(correlation.correlationStrength) >= 60) {
      confidence += 10;
    }

    // Higher confidence for completed milestones
    if (milestone.status === 'completed') {
      confidence += 15;
    }

    // Adjust for strategic importance
    if (milestone.businessContext.strategicImportance >= 80) {
      confidence += 10;
    }

    return Math.min(100, confidence);
  }

  generatePredictiveInsights(milestones: TechnicalMilestone[], goals: BusinessGoal[]): PredictiveInsight[] {
    const insights: PredictiveInsight[] = [];

    // Revenue projections based on milestone completion trends
    const revenueInsights = this.generateRevenueProjections(milestones, goals);
    insights.push(...revenueInsights);

    // Milestone impact predictions
    const milestoneInsights = this.generateMilestoneImpactPredictions(milestones);
    insights.push(...milestoneInsights);

    // Risk alerts
    const riskInsights = this.generateRiskAlerts(milestones, goals);
    insights.push(...riskInsights);

    // Opportunity identification
    const opportunityInsights = this.generateOpportunityInsights(milestones, goals);
    insights.push(...opportunityInsights);

    return insights;
  }

  private generateRevenueProjections(milestones: TechnicalMilestone[], goals: BusinessGoal[]): PredictiveInsight[] {
    const insights: PredictiveInsight[] = [];
    const revenueGoals = goals.filter(g => g.category === 'revenue');
    
    for (const goal of revenueGoals) {
      const relatedMilestones = milestones.filter(m => 
        m.linkedGoals.includes(goal.id) || 
        m.businessContext.revenueImplication > 0
      );

      if (relatedMilestones.length > 0) {
        const totalProjectedRevenue = relatedMilestones.reduce((sum, m) => sum + m.businessContext.revenueImplication, 0);
        const completedCount = relatedMilestones.filter(m => m.status === 'completed').length;
        const progressPercentage = (completedCount / relatedMilestones.length) * 100;

        insights.push({
          id: `revenue-projection-${goal.id}`,
          type: 'revenue-projection',
          prediction: `Based on ${relatedMilestones.length} technical milestones, projected revenue impact of $${totalProjectedRevenue.toLocaleString()} for ${goal.title}. Current completion: ${progressPercentage.toFixed(1)}%`,
          confidence: Math.min(90, 60 + (progressPercentage * 0.3)),
          timeframe: '3-12 months',
          impact: totalProjectedRevenue >= 50000 ? 'critical' : totalProjectedRevenue >= 25000 ? 'high' : 'medium',
          supporting_data: relatedMilestones.map(m => `${m.name}: $${m.businessContext.revenueImplication.toLocaleString()}`),
          generated: new Date().toISOString()
        });
      }
    }

    return insights;
  }

  private generateMilestoneImpactPredictions(milestones: TechnicalMilestone[]): PredictiveInsight[] {
    const insights: PredictiveInsight[] = [];
    const highImpactMilestones = milestones.filter(m => m.businessContext.strategicImportance >= 80);

    for (const milestone of highImpactMilestones) {
      if (milestone.status === 'in-progress') {
        insights.push({
          id: `milestone-impact-${milestone.id}`,
          type: 'milestone-impact',
          prediction: `${milestone.name} completion will provide ${milestone.businessContext.competitiveAdvantage} with ${milestone.businessContext.revenueImplication > 0 ? `$${milestone.businessContext.revenueImplication.toLocaleString()} revenue impact` : 'significant strategic value'}`,
          confidence: milestone.businessContext.strategicImportance,
          timeframe: milestone.plannedDate,
          impact: this.mapImportanceToImpact(milestone.businessContext.strategicImportance),
          supporting_data: [
            `Strategic importance: ${milestone.businessContext.strategicImportance}%`,
            `Customer impact: ${milestone.businessContext.customerImpact}`,
            `Market timing: ${milestone.businessContext.marketTiming}`
          ],
          generated: new Date().toISOString()
        });
      }
    }

    return insights;
  }

  private generateRiskAlerts(milestones: TechnicalMilestone[], goals: BusinessGoal[]): PredictiveInsight[] {
    const insights: PredictiveInsight[] = [];
    
    // Check for milestones that are delayed and have high business impact
    const delayedHighImpact = milestones.filter(m => 
      m.status === 'delayed' && 
      m.businessContext.strategicImportance >= 70
    );

    for (const milestone of delayedHighImpact) {
      insights.push({
        id: `risk-alert-${milestone.id}`,
        type: 'risk-alert',
        prediction: `RISK: ${milestone.name} delay may impact business goals. Projected revenue at risk: $${milestone.businessContext.revenueImplication.toLocaleString()}`,
        confidence: 85,
        timeframe: 'immediate',
        impact: 'critical',
        supporting_data: [
          `Strategic importance: ${milestone.businessContext.strategicImportance}%`,
          `Status: ${milestone.status}`,
          `Planned date: ${milestone.plannedDate}`
        ],
        generated: new Date().toISOString()
      });
    }

    return insights;
  }

  private generateOpportunityInsights(milestones: TechnicalMilestone[], goals: BusinessGoal[]): PredictiveInsight[] {
    const insights: PredictiveInsight[] = [];

    // Look for completed milestones that could unlock new opportunities
    const recentCompletions = milestones.filter(m => 
      m.status === 'completed' && 
      m.completionDate && 
      new Date(m.completionDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
    );

    for (const milestone of recentCompletions) {
      if (milestone.businessContext.strategicImportance >= 70) {
        insights.push({
          id: `opportunity-${milestone.id}`,
          type: 'opportunity-identification',
          prediction: `OPPORTUNITY: ${milestone.name} completion enables ${milestone.businessContext.competitiveAdvantage}. Consider capitalizing on ${milestone.businessContext.marketTiming} market timing.`,
          confidence: milestone.businessContext.strategicImportance,
          timeframe: '1-6 months',
          impact: this.mapImportanceToImpact(milestone.businessContext.strategicImportance),
          supporting_data: [
            `Completed: ${milestone.completionDate}`,
            `Customer impact: ${milestone.businessContext.customerImpact}`,
            `Market timing: ${milestone.businessContext.marketTiming}`
          ],
          generated: new Date().toISOString()
        });
      }
    }

    return insights;
  }

  private mapImportanceToImpact(importance: number): 'critical' | 'high' | 'medium' | 'low' {
    if (importance >= 90) return 'critical';
    if (importance >= 75) return 'high';
    if (importance >= 50) return 'medium';
    return 'low';
  }

  getCorrelations(): ProgressCorrelation[] {
    return Array.from(this.correlations.values());
  }

  getInsights(): CorrelationInsight[] {
    return Array.from(this.insights.values());
  }

  getModels(): PredictiveModel[] {
    return Array.from(this.models.values());
  }
}