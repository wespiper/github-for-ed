import { Injectable } from '@nestjs/common';
import { Logger } from '../../monitoring/Logger';
import { EventBus } from '../../events/EventBus';
import { EventTypes, PrivacyIncidentEvent } from '../../events/events/PrivacyEvents';

export enum IncidentSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum IncidentType {
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  DATA_BREACH = 'data_breach',
  SYSTEM_COMPROMISE = 'system_compromise',
  PRIVACY_VIOLATION = 'privacy_violation',
  CONSENT_VIOLATION = 'consent_violation',
  DATA_LOSS = 'data_loss',
  THIRD_PARTY_BREACH = 'third_party_breach'
}

export enum IncidentStatus {
  DETECTED = 'detected',
  INVESTIGATING = 'investigating',
  CONTAINED = 'contained',
  ERADICATED = 'eradicated',
  RECOVERED = 'recovered',
  CLOSED = 'closed'
}

export interface PrivacyIncident {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  detectedAt: Date;
  description: string;
  affectedUsers: string[];
  affectedData: string[];
  containedAt?: Date;
  resolvedAt?: Date;
  PIRTLead: string;
  timeline: IncidentTimelineEntry[];
  notificationsSent: NotificationRecord[];
  evidenceCollected: EvidenceRecord[];
}

export interface IncidentTimelineEntry {
  timestamp: Date;
  action: string;
  performedBy: string;
  details: string;
}

export interface NotificationRecord {
  type: 'internal' | 'external' | 'regulatory' | 'user';
  recipient: string;
  sentAt: Date;
  deliveryStatus: 'sent' | 'delivered' | 'failed';
  template: string;
}

export interface EvidenceRecord {
  id: string;
  type: 'log' | 'screenshot' | 'report' | 'communication';
  description: string;
  collectedAt: Date;
  collectedBy: string;
  location: string;
  hash: string;
}

/**
 * Privacy Incident Response Service
 * 
 * Manages comprehensive privacy incident response including:
 * - PIRT (Privacy Incident Response Team) structure
 * - Automated incident detection and classification
 * - Incident response workflow orchestration
 * - Evidence collection and preservation
 * - Stakeholder notification management
 * - Regulatory reporting automation
 */
@Injectable()
export class PrivacyIncidentResponseService {
  private readonly logger = new Logger('PrivacyIncidentResponseService');
  private readonly incidents = new Map<string, PrivacyIncident>();
  private readonly PIRTMembers = new Map<string, PIRTMember>();

  constructor(private eventBus: EventBus) {
    this.initializePIRTStructure();
  }

  /**
   * Initialize Privacy Incident Response Team structure
   */
  private initializePIRTStructure(): void {
    this.logger.info('Initializing PIRT structure');

    // Define PIRT roles and responsibilities
    const PIRTRoles = [
      {
        id: 'pirt-lead',
        name: 'PIRT Lead',
        contact: 'pirt-lead@scribetree.com',
        phone: '+1-555-PRIVACY',
        responsibilities: [
          'Overall incident response coordination',
          'Stakeholder communication',
          'Decision making authority',
          'Regulatory notification oversight'
        ],
        availability: '24/7'
      },
      {
        id: 'privacy-officer',
        name: 'Privacy Officer',
        contact: 'privacy@scribetree.com',
        phone: '+1-555-PRIVATE',
        responsibilities: [
          'Privacy impact assessment',
          'Regulatory compliance guidance',
          'Student/parent notification',
          'Privacy law interpretation'
        ],
        availability: '24/7'
      },
      {
        id: 'security-lead',
        name: 'Security Lead',
        contact: 'security@scribetree.com',
        phone: '+1-555-SECURE',
        responsibilities: [
          'Technical incident investigation',
          'System containment and recovery',
          'Forensic evidence collection',
          'Security control enhancement'
        ],
        availability: '24/7'
      },
      {
        id: 'legal-counsel',
        name: 'Legal Counsel',
        contact: 'legal@scribetree.com',
        phone: '+1-555-LEGAL',
        responsibilities: [
          'Legal risk assessment',
          'Regulatory notification strategy',
          'Litigation prevention',
          'Compliance verification'
        ],
        availability: 'Business hours + on-call'
      },
      {
        id: 'communications-lead',
        name: 'Communications Lead',
        contact: 'communications@scribetree.com',
        phone: '+1-555-COMMS',
        responsibilities: [
          'External communications',
          'Media response',
          'Customer notification',
          'Reputation management'
        ],
        availability: 'Business hours + emergency'
      }
    ];

    PIRTRoles.forEach(role => {
      this.PIRTMembers.set(role.id, role as any);
    });

    this.logger.info('PIRT structure initialized with 5 roles');
  }

