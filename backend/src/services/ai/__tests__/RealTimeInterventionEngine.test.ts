import { RealTimeInterventionEngine } from '../RealTimeInterventionEngine';
import { CognitiveLoadIndicators } from '../CognitiveLoadDetector';
import { StudentLearningProfile } from '../StudentLearningProfileService';
import { WritingStage } from '../../AIBoundaryService';
import prisma from '../../../lib/prisma';

// Mock Prisma
jest.mock('../../../lib/prisma', () => ({
  __esModule: true,
  default: {
    aIInteractionLog: {
      findMany: jest.fn(),
      create: jest.fn()
    },
    writingSession: {
      findFirst: jest.fn()
    }
  }
}));

describe('RealTimeInterventionEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockProfile = (overrides?: Partial<StudentLearningProfile>): StudentLearningProfile => ({
    studentId: 'test-student',
    preferences: {
      questionComplexity: 'mixed',
      bestRespondsTo: ['analytical_questions'],
      strugglesWithTopics: [],
      averageReflectionDepth: 60,
      preferredLearningStyle: 'mixed'
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
      cognitiveLoad: 'optimal',
      recentBreakthrough: false,
      strugglingDuration: 0,
      lastSuccessfulInteraction: new Date(),
      currentFocus: 'test assignment',
      emotionalState: 'neutral'
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
    },
    ...overrides
  });

  describe('evaluateInterventionNeed', () => {
    it('should not intervene during optimal cognitive load', async () => {
      const cognitiveLoad: CognitiveLoadIndicators = {
        deletionRatio: 0.3,
        pausePatterns: [3, 4, 5],
        revisionCycles: 1,
        cursorThrashing: false,
        wordProductionRate: 20,
        timeOnTask: 15,
        progressStagnation: false,
        estimatedLoad: 'optimal',
        confidence: 0.8,
        factors: ['Good writing flow']
      };

      (prisma.aIInteractionLog.findMany as jest.Mock).mockResolvedValue([]);

      const result = await RealTimeInterventionEngine.evaluateInterventionNeed(
        cognitiveLoad,
        'drafting',
        createMockProfile(),
        'test-assignment'
      );

      expect(result.shouldIntervene).toBe(false);
      expect(result.reason).toBe('Cognitive load within acceptable range');
    });

    it('should intervene for overload with high confidence', async () => {
      const cognitiveLoad: CognitiveLoadIndicators = {
        deletionRatio: 3,
        pausePatterns: [15, 20, 25],
        revisionCycles: 8,
        cursorThrashing: true,
        wordProductionRate: 3,
        timeOnTask: 45,
        progressStagnation: false,
        estimatedLoad: 'overload',
        confidence: 0.9,
        factors: ['Multiple stress indicators']
      };

      (prisma.aIInteractionLog.findMany as jest.Mock).mockResolvedValue([]);

      const result = await RealTimeInterventionEngine.evaluateInterventionNeed(
        cognitiveLoad,
        'drafting',
        createMockProfile(),
        'test-assignment'
      );

      expect(result.shouldIntervene).toBe(true);
      expect(result.intervention).toBeDefined();
      expect(result.intervention?.priority).toBe('high');
      expect(result.intervention?.type).toBe('process_question');
      expect(result.intervention?.message).toContain('jumping between sections');
    });

    it('should respect cooldown periods', async () => {
      const cognitiveLoad: CognitiveLoadIndicators = {
        deletionRatio: 3,
        pausePatterns: [],
        revisionCycles: 5,
        cursorThrashing: false,
        wordProductionRate: 5,
        timeOnTask: 30,
        progressStagnation: false,
        estimatedLoad: 'high',
        confidence: 0.85,
        factors: []
      };

      // Mock recent intervention
      (prisma.aIInteractionLog.findMany as jest.Mock).mockResolvedValue([{
        id: 'recent-intervention',
        createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        assistanceType: 'intervention',
        metadata: {}
      }]);

      const result = await RealTimeInterventionEngine.evaluateInterventionNeed(
        cognitiveLoad,
        'drafting',
        createMockProfile(),
        'test-assignment'
      );

      expect(result.shouldIntervene).toBe(false);
      expect(result.reason).toContain('Cooldown period active');
      expect(result.cooldownMinutes).toBeGreaterThan(0);
    });

    it('should respect hourly intervention limit', async () => {
      const cognitiveLoad: CognitiveLoadIndicators = {
        deletionRatio: 2.5,
        pausePatterns: [],
        revisionCycles: 5,
        cursorThrashing: false,
        wordProductionRate: 5,
        timeOnTask: 30,
        progressStagnation: true,
        estimatedLoad: 'high',
        confidence: 0.85,
        factors: []
      };

      // Mock 4 interventions in the last hour
      (prisma.aIInteractionLog.findMany as jest.Mock).mockResolvedValue(
        Array.from({ length: 4 }, (_, i) => ({
          id: `intervention-${i}`,
          createdAt: new Date(Date.now() - (i * 10 + 5) * 60 * 1000),
          assistanceType: 'intervention',
          metadata: {}
        }))
      );

      const result = await RealTimeInterventionEngine.evaluateInterventionNeed(
        cognitiveLoad,
        'drafting',
        createMockProfile(),
        'test-assignment'
      );

      expect(result.shouldIntervene).toBe(false);
      expect(result.reason).toContain('Cooldown period active');
    });

    it('should provide perfectionism intervention for high deletion ratio', async () => {
      const cognitiveLoad: CognitiveLoadIndicators = {
        deletionRatio: 3.5,
        pausePatterns: [5, 7],
        revisionCycles: 6,
        cursorThrashing: false,
        wordProductionRate: 8,
        timeOnTask: 25,
        progressStagnation: false,
        estimatedLoad: 'overload',
        confidence: 0.8,
        factors: ['Excessive rewriting detected']
      };

      (prisma.aIInteractionLog.findMany as jest.Mock).mockResolvedValue([]);

      const result = await RealTimeInterventionEngine.evaluateInterventionNeed(
        cognitiveLoad,
        'drafting',
        createMockProfile(),
        'test-assignment'
      );

      expect(result.shouldIntervene).toBe(true);
      expect(result.intervention?.type).toBe('gentle_prompt');
      expect(result.intervention?.message).toContain('first drafts don\'t need to be perfect');
      expect(result.intervention?.actionButton?.action).toBe('start_freewrite');
    });

    it('should provide encouragement for frustrated students', async () => {
      const cognitiveLoad: CognitiveLoadIndicators = {
        deletionRatio: 1.5,
        pausePatterns: [10, 12],
        revisionCycles: 3,
        cursorThrashing: false,
        wordProductionRate: 10,
        timeOnTask: 35,
        progressStagnation: false,
        estimatedLoad: 'high',
        confidence: 0.82,
        factors: []
      };

      const frustratedProfile = createMockProfile({
        currentState: {
          cognitiveLoad: 'high',
          recentBreakthrough: false,
          strugglingDuration: 20,
          lastSuccessfulInteraction: null,
          currentFocus: 'test assignment',
          emotionalState: 'frustrated'
        }
      });

      (prisma.aIInteractionLog.findMany as jest.Mock).mockResolvedValue([]);

      const result = await RealTimeInterventionEngine.evaluateInterventionNeed(
        cognitiveLoad,
        'drafting',
        frustratedProfile,
        'test-assignment'
      );

      expect(result.shouldIntervene).toBe(true);
      expect(result.intervention?.type).toBe('encouragement');
      expect(result.intervention?.message.toLowerCase()).toContain('writing can be challenging');
    });

    it('should provide stagnation support for low load with no progress', async () => {
      const cognitiveLoad: CognitiveLoadIndicators = {
        deletionRatio: 0.1,
        pausePatterns: [],
        revisionCycles: 0,
        cursorThrashing: false,
        wordProductionRate: 1,
        timeOnTask: 15,
        progressStagnation: true,
        estimatedLoad: 'low',
        confidence: 0.75,
        factors: ['Writing progress has stalled']
      };

      (prisma.aIInteractionLog.findMany as jest.Mock).mockResolvedValue([]);

      const result = await RealTimeInterventionEngine.evaluateInterventionNeed(
        cognitiveLoad,
        'brainstorming',
        createMockProfile(),
        'test-assignment'
      );

      expect(result.shouldIntervene).toBe(true);
      expect(result.intervention?.type).toBe('gentle_prompt');
      expect(result.intervention?.message.toLowerCase()).toContain('starting can be the hardest part');
    });

    it('should add supportive tone for students who prefer it', async () => {
      const cognitiveLoad: CognitiveLoadIndicators = {
        deletionRatio: 2,
        pausePatterns: [8, 10],
        revisionCycles: 4,
        cursorThrashing: false,
        wordProductionRate: 8,
        timeOnTask: 35,
        progressStagnation: true,
        estimatedLoad: 'high',
        confidence: 0.85,
        factors: []
      };

      const supportiveProfile = createMockProfile({
        preferences: {
          questionComplexity: 'mixed',
          bestRespondsTo: ['supportive', 'analytical_questions'],
          strugglesWithTopics: [],
          averageReflectionDepth: 60,
          preferredLearningStyle: 'mixed'
        }
      });

      (prisma.aIInteractionLog.findMany as jest.Mock).mockResolvedValue([]);

      const result = await RealTimeInterventionEngine.evaluateInterventionNeed(
        cognitiveLoad,
        'drafting',
        supportiveProfile,
        'test-assignment'
      );

      expect(result.shouldIntervene).toBe(true);
      // Should contain supportive tone (case-insensitive)
      expect(result.intervention?.message).toMatch(/(you're doing great|keep going!|you've got this|good effort so far)/i);
      expect(result.intervention?.message).toContain('What\'s the main point you want to make');
    });

    it('should raise threshold for independent students', async () => {
      const cognitiveLoad: CognitiveLoadIndicators = {
        deletionRatio: 2,
        pausePatterns: [8],
        revisionCycles: 3,
        cursorThrashing: false,
        wordProductionRate: 12,
        timeOnTask: 25,
        progressStagnation: false,
        estimatedLoad: 'high',
        confidence: 0.78, // Below raised threshold
        factors: []
      };

      const independentProfile = createMockProfile({
        independenceMetrics: {
          aiRequestFrequency: 0.5,
          independentWorkStreak: 120,
          qualityWithoutAI: 85,
          trend: 'decreasing',
          lastMilestone: 'Completed assignment without AI'
        }
      });

      (prisma.aIInteractionLog.findMany as jest.Mock).mockResolvedValue([]);

      const result = await RealTimeInterventionEngine.evaluateInterventionNeed(
        cognitiveLoad,
        'drafting',
        independentProfile,
        'test-assignment'
      );

      expect(result.shouldIntervene).toBe(false);
      expect(result.reason).toBe('Cognitive load within acceptable range');
    });
  });

  describe('logInterventionDelivery', () => {
    it('should log intervention delivery correctly', async () => {
      const intervention = {
        id: 'test-intervention',
        type: 'gentle_prompt' as const,
        priority: 'medium' as const,
        message: 'Test message',
        dismissable: true,
        educationalRationale: 'Test rationale'
      };

      await RealTimeInterventionEngine.logInterventionDelivery(
        intervention,
        'student-id',
        'assignment-id',
        'document-id'
      );

      expect(prisma.aIInteractionLog.create).toHaveBeenCalledWith({
        data: {
          studentId: 'student-id',
          assignmentId: 'assignment-id',
          assistanceType: 'intervention',
          questionsGenerated: 1,
          educationallySound: true,
          writingStage: 'drafting',
          questionText: 'Test message',
          responseId: 'test-intervention',
          metadata: {
            documentId: 'document-id',
            interventionType: 'gentle_prompt',
            priority: 'medium',
            rationale: 'Test rationale',
            educationalContent: {
              interventionId: 'test-intervention',
              type: 'gentle_prompt',
              message: 'Test message',
              priority: 'medium'
            }
          }
        }
      });
    });
  });

  describe('logInterventionResponse', () => {
    it('should log accepted intervention response', async () => {
      await RealTimeInterventionEngine.logInterventionResponse(
        'intervention-123',
        'student-id',
        'assignment-id',
        true,
        'take_break'
      );

      expect(prisma.aIInteractionLog.create).toHaveBeenCalledWith({
        data: {
          studentId: 'student-id',
          assignmentId: 'assignment-id',
          assistanceType: 'intervention_response',
          questionsGenerated: 0,
          educationallySound: true,
          writingStage: 'drafting',
          responseId: 'intervention-123',
          metadata: {
            interventionId: 'intervention-123',
            accepted: true,
            actionTaken: 'take_break',
            responseTime: expect.any(Date),
            action: 'intervention_accepted'
          }
        }
      });
    });

    it('should log dismissed intervention response', async () => {
      await RealTimeInterventionEngine.logInterventionResponse(
        'intervention-456',
        'student-id',
        'assignment-id',
        false
      );

      expect(prisma.aIInteractionLog.create).toHaveBeenCalledWith({
        data: {
          studentId: 'student-id',
          assignmentId: 'assignment-id',
          assistanceType: 'intervention_response',
          questionsGenerated: 0,
          educationallySound: true,
          writingStage: 'drafting',
          responseId: 'intervention-456',
          metadata: {
            interventionId: 'intervention-456',
            accepted: false,
            actionTaken: undefined,
            responseTime: expect.any(Date),
            action: 'intervention_dismissed'
          }
        }
      });
    });
  });

  describe('getEducatorInsights', () => {
    it('should generate educator insights from intervention history', async () => {
      const mockInterventions = [
        {
          createdAt: new Date(),
          metadata: { interventionType: 'break_suggestion', priority: 'high' },
          questionText: 'Take a break'
        },
        {
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          metadata: { interventionType: 'break_suggestion', priority: 'medium' },
          questionText: 'Another break suggestion'
        },
        {
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          metadata: { interventionType: 'process_question', priority: 'low' },
          questionText: 'What is your focus?'
        }
      ];

      (prisma.aIInteractionLog.findMany as jest.Mock).mockResolvedValue(mockInterventions);
      (prisma.writingSession.findFirst as jest.Mock).mockResolvedValue(null);

      const insights = await RealTimeInterventionEngine.getEducatorInsights(
        'student-id',
        'course-id'
      );

      expect(insights.recentInterventions).toHaveLength(3);
      expect(insights.patterns).toContain('Student frequently receives break suggestion interventions');
      expect(insights.recommendations).toContain('Consider shorter assignment sessions with planned breaks');
    });
  });
});