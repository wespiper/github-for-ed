import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrivacyEventPublisherService } from '../events/privacy-event-publisher.service';
import * as crypto from 'crypto';

/**
 * Privacy-Enhanced Repository Service
 * Provides encrypted storage and audit trail capabilities for writing analysis data
 */

export interface PrivacyMetadata {
  userId: string;
  role: 'student' | 'educator' | 'administrator';
  purpose: string;
  hasConsent: boolean;
  isMinor: boolean;
  retentionPeriod: string;
  encryptionLevel: 'none' | 'standard' | 'high';
  auditRequired: boolean;
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  accessType: 'read' | 'write' | 'update' | 'delete';
  dataType: string;
  purpose: string;
  accessedBy: string;
  ipAddress?: string;
  userAgent?: string;
  result: 'success' | 'failure' | 'partial';
  encryptedHash: string;
}

export interface EncryptedData {
  encryptedContent: string;
  iv: string;
  algorithm: string;
  keyId: string;
  timestamp: Date;
}

@Injectable()
export class PrivacyEnhancedRepositoryService {
  private readonly logger = new Logger(PrivacyEnhancedRepositoryService.name);
  private readonly encryptionKey: string;
  private readonly algorithm = 'aes-256-cbc';

  constructor(
    private configService: ConfigService,
    private privacyEventPublisher: PrivacyEventPublisherService,
  ) {
    this.encryptionKey = this.configService.get<string>('ENCRYPTION_KEY') || 
                        crypto.randomBytes(32).toString('hex');
  }

  /**
   * Store writing content with privacy protection
   */
  async storeWritingContent(
    contentId: string,
    content: string,
    metadata: PrivacyMetadata,
    contentType: 'essay' | 'reflection' | 'notes' | 'feedback' = 'essay'
  ): Promise<{ success: boolean; encryptedId: string; auditId: string }> {
    try {
      // Encrypt content if required
      let storedContent = content;
      let encryptionMetadata: EncryptedData | null = null;

      if (metadata.encryptionLevel !== 'none') {
        encryptionMetadata = this.encryptContent(content);
        storedContent = JSON.stringify(encryptionMetadata);
      }

      // Create audit entry
      const auditEntry = await this.createAuditEntry({
        userId: metadata.userId,
        accessType: 'write',
        dataType: `writing_content_${contentType}`,
        purpose: metadata.purpose,
        accessedBy: metadata.userId,
        result: 'success',
      });

      // Publish privacy event
      await this.privacyEventPublisher.publishWritingDataAccessed({
        userId: metadata.userId,
        accessType: 'write',
        dataType: 'writing_content',
        accessedBy: metadata.userId,
        accessedByRole: metadata.role,
        purpose: metadata.purpose,
        recordCount: 1,
      });

      // Store with privacy metadata (mock implementation)
      const encryptedId = this.generateEncryptedId(contentId);
      
      this.logger.log('Writing content stored with privacy protection', {
        contentId: encryptedId,
        encrypted: metadata.encryptionLevel !== 'none',
        auditId: auditEntry.id,
      });

      return {
        success: true,
        encryptedId,
        auditId: auditEntry.id,
      };

    } catch (error) {
      this.logger.error('Failed to store writing content:', error);
      
      // Create failure audit entry
      await this.createAuditEntry({
        userId: metadata.userId,
        accessType: 'write',
        dataType: 'writing_content',
        purpose: metadata.purpose,
        accessedBy: metadata.userId,
        result: 'failure',
      });

      throw error;
    }
  }

  /**
   * Retrieve writing content with privacy checks
   */
  async retrieveWritingContent(
    contentId: string,
    accessorId: string,
    accessorRole: 'student' | 'educator' | 'administrator',
    purpose: string
  ): Promise<{ content: string; auditId: string; privacyProtected: boolean }> {
    try {
      // Create audit entry for access
      const auditEntry = await this.createAuditEntry({
        userId: contentId, // Using contentId as proxy for data owner
        accessType: 'read',
        dataType: 'writing_content',
        purpose,
        accessedBy: accessorId,
        result: 'success',
      });

      // Publish privacy event
      await this.privacyEventPublisher.publishWritingDataAccessed({
        userId: contentId,
        accessType: 'read',
        dataType: 'writing_content',
        accessedBy: accessorId,
        accessedByRole: accessorRole,
        purpose,
        recordCount: 1,
      });

      // Mock content retrieval and decryption
      const mockEncryptedContent = this.encryptContent('Sample writing content for privacy testing');
      const decryptedContent = this.decryptContent(mockEncryptedContent);

      this.logger.log('Writing content retrieved with privacy audit', {
        contentId: this.generateEncryptedId(contentId),
        accessorId: this.hashUserId(accessorId),
        auditId: auditEntry.id,
      });

      return {
        content: decryptedContent,
        auditId: auditEntry.id,
        privacyProtected: true,
      };

    } catch (error) {
      this.logger.error('Failed to retrieve writing content:', error);
      
      // Create failure audit entry
      await this.createAuditEntry({
        userId: contentId,
        accessType: 'read',
        dataType: 'writing_content',
        purpose,
        accessedBy: accessorId,
        result: 'failure',
      });

      throw error;
    }
  }

