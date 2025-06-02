// Comprehensive goal progress analytics and forecasting
import { BusinessGoal } from '../types/index.js';
import { TechnicalMilestone } from '../intelligence/technicalMilestoneTracker.js';
import { ProgressCorrelation } from '../intelligence/progressCorrelationEngine.js';

export interface GoalHealthAssessment {
  goalId: string;
  goalName: string;
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  healthScore: number; // 0-100
  dimensions: {
    progress: GoalDimension;
    velocity: GoalDimension;
    confidence: GoalDimension;
    dependency: GoalDimension;
    alignment: GoalDimension;
  };
  blockers: GoalBlocker[];
  accelerators: GoalAccelerator[];
  recommendations: string[];
  riskFactors: GoalRisk[];
  lastAssessment: string;
}

export interface GoalDimension {
  score: number; // 0-100
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  description: string;
  trend: 'improving' | 'stable' | 'declining';
  evidence: string[];
}

export interface GoalBlocker {
  id: string;
  type: 'technical' | 'resource' | 'dependency' | 'external' | 'strategic';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  recommendedAction: string;
  estimatedResolutionTime: string;
}

export interface GoalAccelerator {
  id: string;
  type: 'technical' | 'resource' | 'market' | 'partnership' | 'innovation';
  description: string;
  potentialImpact: string;
  implementationEffort: 'low' | 'medium' | 'high';
  timeToRealization: string;
}

export interface GoalRisk {
  id: string;
  type: 'timeline' | 'scope' | 'resource' | 'market' | 'technical' | 'competitive';
  description: string;
  probability: number; // 0-100
  impact: 'low' | 'medium' | 'high' | 'critical';
  mitigationStrategy: string;
}

export interface VelocityMetrics {
  goalId: string;
  currentVelocity: number; // Progress per unit time
  targetVelocity: number; // Required to meet deadline
  velocityTrend: 'accelerating' | 'steady' | 'decelerating' | 'stalled';
  efficiency: number; // 0-100
  projectedCompletion: string;
  confidenceInterval: {
    optimistic: string;
    realistic: string;
    pessimistic: string;
  };
}

export interface CompletionForecast {
  goalId: string;
  forecastMethod: 'linear' | 'velocity-based' | 'milestone-dependency' | 'correlation-weighted';
  projectedCompletionDate: string;
  confidence: number; // 0-100
  scenarioAnalysis: {
    best: { date: string; probability: number };
    likely: { date: string; probability: number };
    worst: { date: string; probability: number };
  };
  criticalPath: string[];
  assumptions: string[];
  riskFactors: string[];
}

export class GoalProgressAnalytics {
  
  assessGoalHealth(
    goal: BusinessGoal,
    relatedMilestones: TechnicalMilestone[],
    correlations: ProgressCorrelation[]
  ): GoalHealthAssessment {
    
    // Assess each dimension of goal health
    const progressDimension = this.assessProgressDimension(goal, relatedMilestones);
    const velocityDimension = this.assessVelocityDimension(goal, relatedMilestones);
    const confidenceDimension = this.assessConfidenceDimension(goal);
    const dependencyDimension = this.assessDependencyDimension(goal, relatedMilestones);
    const alignmentDimension = this.assessAlignmentDimension(goal, correlations);

    // Calculate overall health score
    const dimensionsArray = [progressDimension, velocityDimension, confidenceDimension, dependencyDimension, alignmentDimension];
    const healthScore = dimensionsArray.reduce((sum, dim) => sum + dim.score, 0) / dimensionsArray.length;
    
    const overallHealth = this.determineOverallHealth(healthScore);

    // Identify blockers and accelerators
    const blockers = this.identifyBlockers(goal, relatedMilestones);
    const accelerators = this.identifyAccelerators(goal, relatedMilestones);
    const riskFactors = this.assessRiskFactors(goal, relatedMilestones);

    const dimensions = {
      progress: progressDimension,
      velocity: velocityDimension,
      confidence: confidenceDimension,
      dependency: dependencyDimension,
      alignment: alignmentDimension
    };

    return {
      goalId: goal.id,
      goalName: goal.title,
      overallHealth,
      healthScore,
      dimensions,
      blockers,
      accelerators,
      recommendations: this.generateHealthRecommendations(overallHealth, dimensions, blockers),
      riskFactors,
      lastAssessment: new Date().toISOString()
    };
  }

