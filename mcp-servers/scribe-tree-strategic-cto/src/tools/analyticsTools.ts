// Analytics tools that integrate pattern recognition, goal analytics, and insight generation
import { v4 as uuidv4 } from 'uuid';
import { ToolResponse } from '../types/index.js';
import { StorageAdapter } from '../storage/StorageAdapter.js';
import { TechnicalMilestoneTracker } from '../intelligence/technicalMilestoneTracker.js';
import { ProgressCorrelationEngine } from '../intelligence/progressCorrelationEngine.js';
import { PatternRecognitionEngine } from '../analytics/patternRecognitionEngine.js';
import { GoalProgressAnalytics } from '../analytics/goalProgressAnalytics.js';
import { StrategicInsightGenerator } from '../analytics/strategicInsightGenerator.js';

export class AnalyticsTools {
  private milestoneTracker: TechnicalMilestoneTracker;
  private correlationEngine: ProgressCorrelationEngine;
  private patternEngine: PatternRecognitionEngine;
  private goalAnalytics: GoalProgressAnalytics;
  private insightGenerator: StrategicInsightGenerator;

  constructor(private storage: StorageAdapter) {
    this.milestoneTracker = new TechnicalMilestoneTracker(storage);
    this.correlationEngine = new ProgressCorrelationEngine();
    this.patternEngine = new PatternRecognitionEngine();
    this.goalAnalytics = new GoalProgressAnalytics();
    this.insightGenerator = new StrategicInsightGenerator();
  }

  async runComprehensiveAnalysis(args: {
    includePatterns?: boolean;
    includeTrends?: boolean;
    includeGoalHealth?: boolean;
    includeInsights?: boolean;
    analysisDepth?: 'basic' | 'standard' | 'comprehensive';
  } = {}): Promise<ToolResponse> {
    try {
      const {
        includePatterns = true,
        includeTrends = true,
        includeGoalHealth = true,
        includeInsights = true,
        analysisDepth = 'comprehensive'
      } = args;

      // Load all data
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

      const analysis: any = {
        summary: {
          analysisDate: new Date().toISOString(),
          analysisDepth,
          dataPoints: {
            milestones: milestones.length,
            businessGoals: businessGoals.length,
            correlations: correlations.length,
            conversations: conversations.length
          }
        }
      };

      // Pattern Analysis
      if (includePatterns) {
        const patterns = this.patternEngine.analyzePatterns(milestones, correlations, businessGoals, conversations);
        analysis.patterns = {
          total: patterns.length,
          byType: this.groupPatternsByType(patterns),
          highConfidence: patterns.filter(p => p.confidence >= 80),
          criticalBusiness: patterns.filter(p => p.businessImpact.opportunity === 'critical' || p.businessImpact.risk === 'critical'),
          data: analysisDepth === 'comprehensive' ? patterns : patterns.slice(0, 10)
        };
      }

      // Trend Analysis
      if (includeTrends) {
        const trends = this.patternEngine.generateTrendAnalysis(milestones, '90-days');
        const crossAnalyses = this.patternEngine.analyzeCorrelationsAcrossMilestones(milestones, correlations);
        
        analysis.trends = {
          total: trends.length,
          crossMilestoneAnalyses: crossAnalyses.length,
          data: trends,
          crossAnalyses: analysisDepth === 'comprehensive' ? crossAnalyses : crossAnalyses.slice(0, 5)
        };
      }

      // Goal Health Analysis
      if (includeGoalHealth) {
        const goalHealthAssessments = [];
        for (const goal of businessGoals) {
          const relatedMilestones = milestones.filter(m => m.linkedGoals.includes(goal.id));
          const goalCorrelations = correlations.filter(c => c.businessGoalId === goal.id);
          const healthAssessment = this.goalAnalytics.assessGoalHealth(goal, relatedMilestones, goalCorrelations);
          goalHealthAssessments.push(healthAssessment);
        }

        analysis.goalHealth = {
          total: goalHealthAssessments.length,
          healthDistribution: this.getHealthDistribution(goalHealthAssessments),
          criticalGoals: goalHealthAssessments.filter(g => g.overallHealth === 'critical'),
          excellentGoals: goalHealthAssessments.filter(g => g.overallHealth === 'excellent'),
          averageHealthScore: goalHealthAssessments.length > 0 
            ? goalHealthAssessments.reduce((sum, g) => sum + g.healthScore, 0) / goalHealthAssessments.length 
            : 0,
          data: analysisDepth === 'comprehensive' ? goalHealthAssessments : goalHealthAssessments.slice(0, 5)
        };
      }

      // Strategic Insights
      if (includeInsights) {
        const patterns = analysis.patterns?.data || [];
        const trends = analysis.trends?.data || [];
        const crossAnalyses = analysis.trends?.crossAnalyses || [];
        const goalHealth = analysis.goalHealth?.data || [];

        const insights = this.insightGenerator.generateInsights(
          patterns, trends, crossAnalyses, goalHealth, milestones, businessGoals
        );

        const executiveSummary = this.insightGenerator.generateExecutiveSummary(insights);

        analysis.insights = {
          total: insights.length,
          byType: this.groupInsightsByType(insights),
          byPriority: this.groupInsightsByPriority(insights),
          executiveSummary,
          criticalInsights: insights.filter(i => i.priority === 'critical'),
          data: analysisDepth === 'comprehensive' ? insights : insights.slice(0, 10)
        };
      }

      // Calculate overall strategic score
      analysis.strategicScore = this.calculateOverallStrategicScore(analysis);

      // Generate key recommendations
      analysis.keyRecommendations = this.generateKeyRecommendations(analysis);

      return {
        success: true,
        data: analysis,
        message: `Comprehensive strategic analysis completed. Analyzed ${milestones.length} milestones, ${businessGoals.length} goals, found ${correlations.length} correlations${includeInsights ? `, generated ${analysis.insights.total} strategic insights` : ''}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to run comprehensive analysis: ${error}`
      };
    }
  }

