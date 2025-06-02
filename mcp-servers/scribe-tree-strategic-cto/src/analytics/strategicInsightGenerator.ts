// Strategic insight generation from pattern analysis and data synthesis
import { StrategicPattern, TrendAnalysis, CrossMilestoneAnalysis } from './patternRecognitionEngine.js';
import { GoalHealthAssessment, VelocityMetrics, CompletionForecast } from './goalProgressAnalytics.js';
import { TechnicalMilestone } from '../intelligence/technicalMilestoneTracker.js';
import { BusinessGoal, StrategyConversation } from '../types/index.js';

export interface StrategicInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'efficiency' | 'strategic-shift' | 'competitive-advantage' | 'market-timing';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  confidence: number; // 0-100
  businessImpact: {
    revenue: number;
    timeframe: string;
    certainty: 'high' | 'medium' | 'low';
  };
  supportingEvidence: InsightEvidence[];
  actionableRecommendations: ActionableRecommendation[];
  stakeholders: string[];
  urgency: 'immediate' | 'near-term' | 'medium-term' | 'long-term';
  category: 'technical' | 'business' | 'market' | 'operational' | 'strategic';
  generatedFrom: string[]; // IDs of source patterns/analyses
  lastUpdated: string;
}

export interface InsightEvidence {
  type: 'pattern' | 'metric' | 'trend' | 'correlation' | 'milestone' | 'goal';
  source: string;
  description: string;
  quantitativeValue?: number;
  significance: 'supporting' | 'strong' | 'definitive';
}

export interface ActionableRecommendation {
  id: string;
  action: string;
  rationale: string;
  implementationEffort: 'low' | 'medium' | 'high';
  expectedOutcome: string;
  timeframe: string;
  prerequisites: string[];
  riskIfNotTaken: string;
}

export interface ExecutiveInsightSummary {
  period: string;
  totalInsights: number;
  criticalInsights: number;
  keyOpportunities: StrategicInsight[];
  primaryRisks: StrategicInsight[];
  strategicThemes: InsightTheme[];
  recommendedActions: string[];
  businessImpactSummary: {
    totalRevenueOpportunity: number;
    totalRevenueAtRisk: number;
    timeToRealization: string;
  };
}

export interface InsightTheme {
  name: string;
  description: string;
  relatedInsights: string[];
  strength: number; // 0-100
  trendDirection: 'strengthening' | 'stable' | 'weakening';
  strategicImplications: string[];
}

export interface CompetitiveIntelligence {
  id: string;
  competitiveAdvantage: string;
  description: string;
  sustainability: 'temporary' | 'medium-term' | 'long-term' | 'permanent';
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  defendStrategies: string[];
  amplificationOpportunities: string[];
}

export class StrategicInsightGenerator {
  
  generateInsights(
    patterns: StrategicPattern[],
    trends: TrendAnalysis[],
    crossAnalyses: CrossMilestoneAnalysis[],
    goalHealth: GoalHealthAssessment[],
    milestones: TechnicalMilestone[],
    goals: BusinessGoal[]
  ): StrategicInsight[] {
    const insights: StrategicInsight[] = [];

    // Generate insights from patterns
    insights.push(...this.generatePatternBasedInsights(patterns));

    // Generate insights from trend analysis
    insights.push(...this.generateTrendBasedInsights(trends));

    // Generate insights from cross-milestone analysis
    insights.push(...this.generateCrossAnalysisInsights(crossAnalyses, milestones));

    // Generate insights from goal health assessment
    insights.push(...this.generateGoalHealthInsights(goalHealth));

    // Generate Scribe Tree specific strategic insights
    insights.push(...this.generateScribeTreeStrategicInsights(milestones, goals, patterns));

    // Generate competitive advantage insights
    insights.push(...this.generateCompetitiveAdvantageInsights(milestones, patterns));

    // Generate market timing insights
    insights.push(...this.generateMarketTimingInsights(milestones, patterns));

    return insights.sort((a, b) => {
      // Sort by priority and confidence
      const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      const aScore = priorityWeight[a.priority] * 100 + a.confidence;
      const bScore = priorityWeight[b.priority] * 100 + b.confidence;
      return bScore - aScore;
    });
  }

