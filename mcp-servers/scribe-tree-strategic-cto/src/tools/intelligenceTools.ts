// Advanced intelligence tools for development-business alignment
import { v4 as uuidv4 } from 'uuid';
import { ToolResponse } from '../types/index.js';
import { StorageAdapter } from '../storage/StorageAdapter.js';
import { TechnicalMilestoneTracker, TechnicalMilestone, BusinessImpactProjection } from '../intelligence/technicalMilestoneTracker.js';
import { ProgressCorrelationEngine, CorrelationInsight, PredictiveInsight } from '../intelligence/progressCorrelationEngine.js';
import { StrategyReviewAutomation, StrategyReviewTrigger, StrategyReview } from '../intelligence/strategyReviewAutomation.js';

export class IntelligenceTools {
  private milestoneTracker: TechnicalMilestoneTracker;
  private correlationEngine: ProgressCorrelationEngine;
  private reviewAutomation: StrategyReviewAutomation;

  constructor(private storage: StorageAdapter) {
    this.milestoneTracker = new TechnicalMilestoneTracker(storage);
    this.correlationEngine = new ProgressCorrelationEngine();
    this.reviewAutomation = new StrategyReviewAutomation();
  }

  async createTechnicalMilestone(args: {
    name: string;
    description: string;
    category: 'architecture' | 'feature' | 'performance' | 'security' | 'integration' | 'infrastructure';
    plannedDate: string;
    effort: number;
    complexity: 'low' | 'medium' | 'high' | 'critical';
    codebaseChanges: string[];
    performanceImpact?: {
      metric: string;
      improvement: string;
      measurement: string;
    };
    architecturalImpact?: string;
    risksMitigated?: string[];
    businessContext?: {
      strategicImportance?: number;
      customerImpact?: string;
      revenueImplication?: number;
      competitiveAdvantage?: string;
      marketTiming?: 'early' | 'competitive' | 'late' | 'critical';
    };
  }): Promise<ToolResponse> {
    try {
      await this.milestoneTracker.loadMilestones();
      const milestone = await this.milestoneTracker.createMilestone({
        name: args.name,
        description: args.description,
        category: args.category,
        plannedDate: args.plannedDate,
        effort: args.effort,
        complexity: args.complexity,
        technicalDetails: {
          codebaseChanges: args.codebaseChanges,
          performanceImpact: args.performanceImpact,
          architecturalImpact: args.architecturalImpact,
          risksMitigated: args.risksMitigated
        },
        businessContext: args.businessContext
      });

      // Generate business impact projection
      const impactProjection = this.milestoneTracker.generateBusinessImpactProjection(milestone.id);

      return {
        success: true,
        data: {
          milestone,
          impactProjection
        },
        message: `Technical milestone '${args.name}' created with ${milestone.businessContext.strategicImportance}% strategic importance and $${milestone.businessContext.revenueImplication.toLocaleString()} projected revenue impact`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create technical milestone: ${error}`
      };
    }
  }

  async updateMilestoneProgress(args: {
    milestoneId: string;
    completionPercentage: number;
    blockers?: string[];
    achievements?: string[];
    nextSteps?: string[];
    estimatedCompletionDate?: string;
    confidenceLevel?: number;
    businessImpactUpdate?: string;
  }): Promise<ToolResponse> {
    try {
      await this.milestoneTracker.loadMilestones();
      const progress = await this.milestoneTracker.updateMilestoneProgress(args.milestoneId, {
        completionPercentage: args.completionPercentage,
        blockers: args.blockers || [],
        achievements: args.achievements || [],
        nextSteps: args.nextSteps || [],
        estimatedCompletionDate: args.estimatedCompletionDate || new Date().toISOString(),
        confidenceLevel: args.confidenceLevel || 75,
        businessImpactUpdate: args.businessImpactUpdate
      });

      const milestone = this.milestoneTracker.getMilestone(args.milestoneId);
      
      // Generate updated business impact projection
      let impactProjection = null;
      if (milestone) {
        impactProjection = this.milestoneTracker.generateBusinessImpactProjection(args.milestoneId);
      }

      return {
        success: true,
        data: {
          progress,
          milestone,
          impactProjection
        },
        message: `Milestone progress updated to ${args.completionPercentage}% completion with ${args.confidenceLevel || 75}% confidence`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update milestone progress: ${error}`
      };
    }
  }

