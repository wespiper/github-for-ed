// Advanced pattern recognition engine for strategic insights
import { TechnicalMilestone } from '../intelligence/technicalMilestoneTracker.js';
import { ProgressCorrelation, CorrelationInsight } from '../intelligence/progressCorrelationEngine.js';
import { BusinessGoal, StrategyConversation } from '../types/index.js';

export interface StrategicPattern {
  id: string;
  type: 'efficiency' | 'velocity' | 'correlation' | 'risk' | 'opportunity' | 'trend';
  name: string;
  description: string;
  confidence: number; // 0-100
  evidence: PatternEvidence[];
  implications: string[];
  recommendations: string[];
  timeframe: string;
  businessImpact: {
    revenue: number;
    risk: 'low' | 'medium' | 'high' | 'critical';
    opportunity: 'low' | 'medium' | 'high' | 'critical';
    urgency: 'low' | 'medium' | 'high' | 'critical';
  };
  lastDetected: string;
  frequency: number; // How often this pattern appears
}

export interface PatternEvidence {
  type: 'milestone' | 'correlation' | 'goal' | 'conversation';
  id: string;
  description: string;
  value: number;
  timestamp: string;
}

export interface TrendAnalysis {
  metric: string;
  direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  velocity: number; // Rate of change
  confidence: number;
  dataPoints: { timestamp: string; value: number }[];
  projection: {
    shortTerm: number; // 3 months
    mediumTerm: number; // 6 months
    longTerm: number; // 12 months
  };
}

export interface CrossMilestoneAnalysis {
  id: string;
  milestoneIds: string[];
  patternType: 'sequential' | 'parallel' | 'dependent' | 'conflicting';
  description: string;
  efficiency: number; // 0-100
  recommendations: string[];
  riskFactors: string[];
}

export class PatternRecognitionEngine {
  private detectedPatterns: Map<string, StrategicPattern> = new Map();
  private trendHistory: Map<string, TrendAnalysis> = new Map();
  private crossMilestoneAnalyses: Map<string, CrossMilestoneAnalysis> = new Map();

  // Scribe Tree specific pattern templates based on our domain
  private static SCRIBE_TREE_PATTERN_TEMPLATES = {
    privacyMomentum: {
      name: 'Privacy-First Development Momentum',
      indicators: ['privacy', 'gdpr', 'ferpa', 'encryption', 'audit'],
      businessImpact: { baseRevenue: 50000, riskReduction: 80 }
    },
    aiPhilosophyAlignment: {
      name: 'Bounded Enhancement Philosophy Execution',
      indicators: ['bounded', 'enhancement', 'ai', 'reflection', 'independence'],
      businessImpact: { baseRevenue: 75000, marketDifferentiation: 95 }
    },
    architectureScaling: {
      name: 'Microservices Architecture Scaling Pattern',
      indicators: ['microservices', 'repository', 'event', 'decoupling'],
      businessImpact: { baseRevenue: 25000, scalabilityGain: 70 }
    },
    educationalInnovation: {
      name: 'Educational Technology Innovation Pattern',
      indicators: ['educational', 'writing', 'transparency', 'trust'],
      businessImpact: { baseRevenue: 40000, marketPositioning: 85 }
    }
  };

  analyzePatterns(
    milestones: TechnicalMilestone[],
    correlations: ProgressCorrelation[],
    goals: BusinessGoal[],
    conversations: StrategyConversation[]
  ): StrategicPattern[] {
    const patterns: StrategicPattern[] = [];

    // Efficiency patterns - detect when work is highly efficient
    patterns.push(...this.detectEfficiencyPatterns(milestones, correlations));

    // Velocity patterns - detect acceleration/deceleration trends  
    patterns.push(...this.detectVelocityPatterns(milestones));

    // Correlation patterns - detect strong correlation clusters
    patterns.push(...this.detectCorrelationPatterns(correlations, milestones, goals));

    // Risk patterns - detect potential issues before they manifest
    patterns.push(...this.detectRiskPatterns(milestones, correlations));

    // Opportunity patterns - detect emerging opportunities
    patterns.push(...this.detectOpportunityPatterns(milestones, goals));

    // Scribe Tree specific domain patterns
    patterns.push(...this.detectDomainSpecificPatterns(milestones, correlations));

    // Store all detected patterns
    patterns.forEach(pattern => this.detectedPatterns.set(pattern.id, pattern));

    return patterns;
  }

