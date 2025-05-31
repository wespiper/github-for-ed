import { EducatorAlertService, EducatorAlert, AlertType } from '../EducatorAlertService';
import { CognitiveLoadIndicators } from '../CognitiveLoadDetector';
import { InterventionDecision } from '../RealTimeInterventionEngine';
import { WritingProcessInsights } from '../WritingProcessAnalyzer';
import { StudentLearningProfile } from '../StudentLearningProfileService';
import prisma from '../../../lib/prisma';
import { randomUUID } from 'crypto';

// Mock modules
jest.mock('../../../lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn()
    },
    course: {
      findMany: jest.fn()
    },
    notification: {
      create: jest.fn()
    }
  }
}));

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid')
}));

describe('EducatorAlertService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    (randomUUID as jest.Mock).mockReturnValue('test-uuid');
  });

  const mockStudent = {
    id: 'student-123',
    firstName: 'Jane',
    lastName: 'Doe'
  };

  const mockCognitiveLoad: CognitiveLoadIndicators = {
    deletionRatio: 3.5,
    pausePatterns: [15, 20, 25],
    revisionCycles: 8,
    cursorThrashing: true,
    wordProductionRate: 3,
    timeOnTask: 45,
    progressStagnation: false,
    estimatedLoad: 'overload',
    confidence: 0.9,
    factors: ['High deletion rate indicates struggle', 'Jumping between sections frequently']
  };

  const mockProfile: StudentLearningProfile = {
    studentId: 'student-123',
    preferences: {
      questionComplexity: 'mixed',
      bestRespondsTo: ['analytical_questions'],
      strugglesWithTopics: [],
      averageReflectionDepth: 60,
      preferredLearningStyle: 'visual'
    },
    strengths: {
      evidenceAnalysis: 70,
      perspectiveTaking: 65,
      logicalReasoning: 75,
      creativeThinking: 60,
      organizationalSkills: 55,
      metacognition: 70
    },
    currentState: {
      cognitiveLoad: 'high',
      recentBreakthrough: false,
      strugglingDuration: 20,
      lastSuccessfulInteraction: null,
      currentFocus: 'test assignment',
      emotionalState: 'frustrated'
    },
    independenceMetrics: {
      aiRequestFrequency: 3,
      independentWorkStreak: 20,
      qualityWithoutAI: 75,
      trend: 'stable',
      lastMilestone: null
    },
    learningPatterns: {
      bestTimeOfDay: 'morning',
      averageSessionLength: 45,
      breakFrequency: 2,
      productivityPattern: 'steady'
    }
  };

  describe('createCognitiveOverloadAlert', () => {
    it('should create alert for cognitive overload', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockStudent);

      const alert = await EducatorAlertService.createCognitiveOverloadAlert(
        'student-123',
        'assignment-456',
        mockCognitiveLoad
      );

      expect(alert).toBeDefined();
      expect(alert?.type).toBe('cognitive_overload');
      expect(alert?.priority).toBe('high');
      expect(alert?.studentName).toBe('Jane Doe');
      expect(alert?.message).toContain('90% confidence');
      expect(alert?.actionItems).toHaveLength(3);
    });

    it('should not create alert for non-overload states', async () => {
      const lowLoad: CognitiveLoadIndicators = {
        ...mockCognitiveLoad,
        estimatedLoad: 'optimal',
        confidence: 0.8
      };

      const alert = await EducatorAlertService.createCognitiveOverloadAlert(
        'student-123',
        'assignment-456',
        lowLoad
      );

      expect(alert).toBeNull();
    });

    it('should not create alert for low confidence overload', async () => {
      const lowConfidenceLoad: CognitiveLoadIndicators = {
        ...mockCognitiveLoad,
        confidence: 0.6
      };

      const alert = await EducatorAlertService.createCognitiveOverloadAlert(
        'student-123',
        'assignment-456',
        lowConfidenceLoad
      );

      expect(alert).toBeNull();
    });
  });

  describe('createWritingStruggleAlert', () => {
    it('should create alert for multiple unresolved struggles', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockStudent);

      const insights: WritingProcessInsights = {
        studentId: 'student-123',
        assignmentId: 'assignment-456',
        dominantPattern: { type: 'perfectionist', confidence: 0.8, evidence: [] },
        secondaryPatterns: [],
        processStages: [],
        timeDistribution: {
          planning: 10,
          drafting: 40,
          revising: 30,
          editing: 15,
          polishing: 5
        },
        coherenceScore: 65,
        developmentScore: 70,
        revisionQuality: 55,
        productivePeriods: [],
        strugglePoints: [
          {
            timestamp: new Date(),
            type: 'struggling',
            duration: 25,
            resolved: false
          },
          {
            timestamp: new Date(),
            type: 'stagnant',
            duration: 40,
            resolved: false
          }
        ],
        improvementAreas: ['Focus on developing ideas more fully'],
        strengths: ['Maintains coherence'],
        processRecommendations: ['Try timed freewriting'],
        interventionSuggestions: ['Provide scaffolding questions']
      };

      const alert = await EducatorAlertService.createWritingStruggleAlert(
        'student-123',
        'assignment-456',
        insights
      );

      expect(alert).toBeDefined();
      expect(alert?.type).toBe('writing_struggle');
      expect(alert?.priority).toBe('high'); // 65 minutes > 60
      expect(alert?.message).toContain('2 unresolved struggle periods');
      expect(alert?.message).toContain('65 minutes');
      expect(alert?.data.recommendations).toContain('Try timed freewriting');
    });

    it('should not create alert for resolved struggles', async () => {
      const insights: WritingProcessInsights = {
        studentId: 'student-123',
        assignmentId: 'assignment-456',
        dominantPattern: { type: 'linear', confidence: 0.8, evidence: [] },
        secondaryPatterns: [],
        processStages: [],
        timeDistribution: {
          planning: 10,
          drafting: 40,
          revising: 30,
          editing: 15,
          polishing: 5
        },
        coherenceScore: 80,
        developmentScore: 85,
        revisionQuality: 75,
        productivePeriods: [],
        strugglePoints: [
          {
            timestamp: new Date(),
            type: 'struggling',
            duration: 15,
            resolved: true
          }
        ],
        improvementAreas: [],
        strengths: ['Consistent progress'],
        processRecommendations: [],
        interventionSuggestions: []
      };

      const alert = await EducatorAlertService.createWritingStruggleAlert(
        'student-123',
        'assignment-456',
        insights
      );

      expect(alert).toBeNull();
    });
  });

  describe('createBreakthroughAlert', () => {
    it('should create positive reinforcement alert', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockStudent);

      const alert = await EducatorAlertService.createBreakthroughAlert(
        'student-123',
        'assignment-456',
        mockProfile,
        'completed first draft without excessive revision'
      );

      expect(alert.type).toBe('breakthrough_moment');
      expect(alert.priority).toBe('low');
      expect(alert.title).toContain('🎉');
      expect(alert.message).toContain('Jane has achieved');
      expect(alert.category).toBe('positive_reinforcement');
      expect(alert.actionItems).toContainEqual({
        label: 'Send Congratulations',
        action: 'send_message',
        data: { studentId: 'student-123', type: 'congratulations' }
      });
    });
  });

  describe('createPatternChangeAlert', () => {
    it('should create alert with pattern implications', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockStudent);

      const alert = await EducatorAlertService.createPatternChangeAlert(
        'student-123',
        'course-789',
        'perfectionist',
        'linear',
        0.85
      );

      expect(alert.type).toBe('pattern_change');
      expect(alert.priority).toBe('medium');
      expect(alert.message).toContain('perfectionist to linear');
      expect(alert.message).toContain('85% confidence');
      expect(alert.data.implications).toContain('Student may be developing healthier writing habits');
    });
  });

  describe('createDeadlineRiskAlert', () => {
    it('should create urgent alert for imminent deadline', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockStudent);

      const alert = await EducatorAlertService.createDeadlineRiskAlert(
        'student-123',
        'assignment-456',
        'Research Paper',
        12, // 12 hours
        25  // 25% complete
      );

      expect(alert.type).toBe('deadline_risk');
      expect(alert.priority).toBe('urgent');
      expect(alert.message).toContain('25% of "Research Paper"');
      expect(alert.message).toContain('12 hours until deadline');
      expect(alert.actionItems).toHaveLength(3);
      expect(alert.expiresAt).toBeDefined();
    });

    it('should set appropriate priority based on time remaining', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockStudent);

      // Test different time thresholds
      const alert36h = await EducatorAlertService.createDeadlineRiskAlert(
        'student-123',
        'assignment-456',
        'Essay',
        36,
        30
      );
      expect(alert36h.priority).toBe('high');

      const alert72h = await EducatorAlertService.createDeadlineRiskAlert(
        'student-123',
        'assignment-456',
        'Essay',
        72,
        30
      );
      expect(alert72h.priority).toBe('medium');
    });
  });

  describe('createInterventionNeededAlert', () => {
    it('should create alert when intervention is needed', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockStudent);

      const interventionDecision: InterventionDecision = {
        shouldIntervene: true,
        intervention: {
          id: 'intervention-123',
          type: 'process_question',
          priority: 'high',
          message: 'What is your main focus?',
          dismissable: true,
          educationalRationale: 'Help student prioritize'
        },
        reason: 'High cognitive load detected with 85% confidence'
      };

      const alert = await EducatorAlertService.createInterventionNeededAlert(
        'student-123',
        'assignment-456',
        interventionDecision,
        mockProfile
      );

      expect(alert).toBeDefined();
      expect(alert?.type).toBe('intervention_needed');
      expect(alert?.priority).toBe('high');
      expect(alert?.message).toContain('frustrated');
      expect(alert?.actionItems).toContainEqual({
        label: 'Review Intervention',
        action: 'review_intervention',
        data: { 
          studentId: 'student-123', 
          interventionId: 'intervention-123' 
        }
      });
    });

    it('should not create alert when intervention not needed', async () => {
      const noInterventionDecision: InterventionDecision = {
        shouldIntervene: false,
        reason: 'Cognitive load within acceptable range'
      };

      const alert = await EducatorAlertService.createInterventionNeededAlert(
        'student-123',
        'assignment-456',
        noInterventionDecision,
        mockProfile
      );

      expect(alert).toBeNull();
    });
  });

  describe('createSupportRequestAlert', () => {
    it('should create high priority support request alert', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockStudent);

      const alert = await EducatorAlertService.createSupportRequestAlert(
        'student-123',
        'assignment-456',
        'content_help',
        'I don\'t understand how to structure my argument'
      );

      expect(alert.type).toBe('support_request');
      expect(alert.priority).toBe('high');
      expect(alert.category).toBe('immediate_attention');
      expect(alert.message).toContain('I don\'t understand how to structure my argument');
      expect(alert.actionItems).toHaveLength(3);
    });
  });

  describe('sendAlert', () => {
    it('should send immediate alert based on preferences', async () => {
      // Mock preferences to use immediate aggregation
      jest.spyOn(EducatorAlertService as any, 'getEducatorPreferences').mockResolvedValue({
        educatorId: 'educator-123',
        enabledTypes: ['cognitive_overload'],
        priorityThreshold: 'low',
        aggregationPreference: 'immediate',
        channels: ['in_app']
      });

      const alert: EducatorAlert = {
        id: 'alert-123',
        type: 'cognitive_overload',
        priority: 'high',
        studentId: 'student-123',
        studentName: 'Jane Doe',
        assignmentId: 'assignment-456',
        title: 'Test Alert',
        message: 'Test message',
        data: {},
        actionItems: [],
        createdAt: new Date(),
        category: 'immediate_attention'
      };

      await EducatorAlertService.sendAlert(alert, 'educator-123');

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recipientId: 'educator-123',
          type: 'cognitive_overload',
          priority: 'high',
          title: 'Test Alert',
          message: 'Test message',
          category: 'educational_alert',
          status: 'unread'
        })
      });
    });
  });

  describe('getEducatorPreferences', () => {
    it('should return default preferences with all alert types enabled', async () => {
      const prefs = await EducatorAlertService.getEducatorPreferences('educator-123');

      expect(prefs.educatorId).toBe('educator-123');
      expect(prefs.enabledTypes).toHaveLength(9);
      expect(prefs.priorityThreshold).toBe('medium');
      expect(prefs.aggregationPreference).toBe('batched');
      expect(prefs.channels).toContain('in_app');
    });
  });

  describe('sendBatchedAlerts', () => {
    it('should create batched notification', async () => {
      // Mock getBatchedAlerts to return some alerts
      jest.spyOn(EducatorAlertService as any, 'getBatchedAlerts').mockResolvedValue({
        educatorId: 'educator-123',
        alerts: [
          {
            type: 'cognitive_overload',
            priority: 'high',
            studentName: 'Jane Doe'
          },
          {
            type: 'writing_struggle',
            priority: 'medium',
            studentName: 'John Smith'
          }
        ],
        summary: 'Test summary',
        priority: 'high'
      });

      jest.spyOn(EducatorAlertService as any, 'clearBatch').mockResolvedValue(undefined);

      await EducatorAlertService.sendBatchedAlerts('educator-123');

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recipientId: 'educator-123',
          type: 'alert_batch',
          priority: 'high',
          title: '2 Student Alerts'
        })
      });
    });
  });
});