import { Injectable } from '@nestjs/common';
import { Logger } from '../monitoring/Logger';
import { MetricsCollector } from '../monitoring/MetricsCollector';
import { SOC2ComplianceService, SOC2Report, SecurityIncident } from './SOC2ComplianceService';
import { ThreatDetectionService, ThreatEvent, SecurityMetrics } from './ThreatDetectionService';
import { ZeroTrustNetworkService, AccessRequest, AccessDecision } from './ZeroTrustNetworkService';

export interface SecurityDashboard {
  overview: SecurityOverview;
  compliance: ComplianceStatus;
  threats: ThreatStatus;
  access: AccessStatus;
  trends: SecurityTrends;
  alerts: SecurityAlert[];
}

export interface SecurityOverview {
  securityScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  activeIncidents: number;
  complianceStatus: 'compliant' | 'non-compliant' | 'in-progress';
  lastAssessment: Date;
}

export interface ComplianceStatus {
  soc2TypeII: {
    status: 'compliant' | 'non-compliant' | 'in-progress';
    percentage: number;
    lastAudit: Date;
    nextAudit: Date;
  };
  gdpr: {
    status: 'compliant' | 'non-compliant' | 'in-progress';
    privacyScore: number;
    lastReview: Date;
  };
  ferpa: {
    status: 'compliant' | 'non-compliant' | 'in-progress';
    educationalComplianceScore: number;
    lastValidation: Date;
  };
}

export interface ThreatStatus {
  activeThreatCount: number;
  criticalThreats: number;
  mitigationSuccessRate: number;
  averageDetectionTime: number;
  threatsByCategory: Record<string, number>;
}

export interface AccessStatus {
  totalAccessRequests: number;
  successfulAccess: number;
  deniedAccess: number;
  conditionalAccess: number;
  averageRiskScore: number;
  zeroTrustEffectiveness: number;
}

export interface SecurityTrends {
  securityScoreHistory: Array<{ date: Date; score: number }>;
  threatTrends: Array<{ date: Date; count: number; category: string }>;
  complianceTrends: Array<{ date: Date; percentage: number }>;
  accessPatterns: Array<{ date: Date; allowed: number; denied: number }>;
}

export interface SecurityAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'compliance' | 'threat' | 'access' | 'incident';
  title: string;
  description: string;
  timestamp: Date;
  status: 'active' | 'acknowledged' | 'resolved';
  recommendations: string[];
}

@Injectable()
export class EnterpriseSecurityService {
  private readonly logger = new Logger('EnterpriseSecurityService');
  private readonly metrics = new MetricsCollector();

  constructor(
    private readonly soc2Service: SOC2ComplianceService,
    private readonly threatDetectionService: ThreatDetectionService,
    private readonly zeroTrustService: ZeroTrustNetworkService
  ) {}

  async getSecurityDashboard(): Promise<SecurityDashboard> {
    const startTime = Date.now();

    try {
      // Fetch all security data in parallel
      const [
        complianceReport,
        threatMetrics,
        accessMetrics,
        activeThreats,
        activeIncidents
      ] = await Promise.all([
        this.soc2Service.generateComplianceReport(),
        this.threatDetectionService.getSecurityMetrics(),
        this.zeroTrustService.getAccessMetrics(),
        this.threatDetectionService.getActiveThreats(),
        this.soc2Service.getActiveIncidents()
      ]);

      // Calculate overall security score
      const securityScore = this.calculateSecurityScore(complianceReport, threatMetrics, accessMetrics);

      // Generate dashboard
      const dashboard: SecurityDashboard = {
        overview: {
          securityScore,
          riskLevel: this.determineRiskLevel(securityScore, activeThreats, activeIncidents),
          activeIncidents: activeIncidents.length,
          complianceStatus: complianceReport.certificationStatus,
          lastAssessment: new Date()
        },
        compliance: await this.buildComplianceStatus(complianceReport),
        threats: this.buildThreatStatus(threatMetrics, activeThreats),
        access: this.buildAccessStatus(accessMetrics),
        trends: await this.buildSecurityTrends(),
        alerts: await this.generateSecurityAlerts(activeThreats, activeIncidents, complianceReport)
      };

      const processingTime = Date.now() - startTime;
      this.metrics.recordMetric('security_dashboard_generation_ms', processingTime);
      this.metrics.recordMetric('security_score', securityScore);

      this.logger.info('Security dashboard generated', {
        securityScore,
        riskLevel: dashboard.overview.riskLevel,
        activeIncidents: activeIncidents.length,
        activeThreats: activeThreats.length,
        processingTimeMs: processingTime
      });

      return dashboard;

    } catch (error) {
      this.logger.error('Failed to generate security dashboard', { error: error.message });
      throw error;
    }
  }