  private detectEfficiencyPatterns(
    milestones: TechnicalMilestone[],
    correlations: ProgressCorrelation[]
  ): StrategicPattern[] {
    const patterns: StrategicPattern[] = [];

    // High-efficiency milestone completion pattern
    const completedMilestones = milestones.filter(m => m.status === 'completed');
    if (completedMilestones.length >= 2) {
      const avgStrategicImportance = completedMilestones.reduce((sum, m) => 
        sum + m.businessContext.strategicImportance, 0) / completedMilestones.length;
      
      const avgRevenue = completedMilestones.reduce((sum, m) => 
        sum + m.businessContext.revenueImplication, 0) / completedMilestones.length;

      if (avgStrategicImportance >= 75 && avgRevenue >= 30000) {
        patterns.push({
          id: `efficiency-high-value-completion-${Date.now()}`,
          type: 'efficiency',
          name: 'High-Value Milestone Completion Efficiency',
          description: `Strong pattern of completing high-strategic-importance milestones (avg ${avgStrategicImportance.toFixed(1)}%) with significant revenue impact (avg $${avgRevenue.toLocaleString()})`,
          confidence: Math.min(95, 70 + (completedMilestones.length * 5)),
          evidence: completedMilestones.map(m => ({
            type: 'milestone' as const,
            id: m.id,
            description: `Completed: ${m.name} (${m.businessContext.strategicImportance}% importance, $${m.businessContext.revenueImplication.toLocaleString()} revenue)`,
            value: m.businessContext.strategicImportance,
            timestamp: m.completionDate || m.updatedAt
          })),
          implications: [
            'Team demonstrates consistent ability to deliver high-value technical work',
            'Strategic prioritization is working effectively',
            'Business impact correlation is strong and reliable'
          ],
          recommendations: [
            'Continue prioritizing high-strategic-importance milestones',
            'Use this efficiency pattern as template for future milestone planning',
            'Consider increasing scope of similar high-value initiatives'
          ],
          timeframe: 'current-ongoing',
          businessImpact: {
            revenue: avgRevenue * completedMilestones.length,
            risk: 'low',
            opportunity: 'high',
            urgency: 'medium'
          },
          lastDetected: new Date().toISOString(),
          frequency: completedMilestones.length
        });
      }
    }

    return patterns;
  }

  private detectVelocityPatterns(milestones: TechnicalMilestone[]): StrategicPattern[] {
    const patterns: StrategicPattern[] = [];

    // Analyze milestone completion velocity
    const completedWithDates = milestones.filter(m => 
      m.status === 'completed' && m.completionDate && m.createdAt
    );

    if (completedWithDates.length >= 2) {
      const completionTimes = completedWithDates.map(m => {
        const created = new Date(m.createdAt).getTime();
        const completed = new Date(m.completionDate!).getTime();
        return (completed - created) / (1000 * 60 * 60 * 24); // Days
      });

      const avgCompletionTime = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
      const recentCompletionTime = completionTimes[completionTimes.length - 1];
      
      // Detect acceleration
      if (recentCompletionTime < avgCompletionTime * 0.8) {
        patterns.push({
          id: `velocity-acceleration-${Date.now()}`,
          type: 'velocity',
          name: 'Milestone Completion Acceleration',
          description: `Development velocity is increasing. Recent milestone completed in ${recentCompletionTime.toFixed(1)} days vs ${avgCompletionTime.toFixed(1)} day average`,
          confidence: 85,
          evidence: [{
            type: 'milestone',
            id: 'velocity-trend',
            description: `Completion time improvement: ${((avgCompletionTime - recentCompletionTime) / avgCompletionTime * 100).toFixed(1)}% faster`,
            value: recentCompletionTime,
            timestamp: new Date().toISOString()
          }],
          implications: [
            'Team efficiency is improving over time',
            'Learning from previous milestones is accelerating delivery',
            'Current architecture and processes support faster development'
          ],
          recommendations: [
            'Document what factors are driving this acceleration',
            'Consider taking on more ambitious milestones',
            'Share acceleration insights with broader team'
          ],
          timeframe: 'short-term-trend',
          businessImpact: {
            revenue: 0, // Efficiency gain rather than direct revenue
            risk: 'low',
            opportunity: 'high',
            urgency: 'medium'
          },
          lastDetected: new Date().toISOString(),
          frequency: 1
        });
      }
    }

    return patterns;
  }

