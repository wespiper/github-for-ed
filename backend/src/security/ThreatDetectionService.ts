import { Injectable } from '@nestjs/common';
import { Logger } from '../monitoring/Logger';
import { MetricsCollector } from '../monitoring/MetricsCollector';
import { PrivacyMonitor } from '../monitoring/PrivacyMonitor';

export interface ThreatPattern {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  indicators: string[];
  mitigationSteps: string[];
  enabled: boolean;
}

export interface ThreatEvent {
  id: string;
  patternId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  description: string;
  detectedAt: Date;
  indicators: Record<string, any>;
  status: 'active' | 'mitigated' | 'false-positive';
  mitigationActions: string[];
  resolvedAt?: Date;
}

export interface SecurityMetrics {
  threatsDetected: number;
  criticalThreats: number;
  averageResponseTime: number;
  falsePositiveRate: number;
  threatsByCategory: Record<string, number>;
  mitigationSuccess: number;
}

@Injectable()
export class ThreatDetectionService {
  private readonly logger = new Logger('ThreatDetectionService');
  private readonly metrics = new MetricsCollector();
  private readonly privacyMonitor = new PrivacyMonitor();

  private threatPatterns: Map<string, ThreatPattern> = new Map();
  private activeThreatEvents: Map<string, ThreatEvent> = new Map();
  private detectionRules: Map<string, (data: any) => boolean> = new Map();

  constructor() {
    this.initializeThreatPatterns();
    this.initializeDetectionRules();
  }

  private initializeThreatPatterns(): void {
    // Authentication-based threats
    this.addThreatPattern({
      id: 'AUTH-001',
      name: 'Brute Force Authentication Attack',
      description: 'Multiple failed login attempts from same IP',
      severity: 'high',
      indicators: ['failed_login_attempts', 'source_ip', 'time_window'],
      mitigationSteps: ['Block IP address', 'Increase authentication delay', 'Notify security team'],
      enabled: true
    });

    this.addThreatPattern({
      id: 'AUTH-002',
      name: 'Credential Stuffing Attack',
      description: 'Authentication attempts with known compromised credentials',
      severity: 'critical',
      indicators: ['known_compromised_credentials', 'automated_pattern', 'multiple_accounts'],
      mitigationSteps: ['Force password reset', 'Enable MFA', 'Monitor account activity'],
      enabled: true
    });

    // Data access threats
    this.addThreatPattern({
      id: 'DATA-001',
      name: 'Abnormal Data Access Pattern',
      description: 'Unusual data access volume or pattern detected',
      severity: 'medium',
      indicators: ['access_volume', 'access_pattern', 'user_role', 'time_of_day'],
      mitigationSteps: ['Review access permissions', 'Audit user activity', 'Implement additional monitoring'],
      enabled: true
    });

    this.addThreatPattern({
      id: 'DATA-002',
      name: 'Potential Data Exfiltration',
      description: 'Large volume data download or export detected',
      severity: 'critical',
      indicators: ['download_volume', 'export_frequency', 'data_sensitivity'],
      mitigationSteps: ['Block further access', 'Audit downloaded data', 'Investigate user activity'],
      enabled: true
    });

    // Privacy-specific threats
    this.addThreatPattern({
      id: 'PRIV-001',
      name: 'PII Exposure Risk',
      description: 'Potential exposure of personally identifiable information',
      severity: 'critical',
      indicators: ['pii_in_logs', 'unencrypted_data', 'access_without_consent'],
      mitigationSteps: ['Remove PII from logs', 'Encrypt exposed data', 'Review consent status'],
      enabled: true
    });

    this.addThreatPattern({
      id: 'PRIV-002',
      name: 'Consent Violation',
      description: 'Data processing without proper consent',
      severity: 'high',
      indicators: ['processing_without_consent', 'consent_withdrawn', 'purpose_limitation_violation'],
      mitigationSteps: ['Stop data processing', 'Obtain consent', 'Review data usage'],
      enabled: true
    });

    // System integrity threats
    this.addThreatPattern({
      id: 'SYS-001',
      name: 'Anomalous System Behavior',
      description: 'Unusual system performance or behavior patterns',
      severity: 'medium',
      indicators: ['cpu_usage', 'memory_usage', 'network_traffic', 'error_rate'],
      mitigationSteps: ['Monitor system resources', 'Check for malware', 'Review system logs'],
      enabled: true
    });

    this.addThreatPattern({
      id: 'SYS-002',
      name: 'Potential DDoS Attack',
      description: 'High volume of requests from multiple sources',
      severity: 'high',
      indicators: ['request_volume', 'source_distribution', 'response_time_degradation'],
      mitigationSteps: ['Enable rate limiting', 'Block suspicious IPs', 'Scale infrastructure'],
      enabled: true
    });

    this.logger.info('Threat detection patterns initialized', { 
      totalPatterns: this.threatPatterns.size 
    });
  }

  private addThreatPattern(pattern: ThreatPattern): void {
    this.threatPatterns.set(pattern.id, pattern);
  }