  private generatePatternBasedInsights(patterns: StrategicPattern[]): StrategicInsight[] {
    const insights: StrategicInsight[] = [];

    // High-efficiency patterns
    const efficiencyPatterns = patterns.filter(p => p.type === 'efficiency' && p.confidence >= 70);
    efficiencyPatterns.forEach(pattern => {
      insights.push({
        id: `insight-efficiency-${pattern.id}`,
        type: 'efficiency',
        priority: pattern.businessImpact.opportunity === 'critical' ? 'critical' : 'high',
        title: 'Development Efficiency Strength Identified',
        description: `${pattern.name}: ${pattern.description}. This represents a replicable competitive advantage.`,
        confidence: pattern.confidence,
        businessImpact: {
          revenue: pattern.businessImpact.revenue,
          timeframe: pattern.timeframe,
          certainty: pattern.confidence >= 80 ? 'high' : 'medium'
        },
        supportingEvidence: [{
          type: 'pattern',
          source: pattern.id,
          description: pattern.description,
          quantitativeValue: pattern.confidence,
          significance: 'definitive'
        }],
        actionableRecommendations: pattern.recommendations.map((rec, index) => ({
          id: `rec-${pattern.id}-${index}`,
          action: rec,
          rationale: 'Leverage proven efficiency pattern for competitive advantage',
          implementationEffort: 'medium',
          expectedOutcome: 'Accelerated delivery of high-value features',
          timeframe: '1-3 months',
          prerequisites: ['Document current process', 'Train team on best practices'],
          riskIfNotTaken: 'Miss opportunity to scale successful approach'
        })),
        stakeholders: ['Development Team', 'Product Management', 'Executive Team'],
        urgency: 'near-term',
        category: 'operational',
        generatedFrom: [pattern.id],
        lastUpdated: new Date().toISOString()
      });
    });

    // High-risk patterns
    const riskPatterns = patterns.filter(p => p.type === 'risk' && p.businessImpact.risk === 'critical');
    riskPatterns.forEach(pattern => {
      insights.push({
        id: `insight-risk-${pattern.id}`,
        type: 'risk',
        priority: 'critical',
        title: 'Critical Business Risk Detected',
        description: `${pattern.name}: ${pattern.description}. Immediate intervention required.`,
        confidence: pattern.confidence,
        businessImpact: {
          revenue: -Math.abs(pattern.businessImpact.revenue), // Negative for risk
          timeframe: 'immediate',
          certainty: 'high'
        },
        supportingEvidence: [{
          type: 'pattern',
          source: pattern.id,
          description: pattern.description,
          significance: 'definitive'
        }],
        actionableRecommendations: pattern.recommendations.map((rec, index) => ({
          id: `rec-risk-${pattern.id}-${index}`,
          action: rec,
          rationale: 'Mitigate critical business risk before impact materializes',
          implementationEffort: 'high',
          expectedOutcome: 'Risk mitigation and business continuity',
          timeframe: 'immediate',
          prerequisites: ['Resource reallocation', 'Stakeholder alignment'],
          riskIfNotTaken: 'Significant business impact and revenue loss'
        })),
        stakeholders: ['Executive Team', 'Development Team', 'Business Stakeholders'],
        urgency: 'immediate',
        category: 'strategic',
        generatedFrom: [pattern.id],
        lastUpdated: new Date().toISOString()
      });
    });

    return insights;
  }