  private detectCorrelationPatterns(
    correlations: ProgressCorrelation[],
    milestones: TechnicalMilestone[],
    goals: BusinessGoal[]
  ): StrategicPattern[] {
    const patterns: StrategicPattern[] = [];

    // Strong correlation clusters
    const strongCorrelations = correlations.filter(c => Math.abs(c.correlationStrength) >= 70);
    
    if (strongCorrelations.length >= 2) {
      // Group by milestone to find milestones with multiple strong correlations
      const milestoneCorrelations = new Map<string, ProgressCorrelation[]>();
      strongCorrelations.forEach(corr => {
        const existing = milestoneCorrelations.get(corr.technicalMilestoneId) || [];
        existing.push(corr);
        milestoneCorrelations.set(corr.technicalMilestoneId, existing);
      });

      milestoneCorrelations.forEach((corrs, milestoneId) => {
        if (corrs.length >= 2) {
          const milestone = milestones.find(m => m.id === milestoneId);
          if (milestone) {
            const avgCorrelation = corrs.reduce((sum, c) => sum + Math.abs(c.correlationStrength), 0) / corrs.length;
            
            patterns.push({
              id: `correlation-cluster-${milestoneId}`,
              type: 'correlation',
              name: 'Multiple Strong Business Correlations',
              description: `${milestone.name} shows strong correlations (avg ${avgCorrelation.toFixed(1)}%) with ${corrs.length} business goals, indicating high strategic value`,
              confidence: Math.min(95, 60 + avgCorrelation * 0.3),
              evidence: corrs.map(c => ({
                type: 'correlation' as const,
                id: c.businessGoalId,
                description: `${c.correlationStrength}% correlation with business goal`,
                value: c.correlationStrength,
                timestamp: c.lastUpdated
              })),
              implications: [
                'This milestone has exceptionally broad business impact',
                'Success here will advance multiple strategic objectives simultaneously',
                'Failure or delay would have cascading business effects'
              ],
              recommendations: [
                'Prioritize completion of this high-correlation milestone',
                'Ensure adequate resources and attention to prevent delays',
                'Use this as template for future high-impact milestone design'
              ],
              timeframe: 'immediate-focus',
              businessImpact: {
                revenue: milestone.businessContext.revenueImplication,
                risk: 'medium',
                opportunity: 'critical',
                urgency: 'high'
              },
              lastDetected: new Date().toISOString(),
              frequency: corrs.length
            });
          }
        }
      });
    }

    return patterns;
  }

