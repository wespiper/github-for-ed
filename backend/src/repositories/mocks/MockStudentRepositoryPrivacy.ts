/**
 * Privacy-Enhanced Mock Student Repository
 * Provides privacy-aware testing scenarios and consent management
 */

import { User } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { 
  PrivacyContext, 
  PrivacyMetadata, 
  AnonymizedData, 
  AnalyticsCriteria, 
  ConsentRecord 
} from '../../types/privacy';
import { StudentRepository } from '../interfaces';
import { MockAuditRepository } from '../AuditRepository';
import { getPrivacyConfig, PrivacyUtils } from '../../config/privacy.config';

/**
 * Privacy-enhanced mock student repository for testing privacy scenarios
 */
export class MockStudentRepositoryPrivacy implements StudentRepository {
  private students: Map<string, User> = new Map();
  private privacyMetadata: Map<string, PrivacyMetadata> = new Map();
  private consentRecords: Map<string, ConsentRecord[]> = new Map();
  private auditRepository: MockAuditRepository;
  private privacyConfig = getPrivacyConfig();

  constructor() {
    this.auditRepository = new MockAuditRepository();
    this.seedPrivacyTestData();
  }

  async findById(id: string, context: PrivacyContext): Promise<User | null> {
    try {
      // Validate privacy context
      this.validatePrivacyContext(context);

      // Check if requester has permission to access this student
      if (!this.hasAccessPermission(id, context)) {
        await this.auditRepository.logAccess({
          operation: 'read',
          entityType: 'student',
          entityId: id,
          privacyContext: context,
          result: 'denied',
          denialReason: 'insufficient_permissions',
          accessMetadata: {
            dataClassification: 'private',
            consentRequired: true,
            consentStatus: 'access_denied'
          }
        });
        throw new Error('Access denied: Insufficient permissions to view student data');
      }

      const student = this.students.get(id);
      
      if (student) {
        await this.auditRepository.logAccess({
          operation: 'read',
          entityType: 'student',
          entityId: id,
          privacyContext: context,
          result: 'success',
          accessMetadata: {
            fieldsAccessed: ['id', 'email', 'firstName', 'lastName', 'role'],
            dataClassification: 'private',
            consentRequired: true,
            consentStatus: await this.getConsentStatus(id, 'data_collection')
          }
        });

        // Apply data minimization based on requester type
        return this.applyDataMinimization(student, context);
      }

      await this.auditRepository.logAccess({
        operation: 'read',
        entityType: 'student',
        entityId: id,
        privacyContext: context,
        result: 'success',
        accessMetadata: {
          dataClassification: 'not_found'
        }
      });

      return null;
    } catch (error) {
      await this.auditRepository.logAccess({
        operation: 'read',
        entityType: 'student',
        entityId: id,
        privacyContext: context,
        result: 'error',
        denialReason: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async findByIdWithPrivacy(id: string, context: PrivacyContext): Promise<(User & { privacyMetadata: PrivacyMetadata }) | null> {
    const student = await this.findById(id, context);
    if (!student) return null;

    const metadata = this.privacyMetadata.get(id) || this.generateDefaultPrivacyMetadata('student');
    
    return {
      ...student,
      privacyMetadata: metadata
    };
  }

  async findByIdWithConsent(id: string, context: PrivacyContext): Promise<User | null> {
    // Check consent before accessing data
    const hasConsent = await this.validateConsent(id, 'data_collection', context);
    if (!hasConsent) {
      await this.auditRepository.logAccess({
        operation: 'read',
        entityType: 'student',
        entityId: id,
        privacyContext: context,
        result: 'denied',
        denialReason: 'consent_not_granted',
        accessMetadata: {
          consentRequired: true,
          consentStatus: 'denied'
        }
      });
      return null;
    }

    return this.findById(id, context);
  }

  async findMany(filter: any, context: PrivacyContext): Promise<User[]> {
    this.validatePrivacyContext(context);

    // Apply privacy filtering to results
    const allStudents = Array.from(this.students.values());
    const filteredStudents = allStudents.filter(student => {
      return this.hasAccessPermission(student.id, context);
    });

    await this.auditRepository.logAccess({
      operation: 'read',
      entityType: 'student_list',
      entityId: 'multiple',
      privacyContext: context,
      result: 'success',
      accessMetadata: {
        fieldsAccessed: ['id', 'email', 'firstName', 'lastName'],
        dataClassification: 'aggregated'
      }
    });

    // Apply data minimization to all results
    return filteredStudents.map(student => this.applyDataMinimization(student, context));
  }

  async findByEmail(email: string, context: PrivacyContext): Promise<User | null> {
    this.validatePrivacyContext(context);

    const student = Array.from(this.students.values()).find(s => s.email === email);
    if (!student) return null;

    // Email lookup requires special permissions
    if (context.requesterType !== 'admin' && context.requesterType !== 'system') {
      await this.auditRepository.logAccess({
        operation: 'read',
        entityType: 'student_by_email',
        entityId: email,
        privacyContext: context,
        result: 'denied',
        denialReason: 'email_lookup_restricted'
      });
      throw new Error('Access denied: Email lookup requires administrative privileges');
    }

    return this.findById(student.id, context);
  }

  async findByCourse(courseId: string, context: PrivacyContext): Promise<User[]> {
    this.validatePrivacyContext(context);

    // Educator can only see students in their own courses
    if (context.requesterType === 'educator') {
      // In a real implementation, we'd verify the educator teaches this course
      await this.auditRepository.logAccess({
        operation: 'read',
        entityType: 'course_students',
        entityId: courseId,
        privacyContext: context,
        result: 'success',
        accessMetadata: {
          dataClassification: 'course_roster',
          educationalJustification: context.educationalJustification
        }
      });
    }

    // Mock: return subset of students for the course
    const courseStudents = Array.from(this.students.values()).slice(0, 3);
    return courseStudents.map(student => this.applyDataMinimization(student, context));
  }

  async create(data: any, context: PrivacyContext): Promise<User> {
    return this.createStudent(data, context);
  }

  async createStudent(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role?: 'student' | 'educator' | 'admin';
  }, context: PrivacyContext): Promise<User> {
    this.validatePrivacyContext(context);

    const student: User = {
      id: uuidv4(),
      email: data.email,
      passwordHash: data.passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role || 'student',
      profilePicture: null,
      bio: null,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Generate privacy metadata
    const privacyMetadata = this.generateDefaultPrivacyMetadata('student');
    
    this.students.set(student.id, student);
    this.privacyMetadata.set(student.id, privacyMetadata);

    // Create default consent records
    await this.createDefaultConsentRecords(student.id);

    await this.auditRepository.logAccess({
      operation: 'create',
      entityType: 'student',
      entityId: student.id,
      privacyContext: context,
      result: 'success',
      accessMetadata: {
        dataClassification: 'private',
        consentRequired: true
      }
    });

    return student;
  }

  async update(id: string, data: any, context: PrivacyContext): Promise<User> {
    return this.updateStudent(id, data, context);
  }

  async updateStudent(id: string, data: any, context: PrivacyContext): Promise<User> {
    this.validatePrivacyContext(context);

    const existing = this.students.get(id);
    if (!existing) {
      throw new Error(`Student not found: ${id}`);
    }

    // Check update permissions
    if (!this.hasUpdatePermission(id, context)) {
      await this.auditRepository.logAccess({
        operation: 'update',
        entityType: 'student',
        entityId: id,
        privacyContext: context,
        result: 'denied',
        denialReason: 'insufficient_update_permissions'
      });
      throw new Error('Access denied: Insufficient permissions to update student data');
    }

    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date()
    };

    this.students.set(id, updated);

    await this.auditRepository.logAccess({
      operation: 'update',
      entityType: 'student',
      entityId: id,
      privacyContext: context,
      result: 'success',
      accessMetadata: {
        fieldsAccessed: Object.keys(data),
        dataClassification: 'private'
      }
    });

    return updated;
  }

  async delete(id: string, context: PrivacyContext): Promise<boolean> {
    await this.deleteStudent(id, context);
    return true;
  }

  async deleteStudent(id: string, context: PrivacyContext): Promise<void> {
    this.validatePrivacyContext(context);

    // Only admins can delete students
    if (context.requesterType !== 'admin') {
      await this.auditRepository.logAccess({
        operation: 'delete',
        entityType: 'student',
        entityId: id,
        privacyContext: context,
        result: 'denied',
        denialReason: 'delete_requires_admin'
      });
      throw new Error('Access denied: Only administrators can delete student records');
    }

    const student = this.students.get(id);
    if (!student) {
      throw new Error(`Student not found: ${id}`);
    }

    // In production, we'd anonymize rather than delete
    this.students.delete(id);
    this.privacyMetadata.delete(id);
    this.consentRecords.delete(id);

    await this.auditRepository.logAccess({
      operation: 'delete',
      entityType: 'student',
      entityId: id,
      privacyContext: context,
      result: 'success',
      accessMetadata: {
        dataClassification: 'private',
        consentRequired: true
      }
    });
  }

  async getStudentStats(studentId: string, context: PrivacyContext): Promise<{
    totalCourses: number;
    totalAssignments: number;
    completedAssignments: number;
    averageReflectionQuality: number;
  }> {
    this.validatePrivacyContext(context);

    if (!this.hasAccessPermission(studentId, context)) {
      throw new Error('Access denied: Cannot view student statistics');
    }

    await this.auditRepository.logAccess({
      operation: 'read',
      entityType: 'student_stats',
      entityId: studentId,
      privacyContext: context,
      result: 'success'
    });

    // Mock statistics
    return {
      totalCourses: 3,
      totalAssignments: 12,
      completedAssignments: 8,
      averageReflectionQuality: 75.5
    };
  }

  async getAnonymizedAnalytics(criteria: AnalyticsCriteria, context: PrivacyContext): Promise<AnonymizedData> {
    this.validatePrivacyContext(context);

    // Check minimum cohort size for k-anonymity
    const cohortSize = this.students.size;
    if (cohortSize < this.privacyConfig.anonymization.minimumCohortSize) {
      throw new Error(`Insufficient data for anonymization. Minimum cohort size: ${this.privacyConfig.anonymization.minimumCohortSize}`);
    }

    await this.auditRepository.logAccess({
      operation: 'read',
      entityType: 'anonymized_analytics',
      entityId: JSON.stringify(criteria),
      privacyContext: context,
      result: 'success',
      accessMetadata: {
        dataClassification: 'anonymized'
      }
    });

    return {
      data: {
        totalStudents: cohortSize,
        averageGrade: 85.2,
        courseCompletionRate: 0.78,
        anonymizedMetrics: 'Sample anonymized data'
      },
      cohortSize,
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      },
      anonymizedFields: ['studentId', 'email', 'firstName', 'lastName'],
      aggregationMethod: 'average'
    };
  }

  async getAnonymizedStudentAnalytics(criteria: AnalyticsCriteria, context: PrivacyContext): Promise<AnonymizedData> {
    return this.getAnonymizedAnalytics(criteria, context);
  }

  async getAuditTrail(entityId: string, context: PrivacyContext): Promise<any[]> {
    return this.auditRepository.getEntityAuditTrail('student', entityId, context);
  }

  // Privacy-specific helper methods

  private validatePrivacyContext(context: PrivacyContext): void {
    if (!PrivacyUtils.validatePrivacyContext(context)) {
      throw new Error('Invalid privacy context');
    }
  }

  private hasAccessPermission(studentId: string, context: PrivacyContext): boolean {
    // System always has access
    if (context.requesterType === 'system') return true;
    
    // Admin always has access
    if (context.requesterType === 'admin') return true;
    
    // Students can access their own data
    if (context.requesterType === 'student' && context.requesterId === studentId) return true;
    
    // Educators need educational justification
    if (context.requesterType === 'educator' && context.educationalJustification) return true;
    
    return false;
  }

  private hasUpdatePermission(studentId: string, context: PrivacyContext): boolean {
    // Only students can update their own data, or admins
    return (
      (context.requesterType === 'student' && context.requesterId === studentId) ||
      context.requesterType === 'admin'
    );
  }

  private applyDataMinimization(student: User, context: PrivacyContext): User {
    // Return full data for system and admin
    if (['system', 'admin'].includes(context.requesterType)) {
      return student;
    }

    // For educators, hide sensitive personal information
    if (context.requesterType === 'educator') {
      return {
        ...student,
        email: `${student.firstName.toLowerCase()}.${student.lastName.toLowerCase()}@[redacted]`,
        passwordHash: '[redacted]',
        bio: student.bio ? '[redacted]' : null
      };
    }

    // For students viewing their own data, return full data
    if (context.requesterType === 'student' && context.requesterId === student.id) {
      return student;
    }

    // Default: return minimal data
    return {
      ...student,
      email: '[redacted]',
      passwordHash: '[redacted]',
      bio: '[redacted]',
      profilePicture: null
    };
  }

  private generateDefaultPrivacyMetadata(entityType: string): PrivacyMetadata {
    return PrivacyUtils.generatePrivacyMetadata(entityType);
  }

  private async createDefaultConsentRecords(studentId: string): Promise<void> {
    const defaultConsents: ConsentRecord[] = this.privacyConfig.consent.requiredConsentTypes.map(type => ({
      id: uuidv4(),
      studentId,
      consentType: type,
      status: 'pending',
      timestamp: new Date(),
      policyVersion: '1.0',
      metadata: {
        source: 'registration'
      }
    }));

    this.consentRecords.set(studentId, defaultConsents);
  }

  private async validateConsent(studentId: string, consentType: string, context: PrivacyContext): Promise<boolean> {
    const consents = this.consentRecords.get(studentId) || [];
    const consent = consents.find(c => c.consentType === consentType);
    
    if (!consent) return false;
    
    // Check if consent is still valid
    if (consent.expiresAt && consent.expiresAt < new Date()) {
      return false;
    }
    
    return consent.status === 'granted';
  }

  private async getConsentStatus(studentId: string, consentType: string): Promise<string> {
    const consents = this.consentRecords.get(studentId) || [];
    const consent = consents.find(c => c.consentType === consentType);
    return consent?.status || 'not_found';
  }

  // Testing utilities

  seedPrivacyTestData(): void {
    // Create test students with different privacy scenarios
    
    // Student with full consent
    const student1: User = {
      id: 'privacy-student-1',
      email: 'alice.privacy@test.com',
      passwordHash: 'hashed',
      firstName: 'Alice',
      lastName: 'Privacy',
      role: 'student',
      profilePicture: null,
      bio: 'Test student with full consent',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.students.set(student1.id, student1);
    this.privacyMetadata.set(student1.id, {
      sensitivityLevel: 'private',
      consentRequired: true,
      consentStatus: 'granted',
      analyticsAllowed: true,
      aggregationAllowed: true,
      flags: { ferpa: true, pii: true }
    });

    // Student with denied consent
    const student2: User = {
      id: 'privacy-student-2',
      email: 'bob.noconsent@test.com',
      passwordHash: 'hashed',
      firstName: 'Bob',
      lastName: 'NoConsent',
      role: 'student',
      profilePicture: null,
      bio: 'Test student who denied consent',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.students.set(student2.id, student2);
    this.privacyMetadata.set(student2.id, {
      sensitivityLevel: 'highly_sensitive',
      consentRequired: true,
      consentStatus: 'denied',
      analyticsAllowed: false,
      aggregationAllowed: false,
      flags: { ferpa: true, pii: true, minorData: true }
    });

    // Set up consent records
    this.consentRecords.set(student1.id, [
      {
        id: uuidv4(),
        studentId: student1.id,
        consentType: 'data_collection',
        status: 'granted',
        timestamp: new Date(),
        policyVersion: '1.0'
      }
    ]);

    this.consentRecords.set(student2.id, [
      {
        id: uuidv4(),
        studentId: student2.id,
        consentType: 'data_collection',
        status: 'denied',
        timestamp: new Date(),
        policyVersion: '1.0'
      }
    ]);
  }

  // Test utility methods
  clearTestData(): void {
    this.students.clear();
    this.privacyMetadata.clear();
    this.consentRecords.clear();
    this.auditRepository.clearAuditEntries();
  }

  getAuditEntries() {
    return this.auditRepository.getAuditEntries();
  }

  addTestConsent(studentId: string, consentType: 'data_collection' | 'analytics' | 'ai_interaction' | 'educator_access' | 'research', status: 'granted' | 'denied'): void {
    const consents = this.consentRecords.get(studentId) || [];
    consents.push({
      id: uuidv4(),
      studentId,
      consentType,
      status,
      timestamp: new Date(),
      policyVersion: '1.0'
    });
    this.consentRecords.set(studentId, consents);
  }
}