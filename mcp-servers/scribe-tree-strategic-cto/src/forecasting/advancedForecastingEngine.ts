// Advanced forecasting and scenario planning with realistic confidence modeling
import { TechnicalMilestone } from '../intelligence/technicalMilestoneTracker.js';
import { BusinessGoal } from '../types/index.js';
import { ProgressCorrelation } from '../intelligence/progressCorrelationEngine.js';

export interface ScenarioForecast {
  id: string;
  name: string;
  description: string;
  timeframe: '3-months' | '6-months' | '12-months' | '18-months' | '24-months';
  confidence: number; // 0-100, but capped at 85% max for realism
  assumptions: ForecastAssumption[];
  
  businessMetrics: {
    projectedRevenue: {
      conservative: number;
      realistic: number;
      optimistic: number;
    };
    customerAcquisition: {
      conservative: number;
      realistic: number;
      optimistic: number;
    };
    marketShare: {
      conservative: number;
      realistic: number;
      optimistic: number;
    };
  };
  
  technicalMetrics: {
    milestonesCompleted: {
      conservative: number;
      realistic: number;
      optimistic: number;
    };
    developmentVelocity: {
      conservative: number;
      realistic: number;
      optimistic: number;
    };
    qualityMetrics: {
      conservative: number;
      realistic: number;
      optimistic: number;
    };
  };
  
  riskFactors: ScenarioRisk[];
  opportunityFactors: ScenarioOpportunity[];
  uncertaintyRange: number; // How much variance we expect
  lastUpdated: string;
}

export interface ForecastAssumption {
  id: string;
  category: 'market' | 'technical' | 'competitive' | 'resource' | 'external';
  description: string;
  confidence: number; // 0-100
  impactIfWrong: 'minimal' | 'moderate' | 'significant' | 'critical';
  evidence: string[];
  alternativeScenarios: string[];
}

export interface ScenarioRisk {
  id: string;
  description: string;
  probability: number; // 0-100, but we bias toward higher probabilities for realism
  impact: 'low' | 'medium' | 'high' | 'critical';
  mitigationStrategies: string[];
  timeToMaterialize: string;
}

export interface ScenarioOpportunity {
  id: string;
  description: string;
  probability: number; // 0-100, but we bias toward lower probabilities for realism
  impact: 'low' | 'medium' | 'high' | 'critical';
  captureStrategies: string[];
  timeToRealize: string;
}

export interface StrategyGap {
  id: string;
  category: 'market-understanding' | 'competitive-positioning' | 'technical-capability' | 'business-model' | 'execution' | 'resource-allocation';
  severity: 'minor' | 'moderate' | 'significant' | 'critical';
  description: string;
  evidenceOfGap: string[];
  competitorAdvantages: string[];
  recommendedActions: GapRemediation[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  estimatedImpact: {
    revenueAtRisk: number;
    opportunityCost: number;
    competitiveDisadvantage: string;
  };
}

export interface GapRemediation {
  action: string;
  timeframe: string;
  effort: 'low' | 'medium' | 'high';
  cost: number;
  expectedOutcome: string;
  successProbability: number; // Conservative estimates
}

export interface CompetitivePosition {
  id: string;
  competitorName: string;
  category: 'direct' | 'indirect' | 'emerging' | 'platform';
  strengthAreas: CompetitiveStrength[];
  weaknessAreas: CompetitiveWeakness[];
  overallThreatLevel: 'low' | 'medium' | 'high' | 'critical';
  marketPosition: 'leader' | 'challenger' | 'follower' | 'niche';
  differentiationStrategy: string;
  counterStrategies: string[];
}

export interface CompetitiveStrength {
  area: string;
  description: string;
  impact: 'minimal' | 'moderate' | 'significant' | 'critical';
  sustainability: 'temporary' | 'medium-term' | 'long-term' | 'permanent';
  ourResponse: string;
}

export interface CompetitiveWeakness {
  area: string;
  description: string;
  exploitability: 'low' | 'medium' | 'high';
  timeWindow: string;
  ourAdvantage: string;
}

export class AdvancedForecastingEngine {
  