  private detectRiskPatterns(
    milestones: TechnicalMilestone[],
    correlations: ProgressCorrelation[]
  ): StrategicPattern[] {
    const patterns: StrategicPattern[] = [];

    // High-value delayed milestones
    const delayedHighValue = milestones.filter(m => 
      m.status === 'delayed' && 
      m.businessContext.strategicImportance >= 80
    );

    if (delayedHighValue.length > 0) {
      const totalRiskRevenue = delayedHighValue.reduce((sum, m) => sum + m.businessContext.revenueImplication, 0);
      
      patterns.push({
        id: `risk-delayed-high-value-${Date.now()}`,
        type: 'risk',
        name: 'High-Value Milestone Delay Risk',
        description: `${delayedHighValue.length} high-strategic-importance milestones (80%+ importance) are delayed, risking $${totalRiskRevenue.toLocaleString()} in revenue impact`,
        confidence: 90,
        evidence: delayedHighValue.map(m => ({
          type: 'milestone' as const,
          id: m.id,
          description: `Delayed: ${m.name} (${m.businessContext.strategicImportance}% importance, $${m.businessContext.revenueImplication.toLocaleString()} at risk)`,
          value: m.businessContext.strategicImportance,
          timestamp: m.updatedAt
        })),
        implications: [
          'Strategic business objectives are at risk due to technical delays',
          'Revenue projections may need to be revised downward',
          'Competitive positioning could be compromised'
        ],
        recommendations: [
          'Immediately assess blockers for delayed high-value milestones',
          'Consider reallocating resources to unblock critical work',
          'Communicate potential business impact to stakeholders',
          'Develop contingency plans for continued delays'
        ],
        timeframe: 'immediate-action-required',
        businessImpact: {
          revenue: -totalRiskRevenue, // Negative because it's at risk
          risk: 'critical',
          opportunity: 'low',
          urgency: 'critical'
        },
        lastDetected: new Date().toISOString(),
        frequency: delayedHighValue.length
      });
    }

    return patterns;
  }

  private detectOpportunityPatterns(
    milestones: TechnicalMilestone[],
    goals: BusinessGoal[]
  ): StrategicPattern[] {
    const patterns: StrategicPattern[] = [];

    // Early market timing opportunities
    const earlyMarketMilestones = milestones.filter(m => 
      m.businessContext.marketTiming === 'early' &&
      m.status === 'completed'
    );

    if (earlyMarketMilestones.length > 0) {
      const totalOpportunityRevenue = earlyMarketMilestones.reduce((sum, m) => sum + m.businessContext.revenueImplication, 0);
      
      patterns.push({
        id: `opportunity-early-market-${Date.now()}`,
        type: 'opportunity',
        name: 'Early Market Advantage Realization',
        description: `${earlyMarketMilestones.length} early-market milestones completed, creating first-mover advantages worth $${totalOpportunityRevenue.toLocaleString()}`,
        confidence: 85,
        evidence: earlyMarketMilestones.map(m => ({
          type: 'milestone' as const,
          id: m.id,
          description: `Early market advantage: ${m.businessContext.competitiveAdvantage}`,
          value: m.businessContext.revenueImplication,
          timestamp: m.completionDate || m.updatedAt
        })),
        implications: [
          'Platform has achieved early market positioning advantages',
          'Competitive moats are being established through technical execution',
          'Market education and customer acquisition can be accelerated'
        ],
        recommendations: [
          'Amplify marketing messaging around early market advantages',
          'Accelerate customer acquisition while advantages are strongest',
          'Document and protect competitive moats created',
          'Plan next wave of early market opportunities'
        ],
        timeframe: 'market-window-active',
        businessImpact: {
          revenue: totalOpportunityRevenue,
          risk: 'low',
          opportunity: 'critical',
          urgency: 'high'
        },
        lastDetected: new Date().toISOString(),
        frequency: earlyMarketMilestones.length
      });
    }

    return patterns;
  }

