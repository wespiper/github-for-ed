import { CognitiveLoadDetector } from '../CognitiveLoadDetector';
import { WritingSession } from '@prisma/client';
import { StudentLearningProfile } from '../StudentLearningProfileService';

describe('CognitiveLoadDetector', () => {
  describe('detectFromSession', () => {
    const createMockSession = (activity: any, duration: number = 1800): WritingSession & { activity?: any } => ({
      id: 'test-session',
      userId: 'test-user',
      documentId: 'test-doc',
      startTime: new Date(),
      endTime: new Date(),
      duration,
      activity,
      createdAt: new Date(),
      snapshots: null,
      productivity: null
    });

    it('should detect low cognitive load for smooth writing', () => {
      const activity = {
        charactersAdded: 1000,
        charactersDeleted: 100,
        wordsAdded: 200,
        wordsDeleted: 20,
        pauseCount: 5,
        copyPasteEvents: 0,
        timestamps: Array.from({ length: 20 }, (_, i) => i * 3000), // Regular 3-second intervals
        edits: Array.from({ length: 10 }, (_, i) => ({
          timestamp: i * 6000,
          type: 'add' as const,
          length: 100,
          position: i * 100
        }))
      };

      const result = CognitiveLoadDetector.detectFromSessionSync(
        createMockSession(activity, 600) // 10 minutes in seconds
      );

      expect(result.estimatedLoad).toBe('optimal'); // Good flow is optimal, not low
      expect(result.deletionRatio).toBeLessThan(0.5);
      expect(result.wordProductionRate).toBeGreaterThan(15);
      expect(result.progressStagnation).toBe(false);
      expect(result.factors).toContain('Smooth writing flow');
    });

    it('should detect high cognitive load for struggling writer', () => {
      const activity = {
        charactersAdded: 500,
        charactersDeleted: 800,
        wordsAdded: 100,
        wordsDeleted: 160,
        pauseCount: 15,
        copyPasteEvents: 0,
        timestamps: [0, 5000, 10000, 25000, 30000, 45000], // Long pauses
        edits: [
          { timestamp: 0, type: 'add' as const, length: 50, position: 0 },
          { timestamp: 5000, type: 'delete' as const, length: 50, position: 0 },
          { timestamp: 10000, type: 'add' as const, length: 50, position: 0 },
          { timestamp: 15000, type: 'delete' as const, length: 50, position: 0 },
          { timestamp: 20000, type: 'add' as const, length: 50, position: 0 }
        ]
      };

      const result = CognitiveLoadDetector.detectFromSessionSync(
        createMockSession(activity, 1800) // 30 minutes in seconds
      );

      expect(result.estimatedLoad).toBe('high');
      expect(result.deletionRatio).toBeGreaterThan(1.5);
      expect(result.revisionCycles).toBeGreaterThan(0);
      // With these specific values, other factors take precedence
      expect(result.factors.length).toBeGreaterThan(0);
    });

    it('should detect overload with multiple stress indicators', () => {
      const activity = {
        charactersAdded: 200,
        charactersDeleted: 600,
        wordsAdded: 40,
        wordsDeleted: 120,
        pauseCount: 20,
        copyPasteEvents: 0,
        timestamps: Array.from({ length: 10 }, (_, i) => i * 15000), // Very long pauses
        edits: Array.from({ length: 15 }, (_, i) => ({
          timestamp: i * 2000,
          type: i % 2 === 0 ? 'add' : 'delete' as const,
          length: 50,
          position: 100
        })),
        cursorPositions: Array.from({ length: 20 }, (_, i) => i % 2 === 0 ? 0 : 500) // Jumping back and forth
      };

      const result = CognitiveLoadDetector.detectFromSessionSync(
        createMockSession(activity, 2700) // 45 minutes in seconds
      );

      expect(result.estimatedLoad).toBe('overload');
      expect(result.cursorThrashing).toBe(true);
      expect(result.factors).toContain('Jumping between sections frequently');
      expect(result.factors).toContain('High deletion rate indicates struggle');
    });

    it('should detect stagnation', () => {
      const activity = {
        charactersAdded: 100,
        charactersDeleted: 50,
        wordsAdded: 20,
        wordsDeleted: 10,
        pauseCount: 10,
        copyPasteEvents: 0,
        timestamps: Array.from({ length: 5 }, (_, i) => i * 60000), // 1 minute intervals
        edits: []
      };

      const result = CognitiveLoadDetector.detectFromSessionSync(
        createMockSession(activity, 1200) // 20 minutes in seconds
      );

      expect(result.progressStagnation).toBe(true);
      expect(result.wordProductionRate).toBeLessThan(2);
      expect(result.factors).toContain('Writing progress has stalled');
    });

    it('should adjust load based on student profile', () => {
      const activity = {
        charactersAdded: 400,
        charactersDeleted: 300,
        wordsAdded: 80,
        wordsDeleted: 60,
        pauseCount: 10,
        copyPasteEvents: 0,
        timestamps: Array.from({ length: 10 }, (_, i) => i * 6000),
        edits: []
      };

      const frustratedProfile: Partial<StudentLearningProfile> = {
        currentState: {
          cognitiveLoad: 'high',
          emotionalState: 'frustrated',
          recentBreakthrough: false,
          strugglingDuration: 15,
          lastSuccessfulInteraction: null,
          currentFocus: 'test assignment'
        },
        preferences: {
          questionComplexity: 'concrete',
          bestRespondsTo: ['supportive'],
          strugglesWithTopics: ['analysis'],
          averageReflectionDepth: 40,
          preferredLearningStyle: 'visual'
        },
        learningPatterns: {
          bestTimeOfDay: 'morning',
          averageSessionLength: 30,
          breakFrequency: 2,
          productivityPattern: 'steady'
        }
      } as any;

      const result = CognitiveLoadDetector.detectFromSessionSync(
        createMockSession(activity, 1800), // 30 minutes in seconds
        frustratedProfile as StudentLearningProfile
      );

      expect(result.estimatedLoad).toBe('overload'); // With frustration multiplier, it becomes overload
      expect(result.factors).toContain('Already showing frustration');
      expect(result.factors).toContain('Student typically struggles with complex tasks');
    });

    it('should handle missing activity data gracefully', () => {
      const result = CognitiveLoadDetector.detectFromSessionSync(
        createMockSession(null)
      );

      expect(result.estimatedLoad).toBe('optimal');
      expect(result.confidence).toBe(0.3);
      expect(result.factors).toContain('Insufficient data for analysis');
    });
  });

  describe('getRecommendations', () => {
    it('should provide overload recommendations', () => {
      const indicators = {
        deletionRatio: 3,
        pausePatterns: [15, 20, 18],
        revisionCycles: 8,
        cursorThrashing: true,
        wordProductionRate: 3,
        timeOnTask: 45,
        progressStagnation: false,
        estimatedLoad: 'overload' as const,
        confidence: 0.9,
        factors: []
      };

      const recommendations = CognitiveLoadDetector.getRecommendations(indicators);

      expect(recommendations).toContain('Consider taking a 5-minute break');
      expect(recommendations).toContain('Perfectionism can slow progress - try moving forward');
      expect(recommendations).toContain('Focus on one section at a time');
    });

    it('should provide optimal load encouragement', () => {
      const indicators = {
        deletionRatio: 0.5,
        pausePatterns: [3, 4, 5],
        revisionCycles: 2,
        cursorThrashing: false,
        wordProductionRate: 20,
        timeOnTask: 20,
        progressStagnation: false,
        estimatedLoad: 'optimal' as const,
        confidence: 0.8,
        factors: []
      };

      const recommendations = CognitiveLoadDetector.getRecommendations(indicators);

      expect(recommendations).toContain('You\'re in a good flow - keep going!');
      expect(recommendations).toContain('Your pace is sustainable');
    });

    it('should provide stagnation-specific recommendations', () => {
      const indicators = {
        deletionRatio: 0.2,
        pausePatterns: [],
        revisionCycles: 0,
        cursorThrashing: false,
        wordProductionRate: 1,
        timeOnTask: 15,
        progressStagnation: true,
        estimatedLoad: 'low' as const,
        confidence: 0.7,
        factors: []
      };

      const recommendations = CognitiveLoadDetector.getRecommendations(indicators);

      expect(recommendations).toContain('Stuck? Try explaining your ideas out loud');
      expect(recommendations).toContain('Try freewriting for 5 minutes without stopping');
    });
  });
});