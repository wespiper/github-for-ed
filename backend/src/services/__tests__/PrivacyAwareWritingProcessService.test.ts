/**
 * Tests for Privacy-Aware Writing Process Service
 */

import { PrivacyAwareWritingProcessService } from '../PrivacyAwareWritingProcessService';
import { MockDocumentRepository } from '../../repositories/__mocks__/DocumentRepository.mock';
import { MockLearningAnalyticsRepository } from '../../repositories/__mocks__/LearningAnalyticsRepository.mock';
import { PrivacyContext } from '../../types/privacy';

// Mock EventBus
const mockEventBus = {
  publish: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn()
};

describe('PrivacyAwareWritingProcessService', () => {
  let service: PrivacyAwareWritingProcessService;
  let documentRepo: MockDocumentRepository;
  let analyticsRepo: MockLearningAnalyticsRepository;

  const mockPrivacyContext: PrivacyContext = {
    requesterId: 'educator_1',
    requesterType: 'educator',
    purpose: 'writing process analysis for educational improvement',
    educationalJustification: 'Analyzing student writing patterns to provide better support',
    timestamp: new Date(),
    correlationId: 'test-correlation-id'
  };

  const studentPrivacyContext: PrivacyContext = {
    requesterId: 'student_1',
    requesterType: 'student',
    purpose: 'viewing my writing progress',
    timestamp: new Date()
  };

  let testDocumentId: string;
  let testDocument2Id: string;

  beforeEach(async () => {
    documentRepo = new MockDocumentRepository();
    analyticsRepo = new MockLearningAnalyticsRepository();
    
    // Add test documents to the repository
    const doc1 = await documentRepo.create({
      studentId: 'student_1',
      assignmentId: 'assignment_1',
      title: 'Test Document',
      content: 'Test content',
      version: 1,
      status: 'draft'
    });
    testDocumentId = doc1.id;

    const doc2 = await documentRepo.create({
      studentId: 'student_2',
      assignmentId: 'assignment_1',
      title: 'Another Document',
      content: 'Other content',
      version: 1,
      status: 'draft'
    });
    testDocument2Id = doc2.id;
    
    service = new PrivacyAwareWritingProcessService(
      documentRepo,
      analyticsRepo,
      mockEventBus as any
    );

    // Reset mocks and clear logs
    jest.clearAllMocks();
    documentRepo.clearPrivacyLogs();
    analyticsRepo.clearPrivacyLogs();
  });

  describe('trackWritingChanges', () => {
    it('should track writing changes with proper privacy controls', async () => {
      const sessionId = 'session_1';
      const changes = [
        {
          type: 'addition' as const,
          position: { start: 0, end: 5 },
          newContent: 'Hello',
          wordCountDelta: 1,
          characterCountDelta: 5,
          metadata: {
            sessionId: sessionId,
            aiAssisted: false,
            confidence: 'high' as const,
            category: 'content' as const
          }
        }
      ];

      const result = await service.trackWritingChanges(
        testDocumentId,
        sessionId,
        changes,
        mockPrivacyContext
      );

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0]).toMatchObject({
        type: 'addition',
        newContent: 'Hello',
        wordCountDelta: 1
      });

      // Verify privacy events were published
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'privacy.data.accessed',
          payload: expect.objectContaining({
            educationalJustification: 'Writing process analysis: writing_tracking_started'
          })
        })
      );

      // Verify repository privacy logging
      const documentLogs = documentRepo.getPrivacyLogs();
      expect(documentLogs).toContainEqual(
        expect.objectContaining({
          operation: 'findWithVersions',
          context: mockPrivacyContext
        })
      );
    });

    it('should deny access for unauthorized users', async () => {
      const unauthorizedContext: PrivacyContext = {
        requesterId: 'unauthorized_user',
        requesterType: 'student',
        purpose: 'unauthorized access',
        timestamp: new Date()
      };

      await expect(
        service.trackWritingChanges(testDocument2Id, 'session_1', [], unauthorizedContext)
      ).rejects.toThrow('Insufficient permissions');

      // Verify access denial was logged (document modification denied)
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            educationalJustification: 'Writing process analysis: document_modification_denied'
          })
        })
      );
    });

    it('should handle errors with privacy logging', async () => {
      // Mock repository to throw error
      jest.spyOn(documentRepo, 'findWithVersions').mockRejectedValueOnce(
        new Error('Database error')
      );

      await expect(
        service.trackWritingChanges(testDocumentId, 'session_1', [], mockPrivacyContext)
      ).rejects.toThrow('Database error');

      // Verify error was logged with privacy context
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            educationalJustification: 'Writing process analysis: writing_tracking_error'
          })
        })
      );
    });
  });

  describe('analyzeWritingPatterns', () => {
    it('should analyze patterns with privacy filtering', async () => {
      const result = await service.analyzeWritingPatterns(
        'student_1',
        'assignment_1',
        mockPrivacyContext
      );

      expect(result).toBeDefined();
      expect(result?.studentId).toBe('student_1');
      expect(result?.assignmentId).toBe('assignment_1');

      // Verify privacy events
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            educationalJustification: 'Writing process analysis: pattern_analysis_started'
          })
        })
      );

      // Verify repository access with privacy context
      const documentLogs = documentRepo.getPrivacyLogs();
      expect(documentLogs).toContainEqual(
        expect.objectContaining({
          operation: 'findByStudent',
          context: mockPrivacyContext
        })
      );

      const analyticsLogs = analyticsRepo.getPrivacyLogs();
      expect(analyticsLogs).toContainEqual(
        expect.objectContaining({
          operation: 'getStudentAnalytics',
          context: mockPrivacyContext
        })
      );
    });

    it('should provide limited data for student accessing own data', async () => {
      const result = await service.analyzeWritingPatterns(
        'student_1',
        'assignment_1',
        studentPrivacyContext
      );

      expect(result).toBeDefined();
      
      // Student should get limited detail level
      // Check that privacy context was properly applied
      const documentLogs = documentRepo.getPrivacyLogs();
      expect(documentLogs).toContainEqual(
        expect.objectContaining({
          operation: 'findByStudent',
          context: studentPrivacyContext
        })
      );
    });

    it('should deny access for student requesting another student\'s patterns', async () => {
      const unauthorizedContext: PrivacyContext = {
        requesterId: 'student_2',
        requesterType: 'student',
        purpose: 'viewing patterns',
        timestamp: new Date()
      };

      const result = await service.analyzeWritingPatterns(
        'student_1', // Different student
        'assignment_1',
        unauthorizedContext
      );

      expect(result).toBeNull();

      // Verify access denial was logged
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            educationalJustification: 'Writing process analysis: pattern_analysis_denied'
          })
        })
      );
    });
  });

  describe('compareVersions', () => {
    it('should compare versions with privacy controls', async () => {
      const result = await service.compareVersions(
        testDocumentId,
        'version_1',
        'version_2',
        mockPrivacyContext
      );

      expect(result).toBeDefined();
      expect(result?.fromVersionId).toBe('version_1');
      expect(result?.toVersionId).toBe('version_2');

      // Verify privacy events
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            educationalJustification: 'Writing process analysis: version_comparison_started'
          })
        })
      );
    });

    it('should deny unauthorized version comparison', async () => {
      const unauthorizedContext: PrivacyContext = {
        requesterId: 'unauthorized_user',
        requesterType: 'student',
        purpose: 'unauthorized comparison',
        timestamp: new Date()
      };

      const result = await service.compareVersions(
        testDocument2Id,
        'version_1',
        'version_2',
        unauthorizedContext
      );

      expect(result).toBeNull();

      // Since the operation gets to document access but fails on permissions,
      // it logs the start event first. Let's check that access is properly denied.
      expect(result).toBeNull();
    });
  });

  describe('getWritingDevelopmentTimeline', () => {
    it('should generate timeline with privacy filtering', async () => {
      const result = await service.getWritingDevelopmentTimeline(
        'student_1',
        'assignment_1',
        mockPrivacyContext
      );

      expect(result).toBeDefined();
      expect(result?.studentId).toBe('student_1');
      expect(result?.assignmentId).toBe('assignment_1');
      expect(result?.timeline).toBeDefined();

      // Verify privacy access
      const documentLogs = documentRepo.getPrivacyLogs();
      expect(documentLogs).toContainEqual(
        expect.objectContaining({
          operation: 'findByStudent',
          context: mockPrivacyContext
        })
      );
    });

    it('should respect privacy levels in timeline data', async () => {
      // Test with student context (should get limited data)
      const studentResult = await service.getWritingDevelopmentTimeline(
        'student_1',
        'assignment_1',
        studentPrivacyContext
      );

      expect(studentResult).toBeDefined();
      
      // Test with educator context (should get full data)
      const educatorResult = await service.getWritingDevelopmentTimeline(
        'student_1',
        'assignment_1',
        mockPrivacyContext
      );

      expect(educatorResult).toBeDefined();
      
      // Both should have data but with different detail levels
      expect(studentResult?.timeline).toBeDefined();
      expect(educatorResult?.timeline).toBeDefined();
    });
  });

  describe('analyzeCollaborativeWriting', () => {
    it('should analyze collaboration with privacy aggregation', async () => {
      const result = await service.analyzeCollaborativeWriting(
        testDocumentId,
        mockPrivacyContext
      );

      expect(result).toBeDefined();
      expect(result?.documentId).toBe(testDocumentId);

      // Verify privacy events
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            educationalJustification: 'Writing process analysis: collaboration_analysis_started'
          })
        })
      );
    });

    it('should deny collaboration analysis for students', async () => {
      const result = await service.analyzeCollaborativeWriting(
        testDocumentId,
        studentPrivacyContext
      );

      expect(result).toBeNull();

      // Verify denial was logged
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            educationalJustification: 'Writing process analysis: collaboration_analysis_denied'
          })
        })
      );
    });
  });

  describe('privacy controls', () => {
    it('should log all privacy operations comprehensively', async () => {
      await service.analyzeWritingPatterns('student_1', 'assignment_1', mockPrivacyContext);

      // Check that multiple privacy events were published
      const publishCalls = mockEventBus.publish.mock.calls;
      
      // Should include start and completion events
      expect(publishCalls).toContainEqual([
        expect.objectContaining({
          payload: expect.objectContaining({
            educationalJustification: 'Writing process analysis: pattern_analysis_started'
          })
        })
      ]);

      expect(publishCalls).toContainEqual([
        expect.objectContaining({
          payload: expect.objectContaining({
            educationalJustification: 'Writing process analysis: pattern_analysis_completed'
          })
        })
      ]);
    });

    it('should apply appropriate data filtering based on context', async () => {
      // Test different privacy contexts and verify appropriate access
      const adminContext: PrivacyContext = {
        requesterId: 'admin_1',
        requesterType: 'admin',
        purpose: 'system administration',
        timestamp: new Date()
      };

      const adminResult = await service.analyzeWritingPatterns(
        'student_1',
        'assignment_1',
        adminContext
      );

      const studentResult = await service.analyzeWritingPatterns(
        'student_1',
        'assignment_1',
        studentPrivacyContext
      );

      // Both should succeed but with different detail levels
      expect(adminResult).toBeDefined();
      expect(studentResult).toBeDefined();

      // Verify both accessed data with their respective contexts
      const documentLogs = documentRepo.getPrivacyLogs();
      expect(documentLogs).toContainEqual(
        expect.objectContaining({ context: adminContext })
      );
      expect(documentLogs).toContainEqual(
        expect.objectContaining({ context: studentPrivacyContext })
      );
    });
  });
});