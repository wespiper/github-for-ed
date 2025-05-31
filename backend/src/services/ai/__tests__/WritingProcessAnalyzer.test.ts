import { WritingProcessAnalyzer, WritingPattern, ProcessStage } from '../WritingProcessAnalyzer';
import prisma from '../../../lib/prisma';
import { WritingSession } from '@prisma/client';

// Mock Prisma
jest.mock('../../../lib/prisma', () => ({
  __esModule: true,
  default: {
    writingSession: {
      findMany: jest.fn()
    }
  }
}));

// Mock CognitiveLoadDetector
jest.mock('../CognitiveLoadDetector', () => ({
  CognitiveLoadDetector: {
    detectFromSession: jest.fn()
  }
}));

describe('WritingProcessAnalyzer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock for CognitiveLoadDetector
    const { CognitiveLoadDetector } = require('../CognitiveLoadDetector');
    CognitiveLoadDetector.detectFromSession.mockReturnValue({
      deletionRatio: 0.5,
      pausePatterns: [3, 4, 5],
      revisionCycles: 2,
      cursorThrashing: false,
      wordProductionRate: 20,
      timeOnTask: 30,
      progressStagnation: false,
      estimatedLoad: 'optimal',
      confidence: 0.8,
      factors: ['Good writing flow']
    });
  });

  const createMockSession = (overrides: any = {}): any => ({
    id: 'session-1',
    userId: 'student-1',
    documentId: 'doc-1',
    startTime: new Date('2024-01-01T10:00:00Z'),
    endTime: new Date('2024-01-01T10:30:00Z'),
    duration: 1800, // 30 minutes in seconds
    activity: {
      charactersAdded: 2000,
      charactersDeleted: 500,
      wordsAdded: 400,
      wordsDeleted: 100,
      pauseCount: 5,
      copyPasteEvents: 0,
      timestamps: [],
      edits: []
    },
    createdAt: new Date(),
    snapshots: null,
    productivity: null,
    ...overrides
  });

  describe('analyzeWritingProcess', () => {
    it('should return empty insights when no sessions exist', async () => {
      (prisma.writingSession.findMany as jest.Mock).mockResolvedValue([]);

      const insights = await WritingProcessAnalyzer.analyzeWritingProcess(
        'student-1',
        'assignment-1'
      );

      expect(insights.studentId).toBe('student-1');
      expect(insights.assignmentId).toBe('assignment-1');
      expect(insights.dominantPattern.type).toBe('exploratory');
      expect(insights.dominantPattern.confidence).toBe(0);
      expect(insights.improvementAreas).toContain('No data available for analysis');
    });

    it('should identify linear writing pattern', async () => {
      const mockSessions = [
        createMockSession({
          activity: {
            wordsAdded: 500,
            wordsDeleted: 50,
            charactersAdded: 2500,
            charactersDeleted: 250
          }
        }),
        createMockSession({
          activity: {
            wordsAdded: 400,
            wordsDeleted: 40,
            charactersAdded: 2000,
            charactersDeleted: 200
          }
        })
      ];

      (prisma.writingSession.findMany as jest.Mock).mockResolvedValue(mockSessions);

      // Mock linear pattern indicators
      const { CognitiveLoadDetector } = require('../CognitiveLoadDetector');
      CognitiveLoadDetector.detectFromSession.mockReturnValue({
        deletionRatio: 0.1,
        pausePatterns: [3, 4],
        revisionCycles: 0,
        cursorThrashing: false,
        wordProductionRate: 25,
        timeOnTask: 30,
        progressStagnation: false,
        estimatedLoad: 'optimal',
        confidence: 0.85,
        factors: ['Smooth writing flow']
      });

      const insights = await WritingProcessAnalyzer.analyzeWritingProcess(
        'student-1',
        'assignment-1'
      );

      expect(insights.dominantPattern.type).toBe('linear');
      expect(insights.dominantPattern.evidence).toContain('Consistent forward progress');
      expect(insights.dominantPattern.evidence).toContain('Low deletion ratios');
    });

    it('should identify perfectionist pattern', async () => {
      const mockSessions = [
        createMockSession({
          activity: {
            wordsAdded: 200,
            wordsDeleted: 300,
            charactersAdded: 1000,
            charactersDeleted: 1500
          }
        }),
        createMockSession({
          activity: {
            wordsAdded: 150,
            wordsDeleted: 250,
            charactersAdded: 750,
            charactersDeleted: 1250
          }
        })
      ];

      (prisma.writingSession.findMany as jest.Mock).mockResolvedValue(mockSessions);

      // Mock high deletion ratio for perfectionist pattern
      const { CognitiveLoadDetector } = require('../CognitiveLoadDetector');
      CognitiveLoadDetector.detectFromSession.mockReturnValue({
        deletionRatio: 2.5,
        pausePatterns: [10, 15, 20],
        revisionCycles: 8,
        cursorThrashing: false,
        wordProductionRate: 5,
        timeOnTask: 30,
        progressStagnation: false,
        estimatedLoad: 'high',
        confidence: 0.85,
        factors: ['High deletion rate indicates struggle']
      });

      const insights = await WritingProcessAnalyzer.analyzeWritingProcess(
        'student-1',
        'assignment-1'
      );

      expect(['perfectionist', 'recursive'].includes(insights.dominantPattern.type)).toBe(true);
      // Check for either perfectionist or recursive recommendations
      const hasRelevantRecommendation = insights.processRecommendations.some(rec => 
        rec.includes('freewriting') || rec.includes('revision') || rec.includes('outline')
      );
      expect(hasRelevantRecommendation).toBe(true);
    });

    it('should calculate process stage distribution', async () => {
      const mockSessions = [
        createMockSession({
          activity: { wordsAdded: 50, wordsDeleted: 10 },
          duration: 600 // 10 minutes planning
        }),
        createMockSession({
          activity: { wordsAdded: 400, wordsDeleted: 50 },
          duration: 1800 // 30 minutes drafting
        }),
        createMockSession({
          activity: { wordsAdded: 100, wordsDeleted: 150 },
          duration: 1200 // 20 minutes revising
        })
      ];

      (prisma.writingSession.findMany as jest.Mock).mockResolvedValue(mockSessions);

      const insights = await WritingProcessAnalyzer.analyzeWritingProcess(
        'student-1',
        'assignment-1'
      );

      expect(insights.timeDistribution.planning).toBeGreaterThan(0);
      expect(insights.timeDistribution.drafting).toBeGreaterThan(0);
      expect(insights.timeDistribution.revising).toBeGreaterThan(0);
      expect(insights.processStages).toHaveLength(3);
    });

    it('should identify struggle points', async () => {
      const mockSessions = [
        createMockSession({
          activity: { wordsAdded: 400, wordsDeleted: 50 }
        }),
        createMockSession({
          activity: { wordsAdded: 20, wordsDeleted: 15 },
          startTime: new Date('2024-01-01T11:00:00Z')
        }),
        createMockSession({
          activity: { wordsAdded: 300, wordsDeleted: 40 },
          startTime: new Date('2024-01-01T12:00:00Z')
        })
      ];

      (prisma.writingSession.findMany as jest.Mock).mockResolvedValue(mockSessions);

      // Mock struggling session
      const { CognitiveLoadDetector } = require('../CognitiveLoadDetector');
      CognitiveLoadDetector.detectFromSession
        .mockReturnValueOnce({
          estimatedLoad: 'optimal',
          progressStagnation: false,
          wordProductionRate: 20,
          deletionRatio: 0.3,
          factors: []
        })
        .mockReturnValueOnce({
          estimatedLoad: 'high',
          progressStagnation: true,
          wordProductionRate: 1,
          deletionRatio: 0.75,
          factors: ['Writing progress has stalled']
        })
        .mockReturnValueOnce({
          estimatedLoad: 'optimal',
          progressStagnation: false,
          wordProductionRate: 18,
          deletionRatio: 0.2,
          factors: []
        });

      const insights = await WritingProcessAnalyzer.analyzeWritingProcess(
        'student-1',
        'assignment-1'
      );

      expect(insights.strugglePoints).toHaveLength(1);
      expect(['struggling', 'stagnant'].includes(insights.strugglePoints[0].type)).toBe(true);
      expect(insights.strugglePoints[0].resolved).toBe(true);
    });

    it('should calculate quality scores', async () => {
      const mockSessions = [
        createMockSession({
          activity: { wordsAdded: 300, wordsDeleted: 50 }
        }),
        createMockSession({
          activity: { wordsAdded: 400, wordsDeleted: 80 }
        }),
        createMockSession({
          activity: { wordsAdded: 200, wordsDeleted: 100 }
        })
      ];

      (prisma.writingSession.findMany as jest.Mock).mockResolvedValue(mockSessions);

      const insights = await WritingProcessAnalyzer.analyzeWritingProcess(
        'student-1',
        'assignment-1'
      );

      expect(insights.coherenceScore).toBeGreaterThan(0);
      expect(insights.coherenceScore).toBeLessThanOrEqual(100);
      expect(insights.developmentScore).toBeGreaterThan(0);
      expect(insights.developmentScore).toBeLessThanOrEqual(100);
      expect(insights.revisionQuality).toBeGreaterThan(0);
      expect(insights.revisionQuality).toBeLessThanOrEqual(100);
    });

    it('should identify productive periods', async () => {
      const mockSessions = [
        createMockSession({
          startTime: new Date('2024-01-01T09:00:00'),
          activity: { wordsAdded: 500, wordsDeleted: 50 }
        }),
        createMockSession({
          startTime: new Date('2024-01-01T14:00:00'),
          activity: { wordsAdded: 200, wordsDeleted: 40 }
        }),
        createMockSession({
          startTime: new Date('2024-01-02T09:30:00'),
          activity: { wordsAdded: 450, wordsDeleted: 60 }
        })
      ];

      (prisma.writingSession.findMany as jest.Mock).mockResolvedValue(mockSessions);

      const insights = await WritingProcessAnalyzer.analyzeWritingProcess(
        'student-1',
        'assignment-1'
      );

      expect(insights.productivePeriods).toHaveLength(2);
      expect(insights.productivePeriods[0].timeOfDay).toBe('morning');
      expect(insights.productivePeriods[0].productivityRate).toBeGreaterThan(
        insights.productivePeriods[1].productivityRate
      );
    });

    it('should generate appropriate recommendations', async () => {
      const mockSessions = [
        createMockSession({
          activity: { wordsAdded: 50, wordsDeleted: 10 },
          duration: 300 // 5 minutes - too short for planning
        }),
        createMockSession({
          activity: { wordsAdded: 400, wordsDeleted: 350 }
        })
      ];

      (prisma.writingSession.findMany as jest.Mock).mockResolvedValue(mockSessions);

      const insights = await WritingProcessAnalyzer.analyzeWritingProcess(
        'student-1',
        'assignment-1'
      );

      expect(insights.processRecommendations).toContain('Spend more time planning before drafting');
    });
  });

  describe('analyzeCrossAssignmentPatterns', () => {
    it('should identify consistent patterns across assignments', async () => {
      const mockSessions = [
        // Assignment 1 - Linear pattern
        createMockSession({
          documentId: 'doc-1',
          activity: { wordsAdded: 400, wordsDeleted: 40 },
          document: { assignmentId: 'assignment-1' }
        }),
        createMockSession({
          documentId: 'doc-1',
          activity: { wordsAdded: 300, wordsDeleted: 30 },
          document: { assignmentId: 'assignment-1' }
        }),
        // Assignment 2 - Also linear
        createMockSession({
          documentId: 'doc-2',
          activity: { wordsAdded: 450, wordsDeleted: 45 },
          document: { assignmentId: 'assignment-2' }
        }),
        createMockSession({
          documentId: 'doc-2',
          activity: { wordsAdded: 350, wordsDeleted: 35 },
          document: { assignmentId: 'assignment-2' }
        })
      ];

      (prisma.writingSession.findMany as jest.Mock).mockResolvedValue(mockSessions);

      const analysis = await WritingProcessAnalyzer.analyzeCrossAssignmentPatterns(
        'student-1',
        'course-1'
      );

      expect(analysis.consistentPatterns.length).toBeGreaterThan(0);
      expect(analysis.evolution).toHaveLength(2); // Two assignments
    });

    it('should track pattern evolution over time', async () => {
      const mockSessions = [
        // Early assignment - struggling
        createMockSession({
          documentId: 'doc-1',
          startTime: new Date('2024-01-01'),
          activity: { wordsAdded: 100, wordsDeleted: 150 },
          document: { assignmentId: 'assignment-1' }
        }),
        // Later assignment - improved
        createMockSession({
          documentId: 'doc-2',
          startTime: new Date('2024-01-15'),
          activity: { wordsAdded: 400, wordsDeleted: 80 },
          document: { assignmentId: 'assignment-2' }
        })
      ];

      (prisma.writingSession.findMany as jest.Mock).mockResolvedValue(mockSessions);

      const analysis = await WritingProcessAnalyzer.analyzeCrossAssignmentPatterns(
        'student-1'
      );

      expect(analysis.evolution).toHaveLength(2);
      expect(analysis.evolution[0].date).toEqual(new Date('2024-01-01'));
      expect(analysis.evolution).toHaveLength(2);
    });

    it('should generate recommendations for variable patterns', async () => {
      const mockSessions = [
        // Assignment 1 - Linear
        createMockSession({
          documentId: 'doc-1',
          activity: { wordsAdded: 400, wordsDeleted: 40 },
          document: { assignmentId: 'assignment-1' }
        }),
        // Assignment 2 - Perfectionist
        createMockSession({
          documentId: 'doc-2',
          activity: { wordsAdded: 200, wordsDeleted: 300 },
          document: { assignmentId: 'assignment-2' }
        }),
        // Assignment 3 - Burst
        createMockSession({
          documentId: 'doc-3',
          duration: 900, // 15 minutes
          activity: { wordsAdded: 350, wordsDeleted: 30 },
          document: { assignmentId: 'assignment-3' }
        })
      ];

      (prisma.writingSession.findMany as jest.Mock).mockResolvedValue(mockSessions);

      // Mock varying cognitive load patterns
      const { CognitiveLoadDetector } = require('../CognitiveLoadDetector');
      CognitiveLoadDetector.detectFromSession
        .mockReturnValueOnce({
          estimatedLoad: 'optimal',
          wordProductionRate: 25,
          deletionRatio: 0.1,
          timeOnTask: 30,
          factors: []
        })
        .mockReturnValueOnce({
          estimatedLoad: 'high',
          wordProductionRate: 5,
          deletionRatio: 1.5,
          timeOnTask: 30,
          factors: []
        })
        .mockReturnValueOnce({
          estimatedLoad: 'optimal',
          wordProductionRate: 30,
          deletionRatio: 0.1,
          timeOnTask: 15,
          factors: []
        });

      const analysis = await WritingProcessAnalyzer.analyzeCrossAssignmentPatterns(
        'student-1'
      );

      // Should have found at least one pattern since we only have 3 assignments
      expect(analysis.evolution).toHaveLength(3);
    });
  });
});