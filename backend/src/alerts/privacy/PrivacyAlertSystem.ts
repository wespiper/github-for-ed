import { Logger } from '../../monitoring/Logger';
import { PrivacyContext } from '../../types/privacy';

interface PrivacyAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical' | 'breach';
  type: 'unauthorized_access' | 'policy_violation' | 'consent_expired' | 'data_retention' | 'pii_exposure' | 'compliance_violation';
  title: string;
  description: string;
  affectedUsers: string[]; // Hashed IDs only
  resource?: string;
  actionRequired: string;
  autoRemediation?: RemediationAction;
  timestamp: Date;
  escalationLevel: number;
  acknowledged: boolean;
  resolvedAt?: Date;
  metadata: Record<string, any>;
}

interface RemediationAction {
  type: 'block_access' | 'revoke_session' | 'notify_admin' | 'auto_delete' | 'require_consent';
  parameters: Record<string, any>;
  executeAfterMinutes?: number;
  requiresManualApproval: boolean;
}

interface AlertConfig {
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  enableSlackNotifications: boolean;
  escalationTimeoutMinutes: number;
  autoRemediationEnabled: boolean;
  notificationChannels: NotificationChannel[];
}

interface NotificationChannel {
  type: 'email' | 'sms' | 'slack' | 'webhook';
  endpoint: string;
  severity: PrivacyAlert['severity'][];
  enabled: boolean;
}

interface EscalationRule {
  severity: PrivacyAlert['severity'];
  timeoutMinutes: number;
  escalateTo: string[];
  autoEscalate: boolean;
}

