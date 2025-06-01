/**
 * Audit Repository for tracking all data access operations
 * Provides immutable audit trail for compliance and security
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { 
  AuditEntry, 
  PrivacyContext 
} from '../types/privacy';

/**
 * Audit Repository Implementation with Prisma
 * Provides immutable audit logging for all data operations
 */
export class PrismaAuditRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Log a data access operation
   * Creates an immutable audit entry
   */
  async logAccess(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<AuditEntry> {
    const auditEntry: AuditEntry = {
      id: uuidv4(),
      timestamp: new Date(),
      ...entry
    };

    // For now, we'll store audit entries in memory or a simple format
    // In production, this would use a dedicated audit table
    console.log(`[AUDIT] ${auditEntry.operation} on ${auditEntry.entityType}:${auditEntry.entityId} by ${auditEntry.privacyContext.requesterId} - ${auditEntry.result}`, {
      context: auditEntry.privacyContext,
      metadata: auditEntry.accessMetadata,
      ...(auditEntry.denialReason && { denialReason: auditEntry.denialReason })
    });

    // TODO: Store in dedicated audit table when schema is updated
    // await this.prisma.auditLog.create({
    //   data: {
    //     id: auditEntry.id,
    //     operation: auditEntry.operation,
    //     entityType: auditEntry.entityType,
    //     entityId: auditEntry.entityId,
    //     requesterId: auditEntry.privacyContext.requesterId,
    //     requesterType: auditEntry.privacyContext.requesterType,
    //     purpose: auditEntry.privacyContext.purpose,
    //     result: auditEntry.result,
    //     timestamp: auditEntry.timestamp,
    //     metadata: auditEntry.accessMetadata || {},
    //     denialReason: auditEntry.denialReason,
    //     ipAddress: auditEntry.ipAddress,
    //     userAgent: auditEntry.userAgent
    //   }
    // });

    return auditEntry;
  }

  /**
   * Get audit trail for a specific entity
   */
  async getEntityAuditTrail(
    entityType: string, 
    entityId: string, 
    context: PrivacyContext
  ): Promise<AuditEntry[]> {
    // Log this access request
    await this.logAccess({
      operation: 'read',
      entityType: 'audit_trail',
      entityId: `${entityType}:${entityId}`,
      privacyContext: context,
      result: 'success',
      accessMetadata: {
        fieldsAccessed: ['audit_entries'],
        dataClassification: 'audit_data',
        consentRequired: false,
        consentStatus: 'not_applicable'
      }
    });

    // TODO: Implement actual audit trail retrieval from database
    // For now, return empty array as foundation
    return [];
  }

  /**
   * Get audit trail for a user
   */
  async getUserAuditTrail(userId: string, context: PrivacyContext): Promise<AuditEntry[]> {
    // Verify requester has permission to view this user's audit trail
    if (context.requesterType !== 'admin' && context.requesterId !== userId) {
      await this.logAccess({
        operation: 'read',
        entityType: 'user_audit_trail',
        entityId: userId,
        privacyContext: context,
        result: 'denied',
        denialReason: 'insufficient_permissions',
        accessMetadata: {
          dataClassification: 'audit_data',
          consentRequired: true,
          consentStatus: 'access_denied'
        }
      });
      throw new Error('Access denied: Insufficient permissions to view audit trail');
    }

    await this.logAccess({
      operation: 'read',
      entityType: 'user_audit_trail',
      entityId: userId,
      privacyContext: context,
      result: 'success',
      accessMetadata: {
        fieldsAccessed: ['audit_entries'],
        dataClassification: 'audit_data',
        consentRequired: false,
        consentStatus: 'authorized_access'
      }
    });

    // TODO: Implement actual user audit trail retrieval
    return [];
  }

  /**
   * Get audit summary for compliance reporting
   */
  async getAuditSummary(
    dateRange: { start: Date; end: Date }, 
    context: PrivacyContext
  ): Promise<{
    totalAccesses: number;
    deniedAccesses: number;
    accessesByType: Record<string, number>;
    accessesByUser: Record<string, number>;
  }> {
    // Only admins can access audit summaries
    if (context.requesterType !== 'admin') {
      await this.logAccess({
        operation: 'read',
        entityType: 'audit_summary',
        entityId: `${dateRange.start.toISOString()}_${dateRange.end.toISOString()}`,
        privacyContext: context,
        result: 'denied',
        denialReason: 'insufficient_permissions',
        accessMetadata: {
          dataClassification: 'audit_summary',
          consentRequired: false,
          consentStatus: 'access_denied'
        }
      });
      throw new Error('Access denied: Only administrators can access audit summaries');
    }

    await this.logAccess({
      operation: 'read',
      entityType: 'audit_summary',
      entityId: `${dateRange.start.toISOString()}_${dateRange.end.toISOString()}`,
      privacyContext: context,
      result: 'success',
      accessMetadata: {
        fieldsAccessed: ['audit_summary'],
        dataClassification: 'audit_summary',
        consentRequired: false,
        consentStatus: 'admin_access'
      }
    });

    // TODO: Implement actual audit summary calculation
    return {
      totalAccesses: 0,
      deniedAccesses: 0,
      accessesByType: {},
      accessesByUser: {}
    };
  }

  /**
   * Search audit entries with criteria
   */
  async searchAuditEntries(
    criteria: {
      entityType?: string;
      operation?: string;
      result?: string;
      userId?: string;
      dateRange?: { start: Date; end: Date };
    },
    context: PrivacyContext
  ): Promise<AuditEntry[]> {
    // Only admins and system users can search audit entries
    if (!['admin', 'system'].includes(context.requesterType)) {
      await this.logAccess({
        operation: 'read',
        entityType: 'audit_search',
        entityId: JSON.stringify(criteria),
        privacyContext: context,
        result: 'denied',
        denialReason: 'insufficient_permissions',
        accessMetadata: {
          dataClassification: 'audit_data',
          consentRequired: false,
          consentStatus: 'access_denied'
        }
      });
      throw new Error('Access denied: Insufficient permissions to search audit entries');
    }

    await this.logAccess({
      operation: 'read',
      entityType: 'audit_search',
      entityId: JSON.stringify(criteria),
      privacyContext: context,
      result: 'success',
      accessMetadata: {
        fieldsAccessed: ['audit_entries'],
        dataClassification: 'audit_data',
        consentRequired: false,
        consentStatus: 'authorized_search'
      }
    });

    // TODO: Implement actual audit search
    return [];
  }

  /**
   * Helper method to create audit context for system operations
   */
  static createSystemContext(purpose: string, correlationId?: string): PrivacyContext {
    return {
      requesterId: 'system',
      requesterType: 'system',
      purpose,
      timestamp: new Date(),
      correlationId,
      educationalJustification: 'System operation for data integrity and compliance'
    };
  }

  /**
   * Helper method to validate privacy context
   */
  private validatePrivacyContext(context: PrivacyContext): void {
    if (!context.requesterId || !context.requesterType || !context.purpose) {
      throw new Error('Invalid privacy context: requesterId, requesterType, and purpose are required');
    }
  }
}