  /**
   * Store reflection data with enhanced privacy
   */
  async storeReflectionData(
    reflectionId: string,
    reflectionContent: string,
    qualityMetrics: any,
    metadata: PrivacyMetadata
  ): Promise<{ success: boolean; encryptedId: string; auditId: string }> {
    try {
      // Always encrypt reflection data (highly sensitive)
      const encryptedReflection = this.encryptContent(reflectionContent);
      const encryptedMetrics = this.encryptContent(JSON.stringify(qualityMetrics));

      // Create audit entry
      const auditEntry = await this.createAuditEntry({
        userId: metadata.userId,
        accessType: 'write',
        dataType: 'reflection_data',
        purpose: metadata.purpose,
        accessedBy: metadata.userId,
        result: 'success',
      });

      // Publish privacy event
      await this.privacyEventPublisher.publishWritingDataAccessed({
        userId: metadata.userId,
        accessType: 'write',
        dataType: 'reflection',
        accessedBy: metadata.userId,
        accessedByRole: metadata.role,
        purpose: metadata.purpose,
        recordCount: 1,
      });

      const encryptedId = this.generateEncryptedId(reflectionId);

      this.logger.log('Reflection data stored with enhanced privacy', {
        reflectionId: encryptedId,
        encrypted: true,
        auditId: auditEntry.id,
        hasQualityMetrics: !!qualityMetrics,
      });

      return {
        success: true,
        encryptedId,
        auditId: auditEntry.id,
      };

    } catch (error) {
      this.logger.error('Failed to store reflection data:', error);
      throw error;
    }
  }

  /**
   * Store aggregated analytics with differential privacy
   */
  async storeAnalyticsData(
    analyticsId: string,
    analyticsData: any,
    aggregationLevel: 'individual' | 'class' | 'institution',
    metadata: PrivacyMetadata
  ): Promise<{ success: boolean; encryptedId: string; auditId: string }> {
    try {
      // Apply differential privacy for aggregated data
      let processedData = analyticsData;
      
      if (aggregationLevel !== 'individual') {
        processedData = this.applyDifferentialPrivacy(analyticsData, aggregationLevel);
      }

      // Encrypt processed data
      const encryptedData = this.encryptContent(JSON.stringify(processedData));

      // Create audit entry
      const auditEntry = await this.createAuditEntry({
        userId: metadata.userId,
        accessType: 'write',
        dataType: `analytics_${aggregationLevel}`,
        purpose: metadata.purpose,
        accessedBy: metadata.userId,
        result: 'success',
      });

      // Publish privacy event
      await this.privacyEventPublisher.publishPrivacyAnalyticsGenerated({
        userId: metadata.userId,
        analyticsType: 'class_insights',
        aggregationLevel,
        recipientRole: metadata.role,
        educationalPurpose: metadata.purpose,
        consentBasis: metadata.hasConsent ? ['explicit_consent'] : ['legitimate_interest'],
      });

      const encryptedId = this.generateEncryptedId(analyticsId);

      this.logger.log('Analytics data stored with differential privacy', {
        analyticsId: encryptedId,
        aggregationLevel,
        differentialPrivacy: aggregationLevel !== 'individual',
        auditId: auditEntry.id,
      });

      return {
        success: true,
        encryptedId,
        auditId: auditEntry.id,
      };

    } catch (error) {
      this.logger.error('Failed to store analytics data:', error);
      throw error;
    }
  }