  // Maximum confidence we'll ever assign - keeps us humble
  private static MAX_CONFIDENCE = 85;
  
  // Default weightings for balanced expectations
  private static SCENARIO_WEIGHTS = {
    pessimistic: 0.25,  // 25% weight - balanced pessimism
    realistic: 0.5,     // 50% weight - most likely outcome
    optimistic: 0.25    // 25% weight - balanced optimism
  };

  generateMultiScenarioForecast(
    milestones: TechnicalMilestone[],
    goals: BusinessGoal[],
    correlations: ProgressCorrelation[],
    timeframe: ScenarioForecast['timeframe'],
    focusArea?: 'revenue' | 'growth' | 'market-share' | 'technical' | 'all'
  ): ScenarioForecast[] {
    
    const scenarios: ScenarioForecast[] = [];
    
    // Base scenario - realistic with conservative bias
    const baseScenario = this.generateBaseScenario(milestones, goals, correlations, timeframe);
    scenarios.push(baseScenario);
    
    // Conservative scenario - what if things go wrong
    const conservativeScenario = this.generateConservativeScenario(baseScenario, milestones, goals);
    scenarios.push(conservativeScenario);
    
    // Optimistic scenario - what if everything goes right (but cap the optimism)
    const optimisticScenario = this.generateOptimisticScenario(baseScenario, milestones, goals);
    scenarios.push(optimisticScenario);
    
    // Market disruption scenario - external factors
    const disruptionScenario = this.generateDisruptionScenario(baseScenario, milestones, goals);
    scenarios.push(disruptionScenario);
    
    return scenarios;
  }

