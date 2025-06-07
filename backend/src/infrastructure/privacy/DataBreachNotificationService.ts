/**
 * Data Breach Notification Service
 * Automated breach notification workflows with regulatory compliance
 */

import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';

export interface BreachNotification {
  id: string;
  incidentId: string;
  notificationType: NotificationType;
  urgency: NotificationUrgency;
  recipients: NotificationRecipient[];
  regulatoryRequirements: RegulatoryRequirement[];
  content: NotificationContent;
  delivery: DeliveryConfiguration;
  status: NotificationStatus;
  timeline: NotificationTimeline;
  compliance: ComplianceTracking;
  audit: AuditTrail[];
}

export enum NotificationType {
  INDIVIDUAL_NOTIFICATION = 'individual_notification',
  REGULATORY_NOTIFICATION = 'regulatory_notification',
  PARTNER_NOTIFICATION = 'partner_notification',
  MEDIA_NOTIFICATION = 'media_notification',
  INTERNAL_NOTIFICATION = 'internal_notification',
  BOARD_NOTIFICATION = 'board_notification',
  INSURANCE_NOTIFICATION = 'insurance_notification'
}

export enum NotificationUrgency {
  IMMEDIATE = 'immediate',      // Within 1 hour
  URGENT = 'urgent',           // Within 24 hours
  STANDARD = 'standard',       // Within 72 hours
  ROUTINE = 'routine'          // Within 30 days
}

export enum NotificationStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BOUNCED = 'bounced',
  ACKNOWLEDGED = 'acknowledged',
  ESCALATED = 'escalated'
}

export interface NotificationRecipient {
  id: string;
  type: 'individual' | 'regulator' | 'partner' | 'media' | 'internal';
  name: string;
  contactInfo: ContactInfo;
  jurisdiction?: string;
  language: string;
  specialRequirements?: string[];
  deliveryStatus: NotificationStatus;
  acknowledgedAt?: Date;
  escalationRequired: boolean;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  preferredMethod: 'email' | 'phone' | 'postal' | 'secure_portal';
}

export interface RegulatoryRequirement {
  regulation: 'FERPA' | 'GDPR' | 'CCPA' | 'COPPA' | 'PIPEDA' | 'STATE_LAW';
  jurisdiction: string;
  notificationDeadline: Date;
  recipientType: string;
  requiredContent: string[];
  deliveryMethod: string[];
  acknowledgmentRequired: boolean;
  followUpRequired: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  evidence: string[];
}

export interface NotificationContent {
  templateId: string;
  subject: string;
  body: string;
  attachments: NotificationAttachment[];
  customizations: Record<string, string>;
  translations: Record<string, LocalizedContent>;
  legalReview: {
    required: boolean;
    completed: boolean;
    approvedBy?: string;
    approvedAt?: Date;
    comments?: string;
  };
}

export interface LocalizedContent {
  subject: string;
  body: string;
  attachments: NotificationAttachment[];
}

export interface NotificationAttachment {
  id: string;
  filename: string;
  type: 'incident_report' | 'remediation_plan' | 'legal_notice' | 'contact_info';
  url: string;
  encrypted: boolean;
  expiresAt?: Date;
}

export interface DeliveryConfiguration {
  channels: DeliveryChannel[];
  scheduling: SchedulingConfig;
  retryPolicy: RetryPolicy;
  escalationPolicy: EscalationPolicy;
  tracking: TrackingConfig;
}

export interface DeliveryChannel {
  type: 'email' | 'sms' | 'postal' | 'secure_portal' | 'phone' | 'fax';
  priority: number;
  config: Record<string, any>;
  fallbackChannel?: string;
}

export interface SchedulingConfig {
  sendAt?: Date;
  batchDelivery: boolean;
  batchSize?: number;
  staggerInterval?: number; // milliseconds
  respectBusinessHours: boolean;
  timezone: string;
}

export interface RetryPolicy {
  maxAttempts: number;
  retryInterval: number; // milliseconds
  backoffMultiplier: number;
  retryConditions: string[];
}

export interface EscalationPolicy {
  enabled: boolean;
  escalationDelay: number; // milliseconds
  escalationContacts: string[];
  autoEscalationTriggers: string[];
}