  async generateStrategicDashboard(args: {
    timeframe?: '30-days' | '90-days' | '6-months' | '12-months';
    focus?: 'overview' | 'risks' | 'opportunities' | 'performance';
  } = {}): Promise<ToolResponse> {
    try {
      const { timeframe = '90-days', focus = 'overview' } = args;

      await this.milestoneTracker.loadMilestones();
      const data = await this.storage.load();
      
      const milestones = this.milestoneTracker.getAllMilestones();
      const businessGoals = Object.values(data.goals || {});

      // Generate correlations for dashboard
      const correlations = [];
      for (const milestone of milestones) {
        const milestoneCorrelations = this.correlationEngine.analyzeCorrelation(milestone, businessGoals);
        correlations.push(...milestoneCorrelations);
      }

      const dashboard: any = {
        generatedAt: new Date().toISOString(),
        timeframe,
        focus,
        
        // Executive Summary Metrics
        executiveMetrics: {
          totalMilestones: milestones.length,
          completedMilestones: milestones.filter(m => m.status === 'completed').length,
          milestonesInProgress: milestones.filter(m => m.status === 'in-progress').length,
          delayedMilestones: milestones.filter(m => m.status === 'delayed').length,
          totalBusinessGoals: businessGoals.length,
          averageGoalConfidence: businessGoals.length > 0 
            ? businessGoals.reduce((sum, g) => sum + (g.confidence || 50), 0) / businessGoals.length 
            : 0,
          strongCorrelations: correlations.filter(c => Math.abs(c.correlationStrength) >= 70).length,
          totalProjectedRevenue: milestones.reduce((sum, m) => sum + m.businessContext.revenueImplication, 0)
        },

        // Performance Indicators
        performanceIndicators: {
          developmentVelocity: this.calculateDevelopmentVelocity(milestones),
          strategicAlignment: this.calculateStrategicAlignment(correlations),
          businessImpactRealization: this.calculateBusinessImpactRealization(milestones),
          riskExposure: this.calculateRiskExposure(milestones)
        }
      };

      // Focus-specific content
      if (focus === 'risks' || focus === 'overview') {
        const riskPatterns = this.patternEngine.analyzePatterns(milestones, correlations, businessGoals, [])
          .filter(p => p.type === 'risk');
        
        dashboard.riskAnalysis = {
          totalRisks: riskPatterns.length,
          criticalRisks: riskPatterns.filter(p => p.businessImpact.risk === 'critical'),
          revenueAtRisk: riskPatterns.reduce((sum, p) => sum + Math.abs(p.businessImpact.revenue), 0),
          topRisks: riskPatterns.slice(0, 5)
        };
      }

      if (focus === 'opportunities' || focus === 'overview') {
        const opportunityPatterns = this.patternEngine.analyzePatterns(milestones, correlations, businessGoals, [])
          .filter(p => p.type === 'opportunity');
        
        dashboard.opportunityAnalysis = {
          totalOpportunities: opportunityPatterns.length,
          criticalOpportunities: opportunityPatterns.filter(p => p.businessImpact.opportunity === 'critical'),
          revenueOpportunity: opportunityPatterns.reduce((sum, p) => sum + Math.max(0, p.businessImpact.revenue), 0),
          topOpportunities: opportunityPatterns.slice(0, 5)
        };
      }

      if (focus === 'performance' || focus === 'overview') {
        const trends = this.patternEngine.generateTrendAnalysis(milestones, timeframe);
        
        dashboard.performanceTrends = {
          totalTrends: trends.length,
          improvingTrends: trends.filter(t => t.direction === 'increasing').length,
          decliningTrends: trends.filter(t => t.direction === 'decreasing').length,
          trendData: trends
        };
      }

      // Strategic recommendations for dashboard
      dashboard.strategicRecommendations = this.generateDashboardRecommendations(dashboard);

      return {
        success: true,
        data: dashboard,
        message: `Strategic dashboard generated for ${timeframe} timeframe with ${focus} focus`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate strategic dashboard: ${error}`
      };
    }
  }

  async generateGoalHealthReport(args: {
    goalId?: string;
    includeForecasting?: boolean;
    includeRecommendations?: boolean;
  } = {}): Promise<ToolResponse> {
    try {
      const { goalId, includeForecasting = true, includeRecommendations = true } = args;

      await this.milestoneTracker.loadMilestones();
      const data = await this.storage.load();
      
      const milestones = this.milestoneTracker.getAllMilestones();
      const businessGoals = Object.values(data.goals || {});

      let targetGoals = businessGoals;
      if (goalId) {
        targetGoals = businessGoals.filter(g => g.id === goalId);
        if (targetGoals.length === 0) {
          return {
            success: false,
            error: `Goal ${goalId} not found`
          };
        }
      }

      const correlations = [];
      for (const milestone of milestones) {
        const milestoneCorrelations = this.correlationEngine.analyzeCorrelation(milestone, businessGoals);
        correlations.push(...milestoneCorrelations);
      }

      const report: any = {
        generatedAt: new Date().toISOString(),
        scope: goalId ? 'single-goal' : 'all-goals',
        totalGoals: targetGoals.length
      };

      // Generate health assessments
      const healthAssessments = [];
      const velocityMetrics = [];
      const completionForecasts = [];

      for (const goal of targetGoals) {
        const relatedMilestones = milestones.filter(m => m.linkedGoals.includes(goal.id));
        const goalCorrelations = correlations.filter(c => c.businessGoalId === goal.id);
        
        const healthAssessment = this.goalAnalytics.assessGoalHealth(goal, relatedMilestones, goalCorrelations);
        healthAssessments.push(healthAssessment);

        const velocity = this.goalAnalytics.calculateVelocityMetrics(goal, milestones);
        velocityMetrics.push(velocity);

        if (includeForecasting) {
          const forecast = this.goalAnalytics.generateCompletionForecast(goal, milestones, goalCorrelations);
          completionForecasts.push(forecast);
        }
      }

      report.healthAssessments = {
        total: healthAssessments.length,
        healthDistribution: this.getHealthDistribution(healthAssessments),
        averageHealthScore: healthAssessments.reduce((sum, h) => sum + h.healthScore, 0) / healthAssessments.length,
        data: healthAssessments
      };

      report.velocityAnalysis = {
        total: velocityMetrics.length,
        averageEfficiency: velocityMetrics.reduce((sum, v) => sum + v.efficiency, 0) / velocityMetrics.length,
        acceleratingGoals: velocityMetrics.filter(v => v.velocityTrend === 'accelerating').length,
        stalledGoals: velocityMetrics.filter(v => v.velocityTrend === 'stalled').length,
        data: velocityMetrics
      };

      if (includeForecasting) {
        report.completionForecasts = {
          total: completionForecasts.length,
          averageConfidence: completionForecasts.reduce((sum, f) => sum + f.confidence, 0) / completionForecasts.length,
          data: completionForecasts
        };
      }

      if (includeRecommendations) {
        report.recommendations = this.generateGoalHealthRecommendations(healthAssessments, velocityMetrics);
      }

      // Overall goal portfolio health
      report.portfolioHealth = {
        overallScore: report.healthAssessments.averageHealthScore,
        riskFactors: this.identifyPortfolioRisks(healthAssessments),
        strengthAreas: this.identifyPortfolioStrengths(healthAssessments),
        strategicPriorities: this.identifyStrategicPriorities(healthAssessments, velocityMetrics)
      };

      return {
        success: true,
        data: report,
        message: `Goal health report generated for ${targetGoals.length} goals with ${report.healthAssessments.averageHealthScore.toFixed(1)}% average health score`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate goal health report: ${error}`
      };
    }
  }

