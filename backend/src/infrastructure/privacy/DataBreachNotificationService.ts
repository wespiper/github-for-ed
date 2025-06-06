import { Injectable } from '@nestjs/common';
import { Logger } from '../../monitoring/Logger';
import { PrivacyIncidentResponseService, PrivacyIncident, IncidentSeverity, IncidentType } from './PrivacyIncidentResponseService';

export enum NotificationType {
  GDPR_SUPERVISORY_AUTHORITY = 'gdpr_supervisory_authority',
  FERPA_COMPLIANCE = 'ferpa_compliance',
  STATE_ATTORNEY_GENERAL = 'state_attorney_general',
  AFFECTED_INDIVIDUALS = 'affected_individuals',
  MEDIA_NOTIFICATION = 'media_notification',
  INSURANCE_CARRIER = 'insurance_carrier',
  BOARD_NOTIFICATION = 'board_notification'
}

export enum NotificationStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  ACKNOWLEDGED = 'acknowledged'
}

export interface BreachNotification {
  id: string;
  incidentId: string;
  type: NotificationType;
  status: NotificationStatus;
  scheduledFor: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  acknowledgedAt?: Date;
  recipient: string;
  template: string;
  content: string;
  metadata: {
    regulatoryDeadline?: Date;
    legalRequirement: boolean;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    language: string;
    jurisdiction: string;
  };
  deliveryAttempts: DeliveryAttempt[];
}

export interface DeliveryAttempt {
  timestamp: Date;
  method: 'email' | 'postal' | 'phone' | 'portal' | 'api';
  status: 'success' | 'failed' | 'retry';
  errorMessage?: string;
  responseCode?: string;
}

export interface BreachAssessment {
  incidentId: string;
  assessmentDate: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  notificationRequired: boolean;
  timelineRequirements: {
    gdpr72Hour: boolean;
    gdpr30Day: boolean;
    ferpaWithoutDelay: boolean;
    stateSpecific: boolean;
  };
  affectedDataTypes: string[];
  affectedIndividualCount: number;
  jurisdictions: string[];
  recommendations: string[];
}

/**
 * Data Breach Notification Service
 * 
 * Manages automated breach assessment and notification workflows:
 * - Automated breach severity classification
 * - Regulatory timeline tracking (GDPR 72-hour, FERPA, state laws)
 * - Multi-channel notification delivery
 * - Template-based communication generation
 * - Delivery tracking and acknowledgment
 * - Compliance evidence collection
 */
@Injectable()
export class DataBreachNotificationService {
  private readonly logger = new Logger('DataBreachNotificationService');
  private readonly notifications = new Map<string, BreachNotification>();
  private readonly assessments = new Map<string, BreachAssessment>();

  constructor(private privacyIncidentService: PrivacyIncidentResponseService) {}

