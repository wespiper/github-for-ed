import { Injectable } from '@nestjs/common';
import { Logger } from '../monitoring/Logger';
import { MetricsCollector } from '../monitoring/MetricsCollector';
import { PrivacyMonitor } from '../monitoring/PrivacyMonitor';

export interface PrivacyCompliantBackup {
  id: string;
  tenantId: string;
  backupType: 'full' | 'incremental' | 'differential';
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
  encryptionMethod: 'aes-256-gcm' | 'chacha20-poly1305' | 'rsa-4096';
  keyManagement: 'tenant-managed' | 'platform-managed' | 'hsm-managed';
  compressionEnabled: boolean;
  anonymizationApplied: boolean;
  retentionPolicy: RetentionPolicy;
  geographicRestrictions: string[];
  privacyControls: PrivacyControl[];
  createdAt: Date;
  verifiedAt?: Date;
  restoredAt?: Date;
  status: 'created' | 'verified' | 'corrupted' | 'expired' | 'restored';
}

export interface RetentionPolicy {
  retentionPeriodDays: number;
  automaticDeletion: boolean;
  legalHoldExempt: boolean;
  dataMinimizationRules: string[];
  complianceRequirements: string[];
}

export interface PrivacyControl {
  type: 'encryption' | 'anonymization' | 'pseudonymization' | 'access_control' | 'audit_logging';
  applied: boolean;
  method: string;
  verification: string;
  complianceFramework: string[];
}

export interface PrivacyAwareRestoreRequest {
  backupId: string;
  requestedBy: string;
  requestedAt: Date;
  justification: string;
  dataScope: 'full' | 'partial' | 'anonymized';
  targetEnvironment: 'production' | 'staging' | 'development' | 'testing';
  privacyApprovals: PrivacyApproval[];
  complianceValidation: ComplianceValidation;
  accessControls: RestoreAccessControl[];
}

export interface PrivacyApproval {
  approverRole: 'dpo' | 'legal' | 'security' | 'tenant_admin';
  approverName: string;
  approvedAt: Date;
  conditions: string[];
  expiresAt?: Date;
}

export interface ComplianceValidation {
  gdprCompliant: boolean;
  ferpaCompliant: boolean;
  ccpaCompliant: boolean;
  validatedBy: string;
  validatedAt: Date;
  conditions: string[];
  riskAssessment: 'low' | 'medium' | 'high';
}

export interface RestoreAccessControl {
  principalType: 'user' | 'service' | 'application';
  principalId: string;
  permissions: string[];
  restrictions: string[];
  auditRequired: boolean;
  sessionTimeout: number;
}

export interface PrivacyBreachAssessment {
  id: string;
  triggerEvent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  dataTypesAffected: string[];
  subjectsAffected: number;
  geographicScope: string[];
  potentialImpact: string;
  mitigationSteps: string[];
  notificationRequired: boolean;
  reportingDeadline?: Date;
  assessedBy: string;
  assessedAt: Date;
}

export interface GeographicDataControl {
  region: string;
  dataResidencyRequired: boolean;
  crossBorderTransferAllowed: boolean;
  adequacyDecision: boolean;
  safeguardMechanisms: string[];
  localEncryptionRequired: boolean;
  localKeyManagement: boolean;
}

@Injectable()
export class PrivacyCompliantDisasterRecoveryService {
  private readonly logger = new Logger('PrivacyCompliantDisasterRecoveryService');
  private readonly metrics = new MetricsCollector();
  private readonly privacyMonitor = new PrivacyMonitor();

  private privacyBackups: Map<string, PrivacyCompliantBackup> = new Map();
  private restoreRequests: Map<string, PrivacyAwareRestoreRequest> = new Map();
  private breachAssessments: Map<string, PrivacyBreachAssessment> = new Map();
  private geographicControls: Map<string, GeographicDataControl> = new Map();

  constructor() {
    this.initializeGeographicControls();
    this.startPrivacyCompliantBackupMonitoring();
  }

