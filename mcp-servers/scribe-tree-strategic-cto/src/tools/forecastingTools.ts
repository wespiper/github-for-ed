// Forecasting tools that integrate advanced forecasting and competitive intelligence
import { v4 as uuidv4 } from 'uuid';
import { ToolResponse } from '../types/index.js';
import { StorageAdapter } from '../storage/StorageAdapter.js';
import { TechnicalMilestoneTracker } from '../intelligence/technicalMilestoneTracker.js';
import { ProgressCorrelationEngine } from '../intelligence/progressCorrelationEngine.js';
import { AdvancedForecastingEngine } from '../forecasting/advancedForecastingEngine.js';
import { CompetitiveIntelligenceTracker } from '../forecasting/competitiveIntelligenceTracker.js';

export class ForecastingTools {
  private milestoneTracker: TechnicalMilestoneTracker;
  private correlationEngine: ProgressCorrelationEngine;
  private forecastingEngine: AdvancedForecastingEngine;
  private competitiveTracker: CompetitiveIntelligenceTracker;

  constructor(private storage: StorageAdapter) {
    this.milestoneTracker = new TechnicalMilestoneTracker(storage);
    this.correlationEngine = new ProgressCorrelationEngine();
    this.forecastingEngine = new AdvancedForecastingEngine();
    this.competitiveTracker = new CompetitiveIntelligenceTracker();
  }

