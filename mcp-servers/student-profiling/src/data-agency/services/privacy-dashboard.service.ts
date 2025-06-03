import { Injectable, Logger } from '@nestjs/common';
import { AccessValidatorService } from './access-validator.service';
import { PrivacyChoicesService } from './privacy-choices.service';

export interface PrivacyDashboard {
  dashboardId: string;
  studentId: string;
  currentChoices: any;
  dataAccessLog: DataAccessLogEntry[];
  privacyScore: PrivacyMetrics;
  recommendations: PrivacyRecommendation[];
  dataInventory: DataInventory;
  controls: PrivacyControls;
  generatedAt: Date;
}

export interface DataAccessLogEntry {
  timestamp: Date;
  accessorId: string;
  accessorName: string;
  accessorType: string;
  dataAccessed: string[];
  purpose: string;
  duration: number;
}

export interface PrivacyMetrics {
  overallScore: number;
  dataMinimization: number;
  consentCompliance: number;
  accessControl: number;
  dataProtection: number;
  trends: {
    weekly: number[];
    monthly: number[];
  };
}

export interface PrivacyRecommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  impact: string;
}

export interface DataInventory {
  totalDataPoints: number;
  categorizedData: {
    academic: number;
    behavioral: number;
    personal: number;
    sensitive: number;
  };
  dataByService: {
    service: string;
    dataPoints: number;
    lastAccessed: Date;
  }[];
  retentionStatus: {
    scheduledForDeletion: number;
    permanentRecords: number;
    temporaryData: number;
  };
}

export interface PrivacyControls {
  updateChoices: string;
  downloadData: string;
  requestDeletion: string;
  viewAccessHistory: string;
  revokeAccess: string;
}

@Injectable()
export class PrivacyDashboardService {
  private readonly logger = new Logger(PrivacyDashboardService.name);

  constructor(
    private readonly accessValidator: AccessValidatorService,
    private readonly privacyChoices: PrivacyChoicesService,
  ) {}

  async createDashboard(
    studentId: string,
    includeRecommendations: boolean = true,
    timeRange: string = 'month'
  ): Promise<PrivacyDashboard> {
    this.logger.log(`Creating privacy dashboard for student: ${studentId}`);

    // Gather all privacy-related data
    const [
      currentChoices,
      accessLogs,
      privacyScore,
      dataInventory,
    ] = await Promise.all([
      this.privacyChoices.exportPrivacyChoices(studentId),
      this.getDataAccessHistory(studentId, timeRange),
      this.calculatePrivacyScore(studentId),
      this.generateDataInventory(studentId),
    ]);

    const dashboard: PrivacyDashboard = {
      dashboardId: this.generateDashboardId(),
      studentId,
      currentChoices: currentChoices.currentChoices,
      dataAccessLog: accessLogs,
      privacyScore,
      recommendations: includeRecommendations ? 
        await this.generateRecommendations(studentId, privacyScore) : [],
      dataInventory,
      controls: this.getPrivacyControls(),
      generatedAt: new Date(),
    };

    return dashboard;
  }

  async getPrivacyInsights(studentId: string): Promise<{
    insights: string[];
    alerts: PrivacyAlert[];
  }> {
    const insights: string[] = [];
    const alerts: PrivacyAlert[] = [];

    // Analyze access patterns
    const accessCount = await this.accessValidator.getActiveAccessCount(studentId);
    if (accessCount > 5) {
      alerts.push({
        id: 'high-access-count',
        severity: 'medium',
        message: `${accessCount} entities currently have access to your data`,
        action: 'Review and revoke unnecessary access',
      });
    }

    // Check privacy choices
    const choices = await this.privacyChoices.exportPrivacyChoices(studentId);
    const choiceAnalysis = this.analyzePrivacyChoices(choices.currentChoices);
    insights.push(...choiceAnalysis.insights);

    // Data retention insights
    const retentionInsights = await this.getRetentionInsights(studentId);
    insights.push(...retentionInsights);

    return { insights, alerts };
  }

