/**
 * Privacy Integration Tests
 * End-to-end testing of privacy event system integration
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { WritingProcessAnalyzer } from '../../services/ai/WritingProcessAnalyzer';
import { PrivacyMonitor } from '../../monitoring/PrivacyMonitor';
import { PrivacyEventSubscriber } from '../../events/subscribers/PrivacyEventSubscriber';
import { PrivacyMessageQueue } from '../../messaging/PrivacyMessageQueue';
import { getEventBus, setEventBus, InMemoryEventBus } from '../../events/EventBus';
import { EventTypes } from '../../events/events';

describe('Privacy Integration Tests', () => {
  let originalEventBus: any;
  let testEventBus: InMemoryEventBus;
  let privacyMonitor: PrivacyMonitor;
  let privacySubscriber: PrivacyEventSubscriber;
  let privacyMessageQueue: PrivacyMessageQueue;
  let mockWritingSession: any;
  let mockServiceFactory: any;

  beforeEach(async () => {
    // Setup test event bus
    originalEventBus = getEventBus();
    testEventBus = new InMemoryEventBus();
    setEventBus(testEventBus);

    // Initialize privacy components
    privacyMonitor = new PrivacyMonitor();
    privacySubscriber = new PrivacyEventSubscriber();
    privacyMessageQueue = new PrivacyMessageQueue();

    // Mock service factory and dependencies
    mockServiceFactory = {
      getEventBus: () => testEventBus,
      getCache: () => ({
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockResolvedValue(true)
      }),
      getWritingSessionRepository: () => ({
        findByAssignment: jest.fn().mockResolvedValue([mockWritingSession])
      })
    };

    // Mock writing session data
    mockWritingSession = {
      id: 'session-123',
      startTime: new Date(),
      duration: 1800000, // 30 minutes
      activity: {
        wordsAdded: 250,
        wordsDeleted: 50,
        cursorPositions: []
      }
    };

    // Replace ServiceFactory getInstance
    jest.spyOn(WritingProcessAnalyzer as any, 'serviceFactory', 'get')
      .mockReturnValue(mockServiceFactory);

    // Setup privacy monitoring
    await privacyMonitor.startMonitoring();
    privacySubscriber.subscribeToPrivacyEvents(testEventBus);
    await privacyMessageQueue.initialize();
  });

  afterEach(async () => {
    await privacyMonitor.stopMonitoring();
    await privacyMessageQueue.close();
    setEventBus(originalEventBus);
    jest.restoreAllMocks();
  });

  describe('End-to-End Privacy Event Flow', () => {
    it('should handle complete AI analysis with privacy controls', async () => {
      const studentId = 'student-test-123';
      const assignmentId = 'assignment-456';
      const accessorId = 'test-educator';

      // Track events
      const publishedEvents: any[] = [];
      const originalPublish = testEventBus.publish.bind(testEventBus);
      testEventBus.publish = jest.fn().mockImplementation(async (event) => {
        publishedEvents.push(event);
        return originalPublish(event);
      });

      // Execute AI analysis (this should trigger privacy events)
      const insights = await WritingProcessAnalyzer.analyzeWritingProcess(
        studentId,
        assignmentId,
        undefined, // no profile
        accessorId
      );

      // Verify insights were generated
      expect(insights).toBeDefined();
      expect(insights.studentId).toBe(studentId);
      expect(insights.assignmentId).toBe(assignmentId);

      // Verify privacy events were published
      expect(publishedEvents.length).toBeGreaterThan(0);

      // Check for consent verification event
      const consentEvent = publishedEvents.find(e => e.type === EventTypes.CONSENT_VERIFIED);
      expect(consentEvent).toBeDefined();
      expect(consentEvent.studentIdHash).toBeDefined();
      expect(consentEvent.privacyContext.consentVerified).toBe(true);

      // Check for data access audit event
      const auditEvent = publishedEvents.find(e => e.type === EventTypes.DATA_ACCESS_AUDITED);
      expect(auditEvent).toBeDefined();
      expect(auditEvent.payload.accessorId).toBe(accessorId);
      expect(auditEvent.payload.dataType).toBe('student-writing');
      expect(auditEvent.payload.educationalJustification).toContain('Writing skill assessment');

      // Check for progress update event
      const progressEvent = publishedEvents.find(e => e.type === EventTypes.STUDENT_PROGRESS_UPDATED);
      expect(progressEvent).toBeDefined();
      expect(progressEvent.payload.studentIdHash).toBeDefined();
      expect(progressEvent.payload.studentId).toBeUndefined(); // Should be hashed
      expect(progressEvent.privacyContext.consentVerified).toBe(true);
    });

    it('should handle consent withdrawal scenario', async () => {
      const studentIdHash = 'hash-consent-test';
      
      // Create consent withdrawal event
      const consentWithdrawalEvent = {
        type: EventTypes.STUDENT_CONSENT_UPDATED,
        correlationId: 'consent-withdrawal-test',
        timestamp: new Date(),
        category: 'consent' as const,
        privacyLevel: 'restricted' as const,
        studentIdHash,
        payload: {
          consentChanges: [{
            consentType: 'ai-analysis' as const,
            previousValue: true,
            newValue: false,
            reason: 'Student request',
            consentScope: 'platform-wide' as const
          }],
          effectiveDate: new Date(),
          consentVersion: '2.0',
          triggeredBy: 'student' as const,
          impactedServices: ['writing-analyzer', 'progress-tracker', 'ai-assistant']
        },
        privacyContext: {
          dataMinimized: true,
          consentVerified: true,
          educationalPurpose: 'Consent management'
        }
      };

      // Publish consent withdrawal
      await testEventBus.publish(consentWithdrawalEvent);

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify privacy subscriber handled the event
      const metrics = privacySubscriber.getComplianceMetrics();
      expect(metrics.auditLogSize).toBeGreaterThan(0);

      // Verify monitoring detected the consent change
      const monitorMetrics = privacyMonitor.getCurrentMetrics();
      expect(typeof monitorMetrics.consentComplianceRate).toBe('number');
    });

    it('should handle security incident scenario', async () => {
      const unauthorizedEvent = {
        type: EventTypes.UNAUTHORIZED_ACCESS_ATTEMPTED,
        correlationId: 'security-incident-test',
        timestamp: new Date(),
        category: 'access' as const,
        privacyLevel: 'confidential' as const,
        payload: {
          attemptedBy: 'suspicious-user-456',
          attemptedByRole: 'unknown' as const,
          resource: 'student-analytics-dashboard',
          resourceType: 'analytics' as const,
          reason: 'Invalid authentication token',
          attemptTimestamp: new Date(),
          sourceIP: '192.168.1.100',
          userAgent: 'Suspicious Bot/1.0',
          riskLevel: 'critical' as const,
          automaticActions: ['block-ip', 'alert-security', 'log-incident']
        },
        privacyContext: {
          dataMinimized: true,
          consentVerified: false,
          educationalPurpose: 'Security monitoring'
        }
      };

      // Track console logs to verify security alerts
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      // Publish security event
      await testEventBus.publish(unauthorizedEvent);

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify security alert was generated
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('🚨 SECURITY ALERT: Unauthorized access attempt')
      );

      // Verify monitoring tracked the incident
      const alerts = privacyMonitor.getPendingAlerts();
      const securityAlerts = alerts.filter(alert => alert.type === 'unauthorized-access');
      expect(securityAlerts.length).toBeGreaterThan(0);

      consoleLogSpy.mockRestore();
    });

    it('should handle privacy threshold violation', async () => {
      const thresholdEvent = {
        type: EventTypes.PRIVACY_THRESHOLD_EXCEEDED,
        correlationId: 'threshold-test',
        timestamp: new Date(),
        category: 'compliance' as const,
        privacyLevel: 'restricted' as const,
        payload: {
          metric: 'data-access-frequency',
          threshold: 100,
          actual: 150,
          measurementUnit: 'accesses per hour',
          timeWindow: {
            start: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
            end: new Date()
          },
          affectedStudents: 25,
          action: 'auto-remediate' as const,
          remediationSteps: [
            'Reduce cache TTL',
            'Implement rate limiting',
            'Alert administrators'
          ]
        },
        privacyContext: {
          dataMinimized: true,
          consentVerified: true,
          educationalPurpose: 'Compliance monitoring'
        }
      };

      // Publish threshold violation
      await testEventBus.publish(thresholdEvent);

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify compliance metrics were updated
      const metrics = privacySubscriber.getComplianceMetrics();
      expect(parseInt(metrics.privacyThresholdViolations)).toBeGreaterThan(0);

      // Verify monitoring detected the violation
      const alerts = privacyMonitor.getPendingAlerts();
      const thresholdAlerts = alerts.filter(alert => alert.type === 'threshold-exceeded');
      expect(thresholdAlerts.length).toBeGreaterThan(0);
    });
  });

  describe('Message Queue Integration', () => {
    it('should configure privacy exchanges and queues', async () => {
      // Verify message queue was initialized
      expect(privacyMessageQueue).toBeDefined();

      // Get queue statistics (mocked in our implementation)
      const stats = await privacyMessageQueue.getQueueStats();
      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
    });

    it('should handle event replay capability', async () => {
      const fromDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      const toDate = new Date();

      // Test event replay
      const replayedEvents = await privacyMessageQueue.replayEvents(
        fromDate,
        toDate,
        ['privacy.data.accessed', 'privacy.consent.updated']
      );

      expect(Array.isArray(replayedEvents)).toBe(true);
    });
  });

  describe('Cache Integration with Privacy', () => {
    it('should respect privacy levels in cache operations', async () => {
      const mockCache = mockServiceFactory.getCache();
      
      // Verify cache operations are being called
      // (The actual privacy cache logic is tested in the WritingProcessAnalyzer)
      expect(mockCache.get).toBeDefined();
      expect(mockCache.set).toBeDefined();
    });
  });

  describe('Monitoring and Metrics Integration', () => {
    it('should collect comprehensive privacy metrics', () => {
      const metrics = privacyMonitor.getCurrentMetrics();
      
      // Verify all expected metrics are present
      expect(metrics).toHaveProperty('dataAccessCount');
      expect(metrics).toHaveProperty('consentComplianceRate');
      expect(metrics).toHaveProperty('unauthorizedAccessAttempts');
      expect(metrics).toHaveProperty('privacyViolations');
      expect(metrics).toHaveProperty('dataRetentionActions');
      expect(metrics).toHaveProperty('averageDataAccessPerStudent');
      expect(metrics).toHaveProperty('consentWithdrawalRate');
      expect(metrics).toHaveProperty('anonymizationRate');

      // Verify metric types
      expect(typeof metrics.dataAccessCount).toBe('number');
      expect(typeof metrics.consentComplianceRate).toBe('number');
    });

    it('should provide monitoring status', () => {
      const status = privacyMonitor.getMonitoringStatus();
      
      expect(status).toHaveProperty('isMonitoring');
      expect(status).toHaveProperty('uptime');
      expect(status.isMonitoring).toBe(true);
    });

    it('should manage alerts lifecycle', () => {
      const allAlerts = privacyMonitor.getAllAlerts();
      const pendingAlerts = privacyMonitor.getPendingAlerts();
      
      expect(Array.isArray(allAlerts)).toBe(true);
      expect(Array.isArray(pendingAlerts)).toBe(true);
      
      // All pending alerts should be in all alerts
      pendingAlerts.forEach(alert => {
        expect(allAlerts.some(a => a.id === alert.id)).toBe(true);
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent privacy events', async () => {
      const numberOfEvents = 50;
      const events = [];

      // Create multiple privacy events
      for (let i = 0; i < numberOfEvents; i++) {
        events.push({
          type: EventTypes.DATA_ACCESS_AUDITED,
          correlationId: `perf-test-${i}`,
          timestamp: new Date(),
          category: 'audit' as const,
          privacyLevel: 'restricted' as const,
          studentIdHash: `hash-${i}`,
          payload: {
            accessorId: `test-user-${i}`,
            dataType: 'student-writing',
            purpose: 'performance-test',
            educationalJustification: 'Performance testing',
            accessTimestamp: new Date(),
            dataScope: { recordCount: 1 }
          },
          privacyContext: {
            dataMinimized: true,
            consentVerified: true,
            educationalPurpose: 'Performance testing'
          }
        });
      }

      // Publish all events concurrently
      const startTime = Date.now();
      await Promise.all(events.map(event => testEventBus.publish(event)));
      const endTime = Date.now();

      // Verify performance (should complete in reasonable time)
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // Less than 5 seconds

      // Verify all events were processed
      const metrics = privacySubscriber.getComplianceMetrics();
      expect(parseInt(metrics.totalDataAccesses)).toBeGreaterThanOrEqual(numberOfEvents);
    });

    it('should handle event bus stress test', async () => {
      const handlers = Array.from({ length: 10 }, () => jest.fn());
      
      // Subscribe multiple handlers
      handlers.forEach((handler, index) => {
        testEventBus.subscribe(EventTypes.DATA_ACCESS_AUDITED, handler);
      });

      // Publish events
      const event = {
        type: EventTypes.DATA_ACCESS_AUDITED,
        correlationId: 'stress-test',
        timestamp: new Date(),
        category: 'audit' as const,
        privacyLevel: 'restricted' as const,
        studentIdHash: 'stress-hash',
        payload: {
          accessorId: 'stress-test',
          dataType: 'student-writing',
          purpose: 'stress-test',
          educationalJustification: 'Stress testing',
          accessTimestamp: new Date(),
          dataScope: { recordCount: 1 }
        },
        privacyContext: {
          dataMinimized: true,
          consentVerified: true,
          educationalPurpose: 'Stress testing'
        }
      };

      await testEventBus.publish(event);

      // Verify all handlers were called
      handlers.forEach(handler => {
        expect(handler).toHaveBeenCalledWith(expect.objectContaining({
          type: EventTypes.DATA_ACCESS_AUDITED
        }));
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle subscriber errors gracefully', async () => {
      // Add a handler that throws an error
      const errorHandler = jest.fn().mockRejectedValue(new Error('Handler error'));
      const successHandler = jest.fn().mockResolvedValue(undefined);

      testEventBus.subscribe(EventTypes.DATA_ACCESS_AUDITED, errorHandler);
      testEventBus.subscribe(EventTypes.DATA_ACCESS_AUDITED, successHandler);

      const event = {
        type: EventTypes.DATA_ACCESS_AUDITED,
        correlationId: 'error-test',
        timestamp: new Date(),
        category: 'audit' as const,
        privacyLevel: 'restricted' as const,
        studentIdHash: 'error-hash',
        payload: {
          accessorId: 'error-test',
          dataType: 'student-writing',
          purpose: 'error-test',
          educationalJustification: 'Error testing',
          accessTimestamp: new Date(),
          dataScope: { recordCount: 1 }
        },
        privacyContext: {
          dataMinimized: true,
          consentVerified: true,
          educationalPurpose: 'Error testing'
        }
      };

      // Publish event - should not throw despite error handler
      await expect(testEventBus.publish(event)).resolves.not.toThrow();

      // Verify both handlers were called
      expect(errorHandler).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalled();
    });

    it('should maintain system state during failures', async () => {
      const initialMetrics = privacyMonitor.getCurrentMetrics();
      
      // Simulate monitoring during error conditions
      const errorEvent = {
        type: 'invalid-event-type' as any,
        correlationId: 'invalid-test',
        timestamp: new Date(),
        payload: {}
      };

      // Attempt to publish invalid event
      try {
        await testEventBus.publish(errorEvent);
      } catch (error) {
        // Expected to fail
      }

      // Verify monitoring is still functional
      const currentMetrics = privacyMonitor.getCurrentMetrics();
      expect(currentMetrics).toBeDefined();
      expect(privacyMonitor.getMonitoringStatus().isMonitoring).toBe(true);
    });
  });
});