  private generateTrendBasedInsights(trends: TrendAnalysis[]): StrategicInsight[] {
    const insights: StrategicInsight[] = [];

    trends.forEach(trend => {
      if (trend.confidence >= 70) {
        const isPositiveTrend = trend.direction === 'increasing';
        
        insights.push({
          id: `insight-trend-${trend.metric.replace(/\s+/g, '-').toLowerCase()}`,
          type: isPositiveTrend ? 'opportunity' : 'risk',
          priority: Math.abs(trend.velocity) > 0.3 ? 'high' : 'medium',
          title: `${trend.metric} Trend Analysis`,
          description: `${trend.metric} is ${trend.direction} at ${(trend.velocity * 100).toFixed(1)}% velocity. ${isPositiveTrend ? 'This creates strategic opportunities' : 'This requires strategic attention'}.`,
          confidence: trend.confidence,
          businessImpact: {
            revenue: isPositiveTrend ? trend.projection.longTerm * 1000 : -trend.projection.longTerm * 500,
            timeframe: '6-12 months',
            certainty: trend.confidence >= 80 ? 'high' : 'medium'
          },
          supportingEvidence: [{
            type: 'trend',
            source: trend.metric,
            description: `${trend.direction} trend with ${trend.confidence}% confidence`,
            quantitativeValue: trend.velocity,
            significance: 'strong'
          }],
          actionableRecommendations: [{
            id: `rec-trend-${trend.metric}`,
            action: isPositiveTrend ? 
              `Accelerate initiatives that contribute to ${trend.metric} improvement` :
              `Implement corrective measures to address declining ${trend.metric}`,
            rationale: `Trend analysis shows ${trend.direction} pattern requiring strategic response`,
            implementationEffort: 'medium',
            expectedOutcome: isPositiveTrend ? 'Amplified positive trend' : 'Trend reversal',
            timeframe: '2-4 months',
            prerequisites: ['Trend validation', 'Resource planning'],
            riskIfNotTaken: isPositiveTrend ? 'Miss opportunity window' : 'Trend continues to deteriorate'
          }],
          stakeholders: ['Strategy Team', 'Operations', 'Executive Team'],
          urgency: Math.abs(trend.velocity) > 0.5 ? 'near-term' : 'medium-term',
          category: 'strategic',
          generatedFrom: [trend.metric],
          lastUpdated: new Date().toISOString()
        });
      }
    });

    return insights;
  }

  private generateCrossAnalysisInsights(
    crossAnalyses: CrossMilestoneAnalysis[],
    milestones: TechnicalMilestone[]
  ): StrategicInsight[] {
    const insights: StrategicInsight[] = [];

    crossAnalyses.forEach(analysis => {
      if (analysis.efficiency >= 80) {
        // High efficiency cross-milestone pattern
        insights.push({
          id: `insight-cross-efficiency-${analysis.id}`,
          type: 'efficiency',
          priority: 'high',
          title: 'High-Efficiency Multi-Milestone Pattern',
          description: `${analysis.description} with ${analysis.efficiency.toFixed(1)}% efficiency. This pattern should be replicated.`,
          confidence: 85,
          businessImpact: {
            revenue: analysis.milestoneIds.length * 25000, // Estimate based on milestone count
            timeframe: '3-6 months',
            certainty: 'medium'
          },
          supportingEvidence: [{
            type: 'pattern',
            source: analysis.id,
            description: analysis.description,
            quantitativeValue: analysis.efficiency,
            significance: 'strong'
          }],
          actionableRecommendations: analysis.recommendations.map((rec, index) => ({
            id: `rec-cross-${analysis.id}-${index}`,
            action: rec,
            rationale: 'Leverage high-efficiency pattern for future milestone planning',
            implementationEffort: 'low',
            expectedOutcome: 'Improved milestone delivery efficiency',
            timeframe: '1-2 months',
            prerequisites: ['Pattern documentation', 'Team training'],
            riskIfNotTaken: 'Miss opportunity to scale successful approach'
          })),
          stakeholders: ['Development Team', 'Project Management'],
          urgency: 'near-term',
          category: 'operational',
          generatedFrom: [analysis.id],
          lastUpdated: new Date().toISOString()
        });
      } else if (analysis.efficiency < 50) {
        // Low efficiency requiring attention
        insights.push({
          id: `insight-cross-inefficiency-${analysis.id}`,
          type: 'risk',
          priority: 'medium',
          title: 'Multi-Milestone Efficiency Concern',
          description: `${analysis.description} with only ${analysis.efficiency.toFixed(1)}% efficiency. Process optimization needed.`,
          confidence: 75,
          businessImpact: {
            revenue: -15000, // Cost of inefficiency
            timeframe: 'ongoing',
            certainty: 'medium'
          },
          supportingEvidence: [{
            type: 'pattern',
            source: analysis.id,
            description: analysis.description,
            quantitativeValue: analysis.efficiency,
            significance: 'strong'
          }],
          actionableRecommendations: [{
            id: `rec-inefficiency-${analysis.id}`,
            action: 'Analyze and optimize the cross-milestone coordination process',
            rationale: 'Low efficiency indicates process improvement opportunities',
            implementationEffort: 'medium',
            expectedOutcome: 'Improved coordination and delivery efficiency',
            timeframe: '1-3 months',
            prerequisites: ['Process analysis', 'Team feedback'],
            riskIfNotTaken: 'Continued inefficiency and missed deadlines'
          }],
          stakeholders: ['Development Team', 'Project Management', 'Process Improvement'],
          urgency: 'medium-term',
          category: 'operational',
          generatedFrom: [analysis.id],
          lastUpdated: new Date().toISOString()
        });
      }
    });

    return insights;
  }