  // Private helper methods
  private async getDataAccessHistory(
    studentId: string,
    timeRange: string
  ): Promise<DataAccessLogEntry[]> {
    const timeRangeMap = {
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      semester: 180 * 24 * 60 * 60 * 1000,
      all: Number.MAX_SAFE_INTEGER,
    };

    const rangeMs = timeRangeMap[timeRange] || timeRangeMap.month;
    const startDate = new Date(Date.now() - rangeMs);

    const auditLogs = await this.accessValidator.getAccessLogs(studentId, {
      start: startDate,
      end: new Date(),
    });

    // Transform audit logs to dashboard format
    return auditLogs.map(log => ({
      timestamp: log.timestamp,
      accessorId: log.requesterId,
      accessorName: this.getAccessorName(log.requesterId),
      accessorType: this.getAccessorType(log.requesterId),
      dataAccessed: log.dataTypes,
      purpose: log.purpose,
      duration: this.calculateAccessDuration(log),
    }));
  }

  private async calculatePrivacyScore(studentId: string): Promise<PrivacyMetrics> {
    // Calculate component scores
    const dataMinimization = await this.calculateDataMinimizationScore(studentId);
    const consentCompliance = await this.calculateConsentComplianceScore(studentId);
    const accessControl = await this.calculateAccessControlScore(studentId);
    const dataProtection = await this.calculateDataProtectionScore(studentId);

    // Calculate weighted overall score
    const weights = {
      dataMinimization: 0.3,
      consentCompliance: 0.3,
      accessControl: 0.2,
      dataProtection: 0.2,
    };

    const overallScore = 
      dataMinimization * weights.dataMinimization +
      consentCompliance * weights.consentCompliance +
      accessControl * weights.accessControl +
      dataProtection * weights.dataProtection;

    return {
      overallScore: Math.round(overallScore * 100) / 100,
      dataMinimization,
      consentCompliance,
      accessControl,
      dataProtection,
      trends: {
        weekly: await this.getWeeklyTrends(studentId),
        monthly: await this.getMonthlyTrends(studentId),
      },
    };
  }