  private calculateSecurityScore(
    complianceReport: SOC2Report,
    threatMetrics: SecurityMetrics,
    accessMetrics: any
  ): number {
    // Compliance score (40% weight)
    const complianceScore = complianceReport.certificationStatus === 'compliant' ? 100 : 
      ((complianceReport.controls.length - complianceReport.nonCompliantControls.length) / complianceReport.controls.length) * 100;

    // Threat management score (30% weight)
    const threatScore = Math.max(0, 100 - (threatMetrics.criticalThreats * 10) - (threatMetrics.threatsDetected * 2));

    // Access control score (20% weight)
    const accessScore = accessMetrics.totalRequests > 0 
      ? ((accessMetrics.allowedRequests + accessMetrics.conditionalRequests) / accessMetrics.totalRequests) * 100
      : 100;

    // System health score (10% weight)
    const systemHealthScore = 100 - Math.min(50, accessMetrics.averageRiskScore);

    const overallScore = (complianceScore * 0.4) + (threatScore * 0.3) + (accessScore * 0.2) + (systemHealthScore * 0.1);

    return Math.round(Math.max(0, Math.min(100, overallScore)));
  }

  private determineRiskLevel(
    securityScore: number, 
    activeThreats: ThreatEvent[], 
    activeIncidents: SecurityIncident[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    const criticalThreats = activeThreats.filter(t => t.severity === 'critical').length;
    const criticalIncidents = activeIncidents.filter(i => i.severity === 'critical').length;

    if (criticalThreats > 0 || criticalIncidents > 0 || securityScore < 60) {
      return 'critical';
    }

    if (securityScore < 75 || activeThreats.length > 5 || activeIncidents.length > 3) {
      return 'high';
    }

    if (securityScore < 85 || activeThreats.length > 2 || activeIncidents.length > 1) {
      return 'medium';
    }

    return 'low';
  }

  private async buildComplianceStatus(complianceReport: SOC2Report): Promise<ComplianceStatus> {
    const compliancePercentage = ((complianceReport.controls.length - complianceReport.nonCompliantControls.length) / complianceReport.controls.length) * 100;

    return {
      soc2TypeII: {
        status: complianceReport.certificationStatus,
        percentage: Math.round(compliancePercentage),
        lastAudit: complianceReport.generatedAt,
        nextAudit: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      },
      gdpr: {
        status: compliancePercentage > 95 ? 'compliant' : 'in-progress',
        privacyScore: Math.round(compliancePercentage),
        lastReview: new Date()
      },
      ferpa: {
        status: compliancePercentage > 95 ? 'compliant' : 'in-progress',
        educationalComplianceScore: Math.round(compliancePercentage),
        lastValidation: new Date()
      }
    };
  }

  private buildThreatStatus(threatMetrics: SecurityMetrics, activeThreats: ThreatEvent[]): ThreatStatus {
    return {
      activeThreatCount: activeThreats.length,
      criticalThreats: threatMetrics.criticalThreats,
      mitigationSuccessRate: threatMetrics.mitigationSuccess,
      averageDetectionTime: threatMetrics.averageResponseTime,
      threatsByCategory: threatMetrics.threatsByCategory
    };
  }

  private buildAccessStatus(accessMetrics: any): AccessStatus {
    const zeroTrustEffectiveness = accessMetrics.totalRequests > 0 
      ? ((accessMetrics.deniedRequests + accessMetrics.conditionalRequests) / accessMetrics.totalRequests) * 100
      : 100;

    return {
      totalAccessRequests: accessMetrics.totalRequests,
      successfulAccess: accessMetrics.allowedRequests,
      deniedAccess: accessMetrics.deniedRequests,
      conditionalAccess: accessMetrics.conditionalRequests,
      averageRiskScore: accessMetrics.averageRiskScore,
      zeroTrustEffectiveness: Math.round(zeroTrustEffectiveness)
    };
  }

  private async buildSecurityTrends(): Promise<SecurityTrends> {
    // In a real implementation, this would fetch historical data from a time-series database
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    return {
      securityScoreHistory: last7Days.map(date => ({
        date,
        score: Math.floor(Math.random() * 20) + 80 // Simulated data
      })),
      threatTrends: last7Days.map(date => ({
        date,
        count: Math.floor(Math.random() * 5),
        category: 'AUTH'
      })),
      complianceTrends: last7Days.map(date => ({
        date,
        percentage: Math.floor(Math.random() * 5) + 95 // Simulated data
      })),
      accessPatterns: last7Days.map(date => ({
        date,
        allowed: Math.floor(Math.random() * 1000) + 500,
        denied: Math.floor(Math.random() * 50) + 10
      }))
    };
  }

  private async generateSecurityAlerts(
    activeThreats: ThreatEvent[],
    activeIncidents: SecurityIncident[],
    complianceReport: SOC2Report
  ): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];

    // Generate alerts for critical threats
    for (const threat of activeThreats.filter(t => t.severity === 'critical')) {
      alerts.push({
        id: `threat-${threat.id}`,
        severity: 'critical',
        type: 'threat',
        title: 'Critical Security Threat Detected',
        description: threat.description,
        timestamp: threat.detectedAt,
        status: 'active',
        recommendations: ['Immediate investigation required', 'Consider blocking affected resources']
      });
    }

    // Generate alerts for security incidents
    for (const incident of activeIncidents.filter(i => i.severity === 'high' || i.severity === 'critical')) {
      alerts.push({
        id: `incident-${incident.id}`,
        severity: incident.severity as 'high' | 'critical',
        type: 'incident',
        title: 'Security Incident Reported',
        description: incident.description,
        timestamp: incident.detectedAt,
        status: 'active',
        recommendations: incident.remediationSteps
      });
    }