  private initializeGeographicControls(): void {
    // US controls
    this.geographicControls.set('us', {
      region: 'United States',
      dataResidencyRequired: false,
      crossBorderTransferAllowed: true,
      adequacyDecision: false,
      safeguardMechanisms: ['contractual_clauses', 'certification_mechanisms'],
      localEncryptionRequired: true,
      localKeyManagement: false
    });

    // EU controls (GDPR)
    this.geographicControls.set('eu', {
      region: 'European Union',
      dataResidencyRequired: true,
      crossBorderTransferAllowed: false,
      adequacyDecision: true,
      safeguardMechanisms: ['adequacy_decision', 'bcr', 'standard_contractual_clauses'],
      localEncryptionRequired: true,
      localKeyManagement: true
    });

    // Canada controls (PIPEDA)
    this.geographicControls.set('ca', {
      region: 'Canada',
      dataResidencyRequired: true,
      crossBorderTransferAllowed: true,
      adequacyDecision: true,
      safeguardMechanisms: ['adequacy_decision', 'privacy_policies'],
      localEncryptionRequired: true,
      localKeyManagement: false
    });

    this.logger.info('Geographic data controls initialized', { 
      regionCount: this.geographicControls.size 
    });
  }

  private startPrivacyCompliantBackupMonitoring(): void {
    // Monitor backup compliance every hour
    setInterval(() => {
      this.monitorBackupCompliance();
    }, 60 * 60 * 1000);

    // Check retention policies every 6 hours
    setInterval(() => {
      this.enforceRetentionPolicies();
    }, 6 * 60 * 60 * 1000);

    this.logger.info('Privacy-compliant backup monitoring started');
  }

  async createPrivacyCompliantBackup(
    tenantId: string,
    dataClassification: 'public' | 'internal' | 'confidential' | 'restricted',
    geographicRegion: string
  ): Promise<PrivacyCompliantBackup> {
    const backupId = `backup-${tenantId}-${Date.now()}`;
    
    // Get geographic controls
    const geoControls = this.geographicControls.get(geographicRegion);
    if (!geoControls) {
      throw new Error(`Unsupported geographic region: ${geographicRegion}`);
    }

    // Determine privacy controls based on data classification and region
    const privacyControls = this.determinePrivacyControls(dataClassification, geoControls);

    const backup: PrivacyCompliantBackup = {
      id: backupId,
      tenantId,
      backupType: 'full',
      dataClassification,
      encryptionMethod: this.selectEncryptionMethod(dataClassification, geoControls),
      keyManagement: this.selectKeyManagement(dataClassification, geoControls),
      compressionEnabled: true,
      anonymizationApplied: dataClassification === 'restricted',
      retentionPolicy: this.createRetentionPolicy(dataClassification, geographicRegion),
      geographicRestrictions: this.getGeographicRestrictions(geoControls),
      privacyControls,
      createdAt: new Date(),
      status: 'created'
    };

    // Validate compliance before proceeding
    await this.validateBackupCompliance(backup);

    // Create the backup with privacy controls
    await this.executePrivacyCompliantBackup(backup);

    this.privacyBackups.set(backupId, backup);

    this.logger.info('Privacy-compliant backup created', {
      backupId,
      tenantId,
      dataClassification,
      region: geographicRegion,
      encryptionMethod: backup.encryptionMethod
    });

    this.metrics.recordMetric('privacy_compliant_backups_total', 1, [
      'tenant_id', tenantId,
      'classification', dataClassification,
      'region', geographicRegion
    ]);

    return backup;
  }