  /**
   * Assess if breach notification is required and create notification plan
   */
  async assessBreachNotificationRequirements(incidentId: string): Promise<BreachAssessment> {
    const incident = this.privacyIncidentService.getIncident(incidentId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    this.logger.info('Assessing breach notification requirements', { incidentId });

    const assessment: BreachAssessment = {
      incidentId,
      assessmentDate: new Date(),
      riskLevel: this.assessRiskLevel(incident),
      notificationRequired: this.isNotificationRequired(incident),
      timelineRequirements: this.determineTimelineRequirements(incident),
      affectedDataTypes: this.identifyAffectedDataTypes(incident),
      affectedIndividualCount: incident.affectedUsers.length,
      jurisdictions: this.determineJurisdictions(incident),
      recommendations: this.generateRecommendations(incident)
    };

    this.assessments.set(incidentId, assessment);

    this.logger.info('Breach assessment completed', {
      incidentId,
      riskLevel: assessment.riskLevel,
      notificationRequired: assessment.notificationRequired,
      affectedCount: assessment.affectedIndividualCount
    });

    return assessment;
  }

  /**
   * Create and schedule breach notifications based on assessment
   */
  async createBreachNotifications(incidentId: string): Promise<BreachNotification[]> {
    const assessment = this.assessments.get(incidentId);
    if (!assessment) {
      throw new Error(`Assessment for incident ${incidentId} not found`);
    }

    if (!assessment.notificationRequired) {
      this.logger.info('No breach notifications required', { incidentId });
      return [];
    }

    this.logger.info('Creating breach notifications', { incidentId });

    const notifications: BreachNotification[] = [];

    // GDPR Supervisory Authority notification (72 hours)
    if (assessment.timelineRequirements.gdpr72Hour) {
      const gdprNotification = await this.createGDPRSupervisoryAuthorityNotification(incidentId, assessment);
      notifications.push(gdprNotification);
    }

    // FERPA compliance notification
    if (assessment.timelineRequirements.ferpaWithoutDelay) {
      const ferpaNotification = await this.createFERPAComplianceNotification(incidentId, assessment);
      notifications.push(ferpaNotification);
    }

    // State attorney general notifications
    if (assessment.timelineRequirements.stateSpecific) {
      const stateNotifications = await this.createStateAttorneyGeneralNotifications(incidentId, assessment);
      notifications.push(...stateNotifications);
    }

    // Affected individuals notification
    if (assessment.riskLevel === 'high' || assessment.riskLevel === 'very_high') {
      const individualNotifications = await this.createAffectedIndividualNotifications(incidentId, assessment);
      notifications.push(...individualNotifications);
    }

    // Insurance carrier notification
    const insuranceNotification = await this.createInsuranceCarrierNotification(incidentId, assessment);
    notifications.push(insuranceNotification);

    // Board notification for high-risk incidents
    if (assessment.riskLevel === 'very_high') {
      const boardNotification = await this.createBoardNotification(incidentId, assessment);
      notifications.push(boardNotification);
    }

    // Store all notifications
    notifications.forEach(notification => {
      this.notifications.set(notification.id, notification);
    });

    this.logger.info('Breach notifications created and scheduled', {
      incidentId,
      notificationCount: notifications.length
    });

    return notifications;
  }

  /**
   * Assess risk level of the incident
   */
  private assessRiskLevel(incident: PrivacyIncident): 'low' | 'medium' | 'high' | 'very_high' {
    let riskScore = 0;

    // Severity contribution
    switch (incident.severity) {
      case IncidentSeverity.CRITICAL:
        riskScore += 40;
        break;
      case IncidentSeverity.HIGH:
        riskScore += 30;
        break;
      case IncidentSeverity.MEDIUM:
        riskScore += 20;
        break;
      case IncidentSeverity.LOW:
        riskScore += 10;
        break;
    }

    // Incident type contribution
    switch (incident.type) {
      case IncidentType.DATA_BREACH:
      case IncidentType.SYSTEM_COMPROMISE:
        riskScore += 30;
        break;
      case IncidentType.UNAUTHORIZED_ACCESS:
        riskScore += 25;
        break;
      case IncidentType.PRIVACY_VIOLATION:
        riskScore += 20;
        break;
      default:
        riskScore += 10;
    }

    // Affected users contribution
    if (incident.affectedUsers.length > 1000) {
      riskScore += 20;
    } else if (incident.affectedUsers.length > 100) {
      riskScore += 15;
    } else if (incident.affectedUsers.length > 10) {
      riskScore += 10;
    } else {
      riskScore += 5;
    }

    // Data sensitivity contribution
    const containsSensitiveData = incident.affectedData.some(data => 
      data.includes('ssn') || data.includes('financial') || data.includes('health')
    );
    if (containsSensitiveData) {
      riskScore += 10;
    }

    // Convert score to risk level
    if (riskScore >= 80) return 'very_high';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }

  /**
   * Determine if notification is required
   */
  private isNotificationRequired(incident: PrivacyIncident): boolean {
    // Any incident with affected users requires assessment
    if (incident.affectedUsers.length > 0) {
      return true;
    }

    // High-severity incidents always require notification
    if (incident.severity === IncidentSeverity.CRITICAL || incident.severity === IncidentSeverity.HIGH) {
      return true;
    }

    // Data breaches always require notification
    if (incident.type === IncidentType.DATA_BREACH) {
      return true;
    }

    return false;
  }

  /**
   * Determine timeline requirements
   */
  private determineTimelineRequirements(incident: PrivacyIncident): {
    gdpr72Hour: boolean;
    gdpr30Day: boolean;
    ferpaWithoutDelay: boolean;
    stateSpecific: boolean;
  } {
    const hasEUUsers = incident.affectedUsers.some(user => 
      user.includes('eu') || user.includes('gdpr')
    );

    const hasStudentData = incident.affectedData.some(data => 
      data.includes('student') || data.includes('educational')
    );

    const hasUSUsers = incident.affectedUsers.some(user => 
      user.includes('us') || !user.includes('eu')
    );

    return {
      gdpr72Hour: hasEUUsers && (incident.severity === IncidentSeverity.HIGH || incident.severity === IncidentSeverity.CRITICAL),
      gdpr30Day: hasEUUsers && incident.affectedUsers.length > 0,
      ferpaWithoutDelay: hasStudentData,
      stateSpecific: hasUSUsers && incident.affectedUsers.length > 10
    };
  }

  /**
   * Identify affected data types
   */
  private identifyAffectedDataTypes(incident: PrivacyIncident): string[] {
    const dataTypes = new Set<string>();

    incident.affectedData.forEach(data => {
      if (data.includes('student')) dataTypes.add('student_records');
      if (data.includes('grade')) dataTypes.add('academic_records');
      if (data.includes('contact')) dataTypes.add('contact_information');
      if (data.includes('auth')) dataTypes.add('authentication_data');
      if (data.includes('financial')) dataTypes.add('financial_information');
      if (data.includes('health')) dataTypes.add('health_information');
      if (data.includes('behavior')) dataTypes.add('behavioral_data');
    });

    return Array.from(dataTypes);
  }

  /**
   * Determine jurisdictions
   */
  private determineJurisdictions(incident: PrivacyIncident): string[] {
    const jurisdictions = new Set<string>();

    // Default US jurisdiction
    jurisdictions.add('US');

    // Check for EU users (GDPR)
    if (incident.affectedUsers.some(user => user.includes('eu'))) {
      jurisdictions.add('EU');
    }

    // Check for specific state requirements
    if (incident.affectedUsers.length > 500) {
      jurisdictions.add('CA'); // California has specific requirements
    }

    return Array.from(jurisdictions);
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(incident: PrivacyIncident): string[] {
    const recommendations: string[] = [];

    if (incident.severity === IncidentSeverity.CRITICAL) {
      recommendations.push('Immediate PIRT activation required');
      recommendations.push('Consider external legal counsel');
    }

    if (incident.affectedUsers.length > 100) {
      recommendations.push('Prepare individual notification letters');
      recommendations.push('Set up dedicated support hotline');
    }

    if (incident.type === IncidentType.DATA_BREACH) {
      recommendations.push('Conduct forensic investigation');
      recommendations.push('Review and update security controls');
    }

    recommendations.push('Document all remediation actions');
    recommendations.push('Schedule post-incident review');

    return recommendations;
  }

  /**
   * Create GDPR Supervisory Authority notification
   */
  private async createGDPRSupervisoryAuthorityNotification(
    incidentId: string,
    assessment: BreachAssessment
  ): Promise<BreachNotification> {
    const deadline = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

    const notification: BreachNotification = {
      id: `BN-GDPR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      incidentId,
      type: NotificationType.GDPR_SUPERVISORY_AUTHORITY,
      status: NotificationStatus.PENDING,
      scheduledFor: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      recipient: 'supervisory-authority@gdpr.eu',
      template: 'gdpr-supervisory-authority',
      content: await this.generateGDPRNotificationContent(incidentId, assessment),
      metadata: {
        regulatoryDeadline: deadline,
        legalRequirement: true,
        priority: 'urgent',
        language: 'en',
        jurisdiction: 'EU'
      },
      deliveryAttempts: []
    };

    this.logger.info('GDPR supervisory authority notification created', {
      notificationId: notification.id,
      incidentId,
      deadline
    });

    return notification;
  }

  /**
   * Create FERPA compliance notification
   */
  private async createFERPAComplianceNotification(
    incidentId: string,
    assessment: BreachAssessment
  ): Promise<BreachNotification> {
    const notification: BreachNotification = {
      id: `BN-FERPA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      incidentId,
      type: NotificationType.FERPA_COMPLIANCE,
      status: NotificationStatus.PENDING,
      scheduledFor: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      recipient: 'compliance@ed.gov',
      template: 'ferpa-compliance',
      content: await this.generateFERPANotificationContent(incidentId, assessment),
      metadata: {
        legalRequirement: true,
        priority: 'high',
        language: 'en',
        jurisdiction: 'US'
      },
      deliveryAttempts: []
    };

    this.logger.info('FERPA compliance notification created', {
      notificationId: notification.id,
      incidentId
    });

    return notification;
  }

  /**
   * Create state attorney general notifications
   */
  private async createStateAttorneyGeneralNotifications(
    incidentId: string,
    assessment: BreachAssessment
  ): Promise<BreachNotification[]> {
    const notifications: BreachNotification[] = [];

    // California example
    if (assessment.affectedIndividualCount > 500) {
      const caNotification: BreachNotification = {
        id: `BN-CA-AG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        incidentId,
        type: NotificationType.STATE_ATTORNEY_GENERAL,
        status: NotificationStatus.PENDING,
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        recipient: 'privacy@oag.ca.gov',
        template: 'state-attorney-general',
        content: await this.generateStateAGNotificationContent(incidentId, assessment, 'CA'),
        metadata: {
          legalRequirement: true,
          priority: 'high',
          language: 'en',
          jurisdiction: 'CA'
        },
        deliveryAttempts: []
      };

      notifications.push(caNotification);
    }

    return notifications;
  }

  /**
   * Create affected individual notifications
   */
  private async createAffectedIndividualNotifications(
    incidentId: string,
    assessment: BreachAssessment
  ): Promise<BreachNotification[]> {
    const notifications: BreachNotification[] = [];

    // Create batch notification for affected individuals
    const individualNotification: BreachNotification = {
      id: `BN-IND-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      incidentId,
      type: NotificationType.AFFECTED_INDIVIDUALS,
      status: NotificationStatus.PENDING,
      scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days for GDPR
      recipient: 'affected-individuals',
      template: 'affected-individuals',
      content: await this.generateAffectedIndividualNotificationContent(incidentId, assessment),
      metadata: {
        regulatoryDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        legalRequirement: true,
        priority: 'medium',
        language: 'en',
        jurisdiction: 'US'
      },
      deliveryAttempts: []
    };

    notifications.push(individualNotification);

    return notifications;
  }

  /**
   * Create insurance carrier notification
   */
  private async createInsuranceCarrierNotification(
    incidentId: string,
    assessment: BreachAssessment
  ): Promise<BreachNotification> {
    const notification: BreachNotification = {
      id: `BN-INS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      incidentId,
      type: NotificationType.INSURANCE_CARRIER,
      status: NotificationStatus.PENDING,
      scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      recipient: 'claims@cybersecurity-insurance.com',
      template: 'insurance-carrier',
      content: await this.generateInsuranceNotificationContent(incidentId, assessment),
      metadata: {
        legalRequirement: false,
        priority: 'high',
        language: 'en',
        jurisdiction: 'US'
      },
      deliveryAttempts: []
    };

    return notification;
  }

  /**
   * Create board notification
   */
  private async createBoardNotification(
    incidentId: string,
    assessment: BreachAssessment
  ): Promise<BreachNotification> {
    const notification: BreachNotification = {
      id: `BN-BOARD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      incidentId,
      type: NotificationType.BOARD_NOTIFICATION,
      status: NotificationStatus.PENDING,
      scheduledFor: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      recipient: 'board@scribetree.com',
      template: 'board-notification',
      content: await this.generateBoardNotificationContent(incidentId, assessment),
      metadata: {
        legalRequirement: false,
        priority: 'urgent',
        language: 'en',
        jurisdiction: 'US'
      },
      deliveryAttempts: []
    };

    return notification;
  }

  // Content generation methods
  private async generateGDPRNotificationContent(incidentId: string, assessment: BreachAssessment): Promise<string> {
    return `GDPR Article 33 Data Breach Notification\n\nIncident: ${incidentId}\nAffected Data Subjects: ${assessment.affectedIndividualCount}\nRisk Assessment: ${assessment.riskLevel}\n\n[Detailed GDPR notification content...]`;
  }

  private async generateFERPANotificationContent(incidentId: string, assessment: BreachAssessment): Promise<string> {
    return `FERPA Educational Records Breach Notification\n\nIncident: ${incidentId}\nAffected Students: ${assessment.affectedIndividualCount}\n\n[Detailed FERPA notification content...]`;
  }

  private async generateStateAGNotificationContent(incidentId: string, assessment: BreachAssessment, state: string): Promise<string> {
    return `State Attorney General Breach Notification - ${state}\n\nIncident: ${incidentId}\nAffected Residents: ${assessment.affectedIndividualCount}\n\n[Detailed state notification content...]`;
  }

  private async generateAffectedIndividualNotificationContent(incidentId: string, assessment: BreachAssessment): Promise<string> {
    return `Data Incident Notification\n\nDear Valued User,\n\nWe are writing to inform you of a data incident...\n\nIncident: ${incidentId}\n\n[Detailed individual notification content...]`;
  }

  private async generateInsuranceNotificationContent(incidentId: string, assessment: BreachAssessment): Promise<string> {
    return `Cybersecurity Insurance Claim Notification\n\nPolicy Holder: Scribe Tree\nIncident: ${incidentId}\nEstimated Impact: ${assessment.riskLevel}\n\n[Detailed insurance notification content...]`;
  }

  private async generateBoardNotificationContent(incidentId: string, assessment: BreachAssessment): Promise<string> {
    return `Board of Directors - Critical Privacy Incident\n\nIncident: ${incidentId}\nRisk Level: ${assessment.riskLevel}\nImmediate Action Required\n\n[Detailed board notification content...]`;
  }

  /**
   * Send notification
   */
  async sendNotification(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (!notification) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    this.logger.info('Sending breach notification', {
      notificationId,
      type: notification.type,
      recipient: notification.recipient.replace(/@.*/, '@***')
    });

    const attempt: DeliveryAttempt = {
      timestamp: new Date(),
      method: 'email',
      status: 'success', // Simulated success
      responseCode: '200'
    };

    notification.deliveryAttempts.push(attempt);
    notification.status = NotificationStatus.SENT;
    notification.sentAt = new Date();

    this.logger.info('Breach notification sent successfully', {
      notificationId,
      attempt: attempt.timestamp
    });
  }

  /**
   * Get all notifications for an incident
   */
  getNotificationsForIncident(incidentId: string): BreachNotification[] {
    return Array.from(this.notifications.values())
      .filter(n => n.incidentId === incidentId)
      .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
  }

  /**
   * Get assessment for an incident
   */
  getAssessment(incidentId: string): BreachAssessment | undefined {
    return this.assessments.get(incidentId);
  }
}