/**
 * Mock Audit Repository for testing
 * Provides in-memory audit logging for development and testing
 */
export class MockAuditRepository {
  private auditEntries: AuditEntry[] = [];

  async logAccess(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<AuditEntry> {
    const auditEntry: AuditEntry = {
      id: uuidv4(),
      timestamp: new Date(),
      ...entry
    };

    this.auditEntries.push(auditEntry);
    
    // Console log for development visibility
    console.log(`[MOCK-AUDIT] ${auditEntry.operation} on ${auditEntry.entityType}:${auditEntry.entityId} by ${auditEntry.privacyContext.requesterId} - ${auditEntry.result}`);
    
    return auditEntry;
  }

  async getEntityAuditTrail(
    entityType: string, 
    entityId: string, 
    context: PrivacyContext
  ): Promise<AuditEntry[]> {
    await this.logAccess({
      operation: 'read',
      entityType: 'audit_trail',
      entityId: `${entityType}:${entityId}`,
      privacyContext: context,
      result: 'success'
    });

    return this.auditEntries.filter(
      entry => entry.entityType === entityType && entry.entityId === entityId
    );
  }

  async getUserAuditTrail(userId: string, context: PrivacyContext): Promise<AuditEntry[]> {
    if (context.requesterType !== 'admin' && context.requesterId !== userId) {
      await this.logAccess({
        operation: 'read',
        entityType: 'user_audit_trail',
        entityId: userId,
        privacyContext: context,
        result: 'denied',
        denialReason: 'insufficient_permissions'
      });
      throw new Error('Access denied: Insufficient permissions to view audit trail');
    }

    await this.logAccess({
      operation: 'read',
      entityType: 'user_audit_trail',
      entityId: userId,
      privacyContext: context,
      result: 'success'
    });

    return this.auditEntries.filter(
      entry => entry.privacyContext.requesterId === userId
    );
  }

  async getAuditSummary(
    dateRange: { start: Date; end: Date }, 
    context: PrivacyContext
  ): Promise<{
    totalAccesses: number;
    deniedAccesses: number;
    accessesByType: Record<string, number>;
    accessesByUser: Record<string, number>;
  }> {
    if (context.requesterType !== 'admin') {
      await this.logAccess({
        operation: 'read',
        entityType: 'audit_summary',
        entityId: `${dateRange.start.toISOString()}_${dateRange.end.toISOString()}`,
        privacyContext: context,
        result: 'denied',
        denialReason: 'insufficient_permissions'
      });
      throw new Error('Access denied: Only administrators can access audit summaries');
    }

    const entriesInRange = this.auditEntries.filter(
      entry => entry.timestamp >= dateRange.start && entry.timestamp <= dateRange.end
    );

    const summary = {
      totalAccesses: entriesInRange.length,
      deniedAccesses: entriesInRange.filter(e => e.result === 'denied').length,
      accessesByType: {} as Record<string, number>,
      accessesByUser: {} as Record<string, number>
    };

    entriesInRange.forEach(entry => {
      summary.accessesByType[entry.entityType] = (summary.accessesByType[entry.entityType] || 0) + 1;
      summary.accessesByUser[entry.privacyContext.requesterId] = (summary.accessesByUser[entry.privacyContext.requesterId] || 0) + 1;
    });

    await this.logAccess({
      operation: 'read',
      entityType: 'audit_summary',
      entityId: `${dateRange.start.toISOString()}_${dateRange.end.toISOString()}`,
      privacyContext: context,
      result: 'success'
    });

    return summary;
  }

  async searchAuditEntries(
    criteria: {
      entityType?: string;
      operation?: string;
      result?: string;
      userId?: string;
      dateRange?: { start: Date; end: Date };
    },
    context: PrivacyContext
  ): Promise<AuditEntry[]> {
    if (!['admin', 'system'].includes(context.requesterType)) {
      await this.logAccess({
        operation: 'read',
        entityType: 'audit_search',
        entityId: JSON.stringify(criteria),
        privacyContext: context,
        result: 'denied',
        denialReason: 'insufficient_permissions'
      });
      throw new Error('Access denied: Insufficient permissions to search audit entries');
    }

    let results = this.auditEntries;

    if (criteria.entityType) {
      results = results.filter(entry => entry.entityType === criteria.entityType);
    }
    if (criteria.operation) {
      results = results.filter(entry => entry.operation === criteria.operation);
    }
    if (criteria.result) {
      results = results.filter(entry => entry.result === criteria.result);
    }
    if (criteria.userId) {
      results = results.filter(entry => entry.privacyContext.requesterId === criteria.userId);
    }
    if (criteria.dateRange) {
      results = results.filter(entry => 
        entry.timestamp >= criteria.dateRange!.start && 
        entry.timestamp <= criteria.dateRange!.end
      );
    }

    await this.logAccess({
      operation: 'read',
      entityType: 'audit_search',
      entityId: JSON.stringify(criteria),
      privacyContext: context,
      result: 'success'
    });

    return results;
  }

  // Testing utility methods
  clearAuditEntries(): void {
    this.auditEntries = [];
  }

  getAuditEntries(): AuditEntry[] {
    return [...this.auditEntries];
  }
}

// Export both implementations
export type AuditRepository = PrismaAuditRepository | MockAuditRepository;