  private determinePrivacyControls(
    classification: string, 
    geoControls: GeographicDataControl
  ): PrivacyControl[] {
    const controls: PrivacyControl[] = [];

    // Encryption control (always required)
    controls.push({
      type: 'encryption',
      applied: true,
      method: geoControls.localEncryptionRequired ? 'aes-256-gcm' : 'aes-256-cbc',
      verification: 'cryptographic_hash',
      complianceFramework: ['GDPR', 'CCPA', 'FERPA']
    });

    // Anonymization for restricted data
    if (classification === 'restricted') {
      controls.push({
        type: 'anonymization',
        applied: true,
        method: 'k-anonymity',
        verification: 'statistical_disclosure_control',
        complianceFramework: ['GDPR', 'CCPA']
      });
    }

    // Pseudonymization for confidential data
    if (classification === 'confidential' || classification === 'restricted') {
      controls.push({
        type: 'pseudonymization',
        applied: true,
        method: 'hmac_sha256',
        verification: 'reversibility_test',
        complianceFramework: ['GDPR']
      });
    }

    // Access control (always required)
    controls.push({
      type: 'access_control',
      applied: true,
      method: 'rbac_with_mfa',
      verification: 'access_audit',
      complianceFramework: ['GDPR', 'CCPA', 'FERPA', 'SOC2']
    });

    // Audit logging (always required)
    controls.push({
      type: 'audit_logging',
      applied: true,
      method: 'immutable_audit_trail',
      verification: 'log_integrity_check',
      complianceFramework: ['GDPR', 'CCPA', 'FERPA', 'SOC2']
    });

    return controls;
  }

  private selectEncryptionMethod(
    classification: string, 
    geoControls: GeographicDataControl
  ): 'aes-256-gcm' | 'chacha20-poly1305' | 'rsa-4096' {
    if (classification === 'restricted') {
      return 'chacha20-poly1305'; // Highest security
    }
    
    if (geoControls.localEncryptionRequired) {
      return 'aes-256-gcm'; // Strong encryption with authentication
    }

    return 'aes-256-gcm'; // Default strong encryption
  }

  private selectKeyManagement(
    classification: string, 
    geoControls: GeographicDataControl
  ): 'tenant-managed' | 'platform-managed' | 'hsm-managed' {
    if (classification === 'restricted' || geoControls.localKeyManagement) {
      return 'hsm-managed'; // Hardware security module for highest security
    }
    
    if (classification === 'confidential') {
      return 'tenant-managed'; // Give tenants control over their keys
    }

    return 'platform-managed'; // Managed by platform for convenience
  }

  private createRetentionPolicy(
    classification: string, 
    region: string
  ): RetentionPolicy {
    const baseRetention = {
      public: 30,
      internal: 90,
      confidential: 365,
      restricted: 2555 // 7 years for educational data
    };

    let retentionDays = baseRetention[classification as keyof typeof baseRetention] || 30;

    // Regional adjustments
    if (region === 'eu') {
      // GDPR storage limitation principle
      retentionDays = Math.min(retentionDays, 1095); // Max 3 years unless legally required
    }

    return {
      retentionPeriodDays: retentionDays,
      automaticDeletion: true,
      legalHoldExempt: classification !== 'restricted',
      dataMinimizationRules: [
        'remove_inactive_accounts',
        'anonymize_completed_courses',
        'pseudonymize_historical_data'
      ],
      complianceRequirements: this.getComplianceRequirements(region)
    };
  }

  private getComplianceRequirements(region: string): string[] {
    const requirements: Record<string, string[]> = {
      us: ['FERPA', 'CCPA'],
      eu: ['GDPR', 'ePrivacy'],
      ca: ['PIPEDA', 'FIPPA']
    };

    return requirements[region] || ['FERPA'];
  }

  private getGeographicRestrictions(geoControls: GeographicDataControl): string[] {
    const restrictions: string[] = [];

    if (geoControls.dataResidencyRequired) {
      restrictions.push(`data_must_remain_in_${geoControls.region.toLowerCase().replace(/\s+/g, '_')}`);
    }

    if (!geoControls.crossBorderTransferAllowed) {
      restrictions.push('cross_border_transfer_prohibited');
    }

    if (geoControls.localKeyManagement) {
      restrictions.push('encryption_keys_must_be_local');
    }

    return restrictions;
  }