  private generateGoalHealthInsights(goalHealth: GoalHealthAssessment[]): StrategicInsight[] {
    const insights: StrategicInsight[] = [];

    // Critical goal health issues
    const criticalGoals = goalHealth.filter(g => g.overallHealth === 'critical');
    if (criticalGoals.length > 0) {
      insights.push({
        id: `insight-critical-goals-${Date.now()}`,
        type: 'risk',
        priority: 'critical',
        title: 'Critical Business Goals at Risk',
        description: `${criticalGoals.length} business goals are in critical health status, requiring immediate intervention.`,
        confidence: 90,
        businessImpact: {
          revenue: -100000, // Significant risk estimate
          timeframe: 'immediate',
          certainty: 'high'
        },
        supportingEvidence: criticalGoals.map(goal => ({
          type: 'goal' as const,
          source: goal.goalId,
          description: `${goal.goalName}: ${goal.healthScore.toFixed(1)}% health score`,
          quantitativeValue: goal.healthScore,
          significance: 'definitive' as const
        })),
        actionableRecommendations: [{
          id: 'rec-critical-goals',
          action: 'Immediately assess and address critical goal blockers',
          rationale: 'Critical goals threaten business objectives',
          implementationEffort: 'high',
          expectedOutcome: 'Goal health improvement and business continuity',
          timeframe: '1-2 weeks',
          prerequisites: ['Executive alignment', 'Resource reallocation'],
          riskIfNotTaken: 'Business goal failure and strategic setbacks'
        }],
        stakeholders: ['Executive Team', 'Goal Owners', 'Development Team'],
        urgency: 'immediate',
        category: 'strategic',
        generatedFrom: criticalGoals.map(g => g.goalId),
        lastUpdated: new Date().toISOString()
      });
    }

    // Excellent performing goals
    const excellentGoals = goalHealth.filter(g => g.overallHealth === 'excellent' && g.healthScore >= 85);
    if (excellentGoals.length > 0) {
      insights.push({
        id: `insight-excellent-goals-${Date.now()}`,
        type: 'opportunity',
        priority: 'high',
        title: 'High-Performing Goals Create Strategic Opportunity',
        description: `${excellentGoals.length} goals are performing excellently. Their success patterns should be analyzed and replicated.`,
        confidence: 85,
        businessImpact: {
          revenue: excellentGoals.length * 50000,
          timeframe: '3-6 months',
          certainty: 'high'
        },
        supportingEvidence: excellentGoals.map(goal => ({
          type: 'goal' as const,
          source: goal.goalId,
          description: `${goal.goalName}: ${goal.healthScore.toFixed(1)}% health score`,
          quantitativeValue: goal.healthScore,
          significance: 'strong' as const
        })),
        actionableRecommendations: [{
          id: 'rec-excellent-goals',
          action: 'Document and replicate success patterns from high-performing goals',
          rationale: 'Excellent performance indicates replicable best practices',
          implementationEffort: 'medium',
          expectedOutcome: 'Improved performance across other goals',
          timeframe: '2-4 months',
          prerequisites: ['Success pattern analysis', 'Best practice documentation'],
          riskIfNotTaken: 'Miss opportunity to scale successful approaches'
        }],
        stakeholders: ['Strategy Team', 'Goal Owners', 'Process Improvement'],
        urgency: 'near-term',
        category: 'strategic',
        generatedFrom: excellentGoals.map(g => g.goalId),
        lastUpdated: new Date().toISOString()
      });
    }

    return insights;
  }