  private assessProgressDimension(goal: BusinessGoal, milestones: TechnicalMilestone[]): GoalDimension {
    const linkedMilestones = milestones.filter(m => m.linkedGoals.includes(goal.id));
    
    if (linkedMilestones.length === 0) {
      return {
        score: 20,
        status: 'poor',
        description: 'No technical milestones linked to this goal',
        trend: 'stable',
        evidence: ['Goal has no technical implementation plan']
      };
    }

    const completedCount = linkedMilestones.filter(m => m.status === 'completed').length;
    const inProgressCount = linkedMilestones.filter(m => m.status === 'in-progress').length;
    const progressPercentage = (completedCount / linkedMilestones.length) * 100;

    let score = progressPercentage;
    let status: GoalDimension['status'] = 'fair';
    
    if (progressPercentage >= 80) status = 'excellent';
    else if (progressPercentage >= 60) status = 'good';
    else if (progressPercentage >= 40) status = 'fair';
    else if (progressPercentage >= 20) status = 'poor';
    else status = 'critical';

    // Boost score if there's active progress
    if (inProgressCount > 0) {
      score += 10;
    }

    const evidence = [
      `${completedCount}/${linkedMilestones.length} milestones completed (${progressPercentage.toFixed(1)}%)`,
      `${inProgressCount} milestones currently in progress`
    ];

    return {
      score: Math.min(100, score),
      status,
      description: `${progressPercentage.toFixed(1)}% of linked technical milestones completed`,
      trend: inProgressCount > 0 ? 'improving' : 'stable',
      evidence
    };
  }

  private assessVelocityDimension(goal: BusinessGoal, milestones: TechnicalMilestone[]): GoalDimension {
    const linkedMilestones = milestones.filter(m => m.linkedGoals.includes(goal.id));
    const completedMilestones = linkedMilestones.filter(m => m.status === 'completed' && m.completionDate);

    if (completedMilestones.length < 2) {
      return {
        score: 50,
        status: 'fair',
        description: 'Insufficient completion history to assess velocity',
        trend: 'stable',
        evidence: ['Need at least 2 completed milestones for velocity analysis']
      };
    }

    // Calculate completion velocity (milestones per month)
    const completionDates = completedMilestones.map(m => new Date(m.completionDate!).getTime()).sort();
    const timeSpan = (completionDates[completionDates.length - 1] - completionDates[0]) / (1000 * 60 * 60 * 24 * 30); // months
    const velocity = completedMilestones.length / Math.max(timeSpan, 0.5); // milestones per month

    // Assess if velocity is adequate for remaining work
    const remainingMilestones = linkedMilestones.length - completedMilestones.length;
    const estimatedMonthsToComplete = remainingMilestones / velocity;

    let score = 70; // Base score
    let status: GoalDimension['status'] = 'good';

    if (estimatedMonthsToComplete <= 2) {
      score = 90;
      status = 'excellent';
    } else if (estimatedMonthsToComplete <= 4) {
      score = 75;
      status = 'good';
    } else if (estimatedMonthsToComplete <= 6) {
      score = 60;
      status = 'fair';
    } else {
      score = 40;
      status = 'poor';
    }

    return {
      score,
      status,
      description: `Current velocity: ${velocity.toFixed(1)} milestones/month, ${estimatedMonthsToComplete.toFixed(1)} months to completion`,
      trend: 'stable', // Would need more data points to determine trend
      evidence: [
        `${completedMilestones.length} milestones completed over ${timeSpan.toFixed(1)} months`,
        `${remainingMilestones} milestones remaining`
      ]
    };
  }

  private assessConfidenceDimension(goal: BusinessGoal): GoalDimension {
    const confidence = goal.confidence || 50;
    
    let status: GoalDimension['status'] = 'fair';
    if (confidence >= 80) status = 'excellent';
    else if (confidence >= 65) status = 'good';
    else if (confidence >= 45) status = 'fair';
    else if (confidence >= 25) status = 'poor';
    else status = 'critical';

    return {
      score: confidence,
      status,
      description: `Goal confidence level at ${confidence}%`,
      trend: 'stable',
      evidence: [`Confidence score: ${confidence}%`]
    };
  }