  async generateScenarioForecast(args: {
    timeframe: '3-months' | '6-months' | '12-months' | '18-months' | '24-months';
    focusArea?: 'revenue' | 'growth' | 'market-share' | 'technical' | 'all';
    includeDisruption?: boolean;
  } = { timeframe: '12-months' }): Promise<ToolResponse> {
    try {
      const { timeframe, focusArea = 'all', includeDisruption = true } = args;

      // Load data
      await this.milestoneTracker.loadMilestones();
      const data = await this.storage.load();
      
      const milestones = this.milestoneTracker.getAllMilestones();
      const businessGoals = Object.values(data.goals || {});

      // Generate correlations
      const correlations = [];
      for (const milestone of milestones) {
        const milestoneCorrelations = this.correlationEngine.analyzeCorrelation(milestone, businessGoals);
        correlations.push(...milestoneCorrelations);
      }

      // Generate multi-scenario forecast
      const scenarios = this.forecastingEngine.generateMultiScenarioForecast(
        milestones, businessGoals, correlations, timeframe, focusArea
      );

      // Calculate weighted forecast
      const weightedForecast = this.calculateWeightedForecast(scenarios);

      // Generate strategic recommendations
      const recommendations = this.generateForecastRecommendations(scenarios, weightedForecast);

      return {
        success: true,
        data: {
          timeframe,
          focusArea,
          scenarios: includeDisruption ? scenarios : scenarios.filter(s => !s.id.includes('disruption')),
          weightedForecast,
          recommendations,
          keyInsights: this.extractKeyInsights(scenarios),
          confidenceAnalysis: this.analyzeConfidenceLevels(scenarios)
        },
        message: `Generated ${scenarios.length} scenario forecasts for ${timeframe} timeframe with balanced optimism/pessimism weighting (25%/50%/25%)`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate scenario forecast: ${error}`
      };
    }
  }

  async identifyStrategyGaps(args: {
    marketContext?: string[];
    minSeverity?: 'minor' | 'moderate' | 'significant' | 'critical';
  } = {}): Promise<ToolResponse> {
    try {
      const { marketContext, minSeverity = 'moderate' } = args;

      // Load data
      await this.milestoneTracker.loadMilestones();
      const data = await this.storage.load();
      
      const milestones = this.milestoneTracker.getAllMilestones();
      const businessGoals = Object.values(data.goals || {});

      // Generate correlations
      const correlations = [];
      for (const milestone of milestones) {
        const milestoneCorrelations = this.correlationEngine.analyzeCorrelation(milestone, businessGoals);
        correlations.push(...milestoneCorrelations);
      }

      // Identify strategy gaps
      const allGaps = this.forecastingEngine.identifyStrategyGaps(
        milestones, businessGoals, correlations, marketContext
      );

      // Filter by severity
      const severityLevels = ['minor', 'moderate', 'significant', 'critical'];
      const minSeverityIndex = severityLevels.indexOf(minSeverity);
      const filteredGaps = allGaps.filter(gap => 
        severityLevels.indexOf(gap.severity) >= minSeverityIndex
      );

      // Calculate total impact
      const totalImpact = {
        revenueAtRisk: filteredGaps.reduce((sum, gap) => sum + gap.estimatedImpact.revenueAtRisk, 0),
        opportunityCost: filteredGaps.reduce((sum, gap) => sum + gap.estimatedImpact.opportunityCost, 0)
      };

      // Group gaps by category
      const gapsByCategory = this.groupGapsByCategory(filteredGaps);

      return {
        success: true,
        data: {
          totalGaps: filteredGaps.length,
          gapsByCategory,
          totalImpact,
          gaps: filteredGaps,
          actionPlan: this.generateGapActionPlan(filteredGaps)
        },
        message: `Identified ${filteredGaps.length} strategy gaps with ${minSeverity}+ severity. Total revenue at risk: $${totalImpact.revenueAtRisk.toLocaleString()}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to identify strategy gaps: ${error}`
      };
    }
  }

  async generateCompetitiveIntelligence(args: {
    marketSegment?: string;
    marketSize?: number;
    competitors?: string[];
    trends?: string[];
  } = {}): Promise<ToolResponse> {
    try {
      // Load data
      await this.milestoneTracker.loadMilestones();
      const data = await this.storage.load();
      
      const milestones = this.milestoneTracker.getAllMilestones();
      const businessGoals = Object.values(data.goals || {});

      // Generate competitive intelligence
      const intelligence = this.competitiveTracker.generateCompetitiveIntelligence(
        milestones,
        businessGoals,
        {
          segment: args.marketSegment,
          size: args.marketSize,
          competitors: args.competitors,
          trends: args.trends
        }
      );

      // Generate summary insights
      const summaryInsights = {
        overallThreatLevel: intelligence.threatAssessment.overallThreatLevel,
        criticalThreats: intelligence.threatAssessment.immediateThreats.filter(t => t.potentialImpact.revenueAtRisk > 100000).length,
        majorOpportunities: intelligence.opportunityMapping.filter(o => o.potentialReturn > 100000).length,
        competitiveAdvantages: this.identifyCompetitiveAdvantages(intelligence),
        urgentActions: intelligence.strategicRecommendations.filter(r => r.priority === 'critical')
      };

      return {
        success: true,
        data: {
          intelligence,
          summaryInsights,
          competitivePositioning: this.assessCompetitivePositioning(intelligence),
          timeHorizonAnalysis: this.analyzeTimeHorizons(intelligence)
        },
        message: `Generated competitive intelligence with ${intelligence.competitorProfiles.length} competitor profiles and ${intelligence.strategicRecommendations.length} strategic recommendations`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate competitive intelligence: ${error}`
      };
    }
  }

