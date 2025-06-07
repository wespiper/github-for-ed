import { performance } from 'perf_hooks';
import { OptimizedEncryption, OptimizedAnonymization } from '../../src/privacy/operations/OptimizedEncryption';
import { HighPerformancePrivacyCache } from '../../src/cache/privacy-aware/HighPerformancePrivacyCache';
import { OptimizedConsentEngine, ConsentPurpose } from '../../src/privacy/consent/OptimizedConsentEngine';
import { DifferentialPrivacyOptimizer, QueryType } from '../../src/privacy/operations/DifferentialPrivacyOptimizer';
import { CacheService } from '../../src/cache/CacheService';

/**
 * Comprehensive privacy performance benchmark suite
 * 
 * Performance targets to validate:
 * - Encryption/Decryption: <10ms per operation
 * - Consent checks: <5ms per operation
 * - Cache operations: <20ms with encryption
 * - Differential privacy: <10ms overhead
 * - Overall system: <200ms with full privacy features
 */
describe('Privacy Performance Benchmarks', () => {
  let cache: HighPerformancePrivacyCache;
  let consentEngine: OptimizedConsentEngine;
  let dpOptimizer: DifferentialPrivacyOptimizer;
  
  const testPassword = 'test-encryption-password-2024';
  const sampleData = {
    small: 'Small test data',
    medium: 'A'.repeat(1000),
    large: 'A'.repeat(10000)
  };

  beforeAll(async () => {
    const baseCache = new (class implements CacheService {
      private store = new Map<string, any>();
      async get<T>(key: string): Promise<T | null> {
        return this.store.get(key) || null;
      }
      async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        this.store.set(key, value);
      }
      async delete(key: string): Promise<boolean> {
        return this.store.delete(key);
      }
      async clear(): Promise<void> {
        this.store.clear();
      }
    })();

    cache = new HighPerformancePrivacyCache(baseCache, testPassword);
    consentEngine = new OptimizedConsentEngine();
    dpOptimizer = new DifferentialPrivacyOptimizer();
  });

  describe('Encryption Performance Benchmarks', () => {
    test('should encrypt small data within 5ms target', async () => {
      const iterations = 100;
      const results: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await OptimizedEncryption.encrypt(sampleData.small, testPassword);
        const duration = performance.now() - start;
        results.push(duration);
      }

      const averageTime = results.reduce((a, b) => a + b) / results.length;
      const p95Time = results.sort((a, b) => a - b)[Math.floor(results.length * 0.95)];

      console.log(`Encryption Performance:
        Average: ${averageTime.toFixed(2)}ms
        P95: ${p95Time.toFixed(2)}ms
        Target: <5ms`);

      expect(averageTime).toBeLessThan(5);
      expect(p95Time).toBeLessThan(10); // Allow p95 to be slightly higher
    });

    test('should maintain performance with key caching', async () => {
      const iterations = 50;
      const results: number[] = [];

      // First run to populate cache
      await OptimizedEncryption.encrypt(sampleData.small, testPassword);

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await OptimizedEncryption.encrypt(sampleData.small, testPassword);
        const duration = performance.now() - start;
        results.push(duration);
      }

      const averageTime = results.reduce((a, b) => a + b) / results.length;
      
      console.log(`Cached Encryption Performance: ${averageTime.toFixed(2)}ms`);
      
      // Cached operations should be significantly faster
      expect(averageTime).toBeLessThan(3);
    });

    test('should handle batch encryption efficiently', async () => {
      const batchSize = 100;
      const dataItems = Array(batchSize).fill(sampleData.small);

      const start = performance.now();
      await OptimizedEncryption.encryptBatch(dataItems, testPassword);
      const duration = performance.now() - start;

      const perItemTime = duration / batchSize;
      
      console.log(`Batch Encryption: ${duration.toFixed(2)}ms total, ${perItemTime.toFixed(2)}ms per item`);
      
      // Batch operations should be more efficient than individual operations
      expect(perItemTime).toBeLessThan(2);
    });
  });

  describe('Anonymization Performance Benchmarks', () => {
    test('should anonymize data within 3ms target', () => {
      const iterations = 1000;
      const results: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        OptimizedAnonymization.anonymize(`test-data-${i}`, 'student');
        const duration = performance.now() - start;
        results.push(duration);
      }

      const averageTime = results.reduce((a, b) => a + b) / results.length;
      const p95Time = results.sort((a, b) => a - b)[Math.floor(results.length * 0.95)];

      console.log(`Anonymization Performance:
        Average: ${averageTime.toFixed(2)}ms
        P95: ${p95Time.toFixed(2)}ms
        Target: <3ms`);

      expect(averageTime).toBeLessThan(3);
      expect(p95Time).toBeLessThan(5);
    });

    test('should achieve O(1) performance with caching', () => {
      const testData = 'consistent-test-data';
      const iterations = 1000;
      const results: number[] = [];

      // First call to populate cache
      OptimizedAnonymization.anonymize(testData, 'student');

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        OptimizedAnonymization.anonymize(testData, 'student');
        const duration = performance.now() - start;
        results.push(duration);
      }

      const averageTime = results.reduce((a, b) => a + b) / results.length;
      
      console.log(`Cached Anonymization: ${averageTime.toFixed(3)}ms`);
      
      // Cached operations should be extremely fast
      expect(averageTime).toBeLessThan(0.1);
    });
  });

  describe('Consent Engine Performance Benchmarks', () => {
    beforeEach(async () => {
      // Setup test users
      const testUsers = Array.from({ length: 1000 }, (_, i) => ({
        userId: `user_${i}`,
        consents: {
          analytics: i % 2 === 0,
          improvement: i % 3 === 0,
          educational: true,
          research: i % 4 === 0
        }
      }));

      await consentEngine.precomputeConsentMatrix(testUsers);
    });

    test('should check consent within 2ms target', () => {
      const iterations = 1000;
      const results: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const userId = `user_${i % 100}`;
        const start = performance.now();
        consentEngine.checkConsent(userId, ConsentPurpose.ANALYTICS);
        const duration = performance.now() - start;
        results.push(duration);
      }

      const averageTime = results.reduce((a, b) => a + b) / results.length;
      const p95Time = results.sort((a, b) => a - b)[Math.floor(results.length * 0.95)];

      console.log(`Consent Check Performance:
        Average: ${averageTime.toFixed(2)}ms
        P95: ${p95Time.toFixed(2)}ms
        Target: <2ms`);

      expect(averageTime).toBeLessThan(2);
      expect(p95Time).toBeLessThan(5);
    });

    test('should achieve 50K checks/second target', () => {
      const iterations = 50000;
      const requests = Array.from({ length: iterations }, (_, i) => ({
        userId: `user_${i % 100}`,
        purpose: ConsentPurpose.ANALYTICS
      }));

      const start = performance.now();
      consentEngine.checkConsentBatch(requests);
      const duration = performance.now() - start;

      const checksPerSecond = (iterations / duration) * 1000;
      
      console.log(`Batch Consent Performance: ${checksPerSecond.toFixed(0)} checks/second`);
      
      expect(checksPerSecond).toBeGreaterThan(50000);
    });
  });

  describe('High-Performance Cache Benchmarks', () => {
    test('should perform encrypted cache operations within 20ms', async () => {
      const iterations = 100;
      const results: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const key = `test-key-${i}`;
        const value = { data: sampleData.medium, timestamp: Date.now() };

        const start = performance.now();
        await cache.setEncrypted(key, value, 300, {
          userId: 'test-user',
          purpose: 'analytics',
          privacyLevel: 'confidential'
        });
        const duration = performance.now() - start;
        results.push(duration);
      }

      const averageTime = results.reduce((a, b) => a + b) / results.length;
      const p95Time = results.sort((a, b) => a - b)[Math.floor(results.length * 0.95)];

      console.log(`Encrypted Cache Set Performance:
        Average: ${averageTime.toFixed(2)}ms
        P95: ${p95Time.toFixed(2)}ms
        Target: <20ms`);

      expect(averageTime).toBeLessThan(20);
      expect(p95Time).toBeLessThan(30);
    });

    test('should achieve 95% cache hit rate', async () => {
      const keys = Array.from({ length: 100 }, (_, i) => `cache-test-${i}`);
      const value = { test: 'data' };

      // Populate cache
      for (const key of keys) {
        await cache.setEncrypted(key, value, 300);
      }

      // Test cache hits
      let hits = 0;
      for (let i = 0; i < 1000; i++) {
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        const result = await cache.getEncrypted(randomKey);
        if (result) hits++;
      }

      const hitRate = (hits / 1000) * 100;
      
      console.log(`Cache Hit Rate: ${hitRate.toFixed(1)}%`);
      
      expect(hitRate).toBeGreaterThan(95);
    });
  });

  describe('Differential Privacy Performance Benchmarks', () => {
    test('should generate noise within 5ms target', () => {
      const iterations = 1000;
      const results: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        dpOptimizer.generateLaplaceNoise(1.0, 1.0);
        const duration = performance.now() - start;
        results.push(duration);
      }

      const averageTime = results.reduce((a, b) => a + b) / results.length;
      const p95Time = results.sort((a, b) => a - b)[Math.floor(results.length * 0.95)];

      console.log(`Noise Generation Performance:
        Average: ${averageTime.toFixed(2)}ms
        P95: ${p95Time.toFixed(2)}ms
        Target: <5ms`);

      expect(averageTime).toBeLessThan(5);
      expect(p95Time).toBeLessThan(10);
    });

    test('should handle 5K differential privacy queries/second', () => {
      const iterations = 5000;
      const operations = Array.from({ length: iterations }, (_, i) => ({
        queryResult: Math.random() * 100,
        queryType: QueryType.COUNT,
        parameters: { entityId: `entity_${i % 100}` },
        epsilon: 1.0,
        delta: 1e-5
      }));

      const start = performance.now();
      dpOptimizer.applyBatchDifferentialPrivacy(operations);
      const duration = performance.now() - start;

      const queriesPerSecond = (iterations / duration) * 1000;
      
      console.log(`DP Query Performance: ${queriesPerSecond.toFixed(0)} queries/second`);
      
      expect(queriesPerSecond).toBeGreaterThan(5000);
    });
  });

  describe('End-to-End Privacy Performance', () => {
    test('should complete full privacy workflow within 200ms', async () => {
      const iterations = 50;
      const results: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();

        // Full privacy workflow simulation
        const userId = `user_${i}`;
        const data = { content: sampleData.medium, userId, timestamp: Date.now() };

        // 1. Consent check
        const consentAllowed = consentEngine.checkConsent(userId, ConsentPurpose.ANALYTICS);
        
        if (consentAllowed) {
          // 2. Anonymize sensitive data
          const anonymizedId = OptimizedAnonymization.anonymize(userId, 'student');
          
          // 3. Encrypt data
          const encrypted = await OptimizedEncryption.encrypt(JSON.stringify(data), testPassword);
          
          // 4. Cache encrypted data
          await cache.setEncrypted(`workflow_${i}`, encrypted, 300, {
            userId: anonymizedId,
            purpose: 'analytics',
            privacyLevel: 'confidential'
          });
          
          // 5. Apply differential privacy to result
          dpOptimizer.applyDifferentialPrivacy(
            Math.random() * 100,
            QueryType.COUNT,
            { entityId: anonymizedId },
            1.0
          );
        }

        const duration = performance.now() - start;
        results.push(duration);
      }

      const averageTime = results.reduce((a, b) => a + b) / results.length;
      const p95Time = results.sort((a, b) => a - b)[Math.floor(results.length * 0.95)];

      console.log(`End-to-End Privacy Workflow:
        Average: ${averageTime.toFixed(2)}ms
        P95: ${p95Time.toFixed(2)}ms
        Target: <200ms`);

      expect(averageTime).toBeLessThan(200);
      expect(p95Time).toBeLessThan(300);
    });
  });

  describe('System Load Testing', () => {
    test('should handle 1000+ concurrent privacy-aware requests', async () => {
      const concurrentRequests = 1000;
      const requests: Promise<any>[] = [];

      const start = performance.now();

      for (let i = 0; i < concurrentRequests; i++) {
        const request = (async () => {
          const userId = `concurrent_user_${i}`;
          
          // Concurrent privacy operations
          const [consentResult, encrypted, dpResult] = await Promise.all([
            Promise.resolve(consentEngine.checkConsent(userId, ConsentPurpose.ANALYTICS)),
            OptimizedEncryption.encrypt(`data_${i}`, testPassword),
            Promise.resolve(dpOptimizer.generateLaplaceNoise(1.0, 1.0))
          ]);

          return { consentResult, encrypted, dpResult };
        })();

        requests.push(request);
      }

      const results = await Promise.all(requests);
      const duration = performance.now() - start;

      const requestsPerSecond = (concurrentRequests / duration) * 1000;
      
      console.log(`Concurrent Load Test:
        Requests: ${concurrentRequests}
        Duration: ${duration.toFixed(2)}ms
        Rate: ${requestsPerSecond.toFixed(0)} requests/second`);

      expect(results.length).toBe(concurrentRequests);
      expect(duration).toBeLessThan(5000); // 5 seconds max
    });
  });

  afterEach(() => {
    // Clean up caches between tests
    OptimizedEncryption.clearKeyCache();
    OptimizedAnonymization.clearCaches();
    consentEngine.reset();
    dpOptimizer.reset();
    cache.clearCaches();
  });
});