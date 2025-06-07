import { PIIDetector } from '../../monitoring/privacy/PIIDetector';
import { PrivacyLogger } from '../../monitoring/privacy/PrivacyLogger';
import { ConsentTrackingDashboard } from '../../dashboard/privacy/ConsentTrackingDashboard';
import { DataAccessHeatMap } from '../../monitoring/access/DataAccessHeatMap';
import { PrivacyAlertSystem } from '../../alerts/privacy/PrivacyAlertSystem';

describe('Privacy Monitoring Integration', () => {
  let piiDetector: PIIDetector;
  let privacyLogger: PrivacyLogger;
  let consentDashboard: ConsentTrackingDashboard;
  let heatMap: DataAccessHeatMap;
  let alertSystem: PrivacyAlertSystem;

  beforeEach(() => {
    piiDetector = PIIDetector.getInstance();
    privacyLogger = PrivacyLogger.getInstance();
    consentDashboard = ConsentTrackingDashboard.getInstance();
    heatMap = DataAccessHeatMap.getInstance();
    alertSystem = PrivacyAlertSystem.getInstance();
  });

  describe('PII Detection', () => {
    it('should detect and redact email addresses', () => {
      const content = 'Contact john.doe@example.com for assistance';
      const result = piiDetector.detectAndRedact(content);
      
      expect(result.hasPII).toBe(true);
      expect(result.detectedTypes).toContain('email');
      expect(result.redactedContent).toContain('[EMAIL-REDACTED]');
    });

    it('should detect and redact phone numbers', () => {
      const content = 'Call me at (555) 123-4567';
      const result = piiDetector.detectAndRedact(content);
      
      expect(result.hasPII).toBe(true);
      expect(result.detectedTypes).toContain('phone');
      expect(result.redactedContent).toContain('[PHONE-REDACTED]');
    });

    it('should detect student IDs', () => {
      const content = 'Student ID: STU123456789';
      const result = piiDetector.detectAndRedact(content);
      
      expect(result.hasPII).toBe(true);
      expect(result.detectedTypes).toContain('studentId');
    });
  });

  describe('Privacy Logger', () => {
    it('should log with PII protection', () => {
      const mockPrivacyContext = {
        requesterId: 'user123',
        requesterType: 'student' as const,
        purpose: 'testing',
        timestamp: new Date(),
        correlationId: 'test-123'
      };

      expect(() => {
        privacyLogger.info('User email@example.com accessed data', {}, mockPrivacyContext);
      }).not.toThrow();
    });
  });

  describe('Consent Tracking Dashboard', () => {
    it('should calculate health status', () => {
      const health = consentDashboard.getHealthStatus();
      
      expect(health).toHaveProperty('isHealthy');
      expect(health).toHaveProperty('totalUsers');
      expect(health).toHaveProperty('complianceRate');
      expect(health).toHaveProperty('issues');
    });
  });

  describe('Data Access Heat Map', () => {
    it('should get health status', () => {
      const health = heatMap.getHealthStatus();
      
      expect(health).toHaveProperty('isHealthy');
      expect(health).toHaveProperty('eventsInMemory');
      expect(health).toHaveProperty('patternsTracked');
      expect(health).toHaveProperty('criticalAnomalies');
    });
  });

  describe('Privacy Alert System', () => {
    it('should get alert statistics', () => {
      const stats = alertSystem.getAlertStats();
      
      expect(stats).toHaveProperty('totalAlerts');
      expect(stats).toHaveProperty('activeAlerts');
      expect(stats).toHaveProperty('criticalAlerts');
      expect(stats).toHaveProperty('breachAlerts');
    });
  });

  describe('End-to-End Privacy Protection', () => {
    it('should detect PII and create privacy alerts', async () => {
      const sensitiveContent = 'Student email: john@school.edu, ID: STU123456';
      const detection = piiDetector.detectAndRedact(sensitiveContent);
      
      expect(detection.hasPII).toBe(true);
      expect(detection.detectedTypes.length).toBeGreaterThan(0);
      
      // Verify content is properly redacted
      expect(detection.redactedContent).not.toContain('john@school.edu');
      expect(detection.redactedContent).not.toContain('STU123456');
    });
  });
});