  /**
   * Detect and create new privacy incident
   */
  async detectIncident(
    type: IncidentType,
    description: string,
    detectionSource: string,
    metadata: any = {}
  ): Promise<PrivacyIncident> {
    const incidentId = `INC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const incident: PrivacyIncident = {
      id: incidentId,
      type,
      severity: this.classifyIncidentSeverity(type, metadata),
      status: IncidentStatus.DETECTED,
      detectedAt: new Date(),
      description,
      affectedUsers: metadata.affectedUsers || [],
      affectedData: metadata.affectedData || [],
      PIRTLead: 'pirt-lead',
      timeline: [
        {
          timestamp: new Date(),
          action: 'Incident Detected',
          performedBy: detectionSource,
          details: description
        }
      ],
      notificationsSent: [],
      evidenceCollected: []
    };

    this.incidents.set(incidentId, incident);

    // Immediate PIRT notification
    await this.notifyPIRT(incident);
    
    // Trigger automated response
    await this.triggerAutomatedResponse(incident);
    
    // Publish privacy incident event
    await this.publishIncidentEvent(incident, 'created');

    this.logger.warn('Privacy incident detected and PIRT activated', {
      incidentId,
      type,
      severity: incident.severity,
      affectedUsers: incident.affectedUsers.length
    });

    return incident;
  }

  /**
   * Classify incident severity based on type and metadata
   */
  private classifyIncidentSeverity(type: IncidentType, metadata: any): IncidentSeverity {
    const affectedUserCount = metadata.affectedUsers?.length || 0;
    const containsSensitiveData = metadata.containsSensitiveData || false;
    const isPublicExposure = metadata.isPublicExposure || false;

    // Critical severity classification
    if (isPublicExposure || affectedUserCount > 1000 || type === IncidentType.SYSTEM_COMPROMISE) {
      return IncidentSeverity.CRITICAL;
    }

    // High severity classification
    if (containsSensitiveData || affectedUserCount > 100 || type === IncidentType.DATA_BREACH) {
      return IncidentSeverity.HIGH;
    }

    // Medium severity classification
    if (affectedUserCount > 10 || type === IncidentType.PRIVACY_VIOLATION) {
      return IncidentSeverity.MEDIUM;
    }

    // Default to low severity
    return IncidentSeverity.LOW;
  }

  /**
   * Notify PIRT members of new incident
   */
  private async notifyPIRT(incident: PrivacyIncident): Promise<void> {
    const notification = {
      subject: `PRIVACY INCIDENT ALERT - ${incident.severity.toUpperCase()} - ${incident.id}`,
      message: `
        PRIVACY INCIDENT DETECTED
        
        Incident ID: ${incident.id}
        Type: ${incident.type}
        Severity: ${incident.severity}
        Detected: ${incident.detectedAt.toISOString()}
        Description: ${incident.description}
        Affected Users: ${incident.affectedUsers.length}
        
        IMMEDIATE ACTION REQUIRED
        PIRT activation initiated.
        
        Access incident details: https://privacy.scribetree.com/incidents/${incident.id}
      `,
      priority: incident.severity === IncidentSeverity.CRITICAL ? 'URGENT' : 'HIGH'
    };

    // Notify all PIRT members based on severity
    const membersToNotify = incident.severity === IncidentSeverity.CRITICAL ? 
      Array.from(this.PIRTMembers.keys()) : 
      ['pirt-lead', 'privacy-officer', 'security-lead'];

    for (const memberId of membersToNotify) {
      const member = this.PIRTMembers.get(memberId);
      if (member) {
        await this.sendNotification(incident, 'internal', member.contact, 'pirt-alert');
      }
    }

    this.logger.info('PIRT members notified', {
      incidentId: incident.id,
      membersNotified: membersToNotify.length
    });
  }

  /**
   * Trigger automated incident response actions
   */
  private async triggerAutomatedResponse(incident: PrivacyIncident): Promise<void> {
    this.logger.info('Triggering automated incident response', { incidentId: incident.id });

    // Immediate containment actions based on incident type
    switch (incident.type) {
      case IncidentType.UNAUTHORIZED_ACCESS:
        await this.triggerAccessRevocation(incident);
        break;
      case IncidentType.DATA_BREACH:
        await this.triggerDataContainment(incident);
        break;
      case IncidentType.SYSTEM_COMPROMISE:
        await this.triggerSystemIsolation(incident);
        break;
      default:
        await this.triggerGeneralContainment(incident);
    }

    // Start evidence collection
    await this.startEvidenceCollection(incident);
    
    // Begin impact assessment
    await this.beginImpactAssessment(incident);
  }

  /**
   * Update incident status and timeline
   */
  async updateIncidentStatus(
    incidentId: string,
    newStatus: IncidentStatus,
    performedBy: string,
    details: string
  ): Promise<PrivacyIncident> {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    const previousStatus = incident.status;
    incident.status = newStatus;

    // Add timeline entry
    incident.timeline.push({
      timestamp: new Date(),
      action: `Status changed from ${previousStatus} to ${newStatus}`,
      performedBy,
      details
    });

    // Update containment/resolution timestamps
    if (newStatus === IncidentStatus.CONTAINED && !incident.containedAt) {
      incident.containedAt = new Date();
    }
    if (newStatus === IncidentStatus.CLOSED && !incident.resolvedAt) {
      incident.resolvedAt = new Date();
    }

    // Trigger status-specific actions
    await this.handleStatusChange(incident, previousStatus, newStatus);

    // Publish status update event
    await this.publishIncidentEvent(incident, 'status_updated');

    this.logger.info('Incident status updated', {
      incidentId,
      previousStatus,
      newStatus,
      performedBy
    });

    return incident;
  }

  /**
   * Handle actions required for status changes
   */
  private async handleStatusChange(
    incident: PrivacyIncident,
    previousStatus: IncidentStatus,
    newStatus: IncidentStatus
  ): Promise<void> {
    switch (newStatus) {
      case IncidentStatus.CONTAINED:
        await this.handleIncidentContained(incident);
        break;
      case IncidentStatus.CLOSED:
        await this.handleIncidentClosed(incident);
        break;
    }
  }

  /**
   * Handle incident containment completion
   */
  private async handleIncidentContained(incident: PrivacyIncident): Promise<void> {
    // Begin notification process if required
    if (this.requiresExternalNotification(incident)) {
      await this.initiateExternalNotifications(incident);
    }

    // Begin detailed impact assessment
    await this.conductDetailedImpactAssessment(incident);
  }

  /**
   * Handle incident closure
   */
  private async handleIncidentClosed(incident: PrivacyIncident): Promise<void> {
    // Generate final incident report
    await this.generateIncidentReport(incident);
    
    // Conduct lessons learned session
    await this.scheduleLessonsLearnedSession(incident);
    
    // Update privacy controls if needed
    await this.evaluatePrivacyControlUpdates(incident);
  }

  /**
   * Determine if external notification is required
   */
  private requiresExternalNotification(incident: PrivacyIncident): boolean {
    // GDPR: 72-hour breach notification requirement
    const isGDPRBreach = incident.affectedUsers.length > 0 && 
                        (incident.type === IncidentType.DATA_BREACH || 
                         incident.type === IncidentType.UNAUTHORIZED_ACCESS);

    // FERPA: No specific timeline but "without unreasonable delay"
    const isFERPABreach = incident.affectedData.some(data => 
      data.includes('student') || data.includes('educational'));

    // High-risk incidents always require notification
    const isHighRisk = incident.severity === IncidentSeverity.CRITICAL || 
                       incident.severity === IncidentSeverity.HIGH;

    return isGDPRBreach || isFERPABreach || isHighRisk;
  }

  /**
   * Send notification
   */
  private async sendNotification(
    incident: PrivacyIncident,
    type: 'internal' | 'external' | 'regulatory' | 'user',
    recipient: string,
    template: string
  ): Promise<void> {
    const notificationRecord: NotificationRecord = {
      type,
      recipient,
      sentAt: new Date(),
      deliveryStatus: 'sent', // Would integrate with actual notification service
      template
    };

    incident.notificationsSent.push(notificationRecord);

    this.logger.info('Notification sent', {
      incidentId: incident.id,
      type,
      recipient: recipient.replace(/@.*/, '@***'), // Partially redact email
      template
    });
  }

  /**
   * Collect evidence for incident
   */
  async collectEvidence(
    incidentId: string,
    evidenceType: EvidenceRecord['type'],
    description: string,
    location: string,
    collectedBy: string
  ): Promise<void> {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    const evidence: EvidenceRecord = {
      id: `EVD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: evidenceType,
      description,
      collectedAt: new Date(),
      collectedBy,
      location,
      hash: this.generateEvidenceHash(location, description)
    };