  async generatePatternAnalysisReport(args: {
    patternTypes?: string[];
    confidenceThreshold?: number;
    includeActionablePlan?: boolean;
  } = {}): Promise<ToolResponse> {
    try {
      const { 
        patternTypes = ['efficiency', 'velocity', 'correlation', 'risk', 'opportunity'], 
        confidenceThreshold = 70,
        includeActionablePlan = true 
      } = args;

      await this.milestoneTracker.loadMilestones();
      const data = await this.storage.load();
      
      const milestones = this.milestoneTracker.getAllMilestones();
      const businessGoals = Object.values(data.goals || {});
      const conversations = Object.values(data.conversations || {});

      const correlations = [];
      for (const milestone of milestones) {
        const milestoneCorrelations = this.correlationEngine.analyzeCorrelation(milestone, businessGoals);
        correlations.push(...milestoneCorrelations);
      }

      // Analyze patterns
      const allPatterns = this.patternEngine.analyzePatterns(milestones, correlations, businessGoals, conversations);
      const filteredPatterns = allPatterns.filter(p => 
        patternTypes.includes(p.type) && p.confidence >= confidenceThreshold
      );

      const report: any = {
        generatedAt: new Date().toISOString(),
        analysisParameters: {
          patternTypes,
          confidenceThreshold,
          totalPatternsFound: allPatterns.length,
          qualifyingPatterns: filteredPatterns.length
        }
      };

      // Pattern analysis by type
      report.patternAnalysis = {};
      patternTypes.forEach(type => {
        const typePatterns = filteredPatterns.filter(p => p.type === type);
        report.patternAnalysis[type] = {
          count: typePatterns.length,
          averageConfidence: typePatterns.length > 0 
            ? typePatterns.reduce((sum, p) => sum + p.confidence, 0) / typePatterns.length 
            : 0,
          totalBusinessImpact: typePatterns.reduce((sum, p) => sum + Math.abs(p.businessImpact.revenue), 0),
          patterns: typePatterns
        };
      });

      // Trend analysis
      const trends = this.patternEngine.generateTrendAnalysis(milestones, '90-days');
      const crossAnalyses = this.patternEngine.analyzeCorrelationsAcrossMilestones(milestones, correlations);

      report.trendAnalysis = {
        totalTrends: trends.length,
        significantTrends: trends.filter(t => t.confidence >= confidenceThreshold),
        crossMilestonePatterns: crossAnalyses.length,
        data: {
          trends: trends.filter(t => t.confidence >= confidenceThreshold),
          crossAnalyses
        }
      };

      // Pattern insights
      report.insights = {
        strengthPatterns: filteredPatterns.filter(p => p.type === 'efficiency' || p.type === 'opportunity'),
        riskPatterns: filteredPatterns.filter(p => p.type === 'risk'),
        emergingPatterns: filteredPatterns.filter(p => p.frequency === 1), // New patterns
        consistentPatterns: filteredPatterns.filter(p => p.frequency > 2) // Recurring patterns
      };

      if (includeActionablePlan) {
        report.actionablePlan = this.generatePatternActionPlan(filteredPatterns, trends);
      }

      return {
        success: true,
        data: report,
        message: `Pattern analysis completed. Found ${filteredPatterns.length} qualifying patterns across ${patternTypes.length} categories with ${confidenceThreshold}%+ confidence`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate pattern analysis report: ${error}`
      };
    }
  }

  async generateExecutiveInsightsBrief(args: {
    timeframe?: '30-days' | '90-days' | '6-months';
    focusAreas?: string[];
  } = {}): Promise<ToolResponse> {
    try {
      const { timeframe = '90-days', focusAreas = ['all'] } = args;

      // Run comprehensive analysis
      const analysisResult = await this.runComprehensiveAnalysis({
        includePatterns: true,
        includeTrends: true,
        includeGoalHealth: true,
        includeInsights: true,
        analysisDepth: 'comprehensive'
      });

      if (!analysisResult.success) {
        return analysisResult;
      }

      const analysis = analysisResult.data;
      const insights = analysis.insights?.data || [];

      // Generate executive summary
      const executiveSummary = this.insightGenerator.generateExecutiveSummary(insights);

      const brief: any = {
        generatedAt: new Date().toISOString(),
        timeframe,
        focusAreas,
        executiveSummary,

        // Strategic highlights
        strategicHighlights: {
          criticalInsights: insights.filter((i: any) => i.priority === 'critical').length,
          revenueOpportunity: executiveSummary.businessImpactSummary.totalRevenueOpportunity,
          revenueAtRisk: executiveSummary.businessImpactSummary.totalRevenueAtRisk,
          keyThemes: executiveSummary.strategicThemes.slice(0, 3)
        },

        // Immediate actions required
        immediateActions: insights
          .filter((i: any) => i.urgency === 'immediate')
          .slice(0, 5)
          .map((i: any) => ({
            title: i.title,
            action: i.actionableRecommendations[0]?.action,
            rationale: i.actionableRecommendations[0]?.rationale,
            businessImpact: i.businessImpact.revenue
          })),

        // Strategic opportunities
        keyOpportunities: insights
          .filter((i: any) => i.type === 'opportunity')
          .slice(0, 3)
          .map((i: any) => ({
            title: i.title,
            description: i.description,
            revenueImpact: i.businessImpact.revenue,
            timeframe: i.businessImpact.timeframe,
            confidence: i.confidence
          })),

        // Risk assessment
        riskAssessment: {
          criticalRisks: insights.filter((i: any) => i.type === 'risk' && i.priority === 'critical').length,
          totalRiskExposure: insights
            .filter((i: any) => i.type === 'risk')
            .reduce((sum: number, i: any) => sum + Math.abs(i.businessImpact.revenue), 0),
          topRisks: insights
            .filter((i: any) => i.type === 'risk')
            .slice(0, 3)
            .map((i: any) => ({
              title: i.title,
              description: i.description,
              impact: Math.abs(i.businessImpact.revenue),
              urgency: i.urgency
            }))
        },

        // Performance metrics
        performanceMetrics: {
          overallStrategicScore: analysis.strategicScore,
          goalHealthAverage: analysis.goalHealth?.averageHealthScore || 0,
          developmentVelocity: analysis.summary?.dataPoints || {},
          correlationStrength: analysis.patterns?.byType || {}
        }
      };

      // Add focus area specific content
      if (focusAreas.includes('competitive-advantage') || focusAreas.includes('all')) {
        brief.competitiveAdvantages = insights
          .filter((i: any) => i.type === 'competitive-advantage')
          .map((i: any) => ({
            title: i.title,
            description: i.description,
            sustainability: i.businessImpact.timeframe,
            advantage: i.supportingEvidence[0]?.description
          }));
      }

      return {
        success: true,
        data: brief,
        message: `Executive insights brief generated covering ${timeframe} with ${executiveSummary.totalInsights} total insights and ${executiveSummary.criticalInsights} critical items`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate executive insights brief: ${error}`
      };
    }
  }