  private async validateBackupCompliance(backup: PrivacyCompliantBackup): Promise<void> {
    // Validate all required privacy controls are in place
    const requiredControlTypes = ['encryption', 'access_control', 'audit_logging'];
    const appliedControls = backup.privacyControls.filter(c => c.applied).map(c => c.type);

    for (const required of requiredControlTypes) {
      if (!appliedControls.includes(required as any)) {
        throw new Error(`Required privacy control missing: ${required}`);
      }
    }

    // Validate geographic restrictions
    for (const restriction of backup.geographicRestrictions) {
      if (restriction === 'cross_border_transfer_prohibited') {
        // Ensure backup location complies with restriction
        // This would integrate with storage service to validate location
      }
    }

    // Validate retention policy compliance
    if (backup.retentionPolicy.retentionPeriodDays > 3650) { // 10 years
      this.logger.warn('Long retention period detected', {
        backupId: backup.id,
        retentionDays: backup.retentionPolicy.retentionPeriodDays
      });
    }

    this.logger.debug('Backup compliance validated', { backupId: backup.id });
  }

  private async executePrivacyCompliantBackup(backup: PrivacyCompliantBackup): Promise<void> {
    // Simulate backup execution with privacy controls
    const startTime = Date.now();

    try {
      // Apply anonymization if required
      if (backup.anonymizationApplied) {
        await this.applyAnonymization(backup);
      }

      // Apply encryption
      await this.applyEncryption(backup);

      // Verify backup integrity
      await this.verifyBackupIntegrity(backup);

      backup.status = 'verified';
      backup.verifiedAt = new Date();

      const executionTime = Date.now() - startTime;
      this.metrics.recordMetric('backup_execution_time_ms', executionTime, [
        'tenant_id', backup.tenantId,
        'classification', backup.dataClassification
      ]);

    } catch (error) {
      backup.status = 'corrupted';
      this.logger.error('Privacy-compliant backup failed', {
        backupId: backup.id,
        error: error.message
      });
      throw error;
    }
  }

  private async applyAnonymization(backup: PrivacyCompliantBackup): Promise<void> {
    // Simulate anonymization process
    this.logger.debug('Applying anonymization', { backupId: backup.id });
    
    // Record anonymization metrics
    this.metrics.recordMetric('backup_anonymization_applied_total', 1, [
      'tenant_id', backup.tenantId
    ]);
  }

  private async applyEncryption(backup: PrivacyCompliantBackup): Promise<void> {
    // Simulate encryption process
    this.logger.debug('Applying encryption', { 
      backupId: backup.id, 
      method: backup.encryptionMethod 
    });

    // Record encryption metrics
    this.metrics.recordMetric('backup_encryption_applied_total', 1, [
      'tenant_id', backup.tenantId,
      'method', backup.encryptionMethod
    ]);
  }

  private async verifyBackupIntegrity(backup: PrivacyCompliantBackup): Promise<void> {
    // Simulate integrity verification
    this.logger.debug('Verifying backup integrity', { backupId: backup.id });

    // Simulate occasional verification failure for testing
    if (Math.random() < 0.02) { // 2% failure rate
      throw new Error('Backup integrity verification failed');
    }
  }

  async requestPrivacyAwareRestore(request: PrivacyAwareRestoreRequest): Promise<string> {
    const requestId = `restore-${Date.now()}`;
    
    // Validate the backup exists and is verified
    const backup = this.privacyBackups.get(request.backupId);
    if (!backup) {
      throw new Error('Backup not found');
    }

    if (backup.status !== 'verified') {
      throw new Error('Backup is not verified and cannot be restored');
    }

    // Validate privacy approvals
    await this.validatePrivacyApprovals(request, backup);

    // Validate compliance
    await this.validateRestoreCompliance(request, backup);

    // Store the request
    this.restoreRequests.set(requestId, request);

    this.logger.info('Privacy-aware restore requested', {
      requestId,
      backupId: request.backupId,
      requestedBy: request.requestedBy,
      dataScope: request.dataScope
    });

    this.metrics.recordMetric('privacy_aware_restore_requests_total', 1, [
      'data_scope', request.dataScope,
      'target_environment', request.targetEnvironment
    ]);

    return requestId;
  }