  private assessDependencyDimension(goal: BusinessGoal, milestones: TechnicalMilestone[]): GoalDimension {
    const linkedMilestones = milestones.filter(m => m.linkedGoals.includes(goal.id));
    
    if (linkedMilestones.length === 0) {
      return {
        score: 30,
        status: 'poor',
        description: 'No technical dependencies mapped',
        trend: 'stable',
        evidence: ['Goal lacks technical implementation plan']
      };
    }

    // Assess dependency complexity
    const totalDependencies = linkedMilestones.reduce((sum, m) => sum + m.dependencies.length, 0);
    const avgDependencies = totalDependencies / linkedMilestones.length;
    
    // Check external dependencies from goal definition
    const externalDeps = (goal.dependencies?.externalFactors || []).length + 
                        (goal.dependencies?.businessPrerequisites || []).length;

    let score = 70; // Base score

    // Lower score for high dependency complexity
    if (avgDependencies > 3) score -= 20;
    else if (avgDependencies > 1.5) score -= 10;

    if (externalDeps > 3) score -= 15;
    else if (externalDeps > 1) score -= 5;

    // Check if dependencies are being managed
    const blockedMilestones = linkedMilestones.filter(m => m.status === 'delayed').length;
    if (blockedMilestones > 0) score -= (blockedMilestones * 10);

    let status: GoalDimension['status'] = 'good';
    if (score >= 80) status = 'excellent';
    else if (score >= 60) status = 'good';
    else if (score >= 40) status = 'fair';
    else if (score >= 20) status = 'poor';
    else status = 'critical';

    return {
      score: Math.max(0, score),
      status,
      description: `${avgDependencies.toFixed(1)} avg technical dependencies, ${externalDeps} external dependencies`,
      trend: blockedMilestones > 0 ? 'declining' : 'stable',
      evidence: [
        `${totalDependencies} total technical dependencies across ${linkedMilestones.length} milestones`,
        `${externalDeps} external business dependencies`,
        `${blockedMilestones} milestones currently blocked`
      ]
    };
  }

  private assessAlignmentDimension(goal: BusinessGoal, correlations: ProgressCorrelation[]): GoalDimension {
    const goalCorrelations = correlations.filter(c => c.businessGoalId === goal.id);
    
    if (goalCorrelations.length === 0) {
      return {
        score: 40,
        status: 'fair',
        description: 'No technical-business correlations detected',
        trend: 'stable',
        evidence: ['Goal needs stronger technical work alignment']
      };
    }

    const avgCorrelation = goalCorrelations.reduce((sum, c) => sum + Math.abs(c.correlationStrength), 0) / goalCorrelations.length;
    const strongCorrelations = goalCorrelations.filter(c => Math.abs(c.correlationStrength) >= 70).length;

    let score = avgCorrelation;
    let status: GoalDimension['status'] = 'fair';

    if (avgCorrelation >= 80) status = 'excellent';
    else if (avgCorrelation >= 65) status = 'good';
    else if (avgCorrelation >= 45) status = 'fair';
    else if (avgCorrelation >= 25) status = 'poor';
    else status = 'critical';

    // Bonus for having multiple strong correlations
    if (strongCorrelations >= 2) score += 10;

    return {
      score: Math.min(100, score),
      status,
      description: `${avgCorrelation.toFixed(1)}% average correlation strength with ${goalCorrelations.length} technical milestones`,
      trend: 'stable',
      evidence: [
        `${goalCorrelations.length} technical correlations detected`,
        `${strongCorrelations} strong correlations (70%+)`,
        `Average correlation strength: ${avgCorrelation.toFixed(1)}%`
      ]
    };
  }

  private determineOverallHealth(healthScore: number): GoalHealthAssessment['overallHealth'] {
    if (healthScore >= 80) return 'excellent';
    if (healthScore >= 65) return 'good';
    if (healthScore >= 45) return 'fair';
    if (healthScore >= 25) return 'poor';
    return 'critical';
  }

  private identifyBlockers(goal: BusinessGoal, milestones: TechnicalMilestone[]): GoalBlocker[] {
    const blockers: GoalBlocker[] = [];
    const linkedMilestones = milestones.filter(m => m.linkedGoals.includes(goal.id));

    // Technical blockers from delayed milestones
    const delayedMilestones = linkedMilestones.filter(m => m.status === 'delayed');
    delayedMilestones.forEach(milestone => {
      blockers.push({
        id: `technical-delay-${milestone.id}`,
        type: 'technical',
        description: `Milestone "${milestone.name}" is delayed`,
        severity: milestone.businessContext.strategicImportance >= 80 ? 'critical' : 
                 milestone.businessContext.strategicImportance >= 60 ? 'high' : 'medium',
        impact: `Blocks ${milestone.businessContext.revenueImplication.toLocaleString()} in projected revenue`,
        recommendedAction: 'Assess blockers and reallocate resources to critical path',
        estimatedResolutionTime: '1-2 weeks'
      });
    });

    // Dependency blockers
    const externalDeps = goal.dependencies?.externalFactors || [];
    if (externalDeps.length > 0) {
      blockers.push({
        id: `external-deps-${goal.id}`,
        type: 'external',
        description: `${externalDeps.length} external dependencies may impact progress`,
        severity: 'medium',
        impact: 'May cause delays or require scope adjustments',
        recommendedAction: 'Develop contingency plans for external dependencies',
        estimatedResolutionTime: 'ongoing monitoring'
      });
    }

    return blockers;
  }

