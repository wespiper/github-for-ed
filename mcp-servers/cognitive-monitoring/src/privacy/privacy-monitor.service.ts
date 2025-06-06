import { Injectable, Logger } from '@nestjs/common';
import { PrivacyViolation, PrivacyContext } from './privacy.types';
import { PRIVACY_CONFIG } from './privacy.config';

@Injectable()
export class PrivacyMonitorService {
  private readonly logger = new Logger(PrivacyMonitorService.name);
  private readonly violations: PrivacyViolation[] = [];
  private readonly complianceMetrics = {
    totalChecks: 0,
    violations: 0,
    complianceScore: 1.0,
    lastUpdate: new Date()
  };

  async detectViolations(
    operation: string,
    data: any,
    privacyContext: PrivacyContext
  ): Promise<PrivacyViolation[]> {
    const violations: PrivacyViolation[] = [];
    this.complianceMetrics.totalChecks++;

    try {
      // Check for PII exposure
      const piiViolations = await this.checkPIIExposure(data, privacyContext);
      violations.push(...piiViolations);

      // Check consent requirements
      const consentViolations = await this.checkConsentCompliance(operation, privacyContext);
      violations.push(...consentViolations);

      // Check purpose limitation
      const purposeViolations = await this.checkPurposeLimitation(operation, privacyContext);
      violations.push(...purposeViolations);

      // Check data retention limits
      const retentionViolations = await this.checkRetentionCompliance(data, privacyContext);
      violations.push(...retentionViolations);

      // Check k-anonymity requirements
      const anonymityViolations = await this.checkKAnonymity(data);
      violations.push(...anonymityViolations);

      // Update compliance metrics
      this.updateComplianceMetrics(violations.length);

      // Log violations for immediate response
      if (violations.length > 0) {
        await this.logViolations(violations, operation, privacyContext);
      }

      return violations;

    } catch (error) {
      this.logger.error('Error in privacy violation detection:', error);
      
      // Create system violation for monitoring failure
      const systemViolation: PrivacyViolation = {
        violationType: 'pii_exposure',
        severity: 'high',
        timestamp: new Date(),
        context: `Privacy monitoring failed for operation: ${operation}`,
        remediation: ['Immediate system review required', 'Fallback to maximum privacy protection']
      };

      return [systemViolation];
    }
  }

  async checkPIIExposure(data: any, context: PrivacyContext): Promise<PrivacyViolation[]> {
    const violations: PrivacyViolation[] = [];

    // Check for direct student ID exposure (should always be hashed)
    if (this.containsRawStudentId(data)) {
      violations.push({
        violationType: 'pii_exposure',
        severity: 'critical',
        timestamp: new Date(),
        context: 'Raw student ID detected in data stream',
        remediation: [
          'Immediately hash all student identifiers',
          'Review data processing pipeline',
          'Notify privacy officer'
        ]
      });
    }

    // Check for personal information in cognitive events
    if (this.containsPersonalInfo(data)) {
      violations.push({
        violationType: 'pii_exposure',
        severity: 'high',
        timestamp: new Date(),
        context: 'Personal information detected in cognitive monitoring data',
        remediation: [
          'Remove personal information from data stream',
          'Implement stronger anonymization',
          'Review content filtering'
        ]
      });
    }

    // Check for behavioral fingerprinting potential
    if (this.enablesBehavioralFingerprinting(data)) {
      violations.push({
        violationType: 'pii_exposure',
        severity: 'medium',
        timestamp: new Date(),
        context: 'Data granularity may enable behavioral fingerprinting',
        remediation: [
          'Increase data aggregation level',
          'Add differential privacy noise',
          'Reduce tracking granularity'
        ]
      });
    }

    return violations;
  }