  async analyzeDevelopmentBusinessAlignment(args: {
    includeCorrelations?: boolean;
    includeProjections?: boolean;
    includePredictiveInsights?: boolean;
  } = {}): Promise<ToolResponse> {
    try {
      const {
        includeCorrelations = true,
        includeProjections = true,
        includePredictiveInsights = true
      } = args;

      // Get current milestones and business goals
      await this.milestoneTracker.loadMilestones();
      const milestones = this.milestoneTracker.getAllMilestones();
      const data = await this.storage.load();
      const businessGoals = Object.values(data.goals);

      const analysis: any = {
        summary: {
          totalMilestones: milestones.length,
          completedMilestones: milestones.filter(m => m.status === 'completed').length,
          totalBusinessGoals: businessGoals.length,
          alignmentStrength: 0
        },
        milestones: milestones.map(m => ({
          id: m.id,
          name: m.name,
          status: m.status,
          strategicImportance: m.businessContext.strategicImportance,
          revenueImplication: m.businessContext.revenueImplication,
          linkedGoals: m.linkedGoals.length
        }))
      };

      // Generate correlations if requested
      if (includeCorrelations) {
        const correlations = [];
        for (const milestone of milestones) {
          const milestoneCorrelations = this.correlationEngine.analyzeCorrelation(milestone, businessGoals);
          correlations.push(...milestoneCorrelations);
        }
        
        const insights = this.correlationEngine.generateCorrelationInsights(correlations, milestones, businessGoals);
        
        analysis.correlations = {
          total: correlations.length,
          strongPositive: correlations.filter(c => c.correlationStrength >= 70).length,
          data: correlations,
          insights: insights
        };

        // Calculate overall alignment strength
        analysis.summary.alignmentStrength = correlations.length > 0
          ? Math.round(correlations.reduce((sum, c) => sum + Math.abs(c.correlationStrength), 0) / correlations.length)
          : 0;
      }

      // Generate business impact projections if requested
      if (includeProjections) {
        const projections = milestones.map(m => ({
          milestoneId: m.id,
          milestoneName: m.name,
          projection: this.milestoneTracker.generateBusinessImpactProjection(m.id)
        }));

        analysis.projections = {
          total: projections.length,
          totalProjectedRevenue: projections.reduce((sum, p) => 
            sum + p.projection.projectedRevenue.immediate + 
            p.projection.projectedRevenue.shortTerm + 
            p.projection.projectedRevenue.longTerm, 0
          ),
          data: projections
        };
      }

      // Generate predictive insights if requested
      if (includePredictiveInsights) {
        const predictiveInsights = this.correlationEngine.generatePredictiveInsights(milestones, businessGoals);
        
        analysis.predictiveInsights = {
          total: predictiveInsights.length,
          byType: this.groupInsightsByType(predictiveInsights),
          highConfidence: predictiveInsights.filter(i => i.confidence >= 80),
          data: predictiveInsights
        };
      }

      // Generate strategic recommendations
      analysis.recommendations = this.generateStrategicRecommendations(analysis);

      return {
        success: true,
        data: analysis,
        message: `Analyzed alignment between ${milestones.length} technical milestones and ${businessGoals.length} business goals. Overall alignment strength: ${analysis.summary.alignmentStrength}%`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to analyze development-business alignment: ${error}`
      };
    }
  }

  async generateBusinessImpactForecast(args: {
    timeframe: '3-months' | '6-months' | '12-months' | '24-months';
    confidence?: 'conservative' | 'realistic' | 'optimistic';
    includeScenarios?: boolean;
  }): Promise<ToolResponse> {
    try {
      const { timeframe, confidence = 'realistic', includeScenarios = true } = args;
      
      await this.milestoneTracker.loadMilestones();
      const milestones = this.milestoneTracker.getAllMilestones();
      const data = await this.storage.load();
      const businessGoals = Object.values(data.goals);

      // Generate forecast based on milestone completion projections
      const forecast = this.generateForecastByTimeframe(milestones, businessGoals, timeframe, confidence);

      const result: any = {
        timeframe,
        confidence,
        forecast: {
          projectedRevenue: forecast.revenue,
          milestonesCompleted: forecast.milestoneCount,
          businessGoalsAchieved: forecast.goalAchievement,
          keyOpportunities: forecast.opportunities,
          potentialRisks: forecast.risks
        }
      };

      // Add scenario analysis if requested
      if (includeScenarios) {
        result.scenarios = {
          conservative: this.generateForecastByTimeframe(milestones, businessGoals, timeframe, 'conservative'),
          realistic: this.generateForecastByTimeframe(milestones, businessGoals, timeframe, 'realistic'),
          optimistic: this.generateForecastByTimeframe(milestones, businessGoals, timeframe, 'optimistic')
        };
      }

      // Generate actionable insights
      result.actionableInsights = this.generateForecastInsights(forecast, milestones);

      return {
        success: true,
        data: result,
        message: `Generated ${timeframe} business impact forecast with ${confidence} confidence. Projected revenue: $${forecast.revenue.toLocaleString()}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate business impact forecast: ${error}`
      };
    }
  }

  async identifyStrategicOpportunities(args: {
    analysisType?: 'technical-gaps' | 'market-timing' | 'competitive-advantage' | 'all';
    minImpact?: 'low' | 'medium' | 'high' | 'critical';
  } = {}): Promise<ToolResponse> {
    try {
      const { analysisType = 'all', minImpact = 'medium' } = args;

      await this.milestoneTracker.loadMilestones();
      const milestones = this.milestoneTracker.getAllMilestones();
      const data = await this.storage.load();
      const businessGoals = Object.values(data.goals);

      const opportunities: any[] = [];

      // Technical gap analysis
      if (analysisType === 'technical-gaps' || analysisType === 'all') {
        const technicalOpportunities = this.identifyTechnicalGaps(milestones, businessGoals);
        opportunities.push(...technicalOpportunities);
      }

      // Market timing analysis
      if (analysisType === 'market-timing' || analysisType === 'all') {
        const timingOpportunities = this.identifyMarketTimingOpportunities(milestones);
        opportunities.push(...timingOpportunities);
      }

      // Competitive advantage analysis
      if (analysisType === 'competitive-advantage' || analysisType === 'all') {
        const competitiveOpportunities = this.identifyCompetitiveAdvantageOpportunities(milestones);
        opportunities.push(...competitiveOpportunities);
      }

      // Filter by minimum impact
      const filteredOpportunities = opportunities.filter(opp => 
        this.meetImpactThreshold(opp.impact, minImpact)
      );

      // Sort by potential value
      filteredOpportunities.sort((a, b) => b.potentialValue - a.potentialValue);

      return {
        success: true,
        data: {
          total: filteredOpportunities.length,
          analysisType,
          minImpact,
          opportunities: filteredOpportunities.slice(0, 10), // Top 10 opportunities
          summary: this.summarizeOpportunities(filteredOpportunities)
        },
        message: `Identified ${filteredOpportunities.length} strategic opportunities with ${minImpact}+ impact`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to identify strategic opportunities: ${error}`
      };
    }
  }

