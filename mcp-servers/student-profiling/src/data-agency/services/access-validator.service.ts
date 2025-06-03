import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrivacyConfig } from '../../config/privacy.config';

export interface AccessRequest {
  requesterId: string;
  requesterType: 'teacher' | 'peer' | 'platform' | 'researcher';
  studentId: string;
  purpose: string;
  dataTypes: string[];
  studentBenefit: string;
}

export interface AccessValidationResult {
  requestId: string;
  approved: boolean;
  accessToken?: string;
  restrictions: AccessRestriction[];
  expiresAt?: Date;
  reason?: string;
  auditLog: AuditLogEntry;
}

export interface AccessRestriction {
  type: 'field' | 'time' | 'operation' | 'aggregation';
  description: string;
  value: any;
}

export interface AuditLogEntry {
  timestamp: Date;
  requesterId: string;
  studentId: string;
  action: string;
  result: 'approved' | 'denied';
  dataTypes: string[];
  purpose: string;
}

export interface AccessToken {
  tokenId: string;
  requesterId: string;
  studentId: string;
  permissions: string[];
  restrictions: AccessRestriction[];
  issuedAt: Date;
  expiresAt: Date;
  revoked: boolean;
}

@Injectable()
export class AccessValidatorService {
  private readonly logger = new Logger(AccessValidatorService.name);
  private accessTokens: Map<string, AccessToken> = new Map();
  private auditLogs: AuditLogEntry[] = [];

  async validateAccessRequest(request: AccessRequest): Promise<AccessValidationResult> {
    this.logger.log(`Validating access request from ${request.requesterId} for student ${request.studentId}`);

    const requestId = uuidv4();
    const validationResult = await this.performValidation(request);
    
    // Create audit log entry
    const auditLog: AuditLogEntry = {
      timestamp: new Date(),
      requesterId: request.requesterId,
      studentId: request.studentId,
      action: `ACCESS_REQUEST_${request.dataTypes.join('_')}`,
      result: validationResult.approved ? 'approved' : 'denied',
      dataTypes: request.dataTypes,
      purpose: request.purpose,
    };

    this.auditLogs.push(auditLog);

    if (validationResult.approved) {
      // Generate access token
      const token = await this.generateAccessToken(request, validationResult.restrictions);
      
      return {
        requestId,
        approved: true,
        accessToken: token.tokenId,
        restrictions: validationResult.restrictions,
        expiresAt: token.expiresAt,
        auditLog,
      };
    }

    return {
      requestId,
      approved: false,
      restrictions: [],
      reason: validationResult.reason,
      auditLog,
    };
  }

  async revokeAccess(tokenId: string, reason: string): Promise<boolean> {
    const token = this.accessTokens.get(tokenId);
    if (!token) {
      this.logger.warn(`Token not found: ${tokenId}`);
      return false;
    }

    token.revoked = true;
    this.accessTokens.set(tokenId, token);

    // Log revocation
    this.auditLogs.push({
      timestamp: new Date(),
      requesterId: token.requesterId,
      studentId: token.studentId,
      action: 'ACCESS_REVOKED',
      result: 'approved',
      dataTypes: token.permissions,
      purpose: `Revoked: ${reason}`,
    });

    this.logger.log(`Access revoked for token: ${tokenId}`);
    return true;
  }

  async checkTokenValidity(tokenId: string): Promise<{
    valid: boolean;
    reason?: string;
  }> {
    const token = this.accessTokens.get(tokenId);
    
    if (!token) {
      return { valid: false, reason: 'Token not found' };
    }

    if (token.revoked) {
      return { valid: false, reason: 'Token has been revoked' };
    }

    if (new Date() > token.expiresAt) {
      return { valid: false, reason: 'Token has expired' };
    }

    return { valid: true };
  }

