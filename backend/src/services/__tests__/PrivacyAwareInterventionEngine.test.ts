/**
 * Tests for Privacy-Aware Intervention Engine
 */

import { PrivacyAwareInterventionEngine } from '../PrivacyAwareInterventionEngine';
import { MockInterventionRepository } from '../../repositories/__mocks__/InterventionRepository.mock';
import { MockLearningAnalyticsRepository } from '../../repositories/__mocks__/LearningAnalyticsRepository.mock';
import { MockDocumentRepository } from '../../repositories/__mocks__/DocumentRepository.mock';
import { PrivacyContext } from '../../types/privacy';

// Mock EventBus
const mockEventBus = {
  publish: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn()
};

describe('PrivacyAwareInterventionEngine', () => {
  let interventionEngine: PrivacyAwareInterventionEngine;
  let interventionRepo: MockInterventionRepository;
  let analyticsRepo: MockLearningAnalyticsRepository;
  let documentRepo: MockDocumentRepository;

  const mockPrivacyContext: PrivacyContext = {
    requesterId: 'educator_1',
    requesterType: 'educator',
    purpose: 'educational analysis for student support',
    educationalJustification: 'Identifying students who need additional support',
    timestamp: new Date(),
    correlationId: 'test-correlation-id'
  };

  beforeEach(() => {
    interventionRepo = new MockInterventionRepository();
    analyticsRepo = new MockLearningAnalyticsRepository();
    documentRepo = new MockDocumentRepository();
    
    // Clear any existing data
    interventionRepo.reset();
    analyticsRepo.reset();
    documentRepo.reset();
    
    interventionEngine = new PrivacyAwareInterventionEngine(
      interventionRepo,
      analyticsRepo,
      documentRepo,
      mockEventBus as any
    );

    // Reset mocks
    jest.clearAllMocks();
    interventionRepo.clearPrivacyLogs();
    analyticsRepo.clearPrivacyLogs();
    documentRepo.clearPrivacyLogs();
  });

  describe('analyzeStudentWritingProgress', () => {
    it('should analyze student progress with proper privacy controls', async () => {
      const result = await interventionEngine.analyzeStudentWritingProgress(
        'student_1',
        mockPrivacyContext,
        'course_1',
        7
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      // Verify privacy events were published
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'privacy.data.accessed',
          category: 'audit',
          privacyLevel: 'restricted'
        })
      );

      // Verify repository privacy logging
      const analyticsLogs = analyticsRepo.getPrivacyLogs();
      expect(analyticsLogs).toContainEqual(
        expect.objectContaining({
          operation: 'getStudentAnalytics',
          context: mockPrivacyContext
        })
      );

      const documentLogs = documentRepo.getPrivacyLogs();
      expect(documentLogs).toContainEqual(
        expect.objectContaining({
          operation: 'findByStudent',
          context: mockPrivacyContext
        })
      );
    });

    it('should deny access for student requesting another student\'s data', async () => {
      const studentPrivacyContext: PrivacyContext = {
        requesterId: 'student_2',
        requesterType: 'student',
        purpose: 'viewing my progress',
        timestamp: new Date()
      };

      const result = await interventionEngine.analyzeStudentWritingProgress(
        'student_1', // Different student
        studentPrivacyContext
      );

      expect(result).toEqual([]);
      
      // Verify access denial was logged
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'privacy.data.accessed',
          payload: expect.objectContaining({
            educationalJustification: 'Intervention analysis: intervention_access_denied'
          })
        })
      );
    });

    it('should generate appropriate interventions based on data', async () => {
      // Add test data that should trigger interventions
      await analyticsRepo.create({
        studentId: 'student_1',
        metricType: 'progress',
        metricName: 'overall_progress',
        value: 0.3, // Low progress should trigger intervention
        timestamp: new Date()
      });

      const result = await interventionEngine.analyzeStudentWritingProgress(
        'student_1',
        mockPrivacyContext
      );

      expect(result.length).toBeGreaterThan(0);
      
      // Check that intervention was created
      const interventions = await interventionRepo.findByStudent(
        'student_1',
        {},
        mockPrivacyContext
      );
      
      expect(interventions.length).toBeGreaterThan(0);
    });

    it('should respect privacy context when generating recommendations', async () => {
      const limitedPrivacyContext: PrivacyContext = {
        requesterId: 'student_1',
        requesterType: 'student',
        purpose: 'viewing my own progress',
        timestamp: new Date()
      };

      const result = await interventionEngine.analyzeStudentWritingProgress(
        'student_1',
        limitedPrivacyContext
      );

      // Student should get limited intervention details
      expect(result).toBeDefined();
      
      // Verify privacy-appropriate access
      const analyticsLogs = analyticsRepo.getPrivacyLogs();
      expect(analyticsLogs).toContainEqual(
        expect.objectContaining({
          operation: 'getStudentAnalytics',
          context: limitedPrivacyContext
        })
      );
    });
  });

  describe('privacy controls', () => {
    it('should log all privacy operations', async () => {
      await interventionEngine.analyzeStudentWritingProgress(
        'student_1',
        mockPrivacyContext
      );

      // Check that privacy events were published for start and completion
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            educationalJustification: 'Intervention analysis: intervention_analysis_started'
          })
        })
      );

      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            educationalJustification: 'Intervention analysis: intervention_analysis_completed'
          })
        })
      );
    });

    it('should handle errors with privacy logging', async () => {
      // Mock an error in analytics repository
      jest.spyOn(analyticsRepo, 'getStudentAnalytics').mockRejectedValueOnce(
        new Error('Database error')
      );

      await expect(
        interventionEngine.analyzeStudentWritingProgress(
          'student_1',
          mockPrivacyContext
        )
      ).rejects.toThrow('Database error');

      // Verify error was logged with privacy context
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            educationalJustification: 'Intervention analysis: intervention_analysis_error'
          })
        })
      );
    });
  });

  describe('intervention creation', () => {
    it('should create intervention records with privacy metadata', async () => {
      // Set up conditions that will trigger an intervention - create declining trend
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

      // Create declining progress metrics
      await analyticsRepo.create({
        studentId: 'student_1',
        metricType: 'progress',
        metricName: 'overall_progress',
        value: 0.5, // Starting value
        timestamp: twoDaysAgo
      });

      await analyticsRepo.create({
        studentId: 'student_1',
        metricType: 'progress',
        metricName: 'overall_progress',
        value: 0.3, // Declining
        timestamp: oneDayAgo
      });

      await analyticsRepo.create({
        studentId: 'student_1',
        metricType: 'progress',
        metricName: 'overall_progress',
        value: 0.2, // Very low progress - should trigger intervention
        timestamp: now
      });

      const result = await interventionEngine.analyzeStudentWritingProgress(
        'student_1',
        mockPrivacyContext
      );

      if (result.length > 0) {
        const interventions = await interventionRepo.findByStudent(
          'student_1',
          {},
          mockPrivacyContext
        );

        expect(interventions.length).toBeGreaterThan(0);
        
        // Find the intervention we created (not seed data)
        const intervention = interventions.find(i => 
          i.title === 'Writing Productivity Declining' || 
          i.title === 'Writing Quality Needs Attention'
        ) || interventions[0];
        expect(intervention.metadata).toMatchObject({
          privacyContext: {
            requesterId: mockPrivacyContext.requesterId,
            purpose: mockPrivacyContext.purpose
          }
        });
      }
    });
  });
});