  async getMilestoneBusinessAlignment(args: { milestoneId: string }): Promise<ToolResponse> {
    try {
      await this.milestoneTracker.loadMilestones();
      const milestone = this.milestoneTracker.getMilestone(args.milestoneId);
      if (!milestone) {
        return {
          success: false,
          error: `Milestone ${args.milestoneId} not found`
        };
      }

      const data = await this.storage.load();
      const businessGoals = Object.values(data.goals);
      
      // Generate comprehensive alignment analysis
      const alignmentMapping = this.milestoneTracker.generateAlignmentMapping(args.milestoneId);
      const impactProjection = this.milestoneTracker.generateBusinessImpactProjection(args.milestoneId);
      const correlations = this.correlationEngine.analyzeCorrelation(milestone, businessGoals);
      const progressHistory = this.milestoneTracker.getMilestoneProgress(args.milestoneId);

      const analysis = {
        milestone: {
          id: milestone.id,
          name: milestone.name,
          status: milestone.status,
          completion: progressHistory.length > 0 ? progressHistory[progressHistory.length - 1].completionPercentage : 0,
          strategicImportance: milestone.businessContext.strategicImportance
        },
        businessAlignment: alignmentMapping,
        impactProjection,
        correlations: {
          total: correlations.length,
          strongest: correlations.sort((a, b) => b.correlationStrength - a.correlationStrength)[0],
          data: correlations
        },
        progressTracking: {
          totalUpdates: progressHistory.length,
          latestUpdate: progressHistory[progressHistory.length - 1],
          trend: this.calculateProgressTrend(progressHistory)
        },
        recommendations: this.generateMilestoneRecommendations(milestone, correlations, impactProjection)
      };

      return {
        success: true,
        data: analysis,
        message: `Generated comprehensive business alignment analysis for ${milestone.name}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get milestone business alignment: ${error}`
      };
    }
  }