  private generateScribeTreeStrategicInsights(
    milestones: TechnicalMilestone[],
    goals: BusinessGoal[],
    patterns: StrategicPattern[]
  ): StrategicInsight[] {
    const insights: StrategicInsight[] = [];

    // Privacy-by-design strategic advantage
    const privacyMilestones = milestones.filter(m => 
      m.name.toLowerCase().includes('privacy') || 
      m.description.toLowerCase().includes('gdpr') ||
      m.description.toLowerCase().includes('ferpa')
    );

    if (privacyMilestones.length >= 2) {
      const completedPrivacy = privacyMilestones.filter(m => m.status === 'completed');
      const avgImportance = privacyMilestones.reduce((sum, m) => sum + m.businessContext.strategicImportance, 0) / privacyMilestones.length;

      if (avgImportance >= 80) {
        insights.push({
          id: 'insight-privacy-advantage',
          type: 'competitive-advantage',
          priority: 'critical',
          title: 'Privacy-by-Design Competitive Moat Established',
          description: `Strong privacy implementation (${privacyMilestones.length} milestones, ${completedPrivacy.length} completed) creates unique market positioning vs competitors with retrofitted compliance.`,
          confidence: 90,
          businessImpact: {
            revenue: 200000,
            timeframe: '6-12 months',
            certainty: 'high'
          },
          supportingEvidence: [{
            type: 'milestone',
            source: 'privacy-milestones',
            description: `${privacyMilestones.length} privacy milestones with ${avgImportance.toFixed(1)}% avg strategic importance`,
            quantitativeValue: avgImportance,
            significance: 'definitive'
          }],
          actionableRecommendations: [{
            id: 'rec-privacy-advantage',
            action: 'Amplify privacy-by-design messaging in market positioning and sales',
            rationale: 'Technical privacy leadership creates defendable competitive advantage',
            implementationEffort: 'low',
            expectedOutcome: 'Increased market differentiation and customer acquisition',
            timeframe: '1-3 months',
            prerequisites: ['Marketing message development', 'Sales training'],
            riskIfNotTaken: 'Competitors may catch up, reducing advantage window'
          }],
          stakeholders: ['Marketing', 'Sales', 'Product Strategy', 'Privacy Team'],
          urgency: 'near-term',
          category: 'strategic',
          generatedFrom: privacyMilestones.map(m => m.id),
          lastUpdated: new Date().toISOString()
        });
      }
    }

    // Bounded enhancement AI philosophy advantage
    const aiMilestones = milestones.filter(m => 
      m.name.toLowerCase().includes('bounded') || 
      m.name.toLowerCase().includes('enhancement') ||
      m.description.toLowerCase().includes('ai boundary') ||
      m.description.toLowerCase().includes('reflection')
    );

    if (aiMilestones.length >= 1) {
      insights.push({
        id: 'insight-ai-philosophy-advantage',
        type: 'competitive-advantage',
        priority: 'critical',
        title: 'Bounded Enhancement AI Philosophy Creates Market Differentiation',
        description: `AI philosophy implementation addresses growing concerns about AI dependency in education, creating unique market positioning.`,
        confidence: 95,
        businessImpact: {
          revenue: 300000,
          timeframe: '12-18 months',
          certainty: 'high'
        },
        supportingEvidence: [{
          type: 'milestone',
          source: 'ai-philosophy',
          description: 'Bounded enhancement philosophy addresses critical market need',
          significance: 'definitive'
        }],
        actionableRecommendations: [{
          id: 'rec-ai-philosophy',
          action: 'Develop thought leadership content around bounded enhancement philosophy',
          rationale: 'Unique AI approach solves critical educational technology problem',
          implementationEffort: 'medium',
          expectedOutcome: 'Market leadership in responsible educational AI',
          timeframe: '3-6 months',
          prerequisites: ['Content strategy', 'Expert positioning'],
          riskIfNotTaken: 'Miss first-mover advantage in responsible AI education'
        }],
        stakeholders: ['Product Strategy', 'Marketing', 'AI Team', 'Educational Advisors'],
        urgency: 'near-term',
        category: 'strategic',
        generatedFrom: ['ai-philosophy'],
        lastUpdated: new Date().toISOString()
      });
    }

    return insights;
  }