  private generateBaseScenario(
    milestones: TechnicalMilestone[],
    goals: BusinessGoal[],
    correlations: ProgressCorrelation[],
    timeframe: ScenarioForecast['timeframe']
  ): ScenarioForecast {
    
    const months = this.parseTimeframeToMonths(timeframe);
    const currentMilestones = milestones.length;
    const completedMilestones = milestones.filter(m => m.status === 'completed').length;
    const inProgressMilestones = milestones.filter(m => m.status === 'in-progress').length;
    
    // Conservative completion rate based on current progress
    const historicalCompletionRate = currentMilestones > 0 ? completedMilestones / currentMilestones : 0.3;
    const adjustedCompletionRate = Math.min(0.7, historicalCompletionRate * 0.8); // 20% haircut for realism
    
    // Revenue projections with conservative bias
    const totalProjectedRevenue = milestones.reduce((sum, m) => sum + m.businessContext.revenueImplication, 0);
    const averageCorrelation = correlations.length > 0 
      ? correlations.reduce((sum, c) => sum + Math.abs(c.correlationStrength), 0) / correlations.length 
      : 40; // Conservative default
    
    const correlationMultiplier = Math.min(0.8, averageCorrelation / 100); // Cap at 80% realization
    
    const assumptions: ForecastAssumption[] = [
      {
        id: 'completion-rate',
        category: 'technical',
        description: `Milestone completion rate of ${(adjustedCompletionRate * 100).toFixed(1)}% based on historical performance`,
        confidence: Math.min(70, (completedMilestones + inProgressMilestones) * 15), // More data = higher confidence
        impactIfWrong: 'significant',
        evidence: [`${completedMilestones} completed, ${inProgressMilestones} in progress out of ${currentMilestones} total`],
        alternativeScenarios: ['Faster completion due to learning curve', 'Slower completion due to complexity creep']
      },
      {
        id: 'revenue-realization',
        category: 'market',
        description: `Revenue realization rate of ${(correlationMultiplier * 100).toFixed(1)}% based on technical-business correlations`,
        confidence: Math.min(60, averageCorrelation), // Confidence based on correlation strength
        impactIfWrong: 'critical',
        evidence: [`Average correlation strength: ${averageCorrelation.toFixed(1)}%`, `${correlations.length} data points`],
        alternativeScenarios: ['Higher realization if market adoption accelerates', 'Lower realization if competitive pressure increases']
      },
      {
        id: 'market-conditions',
        category: 'market',
        description: 'Stable market conditions with gradual growth in educational technology sector',
        confidence: 50, // Market predictions are inherently uncertain
        impactIfWrong: 'significant',
        evidence: ['Historical EdTech growth patterns', 'Current market indicators'],
        alternativeScenarios: ['Rapid AI adoption accelerates market', 'Economic downturn slows EdTech spending']
      }
    ];

    // Balanced risk assessment
    const riskFactors: ScenarioRisk[] = [
      {
        id: 'technical-complexity',
        description: 'Technical complexity may slow development more than expected',
        probability: 50, // Balanced probability for risks
        impact: 'medium',
        mitigationStrategies: ['Break down complex features', 'Add buffer time to estimates', 'Invest in developer tools'],
        timeToMaterialize: '1-3 months'
      },
      {
        id: 'competitive-pressure',
        description: 'Competitors may launch similar features, reducing our advantage window',
        probability: 40,
        impact: 'high',
        mitigationStrategies: ['Accelerate development', 'Focus on unique differentiators', 'Build switching costs'],
        timeToMaterialize: '3-6 months'
      }
    ];

    // Balanced opportunity assessment
    const opportunityFactors: ScenarioOpportunity[] = [
      {
        id: 'privacy-momentum',
        description: 'Growing privacy concerns may accelerate demand for privacy-by-design solutions',
        probability: 45, // Balanced probability for opportunities
        impact: 'high',
        captureStrategies: ['Amplify privacy messaging', 'Target privacy-conscious institutions', 'Thought leadership'],
        timeToRealize: '2-6 months'
      }
    ];

    return {
      id: `base-scenario-${timeframe}`,
      name: 'Base Case (Realistic)',
      description: 'Most likely scenario based on current data with conservative adjustments',
      timeframe,
      confidence: Math.min(AdvancedForecastingEngine.MAX_CONFIDENCE, 65), // Conservative confidence
      assumptions,
      
      businessMetrics: {
        projectedRevenue: {
          conservative: Math.round(totalProjectedRevenue * correlationMultiplier * 0.6),
          realistic: Math.round(totalProjectedRevenue * correlationMultiplier * 0.8),
          optimistic: Math.round(totalProjectedRevenue * correlationMultiplier * 1.0)
        },
        customerAcquisition: {
          conservative: Math.round(months * 2), // Conservative customer growth
          realistic: Math.round(months * 3),
          optimistic: Math.round(months * 5)
        },
        marketShare: {
          conservative: 0.5,
          realistic: 1.0,
          optimistic: 2.0
        }
      },
      
      technicalMetrics: {
        milestonesCompleted: {
          conservative: Math.round(milestones.length * adjustedCompletionRate * 0.7),
          realistic: Math.round(milestones.length * adjustedCompletionRate),
          optimistic: Math.round(milestones.length * adjustedCompletionRate * 1.2)
        },
        developmentVelocity: {
          conservative: 0.8,
          realistic: 1.0,
          optimistic: 1.3
        },
        qualityMetrics: {
          conservative: 85,
          realistic: 90,
          optimistic: 95
        }
      },
      
      riskFactors,
      opportunityFactors,
      uncertaintyRange: 25, // ±25% variance expected
      lastUpdated: new Date().toISOString()
    };
  }