  async getAccessLogs(
    studentId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<AuditLogEntry[]> {
    let logs = this.auditLogs.filter(log => log.studentId === studentId);

    if (timeRange) {
      logs = logs.filter(log => 
        log.timestamp >= timeRange.start && log.timestamp <= timeRange.end
      );
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getActiveAccessCount(studentId: string): Promise<number> {
    let count = 0;
    const now = new Date();

    for (const [_, token] of this.accessTokens) {
      if (token.studentId === studentId && 
          !token.revoked && 
          token.expiresAt > now) {
        count++;
      }
    }

    return count;
  }

  // Private helper methods
  private async performValidation(request: AccessRequest): Promise<{
    approved: boolean;
    restrictions: AccessRestriction[];
    reason?: string;
  }> {
    // Check student privacy choices
    const privacyChoices = await this.getStudentPrivacyChoices(request.studentId);

    // Validate based on requester type
    switch (request.requesterType) {
      case 'teacher':
        return this.validateTeacherAccess(request, privacyChoices);
      case 'peer':
        return this.validatePeerAccess(request, privacyChoices);
      case 'platform':
        return this.validatePlatformAccess(request, privacyChoices);
      case 'researcher':
        return this.validateResearcherAccess(request, privacyChoices);
      default:
        return {
          approved: false,
          restrictions: [],
          reason: 'Unknown requester type',
        };
    }
  }

  private async validateTeacherAccess(
    request: AccessRequest,
    privacyChoices: any
  ): Promise<{ approved: boolean; restrictions: AccessRestriction[]; reason?: string }> {
    if (!privacyChoices.educationalSharing.teacher) {
      return {
        approved: false,
        restrictions: [],
        reason: 'Student has not consented to teacher data sharing',
      };
    }

    // Check if teacher has legitimate educational interest
    const hasLegitimateInterest = await this.checkLegitimateEducationalInterest(
      request.requesterId,
      request.studentId,
      request.purpose
    );

    if (!hasLegitimateInterest) {
      return {
        approved: false,
        restrictions: [],
        reason: 'No legitimate educational interest established',
      };
    }

    // Apply restrictions based on data types
    const restrictions: AccessRestriction[] = [
      {
        type: 'time',
        description: 'Access limited to current semester',
        value: { duration: '6_months' },
      },
      {
        type: 'field',
        description: 'Sensitive personal information excluded',
        value: { exclude: ['medical_info', 'family_details', 'psychological_notes'] },
      },
    ];

    return { approved: true, restrictions };
  }

  private async validatePeerAccess(
    request: AccessRequest,
    privacyChoices: any
  ): Promise<{ approved: boolean; restrictions: AccessRestriction[]; reason?: string }> {
    if (!privacyChoices.educationalSharing.peer) {
      return {
        approved: false,
        restrictions: [],
        reason: 'Student has not consented to peer data sharing',
      };
    }

    // Very limited peer access
    const restrictions: AccessRestriction[] = [
      {
        type: 'aggregation',
        description: 'Data must be aggregated/anonymized',
        value: { minGroupSize: 5 },
      },
      {
        type: 'field',
        description: 'Only shared learning artifacts',
        value: { include: ['shared_documents', 'public_achievements'] },
      },
    ];

    return { approved: true, restrictions };
  }

  private async validatePlatformAccess(
    request: AccessRequest,
    privacyChoices: any
  ): Promise<{ approved: boolean; restrictions: AccessRestriction[]; reason?: string }> {
    const restrictions: AccessRestriction[] = [];

    // Check what platform improvements are consented
    if (privacyChoices.platformImprovement.anonymousPatterns) {
      restrictions.push({
        type: 'aggregation',
        description: 'Patterns must be anonymized',
        value: { anonymize: true },
      });
    } else {
      return {
        approved: false,
        restrictions: [],
        reason: 'Platform improvement analytics not consented',
      };
    }

    return { approved: true, restrictions };
  }

  private async validateResearcherAccess(
    request: AccessRequest,
    privacyChoices: any
  ): Promise<{ approved: boolean; restrictions: AccessRestriction[]; reason?: string }> {
    if (!privacyChoices.platformImprovement.research) {
      return {
        approved: false,
        restrictions: [],
        reason: 'Research participation not consented',
      };
    }

    // Strict restrictions for research
    const restrictions: AccessRestriction[] = [
      {
        type: 'aggregation',
        description: 'All data must be de-identified',
        value: { deIdentify: true, minGroupSize: 20 },
      },
      {
        type: 'operation',
        description: 'Read-only access',
        value: { operations: ['read'] },
      },
      {
        type: 'time',
        description: 'Access limited to study period',
        value: { duration: '90_days' },
      },
    ];

    return { approved: true, restrictions };
  }

  private async generateAccessToken(
    request: AccessRequest,
    restrictions: AccessRestriction[]
  ): Promise<AccessToken> {
    const token: AccessToken = {
      tokenId: uuidv4(),
      requesterId: request.requesterId,
      studentId: request.studentId,
      permissions: request.dataTypes,
      restrictions,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + PrivacyConfig.accessControl.maxAccessDuration),
      revoked: false,
    };

    this.accessTokens.set(token.tokenId, token);
    return token;
  }

  private async getStudentPrivacyChoices(studentId: string): Promise<any> {
    // Mock implementation - fetch from privacy choices service
    return {
      educationalSharing: {
        teacher: true,
        peer: false,
        parent: true,
      },
      platformImprovement: {
        anonymousPatterns: true,
        featureAnalytics: true,
        research: false,
      },
    };
  }

  private async checkLegitimateEducationalInterest(
    teacherId: string,
    studentId: string,
    purpose: string
  ): Promise<boolean> {
    // Mock implementation - check if teacher actually teaches this student
    // and if the purpose is legitimate
    const legitimatePurposes = [
      'grade_assignment',
      'provide_feedback',
      'track_progress',
      'intervention_planning',
      'parent_communication',
    ];

    return legitimatePurposes.some(p => purpose.toLowerCase().includes(p));
  }
}