  // Helper methods
  private groupInsightsByType(insights: PredictiveInsight[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    insights.forEach(insight => {
      grouped[insight.type] = (grouped[insight.type] || 0) + 1;
    });
    return grouped;
  }

  private generateStrategicRecommendations(analysis: any): string[] {
    const recommendations: string[] = [];

    if (analysis.summary.alignmentStrength < 50) {
      recommendations.push('Low alignment detected: Consider linking more technical milestones to specific business goals');
    }

    if (analysis.correlations && analysis.correlations.strongPositive > 0) {
      recommendations.push(`${analysis.correlations.strongPositive} strong correlations identified: Prioritize these technical areas for maximum business impact`);
    }

    if (analysis.projections && analysis.projections.totalProjectedRevenue > 100000) {
      recommendations.push('High revenue potential identified: Ensure adequate resources for milestone completion');
    }

    if (analysis.predictiveInsights && analysis.predictiveInsights.highConfidence.length > 0) {
      recommendations.push(`${analysis.predictiveInsights.highConfidence.length} high-confidence predictions available: Use for strategic planning`);
    }

    return recommendations.length > 0 ? recommendations : ['Continue systematic tracking of technical milestones and business outcomes'];
  }

  private generateForecastByTimeframe(
    milestones: TechnicalMilestone[], 
    businessGoals: any[], 
    timeframe: string, 
    confidence: string
  ): any {
    const months = this.parseTimeframe(timeframe);
    const confidenceMultiplier = this.getConfidenceMultiplier(confidence);
    
    const relevantMilestones = milestones.filter(m => {
      const plannedDate = new Date(m.plannedDate);
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() + months);
      return plannedDate <= cutoffDate;
    });

    const projectedRevenue = relevantMilestones.reduce((sum, m) => 
      sum + (m.businessContext.revenueImplication * confidenceMultiplier), 0
    );

    return {
      revenue: Math.round(projectedRevenue),
      milestoneCount: relevantMilestones.length,
      goalAchievement: Math.round(relevantMilestones.length * 0.7 * confidenceMultiplier),
      opportunities: this.getTopOpportunities(relevantMilestones, 3),
      risks: this.getTopRisks(relevantMilestones, 3)
    };
  }

  private parseTimeframe(timeframe: string): number {
    const map: Record<string, number> = {
      '3-months': 3,
      '6-months': 6,
      '12-months': 12,
      '24-months': 24
    };
    return map[timeframe] || 6;
  }

  private getConfidenceMultiplier(confidence: string): number {
    const map: Record<string, number> = {
      'conservative': 0.6,
      'realistic': 0.8,
      'optimistic': 1.0
    };
    return map[confidence] || 0.8;
  }

  private getTopOpportunities(milestones: TechnicalMilestone[], count: number): string[] {
    return milestones
      .filter(m => m.businessContext.strategicImportance >= 80)
      .sort((a, b) => b.businessContext.strategicImportance - a.businessContext.strategicImportance)
      .slice(0, count)
      .map(m => m.businessContext.competitiveAdvantage);
  }

  private getTopRisks(milestones: TechnicalMilestone[], count: number): string[] {
    return milestones
      .filter(m => m.status === 'delayed' || m.complexity === 'critical')
      .slice(0, count)
      .map(m => `${m.name} - ${m.status === 'delayed' ? 'delayed' : 'high complexity'}`);
  }

  private generateForecastInsights(forecast: any, milestones: TechnicalMilestone[]): string[] {
    const insights: string[] = [];

    if (forecast.revenue > 50000) {
      insights.push('High revenue potential forecast - ensure milestone completion is prioritized');
    }

    const highImpactMilestones = milestones.filter(m => m.businessContext.strategicImportance >= 80);
    if (highImpactMilestones.length > 0) {
      insights.push(`${highImpactMilestones.length} high-impact milestones identified - monitor progress closely`);
    }

    return insights;
  }

  private identifyTechnicalGaps(milestones: TechnicalMilestone[], businessGoals: any[]): any[] {
    // Logic to identify gaps between technical capabilities and business needs
    return [];
  }

  private identifyMarketTimingOpportunities(milestones: TechnicalMilestone[]): any[] {
    return milestones
      .filter(m => m.businessContext.marketTiming === 'early')
      .map(m => ({
        type: 'market-timing',
        description: `Early market opportunity: ${m.businessContext.competitiveAdvantage}`,
        impact: 'high',
        potentialValue: m.businessContext.revenueImplication,
        timeframe: m.plannedDate,
        milestone: m.name
      }));
  }