  /**
   * Get audit trail for compliance reporting
   */
  async getAuditTrail(
    userId: string,
    startDate: Date,
    endDate: Date,
    accessorRole: 'student' | 'educator' | 'administrator'
  ): Promise<AuditEntry[]> {
    try {
      // Create audit entry for audit trail access
      await this.createAuditEntry({
        userId,
        accessType: 'read',
        dataType: 'audit_trail',
        purpose: 'Compliance reporting and transparency',
        accessedBy: userId,
        result: 'success',
      });

      // Mock audit trail data
      const mockAuditEntries: AuditEntry[] = [
        {
          id: 'audit-1',
          timestamp: new Date(),
          userId: this.hashUserId(userId),
          accessType: 'read',
          dataType: 'writing_content',
          purpose: 'Self-assessment review',
          accessedBy: this.hashUserId(userId),
          result: 'success',
          encryptedHash: this.generateHash('audit-entry-1'),
        },
        {
          id: 'audit-2', 
          timestamp: new Date(Date.now() - 3600000),
          userId: this.hashUserId(userId),
          accessType: 'write',
          dataType: 'reflection_data',
          purpose: 'Reflection submission',
          accessedBy: this.hashUserId(userId),
          result: 'success',
          encryptedHash: this.generateHash('audit-entry-2'),
        },
      ];

      this.logger.log('Audit trail retrieved', {
        userId: this.hashUserId(userId),
        entriesCount: mockAuditEntries.length,
        accessorRole,
      });

      return mockAuditEntries;

    } catch (error) {
      this.logger.error('Failed to retrieve audit trail:', error);
      throw error;
    }
  }

  /**
   * Clean up expired data based on retention policies
   */
  async cleanupExpiredData(): Promise<{ deletedCount: number; auditId: string }> {
    try {
      // Mock cleanup implementation
      const deletedCount = 0; // Would implement actual cleanup logic

      const auditEntry = await this.createAuditEntry({
        userId: 'system',
        accessType: 'delete',
        dataType: 'expired_data',
        purpose: 'Retention policy compliance',
        accessedBy: 'system',
        result: 'success',
      });

      this.logger.log('Data cleanup completed', {
        deletedCount,
        auditId: auditEntry.id,
      });

      return {
        deletedCount,
        auditId: auditEntry.id,
      };

    } catch (error) {
      this.logger.error('Failed to cleanup expired data:', error);
      throw error;
    }
  }

  // Private helper methods

  private encryptContent(content: string): EncryptedData {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
    
    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encryptedContent: encrypted,
      iv: iv.toString('hex'),
      algorithm: this.algorithm,
      keyId: 'key-1', // In production, use proper key management
      timestamp: new Date(),
    };
  }

  private decryptContent(encryptedData: EncryptedData): string {
    const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
    
    let decrypted = decipher.update(encryptedData.encryptedContent, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  private applyDifferentialPrivacy(data: any, level: string): any {
    // Simple noise addition for differential privacy
    const epsilon = level === 'class' ? 1.0 : 0.5;
    const noiseScale = 1.0 / epsilon;

    // Add Laplace noise to numerical values
    const processedData = { ...data };
    
    Object.keys(processedData).forEach(key => {
      if (typeof processedData[key] === 'number') {
        const noise = this.generateLaplaceNoise(noiseScale);
        processedData[key] = Math.max(0, processedData[key] + noise);
      }
    });

    return processedData;
  }

  private generateLaplaceNoise(scale: number): number {
    // Simple Laplace noise generation
    const u = Math.random() - 0.5;
    return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }

  private async createAuditEntry(data: {
    userId: string;
    accessType: 'read' | 'write' | 'update' | 'delete';
    dataType: string;
    purpose: string;
    accessedBy: string;
    result: 'success' | 'failure' | 'partial';
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditEntry> {
    const auditEntry: AuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId: this.hashUserId(data.userId),
      accessType: data.accessType,
      dataType: data.dataType,
      purpose: data.purpose,
      accessedBy: this.hashUserId(data.accessedBy),
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      result: data.result,
      encryptedHash: this.generateHash(JSON.stringify(data)),
    };

    // In production, store audit entry in secure, immutable storage
    this.logger.debug('Audit entry created', {
      id: auditEntry.id,
      type: auditEntry.accessType,
      dataType: auditEntry.dataType,
    });

    return auditEntry;
  }

  private generateEncryptedId(originalId: string): string {
    return crypto.createHash('sha256').update(originalId).digest('hex').substring(0, 16);
  }

  private hashUserId(userId: string): string {
    return crypto.createHash('sha256').update(userId).digest('hex').substring(0, 16);
  }

  private generateHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}