  private detectDomainSpecificPatterns(
    milestones: TechnicalMilestone[],
    correlations: ProgressCorrelation[]
  ): StrategicPattern[] {
    const patterns: StrategicPattern[] = [];

    // Check each Scribe Tree specific pattern template
    Object.entries(PatternRecognitionEngine.SCRIBE_TREE_PATTERN_TEMPLATES).forEach(([key, template]) => {
      const matchingMilestones = milestones.filter(milestone => {
        const text = `${milestone.name} ${milestone.description}`.toLowerCase();
        return template.indicators.some(indicator => text.includes(indicator));
      });

      if (matchingMilestones.length >= 2) {
        const completedMatching = matchingMilestones.filter(m => m.status === 'completed');
        const avgImportance = matchingMilestones.reduce((sum, m) => sum + m.businessContext.strategicImportance, 0) / matchingMilestones.length;
        
        if (avgImportance >= 70) {
          patterns.push({
            id: `domain-${key}-${Date.now()}`,
            type: 'trend',
            name: template.name,
            description: `Strong execution pattern in ${template.name.toLowerCase()} with ${matchingMilestones.length} related milestones (${completedMatching.length} completed, avg ${avgImportance.toFixed(1)}% importance)`,
            confidence: Math.min(90, 60 + (completedMatching.length * 10) + (avgImportance * 0.3)),
            evidence: matchingMilestones.map(m => ({
              type: 'milestone' as const,
              id: m.id,
              description: `${m.name} (${m.status}, ${m.businessContext.strategicImportance}% importance)`,
              value: m.businessContext.strategicImportance,
              timestamp: m.updatedAt
            })),
            implications: [
              `Strong institutional knowledge and execution capability in ${template.name.toLowerCase()}`,
              'This domain represents a core competitive strength',
              'Future opportunities in this area likely to have high success probability'
            ],
            recommendations: [
              `Continue investing in ${template.name.toLowerCase()} capabilities`,
              'Use this domain strength for market positioning',
              'Consider expanding scope of initiatives in this area',
              'Document best practices for replication'
            ],
            timeframe: 'strategic-strength',
            businessImpact: {
              revenue: template.businessImpact.baseRevenue * matchingMilestones.length,
              risk: 'low',
              opportunity: 'high',
              urgency: 'medium'
            },
            lastDetected: new Date().toISOString(),
            frequency: matchingMilestones.length
          });
        }
      }
    });

    return patterns;
  }

  generateTrendAnalysis(
    milestones: TechnicalMilestone[],
    timeframe: '30-days' | '90-days' | '6-months' | '12-months'
  ): TrendAnalysis[] {
    const trends: TrendAnalysis[] = [];
    const cutoffDate = new Date();
    
    switch (timeframe) {
      case '30-days': cutoffDate.setDate(cutoffDate.getDate() - 30); break;
      case '90-days': cutoffDate.setDate(cutoffDate.getDate() - 90); break;
      case '6-months': cutoffDate.setMonth(cutoffDate.getMonth() - 6); break;
      case '12-months': cutoffDate.setFullYear(cutoffDate.getFullYear() - 1); break;
    }

    const recentMilestones = milestones.filter(m => new Date(m.createdAt) >= cutoffDate);

    // Strategic importance trend
    if (recentMilestones.length >= 3) {
      const importanceData = recentMilestones.map(m => ({
        timestamp: m.createdAt,
        value: m.businessContext.strategicImportance
      })).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      const avgImportance = importanceData.reduce((sum, d) => sum + d.value, 0) / importanceData.length;
      const recentAvg = importanceData.slice(-3).reduce((sum, d) => sum + d.value, 0) / 3;
      const direction = recentAvg > avgImportance ? 'increasing' : recentAvg < avgImportance ? 'decreasing' : 'stable';

      trends.push({
        metric: 'Strategic Importance',
        direction,
        velocity: Math.abs(recentAvg - avgImportance) / avgImportance,
        confidence: Math.min(90, 50 + recentMilestones.length * 5),
        dataPoints: importanceData,
        projection: {
          shortTerm: recentAvg + (recentAvg - avgImportance) * 0.5,
          mediumTerm: recentAvg + (recentAvg - avgImportance) * 1.0,
          longTerm: recentAvg + (recentAvg - avgImportance) * 1.5
        }
      });
    }

    return trends;
  }

