/**
 * Comprehensive Privacy Event System Tests
 * Tests for privacy events, encryption, filtering, and compliance
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { 
  InMemoryEventBus, 
  PrivacyEvent, 
  PrivacyEventUtils,
  EventHandler 
} from '../../events/EventBus';
import { 
  DataAccessAuditedEvent,
  StudentConsentUpdatedEvent,
  UnauthorizedAccessAttemptedEvent,
  ConsentVerificationEvent,
  EventTypes 
} from '../../events/events';
import { PrivacyEventSubscriber } from '../../events/subscribers/PrivacyEventSubscriber';
import { PrivacyMonitor } from '../../monitoring/PrivacyMonitor';
import { PrivacyCacheService } from '../../cache/PrivacyCacheService';

describe('Privacy Event System', () => {
  let eventBus: InMemoryEventBus;
  let privacySubscriber: PrivacyEventSubscriber;
  let privacyMonitor: PrivacyMonitor;
  let mockCacheService: any;

  beforeEach(() => {
    eventBus = new InMemoryEventBus();
    privacySubscriber = new PrivacyEventSubscriber();
    privacyMonitor = new PrivacyMonitor();
    
    // Mock cache service
    mockCacheService = {
      get: async () => null,
      set: async () => undefined,
      delete: async () => true,
      deletePattern: async () => 0
    };
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('Privacy Event Encryption and Decryption', () => {
    it('should hash student IDs for privacy', () => {
      const studentId = 'student-123';
      const hash1 = PrivacyEventUtils.hashStudentId(studentId);
      const hash2 = PrivacyEventUtils.hashStudentId(studentId);
      
      expect(hash1).toBe(hash2); // Consistent hashing
      expect(hash1).not.toBe(studentId); // Actually hashed
      expect(hash1).toHaveLength(16); // Expected length
    });

    it('should encrypt and decrypt sensitive payloads', () => {
      const originalPayload = {
        studentData: 'sensitive information',
        grades: [85, 92, 78],
        personalInfo: { email: 'student@example.com' }
      };

      const encrypted = PrivacyEventUtils.encryptPayload(originalPayload);
      const decrypted = PrivacyEventUtils.decryptPayload(encrypted);

      expect(encrypted).not.toBe(originalPayload);
      expect(typeof encrypted).toBe('string');
      expect(decrypted).toEqual(originalPayload);
    });

    it('should validate privacy event structure', () => {
      const validEvent: PrivacyEvent = {
        type: 'privacy.data.accessed',
        correlationId: 'test-123',
        timestamp: new Date(),
        category: 'audit',
        privacyLevel: 'confidential',
        studentIdHash: 'hash123',
        payload: { accessorId: 'test-user' },
        privacyContext: {
          dataMinimized: true,
          consentVerified: true,
          educationalPurpose: 'Testing'
        }
      };

      const invalidEvent1: any = {
        ...validEvent,
        category: undefined // Missing required field
      };

      const invalidEvent2: any = {
        ...validEvent,
        privacyLevel: 'confidential',
        payload: { studentId: 'raw-id' } // Raw student ID in confidential event
      };

      expect(PrivacyEventUtils.validatePrivacyEvent(validEvent)).toBe(true);
      expect(PrivacyEventUtils.validatePrivacyEvent(invalidEvent1)).toBe(false);
      expect(PrivacyEventUtils.validatePrivacyEvent(invalidEvent2)).toBe(false);
    });

    it('should minimize data based on privacy level', () => {
      const event: PrivacyEvent = {
        type: 'privacy.data.accessed',
        correlationId: 'test-123',
        timestamp: new Date(),
        category: 'audit',
        privacyLevel: 'confidential',
        payload: {
          studentId: 'student-123',
          sensitiveData: 'secret',
          regularData: 'normal'
        },
        privacyContext: {
          dataMinimized: true,
          consentVerified: true,
          educationalPurpose: 'Testing'
        }
      };

      const minimized = PrivacyEventUtils.minimizeEventData(event);

      expect(minimized.payload.studentId).toBeUndefined();
      expect(minimized.studentIdHash).toBeDefined();
      expect(minimized.encrypted).toBe(true);
      expect(minimized.payload.encrypted).toBeDefined();
    });
  });

  describe('Privacy Event Bus Functionality', () => {
    it('should publish and subscribe to privacy events', async () => {
      let handlerCalled = false;
      let receivedEvent: any = null;
      const handler = async (event: any) => {
        handlerCalled = true;
        receivedEvent = event;
      };
      const privacyEvent: DataAccessAuditedEvent = {
        type: 'privacy.data.accessed',
        correlationId: 'test-123',
        timestamp: new Date(),
        category: 'audit',
        privacyLevel: 'restricted',
        studentIdHash: 'hash123',
        payload: {
          accessorId: 'test-user',
          dataType: 'student-writing',
          purpose: 'educational-analysis',
          educationalJustification: 'Testing',
          accessTimestamp: new Date(),
          dataScope: { recordCount: 1 }
        },
        privacyContext: {
          dataMinimized: true,
          consentVerified: true,
          educationalPurpose: 'Testing'
        }
      };

      eventBus.subscribeToPrivacyEvents(
        'privacy.data.accessed',
        handler,
        'restricted'
      );

      await eventBus.publishPrivacyEvent(privacyEvent);

      expect(handlerCalled).toBe(true);
      expect(receivedEvent).toMatchObject({
        type: 'privacy.data.accessed',
        category: 'audit'
      });
    });

    it('should filter events based on privacy level', async () => {
      let restrictedHandlerCallCount = 0;
      let confidentialHandlerCallCount = 0;
      const restrictedHandler = async () => { restrictedHandlerCallCount++; };
      const confidentialHandler = async () => { confidentialHandlerCallCount++; };

      eventBus.subscribeToPrivacyEvents(
        'privacy.data.accessed',
        restrictedHandler,
        'restricted'
      );

      eventBus.subscribeToPrivacyEvents(
        'privacy.data.accessed',
        confidentialHandler,
        'confidential'
      );

      // Publish restricted event
      const restrictedEvent: DataAccessAuditedEvent = {
        type: 'privacy.data.accessed',
        correlationId: 'test-1',
        timestamp: new Date(),
        category: 'audit',
        privacyLevel: 'restricted',
        studentIdHash: 'hash123',
        payload: {
          accessorId: 'test-user',
          dataType: 'student-writing',
          purpose: 'educational-analysis',
          educationalJustification: 'Testing',
          accessTimestamp: new Date(),
          dataScope: { recordCount: 1 }
        },
        privacyContext: {
          dataMinimized: true,
          consentVerified: true,
          educationalPurpose: 'Testing'
        }
      };

      // Publish confidential event
      const confidentialEvent: DataAccessAuditedEvent = {
        ...restrictedEvent,
        correlationId: 'test-2',
        privacyLevel: 'confidential'
      };

      await eventBus.publishPrivacyEvent(restrictedEvent);
      await eventBus.publishPrivacyEvent(confidentialEvent);

      // Restricted handler should receive both (restricted >= restricted, confidential >= restricted)
      expect(restrictedHandlerCallCount).toBe(2);
      
      // Confidential handler should only receive confidential event
      expect(confidentialHandlerCallCount).toBe(1);
    });

    it('should reject invalid privacy events', async () => {
      const invalidEvent: any = {
        type: 'privacy.data.accessed',
        correlationId: 'test-123',
        timestamp: new Date(),
        // Missing required privacy fields
        payload: {}
      };

      await expect(eventBus.publishPrivacyEvent(invalidEvent)).rejects.toThrow('Invalid privacy event');
    });
  });

  describe('Privacy Event Subscribers', () => {
    let consoleLogSpy: jest.SpiedFunction<typeof console.log>;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      privacySubscriber.subscribeToPrivacyEvents(eventBus);
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    it('should handle data access audit events', async () => {
      const auditEvent: DataAccessAuditedEvent = {
        type: 'privacy.data.accessed',
        correlationId: 'audit-test',
        timestamp: new Date(),
        category: 'audit',
        privacyLevel: 'confidential',
        studentIdHash: 'hash123',
        payload: {
          accessorId: 'writing-analyzer',
          dataType: 'student-writing',
          purpose: 'educational-analysis',
          educationalJustification: 'Writing skill assessment',
          accessTimestamp: new Date(),
          dataScope: { recordCount: 5, studentCount: 1 }
        },
        privacyContext: {
          dataMinimized: true,
          consentVerified: true,
          educationalPurpose: 'Educational analysis'
        }
      };

      await eventBus.publish(auditEvent);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('📋 Data Access Audited: student-writing')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('🔒 CONFIDENTIAL DATA ACCESS')
      );
    });

    it('should handle consent update events', async () => {
      const consentEvent: StudentConsentUpdatedEvent = {
        type: 'privacy.consent.updated',
        correlationId: 'consent-test',
        timestamp: new Date(),
        category: 'consent',
        privacyLevel: 'restricted',
        studentIdHash: 'hash456',
        payload: {
          consentChanges: [{
            consentType: 'ai-analysis',
            previousValue: true,
            newValue: false,
            reason: 'Student request',
            consentScope: 'platform-wide'
          }],
          effectiveDate: new Date(),
          consentVersion: '1.0',
          triggeredBy: 'student',
          impactedServices: ['writing-analyzer', 'progress-tracker']
        },
        privacyContext: {
          dataMinimized: true,
          consentVerified: true,
          educationalPurpose: 'Consent management'
        }
      };

      await eventBus.publish(consentEvent);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('📝 Student Consent Updated: hash456')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('🚫 Consent withdrawn for ai-analysis')
      );
    });

    it('should handle unauthorized access events', async () => {
      const unauthorizedEvent: UnauthorizedAccessAttemptedEvent = {
        type: 'privacy.access.unauthorized',
        correlationId: 'security-test',
        timestamp: new Date(),
        category: 'access',
        privacyLevel: 'confidential',
        payload: {
          attemptedBy: 'malicious-user',
          attemptedByRole: 'unknown',
          resource: 'student-data',
          resourceType: 'student-data',
          reason: 'Invalid credentials',
          attemptTimestamp: new Date(),
          riskLevel: 'high',
          automaticActions: ['block-ip', 'alert-admin']
        },
        privacyContext: {
          dataMinimized: true,
          consentVerified: false,
          educationalPurpose: 'Security monitoring'
        }
      };

      await eventBus.publish(unauthorizedEvent);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('🚨 SECURITY ALERT: Unauthorized access attempt')
      );
    });

    it('should provide compliance metrics', () => {
      const metrics = privacySubscriber.getComplianceMetrics();
      
      expect(metrics).toHaveProperty('consentComplianceRate');
      expect(metrics).toHaveProperty('auditLogSize');
      expect(metrics).toHaveProperty('alertQueueSize');
      expect(typeof metrics.consentComplianceRate).toBe('string');
    });
  });

  describe('Privacy Cache Service', () => {
    let privacyCacheService: PrivacyCacheService;

    beforeEach(() => {
      privacyCacheService = new PrivacyCacheService(mockCacheService);
    });

    it('should respect privacy levels when caching', async () => {
      const sensitiveData = { studentProgress: 'confidential info' };
      
      await privacyCacheService.set(
        'test-key',
        sensitiveData,
        {
          privacyLevel: 'sensitive',
          studentConsent: true,
          anonymize: false,
          auditAccess: true,
          studentIdHash: 'hash123',
          educationalPurpose: 'Testing'
        },
        'test-accessor'
      );

      expect(mockCacheService.set).toHaveBeenCalledWith(
        'test-key',
        expect.any(Object),
        expect.objectContaining({
          ttl: expect.any(Number)
        })
      );
    });

    it('should deny access without consent', async () => {
      const result = await privacyCacheService.get(
        'test-key',
        {
          privacyLevel: 'sensitive',
          studentConsent: false,
          auditAccess: false
        },
        'test-accessor'
      );

      expect(result).toBeNull();
      expect(mockCacheService.get).not.toHaveBeenCalled();
    });

    it('should invalidate student cache on consent withdrawal', async () => {
      await privacyCacheService.invalidateStudentCache('hash123', 'consent-withdrawal');

      expect(mockCacheService.deletePattern).toHaveBeenCalledTimes(5); // 5 pattern types
    });
  });

  describe('Privacy Monitoring', () => {
    it('should start and stop monitoring', async () => {
      await privacyMonitor.startMonitoring();
      expect(privacyMonitor.getMonitoringStatus().isMonitoring).toBe(true);

      await privacyMonitor.stopMonitoring();
      expect(privacyMonitor.getMonitoringStatus().isMonitoring).toBe(false);
    });

    it('should provide current metrics', () => {
      const metrics = privacyMonitor.getCurrentMetrics();
      
      expect(metrics).toHaveProperty('dataAccessCount');
      expect(metrics).toHaveProperty('consentComplianceRate');
      expect(metrics).toHaveProperty('unauthorizedAccessAttempts');
      expect(metrics).toHaveProperty('privacyViolations');
    });

    it('should track pending alerts', () => {
      const alerts = privacyMonitor.getPendingAlerts();
      expect(Array.isArray(alerts)).toBe(true);
    });
  });

  describe('Consent Verification', () => {
    it('should verify consent for operations', async () => {
      const consentEvent: ConsentVerificationEvent = {
        type: 'privacy.consent.verified',
        correlationId: 'consent-verify-test',
        timestamp: new Date(),
        category: 'consent',
        privacyLevel: 'restricted',
        studentIdHash: 'hash789',
        payload: {
          verificationResult: 'valid',
          requestedOperation: 'writing-analysis',
          consentTypes: ['ai-analysis'],
          lastConsentUpdate: new Date(),
          gracePeriodApplied: false,
          fallbackAction: 'proceed-anonymized'
        },
        privacyContext: {
          dataMinimized: true,
          consentVerified: true,
          educationalPurpose: 'Consent verification'
        }
      };

      const handler = jest.fn();
      eventBus.subscribe('privacy.consent.verified', handler);
      
      await eventBus.publish(consentEvent);
      
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        type: 'privacy.consent.verified',
        payload: expect.objectContaining({
          verificationResult: 'valid'
        })
      }));
    });
  });

  describe('Event Integration Flow', () => {
    it('should handle complete privacy event flow', async () => {
      const handlers = {
        audit: jest.fn(),
        consent: jest.fn(),
        security: jest.fn()
      };

      // Subscribe to different event types
      eventBus.subscribe(EventTypes.DATA_ACCESS_AUDITED, handlers.audit);
      eventBus.subscribe(EventTypes.STUDENT_CONSENT_UPDATED, handlers.consent);
      eventBus.subscribe(EventTypes.UNAUTHORIZED_ACCESS_ATTEMPTED, handlers.security);

      // Start monitoring
      await privacyMonitor.startMonitoring();
      privacySubscriber.subscribeToPrivacyEvents(eventBus);

      // Publish a series of privacy events
      const events = [
        {
          type: 'privacy.data.accessed',
          correlationId: 'flow-1',
          timestamp: new Date(),
          category: 'audit' as const,
          privacyLevel: 'restricted' as const,
          studentIdHash: 'flow-hash',
          payload: {
            accessorId: 'system',
            dataType: 'test-data',
            purpose: 'testing',
            educationalJustification: 'Integration test',
            accessTimestamp: new Date(),
            dataScope: { recordCount: 1 }
          },
          privacyContext: {
            dataMinimized: true,
            consentVerified: true,
            educationalPurpose: 'Testing'
          }
        },
        {
          type: 'privacy.consent.updated',
          correlationId: 'flow-2',
          timestamp: new Date(),
          category: 'consent' as const,
          privacyLevel: 'restricted' as const,
          studentIdHash: 'flow-hash',
          payload: {
            consentChanges: [{
              consentType: 'data-sharing' as const,
              previousValue: false,
              newValue: true,
              consentScope: 'course-specific' as const
            }],
            effectiveDate: new Date(),
            consentVersion: '1.0',
            triggeredBy: 'student' as const,
            impactedServices: ['test-service']
          },
          privacyContext: {
            dataMinimized: true,
            consentVerified: true,
            educationalPurpose: 'Testing'
          }
        }
      ];

      for (const event of events) {
        await eventBus.publish(event);
      }

      // Verify all handlers were called
      expect(handlers.audit).toHaveBeenCalled();
      expect(handlers.consent).toHaveBeenCalled();

      // Verify monitoring captured events
      const metrics = privacyMonitor.getCurrentMetrics();
      expect(typeof metrics.dataAccessCount).toBe('number');

      await privacyMonitor.stopMonitoring();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed privacy events gracefully', async () => {
      const malformedEvent: any = {
        type: 'privacy.data.accessed',
        // Missing required fields
      };

      await expect(async () => {
        await eventBus.publishPrivacyEvent(malformedEvent);
      }).rejects.toThrow();
    });

    it('should handle encryption errors gracefully', () => {
      const invalidPayload = { circular: {} };
      invalidPayload.circular = invalidPayload; // Create circular reference

      expect(() => {
        PrivacyEventUtils.encryptPayload(invalidPayload);
      }).toThrow();
    });

    it('should handle missing privacy context', () => {
      const eventWithoutContext: any = {
        type: 'privacy.data.accessed',
        correlationId: 'test',
        timestamp: new Date(),
        category: 'audit',
        privacyLevel: 'restricted',
        payload: {}
        // Missing privacyContext
      };

      const isValid = PrivacyEventUtils.validatePrivacyEvent(eventWithoutContext);
      expect(isValid).toBe(false);
    });
  });
});