  private identifyAccelerators(goal: BusinessGoal, milestones: TechnicalMilestone[]): GoalAccelerator[] {
    const accelerators: GoalAccelerator[] = [];
    const linkedMilestones = milestones.filter(m => m.linkedGoals.includes(goal.id));

    // Technical accelerators from high-performing areas
    const highImpactCompleted = linkedMilestones.filter(m => 
      m.status === 'completed' && m.businessContext.strategicImportance >= 80
    );

    if (highImpactCompleted.length > 0) {
      accelerators.push({
        id: `momentum-${goal.id}`,
        type: 'technical',
        description: `Strong execution momentum with ${highImpactCompleted.length} high-impact milestones completed`,
        potentialImpact: 'Can leverage lessons learned to accelerate remaining work',
        implementationEffort: 'low',
        timeToRealization: 'immediate'
      });
    }

    // Market timing accelerators
    const earlyMarketMilestones = linkedMilestones.filter(m => 
      m.businessContext.marketTiming === 'early'
    );

    if (earlyMarketMilestones.length > 0) {
      accelerators.push({
        id: `market-timing-${goal.id}`,
        type: 'market',
        description: 'Early market timing advantage available',
        potentialImpact: 'First-mover advantage can accelerate goal achievement',
        implementationEffort: 'medium',
        timeToRealization: '3-6 months'
      });
    }

    return accelerators;
  }

  private assessRiskFactors(goal: BusinessGoal, milestones: TechnicalMilestone[]): GoalRisk[] {
    const risks: GoalRisk[] = [];
    const linkedMilestones = milestones.filter(m => m.linkedGoals.includes(goal.id));

    // Timeline risk
    const highComplexityCount = linkedMilestones.filter(m => m.complexity === 'critical' || m.complexity === 'high').length;
    if (highComplexityCount > linkedMilestones.length * 0.5) {
      risks.push({
        id: `timeline-risk-${goal.id}`,
        type: 'timeline',
        description: `${highComplexityCount} high/critical complexity milestones may cause delays`,
        probability: 70,
        impact: 'high',
        mitigationStrategy: 'Break down complex milestones, add buffer time, ensure expert resources'
      });
    }

    // Resource risk
    const totalEffort = linkedMilestones.reduce((sum, m) => sum + m.effort, 0);
    if (totalEffort > 1000) { // More than 1000 person-hours
      risks.push({
        id: `resource-risk-${goal.id}`,
        type: 'resource',
        description: `High resource requirement (${totalEffort} person-hours)`,
        probability: 60,
        impact: 'medium',
        mitigationStrategy: 'Ensure adequate team capacity, consider prioritization or phasing'
      });
    }

    return risks;
  }

  private generateHealthRecommendations(
    overallHealth: GoalHealthAssessment['overallHealth'],
    dimensions: GoalHealthAssessment['dimensions'],
    blockers: GoalBlocker[]
  ): string[] {
    const recommendations: string[] = [];

    if (overallHealth === 'critical' || overallHealth === 'poor') {
      recommendations.push('URGENT: This goal requires immediate attention and intervention');
    }

    // Dimension-specific recommendations
    if (dimensions.progress.score < 50) {
      recommendations.push('Accelerate technical milestone completion to improve progress');
    }

    if (dimensions.velocity.score < 60) {
      recommendations.push('Review and optimize development velocity to meet timeline');
    }

    if (dimensions.confidence.score < 50) {
      recommendations.push('Address uncertainty factors to improve goal confidence');
    }

    if (dimensions.dependency.score < 60) {
      recommendations.push('Actively manage dependencies to prevent cascade delays');
    }

    if (dimensions.alignment.score < 60) {
      recommendations.push('Strengthen alignment between technical work and business objectives');
    }

    // Blocker-specific recommendations
    const criticalBlockers = blockers.filter(b => b.severity === 'critical');
    if (criticalBlockers.length > 0) {
      recommendations.push(`Address ${criticalBlockers.length} critical blocker(s) immediately`);
    }

    return recommendations;
  }