  private initializeDetectionRules(): void {
    // Brute force detection rule
    this.detectionRules.set('AUTH-001', (data: any) => {
      const failedAttempts = data.failedLoginAttempts || 0;
      const timeWindow = data.timeWindowMinutes || 60;
      return failedAttempts > 10 && timeWindow <= 15;
    });

    // Credential stuffing detection rule
    this.detectionRules.set('AUTH-002', (data: any) => {
      const isKnownCompromised = data.isKnownCompromisedCredentials || false;
      const isAutomatedPattern = data.isAutomatedPattern || false;
      return isKnownCompromised && isAutomatedPattern;
    });

    // Abnormal data access detection rule
    this.detectionRules.set('DATA-001', (data: any) => {
      const accessVolume = data.accessVolume || 0;
      const normalVolume = data.normalVolume || 100;
      const deviationThreshold = 3; // 3x normal volume
      return accessVolume > (normalVolume * deviationThreshold);
    });

    // Data exfiltration detection rule
    this.detectionRules.set('DATA-002', (data: any) => {
      const downloadSize = data.downloadSizeMB || 0;
      const sensitivityLevel = data.sensitivityLevel || 'low';
      const threshold = sensitivityLevel === 'high' ? 100 : 500; // MB
      return downloadSize > threshold;
    });

    // PII exposure detection rule
    this.detectionRules.set('PRIV-001', (data: any) => {
      return data.piiInLogs || data.unencryptedPII || data.accessWithoutConsent;
    });

    // Consent violation detection rule
    this.detectionRules.set('PRIV-002', (data: any) => {
      return data.processingWithoutConsent || data.consentWithdrawn || data.purposeLimitationViolation;
    });

    // System anomaly detection rule
    this.detectionRules.set('SYS-001', (data: any) => {
      const cpuUsage = data.cpuUsagePercent || 0;
      const memoryUsage = data.memoryUsagePercent || 0;
      const errorRate = data.errorRatePercent || 0;
      return cpuUsage > 90 || memoryUsage > 95 || errorRate > 5;
    });

    // DDoS detection rule
    this.detectionRules.set('SYS-002', (data: any) => {
      const requestRate = data.requestsPerSecond || 0;
      const normalRate = data.normalRequestsPerSecond || 100;
      const responseTimeDegradation = data.responseTimeDegradationPercent || 0;
      return requestRate > (normalRate * 10) && responseTimeDegradation > 200;
    });
  }

  async analyzeEvent(eventData: any): Promise<ThreatEvent[]> {
    const detectedThreats: ThreatEvent[] = [];

    for (const [patternId, pattern] of this.threatPatterns.entries()) {
      if (!pattern.enabled) continue;

      const detectionRule = this.detectionRules.get(patternId);
      if (!detectionRule) continue;

      try {
        const isMatch = detectionRule(eventData);
        if (isMatch) {
          const threatEvent = await this.createThreatEvent(pattern, eventData);
          detectedThreats.push(threatEvent);
          await this.processThreatEvent(threatEvent);
        }
      } catch (error) {
        this.logger.error('Error in threat detection rule', { 
          patternId, 
          error: error.message 
        });
      }
    }

    return detectedThreats;
  }

