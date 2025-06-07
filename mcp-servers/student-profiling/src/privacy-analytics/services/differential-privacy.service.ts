import { Injectable, Logger } from '@nestjs/common';
import { PrivacyConfig } from '../../config/privacy.config';

export interface PrivacyPreservingAnalytics {
  analysisId: string;
  cohortSize: number;
  metrics: AnalyticsMetric[];
  privacyParameters: {
    epsilon: number;
    delta: number;
    noiseAdded: boolean;
    suppressedGroups: number;
  };
  timestamp: Date;
}

export interface AnalyticsMetric {
  name: string;
  rawValue: number;
  privatizedValue: number;
  confidence: number;
  suppressed: boolean;
}

export interface PrivacyBudget {
  totalBudget: number;
  usedBudget: number;
  remainingBudget: number;
  queries: BudgetQuery[];
}

export interface BudgetQuery {
  queryId: string;
  epsilon: number;
  timestamp: Date;
  metric: string;
}

@Injectable()
export class DifferentialPrivacyService {
  private readonly logger = new Logger(DifferentialPrivacyService.name);
  private privacyBudgets: Map<string, PrivacyBudget> = new Map();

  async generatePrivacyPreservingAnalytics(
    cohortIds: string[],
    metrics: string[],
    epsilon?: number,
    delta?: number
  ): Promise<PrivacyPreservingAnalytics> {
    this.logger.log(`Generating privacy-preserving analytics for ${cohortIds.length} cohorts`);

    // Use provided parameters or defaults
    const privacyEpsilon = epsilon || PrivacyConfig.differentialPrivacy.epsilon;
    const privacyDelta = delta || PrivacyConfig.differentialPrivacy.delta;

    // Check cohort size
    const cohortSize = cohortIds.length;
    if (cohortSize < PrivacyConfig.differentialPrivacy.minCohortSize) {
      throw new Error(`Cohort size ${cohortSize} is below minimum ${PrivacyConfig.differentialPrivacy.minCohortSize}`);
    }

    // Generate analytics for each metric
    const analyticsMetrics: AnalyticsMetric[] = [];
    let suppressedGroups = 0;

    for (const metric of metrics) {
      const rawValue = await this.calculateRawMetric(cohortIds, metric);
      
      // Check if group is too small for this metric
      if (this.shouldSuppressMetric(cohortIds, metric)) {
        analyticsMetrics.push({
          name: metric,
          rawValue: 0,
          privatizedValue: 0,
          confidence: 0,
          suppressed: true,
        });
        suppressedGroups++;
      } else {
        // Add Laplace noise
        const noise = this.generateLaplaceNoise(privacyEpsilon);
        const privatizedValue = rawValue + noise;

        analyticsMetrics.push({
          name: metric,
          rawValue,
          privatizedValue: Math.max(0, privatizedValue), // Ensure non-negative
          confidence: this.calculateConfidence(cohortSize, privacyEpsilon),
          suppressed: false,
        });

        // Update privacy budget
        await this.updatePrivacyBudget(cohortIds[0], privacyEpsilon, metric);
      }
    }

    return {
      analysisId: this.generateAnalysisId(),
      cohortSize,
      metrics: analyticsMetrics,
      privacyParameters: {
        epsilon: privacyEpsilon,
        delta: privacyDelta,
        noiseAdded: true,
        suppressedGroups,
      },
      timestamp: new Date(),
    };
  }

  async generateSyntheticData(
    templateData: any[],
    count: number,
    privacyLevel: 'low' | 'medium' | 'high'
  ): Promise<any[]> {
    this.logger.log(`Generating ${count} synthetic data points with ${privacyLevel} privacy`);

    const syntheticData: any[] = [];
    const noiseScale = this.getNoiseScaleForPrivacyLevel(privacyLevel);

    for (let i = 0; i < count; i++) {
      const template = templateData[Math.floor(Math.random() * templateData.length)];
      const synthetic = this.perturbData(template, noiseScale);
      syntheticData.push(synthetic);
    }

    return syntheticData;
  }

  async checkPrivacyBudget(entityId: string): Promise<PrivacyBudget> {
    const budget = this.privacyBudgets.get(entityId) || this.createNewBudget(entityId);
    return budget;
  }