  private generateCompetitiveAdvantageInsights(
    milestones: TechnicalMilestone[],
    patterns: StrategicPattern[]
  ): StrategicInsight[] {
    const insights: StrategicInsight[] = [];

    // Early market timing advantages
    const earlyMarketMilestones = milestones.filter(m => 
      m.businessContext.marketTiming === 'early' && m.status === 'completed'
    );

    if (earlyMarketMilestones.length >= 2) {
      const totalAdvantageRevenue = earlyMarketMilestones.reduce((sum, m) => sum + m.businessContext.revenueImplication, 0);
      
      insights.push({
        id: 'insight-early-market-advantages',
        type: 'competitive-advantage',
        priority: 'high',
        title: 'Multiple Early Market Advantages Realized',
        description: `${earlyMarketMilestones.length} early market milestones completed, establishing first-mover advantages worth $${totalAdvantageRevenue.toLocaleString()}.`,
        confidence: 85,
        businessImpact: {
          revenue: totalAdvantageRevenue,
          timeframe: '6-12 months',
          certainty: 'high'
        },
        supportingEvidence: earlyMarketMilestones.map(m => ({
          type: 'milestone' as const,
          source: m.id,
          description: `Early advantage: ${m.businessContext.competitiveAdvantage}`,
          quantitativeValue: m.businessContext.revenueImplication,
          significance: 'strong' as const
        })),
        actionableRecommendations: [{
          id: 'rec-market-advantages',
          action: 'Accelerate market penetration while advantages are strongest',
          rationale: 'Early market advantages have time-limited windows',
          implementationEffort: 'high',
          expectedOutcome: 'Market share capture during advantage window',
          timeframe: '3-6 months',
          prerequisites: ['Go-to-market acceleration', 'Sales capacity'],
          riskIfNotTaken: 'Competitors reduce advantage gap'
        }],
        stakeholders: ['Sales', 'Marketing', 'Business Development'],
        urgency: 'near-term',
        category: 'market',
        generatedFrom: earlyMarketMilestones.map(m => m.id),
        lastUpdated: new Date().toISOString()
      });
    }

    return insights;
  }

  private generateMarketTimingInsights(
    milestones: TechnicalMilestone[],
    patterns: StrategicPattern[]
  ): StrategicInsight[] {
    const insights: StrategicInsight[] = [];

    // Critical market timing opportunities
    const criticalTimingMilestones = milestones.filter(m => 
      m.businessContext.marketTiming === 'critical' ||
      (m.businessContext.marketTiming === 'early' && m.businessContext.strategicImportance >= 90)
    );

    if (criticalTimingMilestones.length > 0) {
      insights.push({
        id: 'insight-critical-market-timing',
        type: 'market-timing',
        priority: 'critical',
        title: 'Critical Market Timing Window Active',
        description: `${criticalTimingMilestones.length} milestones represent critical market timing opportunities that must be executed rapidly.`,
        confidence: 90,
        businessImpact: {
          revenue: criticalTimingMilestones.reduce((sum, m) => sum + m.businessContext.revenueImplication, 0),
          timeframe: '3-6 months',
          certainty: 'high'
        },
        supportingEvidence: criticalTimingMilestones.map(m => ({
          type: 'milestone' as const,
          source: m.id,
          description: `Critical timing: ${m.name} (${m.businessContext.strategicImportance}% importance)`,
          quantitativeValue: m.businessContext.strategicImportance,
          significance: 'definitive' as const
        })),
        actionableRecommendations: [{
          id: 'rec-critical-timing',
          action: 'Prioritize critical timing milestones above all other work',
          rationale: 'Market timing windows are time-limited and non-recoverable',
          implementationEffort: 'high',
          expectedOutcome: 'Capture time-sensitive market opportunities',
          timeframe: 'immediate',
          prerequisites: ['Resource reallocation', 'Executive alignment'],
          riskIfNotTaken: 'Permanent loss of market timing advantage'
        }],
        stakeholders: ['Executive Team', 'Product Management', 'Development Team'],
        urgency: 'immediate',
        category: 'market',
        generatedFrom: criticalTimingMilestones.map(m => m.id),
        lastUpdated: new Date().toISOString()
      });
    }

    return insights;
  }