  async runWhatIfAnalysis(args: {
    scenarios: Array<{
      name: string;
      description: string;
      assumptions: {
        completionRateChange?: number; // % change in milestone completion rate
        revenueRealizationChange?: number; // % change in revenue realization
        competitorActions?: string[]; // List of competitor actions
        marketChanges?: string[]; // List of market changes
      };
    }>;
    timeframe: '6-months' | '12-months' | '24-months';
  }): Promise<ToolResponse> {
    try {
      const { scenarios, timeframe } = args;

      // Load base data
      await this.milestoneTracker.loadMilestones();
      const data = await this.storage.load();
      
      const milestones = this.milestoneTracker.getAllMilestones();
      const businessGoals = Object.values(data.goals || {});

      // Generate base correlations
      const correlations = [];
      for (const milestone of milestones) {
        const milestoneCorrelations = this.correlationEngine.analyzeCorrelation(milestone, businessGoals);
        correlations.push(...milestoneCorrelations);
      }

      // Run what-if analysis for each scenario
      const whatIfResults = [];
      
      for (const scenario of scenarios) {
        // Apply scenario adjustments
        const adjustedMilestones = this.applyScenarioAdjustments(milestones, scenario.assumptions);
        const adjustedCorrelations = this.adjustCorrelations(correlations, scenario.assumptions);

        // Generate forecast with adjustments
        const scenarioForecasts = this.forecastingEngine.generateMultiScenarioForecast(
          adjustedMilestones, businessGoals, adjustedCorrelations, timeframe
        );

        // Calculate impact
        const baseForecasts = this.forecastingEngine.generateMultiScenarioForecast(
          milestones, businessGoals, correlations, timeframe
        );

        const impact = this.calculateScenarioImpact(baseForecasts, scenarioForecasts);

        whatIfResults.push({
          scenario: scenario.name,
          description: scenario.description,
          assumptions: scenario.assumptions,
          impact,
          keyMetrics: this.extractScenarioKeyMetrics(scenarioForecasts),
          recommendations: this.generateScenarioRecommendations(scenario, impact)
        });
      }

      // Generate comparative analysis
      const comparativeAnalysis = this.compareWhatIfScenarios(whatIfResults);

      return {
        success: true,
        data: {
          scenarios: whatIfResults,
          comparativeAnalysis,
          bestCaseScenario: whatIfResults.reduce((best, current) => 
            current.impact.revenueImpact > best.impact.revenueImpact ? current : best
          ),
          worstCaseScenario: whatIfResults.reduce((worst, current) => 
            current.impact.revenueImpact < worst.impact.revenueImpact ? current : worst
          )
        },
        message: `Completed what-if analysis for ${scenarios.length} scenarios over ${timeframe} timeframe`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to run what-if analysis: ${error}`
      };
    }
  }

  async generateConfidenceIntervals(args: {
    metric: 'revenue' | 'customer-acquisition' | 'market-share' | 'milestone-completion';
    timeframes: Array<'3-months' | '6-months' | '12-months'>;
    confidenceLevels?: number[]; // Default: [50, 75, 90]
  }): Promise<ToolResponse> {
    try {
      const { metric, timeframes, confidenceLevels = [50, 75, 90] } = args;

      // Load data
      await this.milestoneTracker.loadMilestones();
      const data = await this.storage.load();
      
      const milestones = this.milestoneTracker.getAllMilestones();
      const businessGoals = Object.values(data.goals || {});

      // Generate correlations
      const correlations = [];
      for (const milestone of milestones) {
        const milestoneCorrelations = this.correlationEngine.analyzeCorrelation(milestone, businessGoals);
        correlations.push(...milestoneCorrelations);
      }

      const intervals = [];

      for (const timeframe of timeframes) {
        // Generate scenarios for this timeframe
        const scenarios = this.forecastingEngine.generateMultiScenarioForecast(
          milestones, businessGoals, correlations, timeframe
        );

        // Calculate confidence intervals
        const metricValues = this.extractMetricValues(scenarios, metric);
        const intervalData = {
          timeframe,
          metric,
          intervals: confidenceLevels.map(level => ({
            confidenceLevel: level,
            lowerBound: this.calculatePercentile(metricValues, (100 - level) / 2),
            upperBound: this.calculatePercentile(metricValues, 100 - (100 - level) / 2),
            median: this.calculatePercentile(metricValues, 50),
            spread: 0 // Will calculate below
          }))
        };

        // Calculate spread
        intervalData.intervals.forEach(interval => {
          interval.spread = interval.upperBound - interval.lowerBound;
        });

        intervals.push(intervalData);
      }

      // Generate insights about confidence
      const confidenceInsights = this.generateConfidenceInsights(intervals, metric);

      return {
        success: true,
        data: {
          metric,
          intervals,
          confidenceInsights,
          recommendations: this.generateConfidenceRecommendations(intervals, metric)
        },
        message: `Generated confidence intervals for ${metric} across ${timeframes.length} timeframes with balanced optimism/pessimism`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate confidence intervals: ${error}`
      };
    }
  }