  // Helper methods
  private groupPatternsByType(patterns: any[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    patterns.forEach((p: any) => {
      grouped[p.type] = (grouped[p.type] || 0) + 1;
    });
    return grouped;
  }

  private groupInsightsByType(insights: any[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    insights.forEach((i: any) => {
      grouped[i.type] = (grouped[i.type] || 0) + 1;
    });
    return grouped;
  }

  private groupInsightsByPriority(insights: any[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    insights.forEach((i: any) => {
      grouped[i.priority] = (grouped[i.priority] || 0) + 1;
    });
    return grouped;
  }

  private getHealthDistribution(assessments: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    assessments.forEach((a: any) => {
      distribution[a.overallHealth] = (distribution[a.overallHealth] || 0) + 1;
    });
    return distribution;
  }

  private calculateOverallStrategicScore(analysis: any): number {
    let score = 50; // Base score

    // Factor in goal health
    if (analysis.goalHealth) {
      score += (analysis.goalHealth.averageHealthScore - 50) * 0.3;
    }

    // Factor in patterns
    if (analysis.patterns) {
      const positivePatterns = (analysis.patterns.byType.efficiency || 0) + (analysis.patterns.byType.opportunity || 0);
      const negativePatterns = analysis.patterns.byType.risk || 0;
      score += (positivePatterns - negativePatterns) * 5;
    }

    // Factor in insights
    if (analysis.insights) {
      const criticalInsights = analysis.insights.byPriority.critical || 0;
      score -= criticalInsights * 10; // Critical insights reduce score (they need attention)
      
      const opportunities = analysis.insights.byType.opportunity || 0;
      score += opportunities * 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  private generateKeyRecommendations(analysis: any): string[] {
    const recommendations: string[] = [];

    if (analysis.goalHealth?.criticalGoals?.length > 0) {
      recommendations.push(`Address ${analysis.goalHealth.criticalGoals.length} critical goal health issues immediately`);
    }

    if (analysis.insights?.criticalInsights?.length > 0) {
      recommendations.push('Review and act on critical strategic insights');
    }

    if (analysis.patterns?.criticalBusiness?.length > 0) {
      recommendations.push('Leverage high-impact business patterns for competitive advantage');
    }

    return recommendations.slice(0, 5);
  }

  private calculateDevelopmentVelocity(milestones: any[]): number {
    const completed = milestones.filter((m: any) => m.status === 'completed' && m.completionDate);
    if (completed.length < 2) return 0;

    const completionDates = completed.map((m: any) => new Date(m.completionDate).getTime()).sort();
    const timeSpan = (completionDates[completionDates.length - 1] - completionDates[0]) / (1000 * 60 * 60 * 24 * 30);
    return completed.length / Math.max(timeSpan, 0.5);
  }

  private calculateStrategicAlignment(correlations: any[]): number {
    if (correlations.length === 0) return 0;
    return correlations.reduce((sum: number, c: any) => sum + Math.abs(c.correlationStrength), 0) / correlations.length;
  }

  private calculateBusinessImpactRealization(milestones: any[]): number {
    const completed = milestones.filter((m: any) => m.status === 'completed');
    const total = milestones.reduce((sum: number, m: any) => sum + m.businessContext.revenueImplication, 0);
    const realized = completed.reduce((sum: number, m: any) => sum + m.businessContext.revenueImplication, 0);
    return total > 0 ? (realized / total) * 100 : 0;
  }

  private calculateRiskExposure(milestones: any[]): number {
    const delayed = milestones.filter((m: any) => m.status === 'delayed');
    return delayed.reduce((sum: number, m: any) => sum + m.businessContext.revenueImplication, 0);
  }

  private generateDashboardRecommendations(dashboard: any): string[] {
    const recommendations: string[] = [];

    if (dashboard.riskAnalysis?.criticalRisks?.length > 0) {
      recommendations.push('Address critical risks immediately');
    }

    if (dashboard.performanceIndicators?.developmentVelocity < 1) {
      recommendations.push('Improve development velocity');
    }

    if (dashboard.performanceIndicators?.strategicAlignment < 60) {
      recommendations.push('Strengthen technical-business alignment');
    }

    return recommendations;
  }

  private generateGoalHealthRecommendations(healthAssessments: any[], velocityMetrics: any[]): string[] {
    const recommendations: string[] = [];

    const criticalGoals = healthAssessments.filter(h => h.overallHealth === 'critical');
    if (criticalGoals.length > 0) {
      recommendations.push(`Immediately address ${criticalGoals.length} critical goal(s)`);
    }

    const stalledVelocity = velocityMetrics.filter(v => v.velocityTrend === 'stalled');
    if (stalledVelocity.length > 0) {
      recommendations.push(`Investigate and restart progress on ${stalledVelocity.length} stalled goal(s)`);
    }

    return recommendations;
  }

  private identifyPortfolioRisks(healthAssessments: any[]): string[] {
    const risks: string[] = [];
    
    const criticalCount = healthAssessments.filter(h => h.overallHealth === 'critical').length;
    if (criticalCount > 0) {
      risks.push(`${criticalCount} goals in critical health status`);
    }

    return risks;
  }

  private identifyPortfolioStrengths(healthAssessments: any[]): string[] {
    const strengths: string[] = [];
    
    const excellentCount = healthAssessments.filter(h => h.overallHealth === 'excellent').length;
    if (excellentCount > 0) {
      strengths.push(`${excellentCount} goals performing excellently`);
    }

    return strengths;
  }

  private identifyStrategicPriorities(healthAssessments: any[], velocityMetrics: any[]): string[] {
    const priorities: string[] = [];

    // Priority 1: Fix critical goals
    const criticalGoals = healthAssessments.filter(h => h.overallHealth === 'critical');
    if (criticalGoals.length > 0) {
      priorities.push('Address critical goal health issues');
    }

    // Priority 2: Accelerate stalled goals
    const stalledGoals = velocityMetrics.filter(v => v.velocityTrend === 'stalled');
    if (stalledGoals.length > 0) {
      priorities.push('Restart progress on stalled goals');
    }

    return priorities;
  }

  private generatePatternActionPlan(patterns: any[], trends: any[]): any {
    return {
      immediateActions: patterns
        .filter(p => p.businessImpact.urgency === 'critical')
        .map(p => p.recommendations[0]),
      
      shortTermActions: patterns
        .filter(p => p.businessImpact.urgency === 'high')
        .map(p => p.recommendations[0]),
      
      longTermActions: patterns
        .filter(p => p.type === 'opportunity')
        .map(p => p.recommendations[0])
    };
  }
}