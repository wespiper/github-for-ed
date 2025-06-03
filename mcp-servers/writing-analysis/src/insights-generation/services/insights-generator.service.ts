import { Injectable, Logger } from '@nestjs/common';
import { WritingSessionRepository } from '../../repositories/writing-session.repository';
import { ReflectionRepository } from '../../repositories/reflection.repository';
import { StudentPreferenceRepository } from '../../repositories/student-preference.repository';
import { AuditLoggerService } from '../../content-privacy/services/audit-logger.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';

export interface InsightsRequest {
  scope: 'individual' | 'class' | 'cohort';
  targetId: string;
  timeframe: 'day' | 'week' | 'month' | 'semester';
  role: 'student' | 'educator' | 'administrator';
  purpose: string;
  includeRecommendations?: boolean;
}

export interface InsightsResult {
  insights: {
    summary: string;
    keyMetrics: any;
    trends: any[];
    comparisons?: any;
  };
  recommendations?: string[];
  privacyMetadata: {
    aggregationLevel: string;
    differentialPrivacyApplied: boolean;
    dataPointsIncluded: number;
    consentCompliant: boolean;
  };
}

@Injectable()
export class InsightsGeneratorService {
  private readonly logger = new Logger(InsightsGeneratorService.name);

  constructor(
    private writingSessionRepository: WritingSessionRepository,
    private reflectionRepository: ReflectionRepository,
    private studentPreferenceRepository: StudentPreferenceRepository,
    private auditLogger: AuditLoggerService,
    private eventEmitter: EventEmitter2,
    private configService: ConfigService,
  ) {}

  async generateInsights(request: InsightsRequest): Promise<InsightsResult> {
    this.logger.log(`Generating ${request.scope} insights for ${request.targetId}`);

    // Check privacy compliance
    const privacyCheck = await this.checkPrivacyCompliance(request);
    if (!privacyCheck.compliant) {
      throw new Error(`Privacy compliance failed: ${privacyCheck.reason}`);
    }

    // Generate insights based on scope
    let insights;
    switch (request.scope) {
      case 'individual':
        insights = await this.generateIndividualInsights(request);
        break;
      case 'class':
        insights = await this.generateClassInsights(request);
        break;
      case 'cohort':
        insights = await this.generateCohortInsights(request);
        break;
    }

    // Apply privacy filters
    const filteredInsights = await this.applyPrivacyFilters(insights, request);

    // Generate recommendations if requested
    const recommendations = request.includeRecommendations
      ? this.generateRecommendations(filteredInsights, request)
      : undefined;

    // Log the insight generation
    await this.auditLogger.logAccess({
      accessType: 'analyze',
      dataType: 'insights',
      userId: request.targetId,
      accessedBy: 'system',
      purpose: request.purpose,
    });

    // Emit event
    await this.eventEmitter.emit('insights.generated', {
      scope: request.scope,
      targetId: request.targetId,
      insightType: 'writing_analysis',
      timestamp: new Date(),
    });

    return {
      insights: filteredInsights,
      recommendations,
      privacyMetadata: {
        aggregationLevel: request.scope,
        differentialPrivacyApplied: privacyCheck.differentialPrivacyApplied,
        dataPointsIncluded: filteredInsights.dataPointsIncluded || 0,
        consentCompliant: true,
      },
    };
  }

  private async checkPrivacyCompliance(request: InsightsRequest): Promise<any> {
    // Individual insights require consent
    if (request.scope === 'individual') {
      const preferences = await this.studentPreferenceRepository.getPreferences(request.targetId);
      if (!preferences.consentStatus.analytics) {
        return { compliant: false, reason: 'No analytics consent' };
      }
    }

    // Class/cohort insights require minimum size
    const minCohortSize = this.configService.get('privacy.dataMinimization.aggregateMinCohortSize');
    if (request.scope !== 'individual') {
      // In real implementation, check actual cohort size
      const cohortSize = 20; // Mock value
      if (cohortSize < minCohortSize) {
        return { compliant: false, reason: 'Cohort too small for privacy' };
      }
    }

    return {
      compliant: true,
      differentialPrivacyApplied: request.scope !== 'individual',
    };
  }

  private async generateIndividualInsights(request: InsightsRequest): Promise<any> {
    // Mock implementation - would query real data
    const sessions = await this.writingSessionRepository.findById(request.targetId);
    const reflections = await this.reflectionRepository.findByUser(request.targetId);
    const qualityStats = await this.reflectionRepository.getQualityStats(request.targetId);

    return {
      summary: `Writing activity analysis for the past ${request.timeframe}`,
      keyMetrics: {
        totalWritingSessions: 15,
        averageSessionLength: 45,
        totalWordsWritten: 3500,
        reflectionQuality: qualityStats.averageQuality,
        improvementTrend: qualityStats.trend,
      },
      trends: [
        {
          metric: 'words_per_session',
          values: [200, 250, 300, 280, 350],
          trend: 'increasing',
        },
        {
          metric: 'reflection_quality',
          values: [75, 78, 82, 85, 87],
          trend: 'improving',
        },
      ],
      dataPointsIncluded: 15,
    };
  }