  // Helper methods
  private calculateWeightedForecast(scenarios: any[]): any {
    const weights = {
      'Base Case (Realistic)': 0.5,
      'Conservative (Defensive Planning)': 0.25,
      'Optimistic (Upside Case)': 0.25
    };

    const weighted = {
      projectedRevenue: 0,
      customerAcquisition: 0,
      marketShare: 0,
      milestonesCompleted: 0
    };

    scenarios.forEach(scenario => {
      const weight = weights[scenario.name as keyof typeof weights] || 0;
      if (weight > 0) {
        weighted.projectedRevenue += scenario.businessMetrics.projectedRevenue.realistic * weight;
        weighted.customerAcquisition += scenario.businessMetrics.customerAcquisition.realistic * weight;
        weighted.marketShare += scenario.businessMetrics.marketShare.realistic * weight;
        weighted.milestonesCompleted += scenario.technicalMetrics.milestonesCompleted.realistic * weight;
      }
    });

    return {
      projectedRevenue: Math.round(weighted.projectedRevenue),
      customerAcquisition: Math.round(weighted.customerAcquisition),
      marketShare: weighted.marketShare.toFixed(2),
      milestonesCompleted: Math.round(weighted.milestonesCompleted)
    };
  }

  private generateForecastRecommendations(scenarios: any[], weighted: any): string[] {
    const recommendations = [];

    // Revenue recommendations
    if (weighted.projectedRevenue < 100000) {
      recommendations.push('Focus on revenue-generating features to improve projections');
    }

    // Customer acquisition recommendations
    if (weighted.customerAcquisition < 10) {
      recommendations.push('Accelerate go-to-market strategy to increase customer acquisition');
    }

    // Risk mitigation recommendations
    const highRisks = scenarios.flatMap(s => s.riskFactors.filter((r: any) => r.impact === 'critical'));
    if (highRisks.length > 0) {
      recommendations.push('Implement mitigation strategies for critical risks');
    }

    return recommendations;
  }

  private extractKeyInsights(scenarios: any[]): any[] {
    const insights = [];

    // Compare optimistic vs pessimistic spreads
    const optimistic = scenarios.find(s => s.name.includes('Optimistic'));
    const pessimistic = scenarios.find(s => s.name.includes('Conservative'));

    if (optimistic && pessimistic) {
      const revenueSpread = optimistic.businessMetrics.projectedRevenue.optimistic - 
                           pessimistic.businessMetrics.projectedRevenue.conservative;
      
      insights.push({
        type: 'variance',
        insight: `Revenue projections vary by $${revenueSpread.toLocaleString()} between best and worst cases`,
        implication: 'High variance suggests need for adaptive planning'
      });
    }

    return insights;
  }

  private analyzeConfidenceLevels(scenarios: any[]): any {
    const confidences = scenarios.map(s => ({
      scenario: s.name,
      confidence: s.confidence,
      uncertaintyRange: s.uncertaintyRange
    }));

    return {
      averageConfidence: confidences.reduce((sum, c) => sum + c.confidence, 0) / confidences.length,
      maxUncertainty: Math.max(...confidences.map(c => c.uncertaintyRange)),
      confidenceDistribution: confidences
    };
  }