export interface TrackingConfig {
  deliveryReceipts: boolean;
  readReceipts: boolean;
  clickTracking: boolean;
  responseTracking: boolean;
  anonymousTracking: boolean;
}

export interface NotificationTimeline {
  createdAt: Date;
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  acknowledgedAt?: Date;
  deadlineAt: Date;
  escalatedAt?: Date;
  completedAt?: Date;
}

export interface ComplianceTracking {
  regulationsMet: string[];
  deadlineCompliance: boolean;
  contentCompliance: boolean;
  deliveryCompliance: boolean;
  documentationComplete: boolean;
  auditReady: boolean;
  complianceScore: number; // 0-100
}

export interface AuditTrail {
  timestamp: Date;
  action: string;
  actor: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  regulations: string[];
  subject: string;
  body: string;
  requiredFields: string[];
  optionalFields: string[];
  attachmentTemplates: AttachmentTemplate[];
  approvalRequired: boolean;
  translations: Record<string, LocalizedContent>;
}

export interface AttachmentTemplate {
  type: string;
  required: boolean;
  generateFunction: string;
  encryption: boolean;
}

@Injectable()
export class DataBreachNotificationService extends EventEmitter {
  private notifications = new Map<string, BreachNotification>();
  private templates = new Map<string, NotificationTemplate>();
  private deliveryProviders = new Map<string, any>();
  
  constructor() {
    super();
    this.initializeTemplates();
    this.initializeDeliveryProviders();
  }

  /**
   * Create breach notification workflow
   */
  public async createBreachNotification(
    incidentId: string,
    notificationType: NotificationType,
    affectedIndividuals: string[],
    regulatoryJurisdictions: string[] = [],
    customContent?: Partial<NotificationContent>
  ): Promise<BreachNotification> {
    const notification: BreachNotification = {
      id: this.generateNotificationId(),
      incidentId,
      notificationType,
      urgency: this.determineUrgency(notificationType, affectedIndividuals.length),
      recipients: await this.buildRecipientList(notificationType, affectedIndividuals, regulatoryJurisdictions),
      regulatoryRequirements: this.determineRegulatoryRequirements(notificationType, regulatoryJurisdictions),
      content: await this.generateNotificationContent(notificationType, incidentId, customContent),
      delivery: this.configureDelivery(notificationType),
      status: NotificationStatus.PENDING,
      timeline: {
        createdAt: new Date(),
        deadlineAt: this.calculateDeadline(notificationType, regulatoryJurisdictions)
      },
      compliance: {
        regulationsMet: [],
        deadlineCompliance: true,
        contentCompliance: false,
        deliveryCompliance: false,
        documentationComplete: false,
        auditReady: false,
        complianceScore: 0
      },
      audit: [{
        timestamp: new Date(),
        action: 'NOTIFICATION_CREATED',
        actor: 'system',
        details: {
          incidentId,
          type: notificationType,
          recipientCount: affectedIndividuals.length,
          jurisdictions: regulatoryJurisdictions
        }
      }]
    };

    this.notifications.set(notification.id, notification);
    
    // Emit notification created event
    this.emit('notification_created', notification);
    
    // Auto-validate content if required
    if (notification.content.legalReview.required) {
      await this.requestLegalReview(notification.id);
    } else {
      await this.validateNotificationContent(notification.id);
    }
    
    return notification;
  }

  /**
   * Schedule notification delivery
   */
  public async scheduleNotification(
    notificationId: string,
    sendAt?: Date,
    approverOverride?: boolean
  ): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (!notification) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    // Check if content approval is required
    if (notification.content.legalReview.required && !notification.content.legalReview.completed && !approverOverride) {
      throw new Error('Legal review required before scheduling');
    }

    notification.status = NotificationStatus.SCHEDULED;
    notification.timeline.scheduledAt = sendAt || new Date();
    
    notification.audit.push({
      timestamp: new Date(),
      action: 'NOTIFICATION_SCHEDULED',
      actor: 'system',
      details: {
        scheduledAt: notification.timeline.scheduledAt,
        recipientCount: notification.recipients.length
      }
    });

    // Schedule delivery based on urgency and requirements
    if (sendAt && sendAt > new Date()) {
      this.scheduleDelayedDelivery(notificationId, sendAt);
    } else {
      await this.executeDelivery(notificationId);
    }