  private async generateDataInventory(studentId: string): Promise<DataInventory> {
    // Mock implementation - would query actual data stores
    return {
      totalDataPoints: 1234,
      categorizedData: {
        academic: 456,
        behavioral: 234,
        personal: 123,
        sensitive: 45,
      },
      dataByService: [
        {
          service: 'Writing Analysis',
          dataPoints: 567,
          lastAccessed: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          service: 'Learning Trajectory',
          dataPoints: 345,
          lastAccessed: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
        {
          service: 'Skill Assessment',
          dataPoints: 234,
          lastAccessed: new Date(Date.now() - 48 * 60 * 60 * 1000),
        },
      ],
      retentionStatus: {
        scheduledForDeletion: 123,
        permanentRecords: 456,
        temporaryData: 655,
      },
    };
  }

  private async generateRecommendations(
    studentId: string,
    privacyScore: PrivacyMetrics
  ): Promise<PrivacyRecommendation[]> {
    const recommendations: PrivacyRecommendation[] = [];

    // Low data minimization score
    if (privacyScore.dataMinimization < 0.7) {
      recommendations.push({
        id: 'improve-data-minimization',
        priority: 'high',
        title: 'Reduce Data Collection',
        description: 'You can improve privacy by limiting data collection to essential items only',
        action: 'Review and disable unnecessary data collection in privacy settings',
        impact: 'Reduces privacy risk by 30%',
      });
    }

    // Many active access tokens
    const accessCount = await this.accessValidator.getActiveAccessCount(studentId);
    if (accessCount > 3) {
      recommendations.push({
        id: 'review-access-permissions',
        priority: 'medium',
        title: 'Review Access Permissions',
        description: `${accessCount} entities currently have access to your data`,
        action: 'Review and revoke unnecessary access permissions',
        impact: 'Improves access control score',
      });
    }

    // Check if enhanced features are disabled
    const choices = await this.privacyChoices.exportPrivacyChoices(studentId);
    if (!choices.currentChoices.personalBenefits.enhancedAnalytics) {
      recommendations.push({
        id: 'consider-enhanced-analytics',
        priority: 'low',
        title: 'Unlock Advanced Learning Insights',
        description: 'Enable enhanced analytics for personalized learning recommendations',
        action: 'Review the value exchange for enhanced analytics',
        impact: 'Better learning outcomes with controlled data sharing',
      });
    }

    return recommendations;
  }

  private getPrivacyControls(): PrivacyControls {
    return {
      updateChoices: '/privacy/choices',
      downloadData: '/privacy/export',
      requestDeletion: '/privacy/delete',
      viewAccessHistory: '/privacy/access-log',
      revokeAccess: '/privacy/revoke',
    };
  }

  // Helper calculation methods
  private async calculateDataMinimizationScore(studentId: string): Promise<number> {
    // Score based on how much optional data is being collected
    const choices = await this.privacyChoices.exportPrivacyChoices(studentId);
    const optionalFeatures = [
      choices.currentChoices.platformImprovement.featureAnalytics,
      choices.currentChoices.platformImprovement.research,
      choices.currentChoices.personalBenefits.enhancedAnalytics,
      choices.currentChoices.personalBenefits.portfolio,
      choices.currentChoices.personalBenefits.careerGuidance,
    ];

    const enabledCount = optionalFeatures.filter(f => f).length;
    return 1 - (enabledCount / optionalFeatures.length) * 0.5;
  }

  private async calculateConsentComplianceScore(studentId: string): Promise<number> {
    // Check if all consents are properly recorded and up-to-date
    const choices = await this.privacyChoices.exportPrivacyChoices(studentId);
    const hasValidConsent = choices.currentChoices && choices.history.length > 0;
    return hasValidConsent ? 0.9 : 0.3;
  }

  private async calculateAccessControlScore(studentId: string): Promise<number> {
    // Score based on access patterns and controls
    const accessCount = await this.accessValidator.getActiveAccessCount(studentId);
    const accessScore = Math.max(0, 1 - (accessCount * 0.1));
    return accessScore;
  }

  private async calculateDataProtectionScore(studentId: string): Promise<number> {
    // Mock score based on encryption, retention, etc.
    return 0.85;
  }

  private async getWeeklyTrends(studentId: string): Promise<number[]> {
    // Mock weekly privacy scores
    return [0.75, 0.78, 0.80, 0.82, 0.84, 0.86, 0.87];
  }

  private async getMonthlyTrends(studentId: string): Promise<number[]> {
    // Mock monthly privacy scores
    return [0.70, 0.75, 0.80, 0.85];
  }

  private analyzePrivacyChoices(choices: any): { insights: string[] } {
    const insights: string[] = [];

    if (choices.educationalSharing.peer && !choices.educationalSharing.teacher) {
      insights.push('You share data with peers but not teachers - consider if this aligns with your goals');
    }

    if (!choices.platformImprovement.anonymousPatterns) {
      insights.push('Anonymous pattern sharing helps improve the platform for everyone');
    }

    if (choices.privacyControls.retentionPeriod === 'indefinite') {
      insights.push('Consider setting a data retention period for better privacy control');
    }

    return { insights };
  }

  private async getRetentionInsights(studentId: string): Promise<string[]> {
    return [
      'Your writing samples older than 6 months will be automatically deleted next month',
      '15% of your data is marked for permanent retention (required for transcripts)',
    ];
  }

  private getAccessorName(accessorId: string): string {
    // Mock implementation - would lookup actual names
    return `User ${accessorId.slice(0, 6)}`;
  }

  private getAccessorType(accessorId: string): string {
    // Mock implementation - would lookup actual types
    const types = ['Teacher', 'Platform Service', 'Administrator'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private calculateAccessDuration(log: any): number {
    // Mock duration in minutes
    return Math.floor(Math.random() * 30) + 5;
  }

  private generateDashboardId(): string {
    return `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

interface PrivacyAlert {
  id: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  action: string;
}