  analyzeCorrelationsAcrossMilestones(
    milestones: TechnicalMilestone[],
    correlations: ProgressCorrelation[]
  ): CrossMilestoneAnalysis[] {
    const analyses: CrossMilestoneAnalysis[] = [];

    // Group correlations by business goal to find milestones affecting same goals
    const goalCorrelations = new Map<string, ProgressCorrelation[]>();
    correlations.forEach(corr => {
      const existing = goalCorrelations.get(corr.businessGoalId) || [];
      existing.push(corr);
      goalCorrelations.set(corr.businessGoalId, existing);
    });

    goalCorrelations.forEach((corrs, goalId) => {
      if (corrs.length >= 2) {
        const milestoneIds = corrs.map(c => c.technicalMilestoneId);
        const relatedMilestones = milestones.filter(m => milestoneIds.includes(m.id));
        
        // Determine pattern type
        let patternType: CrossMilestoneAnalysis['patternType'] = 'parallel';
        
        // Check if milestones have dependencies between them
        const hasDependencies = relatedMilestones.some(m1 => 
          relatedMilestones.some(m2 => m1.dependencies.includes(m2.id))
        );
        
        if (hasDependencies) {
          patternType = 'sequential';
        }

        // Calculate efficiency score
        const avgCorrelationStrength = corrs.reduce((sum, c) => sum + Math.abs(c.correlationStrength), 0) / corrs.length;
        const completedCount = relatedMilestones.filter(m => m.status === 'completed').length;
        const efficiency = (avgCorrelationStrength * 0.7) + ((completedCount / relatedMilestones.length) * 100 * 0.3);

        analyses.push({
          id: `cross-analysis-${goalId}`,
          milestoneIds,
          patternType,
          description: `${relatedMilestones.length} milestones ${patternType === 'sequential' ? 'sequentially' : 'in parallel'} affecting same business goal with ${avgCorrelationStrength.toFixed(1)}% avg correlation`,
          efficiency,
          recommendations: this.generateCrossAnalysisRecommendations(patternType, efficiency, relatedMilestones),
          riskFactors: this.identifyCrossAnalysisRisks(patternType, relatedMilestones)
        });
      }
    });

    return analyses;
  }

  private generateCrossAnalysisRecommendations(
    patternType: CrossMilestoneAnalysis['patternType'],
    efficiency: number,
    milestones: TechnicalMilestone[]
  ): string[] {
    const recommendations: string[] = [];

    if (patternType === 'sequential') {
      recommendations.push('Ensure sequential dependencies are well-planned to avoid cascading delays');
      if (efficiency < 70) {
        recommendations.push('Consider parallelizing some work to improve overall efficiency');
      }
    } else if (patternType === 'parallel') {
      recommendations.push('Coordinate parallel efforts to maximize synergies');
      if (efficiency > 80) {
        recommendations.push('This parallel approach is highly effective - consider replicating for other goals');
      }
    }

    const delayedCount = milestones.filter(m => m.status === 'delayed').length;
    if (delayedCount > 0) {
      recommendations.push(`Address ${delayedCount} delayed milestone(s) to prevent goal impact`);
    }

    return recommendations;
  }

  private identifyCrossAnalysisRisks(
    patternType: CrossMilestoneAnalysis['patternType'],
    milestones: TechnicalMilestone[]
  ): string[] {
    const risks: string[] = [];

    if (patternType === 'sequential') {
      risks.push('Single point of failure could delay entire sequence');
      const criticalComplexity = milestones.filter(m => m.complexity === 'critical').length;
      if (criticalComplexity > 0) {
        risks.push('Critical complexity milestones could create bottlenecks');
      }
    }

    const highValueCount = milestones.filter(m => m.businessContext.strategicImportance >= 80).length;
    if (highValueCount === milestones.length) {
      risks.push('All milestones are high-value - failure would have significant business impact');
    }

    return risks;
  }

  getAllPatterns(): StrategicPattern[] {
    return Array.from(this.detectedPatterns.values());
  }

  getPatternsByType(type: StrategicPattern['type']): StrategicPattern[] {
    return Array.from(this.detectedPatterns.values()).filter(p => p.type === type);
  }

  getTrendAnalyses(): TrendAnalysis[] {
    return Array.from(this.trendHistory.values());
  }

  getCrossAnalyses(): CrossMilestoneAnalysis[] {
    return Array.from(this.crossMilestoneAnalyses.values());
  }
}