  private groupGapsByCategory(gaps: any[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    gaps.forEach(gap => {
      grouped[gap.category] = (grouped[gap.category] || 0) + 1;
    });
    return grouped;
  }

  private generateGapActionPlan(gaps: any[]): any {
    const criticalGaps = gaps.filter(g => g.severity === 'critical' || g.urgency === 'critical');
    const highPriorityGaps = gaps.filter(g => g.severity === 'significant' || g.urgency === 'high');

    return {
      immediate: criticalGaps.map(g => g.recommendedActions[0]),
      shortTerm: highPriorityGaps.map(g => g.recommendedActions[0]),
      totalCost: gaps.reduce((sum, g) => 
        sum + (g.recommendedActions[0]?.cost || 0), 0
      ),
      totalEffort: this.aggregateEffort(gaps)
    };
  }

  private aggregateEffort(gaps: any[]): string {
    const effortLevels = gaps.map(g => g.recommendedActions[0]?.effort || 'medium');
    const highEffortCount = effortLevels.filter(e => e === 'high').length;
    
    if (highEffortCount > gaps.length / 2) return 'high';
    if (highEffortCount > 0) return 'medium-high';
    return 'medium';
  }

  private identifyCompetitiveAdvantages(intelligence: any): string[] {
    const advantages = [];

    // Privacy advantage
    if (intelligence.marketAnalysis.keyTrends.some((t: any) => 
      t.id === 'privacy-regulations' && t.ourPositioning === 'advantage'
    )) {
      advantages.push('Privacy-by-design architecture');
    }

    // AI philosophy advantage
    const aiWeaknesses = intelligence.competitorProfiles
      .flatMap((c: any) => c.weaknessAreas)
      .filter((w: any) => w.area === 'AI Philosophy');
    
    if (aiWeaknesses.length > 0) {
      advantages.push('Bounded enhancement philosophy');
    }

    return advantages;
  }

  private assessCompetitivePositioning(intelligence: any): any {
    const threats = intelligence.threatAssessment.immediateThreats;
    const opportunities = intelligence.opportunityMapping;

    return {
      position: this.determineMarketPosition(threats, opportunities),
      vulnerabilities: intelligence.threatAssessment.strategicVulnerabilities.length,
      advantages: this.identifyCompetitiveAdvantages(intelligence).length,
      netPosition: opportunities.length - threats.length
    };
  }

  private determineMarketPosition(threats: any[], opportunities: any[]): string {
    const threatScore = threats.reduce((sum, t) => sum + t.probability / 100, 0);
    const opportunityScore = opportunities.reduce((sum, o) => sum + o.potentialReturn / 100000, 0);

    if (opportunityScore > threatScore * 1.5) return 'strong';
    if (opportunityScore > threatScore) return 'favorable';
    if (threatScore > opportunityScore * 1.5) return 'vulnerable';
    return 'balanced';
  }

  private analyzeTimeHorizons(intelligence: any): any {
    const immediateActions = intelligence.strategicRecommendations
      .filter((r: any) => r.timeframe.includes('2-4') || r.timeframe.includes('3-6'));
    
    const mediumTermActions = intelligence.strategicRecommendations
      .filter((r: any) => r.timeframe.includes('6-12'));

    return {
      immediate: immediateActions.length,
      mediumTerm: mediumTermActions.length,
      criticalTimingRisks: intelligence.threatAssessment.immediateThreats
        .filter((t: any) => t.timeToMaterialize.includes('3-6') || t.timeToMaterialize.includes('1-3'))
        .length
    };
  }

  private applyScenarioAdjustments(milestones: any[], assumptions: any): any[] {
    // Clone milestones and apply adjustments
    return milestones.map(m => ({
      ...m,
      // Adjust completion likelihood based on assumptions
      status: this.adjustMilestoneStatus(m.status, assumptions.completionRateChange)
    }));
  }

  private adjustMilestoneStatus(currentStatus: string, completionRateChange?: number): string {
    if (!completionRateChange || currentStatus === 'completed') return currentStatus;
    
    // Simple adjustment logic
    if (completionRateChange > 20 && currentStatus === 'in-progress') {
      return 'completed';
    }
    if (completionRateChange < -20 && currentStatus === 'in-progress') {
      return 'delayed';
    }
    
    return currentStatus;
  }

  private adjustCorrelations(correlations: any[], assumptions: any): any[] {
    const revenueMultiplier = 1 + (assumptions.revenueRealizationChange || 0) / 100;
    
    return correlations.map(c => ({
      ...c,
      correlationStrength: Math.min(100, Math.max(0, c.correlationStrength * revenueMultiplier))
    }));
  }

  private calculateScenarioImpact(baseForecasts: any[], scenarioForecasts: any[]): any {
    const baseRevenue = this.calculateWeightedForecast(baseForecasts).projectedRevenue;
    const scenarioRevenue = this.calculateWeightedForecast(scenarioForecasts).projectedRevenue;

    return {
      revenueImpact: scenarioRevenue - baseRevenue,
      percentageChange: ((scenarioRevenue - baseRevenue) / baseRevenue) * 100
    };
  }

  private extractScenarioKeyMetrics(forecasts: any[]): any {
    const weighted = this.calculateWeightedForecast(forecasts);
    return {
      revenue: weighted.projectedRevenue,
      customers: weighted.customerAcquisition,
      marketShare: weighted.marketShare,
      milestones: weighted.milestonesCompleted
    };
  }

  private generateScenarioRecommendations(scenario: any, impact: any): string[] {
    const recommendations = [];

    if (impact.revenueImpact > 50000) {
      recommendations.push(`Pursue strategies aligned with "${scenario.name}" scenario`);
    }
    
    if (impact.percentageChange < -20) {
      recommendations.push(`Develop contingency plans for "${scenario.name}" scenario`);
    }

    return recommendations;
  }

  private compareWhatIfScenarios(results: any[]): any {
    return {
      bestPerformer: results.reduce((best, current) => 
        current.impact.revenueImpact > best.impact.revenueImpact ? current.scenario : best.scenario
      , results[0]?.scenario),
      
      riskiestScenario: results.reduce((riskiest, current) => 
        current.impact.revenueImpact < riskiest.impact.revenueImpact ? current.scenario : riskiest.scenario
      , results[0]?.scenario),
      
      revenueRange: {
        min: Math.min(...results.map(r => r.keyMetrics.revenue)),
        max: Math.max(...results.map(r => r.keyMetrics.revenue))
      }
    };
  }

  private extractMetricValues(scenarios: any[], metric: string): number[] {
    const values: number[] = [];

    scenarios.forEach(scenario => {
      switch (metric) {
        case 'revenue':
          values.push(
            scenario.businessMetrics.projectedRevenue.conservative,
            scenario.businessMetrics.projectedRevenue.realistic,
            scenario.businessMetrics.projectedRevenue.optimistic
          );
          break;
        case 'customer-acquisition':
          values.push(
            scenario.businessMetrics.customerAcquisition.conservative,
            scenario.businessMetrics.customerAcquisition.realistic,
            scenario.businessMetrics.customerAcquisition.optimistic
          );
          break;
        case 'market-share':
          values.push(
            scenario.businessMetrics.marketShare.conservative,
            scenario.businessMetrics.marketShare.realistic,
            scenario.businessMetrics.marketShare.optimistic
          );
          break;
        case 'milestone-completion':
          values.push(
            scenario.technicalMetrics.milestonesCompleted.conservative,
            scenario.technicalMetrics.milestonesCompleted.realistic,
            scenario.technicalMetrics.milestonesCompleted.optimistic
          );
          break;
      }
    });

    return values.sort((a, b) => a - b);
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const index = (percentile / 100) * (values.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (lower === upper) {
      return values[lower];
    }

    return values[lower] * (1 - weight) + values[upper] * weight;
  }

  private generateConfidenceInsights(intervals: any[], metric: string): any[] {
    const insights = [];

    // Analyze spread growth over time
    const spreadGrowth = intervals.map(i => i.intervals[0].spread);
    if (spreadGrowth.length > 1) {
      const growthRate = (spreadGrowth[spreadGrowth.length - 1] - spreadGrowth[0]) / spreadGrowth[0];
      insights.push({
        type: 'uncertainty-growth',
        insight: `Uncertainty for ${metric} increases by ${(growthRate * 100).toFixed(1)}% over time`,
        implication: growthRate > 0.5 ? 'High uncertainty growth requires adaptive planning' : 'Moderate uncertainty is manageable'
      });
    }

    return insights;
  }

  private generateConfidenceRecommendations(intervals: any[], metric: string): string[] {
    const recommendations = [];

    // Check if uncertainty is too high
    const maxSpread = Math.max(...intervals.flatMap(i => i.intervals.map((int: any) => int.spread)));
    const avgMedian = intervals.reduce((sum, i) => sum + i.intervals[0].median, 0) / intervals.length;

    if (maxSpread > avgMedian * 0.5) {
      recommendations.push(`High uncertainty in ${metric} projections - consider scenario planning`);
    }

    return recommendations;
  }
}