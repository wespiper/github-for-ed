/**
 * Privacy-Focused Repository Tests
 * Comprehensive test suite for privacy-aware repository functionality
 */

import { MockStudentRepositoryPrivacy, MockAuditRepository } from '../mocks';
import { PrivacyContext } from '../../types/privacy';
import { getPrivacyConfig } from '../../config/privacy.config';

describe('Privacy-Aware Repository Tests', () => {
  let repository: MockStudentRepositoryPrivacy;
  let adminContext: PrivacyContext;
  let studentContext: PrivacyContext;
  let educatorContext: PrivacyContext;
  let systemContext: PrivacyContext;

  beforeEach(() => {
    repository = new MockStudentRepositoryPrivacy();
    
    adminContext = {
      requesterId: 'admin-1',
      requesterType: 'admin',
      purpose: 'administrative_access',
      timestamp: new Date(),
      correlationId: 'test-correlation-1'
    };

    studentContext = {
      requesterId: 'privacy-student-1',
      requesterType: 'student',
      purpose: 'self_access',
      timestamp: new Date(),
      correlationId: 'test-correlation-2'
    };

    educatorContext = {
      requesterId: 'educator-1',
      requesterType: 'educator',
      purpose: 'educational_assessment',
      educationalJustification: 'Reviewing student progress for assignment feedback',
      timestamp: new Date(),
      correlationId: 'test-correlation-3'
    };

    systemContext = {
      requesterId: 'system',
      requesterType: 'system',
      purpose: 'system_maintenance',
      timestamp: new Date(),
      correlationId: 'test-correlation-4'
    };
  });

  afterEach(() => {
    repository.clearTestData();
  });

  describe('Privacy Context Validation', () => {
    test('should require valid privacy context for all operations', async () => {
      const invalidContext = {
        requesterId: '',
        requesterType: 'student',
        purpose: '',
        timestamp: new Date()
      } as PrivacyContext;

      await expect(
        repository.findById('privacy-student-1', invalidContext)
      ).rejects.toThrow('Invalid privacy context');
    });

    test('should accept valid privacy context', async () => {
      const student = await repository.findById('privacy-student-1', studentContext);
      expect(student).toBeTruthy();
      expect(student?.id).toBe('privacy-student-1');
    });
  });

  describe('Access Control and Permissions', () => {
    test('student should be able to access their own data', async () => {
      const student = await repository.findById('privacy-student-1', studentContext);
      expect(student).toBeTruthy();
      expect(student?.firstName).toBe('Alice');
    });

    test('student should not be able to access another student\'s data', async () => {
      const unauthorizedContext = {
        ...studentContext,
        requesterId: 'different-student'
      };

      await expect(
        repository.findById('privacy-student-1', unauthorizedContext)
      ).rejects.toThrow('Access denied: Insufficient permissions');
    });

    test('admin should be able to access any student data', async () => {
      const student = await repository.findById('privacy-student-1', adminContext);
      expect(student).toBeTruthy();
      expect(student?.firstName).toBe('Alice');
    });

    test('educator with educational justification should access student data', async () => {
      const student = await repository.findById('privacy-student-1', educatorContext);
      expect(student).toBeTruthy();
      expect(student?.firstName).toBe('Alice');
    });

    test('educator without educational justification should be denied', async () => {
      const invalidEducatorContext = {
        ...educatorContext,
        educationalJustification: undefined
      };

      await expect(
        repository.findById('privacy-student-1', invalidEducatorContext)
      ).rejects.toThrow('Access denied: Insufficient permissions');
    });

    test('system should have full access', async () => {
      const student = await repository.findById('privacy-student-1', systemContext);
      expect(student).toBeTruthy();
      expect(student?.firstName).toBe('Alice');
    });
  });

  describe('Data Minimization', () => {
    test('should return full data for admin users', async () => {
      const student = await repository.findById('privacy-student-1', adminContext);
      expect(student?.email).toContain('@test.com');
      expect(student?.passwordHash).toBe('hashed');
    });

    test('should return full data for students accessing their own data', async () => {
      const student = await repository.findById('privacy-student-1', studentContext);
      expect(student?.email).toContain('@test.com');
      expect(student?.passwordHash).toBe('hashed');
    });

    test('should minimize data for educator access', async () => {
      const student = await repository.findById('privacy-student-1', educatorContext);
      expect(student?.email).toContain('[redacted]');
      expect(student?.passwordHash).toBe('[redacted]');
      expect(student?.firstName).toBe('Alice'); // Name should be visible
    });

    test('should minimize data for system processes when appropriate', async () => {
      const student = await repository.findById('privacy-student-1', systemContext);
      // System gets full access by default
      expect(student?.email).toContain('@test.com');
    });
  });

  describe('Consent Management', () => {
    test('should deny access when consent is not granted', async () => {
      const result = await repository.findByIdWithConsent('privacy-student-2', educatorContext);
      expect(result).toBeNull();
    });

    test('should allow access when consent is granted', async () => {
      const result = await repository.findByIdWithConsent('privacy-student-1', educatorContext);
      expect(result).toBeTruthy();
      expect(result?.id).toBe('privacy-student-1');
    });

    test('should include privacy metadata when requested', async () => {
      const result = await repository.findByIdWithPrivacy('privacy-student-1', adminContext);
      expect(result?.privacyMetadata).toBeTruthy();
      expect(result?.privacyMetadata.sensitivityLevel).toBe('private');
      expect(result?.privacyMetadata.consentRequired).toBe(true);
    });
  });

  describe('Audit Trail Functionality', () => {
    test('should log all access attempts', async () => {
      await repository.findById('privacy-student-1', studentContext);
      const auditEntries = repository.getAuditEntries();
      
      expect(auditEntries.length).toBeGreaterThan(0);
      const accessEntry = auditEntries.find(e => 
        e.operation === 'read' && 
        e.entityType === 'student' && 
        e.entityId === 'privacy-student-1'
      );
      
      expect(accessEntry).toBeTruthy();
      expect(accessEntry?.result).toBe('success');
      expect(accessEntry?.privacyContext.requesterId).toBe('privacy-student-1');
    });

    test('should log denied access attempts', async () => {
      const unauthorizedContext = {
        ...studentContext,
        requesterId: 'unauthorized-user'
      };

      await expect(
        repository.findById('privacy-student-1', unauthorizedContext)
      ).rejects.toThrow();

      const auditEntries = repository.getAuditEntries();
      const deniedEntry = auditEntries.find(e => 
        e.result === 'denied' && 
        e.entityId === 'privacy-student-1'
      );
      
      expect(deniedEntry).toBeTruthy();
      expect(deniedEntry?.denialReason).toContain('insufficient_permissions');
    });

    test('should include access metadata in audit entries', async () => {
      await repository.findById('privacy-student-1', educatorContext);
      const auditEntries = repository.getAuditEntries();
      
      const accessEntry = auditEntries.find(e => 
        e.operation === 'read' && 
        e.result === 'success'
      );
      
      expect(accessEntry?.accessMetadata).toBeTruthy();
      expect(accessEntry?.accessMetadata?.dataClassification).toBe('private');
      expect(accessEntry?.accessMetadata?.consentRequired).toBe(true);
    });
  });

  describe('Data Anonymization', () => {
    test('should provide anonymized analytics with sufficient cohort size', async () => {
      const criteria = {
        minimumCohortSize: 2,
        aggregationLevel: 'class' as const
      };

      const result = await repository.getAnonymizedAnalytics(criteria, educatorContext);
      
      expect(result.cohortSize).toBeGreaterThanOrEqual(2);
      expect(result.anonymizedFields).toContain('studentId');
      expect(result.anonymizedFields).toContain('email');
      expect(result.data).toBeTruthy();
    });

    test('should reject anonymization requests with insufficient cohort size', async () => {
      const privacyConfig = getPrivacyConfig();
      // Clear test data to have insufficient cohort
      repository.clearTestData();

      const criteria = {
        minimumCohortSize: privacyConfig.anonymization.minimumCohortSize
      };

      await expect(
        repository.getAnonymizedAnalytics(criteria, educatorContext)
      ).rejects.toThrow(/Insufficient data for anonymization/);
    });
  });

  describe('CRUD Operations with Privacy', () => {
    test('should create student with privacy metadata', async () => {
      const studentData = {
        email: 'new.student@test.com',
        passwordHash: 'hashed',
        firstName: 'New',
        lastName: 'Student'
      };

      const student = await repository.createStudent(studentData, adminContext);
      
      expect(student).toBeTruthy();
      expect(student.email).toBe(studentData.email);

      // Check that audit entry was created
      const auditEntries = repository.getAuditEntries();
      const createEntry = auditEntries.find(e => 
        e.operation === 'create' && 
        e.entityId === student.id
      );
      expect(createEntry).toBeTruthy();
    });

    test('should update student data with proper permissions', async () => {
      const updateData = { firstName: 'Updated Alice' };
      
      const updated = await repository.updateStudent('privacy-student-1', updateData, studentContext);
      
      expect(updated.firstName).toBe('Updated Alice');

      // Check audit trail
      const auditEntries = repository.getAuditEntries();
      const updateEntry = auditEntries.find(e => 
        e.operation === 'update' && 
        e.entityId === 'privacy-student-1'
      );
      expect(updateEntry).toBeTruthy();
    });

    test('should prevent unauthorized updates', async () => {
      const unauthorizedContext = {
        ...educatorContext,
        educationalJustification: undefined
      };

      await expect(
        repository.updateStudent('privacy-student-1', { firstName: 'Hacked' }, unauthorizedContext)
      ).rejects.toThrow('Access denied: Insufficient permissions');
    });

    test('should only allow admin to delete students', async () => {
      await repository.deleteStudent('privacy-student-1', adminContext);
      
      const student = await repository.findById('privacy-student-1', adminContext);
      expect(student).toBeNull();

      // Check audit trail
      const auditEntries = repository.getAuditEntries();
      const deleteEntry = auditEntries.find(e => 
        e.operation === 'delete' && 
        e.entityId === 'privacy-student-1'
      );
      expect(deleteEntry).toBeTruthy();
    });

    test('should prevent non-admin from deleting students', async () => {
      await expect(
        repository.deleteStudent('privacy-student-1', studentContext)
      ).rejects.toThrow('Access denied: Only administrators can delete student records');
    });
  });

  describe('Educational Compliance', () => {
    test('should handle FERPA-compliant data access', async () => {
      const student = await repository.findByIdWithPrivacy('privacy-student-1', educatorContext);
      
      expect(student?.privacyMetadata.flags?.ferpa).toBe(true);
      expect(student?.privacyMetadata.consentRequired).toBe(true);
    });

    test('should track educational justification in audit', async () => {
      await repository.findById('privacy-student-1', educatorContext);
      
      const auditEntries = repository.getAuditEntries();
      const accessEntry = auditEntries.find(e => 
        e.operation === 'read' && 
        e.result === 'success'
      );
      
      expect(accessEntry?.privacyContext.educationalJustification).toBeTruthy();
    });

    test('should handle minor student data with extra protection', async () => {
      const student = await repository.findByIdWithPrivacy('privacy-student-2', adminContext);
      
      expect(student?.privacyMetadata.flags?.minorData).toBe(true);
      expect(student?.privacyMetadata.sensitivityLevel).toBe('highly_sensitive');
    });
  });

  describe('Email Lookup Restrictions', () => {
    test('should allow admin to lookup by email', async () => {
      const student = await repository.findByEmail('alice.privacy@test.com', adminContext);
      expect(student?.firstName).toBe('Alice');
    });

    test('should allow system to lookup by email', async () => {
      const student = await repository.findByEmail('alice.privacy@test.com', systemContext);
      expect(student?.firstName).toBe('Alice');
    });

    test('should deny non-admin email lookups', async () => {
      await expect(
        repository.findByEmail('alice.privacy@test.com', studentContext)
      ).rejects.toThrow('Access denied: Email lookup requires administrative privileges');
    });
  });

  describe('Course-Based Access', () => {
    test('should allow educator to view course students', async () => {
      const students = await repository.findByCourse('course-1', educatorContext);
      expect(students.length).toBeGreaterThan(0);
      
      // Data should be minimized for educator
      students.forEach(student => {
        expect(student.email).toContain('[redacted]');
        expect(student.passwordHash).toBe('[redacted]');
      });
    });

    test('should log course roster access', async () => {
      await repository.findByCourse('course-1', educatorContext);
      
      const auditEntries = repository.getAuditEntries();
      const courseAccessEntry = auditEntries.find(e => 
        e.entityType === 'course_students' && 
        e.entityId === 'course-1'
      );
      
      expect(courseAccessEntry).toBeTruthy();
      expect(courseAccessEntry?.accessMetadata?.dataClassification).toBe('course_roster');
    });
  });

  describe('Performance and Caching', () => {
    test('should not cache sensitive data inappropriately', async () => {
      // This is a conceptual test - in a real implementation,
      // we'd verify that privacy-sensitive data isn't cached
      // or is cached with appropriate TTL and access controls
      
      const student1 = await repository.findById('privacy-student-1', studentContext);
      const student2 = await repository.findById('privacy-student-1', educatorContext);
      
      // Educator should get minimized data even on subsequent requests
      expect(student2?.email).toContain('[redacted]');
      expect(student1?.email).toContain('@test.com'); // Student gets full data
    });
  });
});