  async createFederatedAnalytics(
    localResults: any[],
    aggregationMethod: 'average' | 'sum' | 'median'
  ): Promise<{
    globalResult: number;
    participantCount: number;
    privacyGuarantee: string;
  }> {
    this.logger.log(`Creating federated analytics with ${aggregationMethod} aggregation`);

    // Add noise to each local result before aggregation
    const noisyResults = localResults.map(result => 
      result + this.generateLaplaceNoise(PrivacyConfig.differentialPrivacy.epsilon)
    );

    let globalResult: number;
    switch (aggregationMethod) {
      case 'average':
        globalResult = noisyResults.reduce((a, b) => a + b, 0) / noisyResults.length;
        break;
      case 'sum':
        globalResult = noisyResults.reduce((a, b) => a + b, 0);
        break;
      case 'median':
        noisyResults.sort((a, b) => a - b);
        const mid = Math.floor(noisyResults.length / 2);
        globalResult = noisyResults.length % 2 
          ? noisyResults[mid]
          : (noisyResults[mid - 1] + noisyResults[mid]) / 2;
        break;
    }

    return {
      globalResult,
      participantCount: localResults.length,
      privacyGuarantee: `ε=${PrivacyConfig.differentialPrivacy.epsilon}, δ=${PrivacyConfig.differentialPrivacy.delta}`,
    };
  }

  // Private helper methods
  private async calculateRawMetric(cohortIds: string[], metric: string): Promise<number> {
    // Mock calculation - replace with actual metric calculation
    switch (metric) {
      case 'average_writing_score':
        return 75 + Math.random() * 20;
      case 'completion_rate':
        return 0.8 + Math.random() * 0.15;
      case 'engagement_level':
        return 0.6 + Math.random() * 0.3;
      default:
        return Math.random() * 100;
    }
  }

  private shouldSuppressMetric(cohortIds: string[], metric: string): boolean {
    // Check various suppression rules
    const subgroupSize = this.getSubgroupSize(cohortIds, metric);
    return subgroupSize < PrivacyConfig.differentialPrivacy.minCohortSize;
  }

  private getSubgroupSize(cohortIds: string[], metric: string): number {
    // Mock implementation - check actual subgroup sizes
    return cohortIds.length;
  }

  private generateLaplaceNoise(epsilon: number): number {
    // Generate Laplace noise with scale based on sensitivity and epsilon
    const sensitivity = PrivacyConfig.differentialPrivacy.sensitivity;
    const scale = sensitivity / epsilon;
    
    // Generate random value from Laplace distribution
    const u = Math.random() - 0.5;
    return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }

  private calculateConfidence(cohortSize: number, epsilon: number): number {
    // Confidence decreases with more noise (lower epsilon) and smaller cohorts
    const baseConfidence = Math.min(1, cohortSize / 100);
    const epsilonFactor = Math.min(1, epsilon / 5);
    return baseConfidence * epsilonFactor;
  }

  private async updatePrivacyBudget(
    entityId: string,
    epsilon: number,
    metric: string
  ): Promise<void> {
    const budget = this.privacyBudgets.get(entityId) || this.createNewBudget(entityId);
    
    budget.usedBudget += epsilon;
    budget.remainingBudget = budget.totalBudget - budget.usedBudget;
    
    budget.queries.push({
      queryId: this.generateAnalysisId(),
      epsilon,
      timestamp: new Date(),
      metric,
    });

    this.privacyBudgets.set(entityId, budget);

    // Check if budget is exhausted
    if (budget.remainingBudget < epsilon) {
      this.logger.warn(`Privacy budget nearly exhausted for entity: ${entityId}`);
    }
  }

  private createNewBudget(entityId: string): PrivacyBudget {
    const budget: PrivacyBudget = {
      totalBudget: 10.0, // Total epsilon budget
      usedBudget: 0,
      remainingBudget: 10.0,
      queries: [],
    };
    this.privacyBudgets.set(entityId, budget);
    return budget;
  }

  private generateAnalysisId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getNoiseScaleForPrivacyLevel(level: 'low' | 'medium' | 'high'): number {
    switch (level) {
      case 'low':
        return 0.05;
      case 'medium':
        return 0.1;
      case 'high':
        return 0.2;
    }
  }

  private perturbData(data: any, noiseScale: number): any {
    // Add noise to numeric fields
    const perturbed = { ...data };
    
    for (const key in perturbed) {
      if (typeof perturbed[key] === 'number') {
        perturbed[key] += perturbed[key] * (Math.random() - 0.5) * noiseScale;
      }
    }

    return perturbed;
  }
}