  private generateConservativeScenario(
    baseScenario: ScenarioForecast,
    milestones: TechnicalMilestone[],
    goals: BusinessGoal[]
  ): ScenarioForecast {
    
    // Apply conservative multipliers to base scenario
    const conservativeMultiplier = 0.6;
    
    return {
      ...baseScenario,
      id: `conservative-scenario-${baseScenario.timeframe}`,
      name: 'Conservative (Defensive Planning)',
      description: 'Scenario accounting for likely setbacks and challenges',
      confidence: Math.min(baseScenario.confidence + 10, AdvancedForecastingEngine.MAX_CONFIDENCE), // Higher confidence in bad outcomes
      
      businessMetrics: {
        projectedRevenue: {
          conservative: Math.round(baseScenario.businessMetrics.projectedRevenue.conservative * conservativeMultiplier),
          realistic: Math.round(baseScenario.businessMetrics.projectedRevenue.conservative),
          optimistic: Math.round(baseScenario.businessMetrics.projectedRevenue.realistic)
        },
        customerAcquisition: {
          conservative: Math.round(baseScenario.businessMetrics.customerAcquisition.conservative * conservativeMultiplier),
          realistic: Math.round(baseScenario.businessMetrics.customerAcquisition.conservative),
          optimistic: Math.round(baseScenario.businessMetrics.customerAcquisition.realistic)
        },
        marketShare: {
          conservative: baseScenario.businessMetrics.marketShare.conservative * conservativeMultiplier,
          realistic: baseScenario.businessMetrics.marketShare.conservative,
          optimistic: baseScenario.businessMetrics.marketShare.realistic
        }
      },
      
      technicalMetrics: {
        milestonesCompleted: {
          conservative: Math.round(baseScenario.technicalMetrics.milestonesCompleted.conservative * conservativeMultiplier),
          realistic: Math.round(baseScenario.technicalMetrics.milestonesCompleted.conservative),
          optimistic: Math.round(baseScenario.technicalMetrics.milestonesCompleted.realistic)
        },
        developmentVelocity: {
          conservative: baseScenario.technicalMetrics.developmentVelocity.conservative * conservativeMultiplier,
          realistic: baseScenario.technicalMetrics.developmentVelocity.conservative,
          optimistic: baseScenario.technicalMetrics.developmentVelocity.realistic
        },
        qualityMetrics: {
          conservative: 75,
          realistic: 80,
          optimistic: 85
        }
      },
      
      riskFactors: [
        ...baseScenario.riskFactors,
        {
          id: 'resource-constraints',
          description: 'Development resources become constrained due to competing priorities',
          probability: 70,
          impact: 'high',
          mitigationStrategies: ['Strict prioritization', 'Resource planning', 'Scope reduction'],
          timeToMaterialize: '1-2 months'
        }
      ],
      
      uncertaintyRange: 35 // Higher uncertainty in conservative scenario
    };
  }

