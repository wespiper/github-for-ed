import { performance } from 'perf_hooks';
import { OptimizedEncryption, OptimizedAnonymization } from '../../privacy/operations/OptimizedEncryption';
import { OptimizedConsentEngine, ConsentPurpose } from '../../privacy/consent/OptimizedConsentEngine';
import { DifferentialPrivacyOptimizer, QueryType } from '../../privacy/operations/DifferentialPrivacyOptimizer';

/**
 * Privacy Optimization Validation Tests
 * 
 * Basic validation that our privacy optimizations meet performance targets
 */
describe('Privacy Optimization Validation', () => {
  const testPassword = 'test-password-123';

  describe('OptimizedEncryption Performance', () => {
    test('should encrypt data within 10ms target', async () => {
      const testData = 'Test data for encryption performance validation';
      
      const start = performance.now();
      const result = await OptimizedEncryption.encrypt(testData, testPassword);
      const duration = performance.now() - start;
      
      console.log(`Encryption took: ${duration.toFixed(2)}ms`);
      
      expect(duration).toBeLessThan(10);
      expect(result.encrypted).toBeDefined();
      expect(result.metadata.hardwareAccelerated).toBeDefined();
    });

    test('should decrypt data within 10ms target', async () => {
      const testData = 'Test data for decryption performance validation';
      
      // First encrypt the data
      const encrypted = await OptimizedEncryption.encrypt(testData, testPassword);
      
      // Then time the decryption
      const start = performance.now();
      const result = await OptimizedEncryption.decrypt(
        encrypted.encrypted,
        encrypted.iv,
        encrypted.tag,
        encrypted.salt,
        testPassword
      );
      const duration = performance.now() - start;
      
      console.log(`Decryption took: ${duration.toFixed(2)}ms`);
      
      expect(duration).toBeLessThan(10);
      expect(result.decrypted).toBe(testData);
    });

    test('should show improved performance with key caching', async () => {
      const testData = 'Test data for key caching validation';
      
      // First encryption (cache miss)
      const start1 = performance.now();
      await OptimizedEncryption.encrypt(testData, testPassword);
      const duration1 = performance.now() - start1;
      
      // Second encryption (cache hit)
      const start2 = performance.now();
      await OptimizedEncryption.encrypt(testData, testPassword);
      const duration2 = performance.now() - start2;
      
      console.log(`First encryption: ${duration1.toFixed(2)}ms, Second: ${duration2.toFixed(2)}ms`);
      
      // Second should be faster due to key caching
      expect(duration2).toBeLessThan(duration1);
    });
  });

  describe('OptimizedAnonymization Performance', () => {
    test('should anonymize data within 3ms target', () => {
      const testData = 'student_id_12345';
      
      const start = performance.now();
      const result = OptimizedAnonymization.anonymize(testData, 'student');
      const duration = performance.now() - start;
      
      console.log(`Anonymization took: ${duration.toFixed(3)}ms`);
      
      expect(duration).toBeLessThan(3);
      expect(result).toBeDefined();
      expect(result).not.toBe(testData);
    });

    test('should achieve sub-millisecond performance with caching', () => {
      const testData = 'cached_student_id';
      
      // First call (cache miss)
      OptimizedAnonymization.anonymize(testData, 'student');
      
      // Second call (cache hit)
      const start = performance.now();
      OptimizedAnonymization.anonymize(testData, 'student');
      const duration = performance.now() - start;
      
      console.log(`Cached anonymization took: ${duration.toFixed(3)}ms`);
      
      expect(duration).toBeLessThan(1);
    });
  });

  describe('OptimizedConsentEngine Performance', () => {
    let consentEngine: OptimizedConsentEngine;

    beforeEach(async () => {
      consentEngine = new OptimizedConsentEngine();
      
      // Setup test data
      const testUsers = Array.from({ length: 100 }, (_, i) => ({
        userId: `test_user_${i}`,
        consents: {
          analytics: i % 2 === 0,
          improvement: i % 3 === 0,
          educational: true,
          research: i % 4 === 0
        }
      }));

      await consentEngine.precomputeConsentMatrix(testUsers);
    });

    test('should check consent within 5ms target', () => {
      const start = performance.now();
      const result = consentEngine.checkConsent('test_user_1', ConsentPurpose.ANALYTICS);
      const duration = performance.now() - start;
      
      console.log(`Consent check took: ${duration.toFixed(3)}ms`);
      
      expect(duration).toBeLessThan(5);
      expect(typeof result).toBe('boolean');
    });

    test('should achieve sub-millisecond performance with caching', () => {
      // First call
      consentEngine.checkConsent('test_user_1', ConsentPurpose.ANALYTICS);
      
      // Second call (cached)
      const start = performance.now();
      consentEngine.checkConsent('test_user_1', ConsentPurpose.ANALYTICS);
      const duration = performance.now() - start;
      
      console.log(`Cached consent check took: ${duration.toFixed(3)}ms`);
      
      expect(duration).toBeLessThan(1);
    });

    test('should handle batch consent checks efficiently', () => {
      const requests = Array.from({ length: 1000 }, (_, i) => ({
        userId: `test_user_${i % 10}`,
        purpose: ConsentPurpose.ANALYTICS
      }));

      const start = performance.now();
      const results = consentEngine.checkConsentBatch(requests);
      const duration = performance.now() - start;
      
      const checksPerSecond = (requests.length / duration) * 1000;
      
      console.log(`Batch consent: ${checksPerSecond.toFixed(0)} checks/second`);
      
      expect(results.length).toBe(requests.length);
      expect(checksPerSecond).toBeGreaterThan(10000); // At least 10K checks/second
    });
  });

  describe('DifferentialPrivacyOptimizer Performance', () => {
    let dpOptimizer: DifferentialPrivacyOptimizer;

    beforeEach(() => {
      dpOptimizer = new DifferentialPrivacyOptimizer();
    });

    test('should generate noise within 5ms target', () => {
      const start = performance.now();
      const noise = dpOptimizer.generateLaplaceNoise(1.0, 1.0);
      const duration = performance.now() - start;
      
      console.log(`Noise generation took: ${duration.toFixed(3)}ms`);
      
      expect(duration).toBeLessThan(5);
      expect(typeof noise).toBe('number');
    });

    test('should apply differential privacy within 10ms target', () => {
      const testResult = 42;
      
      const start = performance.now();
      const result = dpOptimizer.applyDifferentialPrivacy(
        testResult,
        QueryType.COUNT,
        { entityId: 'test_entity' },
        1.0,
        1e-5
      );
      const duration = performance.now() - start;
      
      console.log(`Differential privacy application took: ${duration.toFixed(2)}ms`);
      
      expect(duration).toBeLessThan(10);
      expect(result.noiseAdded).toBe(true);
      expect(result.epsilon).toBe(1.0);
    });
  });

  describe('End-to-End Privacy Performance', () => {
    test('should complete privacy workflow within 50ms target', async () => {
      const consentEngine = new OptimizedConsentEngine();
      const dpOptimizer = new DifferentialPrivacyOptimizer();
      
      // Setup minimal consent data
      await consentEngine.precomputeConsentMatrix([{
        userId: 'test_user',
        consents: { analytics: true, educational: true }
      }]);

      const start = performance.now();
      
      // 1. Check consent
      const consentAllowed = consentEngine.checkConsent('test_user', ConsentPurpose.ANALYTICS);
      
      // 2. Anonymize data
      const anonymizedId = OptimizedAnonymization.anonymize('test_user', 'student');
      
      // 3. Encrypt data
      const testData = { userId: anonymizedId, score: 85 };
      const encrypted = await OptimizedEncryption.encrypt(JSON.stringify(testData), testPassword);
      
      // 4. Apply differential privacy
      const dpResult = dpOptimizer.applyDifferentialPrivacy(
        85,
        QueryType.COUNT,
        { entityId: anonymizedId },
        1.0
      );
      
      const duration = performance.now() - start;
      
      console.log(`End-to-end privacy workflow took: ${duration.toFixed(2)}ms`);
      
      expect(duration).toBeLessThan(50);
      expect(consentAllowed).toBe(true);
      expect(encrypted.encrypted).toBeDefined();
      expect(dpResult.noiseAdded).toBe(true);
    });
  });

  afterEach(() => {
    // Clean up caches between tests
    OptimizedEncryption.clearKeyCache();
    OptimizedAnonymization.clearCaches();
  });
});