  private async generateClassInsights(request: InsightsRequest): Promise<any> {
    // Mock implementation - would aggregate class data
    return {
      summary: `Class-wide writing patterns for the past ${request.timeframe}`,
      keyMetrics: {
        activeStudents: 25,
        averageWordsPerStudent: 2800,
        classReflectionQuality: 82,
        engagementRate: 0.88,
      },
      trends: [
        {
          metric: 'class_participation',
          values: [0.8, 0.82, 0.85, 0.87, 0.88],
          trend: 'increasing',
        },
      ],
      comparisons: {
        topQuartile: { avgWords: 4200, avgQuality: 91 },
        bottomQuartile: { avgWords: 1500, avgQuality: 68 },
      },
      dataPointsIncluded: 125,
    };
  }

  private async generateCohortInsights(request: InsightsRequest): Promise<any> {
    // Mock implementation - would aggregate cohort data
    return {
      summary: `Cohort-level writing analysis for the past ${request.timeframe}`,
      keyMetrics: {
        cohortSize: 150,
        averageProgress: 0.72,
        completionRate: 0.85,
        qualityDistribution: {
          excellent: 0.22,
          good: 0.45,
          satisfactory: 0.28,
          needsImprovement: 0.05,
        },
      },
      trends: [
        {
          metric: 'overall_quality',
          values: [78, 79, 81, 83, 84],
          trend: 'gradual_improvement',
        },
      ],
      dataPointsIncluded: 750,
    };
  }

  private async applyPrivacyFilters(insights: any, request: InsightsRequest): Promise<any> {
    const filtered = { ...insights };

    // Apply differential privacy to aggregated metrics
    if (request.scope !== 'individual') {
      filtered.keyMetrics = this.applyDifferentialPrivacy(filtered.keyMetrics);
    }

    // Remove identifying information
    if (filtered.comparisons) {
      // Ensure comparisons don't identify individuals
      delete filtered.comparisons.studentIds;
      delete filtered.comparisons.names;
    }

    // Round values to reduce precision
    if (filtered.trends) {
      filtered.trends = filtered.trends.map((trend: any) => ({
        ...trend,
        values: trend.values.map((v: number) => Math.round(v)),
      }));
    }

    return filtered;
  }

  private applyDifferentialPrivacy(metrics: any): any {
    const epsilon = this.configService.get('privacy.differentialPrivacy.epsilon');
    const noised = { ...metrics };

    // Add Laplace noise to numeric values
    Object.keys(noised).forEach(key => {
      if (typeof noised[key] === 'number') {
        noised[key] = this.addLaplaceNoise(noised[key], epsilon);
      }
    });

    return noised;
  }

  private addLaplaceNoise(value: number, epsilon: number): number {
    const b = 1 / epsilon;
    const u = Math.random() - 0.5;
    const noise = -b * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
    return Math.round(value + noise);
  }

  private generateRecommendations(insights: any, request: InsightsRequest): string[] {
    const recommendations: string[] = [];

    // Individual recommendations
    if (request.scope === 'individual') {
      if (insights.keyMetrics.reflectionQuality < 70) {
        recommendations.push('Focus on improving reflection depth and self-awareness');
      }
      if (insights.keyMetrics.averageSessionLength < 30) {
        recommendations.push('Try longer writing sessions for better flow and depth');
      }
      if (insights.trends.find((t: any) => t.metric === 'words_per_session')?.trend === 'decreasing') {
        recommendations.push('Writing productivity is declining - consider setting daily goals');
      }
    }

    // Class recommendations
    if (request.scope === 'class') {
      if (insights.keyMetrics.engagementRate < 0.8) {
        recommendations.push('Consider intervention strategies for disengaged students');
      }
      if (insights.comparisons && insights.comparisons.bottomQuartile.avgQuality < 70) {
        recommendations.push('Bottom quartile needs additional support with reflection skills');
      }
    }

    // Cohort recommendations
    if (request.scope === 'cohort') {
      if (insights.keyMetrics.completionRate < 0.9) {
        recommendations.push('Review assignment difficulty and provide clearer guidelines');
      }
      if (insights.keyMetrics.qualityDistribution.needsImprovement > 0.1) {
        recommendations.push('Consider cohort-wide workshops on effective reflection techniques');
      }
    }

    return recommendations;
  }
}