  private async createThreatEvent(pattern: ThreatPattern, eventData: any): Promise<ThreatEvent> {
    const threatEvent: ThreatEvent = {
      id: `THREAT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      patternId: pattern.id,
      severity: pattern.severity,
      source: eventData.source || 'unknown',
      description: `${pattern.name}: ${pattern.description}`,
      detectedAt: new Date(),
      indicators: this.extractIndicators(pattern, eventData),
      status: 'active',
      mitigationActions: []
    };

    this.activeThreatEvents.set(threatEvent.id, threatEvent);
    return threatEvent;
  }

  private extractIndicators(pattern: ThreatPattern, eventData: any): Record<string, any> {
    const indicators: Record<string, any> = {};
    
    for (const indicator of pattern.indicators) {
      if (eventData[indicator] !== undefined) {
        indicators[indicator] = eventData[indicator];
      }
    }

    return indicators;
  }

  private async processThreatEvent(threatEvent: ThreatEvent): Promise<void> {
    this.logger.warn('Threat detected', {
      threatId: threatEvent.id,
      patternId: threatEvent.patternId,
      severity: threatEvent.severity,
      source: threatEvent.source,
      indicators: threatEvent.indicators
    });

    this.metrics.recordMetric('threats_detected_total', 1, [
      'severity', threatEvent.severity,
      'pattern', threatEvent.patternId
    ]);

    // Auto-mitigation for critical threats
    if (threatEvent.severity === 'critical') {
      await this.autoMitigate(threatEvent);
    }

    // Privacy-specific threat handling
    if (threatEvent.patternId.startsWith('PRIV-')) {
      await this.handlePrivacyThreat(threatEvent);
    }
  }

  private async autoMitigate(threatEvent: ThreatEvent): Promise<void> {
    const pattern = this.threatPatterns.get(threatEvent.patternId);
    if (!pattern) return;

    const mitigationActions: string[] = [];

    for (const step of pattern.mitigationSteps) {
      try {
        await this.executeMitigationStep(step, threatEvent);
        mitigationActions.push(`Executed: ${step}`);
      } catch (error) {
        this.logger.error('Mitigation step failed', { 
          step, 
          threatId: threatEvent.id, 
          error: error.message 
        });
        mitigationActions.push(`Failed: ${step} - ${error.message}`);
      }
    }

    threatEvent.mitigationActions = mitigationActions;
    threatEvent.status = 'mitigated';
    threatEvent.resolvedAt = new Date();

    this.logger.info('Threat auto-mitigated', { 
      threatId: threatEvent.id, 
      actions: mitigationActions 
    });
  }

  private async executeMitigationStep(step: string, threatEvent: ThreatEvent): Promise<void> {
    // Simplified mitigation execution - in production, this would integrate with security systems
    switch (step.toLowerCase()) {
      case 'block ip address':
        await this.blockIpAddress(threatEvent.indicators.source_ip);
        break;
      case 'force password reset':
        await this.forcePasswordReset(threatEvent.indicators.username);
        break;
      case 'remove pii from logs':
        await this.sanitizeLogs(threatEvent.indicators);
        break;
      case 'stop data processing':
        await this.stopDataProcessing(threatEvent.indicators.userId);
        break;
      default:
        this.logger.info('Mitigation step logged', { step, threatId: threatEvent.id });
    }
  }

  private async blockIpAddress(ipAddress: string): Promise<void> {
    // In production, this would integrate with firewall/WAF
    this.logger.info('IP address blocked', { ipAddress });
  }

  private async forcePasswordReset(username: string): Promise<void> {
    // In production, this would integrate with authentication system
    this.logger.info('Password reset forced', { username });
  }

  private async sanitizeLogs(indicators: Record<string, any>): Promise<void> {
    // In production, this would clean logs of PII
    this.logger.info('Log sanitization triggered', { indicators });
  }

  private async stopDataProcessing(userId: string): Promise<void> {
    // In production, this would halt data processing for the user
    this.logger.info('Data processing stopped', { userId });
  }

  private async handlePrivacyThreat(threatEvent: ThreatEvent): Promise<void> {
    // Notify privacy team
    await this.privacyMonitor.recordPrivacyEvent({
      type: 'threat_detected',
      severity: threatEvent.severity,
      description: threatEvent.description,
      userId: threatEvent.indicators.userId,
      timestamp: threatEvent.detectedAt
    });

    this.logger.warn('Privacy threat detected', { 
      threatId: threatEvent.id,
      patternId: threatEvent.patternId 
    });
  }

  async getSecurityMetrics(): Promise<SecurityMetrics> {
    const activeThreats = Array.from(this.activeThreatEvents.values());
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentThreats = activeThreats.filter(t => t.detectedAt > last24Hours);

    const threatsByCategory: Record<string, number> = {};
    for (const threat of recentThreats) {
      const category = threat.patternId.split('-')[0];
      threatsByCategory[category] = (threatsByCategory[category] || 0) + 1;
    }

    const mitigatedThreats = recentThreats.filter(t => t.status === 'mitigated');
    const falsePositives = recentThreats.filter(t => t.status === 'false-positive');

    return {
      threatsDetected: recentThreats.length,
      criticalThreats: recentThreats.filter(t => t.severity === 'critical').length,
      averageResponseTime: this.calculateAverageResponseTime(mitigatedThreats),
      falsePositiveRate: recentThreats.length > 0 ? (falsePositives.length / recentThreats.length) * 100 : 0,
      threatsByCategory,
      mitigationSuccess: recentThreats.length > 0 ? (mitigatedThreats.length / recentThreats.length) * 100 : 100
    };
  }

  private calculateAverageResponseTime(mitigatedThreats: ThreatEvent[]): number {
    if (mitigatedThreats.length === 0) return 0;

    const totalResponseTime = mitigatedThreats.reduce((sum, threat) => {
      if (threat.resolvedAt) {
        return sum + (threat.resolvedAt.getTime() - threat.detectedAt.getTime());
      }
      return sum;
    }, 0);

    return totalResponseTime / mitigatedThreats.length / 1000; // Convert to seconds
  }

  async getActiveThreats(): Promise<ThreatEvent[]> {
    return Array.from(this.activeThreatEvents.values())
      .filter(threat => threat.status === 'active')
      .sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
  }

  async markThreatAsFalsePositive(threatId: string, reason: string): Promise<void> {
    const threat = this.activeThreatEvents.get(threatId);
    if (!threat) return;

    threat.status = 'false-positive';
    threat.resolvedAt = new Date();
    threat.mitigationActions.push(`Marked as false positive: ${reason}`);

    this.logger.info('Threat marked as false positive', { threatId, reason });
  }

  async updateThreatPattern(patternId: string, updates: Partial<ThreatPattern>): Promise<void> {
    const pattern = this.threatPatterns.get(patternId);
    if (!pattern) return;

    Object.assign(pattern, updates);
    this.logger.info('Threat pattern updated', { patternId, updates });
  }
}