  async checkConsentCompliance(operation: string, context: PrivacyContext): Promise<PrivacyViolation[]> {
    const violations: PrivacyViolation[] = [];

    // Check if operation requires consent not provided
    const requiredConsent = this.getRequiredConsentLevel(operation);
    
    if (this.isConsentInsufficient(context.consentLevel, requiredConsent)) {
      violations.push({
        violationType: 'consent_missing',
        severity: 'high',
        timestamp: new Date(),
        context: `Operation ${operation} requires ${requiredConsent} consent, but only ${context.consentLevel} provided`,
        remediation: [
          'Block operation until proper consent obtained',
          'Redirect to consent management interface',
          'Provide clear explanation of data use'
        ]
      });
    }

    // Check for expired consent
    if (this.isConsentExpired(context)) {
      violations.push({
        violationType: 'consent_missing',
        severity: 'medium',
        timestamp: new Date(),
        context: 'User consent may have expired or requires renewal',
        remediation: [
          'Request consent renewal',
          'Limit operations to essential functions only',
          'Provide easy consent update mechanism'
        ]
      });
    }

    return violations;
  }

  async checkPurposeLimitation(operation: string, context: PrivacyContext): Promise<PrivacyViolation[]> {
    const violations: PrivacyViolation[] = [];

    // Check if operation aligns with stated purpose
    const operationPurpose = this.inferOperationPurpose(operation);
    
    if (operationPurpose !== context.purpose) {
      violations.push({
        violationType: 'purpose_mismatch',
        severity: 'medium',
        timestamp: new Date(),
        context: `Operation ${operation} (${operationPurpose}) doesn't match declared purpose ${context.purpose}`,
        remediation: [
          'Align operation with declared purpose',
          'Update consent for additional purposes',
          'Review operational scope'
        ]
      });
    }

    // Check for scope creep
    if (this.detectsScopeCreep(operation, context)) {
      violations.push({
        violationType: 'purpose_mismatch',
        severity: 'low',
        timestamp: new Date(),
        context: 'Operation may exceed original scope of consent',
        remediation: [
          'Review operational boundaries',
          'Seek explicit consent for expanded scope',
          'Document purpose evolution'
        ]
      });
    }

    return violations;
  }

  async checkRetentionCompliance(data: any, context: PrivacyContext): Promise<PrivacyViolation[]> {
    const violations: PrivacyViolation[] = [];

    // Check for data retention beyond policy
    const dataAge = this.calculateDataAge(data);
    const maxRetention = PRIVACY_CONFIG.maxRetentionHours * 60 * 60 * 1000;

    if (dataAge > maxRetention) {
      violations.push({
        violationType: 'retention_exceeded',
        severity: 'medium',
        timestamp: new Date(),
        context: `Data age (${Math.round(dataAge / 3600000)}h) exceeds retention limit (${PRIVACY_CONFIG.maxRetentionHours}h)`,
        remediation: [
          'Immediately purge expired data',
          'Review data lifecycle management',
          'Implement automated cleanup'
        ]
      });
    }

    // Check for persistent storage of ephemeral data
    if (this.detectsPersistentStorage(data)) {
      violations.push({
        violationType: 'retention_exceeded',
        severity: 'high',
        timestamp: new Date(),
        context: 'Ephemeral data found in persistent storage',
        remediation: [
          'Remove data from persistent storage',
          'Review storage architecture',
          'Implement proper data classification'
        ]
      });
    }

    return violations;
  }

  async checkKAnonymity(data: any): Promise<PrivacyViolation[]> {
    const violations: PrivacyViolation[] = [];

    // Check if patterns have sufficient k-anonymity
    const cohortSize = this.extractCohortSize(data);
    
    if (cohortSize > 0 && cohortSize < PRIVACY_CONFIG.minCohortSize) {
      violations.push({
        violationType: 'pii_exposure',
        severity: 'medium',
        timestamp: new Date(),
        context: `Cohort size (${cohortSize}) below k-anonymity threshold (${PRIVACY_CONFIG.minCohortSize})`,
        remediation: [
          'Increase cohort size before analysis',
          'Aggregate with similar patterns',
          'Delay analysis until sufficient data'
        ]
      });
    }

    return violations;
  }