  private generateOptimisticScenario(
    baseScenario: ScenarioForecast,
    milestones: TechnicalMilestone[],
    goals: BusinessGoal[]
  ): ScenarioForecast {
    
    // Apply optimistic multipliers balanced with pessimistic scenario
    const optimisticMultiplier = 1.67; // Balanced upside (inverse of 0.6 pessimistic)
    
    return {
      ...baseScenario,
      id: `optimistic-scenario-${baseScenario.timeframe}`,
      name: 'Optimistic (Upside Case)',
      description: 'Scenario where things go better than expected, but within reason',
      confidence: Math.min(baseScenario.confidence - 5, 60), // Balanced confidence in good outcomes
      
      businessMetrics: {
        projectedRevenue: {
          conservative: baseScenario.businessMetrics.projectedRevenue.realistic,
          realistic: Math.round(baseScenario.businessMetrics.projectedRevenue.optimistic),
          optimistic: Math.round(baseScenario.businessMetrics.projectedRevenue.optimistic * optimisticMultiplier)
        },
        customerAcquisition: {
          conservative: baseScenario.businessMetrics.customerAcquisition.realistic,
          realistic: baseScenario.businessMetrics.customerAcquisition.optimistic,
          optimistic: Math.round(baseScenario.businessMetrics.customerAcquisition.optimistic * optimisticMultiplier)
        },
        marketShare: {
          conservative: baseScenario.businessMetrics.marketShare.realistic,
          realistic: baseScenario.businessMetrics.marketShare.optimistic,
          optimistic: baseScenario.businessMetrics.marketShare.optimistic * optimisticMultiplier
        }
      },
      
      technicalMetrics: {
        milestonesCompleted: {
          conservative: baseScenario.technicalMetrics.milestonesCompleted.realistic,
          realistic: baseScenario.technicalMetrics.milestonesCompleted.optimistic,
          optimistic: Math.min(milestones.length, Math.round(baseScenario.technicalMetrics.milestonesCompleted.optimistic * optimisticMultiplier))
        },
        developmentVelocity: {
          conservative: baseScenario.technicalMetrics.developmentVelocity.realistic,
          realistic: baseScenario.technicalMetrics.developmentVelocity.optimistic,
          optimistic: baseScenario.technicalMetrics.developmentVelocity.optimistic * optimisticMultiplier
        },
        qualityMetrics: {
          conservative: 90,
          realistic: 95,
          optimistic: 98
        }
      },
      
      opportunityFactors: [
        ...baseScenario.opportunityFactors,
        {
          id: 'market-acceleration',
          description: 'Educational AI market grows faster than expected due to policy changes',
          probability: 40, // Balanced opportunity probability
          impact: 'critical',
          captureStrategies: ['Rapid scaling', 'Strategic partnerships', 'Thought leadership'],
          timeToRealize: '3-9 months'
        }
      ],
      
      uncertaintyRange: 40 // High uncertainty in optimistic scenarios
    };
  }

  private generateDisruptionScenario(
    baseScenario: ScenarioForecast,
    milestones: TechnicalMilestone[],
    goals: BusinessGoal[]
  ): ScenarioForecast {
    
    return {
      ...baseScenario,
      id: `disruption-scenario-${baseScenario.timeframe}`,
      name: 'Market Disruption (External Factors)',
      description: 'Scenario accounting for significant external market changes',
      confidence: 30, // Low confidence in predicting disruptions
      
      assumptions: [
        ...baseScenario.assumptions,
        {
          id: 'market-disruption',
          category: 'external',
          description: 'Significant change in educational technology landscape (AI regulation, new platforms, etc.)',
          confidence: 20,
          impactIfWrong: 'critical',
          evidence: ['Historical disruption patterns', 'Regulatory signals', 'Technology trends'],
          alternativeScenarios: ['Gradual change', 'No major disruption', 'Multiple smaller disruptions']
        }
      ],
      
      riskFactors: [
        ...baseScenario.riskFactors,
        {
          id: 'platform-disruption',
          description: 'Major education platform launches competing solution',
          probability: 40,
          impact: 'critical',
          mitigationStrategies: ['Differentiation focus', 'Partnership strategy', 'Rapid innovation'],
          timeToMaterialize: '3-12 months'
        },
        {
          id: 'regulatory-change',
          description: 'New AI regulations significantly impact educational AI tools',
          probability: 30,
          impact: 'high',
          mitigationStrategies: ['Compliance preparation', 'Policy engagement', 'Regulatory arbitrage'],
          timeToMaterialize: '6-18 months'
        }
      ],
      
      uncertaintyRange: 60 // Very high uncertainty in disruption scenarios
    };
  }