    incident.evidenceCollected.push(evidence);

    // Add timeline entry
    incident.timeline.push({
      timestamp: new Date(),
      action: 'Evidence Collected',
      performedBy: collectedBy,
      details: `${evidenceType}: ${description}`
    });

    this.logger.info('Evidence collected', {
      incidentId,
      evidenceId: evidence.id,
      type: evidenceType,
      collectedBy
    });
  }

  /**
   * Generate hash for evidence integrity
   */
  private generateEvidenceHash(location: string, description: string): string {
    // Simple hash generation - in production would use cryptographic hash
    return Buffer.from(`${location}:${description}:${Date.now()}`).toString('base64');
  }

  /**
   * Get incident by ID
   */
  getIncident(incidentId: string): PrivacyIncident | undefined {
    return this.incidents.get(incidentId);
  }

  /**
   * Get all incidents with optional filtering
   */
  getIncidents(filter?: {
    status?: IncidentStatus;
    severity?: IncidentSeverity;
    type?: IncidentType;
    dateRange?: { start: Date; end: Date };
  }): PrivacyIncident[] {
    let incidents = Array.from(this.incidents.values());

    if (filter) {
      if (filter.status) {
        incidents = incidents.filter(i => i.status === filter.status);
      }
      if (filter.severity) {
        incidents = incidents.filter(i => i.severity === filter.severity);
      }
      if (filter.type) {
        incidents = incidents.filter(i => i.type === filter.type);
      }
      if (filter.dateRange) {
        incidents = incidents.filter(i => 
          i.detectedAt >= filter.dateRange!.start && 
          i.detectedAt <= filter.dateRange!.end
        );
      }
    }

    return incidents.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
  }

  /**
   * Publish privacy incident event
   */
  private async publishIncidentEvent(incident: PrivacyIncident, action: string): Promise<void> {
    const event: PrivacyIncidentEvent = {
      type: EventTypes.PRIVACY_INCIDENT,
      correlationId: incident.id,
      timestamp: new Date(),
      payload: {
        incidentId: incident.id,
        incidentType: incident.type,
        severity: incident.severity,
        status: incident.status,
        action,
        affectedUserCount: incident.affectedUsers.length
      },
      metadata: {
        source: 'PrivacyIncidentResponseService',
        version: '1.0'
      }
    };

    await this.eventBus.publish(event);
  }

  // Automated response helper methods
  private async triggerAccessRevocation(incident: PrivacyIncident): Promise<void> {
    this.logger.info('Triggering access revocation', { incidentId: incident.id });
  }

  private async triggerDataContainment(incident: PrivacyIncident): Promise<void> {
    this.logger.info('Triggering data containment', { incidentId: incident.id });
  }

  private async triggerSystemIsolation(incident: PrivacyIncident): Promise<void> {
    this.logger.info('Triggering system isolation', { incidentId: incident.id });
  }

  private async triggerGeneralContainment(incident: PrivacyIncident): Promise<void> {
    this.logger.info('Triggering general containment', { incidentId: incident.id });
  }

  private async startEvidenceCollection(incident: PrivacyIncident): Promise<void> {
    this.logger.info('Starting evidence collection', { incidentId: incident.id });
  }

  private async beginImpactAssessment(incident: PrivacyIncident): Promise<void> {
    this.logger.info('Beginning impact assessment', { incidentId: incident.id });
  }

  private async initiateExternalNotifications(incident: PrivacyIncident): Promise<void> {
    this.logger.info('Initiating external notifications', { incidentId: incident.id });
  }

  private async conductDetailedImpactAssessment(incident: PrivacyIncident): Promise<void> {
    this.logger.info('Conducting detailed impact assessment', { incidentId: incident.id });
  }

  private async generateIncidentReport(incident: PrivacyIncident): Promise<void> {
    this.logger.info('Generating incident report', { incidentId: incident.id });
  }

  private async scheduleLessonsLearnedSession(incident: PrivacyIncident): Promise<void> {
    this.logger.info('Scheduling lessons learned session', { incidentId: incident.id });
  }

  private async evaluatePrivacyControlUpdates(incident: PrivacyIncident): Promise<void> {
    this.logger.info('Evaluating privacy control updates', { incidentId: incident.id });
  }
}

interface PIRTMember {
  id: string;
  name: string;
  contact: string;
  phone: string;
  responsibilities: string[];
  availability: string;
}