import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditRepository } from '../../repositories/audit.repository';
import * as CryptoJS from 'crypto-js';

export interface AuditLogRequest {
  accessType: 'read' | 'write' | 'analyze' | 'share';
  dataType: string;
  userId: string;
  accessedBy: string;
  purpose: string;
  educationalContext?: {
    courseId?: string;
    assignmentId?: string;
  };
}

export interface AuditLogResult {
  auditId: string;
  logged: boolean;
  immutableHash: string;
  notificationTriggered: boolean;
}

@Injectable()
export class AuditLoggerService {
  private readonly logger = new Logger(AuditLoggerService.name);

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    private auditRepository: AuditRepository,
  ) {}

  async logAccess(request: AuditLogRequest): Promise<AuditLogResult> {
    try {
      // Validate educational purpose
      if (!this.isValidEducationalPurpose(request.purpose)) {
        this.logger.warn('Invalid educational purpose for audit', { purpose: request.purpose });
      }

      // Create audit entry
      const auditEntry = {
        ...request,
        timestamp: new Date(),
        ipAddress: this.hashIpAddress('127.0.0.1'), // In real implementation, get from request
        sessionId: this.generateSessionId(),
        privacyFlags: this.determinePrivacyFlags(request),
      };

      // Generate immutable hash
      const immutableHash = this.generateImmutableHash(auditEntry);

      // Store in repository
      const result = await this.auditRepository.logAccess({
        ...auditEntry,
        immutableHash,
      });

      // Check if notification is needed
      const notificationTriggered = await this.checkNotificationTriggers(request);

      // Emit audit event
      await this.eventEmitter.emit('audit.logged', {
        auditId: result.id,
        accessType: request.accessType,
        userId: request.userId,
        dataType: request.dataType,
        timestamp: auditEntry.timestamp,
      });

      // Check for suspicious patterns
      await this.checkSuspiciousAccess(request);

      return {
        auditId: result.id,
        logged: true,
        immutableHash,
        notificationTriggered,
      };
    } catch (error) {
      this.logger.error('Failed to log audit entry', error);
      throw new Error('Audit logging failed');
    }
  }

  private isValidEducationalPurpose(purpose: string): boolean {
    const validPurposes = [
      'learning',
      'assessment',
      'feedback',
      'improvement',
      'research',
      'analytics',
      'support',
      'intervention',
    ];

    return validPurposes.some(valid => 
      purpose.toLowerCase().includes(valid)
    );
  }

  private hashIpAddress(ip: string): string {
    // Hash IP for privacy while maintaining uniqueness for pattern detection
    return CryptoJS.SHA256(ip + this.configService.get('AUDIT_SALT', 'default-salt')).toString();
  }

  private generateSessionId(): string {
    return 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  private determinePrivacyFlags(request: AuditLogRequest): string[] {
    const flags: string[] = [];

    // Check if accessing own data
    if (request.userId === request.accessedBy) {
      flags.push('self_access');
    }

    // Check if sensitive data type
    const sensitiveTypes = ['reflection', 'personal_notes', 'mental_health', 'family_situation'];
    if (sensitiveTypes.includes(request.dataType)) {
      flags.push('sensitive_data');
    }

    // Check access type sensitivity
    if (request.accessType === 'share') {
      flags.push('data_sharing');
    }

    // Check for cross-boundary access
    if (request.educationalContext?.courseId && request.accessedBy !== request.userId) {
      flags.push('educator_access');
    }

    return flags;
  }

  private generateImmutableHash(entry: any): string {
    // Create a deterministic string representation
    const dataString = JSON.stringify({
      ...entry,
      timestamp: entry.timestamp.toISOString(),
    });

    // Generate cryptographic hash
    return CryptoJS.SHA256(dataString).toString();
  }

  private async checkNotificationTriggers(request: AuditLogRequest): Promise<boolean> {
    const triggers = [];

    // Sensitive data access by others
    if (request.userId !== request.accessedBy && this.isSensitiveDataType(request.dataType)) {
      triggers.push('sensitive_access_by_other');
    }

    // Data sharing events
    if (request.accessType === 'share') {
      triggers.push('data_shared');
    }

    // First access of the day
    const todayAccess = await this.auditRepository.getAccessLogs(request.userId, {
      startDate: new Date().setHours(0, 0, 0, 0),
    });
    if (todayAccess.length === 0) {
      triggers.push('daily_first_access');
    }

    if (triggers.length > 0) {
      await this.eventEmitter.emit('audit.notification.required', {
        userId: request.userId,
        triggers,
        accessDetails: request,
      });
      return true;
    }

    return false;
  }

  private isSensitiveDataType(dataType: string): boolean {
    const sensitiveTypes = [
      'reflection',
      'personal_notes',
      'mental_health',
      'family_situation',
      'disciplinary_record',
      'medical_information',
    ];
    return sensitiveTypes.includes(dataType.toLowerCase());
  }

  private async checkSuspiciousAccess(request: AuditLogRequest): Promise<void> {
    // Get recent access logs
    const recentLogs = await this.auditRepository.getAccessLogs(request.accessedBy, {
      limit: 100,
      timeframe: '1h',
    });

    // Check for unusual patterns
    const suspiciousPatterns = [];

    // Rapid access pattern
    if (recentLogs.length > 50) {
      suspiciousPatterns.push('rapid_access');
    }

    // Accessing many different users
    const uniqueUsers = new Set(recentLogs.map(log => log.userId));
    if (uniqueUsers.size > 20) {
      suspiciousPatterns.push('broad_access_pattern');
    }

    // Late night access (simplified check)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      suspiciousPatterns.push('unusual_hours');
    }

    if (suspiciousPatterns.length > 0) {
      await this.eventEmitter.emit('audit.suspicious.activity', {
        accessedBy: request.accessedBy,
        patterns: suspiciousPatterns,
        details: request,
      });
    }
  }
}