  private identifyCompetitiveAdvantageOpportunities(milestones: TechnicalMilestone[]): any[] {
    return milestones
      .filter(m => m.businessContext.strategicImportance >= 85)
      .map(m => ({
        type: 'competitive-advantage',
        description: m.businessContext.competitiveAdvantage,
        impact: 'critical',
        potentialValue: m.businessContext.revenueImplication,
        timeframe: m.plannedDate,
        milestone: m.name
      }));
  }

  private meetImpactThreshold(impact: string, threshold: string): boolean {
    const levels = ['low', 'medium', 'high', 'critical'];
    return levels.indexOf(impact) >= levels.indexOf(threshold);
  }

  private summarizeOpportunities(opportunities: any[]): any {
    return {
      totalValue: opportunities.reduce((sum, opp) => sum + opp.potentialValue, 0),
      byType: this.groupOpportunitiesByType(opportunities),
      averageValue: opportunities.length > 0 ? opportunities.reduce((sum, opp) => sum + opp.potentialValue, 0) / opportunities.length : 0
    };
  }

  private groupOpportunitiesByType(opportunities: any[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    opportunities.forEach(opp => {
      grouped[opp.type] = (grouped[opp.type] || 0) + 1;
    });
    return grouped;
  }

  private generateMilestoneRecommendations(milestone: TechnicalMilestone, correlations: any[], impactProjection: BusinessImpactProjection): string[] {
    const recommendations: string[] = [];

    if (milestone.businessContext.strategicImportance >= 80) {
      recommendations.push('High strategic importance - prioritize completion and monitor progress closely');
    }

    if (correlations.length > 0) {
      const strongestCorrelation = correlations.sort((a, b) => b.correlationStrength - a.correlationStrength)[0];
      if (strongestCorrelation.correlationStrength >= 70) {
        recommendations.push(`Strong business correlation detected (${strongestCorrelation.correlationStrength}%) - completion will significantly impact business goals`);
      }
    }

    if (impactProjection.projectedRevenue.longTerm > 25000) {
      recommendations.push('Significant long-term revenue impact - ensure proper resource allocation');
    }

    return recommendations.length > 0 ? recommendations : ['Continue tracking progress and business alignment'];
  }

  private calculateProgressTrend(progressHistory: any[]): string {
    if (progressHistory.length < 2) return 'insufficient-data';
    
    const recent = progressHistory.slice(-3);
    const trend = recent[recent.length - 1].completionPercentage - recent[0].completionPercentage;
    
    if (trend > 10) return 'accelerating';
    if (trend > 0) return 'steady';
    if (trend === 0) return 'stalled';
    return 'declining';
  }

  // Strategy Review Automation Methods
  async evaluateStrategyReviewTriggers(args: {
    includeCompetitiveContext?: boolean;
    includeStrategyGaps?: boolean;
    marketEvents?: string[];
  } = {}): Promise<ToolResponse> {
    try {
      await this.milestoneTracker.loadMilestones();
      const data = await this.storage.load();
      
      const milestones = this.milestoneTracker.getAllMilestones();
      const businessGoals = Object.values(data.goals || {});
      const conversations = Object.values(data.conversations || {});
      
      // Generate correlations
      const correlations = [];
      for (const milestone of milestones) {
        const milestoneCorrelations = this.correlationEngine.analyzeCorrelation(milestone, businessGoals);
        correlations.push(...milestoneCorrelations);
      }

      // Prepare additional context if requested
      const additionalContext: any = {};
      if (args.marketEvents) {
        additionalContext.marketEvents = args.marketEvents;
      }

      // Evaluate triggers
      const triggeredReviews = this.reviewAutomation.evaluateTriggers(
        milestones,
        businessGoals,
        correlations,
        conversations,
        additionalContext
      );

      // Get all configured triggers
      const allTriggers = this.reviewAutomation.getTriggers();

      return {
        success: true,
        data: {
          triggeredReviews,
          triggersEvaluated: allTriggers.length,
          activeReviews: triggeredReviews.filter(r => r.status === 'pending').length,
          triggers: allTriggers.map(t => ({
            id: t.id,
            name: t.name,
            type: t.type,
            enabled: t.enabled,
            lastTriggered: t.lastTriggered,
            triggerCount: t.triggerCount,
            priority: t.priority
          }))
        },
        message: `Evaluated ${allTriggers.length} triggers, ${triggeredReviews.length} reviews triggered`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to evaluate strategy review triggers: ${error}`
      };
    }
  }

  async configureStrategyReviewTrigger(args: {
    action: 'create' | 'update' | 'enable' | 'disable';
    triggerId?: string;
    triggerConfig?: {
      name: string;
      type: 'milestone-based' | 'time-based' | 'metric-based' | 'event-based' | 'threshold-based';
      enabled?: boolean;
      conditions: any[];
      actions: any[];
      priority: 'low' | 'medium' | 'high' | 'critical';
    };
  }): Promise<ToolResponse> {
    try {
      let result;

      switch (args.action) {
        case 'create':
          if (!args.triggerConfig) {
            return { success: false, error: 'Trigger configuration required for create action' };
          }
          result = this.reviewAutomation.createCustomTrigger({
            ...args.triggerConfig,
            enabled: args.triggerConfig.enabled ?? true
          });
          break;

        case 'update':
          if (!args.triggerId || !args.triggerConfig) {
            return { success: false, error: 'Trigger ID and configuration required for update action' };
          }
          result = this.reviewAutomation.updateTrigger(args.triggerId, args.triggerConfig);
          break;

        case 'enable':
        case 'disable':
          if (!args.triggerId) {
            return { success: false, error: 'Trigger ID required for enable/disable action' };
          }
          result = this.reviewAutomation.updateTrigger(args.triggerId, { enabled: args.action === 'enable' });
          break;
      }

      if (!result) {
        return { success: false, error: 'Trigger operation failed' };
      }

      return {
        success: true,
        data: result,
        message: `Trigger ${args.action}d successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to configure strategy review trigger: ${error}`
      };
    }
  }

  async getStrategyReviews(args: {
    status?: 'pending' | 'in-progress' | 'completed' | 'cancelled';
    includeQuestions?: boolean;
  } = {}): Promise<ToolResponse> {
    try {
      const reviews = this.reviewAutomation.getReviews(args.status);

      const reviewData = reviews.map(review => {
        const data: any = {
          id: review.id,
          triggerId: review.triggerId,
          triggerReason: review.triggerReason,
          status: review.status,
          priority: review.priority,
          created: review.created,
          scheduled: review.scheduled,
          completed: review.completed,
          reviewScope: review.reviewScope
        };

        if (args.includeQuestions) {
          data.reviewQuestions = review.reviewQuestions;
        }

        if (review.decisions.length > 0) {
          data.decisions = review.decisions;
        }

        if (review.nextSteps.length > 0) {
          data.nextSteps = review.nextSteps;
        }

        return data;
      });

      const summary = {
        total: reviews.length,
        byStatus: this.groupReviewsByStatus(reviews),
        byPriority: this.groupReviewsByPriority(reviews),
        upcomingReviews: reviews
          .filter(r => r.status === 'pending' && r.scheduled)
          .sort((a, b) => new Date(a.scheduled!).getTime() - new Date(b.scheduled!).getTime())
          .slice(0, 5)
      };

      return {
        success: true,
        data: {
          reviews: reviewData,
          summary
        },
        message: `Retrieved ${reviews.length} strategy reviews`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get strategy reviews: ${error}`
      };
    }
  }

  async completeStrategyReview(args: {
    reviewId: string;
    decisions: Array<{
      decision: string;
      rationale: string;
      impact: 'high' | 'medium' | 'low';
      implementation: string;
      owner: string;
      deadline: string;
    }>;
    nextSteps: string[];
  }): Promise<ToolResponse> {
    try {
      const result = this.reviewAutomation.completeReview(
        args.reviewId,
        args.decisions.map(d => ({ id: uuidv4(), ...d })),
        args.nextSteps
      );

      if (!result) {
        return {
          success: false,
          error: 'Review not found'
        };
      }

      return {
        success: true,
        data: result,
        message: `Strategy review ${args.reviewId} completed with ${args.decisions.length} decisions and ${args.nextSteps.length} next steps`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to complete strategy review: ${error}`
      };
    }
  }

  private groupReviewsByStatus(reviews: StrategyReview[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    reviews.forEach(review => {
      grouped[review.status] = (grouped[review.status] || 0) + 1;
    });
    return grouped;
  }

  private groupReviewsByPriority(reviews: StrategyReview[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    reviews.forEach(review => {
      grouped[review.priority] = (grouped[review.priority] || 0) + 1;
    });
    return grouped;
  }
}