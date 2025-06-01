import { ReflectionAnalysisService } from '../ReflectionAnalysisService';
import { ServiceFactory } from '../../../container/ServiceFactory';
import { InMemoryEventBus } from '../../../events/EventBus';
import { InMemoryCacheService } from '../../../cache/RedisCacheService';
import { PrismaReflectionAnalysisRepository } from '../../../repositories/ReflectionRepository';

// Mock the repository imports
jest.mock('../../../repositories/ReflectionRepository', () => ({
  PrismaReflectionAnalysisRepository: jest.fn().mockImplementation(() => ({
    create: jest.fn(),
    findByStudent: jest.fn(),
    getQualityTrends: jest.fn(),
    getClassAnalytics: jest.fn(),
  })),
}));

// Mock the AuthenticityDetector
jest.mock('../AuthenticityDetector', () => ({
  AuthenticityDetector: {
    analyzeAuthenticity: jest.fn(),
  },
}));

describe('Reflection Analysis Workflow Integration Tests', () => {
  let serviceFactory: ServiceFactory;
  let mockEventBus: InMemoryEventBus;
  let mockCache: InMemoryCacheService;
  let mockRepository: jest.Mocked<PrismaReflectionAnalysisRepository>;

  beforeEach(async () => {
    // Set up service factory with mocked services
    serviceFactory = ServiceFactory.getInstance();
    serviceFactory.reset();

    mockEventBus = new InMemoryEventBus();
    mockCache = new InMemoryCacheService();
    
    // Mock the repository
    const MockedRepo = PrismaReflectionAnalysisRepository as jest.MockedClass<typeof PrismaReflectionAnalysisRepository>;
    mockRepository = new MockedRepo() as jest.Mocked<PrismaReflectionAnalysisRepository>;

    // Set up service factory container
    (serviceFactory as any).container = {
      eventBus: mockEventBus,
      cache: mockCache,
    };
    
    await serviceFactory.initialize();
  });

  afterEach(() => {
    serviceFactory.reset();
    jest.clearAllMocks();
  });

  describe('Complete Reflection Analysis Flow', () => {
    const mockContext = {
      studentId: 'student-123',
      assignmentId: 'assignment-456',
      aiInteractionId: 'interaction-789',
      writingStage: 'drafting'
    };

    it('should complete full reflection analysis workflow with high-quality reflection', async () => {
      // Mock authenticity detector
      const { AuthenticityDetector } = require('../AuthenticityDetector');
      AuthenticityDetector.analyzeAuthenticity.mockResolvedValue({
        score: 85,
        flags: [],
        confidence: 90,
        recommendations: []
      });

      // Mock repository response
      mockRepository.create.mockResolvedValue({
        id: 'analysis-123',
        studentId: mockContext.studentId,
        assignmentId: mockContext.assignmentId,
        aiInteractionId: mockContext.aiInteractionId,
        overallQualityScore: 82,
        authenticityScore: 85,
        progressiveAccessLevel: 'enhanced',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);

      // High-quality reflection text
      const highQualityReflection = `
        Working with the AI assistant made me realize how I approach problem-solving differently than I thought. 
        Initially, I assumed I was good at breaking down complex ideas, but the questions challenged me to think 
        more systematically. When the AI asked about my reasoning process, I discovered I often jump to conclusions 
        without considering alternative perspectives.

        This interaction helped me understand that effective analysis requires multiple viewpoints. I used to think 
        being decisive was always good, but I learned that questioning my assumptions leads to better outcomes. 
        The AI's prompts about evidence made me realize I need to support my arguments more thoroughly.

        Moving forward, I want to practice pausing before forming opinions and asking myself "what else could 
        this mean?" This challenge pushed me to grow, and I'm excited to apply this more rigorous thinking 
        to my future writing projects.
      `;

      // Spy on event publishing
      const publishSpy = jest.spyOn(mockEventBus, 'publish');

      // Run analysis
      const result = await ReflectionAnalysisService.analyzeReflection(
        highQualityReflection,
        mockContext
      );

      // Verify analysis quality
      expect(result.overall.qualityScore).toBeGreaterThan(75);
      expect(result.overall.authenticityScore).toBe(85);
      expect(result.overall.progressiveAccessLevel).toBe('enhanced');

      // Verify depth analysis
      expect(result.depth.score).toBeGreaterThan(60);
      expect(result.depth.reasoningChains).toBeGreaterThan(2);
      expect(result.depth.evidenceOfThinking.length).toBeGreaterThan(0);

      // Verify self-awareness detection
      expect(result.selfAwareness.recognizesGaps).toBe(true);
      expect(result.selfAwareness.identifiesLearningProcess).toBe(true);
      expect(result.selfAwareness.score).toBeGreaterThan(70);

      // Verify critical thinking indicators
      expect(result.criticalEngagement.evaluatesMultiplePerspectives).toBe(true);
      expect(result.criticalEngagement.score).toBeGreaterThan(60);

      // Verify growth mindset
      expect(result.growthMindset.focusOnLearning).toBe(true);
      expect(result.growthMindset.seeksImprovement).toBe(true);
      expect(result.growthMindset.score).toBeGreaterThan(70);

      // Verify repository was called to store analysis
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: mockContext.studentId,
          assignmentId: mockContext.assignmentId,
          aiInteractionId: mockContext.aiInteractionId,
          reflectionText: highQualityReflection,
          overallQualityScore: expect.any(Number),
          authenticityScore: 85,
          progressiveAccessLevel: expect.any(String)
        })
      );

      // Verify events were published
      expect(publishSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ai_interaction_logged',
          payload: expect.objectContaining({
            studentId: mockContext.studentId,
            aiService: 'reflection_analyzer'
          })
        })
      );

      expect(publishSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'student_progress_updated',
          payload: expect.objectContaining({
            studentId: mockContext.studentId,
            progressType: 'reflection',
            currentState: expect.objectContaining({
              reflectionDepth: expect.any(Number),
              selfAwareness: expect.any(Number),
              criticalThinking: expect.any(Number),
              growthMindset: expect.any(Number)
            })
          })
        })
      );

      // Verify cache was used
      expect(mockCache.isConnected()).toBe(true);
    });

    it('should handle low-quality reflection appropriately', async () => {
      AuthenticityDetector.analyzeAuthenticity.mockResolvedValue({
        score: 60,
        flags: ['formulaic_patterns'],
        confidence: 70,
        recommendations: ['Be more specific']
      });

      mockRepository.create.mockResolvedValue({
        id: 'analysis-124',
        overallQualityScore: 35,
        authenticityScore: 60,
        progressiveAccessLevel: 'restricted'
      } as any);

      // Low-quality reflection
      const lowQualityReflection = `
        The AI helped me think. These questions made me realize things. 
        I learned from this interaction. This was helpful because it was good.
      `;

      const result = await ReflectionAnalysisService.analyzeReflection(
        lowQualityReflection,
        mockContext
      );

      // Verify low scores
      expect(result.overall.qualityScore).toBeLessThan(50);
      expect(result.overall.progressiveAccessLevel).toBe('restricted');
      expect(result.depth.score).toBeLessThan(40);
      expect(result.selfAwareness.score).toBeLessThan(50);

      // Verify appropriate recommendations
      expect(result.overall.recommendations).toContain('Try to explain your thinking in more detail');
      expect(result.overall.recommendations).toContain('Include specific examples from your writing');
    });

    it('should detect authenticity issues and adjust access levels', async () => {
      AuthenticityDetector.analyzeAuthenticity.mockResolvedValue({
        score: 30,
        flags: ['ai_generated', 'formulaic_patterns'],
        confidence: 85,
        recommendations: ['Write in your own voice', 'Be more personal']
      });

      const suspiciousReflection = `
        Upon careful consideration of the artificial intelligence's pedagogical interventions, 
        I have conducted a comprehensive analysis of my metacognitive processes. The systematic 
        examination of my learning trajectory has yielded significant insights regarding the 
        optimization of my academic performance metrics.
      `;

      const result = await ReflectionAnalysisService.analyzeReflection(
        suspiciousReflection,
        mockContext
      );

      // Should be restricted due to low authenticity
      expect(result.overall.progressiveAccessLevel).toBe('restricted');
      expect(result.overall.authenticityScore).toBe(30);
      expect(result.overall.recommendations).toContain('Make your reflections more personal and specific');
    });
  });

  describe('Reflection History and Trends', () => {
    it('should get student reflection history with proper caching', async () => {
      const mockHistoryData = [
        {
          overallQualityScore: 80,
          depthScore: 75,
          selfAwarenessScore: 85,
          criticalThinkingScore: 70,
          growthMindsetScore: 90,
          createdAt: new Date('2024-01-03')
        },
        {
          overallQualityScore: 70,
          depthScore: 65,
          selfAwarenessScore: 75,
          criticalThinkingScore: 60,
          growthMindsetScore: 80,
          createdAt: new Date('2024-01-02')
        },
        {
          overallQualityScore: 60,
          depthScore: 55,
          selfAwarenessScore: 65,
          criticalThinkingScore: 50,
          growthMindsetScore: 70,
          createdAt: new Date('2024-01-01')
        }
      ];

      mockRepository.findByStudent.mockResolvedValue(mockHistoryData as any);

      const result = await ReflectionAnalysisService.getStudentReflectionHistory('student-123');

      expect(result.totalReflections).toBe(3);
      expect(result.averageQuality).toBe(70); // (80 + 70 + 60) / 3
      expect(result.qualityTrend).toBe('improving');
      expect(result.strengths).toContain('Growth mindset'); // 80 average > 70
      expect(result.strengths).toContain('Self-awareness'); // 75 average > 70

      // Verify cache was used
      expect(mockCache.isConnected()).toBe(true);

      // Call again to test cache hit
      await ReflectionAnalysisService.getStudentReflectionHistory('student-123');
      
      // Repository should only be called once due to caching
      expect(mockRepository.findByStudent).toHaveBeenCalledTimes(1);
    });

    it('should handle empty reflection history', async () => {
      mockRepository.findByStudent.mockResolvedValue([]);

      const result = await ReflectionAnalysisService.getStudentReflectionHistory('new-student');

      expect(result.totalReflections).toBe(0);
      expect(result.averageQuality).toBe(0);
      expect(result.qualityTrend).toBe('stable');
      expect(result.areasForGrowth).toContain('Begin building reflection practice');
    });
  });

  describe('Adaptive Requirements Calculation', () => {
    it('should adjust requirements based on student history', async () => {
      // Mock high-performing student
      mockRepository.findByStudent.mockResolvedValue([
        { overallQualityScore: 85 },
        { overallQualityScore: 82 },
        { overallQualityScore: 88 }
      ] as any);

      const questions = [
        'How did this interaction change your approach?',
        'What assumptions did you question?'
      ];

      const result = await ReflectionAnalysisService.calculateRequirements('student-123', questions);

      expect(result.qualityThreshold).toBe('analytical');
      expect(result.minimumLength).toBe(100);
      expect(result.prompts).toContain('Analyze how this interaction advanced your critical thinking');
    });

    it('should provide more support for struggling students', async () => {
      // Mock struggling student
      mockRepository.findByStudent.mockResolvedValue([
        { overallQualityScore: 25 },
        { overallQualityScore: 30 },
        { overallQualityScore: 20 }
      ] as any);

      const result = await ReflectionAnalysisService.calculateRequirements('struggling-student', []);

      expect(result.qualityThreshold).toBe('detailed');
      expect(result.minimumLength).toBe(150);
      expect(result.prompts).toContain('Explain specifically how these questions changed your thinking');
      expect(result.prompts).toContain('What assumptions did you discover in your writing?');
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle repository failures gracefully', async () => {
      mockRepository.create.mockRejectedValue(new Error('Database connection failed'));

      const reflection = 'This is a test reflection that should still be analyzed even if storage fails.';

      // Should not throw, but log error
      const result = await ReflectionAnalysisService.analyzeReflection(reflection, mockContext);

      expect(result).toBeDefined();
      expect(result.overall.qualityScore).toBeGreaterThan(0);
      // Analysis should complete even if storage fails
    });

    it('should handle authenticity detection failures', async () => {
      AuthenticityDetector.analyzeAuthenticity.mockRejectedValue(new Error('AI service unavailable'));

      const reflection = 'This reflection should still work with fallback authenticity scoring.';

      const result = await ReflectionAnalysisService.analyzeReflection(reflection, mockContext);

      expect(result).toBeDefined();
      expect(result.overall.authenticityScore).toBeGreaterThan(0);
      // Should fall back to simple authenticity check
    });
  });
});