  private async validatePrivacyApprovals(
    request: PrivacyAwareRestoreRequest, 
    backup: PrivacyCompliantBackup
  ): Promise<void> {
    const requiredApprovers = this.getRequiredApprovers(backup.dataClassification);
    const providedApprovers = request.privacyApprovals.map(a => a.approverRole);

    for (const required of requiredApprovers) {
      if (!providedApprovers.includes(required)) {
        throw new Error(`Missing required approval from: ${required}`);
      }
    }

    // Check approval expiration
    const now = new Date();
    for (const approval of request.privacyApprovals) {
      if (approval.expiresAt && approval.expiresAt < now) {
        throw new Error(`Approval from ${approval.approverRole} has expired`);
      }
    }
  }

  private getRequiredApprovers(classification: string): ('dpo' | 'legal' | 'security' | 'tenant_admin')[] {
    switch (classification) {
      case 'restricted':
        return ['dpo', 'legal', 'security', 'tenant_admin'];
      case 'confidential':
        return ['dpo', 'security', 'tenant_admin'];
      case 'internal':
        return ['security', 'tenant_admin'];
      default:
        return ['tenant_admin'];
    }
  }

  private async validateRestoreCompliance(
    request: PrivacyAwareRestoreRequest, 
    backup: PrivacyCompliantBackup
  ): Promise<void> {
    const validation = request.complianceValidation;

    // Check if target environment is appropriate for data classification
    if (backup.dataClassification === 'restricted' && request.targetEnvironment !== 'production') {
      throw new Error('Restricted data can only be restored to production environment');
    }

    if (backup.dataClassification === 'confidential' && request.targetEnvironment === 'development') {
      throw new Error('Confidential data cannot be restored to development environment');
    }

    // Validate compliance framework requirements
    if (backup.geographicRestrictions.includes('cross_border_transfer_prohibited')) {
      // Ensure target environment is in same region
      // This would integrate with infrastructure service to validate
    }

    this.logger.debug('Restore compliance validated', {
      backupId: backup.id,
      targetEnvironment: request.targetEnvironment,
      riskAssessment: validation.riskAssessment
    });
  }

  async executePrivacyAwareRestore(requestId: string): Promise<void> {
    const request = this.restoreRequests.get(requestId);
    if (!request) {
      throw new Error('Restore request not found');
    }

    const backup = this.privacyBackups.get(request.backupId);
    if (!backup) {
      throw new Error('Backup not found');
    }

    const startTime = Date.now();

    try {
      // Apply data scope restrictions
      await this.applyDataScopeRestrictions(request, backup);

      // Apply access controls
      await this.applyRestoreAccessControls(request);

      // Execute the restore
      await this.performRestore(backup, request);

      // Set up monitoring for restored data
      await this.setupRestoredDataMonitoring(backup, request);

      backup.restoredAt = new Date();

      const restoreTime = Date.now() - startTime;
      this.metrics.recordMetric('privacy_aware_restore_duration_ms', restoreTime, [
        'data_scope', request.dataScope,
        'classification', backup.dataClassification
      ]);

      this.logger.info('Privacy-aware restore completed', {
        requestId,
        backupId: request.backupId,
        restoreTimeMs: restoreTime
      });

    } catch (error) {
      this.logger.error('Privacy-aware restore failed', {
        requestId,
        backupId: request.backupId,
        error: error.message
      });
      throw error;
    }
  }

  private async applyDataScopeRestrictions(
    request: PrivacyAwareRestoreRequest, 
    backup: PrivacyCompliantBackup
  ): Promise<void> {
    switch (request.dataScope) {
      case 'anonymized':
        // Ensure all PII is anonymized in restore
        await this.enforceAnonymization(backup);
        break;
      case 'partial':
        // Restore only specific data subsets
        await this.applyPartialRestoreFilters(request);
        break;
      case 'full':
        // Full restore with all privacy controls maintained
        break;
    }
  }

  private async enforceAnonymization(backup: PrivacyCompliantBackup): Promise<void> {
    this.logger.debug('Enforcing anonymization for restore', { backupId: backup.id });
    // Implementation would anonymize PII before restore
  }

  private async applyPartialRestoreFilters(request: PrivacyAwareRestoreRequest): Promise<void> {
    this.logger.debug('Applying partial restore filters', { requestId: request.backupId });
    // Implementation would filter data based on request parameters
  }