  private containsRawStudentId(data: any): boolean {
    // Check for patterns that look like raw student IDs
    const dataStr = JSON.stringify(data).toLowerCase();
    
    // Look for common student ID patterns
    const studentIdPatterns = [
      /student[_-]?id/,
      /user[_-]?id.*[0-9]/,
      /^\d{6,}$/, // Numeric IDs
      /^[a-z]+\d+$/ // Alphanumeric IDs
    ];

    return studentIdPatterns.some(pattern => pattern.test(dataStr));
  }

  private containsPersonalInfo(data: any): boolean {
    const dataStr = JSON.stringify(data).toLowerCase();
    
    // Check for common PII indicators
    const piiPatterns = [
      /name\s*[:=]\s*[a-z]/,
      /email\s*[:=]/,
      /phone\s*[:=]/,
      /@[a-z]+\.[a-z]/,
      /\b[a-z]+\s+[a-z]+@/ // Name followed by email
    ];

    return piiPatterns.some(pattern => pattern.test(dataStr));
  }

  private enablesBehavioralFingerprinting(data: any): boolean {
    // Check if data granularity could enable fingerprinting
    const hasHighGranularityTimestamps = this.hasHighGranularityTimestamps(data);
    const hasUniquePatterns = this.hasUniquePatterns(data);
    const hasDetailedBehaviors = this.hasDetailedBehaviors(data);

    return hasHighGranularityTimestamps && (hasUniquePatterns || hasDetailedBehaviors);
  }

  private getRequiredConsentLevel(operation: string): string {
    const consentMapping = {
      'cognitive_assessment': 'standard',
      'behavioral_analytics': 'enhanced',
      'intervention': 'basic',
      'monitoring': 'standard',
      'analytics': 'enhanced'
    };

    return consentMapping[operation] || 'basic';
  }

  private isConsentInsufficient(provided: string, required: string): boolean {
    const levels = ['none', 'basic', 'standard', 'enhanced'];
    const providedLevel = levels.indexOf(provided);
    const requiredLevel = levels.indexOf(required);

    return providedLevel < requiredLevel;
  }

  private isConsentExpired(context: PrivacyContext): boolean {
    // Check if consent timestamp is older than allowed
    const consentAge = Date.now() - context.timestamp.getTime();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

    return consentAge > maxAge;
  }

  private inferOperationPurpose(operation: string): string {
    if (operation.includes('cognitive')) return 'cognitive_assessment';
    if (operation.includes('analytics')) return 'analytics';
    if (operation.includes('intervention')) return 'intervention';
    if (operation.includes('monitor')) return 'monitoring';
    
    return 'unknown';
  }

  private detectsScopeCreep(operation: string, context: PrivacyContext): boolean {
    // Simple scope creep detection
    const operationScope = this.inferOperationPurpose(operation);
    const declaredScope = context.purpose;

    // Check for operations that might exceed declared scope
    if (declaredScope === 'monitoring' && operationScope === 'analytics') {
      return true;
    }

    return false;
  }

  private calculateDataAge(data: any): number {
    const now = Date.now();
    let oldestTimestamp = now;

    // Find oldest timestamp in data
    this.findTimestamps(data).forEach(timestamp => {
      if (timestamp < oldestTimestamp) {
        oldestTimestamp = timestamp;
      }
    });

    return now - oldestTimestamp;
  }

  private findTimestamps(obj: any, timestamps: number[] = []): number[] {
    if (typeof obj === 'number' && obj > 1000000000000 && obj < 9999999999999) {
      timestamps.push(obj);
    } else if (typeof obj === 'object' && obj !== null) {
      Object.values(obj).forEach(value => this.findTimestamps(value, timestamps));
    }

    return timestamps;
  }