    this.emit('notification_scheduled', notification);
  }

  /**
   * Execute notification delivery
   */
  public async executeDelivery(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (!notification) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    notification.status = NotificationStatus.SENDING;
    notification.timeline.sentAt = new Date();

    // Check deadline compliance
    if (new Date() > notification.timeline.deadlineAt) {
      notification.compliance.deadlineCompliance = false;
      await this.escalateOverdueNotification(notificationId);
    }

    // Batch delivery based on configuration
    if (notification.delivery.scheduling.batchDelivery) {
      await this.executeBatchDelivery(notification);
    } else {
      await this.executeImmediateDelivery(notification);
    }

    this.emit('notification_delivery_started', notification);
  }

  /**
   * Execute batch delivery with staggering
   */
  private async executeBatchDelivery(notification: BreachNotification): Promise<void> {
    const batchSize = notification.delivery.scheduling.batchSize || 100;
    const staggerInterval = notification.delivery.scheduling.staggerInterval || 1000;
    
    for (let i = 0; i < notification.recipients.length; i += batchSize) {
      const batch = notification.recipients.slice(i, i + batchSize);
      
      await this.deliverToBatch(notification, batch);
      
      // Stagger between batches
      if (i + batchSize < notification.recipients.length) {
        await this.delay(staggerInterval);
      }
    }
  }

  /**
   * Execute immediate delivery to all recipients
   */
  private async executeImmediateDelivery(notification: BreachNotification): Promise<void> {
    const deliveryPromises = notification.recipients.map(recipient => 
      this.deliverToRecipient(notification, recipient)
    );
    
    await Promise.allSettled(deliveryPromises);
  }

  /**
   * Deliver notification to a batch of recipients
   */
  private async deliverToBatch(notification: BreachNotification, batch: NotificationRecipient[]): Promise<void> {
    const deliveryPromises = batch.map(recipient => 
      this.deliverToRecipient(notification, recipient)
    );
    
    await Promise.allSettled(deliveryPromises);
  }

  /**
   * Deliver notification to individual recipient
   */
  private async deliverToRecipient(notification: BreachNotification, recipient: NotificationRecipient): Promise<void> {
    try {
      recipient.deliveryStatus = NotificationStatus.SENDING;
      
      // Get personalized content
      const personalizedContent = await this.personalizeContent(notification.content, recipient);
      
      // Select delivery channel
      const channel = this.selectDeliveryChannel(notification.delivery.channels, recipient);
      
      // Deliver via selected channel
      const deliveryResult = await this.deliverViaChannel(channel, recipient, personalizedContent);
      
      if (deliveryResult.success) {
        recipient.deliveryStatus = NotificationStatus.DELIVERED;
      } else {
        recipient.deliveryStatus = NotificationStatus.FAILED;
        await this.handleDeliveryFailure(notification, recipient, deliveryResult.error);
      }
      
    } catch (error) {
      recipient.deliveryStatus = NotificationStatus.FAILED;
      await this.handleDeliveryFailure(notification, recipient, error.message);
    }
  }

  /**
   * Track notification acknowledgment
   */
  public async acknowledgeNotification(
    notificationId: string,
    recipientId: string,
    acknowledgmentData?: Record<string, any>
  ): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (!notification) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    const recipient = notification.recipients.find(r => r.id === recipientId);
    if (!recipient) {
      throw new Error(`Recipient ${recipientId} not found`);
    }

    recipient.deliveryStatus = NotificationStatus.ACKNOWLEDGED;
    recipient.acknowledgedAt = new Date();
    
    notification.audit.push({
      timestamp: new Date(),
      action: 'NOTIFICATION_ACKNOWLEDGED',
      actor: recipientId,
      details: {
        acknowledgmentData,
        deliveryChannel: recipient.contactInfo.preferredMethod
      }
    });

    // Check if all regulatory notifications are acknowledged
    await this.checkComplianceStatus(notificationId);
    
    this.emit('notification_acknowledged', { notification, recipient });
  }

  /**
   * Generate compliance report
   */
  public generateComplianceReport(notificationId: string): any {
    const notification = this.notifications.get(notificationId);
    if (!notification) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    const deliveryStats = this.calculateDeliveryStats(notification);
    const regulatoryCompliance = this.assessRegulatoryCompliance(notification);
    
    return {
      notificationId: notification.id,
      incidentId: notification.incidentId,
      type: notification.notificationType,
      summary: {
        totalRecipients: notification.recipients.length,
        successfulDeliveries: deliveryStats.successful,
        failedDeliveries: deliveryStats.failed,
        acknowledgments: deliveryStats.acknowledged,
        complianceScore: notification.compliance.complianceScore
      },
      timeline: {
        created: notification.timeline.createdAt,
        deadline: notification.timeline.deadlineAt,
        sent: notification.timeline.sentAt,
        delivered: notification.timeline.deliveredAt,
        onTime: notification.compliance.deadlineCompliance
      },
      regulatoryCompliance,
      deliveryDetails: notification.recipients.map(r => ({
        recipientId: r.id,
        type: r.type,
        status: r.deliveryStatus,
        acknowledgedAt: r.acknowledgedAt,
        jurisdiction: r.jurisdiction
      })),
      auditTrail: notification.audit
    };
  }

  /**
   * Get notification metrics for monitoring
   */
  public getNotificationMetrics(): any {
    const allNotifications = Array.from(this.notifications.values());
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recent = allNotifications.filter(n => n.timeline.createdAt >= last30Days);

    return {
      total: allNotifications.length,
      last30Days: recent.length,
      byType: this.groupBy(allNotifications, 'notificationType'),
      byStatus: this.groupBy(allNotifications, 'status'),
      byUrgency: this.groupBy(allNotifications, 'urgency'),
      complianceMetrics: {
        averageComplianceScore: this.calculateAverageComplianceScore(allNotifications),
        onTimeDelivery: this.calculateOnTimeDeliveryRate(allNotifications),
        acknowledgmentRate: this.calculateAcknowledmentRate(allNotifications)
      },
      performanceMetrics: {
        averageDeliveryTime: this.calculateAverageDeliveryTime(allNotifications),
        deliverySuccessRate: this.calculateDeliverySuccessRate(allNotifications),
        escalationRate: this.calculateEscalationRate(allNotifications)
      }
    };
  }

  /**
   * Initialize notification templates
   */
  private initializeTemplates(): void {
    this.templates.set('individual_breach', {
      id: 'individual_breach',
      name: 'Individual Data Breach Notification',
      type: NotificationType.INDIVIDUAL_NOTIFICATION,
      regulations: ['GDPR', 'CCPA', 'STATE_LAW'],
      subject: 'Important Security Notice - Scribe Tree Data Incident',
      body: `Dear {{recipient_name}},

We are writing to inform you of a security incident that may have affected your personal information stored in our Scribe Tree educational platform.

WHAT HAPPENED:
{{incident_description}}

INFORMATION INVOLVED:
{{affected_data_types}}

WHAT WE ARE DOING:
{{remediation_actions}}

WHAT YOU CAN DO:
{{recommended_actions}}

We sincerely apologize for this incident and any inconvenience it may cause. We take the security of your information very seriously and are taking steps to prevent similar incidents in the future.

If you have any questions, please contact us at privacy@scribe-tree.com or call our privacy hotline at 1-800-PRIVACY.

Sincerely,
Scribe Tree Privacy Team`,
      requiredFields: ['recipient_name', 'incident_description', 'affected_data_types', 'remediation_actions'],
      optionalFields: ['recommended_actions', 'additional_resources'],
      attachmentTemplates: [
        {
          type: 'contact_info',
          required: true,
          generateFunction: 'generateContactInfo',
          encryption: false
        }
      ],
      approvalRequired: true,
      translations: {
        'es': {
          subject: 'Aviso de Seguridad Importante - Incidente de Datos de Scribe Tree',
          body: 'Spanish translation of breach notification...',
          attachments: []
        }
      }
    });

    this.templates.set('regulatory_notification', {
      id: 'regulatory_notification',
      name: 'Regulatory Authority Notification',
      type: NotificationType.REGULATORY_NOTIFICATION,
      regulations: ['GDPR', 'FERPA', 'CCPA'],
      subject: 'Data Breach Notification - {{incident_id}}',
      body: `Regulatory Authority Notification

Incident ID: {{incident_id}}
Organization: Scribe Tree Educational Platform
Date of Discovery: {{discovery_date}}
Date of Notification: {{notification_date}}

INCIDENT SUMMARY:
{{incident_summary}}

AFFECTED INDIVIDUALS: {{affected_count}}
DATA CATEGORIES: {{data_categories}}
JURISDICTIONS: {{jurisdictions}}

REMEDIATION MEASURES:
{{remediation_measures}}

TIMELINE:
{{incident_timeline}}

Contact Information:
Privacy Officer: privacy@scribe-tree.com
Phone: 1-800-PRIVACY
Address: [Company Address]

Detailed incident report is attached.`,
      requiredFields: ['incident_id', 'discovery_date', 'incident_summary', 'affected_count'],
      optionalFields: ['additional_context'],
      attachmentTemplates: [
        {
          type: 'incident_report',
          required: true,
          generateFunction: 'generateDetailedIncidentReport',
          encryption: true
        }
      ],
      approvalRequired: true,
      translations: {}
    });
  }

  /**
   * Initialize delivery providers
   */
  private initializeDeliveryProviders(): void {
    // Email provider
    this.deliveryProviders.set('email', {
      send: async (recipient: NotificationRecipient, content: any) => {
        // Implementation for email delivery
        console.log(`Sending email to ${recipient.contactInfo.email}`);
        return { success: true, messageId: `email_${Date.now()}` };
      }
    });

    // SMS provider
    this.deliveryProviders.set('sms', {
      send: async (recipient: NotificationRecipient, content: any) => {
        // Implementation for SMS delivery
        console.log(`Sending SMS to ${recipient.contactInfo.phone}`);
        return { success: true, messageId: `sms_${Date.now()}` };
      }
    });

    // Postal provider
    this.deliveryProviders.set('postal', {
      send: async (recipient: NotificationRecipient, content: any) => {
        // Implementation for postal delivery
        console.log(`Sending postal notification to ${recipient.name}`);
        return { success: true, messageId: `postal_${Date.now()}` };
      }
    });
  }

  // Helper methods implementation
  private generateNotificationId(): string {
    return `BRN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineUrgency(type: NotificationType, affectedCount: number): NotificationUrgency {
    if (type === NotificationType.REGULATORY_NOTIFICATION) {
      return affectedCount > 500 ? NotificationUrgency.IMMEDIATE : NotificationUrgency.URGENT;
    }
    
    if (affectedCount > 1000) return NotificationUrgency.IMMEDIATE;
    if (affectedCount > 100) return NotificationUrgency.URGENT;
    return NotificationUrgency.STANDARD;
  }

  private async buildRecipientList(
    type: NotificationType,
    affectedIndividuals: string[],
    jurisdictions: string[]
  ): Promise<NotificationRecipient[]> {
    const recipients: NotificationRecipient[] = [];
    
    // Build recipient list based on type
    switch (type) {
      case NotificationType.INDIVIDUAL_NOTIFICATION:
        // Add affected individuals
        affectedIndividuals.forEach((individualId, index) => {
          recipients.push({
            id: `${individualId}_${index}`,
            type: 'individual',
            name: `Individual ${index + 1}`, // Would get actual name from database
            contactInfo: {
              email: `individual${index + 1}@example.com`, // Would get from database
              preferredMethod: 'email'
            },
            language: 'en',
            deliveryStatus: NotificationStatus.PENDING,
            escalationRequired: false
          });
        });
        break;
        
      case NotificationType.REGULATORY_NOTIFICATION:
        // Add regulatory authorities based on jurisdictions
        jurisdictions.forEach(jurisdiction => {
          recipients.push({
            id: `regulator_${jurisdiction}`,
            type: 'regulator',
            name: `${jurisdiction} Privacy Authority`,
            contactInfo: {
              email: `privacy@${jurisdiction.toLowerCase()}.gov`,
              preferredMethod: 'email'
            },
            jurisdiction,
            language: 'en',
            deliveryStatus: NotificationStatus.PENDING,
            escalationRequired: true
          });
        });
        break;
    }
    
    return recipients;
  }

  private determineRegulatoryRequirements(
    type: NotificationType,
    jurisdictions: string[]
  ): RegulatoryRequirement[] {
    const requirements: RegulatoryRequirement[] = [];
    
    jurisdictions.forEach(jurisdiction => {
      if (jurisdiction === 'EU') {
        requirements.push({
          regulation: 'GDPR',
          jurisdiction: 'EU',
          notificationDeadline: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
          recipientType: 'supervisory_authority',
          requiredContent: ['nature_of_breach', 'affected_categories', 'remedial_measures'],
          deliveryMethod: ['email', 'secure_portal'],
          acknowledgmentRequired: true,
          followUpRequired: true,
          status: 'pending',
          evidence: []
        });
      }
      
      if (jurisdiction === 'US') {
        requirements.push({
          regulation: 'FERPA',
          jurisdiction: 'US',
          notificationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          recipientType: 'department_of_education',
          requiredContent: ['breach_description', 'affected_records', 'containment_measures'],
          deliveryMethod: ['email', 'postal'],
          acknowledgmentRequired: false,
          followUpRequired: false,
          status: 'pending',
          evidence: []
        });
      }
    });
    
    return requirements;
  }

  private async generateNotificationContent(
    type: NotificationType,
    incidentId: string,
    customContent?: Partial<NotificationContent>
  ): Promise<NotificationContent> {
    const template = this.templates.get(type === NotificationType.INDIVIDUAL_NOTIFICATION ? 'individual_breach' : 'regulatory_notification');
    
    if (!template) {
      throw new Error(`Template not found for type: ${type}`);
    }

    return {
      templateId: template.id,
      subject: template.subject.replace('{{incident_id}}', incidentId),
      body: template.body.replace('{{incident_id}}', incidentId),
      attachments: [],
      customizations: customContent?.customizations || {},
      translations: template.translations,
      legalReview: {
        required: template.approvalRequired,
        completed: false
      }
    };
  }

  private configureDelivery(type: NotificationType): DeliveryConfiguration {
    return {
      channels: [
        {
          type: 'email',
          priority: 1,
          config: {
            provider: 'primary_email_service',
            encryption: true
          },
          fallbackChannel: 'postal'
        }
      ],
      scheduling: {
        batchDelivery: true,
        batchSize: 100,
        staggerInterval: 1000,
        respectBusinessHours: false,
        timezone: 'UTC'
      },
      retryPolicy: {
        maxAttempts: 3,
        retryInterval: 300000, // 5 minutes
        backoffMultiplier: 2,
        retryConditions: ['temporary_failure', 'rate_limit']
      },
      escalationPolicy: {
        enabled: true,
        escalationDelay: 3600000, // 1 hour
        escalationContacts: ['privacy_officer', 'legal_counsel'],
        autoEscalationTriggers: ['delivery_failure', 'deadline_approaching']
      },
      tracking: {
        deliveryReceipts: true,
        readReceipts: true,
        clickTracking: false, // Privacy-conscious
        responseTracking: true,
        anonymousTracking: true
      }
    };
  }

  private calculateDeadline(type: NotificationType, jurisdictions: string[]): Date {
    // Default to most restrictive deadline
    let shortestDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default
    
    if (jurisdictions.includes('EU')) {
      shortestDeadline = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours for GDPR
    }
    
    return shortestDeadline;
  }

  private async requestLegalReview(notificationId: string): Promise<void> {
    // Implementation for requesting legal review
    console.log(`Legal review requested for notification ${notificationId}`);
    this.emit('legal_review_requested', { notificationId });
  }

  private async validateNotificationContent(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.compliance.contentCompliance = true;
      notification.compliance.complianceScore += 25;
    }
  }

  private scheduleDelayedDelivery(notificationId: string, sendAt: Date): void {
    const delay = sendAt.getTime() - Date.now();
    setTimeout(() => {
      this.executeDelivery(notificationId);
    }, delay);
  }

  private async escalateOverdueNotification(notificationId: string): Promise<void> {
    console.log(`Escalating overdue notification ${notificationId}`);
    this.emit('notification_overdue', { notificationId });
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async personalizeContent(content: NotificationContent, recipient: NotificationRecipient): Promise<any> {
    return {
      ...content,
      body: content.body.replace('{{recipient_name}}', recipient.name)
    };
  }

  private selectDeliveryChannel(channels: DeliveryChannel[], recipient: NotificationRecipient): DeliveryChannel {
    // Select primary channel based on recipient preference and channel priority
    return channels.find(c => c.type === recipient.contactInfo.preferredMethod) || channels[0];
  }

  private async deliverViaChannel(channel: DeliveryChannel, recipient: NotificationRecipient, content: any): Promise<any> {
    const provider = this.deliveryProviders.get(channel.type);
    if (!provider) {
      throw new Error(`Delivery provider not found for channel: ${channel.type}`);
    }
    
    return await provider.send(recipient, content);
  }

  private async handleDeliveryFailure(notification: BreachNotification, recipient: NotificationRecipient, error: string): Promise<void> {
    notification.audit.push({
      timestamp: new Date(),
      action: 'DELIVERY_FAILED',
      actor: 'system',
      details: {
        recipientId: recipient.id,
        error,
        channel: recipient.contactInfo.preferredMethod
      }
    });

    // Trigger retry or escalation based on policy
    if (notification.delivery.retryPolicy.maxAttempts > 1) {
      // Schedule retry
      console.log(`Scheduling retry for recipient ${recipient.id}`);
    }
  }

  private async checkComplianceStatus(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (!notification) return;

    // Calculate compliance score based on various factors
    let score = 0;
    
    if (notification.compliance.contentCompliance) score += 25;
    if (notification.compliance.deadlineCompliance) score += 25;
    if (notification.compliance.deliveryCompliance) score += 25;
    if (notification.compliance.documentationComplete) score += 25;
    
    notification.compliance.complianceScore = score;
    notification.compliance.auditReady = score >= 90;
  }

  private calculateDeliveryStats(notification: BreachNotification): any {
    return {
      successful: notification.recipients.filter(r => r.deliveryStatus === NotificationStatus.DELIVERED).length,
      failed: notification.recipients.filter(r => r.deliveryStatus === NotificationStatus.FAILED).length,
      acknowledged: notification.recipients.filter(r => r.deliveryStatus === NotificationStatus.ACKNOWLEDGED).length
    };
  }

  private assessRegulatoryCompliance(notification: BreachNotification): any {
    return notification.regulatoryRequirements.map(req => ({
      regulation: req.regulation,
      jurisdiction: req.jurisdiction,
      status: req.status,
      onTime: new Date() <= req.notificationDeadline,
      evidence: req.evidence
    }));
  }

  private groupBy(array: any[], property: string): any {
    return array.reduce((acc, item) => {
      const key = item[property];
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  private calculateAverageComplianceScore(notifications: BreachNotification[]): number {
    if (notifications.length === 0) return 0;
    const total = notifications.reduce((sum, n) => sum + n.compliance.complianceScore, 0);
    return total / notifications.length;
  }

  private calculateOnTimeDeliveryRate(notifications: BreachNotification[]): number {
    if (notifications.length === 0) return 0;
    const onTime = notifications.filter(n => n.compliance.deadlineCompliance).length;
    return (onTime / notifications.length) * 100;
  }

  private calculateAcknowledmentRate(notifications: BreachNotification[]): number {
    const totalRecipients = notifications.reduce((sum, n) => sum + n.recipients.length, 0);
    if (totalRecipients === 0) return 0;
    
    const acknowledged = notifications.reduce((sum, n) => 
      sum + n.recipients.filter(r => r.deliveryStatus === NotificationStatus.ACKNOWLEDGED).length, 0
    );
    
    return (acknowledged / totalRecipients) * 100;
  }

  private calculateAverageDeliveryTime(notifications: BreachNotification[]): number {
    const delivered = notifications.filter(n => n.timeline.sentAt && n.timeline.deliveredAt);
    if (delivered.length === 0) return 0;
    
    const totalTime = delivered.reduce((sum, n) => 
      sum + (n.timeline.deliveredAt!.getTime() - n.timeline.sentAt!.getTime()), 0
    );
    
    return totalTime / delivered.length;
  }

  private calculateDeliverySuccessRate(notifications: BreachNotification[]): number {
    const totalRecipients = notifications.reduce((sum, n) => sum + n.recipients.length, 0);
    if (totalRecipients === 0) return 0;
    
    const successful = notifications.reduce((sum, n) => 
      sum + n.recipients.filter(r => r.deliveryStatus === NotificationStatus.DELIVERED).length, 0
    );
    
    return (successful / totalRecipients) * 100;
  }

  private calculateEscalationRate(notifications: BreachNotification[]): number {
    if (notifications.length === 0) return 0;
    const escalated = notifications.filter(n => n.timeline.escalatedAt).length;
    return (escalated / notifications.length) * 100;
  }
}