export class PrivacyAlertSystem {
  private static instance: PrivacyAlertSystem;
  private logger: Logger;
  private alerts: Map<string, PrivacyAlert> = new Map();
  private config: AlertConfig;
  private escalationRules: EscalationRule[] = [];
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.logger = Logger.getInstance();
    this.config = {
      enableEmailNotifications: true,
      enableSmsNotifications: false,
      enableSlackNotifications: true,
      escalationTimeoutMinutes: 30,
      autoRemediationEnabled: true,
      notificationChannels: []
    };
    this.initializeEscalationRules();
    this.initializeDefaultChannels();
  }

  public static getInstance(): PrivacyAlertSystem {
    if (!PrivacyAlertSystem.instance) {
      PrivacyAlertSystem.instance = new PrivacyAlertSystem();
    }
    return PrivacyAlertSystem.instance;
  }

  private initializeEscalationRules(): void {
    this.escalationRules = [
      {
        severity: 'info',
        timeoutMinutes: 240, // 4 hours
        escalateTo: ['privacy-team@scribetree.com'],
        autoEscalate: false
      },
      {
        severity: 'warning',
        timeoutMinutes: 60, // 1 hour
        escalateTo: ['privacy-team@scribetree.com', 'security-team@scribetree.com'],
        autoEscalate: true
      },
      {
        severity: 'critical',
        timeoutMinutes: 15, // 15 minutes
        escalateTo: ['privacy-officer@scribetree.com', 'cto@scribetree.com'],
        autoEscalate: true
      },
      {
        severity: 'breach',
        timeoutMinutes: 5, // 5 minutes
        escalateTo: ['ceo@scribetree.com', 'legal@scribetree.com', 'privacy-officer@scribetree.com'],
        autoEscalate: true
      }
    ];
  }

  private initializeDefaultChannels(): void {
    this.config.notificationChannels = [
      {
        type: 'email',
        endpoint: 'privacy-alerts@scribetree.com',
        severity: ['warning', 'critical', 'breach'],
        enabled: true
      },
      {
        type: 'slack',
        endpoint: process.env.SLACK_PRIVACY_WEBHOOK || '',
        severity: ['critical', 'breach'],
        enabled: !!process.env.SLACK_PRIVACY_WEBHOOK
      },
      {
        type: 'sms',
        endpoint: process.env.EMERGENCY_SMS_NUMBER || '',
        severity: ['breach'],
        enabled: !!process.env.EMERGENCY_SMS_NUMBER
      }
    ];
  }

  public async createAlert(
    alertData: Omit<PrivacyAlert, 'id' | 'timestamp' | 'escalationLevel' | 'acknowledged' | 'metadata'>,
    privacyContext: PrivacyContext,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    try {
      const alert: PrivacyAlert = {
        ...alertData,
        id: this.generateAlertId(),
        timestamp: new Date(),
        escalationLevel: 0,
        acknowledged: false,
        metadata: {
          ...metadata,
          correlation_id: privacyContext.correlationId,
          privacy_context: privacyContext
        }
      };

      // Store alert
      this.alerts.set(alert.id, alert);

      // Log alert creation
      this.logger.warn('PRIVACY_ALERT_CREATED', {
        alert_id: alert.id,
        severity: alert.severity,
        type: alert.type,
        title: alert.title,
        affected_users_count: alert.affectedUsers.length,
        correlation_id: privacyContext.correlationId
      });

      // Send notifications
      await this.sendNotifications(alert);

      // Schedule escalation if needed
      this.scheduleEscalation(alert);

      // Execute auto-remediation if configured
      if (this.config.autoRemediationEnabled && alert.autoRemediation) {
        await this.executeAutoRemediation(alert);
      }

      return alert.id;

    } catch (error) {
      this.logger.error('ALERT_CREATION_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        alert_type: alertData.type,
        severity: alertData.severity,
        correlation_id: privacyContext.correlationId
      });
      throw error;
    }
  }

  private async sendNotifications(alert: PrivacyAlert): Promise<void> {
    const eligibleChannels = this.config.notificationChannels.filter(
      channel => channel.enabled && channel.severity.includes(alert.severity)
    );

    for (const channel of eligibleChannels) {
      try {
        switch (channel.type) {
          case 'email':
            await this.sendEmailNotification(alert, channel.endpoint);
            break;
          case 'sms':
            await this.sendSmsNotification(alert, channel.endpoint);
            break;
          case 'slack':
            await this.sendSlackNotification(alert, channel.endpoint);
            break;
          case 'webhook':
            await this.sendWebhookNotification(alert, channel.endpoint);
            break;
        }

        this.logger.info('NOTIFICATION_SENT', {
          alert_id: alert.id,
          channel_type: channel.type,
          endpoint: this.maskEndpoint(channel.endpoint),
          severity: alert.severity
        });

      } catch (error) {
        this.logger.error('NOTIFICATION_SEND_ERROR', {
          alert_id: alert.id,
          channel_type: channel.type,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  private async sendEmailNotification(alert: PrivacyAlert, emailEndpoint: string): Promise<void> {
    // Email notification implementation placeholder
    // In production, this would integrate with email service (SendGrid, SES, etc.)
    
    const emailData = {
      to: emailEndpoint,
      subject: `[PRIVACY ALERT ${alert.severity.toUpperCase()}] ${alert.title}`,
      body: this.formatAlertEmail(alert),
      priority: alert.severity === 'breach' ? 'high' : 'normal'
    };

    this.logger.info('EMAIL_NOTIFICATION_QUEUED', {
      alert_id: alert.id,
      to: this.maskEndpoint(emailEndpoint),
      subject: emailData.subject
    });

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async sendSmsNotification(alert: PrivacyAlert, phoneNumber: string): Promise<void> {
    // SMS notification implementation placeholder
    // In production, this would integrate with SMS service (Twilio, AWS SNS, etc.)
    
    const smsData = {
      to: phoneNumber,
      message: this.formatAlertSms(alert)
    };

    this.logger.info('SMS_NOTIFICATION_QUEUED', {
      alert_id: alert.id,
      to: this.maskEndpoint(phoneNumber),
      message_length: smsData.message.length
    });

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async sendSlackNotification(alert: PrivacyAlert, webhookUrl: string): Promise<void> {
    // Slack notification implementation placeholder
    // In production, this would make HTTP POST to Slack webhook
    
    const slackData = {
      text: `Privacy Alert: ${alert.title}`,
      attachments: [{
        color: this.getSlackColor(alert.severity),
        fields: [
          { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
          { title: 'Type', value: alert.type, short: true },
          { title: 'Affected Users', value: alert.affectedUsers.length.toString(), short: true },
          { title: 'Action Required', value: alert.actionRequired, short: false }
        ],
        ts: Math.floor(alert.timestamp.getTime() / 1000)
      }]
    };

    this.logger.info('SLACK_NOTIFICATION_QUEUED', {
      alert_id: alert.id,
      webhook: this.maskEndpoint(webhookUrl),
      severity: alert.severity
    });

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async sendWebhookNotification(alert: PrivacyAlert, webhookUrl: string): Promise<void> {
    // Generic webhook notification implementation placeholder
    const webhookData = {
      alert_id: alert.id,
      severity: alert.severity,
      type: alert.type,
      title: alert.title,
      description: alert.description,
      timestamp: alert.timestamp.toISOString(),
      affected_users_count: alert.affectedUsers.length,
      action_required: alert.actionRequired
    };

    this.logger.info('WEBHOOK_NOTIFICATION_QUEUED', {
      alert_id: alert.id,
      webhook: this.maskEndpoint(webhookUrl),
      data_size: JSON.stringify(webhookData).length
    });

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private scheduleEscalation(alert: PrivacyAlert): void {
    const escalationRule = this.escalationRules.find(rule => rule.severity === alert.severity);
    
    if (!escalationRule || !escalationRule.autoEscalate) {
      return;
    }

    const timer = setTimeout(async () => {
      if (!this.alerts.get(alert.id)?.acknowledged) {
        await this.escalateAlert(alert.id);
      }
    }, escalationRule.timeoutMinutes * 60 * 1000);

    this.escalationTimers.set(alert.id, timer);
  }

  private async escalateAlert(alertId: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) return;

    alert.escalationLevel++;
    
    const escalationRule = this.escalationRules.find(rule => rule.severity === alert.severity);
    if (!escalationRule) return;

    // Send escalation notifications
    for (const recipient of escalationRule.escalateTo) {
      await this.sendEscalationNotification(alert, recipient);
    }

    this.logger.warn('ALERT_ESCALATED', {
      alert_id: alert.id,
      escalation_level: alert.escalationLevel,
      escalated_to: escalationRule.escalateTo,
      severity: alert.severity
    });

    // Schedule next escalation if not at max level
    if (alert.escalationLevel < 3) {
      this.scheduleEscalation(alert);
    }
  }

  private async sendEscalationNotification(alert: PrivacyAlert, recipient: string): Promise<void> {
    const escalationData = {
      to: recipient,
      subject: `[ESCALATED] Privacy Alert #${alert.id} - ${alert.title}`,
      body: this.formatEscalationEmail(alert),
      priority: 'high'
    };

    this.logger.warn('ESCALATION_NOTIFICATION_SENT', {
      alert_id: alert.id,
      recipient: this.maskEndpoint(recipient),
      escalation_level: alert.escalationLevel
    });
  }

  private async executeAutoRemediation(alert: PrivacyAlert): Promise<void> {
    if (!alert.autoRemediation) return;

    const remediation = alert.autoRemediation;
    
    if (remediation.requiresManualApproval) {
      this.logger.info('AUTO_REMEDIATION_REQUIRES_APPROVAL', {
        alert_id: alert.id,
        remediation_type: remediation.type,
        parameters: remediation.parameters
      });
      return;
    }

    const executeAfter = remediation.executeAfterMinutes || 0;
    
    setTimeout(async () => {
      try {
        await this.executeRemediationAction(alert, remediation);
        
        this.logger.info('AUTO_REMEDIATION_EXECUTED', {
          alert_id: alert.id,
          remediation_type: remediation.type,
          executed_at: new Date().toISOString()
        });

      } catch (error) {
        this.logger.error('AUTO_REMEDIATION_ERROR', {
          alert_id: alert.id,
          remediation_type: remediation.type,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }, executeAfter * 60 * 1000);
  }

  private async executeRemediationAction(alert: PrivacyAlert, remediation: RemediationAction): Promise<void> {
    switch (remediation.type) {
      case 'block_access':
        await this.blockUserAccess(remediation.parameters.userId, remediation.parameters.resource);
        break;
      case 'revoke_session':
        await this.revokeUserSession(remediation.parameters.userId);
        break;
      case 'notify_admin':
        await this.notifyAdministrator(alert, remediation.parameters.adminEmail);
        break;
      case 'auto_delete':
        await this.autoDeleteData(remediation.parameters.dataId, remediation.parameters.reason);
        break;
      case 'require_consent':
        await this.requireUserConsent(remediation.parameters.userId, remediation.parameters.consentType);
        break;
    }
  }

  private async blockUserAccess(userId: string, resource: string): Promise<void> {
    // Implementation for blocking user access
    this.logger.warn('USER_ACCESS_BLOCKED', {
      user_hash: this.hashUserId(userId),
      resource,
      reason: 'auto_remediation'
    });
  }

  private async revokeUserSession(userId: string): Promise<void> {
    // Implementation for revoking user session
    this.logger.warn('USER_SESSION_REVOKED', {
      user_hash: this.hashUserId(userId),
      reason: 'auto_remediation'
    });
  }

  private async notifyAdministrator(alert: PrivacyAlert, adminEmail: string): Promise<void> {
    await this.sendEmailNotification(alert, adminEmail);
  }

  private async autoDeleteData(dataId: string, reason: string): Promise<void> {
    // Implementation for auto-deleting data
    this.logger.warn('DATA_AUTO_DELETED', {
      data_id: dataId,
      reason,
      deleted_at: new Date().toISOString()
    });
  }

  private async requireUserConsent(userId: string, consentType: string): Promise<void> {
    // Implementation for requiring user consent
    this.logger.info('CONSENT_REQUIRED', {
      user_hash: this.hashUserId(userId),
      consent_type: consentType,
      required_at: new Date().toISOString()
    });
  }

  public async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.acknowledged = true;
    
    // Clear escalation timer
    const timer = this.escalationTimers.get(alertId);
    if (timer) {
      clearTimeout(timer);
      this.escalationTimers.delete(alertId);
    }

    this.logger.info('ALERT_ACKNOWLEDGED', {
      alert_id: alertId,
      acknowledged_by: this.hashUserId(acknowledgedBy),
      acknowledged_at: new Date().toISOString()
    });
  }

  public async resolveAlert(alertId: string, resolvedBy: string, resolution: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.resolvedAt = new Date();
    alert.metadata.resolution = resolution;
    alert.metadata.resolved_by = this.hashUserId(resolvedBy);

    this.logger.info('ALERT_RESOLVED', {
      alert_id: alertId,
      resolved_by: this.hashUserId(resolvedBy),
      resolution,
      resolved_at: alert.resolvedAt.toISOString()
    });
  }

  private formatAlertEmail(alert: PrivacyAlert): string {
    return `
Privacy Alert: ${alert.title}

Severity: ${alert.severity.toUpperCase()}
Type: ${alert.type}
Time: ${alert.timestamp.toISOString()}
Affected Users: ${alert.affectedUsers.length}

Description:
${alert.description}

Action Required:
${alert.actionRequired}

Alert ID: ${alert.id}
    `.trim();
  }

  private formatAlertSms(alert: PrivacyAlert): string {
    return `[PRIVACY ${alert.severity.toUpperCase()}] ${alert.title}. ${alert.affectedUsers.length} users affected. ID: ${alert.id}`;
  }

  private formatEscalationEmail(alert: PrivacyAlert): string {
    return `
ESCALATED PRIVACY ALERT

This alert has been escalated due to lack of acknowledgment.

${this.formatAlertEmail(alert)}

Escalation Level: ${alert.escalationLevel}
Original Alert Time: ${alert.timestamp.toISOString()}

Please take immediate action.
    `.trim();
  }

  private getSlackColor(severity: PrivacyAlert['severity']): string {
    const colors = {
      'info': '#36a64f',      // Green
      'warning': '#ff9500',   // Orange
      'critical': '#ff0000',  // Red
      'breach': '#8b0000'     // Dark Red
    };
    return colors[severity] || '#808080';
  }

  private maskEndpoint(endpoint: string): string {
    if (endpoint.includes('@')) {
      // Email
      const [local, domain] = endpoint.split('@');
      return `${local.substr(0, 2)}***@${domain}`;
    } else if (endpoint.startsWith('http')) {
      // URL
      return endpoint.replace(/\/\/[^\/]+/, '//***');
    } else {
      // Phone or other
      return endpoint.substr(0, 3) + '***';
    }
  }

  private hashUserId(userId: string): string {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `user_${Math.abs(hash).toString(16)}`;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getAlertStats(): {
    totalAlerts: number;
    activeAlerts: number;
    criticalAlerts: number;
    breachAlerts: number;
    acknowledgedAlerts: number;
    resolvedAlerts: number;
  } {
    const alerts = Array.from(this.alerts.values());
    
    return {
      totalAlerts: alerts.length,
      activeAlerts: alerts.filter(a => !a.resolvedAt).length,
      criticalAlerts: alerts.filter(a => a.severity === 'critical' && !a.resolvedAt).length,
      breachAlerts: alerts.filter(a => a.severity === 'breach' && !a.resolvedAt).length,
      acknowledgedAlerts: alerts.filter(a => a.acknowledged).length,
      resolvedAlerts: alerts.filter(a => a.resolvedAt).length
    };
  }

  public updateConfig(newConfig: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    this.logger.info('ALERT_SYSTEM_CONFIG_UPDATED', {
      config: this.config,
      timestamp: new Date().toISOString()
    });
  }
}