  private async applyRestoreAccessControls(request: PrivacyAwareRestoreRequest): Promise<void> {
    for (const control of request.accessControls) {
      this.logger.debug('Applying restore access control', {
        principalType: control.principalType,
        principalId: control.principalId,
        permissions: control.permissions
      });
      // Implementation would set up access controls for restored data
    }
  }

  private async performRestore(
    backup: PrivacyCompliantBackup, 
    request: PrivacyAwareRestoreRequest
  ): Promise<void> {
    // Simulate restore process
    const estimatedDuration = this.calculateRestoreDuration(backup, request);
    await new Promise(resolve => setTimeout(resolve, estimatedDuration));
  }

  private calculateRestoreDuration(
    backup: PrivacyCompliantBackup, 
    request: PrivacyAwareRestoreRequest
  ): number {
    let baseDuration = 30000; // 30 seconds base

    // Adjust for data classification (more secure data takes longer)
    if (backup.dataClassification === 'restricted') baseDuration *= 2;
    if (backup.dataClassification === 'confidential') baseDuration *= 1.5;

    // Adjust for data scope
    if (request.dataScope === 'anonymized') baseDuration *= 1.3;
    if (request.dataScope === 'partial') baseDuration *= 0.7;

    return baseDuration;
  }

  private async setupRestoredDataMonitoring(
    backup: PrivacyCompliantBackup, 
    request: PrivacyAwareRestoreRequest
  ): Promise<void> {
    // Set up monitoring for restored data access
    await this.privacyMonitor.setupDataMonitoring({
      dataSource: `restored_${backup.id}`,
      classification: backup.dataClassification,
      accessControls: request.accessControls,
      auditLevel: 'comprehensive'
    });

    this.logger.debug('Restored data monitoring setup', { backupId: backup.id });
  }

  async assessPrivacyBreachRisk(incident: string): Promise<PrivacyBreachAssessment> {
    const assessmentId = `breach-${Date.now()}`;
    
    const assessment: PrivacyBreachAssessment = {
      id: assessmentId,
      triggerEvent: incident,
      severity: 'medium', // Will be determined by assessment
      dataTypesAffected: [],
      subjectsAffected: 0,
      geographicScope: [],
      potentialImpact: '',
      mitigationSteps: [],
      notificationRequired: false,
      assessedBy: 'system',
      assessedAt: new Date()
    };

    // Analyze affected backups
    const affectedBackups = this.analyzeAffectedBackups(incident);
    
    // Determine severity based on data classification and volume
    assessment.severity = this.determineSeverity(affectedBackups);
    
    // Calculate subjects affected
    assessment.subjectsAffected = this.calculateSubjectsAffected(affectedBackups);
    
    // Determine data types affected
    assessment.dataTypesAffected = this.extractDataTypes(affectedBackups);
    
    // Determine geographic scope
    assessment.geographicScope = this.extractGeographicScope(affectedBackups);
    
    // Assess potential impact
    assessment.potentialImpact = this.assessPotentialImpact(assessment);
    
    // Generate mitigation steps
    assessment.mitigationSteps = this.generateMitigationSteps(assessment);
    
    // Determine if notification is required
    assessment.notificationRequired = this.requiresNotification(assessment);
    
    if (assessment.notificationRequired) {
      assessment.reportingDeadline = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours
    }

    this.breachAssessments.set(assessmentId, assessment);

    this.logger.warn('Privacy breach risk assessed', {
      assessmentId,
      severity: assessment.severity,
      subjectsAffected: assessment.subjectsAffected,
      notificationRequired: assessment.notificationRequired
    });

    this.metrics.recordMetric('privacy_breach_assessments_total', 1, [
      'severity', assessment.severity,
      'notification_required', assessment.notificationRequired.toString()
    ]);

    return assessment;
  }

  private analyzeAffectedBackups(incident: string): PrivacyCompliantBackup[] {
    // Simulate analysis of which backups might be affected by the incident
    return Array.from(this.privacyBackups.values()).filter(backup => {
      // Simplified logic - in reality this would be more sophisticated
      return backup.status === 'verified';
    }).slice(0, 3); // Simulate 3 affected backups
  }