  calculateVelocityMetrics(goal: BusinessGoal, milestones: TechnicalMilestone[]): VelocityMetrics {
    const linkedMilestones = milestones.filter(m => m.linkedGoals.includes(goal.id));
    const completedMilestones = linkedMilestones.filter(m => m.status === 'completed' && m.completionDate);

    if (completedMilestones.length < 2) {
      return {
        goalId: goal.id,
        currentVelocity: 0,
        targetVelocity: 0,
        velocityTrend: 'stalled',
        efficiency: 0,
        projectedCompletion: 'insufficient-data',
        confidenceInterval: {
          optimistic: 'unknown',
          realistic: 'unknown',
          pessimistic: 'unknown'
        }
      };
    }

    // Calculate current velocity
    const completionDates = completedMilestones.map(m => new Date(m.completionDate!).getTime()).sort();
    const timeSpan = (completionDates[completionDates.length - 1] - completionDates[0]) / (1000 * 60 * 60 * 24 * 30); // months
    const currentVelocity = completedMilestones.length / Math.max(timeSpan, 0.5);

    // Calculate target velocity
    const remainingMilestones = linkedMilestones.length - completedMilestones.length;
    const monthsToTarget = 6; // Assume 6 month target for simplicity
    const targetVelocity = remainingMilestones / monthsToTarget;

    // Determine velocity trend
    let velocityTrend: VelocityMetrics['velocityTrend'] = 'steady';
    if (completedMilestones.length >= 3) {
      const recentVelocity = 2 / Math.max((completionDates[completionDates.length - 1] - completionDates[completionDates.length - 3]) / (1000 * 60 * 60 * 24 * 30), 0.5);
      if (recentVelocity > currentVelocity * 1.2) velocityTrend = 'accelerating';
      else if (recentVelocity < currentVelocity * 0.8) velocityTrend = 'decelerating';
    }

    // Calculate efficiency
    const efficiency = Math.min(100, (currentVelocity / Math.max(targetVelocity, 0.1)) * 100);

    // Project completion
    const monthsToComplete = remainingMilestones / Math.max(currentVelocity, 0.1);
    const projectedDate = new Date();
    projectedDate.setMonth(projectedDate.getMonth() + monthsToComplete);

    return {
      goalId: goal.id,
      currentVelocity,
      targetVelocity,
      velocityTrend,
      efficiency,
      projectedCompletion: projectedDate.toISOString(),
      confidenceInterval: {
        optimistic: new Date(projectedDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        realistic: projectedDate.toISOString(),
        pessimistic: new Date(projectedDate.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString()
      }
    };
  }

  generateCompletionForecast(
    goal: BusinessGoal,
    milestones: TechnicalMilestone[],
    correlations: ProgressCorrelation[]
  ): CompletionForecast {
    const linkedMilestones = milestones.filter(m => m.linkedGoals.includes(goal.id));
    const velocityMetrics = this.calculateVelocityMetrics(goal, milestones);

    // Use correlation-weighted forecasting as primary method
    const goalCorrelations = correlations.filter(c => c.businessGoalId === goal.id);
    const avgCorrelation = goalCorrelations.length > 0 
      ? goalCorrelations.reduce((sum, c) => sum + Math.abs(c.correlationStrength), 0) / goalCorrelations.length
      : 50;

    // Adjust forecast based on correlation strength
    const correlationMultiplier = avgCorrelation / 100;
    const adjustedProjection = new Date(velocityMetrics.projectedCompletion);
    
    if (correlationMultiplier < 0.5) {
      // Weak correlations suggest delays
      adjustedProjection.setMonth(adjustedProjection.getMonth() + 2);
    }

    const confidence = Math.min(90, 40 + (avgCorrelation * 0.5) + (velocityMetrics.efficiency * 0.3));

    return {
      goalId: goal.id,
      forecastMethod: 'correlation-weighted',
      projectedCompletionDate: adjustedProjection.toISOString(),
      confidence,
      scenarioAnalysis: {
        best: { 
          date: new Date(adjustedProjection.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(), 
          probability: 20 
        },
        likely: { 
          date: adjustedProjection.toISOString(), 
          probability: 60 
        },
        worst: { 
          date: new Date(adjustedProjection.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(), 
          probability: 20 
        }
      },
      criticalPath: linkedMilestones
        .filter(m => m.businessContext.strategicImportance >= 80)
        .map(m => m.name),
      assumptions: [
        'Current development velocity continues',
        `Correlation strength (${avgCorrelation.toFixed(1)}%) remains stable`,
        'No major external blockers emerge'
      ],
      riskFactors: [
        'High complexity milestones may take longer than estimated',
        'External dependencies could introduce delays',
        'Resource allocation changes could impact velocity'
      ]
    };
  }
}