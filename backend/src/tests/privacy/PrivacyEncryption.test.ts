/**
 * Enhanced Privacy Encryption Tests
 * Tests for AES-256-CBC encryption implementation
 */

import { describe, it, expect } from '@jest/globals';
import { PrivacyEventUtils } from '../../events/EventBus';

describe('Privacy Encryption - AES-256-CBC', () => {
  describe('Encryption Security Features', () => {
    it('should use AES-256-CBC encryption with random IVs', () => {
      const payload1 = { message: 'test data', sensitive: true };
      const payload2 = { message: 'test data', sensitive: true };

      const encrypted1 = PrivacyEventUtils.encryptPayload(payload1);
      const encrypted2 = PrivacyEventUtils.encryptPayload(payload2);

      // Same data should produce different encrypted outputs due to random IVs
      expect(encrypted1).not.toBe(encrypted2);
      
      // Both should be valid base64
      expect(() => Buffer.from(encrypted1, 'base64')).not.toThrow();
      expect(() => Buffer.from(encrypted2, 'base64')).not.toThrow();
    });

    it('should include IV in encrypted structure', () => {
      const payload = { test: 'data', numbers: [1, 2, 3] };
      const encrypted = PrivacyEventUtils.encryptPayload(payload);
      
      // Decode and parse the encrypted structure
      const encryptedData = JSON.parse(Buffer.from(encrypted, 'base64').toString('utf8'));
      
      expect(encryptedData).toHaveProperty('iv');
      expect(encryptedData).toHaveProperty('encrypted');
      expect(typeof encryptedData.iv).toBe('string');
      expect(typeof encryptedData.encrypted).toBe('string');
      
      // IV should be 32 hex characters (16 bytes)
      expect(encryptedData.iv).toMatch(/^[a-f0-9]{32}$/);
    });

    it('should encrypt and decrypt complex objects', () => {
      const complexPayload = {
        student: {
          id: 'student-123',
          grades: [85, 92, 78, 95],
          metadata: {
            lastLogin: new Date().toISOString(),
            preferences: {
              theme: 'dark',
              notifications: true
            }
          }
        },
        course: {
          id: 'course-456',
          assignments: ['hw1', 'hw2', 'hw3']
        },
        analytics: {
          timeSpent: 3600,
          actionsPerformed: 42,
          cognitiveLoad: 'moderate'
        }
      };

      const encrypted = PrivacyEventUtils.encryptPayload(complexPayload);
      const decrypted = PrivacyEventUtils.decryptPayload(encrypted);

      expect(decrypted).toEqual(complexPayload);
    });

    it('should handle edge cases in encryption', () => {
      const edgeCases = [
        { empty: {} },
        { nullValue: null },
        { undefinedValue: undefined },
        { emptyString: '' },
        { emptyArray: [] },
        { unicode: '🔒 Privacy 测试 🛡️' },
        { specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?' }
      ];

      edgeCases.forEach((payload, index) => {
        const encrypted = PrivacyEventUtils.encryptPayload(payload);
        const decrypted = PrivacyEventUtils.decryptPayload(encrypted);
        
        expect(decrypted).toEqual(payload);
      });
    });

    it('should fail gracefully with invalid encrypted data', () => {
      const invalidInputs = [
        'invalid-base64-data',
        Buffer.from('{"invalid": "json"').toString('base64'), // Incomplete JSON
        Buffer.from('{"iv": "short", "encrypted": "data"}').toString('base64'), // Invalid IV
        Buffer.from('{"encrypted": "data"}').toString('base64'), // Missing IV
        ''
      ];

      invalidInputs.forEach(invalid => {
        expect(() => {
          PrivacyEventUtils.decryptPayload(invalid);
        }).toThrow();
      });
    });

    it('should use proper key derivation with scrypt', () => {
      // Test that encryption is consistent with same key
      const payload = { test: 'key derivation' };
      
      // Multiple encryptions should all decrypt correctly
      for (let i = 0; i < 5; i++) {
        const encrypted = PrivacyEventUtils.encryptPayload(payload);
        const decrypted = PrivacyEventUtils.decryptPayload(encrypted);
        expect(decrypted).toEqual(payload);
      }
    });

    it('should handle large payloads efficiently', () => {
      // Create a larger payload to test performance
      const largePayload = {
        students: Array.from({ length: 100 }, (_, i) => ({
          id: `student-${i}`,
          name: `Student ${i}`,
          grades: Array.from({ length: 10 }, () => Math.floor(Math.random() * 100)),
          submissions: Array.from({ length: 5 }, (_, j) => ({
            id: `submission-${i}-${j}`,
            content: 'Lorem ipsum '.repeat(100), // Longer content
            timestamp: new Date().toISOString()
          }))
        })),
        metadata: {
          totalStudents: 100,
          averageGrades: 85.5,
          courseStats: {
            completionRate: 0.87,
            participationRate: 0.94
          }
        }
      };

      const startTime = Date.now();
      const encrypted = PrivacyEventUtils.encryptPayload(largePayload);
      const decrypted = PrivacyEventUtils.decryptPayload(encrypted);
      const endTime = Date.now();

      expect(decrypted).toEqual(largePayload);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should maintain data integrity across multiple encrypt/decrypt cycles', () => {
      let payload = {
        original: 'data',
        cycle: 0,
        integrity: 'maintained'
      };

      // Perform multiple encrypt/decrypt cycles
      for (let i = 0; i < 10; i++) {
        payload.cycle = i;
        const encrypted = PrivacyEventUtils.encryptPayload(payload);
        const decrypted = PrivacyEventUtils.decryptPayload(encrypted);
        
        expect(decrypted).toEqual(payload);
        payload = decrypted as typeof payload; // Use decrypted data for next cycle
      }

      expect(payload.cycle).toBe(9);
      expect(payload.integrity).toBe('maintained');
    });

    it('should produce different ciphertext for identical plaintext', () => {
      const payload = { message: 'identical plaintext' };
      const encryptions = [];

      // Create multiple encryptions of the same data
      for (let i = 0; i < 10; i++) {
        encryptions.push(PrivacyEventUtils.encryptPayload(payload));
      }

      // All encryptions should be different (due to random IVs)
      const uniqueEncryptions = new Set(encryptions);
      expect(uniqueEncryptions.size).toBe(10);

      // But all should decrypt to the same original data
      encryptions.forEach(encrypted => {
        const decrypted = PrivacyEventUtils.decryptPayload(encrypted);
        expect(decrypted).toEqual(payload);
      });
    });

    it('should handle privacy event payloads specifically', () => {
      const privacyEventPayload = {
        accessorId: 'writing-analyzer',
        dataType: 'student-writing',
        purpose: 'educational-analysis',
        educationalJustification: 'Writing skill assessment and process analysis',
        accessTimestamp: new Date().toISOString(),
        dataScope: {
          studentCount: 1,
          recordCount: 15,
          timeRange: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString()
          }
        },
        sensitiveAnalysis: {
          writingPatterns: ['recursive', 'perfectionist'],
          cognitiveLoad: 'moderate',
          strugglePoints: ['time-management', 'concept-clarity'],
          personalInsights: 'Student shows strong analytical thinking but needs support with organization'
        }
      };

      const encrypted = PrivacyEventUtils.encryptPayload(privacyEventPayload);
      const decrypted = PrivacyEventUtils.decryptPayload(encrypted);

      expect(decrypted).toEqual(privacyEventPayload);
      expect(decrypted.sensitiveAnalysis.personalInsights).toBe(privacyEventPayload.sensitiveAnalysis.personalInsights);
    });
  });

  describe('Encryption Performance and Security', () => {
    it('should demonstrate encryption overhead is acceptable', () => {
      const payload = { performance: 'test', data: 'sample' };
      
      const iterations = 100;
      const startTime = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        const encrypted = PrivacyEventUtils.encryptPayload(payload);
        const decrypted = PrivacyEventUtils.decryptPayload(encrypted);
      }
      
      const endTime = Date.now();
      const timePerOperation = (endTime - startTime) / iterations;
      
      // Should average less than 100ms per encrypt/decrypt cycle (reasonable for AES-256-CBC)
      expect(timePerOperation).toBeLessThan(100);
    });

    it('should verify encrypted data is not human readable', () => {
      const payload = { 
        secret: 'This is highly confidential student data',
        studentId: 'student-123',
        personalInfo: 'Should not be readable in encrypted form'
      };

      const encrypted = PrivacyEventUtils.encryptPayload(payload);
      
      // Encrypted data should not contain any readable parts of the original
      expect(encrypted).not.toContain('confidential');
      expect(encrypted).not.toContain('student-123');
      expect(encrypted).not.toContain('readable');
      expect(encrypted).not.toContain('secret');
    });
  });
});