  identifyStrategyGaps(
    milestones: TechnicalMilestone[],
    goals: BusinessGoal[],
    correlations: ProgressCorrelation[],
    marketContext?: string[]
  ): StrategyGap[] {
    
    const gaps: StrategyGap[] = [];
    
    // Market understanding gaps
    gaps.push(...this.identifyMarketUnderstandingGaps(goals, marketContext));
    
    // Technical capability gaps
    gaps.push(...this.identifyTechnicalCapabilityGaps(milestones, goals));
    
    // Competitive positioning gaps
    gaps.push(...this.identifyCompetitivePositioningGaps(milestones));
    
    // Business model gaps
    gaps.push(...this.identifyBusinessModelGaps(goals, correlations));
    
    // Execution gaps
    gaps.push(...this.identifyExecutionGaps(milestones, goals, correlations));
    
    return gaps.sort((a, b) => {
      const severityWeight = { critical: 4, significant: 3, moderate: 2, minor: 1 };
      const urgencyWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      
      const aScore = severityWeight[a.severity] + urgencyWeight[a.urgency];
      const bScore = severityWeight[b.severity] + urgencyWeight[b.urgency];
      
      return bScore - aScore;
    });
  }

  private identifyMarketUnderstandingGaps(goals: BusinessGoal[], marketContext?: string[]): StrategyGap[] {
    const gaps: StrategyGap[] = [];
    
    // Check if we have market-focused goals
    const marketGoals = goals.filter(g => g.category === 'market');
    if (marketGoals.length === 0) {
      gaps.push({
        id: 'no-market-goals',
        category: 'market-understanding',
        severity: 'significant',
        description: 'No explicit market-focused business goals defined',
        evidenceOfGap: ['Zero goals categorized as market-focused', 'All goals are internal/technical'],
        competitorAdvantages: ['Competitors may have clearer market strategy', 'Market opportunities may be missed'],
        recommendedActions: [{
          action: 'Define 2-3 market-focused goals (customer acquisition, market share, positioning)',
          timeframe: '2-4 weeks',
          effort: 'medium',
          cost: 5000,
          expectedOutcome: 'Clear market strategy with measurable objectives',
          successProbability: 80
        }],
        urgency: 'high',
        estimatedImpact: {
          revenueAtRisk: 50000,
          opportunityCost: 100000,
          competitiveDisadvantage: 'Unclear value proposition and target market'
        }
      });
    }
    
    return gaps;
  }

  private identifyTechnicalCapabilityGaps(milestones: TechnicalMilestone[], goals: BusinessGoal[]): StrategyGap[] {
    const gaps: StrategyGap[] = [];
    
    // Check for goals without technical support
    const unsupportedGoals = goals.filter(goal => {
      const supportingMilestones = milestones.filter(m => m.linkedGoals.includes(goal.id));
      return supportingMilestones.length === 0;
    });
    
    if (unsupportedGoals.length > 0) {
      gaps.push({
        id: 'unsupported-goals',
        category: 'technical-capability',
        severity: 'moderate',
        description: `${unsupportedGoals.length} business goals lack technical implementation plans`,
        evidenceOfGap: unsupportedGoals.map(g => `Goal "${g.title}" has no linked technical milestones`),
        competitorAdvantages: ['May deliver faster due to aligned technical work'],
        recommendedActions: [{
          action: 'Create technical roadmaps for each unsupported business goal',
          timeframe: '3-6 weeks',
          effort: 'medium',
          cost: 15000,
          expectedOutcome: 'Clear technical path to business objectives',
          successProbability: 75
        }],
        urgency: 'medium',
        estimatedImpact: {
          revenueAtRisk: 25000,
          opportunityCost: 50000,
          competitiveDisadvantage: 'Goals without execution plans are unlikely to be achieved'
        }
      });
    }
    
    return gaps;
  }