  generateExecutiveSummary(insights: StrategicInsight[]): ExecutiveInsightSummary {
    const criticalInsights = insights.filter(i => i.priority === 'critical');
    const opportunityInsights = insights.filter(i => i.type === 'opportunity');
    const riskInsights = insights.filter(i => i.type === 'risk');

    // Calculate business impact
    const totalRevenueOpportunity = opportunityInsights.reduce((sum, i) => sum + Math.max(0, i.businessImpact.revenue), 0);
    const totalRevenueAtRisk = riskInsights.reduce((sum, i) => sum + Math.abs(Math.min(0, i.businessImpact.revenue)), 0);

    // Identify strategic themes
    const themes = this.identifyStrategicThemes(insights);

    // Top recommended actions
    const recommendedActions = criticalInsights.slice(0, 5).map(i => 
      i.actionableRecommendations[0]?.action || 'Review insight details'
    );

    return {
      period: new Date().toISOString().split('T')[0],
      totalInsights: insights.length,
      criticalInsights: criticalInsights.length,
      keyOpportunities: opportunityInsights.slice(0, 3),
      primaryRisks: riskInsights.slice(0, 3),
      strategicThemes: themes,
      recommendedActions,
      businessImpactSummary: {
        totalRevenueOpportunity,
        totalRevenueAtRisk,
        timeToRealization: '3-12 months'
      }
    };
  }

  private identifyStrategicThemes(insights: StrategicInsight[]): InsightTheme[] {
    const themes: InsightTheme[] = [];

    // Privacy & Compliance theme
    const privacyInsights = insights.filter(i => 
      i.title.toLowerCase().includes('privacy') || 
      i.description.toLowerCase().includes('privacy') ||
      i.description.toLowerCase().includes('compliance')
    );

    if (privacyInsights.length > 0) {
      themes.push({
        name: 'Privacy-by-Design Leadership',
        description: 'Technical privacy implementation creating competitive advantages',
        relatedInsights: privacyInsights.map(i => i.id),
        strength: 85,
        trendDirection: 'strengthening',
        strategicImplications: [
          'Market differentiation through native privacy features',
          'Competitive moat vs retrofitted compliance solutions',
          'Regulatory advantage in expanding privacy landscape'
        ]
      });
    }

    // AI Philosophy theme
    const aiInsights = insights.filter(i => 
      i.title.toLowerCase().includes('ai') || 
      i.title.toLowerCase().includes('bounded') ||
      i.description.toLowerCase().includes('ai')
    );

    if (aiInsights.length > 0) {
      themes.push({
        name: 'Responsible AI Innovation',
        description: 'Bounded enhancement philosophy addressing market needs',
        relatedInsights: aiInsights.map(i => i.id),
        strength: 90,
        trendDirection: 'strengthening',
        strategicImplications: [
          'First-mover advantage in responsible educational AI',
          'Solution to growing AI dependency concerns',
          'Thought leadership positioning opportunity'
        ]
      });
    }

    // Development Efficiency theme
    const efficiencyInsights = insights.filter(i => i.type === 'efficiency');
    if (efficiencyInsights.length > 0) {
      themes.push({
        name: 'Development Excellence',
        description: 'Systematic high-performance development practices',
        relatedInsights: efficiencyInsights.map(i => i.id),
        strength: 75,
        trendDirection: 'stable',
        strategicImplications: [
          'Competitive advantage through execution speed',
          'Cost efficiency vs competitors',
          'Ability to capture time-sensitive opportunities'
        ]
      });
    }

    return themes;
  }
}