  private detectsPersistentStorage(data: any): boolean {
    // Check for indicators of persistent storage
    const dataStr = JSON.stringify(data).toLowerCase();
    const persistentIndicators = [
      'database',
      'persist',
      'store',
      'save',
      'file',
      'disk'
    ];

    return persistentIndicators.some(indicator => dataStr.includes(indicator));
  }

  private extractCohortSize(data: any): number {
    // Extract cohort size from various data structures
    if (data.cohortSize) return data.cohortSize;
    if (data.metadata?.cohortSize) return data.metadata.cohortSize;
    if (data.patterns?.length) return data.patterns.length;
    
    return 0;
  }

  private hasHighGranularityTimestamps(data: any): boolean {
    const timestamps = this.findTimestamps(data);
    
    if (timestamps.length < 2) return false;

    // Check if timestamps are very precise (millisecond level)
    const intervals: number[] = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i-1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    return avgInterval < 1000; // Less than 1 second average
  }

  private hasUniquePatterns(data: any): boolean {
    // Check for patterns that could be unique to an individual
    const dataStr = JSON.stringify(data);
    const uniqueIndicators = [
      'unique',
      'individual',
      'personal',
      'signature',
      'fingerprint'
    ];

    return uniqueIndicators.some(indicator => dataStr.toLowerCase().includes(indicator));
  }

  private hasDetailedBehaviors(data: any): boolean {
    // Check for very detailed behavioral data
    const behaviorTypes = ['keystroke', 'mouse', 'scroll', 'focus', 'blur'];
    const dataStr = JSON.stringify(data).toLowerCase();

    const detectedBehaviors = behaviorTypes.filter(type => dataStr.includes(type));
    return detectedBehaviors.length >= 3; // Multiple behavior types = detailed
  }

  private updateComplianceMetrics(violationCount: number): void {
    this.complianceMetrics.violations += violationCount;
    this.complianceMetrics.complianceScore = 
      1 - (this.complianceMetrics.violations / this.complianceMetrics.totalChecks);
    this.complianceMetrics.lastUpdate = new Date();
  }

  private async logViolations(
    violations: PrivacyViolation[],
    operation: string,
    context: PrivacyContext
  ): Promise<void> {
    for (const violation of violations) {
      this.violations.push(violation);
      
      this.logger.warn(`Privacy violation detected: ${violation.violationType} (${violation.severity}) in ${operation}`);
      
      // Immediate remediation for critical violations
      if (violation.severity === 'critical') {
        await this.handleCriticalViolation(violation, operation, context);
      }
    }

    // Keep only recent violations in memory
    if (this.violations.length > 1000) {
      this.violations.splice(0, 100);
    }
  }

  private async handleCriticalViolation(
    violation: PrivacyViolation,
    operation: string,
    context: PrivacyContext
  ): Promise<void> {
    this.logger.error(`CRITICAL PRIVACY VIOLATION: ${violation.context}`);
    
    // Implement immediate safeguards
    // In production, this would trigger alerts, stop processing, etc.
    
    // Log for compliance audit
    this.logger.error(`Remediation required: ${violation.remediation.join('; ')}`);
  }

  // Public method for compliance reporting
  getComplianceMetrics(): any {
    return {
      ...this.complianceMetrics,
      recentViolations: this.violations.slice(-10),
      violationsByType: this.aggregateViolationsByType(),
      violationsBySeverity: this.aggregateViolationsBySeverity()
    };
  }

  private aggregateViolationsByType(): Record<string, number> {
    const counts: Record<string, number> = {};
    
    this.violations.forEach(violation => {
      counts[violation.violationType] = (counts[violation.violationType] || 0) + 1;
    });

    return counts;
  }

  private aggregateViolationsBySeverity(): Record<string, number> {
    const counts: Record<string, number> = {};
    
    this.violations.forEach(violation => {
      counts[violation.severity] = (counts[violation.severity] || 0) + 1;
    });

    return counts;
  }
}