  private identifyCompetitivePositioningGaps(milestones: TechnicalMilestone[]): StrategyGap[] {
    const gaps: StrategyGap[] = [];
    
    // Check for competitive timing milestones
    const criticalTimingMilestones = milestones.filter(m => m.businessContext.marketTiming === 'critical');
    const delayedCriticalMilestones = criticalTimingMilestones.filter(m => m.status === 'delayed');
    
    if (delayedCriticalMilestones.length > 0) {
      gaps.push({
        id: 'delayed-critical-timing',
        category: 'competitive-positioning',
        severity: 'critical',
        description: `${delayedCriticalMilestones.length} critical timing milestones are delayed, risking competitive position`,
        evidenceOfGap: delayedCriticalMilestones.map(m => `"${m.name}" delayed (${m.businessContext.strategicImportance}% importance)`),
        competitorAdvantages: ['May capture first-mover advantage', 'Could establish market position before us'],
        recommendedActions: [{
          action: 'Emergency sprint to complete critical timing milestones',
          timeframe: '2-4 weeks',
          effort: 'high',
          cost: 30000,
          expectedOutcome: 'Competitive timing preserved',
          successProbability: 60 // Conservative success probability
        }],
        urgency: 'critical',
        estimatedImpact: {
          revenueAtRisk: 150000,
          opportunityCost: 300000,
          competitiveDisadvantage: 'Loss of first-mover advantage in key areas'
        }
      });
    }
    
    return gaps;
  }

  private identifyBusinessModelGaps(goals: BusinessGoal[], correlations: ProgressCorrelation[]): StrategyGap[] {
    const gaps: StrategyGap[] = [];
    
    // Check for weak technical-business correlations
    const weakCorrelations = correlations.filter(c => Math.abs(c.correlationStrength) < 40);
    
    if (weakCorrelations.length > correlations.length * 0.5) {
      gaps.push({
        id: 'weak-tech-business-alignment',
        category: 'business-model',
        severity: 'moderate',
        description: 'Weak correlations between technical work and business outcomes suggest unclear value creation',
        evidenceOfGap: [`${weakCorrelations.length}/${correlations.length} correlations below 40% strength`],
        competitorAdvantages: ['More focused technical work may deliver better business results'],
        recommendedActions: [{
          action: 'Strategic review to align technical roadmap with business model',
          timeframe: '4-6 weeks',
          effort: 'medium',
          cost: 20000,
          expectedOutcome: 'Stronger technical-business alignment',
          successProbability: 70
        }],
        urgency: 'medium',
        estimatedImpact: {
          revenueAtRisk: 40000,
          opportunityCost: 80000,
          competitiveDisadvantage: 'Inefficient resource allocation'
        }
      });
    }
    
    return gaps;
  }

  private identifyExecutionGaps(
    milestones: TechnicalMilestone[], 
    goals: BusinessGoal[], 
    correlations: ProgressCorrelation[]
  ): StrategyGap[] {
    const gaps: StrategyGap[] = [];
    
    // Check milestone completion rate
    const completedMilestones = milestones.filter(m => m.status === 'completed').length;
    const completionRate = milestones.length > 0 ? completedMilestones / milestones.length : 0;
    
    if (completionRate < 0.4 && milestones.length >= 3) {
      gaps.push({
        id: 'low-execution-rate',
        category: 'execution',
        severity: 'significant',
        description: `Low milestone completion rate (${(completionRate * 100).toFixed(1)}%) indicates execution challenges`,
        evidenceOfGap: [`${completedMilestones}/${milestones.length} milestones completed`],
        competitorAdvantages: ['Faster execution may capture market opportunities first'],
        recommendedActions: [{
          action: 'Execution improvement program: process analysis, resource allocation, milestone scope review',
          timeframe: '6-8 weeks',
          effort: 'high',
          cost: 25000,
          expectedOutcome: 'Improved milestone completion rate',
          successProbability: 65
        }],
        urgency: 'high',
        estimatedImpact: {
          revenueAtRisk: 75000,
          opportunityCost: 150000,
          competitiveDisadvantage: 'Slow execution reduces competitive responsiveness'
        }
      });
    }
    
    return gaps;
  }

  private parseTimeframeToMonths(timeframe: ScenarioForecast['timeframe']): number {
    const mapping = {
      '3-months': 3,
      '6-months': 6,
      '12-months': 12,
      '18-months': 18,
      '24-months': 24
    };
    return mapping[timeframe];
  }
}