  private determineSeverity(backups: PrivacyCompliantBackup[]): 'low' | 'medium' | 'high' | 'critical' {
    if (backups.some(b => b.dataClassification === 'restricted')) return 'critical';
    if (backups.some(b => b.dataClassification === 'confidential')) return 'high';
    if (backups.some(b => b.dataClassification === 'internal')) return 'medium';
    return 'low';
  }

  private calculateSubjectsAffected(backups: PrivacyCompliantBackup[]): number {
    // Simulate calculation of affected data subjects
    return backups.reduce((total, backup) => {
      const subjectsPerBackup = backup.dataClassification === 'restricted' ? 1000 : 
                               backup.dataClassification === 'confidential' ? 500 : 100;
      return total + subjectsPerBackup;
    }, 0);
  }

  private extractDataTypes(backups: PrivacyCompliantBackup[]): string[] {
    const dataTypes = new Set<string>();
    
    for (const backup of backups) {
      if (backup.dataClassification === 'restricted') {
        dataTypes.add('student_educational_records');
        dataTypes.add('personally_identifiable_information');
      }
      if (backup.dataClassification === 'confidential') {
        dataTypes.add('contact_information');
        dataTypes.add('academic_performance');
      }
      dataTypes.add('system_logs');
    }

    return Array.from(dataTypes);
  }

  private extractGeographicScope(backups: PrivacyCompliantBackup[]): string[] {
    const regions = new Set<string>();
    
    for (const backup of backups) {
      // Extract regions from geographic restrictions
      for (const restriction of backup.geographicRestrictions) {
        if (restriction.includes('remain_in_')) {
          const region = restriction.replace('data_must_remain_in_', '').replace(/_/g, ' ');
          regions.add(region);
        }
      }
    }

    return Array.from(regions);
  }

  private assessPotentialImpact(assessment: PrivacyBreachAssessment): string {
    const impacts: string[] = [];

    if (assessment.dataTypesAffected.includes('personally_identifiable_information')) {
      impacts.push('Identity theft risk');
    }
    
    if (assessment.dataTypesAffected.includes('student_educational_records')) {
      impacts.push('Educational privacy violation');
    }
    
    if (assessment.subjectsAffected > 1000) {
      impacts.push('Large-scale privacy impact');
    }

    if (assessment.geographicScope.includes('european union')) {
      impacts.push('GDPR compliance implications');
    }

    return impacts.length > 0 ? impacts.join(', ') : 'Limited privacy impact';
  }

  private generateMitigationSteps(assessment: PrivacyBreachAssessment): string[] {
    const steps: string[] = [];

    steps.push('Contain the incident and prevent further exposure');
    steps.push('Conduct detailed forensic analysis');
    
    if (assessment.severity === 'critical' || assessment.severity === 'high') {
      steps.push('Notify affected data subjects within 72 hours');
      steps.push('Report to relevant data protection authorities');
    }
    
    steps.push('Implement additional security controls');
    steps.push('Review and update incident response procedures');
    
    if (assessment.geographicScope.includes('european union')) {
      steps.push('Prepare GDPR Article 33 notification');
    }

    return steps;
  }

  private requiresNotification(assessment: PrivacyBreachAssessment): boolean {
    // GDPR Article 33 requirements
    if (assessment.geographicScope.includes('european union') && 
        assessment.severity !== 'low') {
      return true;
    }

    // CCPA notification requirements
    if (assessment.geographicScope.includes('california') && 
        assessment.subjectsAffected > 500) {
      return true;
    }

    // Critical or high severity always requires notification
    return assessment.severity === 'critical' || assessment.severity === 'high';
  }

  private async monitorBackupCompliance(): Promise<void> {
    for (const backup of this.privacyBackups.values()) {
      await this.checkBackupCompliance(backup);
    }
  }

  private async checkBackupCompliance(backup: PrivacyCompliantBackup): Promise<void> {
    // Check if privacy controls are still valid
    for (const control of backup.privacyControls) {
      if (!control.applied) {
        this.logger.warn('Privacy control not applied', {
          backupId: backup.id,
          controlType: control.type
        });
      }
    }

    // Check geographic compliance
    for (const restriction of backup.geographicRestrictions) {
      // Validate backup location still complies with restrictions
      // This would integrate with storage service
    }
  }