    // Generate alerts for compliance issues
    if (complianceReport.nonCompliantControls.length > 0) {
      alerts.push({
        id: `compliance-${Date.now()}`,
        severity: complianceReport.nonCompliantControls.length > 3 ? 'high' : 'medium',
        type: 'compliance',
        title: 'SOC 2 Compliance Issues Detected',
        description: `${complianceReport.nonCompliantControls.length} controls are non-compliant`,
        timestamp: new Date(),
        status: 'active',
        recommendations: complianceReport.remediationPlan
      });
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  async validateAccessRequest(request: AccessRequest): Promise<AccessDecision> {
    // Add security analysis to access requests
    const startTime = Date.now();

    try {
      // First, check for known threats
      await this.threatDetectionService.analyzeEvent({
        source: request.sourceService,
        userId: request.userId,
        resource: request.resource,
        ipAddress: request.contextInfo.ipAddress,
        userAgent: request.deviceInfo.operatingSystem
      });

      // Then evaluate through zero trust
      const decision = await this.zeroTrustService.evaluateAccess(request);

      const processingTime = Date.now() - startTime;
      this.metrics.recordMetric('access_validation_duration_ms', processingTime);

      this.logger.debug('Access request validated', {
        requestId: request.id,
        decision: decision.decision,
        riskScore: decision.riskScore,
        processingTimeMs: processingTime
      });

      return decision;

    } catch (error) {
      this.logger.error('Access validation failed', {
        requestId: request.id,
        error: error.message
      });

      // Fail secure - deny access on error
      return {
        requestId: request.id,
        decision: 'DENY',
        reason: 'Validation error - fail secure',
        riskScore: 100,
        decidedAt: new Date()
      };
    }
  }

  async generateSecurityReport(): Promise<{
    executiveSummary: string;
    securityPosture: SecurityOverview;
    complianceStatus: ComplianceStatus;
    threatAnalysis: ThreatStatus;
    recommendations: string[];
    nextSteps: string[];
  }> {
    const dashboard = await this.getSecurityDashboard();

    const executiveSummary = this.generateExecutiveSummary(dashboard);
    const recommendations = this.generateRecommendations(dashboard);
    const nextSteps = this.generateNextSteps(dashboard);

    return {
      executiveSummary,
      securityPosture: dashboard.overview,
      complianceStatus: dashboard.compliance,
      threatAnalysis: dashboard.threats,
      recommendations,
      nextSteps
    };
  }

  private generateExecutiveSummary(dashboard: SecurityDashboard): string {
    const { overview, compliance, threats, access } = dashboard;

    return `
Security Posture Assessment Summary:

Overall Security Score: ${overview.securityScore}/100 (${overview.riskLevel.toUpperCase()} risk)

Key Metrics:
- SOC 2 Type II Compliance: ${compliance.soc2TypeII.percentage}%
- Active Security Threats: ${threats.activeThreatCount} (${threats.criticalThreats} critical)
- Zero Trust Effectiveness: ${access.zeroTrustEffectiveness}%
- Access Success Rate: ${Math.round((access.successfulAccess / access.totalAccessRequests) * 100)}%

The organization demonstrates ${overview.securityScore >= 85 ? 'strong' : overview.securityScore >= 70 ? 'adequate' : 'concerning'} security controls with ${compliance.soc2TypeII.status} SOC 2 compliance status. 
${threats.criticalThreats > 0 ? 'IMMEDIATE ACTION REQUIRED for critical security threats.' : 'No critical threats currently active.'}
    `.trim();
  }

  private generateRecommendations(dashboard: SecurityDashboard): string[] {
    const recommendations: string[] = [];

    if (dashboard.overview.securityScore < 85) {
      recommendations.push('Enhance overall security posture through comprehensive security program review');
    }

    if (dashboard.compliance.soc2TypeII.percentage < 100) {
      recommendations.push('Address SOC 2 Type II control gaps to achieve full compliance');
    }

    if (dashboard.threats.criticalThreats > 0) {
      recommendations.push('Immediate mitigation of critical security threats');
    }

    if (dashboard.access.averageRiskScore > 50) {
      recommendations.push('Review and strengthen access control policies');
    }

    if (dashboard.alerts.filter(a => a.severity === 'critical').length > 0) {
      recommendations.push('Address critical security alerts immediately');
    }

    return recommendations;
  }

  private generateNextSteps(dashboard: SecurityDashboard): string[] {
    const nextSteps: string[] = [];

    if (dashboard.threats.activeThreatCount > 0) {
      nextSteps.push('Complete threat mitigation within 24 hours');
    }

    if (dashboard.overview.complianceStatus !== 'compliant') {
      nextSteps.push('Schedule compliance remediation review within 48 hours');
    }

    nextSteps.push('Conduct weekly security posture review');
    nextSteps.push('Update incident response procedures based on recent threats');
    nextSteps.push('Schedule quarterly security assessment');

    return nextSteps;
  }
}