  private async enforceRetentionPolicies(): Promise<void> {
    const now = new Date();
    
    for (const backup of this.privacyBackups.values()) {
      const expirationDate = new Date(
        backup.createdAt.getTime() + 
        backup.retentionPolicy.retentionPeriodDays * 24 * 60 * 60 * 1000
      );

      if (now > expirationDate && backup.retentionPolicy.automaticDeletion) {
        await this.deleteExpiredBackup(backup);
      }
    }
  }

  private async deleteExpiredBackup(backup: PrivacyCompliantBackup): Promise<void> {
    // Check for legal hold exemption
    if (!backup.retentionPolicy.legalHoldExempt) {
      this.logger.info('Backup subject to legal hold, deletion deferred', {
        backupId: backup.id
      });
      return;
    }

    backup.status = 'expired';
    this.privacyBackups.delete(backup.id);

    this.logger.info('Expired backup deleted', {
      backupId: backup.id,
      tenantId: backup.tenantId,
      retentionDays: backup.retentionPolicy.retentionPeriodDays
    });

    this.metrics.recordMetric('expired_backups_deleted_total', 1, [
      'tenant_id', backup.tenantId,
      'classification', backup.dataClassification
    ]);
  }

  async getPrivacyCompliantBackups(tenantId?: string): Promise<PrivacyCompliantBackup[]> {
    let backups = Array.from(this.privacyBackups.values());
    
    if (tenantId) {
      backups = backups.filter(backup => backup.tenantId === tenantId);
    }

    return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getRestoreRequests(tenantId?: string): Promise<PrivacyAwareRestoreRequest[]> {
    let requests = Array.from(this.restoreRequests.values());
    
    if (tenantId) {
      requests = requests.filter(request => {
        const backup = this.privacyBackups.get(request.backupId);
        return backup?.tenantId === tenantId;
      });
    }

    return requests.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
  }

  async getBreachAssessments(): Promise<PrivacyBreachAssessment[]> {
    return Array.from(this.breachAssessments.values())
      .sort((a, b) => b.assessedAt.getTime() - a.assessedAt.getTime());
  }

  async getComplianceMetrics(): Promise<{
    totalBackups: number;
    backupsByClassification: Record<string, number>;
    encryptedBackups: number;
    anonymizedBackups: number;
    complianceViolations: number;
    breachAssessments: number;
    retentionCompliance: number;
  }> {
    const backups = Array.from(this.privacyBackups.values());
    
    const backupsByClassification: Record<string, number> = {};
    let encryptedBackups = 0;
    let anonymizedBackups = 0;
    let complianceViolations = 0;

    for (const backup of backups) {
      backupsByClassification[backup.dataClassification] = 
        (backupsByClassification[backup.dataClassification] || 0) + 1;

      if (backup.privacyControls.some(c => c.type === 'encryption' && c.applied)) {
        encryptedBackups++;
      }

      if (backup.anonymizationApplied) {
        anonymizedBackups++;
      }

      // Check for compliance violations
      const requiredControls = ['encryption', 'access_control', 'audit_logging'];
      const appliedControls = backup.privacyControls.filter(c => c.applied).map(c => c.type);
      
      if (!requiredControls.every(required => appliedControls.includes(required as any))) {
        complianceViolations++;
      }
    }

    // Calculate retention compliance
    const now = new Date();
    let retentionCompliant = 0;
    
    for (const backup of backups) {
      const age = (now.getTime() - backup.createdAt.getTime()) / (24 * 60 * 60 * 1000);
      if (age <= backup.retentionPolicy.retentionPeriodDays) {
        retentionCompliant++;
      }
    }

    const retentionCompliance = backups.length > 0 ? (retentionCompliant / backups.length) * 100 : 100;

    return {
      totalBackups: backups.length,
      backupsByClassification,
      encryptedBackups,
      anonymizedBackups,
      complianceViolations,
      breachAssessments: this.breachAssessments.size,
      retentionCompliance
    };
  }
}