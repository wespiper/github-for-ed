import { AIBoundaryService, AIAssistanceRequest, AIAssistanceType } from '../AIBoundaryService';
import { EducationalAIService } from '../ai/EducationalAIService';
import { 
  MockStudentRepository, 
  MockAssignmentRepository, 
  MockAIInteractionRepository 
} from '../../repositories/mock';

// Mock the ReflectionAnalysisService
jest.mock('../ai/ReflectionAnalysisService', () => ({
  ReflectionAnalysisService: {
    getStudentReflectionHistory: jest.fn().mockResolvedValue({
      averageQuality: 75,
      totalReflections: 5
    }),
    calculateRequirements: jest.fn().mockResolvedValue({
      minimumLength: 100,
      qualityThreshold: 'basic',
      prompts: ['Test reflection prompt']
    })
  }
}));

describe('AIBoundaryService with Repository Pattern', () => {
  let aiService: AIBoundaryService;
  let studentRepository: MockStudentRepository;
  let assignmentRepository: MockAssignmentRepository;
  let aiInteractionRepository: MockAIInteractionRepository;
  let educationalAIService: EducationalAIService;

  beforeEach(() => {
    // Create fresh mock repositories for each test
    studentRepository = new MockStudentRepository();
    assignmentRepository = new MockAssignmentRepository();
    aiInteractionRepository = new MockAIInteractionRepository();
    
    // Create EducationalAIService with mock repositories
    educationalAIService = new EducationalAIService(
      studentRepository,
      assignmentRepository,
      aiInteractionRepository
    );

    // Create AIBoundaryService with dependencies
    aiService = new AIBoundaryService(
      studentRepository,
      assignmentRepository,
      aiInteractionRepository,
      educationalAIService
    );
  });

  afterEach(() => {
    // Clean up mock data
    studentRepository.clearMockData();
    assignmentRepository.clearMockData();
    aiInteractionRepository.clearMockData();
  });

  describe('evaluateAssistanceRequest', () => {
    const mockRequest: AIAssistanceRequest = {
      studentId: 'student-1',
      assignmentId: 'assignment-1',
      assistanceType: 'grammar',
      context: {
        currentStage: 'drafting',
        contentSample: 'This is a test essay about climate change.',
        specificQuestion: 'Can you help me with grammar?',
        learningObjective: 'Improve writing skills'
      },
      timestamp: new Date()
    };

    test('should approve request for valid student and assignment', async () => {
      const response = await aiService.evaluateAssistanceRequest(mockRequest);

      expect(response.approved).toBe(true);
      expect(response.educationalGuidance).toBeDefined();
      expect(response.educationalGuidance?.content).toBeInstanceOf(Array);
      expect(response.educationalGuidance?.content.length).toBeGreaterThan(0);
      expect(response.mandatoryReflection.required).toBe(true);
    });

    test('should provide educational questions instead of direct answers', async () => {
      const response = await aiService.evaluateAssistanceRequest(mockRequest);

      expect(response.approved).toBe(true);
      expect(response.educationalGuidance?.type).toBe('question');
      expect(response.educationalGuidance?.content).toEqual(
        expect.arrayContaining([expect.stringContaining('?')])
      );
    });

    test('should include contribution tracking', async () => {
      const response = await aiService.evaluateAssistanceRequest(mockRequest);

      expect(response.contributionTracking).toBeDefined();
      expect(response.contributionTracking.mustBeAttributed).toBe(true);
      expect(response.contributionTracking.visibleToEducator).toBe(true);
    });

    test('should generate different questions for different assistance types', async () => {
      const grammarRequest = { ...mockRequest, assistanceType: 'grammar' as const };
      const structureRequest = { ...mockRequest, assistanceType: 'structure' as const };

      const grammarResponse = await aiService.evaluateAssistanceRequest(grammarRequest);
      const structureResponse = await aiService.evaluateAssistanceRequest(structureRequest);

      expect(grammarResponse.educationalGuidance?.content).not.toEqual(
        structureResponse.educationalGuidance?.content
      );
    });
  });

  describe('configureAssignmentBoundaries', () => {
    test('should update assignment AI boundaries', async () => {
      const boundaries = {
        enabled: true,
        globalBoundary: 'moderate' as const,
        allowedAssistanceTypes: ['grammar', 'style'] as AIAssistanceType[],
        stageSpecificSettings: [],
        requireReflection: true,
        reflectionPrompts: ['Test prompt']
      };

      await aiService.configureAssignmentBoundaries(
        'assignment-1',
        'instructor-1',
        boundaries
      );

      // Verify the assignment was updated through the repository
      const updatedAssignment = await assignmentRepository.findById('assignment-1');
      expect(updatedAssignment?.aiSettings).toEqual(boundaries);
    });

    test('should throw error for non-existent assignment', async () => {
      const boundaries = {
        enabled: true,
        globalBoundary: 'moderate' as const,
        allowedAssistanceTypes: ['grammar'] as AIAssistanceType[],
        stageSpecificSettings: [],
        requireReflection: true,
        reflectionPrompts: []
      };

      await expect(
        aiService.configureAssignmentBoundaries(
          'non-existent',
          'instructor-1',
          boundaries
        )
      ).rejects.toThrow('Assignment not found');
    });

    test('should throw error for wrong instructor', async () => {
      const boundaries = {
        enabled: true,
        globalBoundary: 'moderate' as const,
        allowedAssistanceTypes: ['grammar'] as AIAssistanceType[],
        stageSpecificSettings: [],
        requireReflection: true,
        reflectionPrompts: []
      };

      await expect(
        aiService.configureAssignmentBoundaries(
          'assignment-1',
          'wrong-instructor',
          boundaries
        )
      ).rejects.toThrow('Only the assignment instructor can configure AI boundaries');
    });
  });

  describe('getAIUsageAnalytics', () => {
    test('should return usage analytics for student and assignment', async () => {
      // Add some mock interactions
      aiInteractionRepository.addMockInteraction({
        studentId: 'student-1',
        assignmentId: 'assignment-1',
        assistanceType: 'grammar',
        educationallySound: true
      });

      aiInteractionRepository.addMockInteraction({
        studentId: 'student-1',
        assignmentId: 'assignment-1',
        assistanceType: 'style',
        educationallySound: true
      });

      const analytics = await aiService.getAIUsageAnalytics(
        'student-1',
        'assignment-1'
      );

      expect(analytics.studentId).toBe('student-1');
      expect(analytics.assignmentId).toBe('assignment-1');
      expect(analytics.usageStats.totalRequests).toBe(2);
      expect(analytics.usageStats.approvedRequests).toBe(2);
      expect(analytics.usageStats.assistanceTypes.grammar).toBe(1);
      expect(analytics.usageStats.assistanceTypes.style).toBe(1);
    });

    test('should calculate learning impact metrics', async () => {
      // Add mock student with analytics
      studentRepository.addMockStudent({
        id: 'test-student',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'Student'
      });

      const analytics = await aiService.getAIUsageAnalytics(
        'test-student',
        'assignment-1'
      );

      expect(analytics.learningImpact).toBeDefined();
      expect(analytics.learningImpact.skillDevelopmentScore).toBeGreaterThanOrEqual(0);
      expect(analytics.learningImpact.skillDevelopmentScore).toBeLessThanOrEqual(100);
    });
  });

  describe('assessAIDependency', () => {
    test('should assess student AI dependency correctly', async () => {
      // Add high-frequency interactions to trigger dependency detection
      for (let i = 0; i < 25; i++) {
        aiInteractionRepository.addMockInteraction({
          studentId: 'student-1',
          assignmentId: 'assignment-1',
          createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000) // Spread over 25 days
        });
      }

      const timeframe = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      };

      const dependency = await aiService.assessAIDependency(
        'student-1',
        'course-1',
        timeframe
      );

      expect(dependency.dependencyLevel).toBe('moderate');
      expect(dependency.indicators).toContain('High total usage count');
      expect(dependency.interventionNeeded).toBe(false); // Only high dependency needs intervention
    });

    test('should identify high dependency students', async () => {
      // Add many interactions in short time period
      for (let i = 0; i < 50; i++) {
        aiInteractionRepository.addMockInteraction({
          studentId: 'student-1',
          assignmentId: 'assignment-1',
          createdAt: new Date(Date.now() - i * 60 * 60 * 1000) // One per hour for 50 hours
        });
      }

      const timeframe = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      };

      const dependency = await aiService.assessAIDependency(
        'student-1',
        'course-1',
        timeframe
      );

      expect(dependency.dependencyLevel).toBe('high');
      expect(dependency.interventionNeeded).toBe(true);
      expect(dependency.recommendations).toContain('Encourage independent work sessions');
    });
  });

  describe('getAICoachingInsights', () => {
    test('should provide insights for instructors', async () => {
      // Add some mock data for analysis
      assignmentRepository.addMockAIInteraction('assignment-1', {
        studentId: 'student-1',
        assistanceType: 'grammar'
      });

      assignmentRepository.addMockAIInteraction('assignment-1', {
        studentId: 'student-2',
        assistanceType: 'style'
      });

      const insights = await aiService.getAICoachingInsights(
        'instructor-1',
        'course-1'
      );

      expect(insights.classOverview).toBeDefined();
      expect(insights.classOverview.totalStudents).toBeGreaterThan(0);
      expect(insights.classOverview.aiActiveStudents).toBeGreaterThanOrEqual(0);
      expect(insights.studentConcerns).toBeInstanceOf(Array);
      expect(insights.boundaryRecommendations).toBeInstanceOf(Array);
    });

    test('should throw error for wrong instructor', async () => {
      await expect(
        aiService.getAICoachingInsights('wrong-instructor', 'course-1')
      ).rejects.toThrow('Access denied');
    });
  });

  describe('generatePostAssistanceReflection', () => {
    test('should generate appropriate reflection prompts', () => {
      const reflection = aiService.generatePostAssistanceReflection(
        'grammar',
        'Test context about writing'
      );

      expect(reflection.prompts).toBeInstanceOf(Array);
      expect(reflection.prompts.length).toBeGreaterThan(0);
      expect(reflection.requiredResponses).toBeGreaterThan(0);
      expect(reflection.learningGoals).toBeInstanceOf(Array);
      expect(reflection.learningGoals.length).toBeGreaterThan(0);
    });

    test('should generate different prompts for different assistance types', () => {
      const grammarReflection = aiService.generatePostAssistanceReflection('grammar', 'test');
      const styleReflection = aiService.generatePostAssistanceReflection('style', 'test');

      expect(grammarReflection.prompts).not.toEqual(styleReflection.prompts);
      expect(grammarReflection.learningGoals).not.toEqual(styleReflection.learningGoals);
    });
  });

  describe('Repository Integration', () => {
    test('should use StudentRepository for student operations', async () => {
      const spy = jest.spyOn(studentRepository, 'findLearningAnalytics');
      
      await aiService.getAIUsageAnalytics('student-1', 'assignment-1');
      
      expect(spy).toHaveBeenCalled();
    });

    test('should use AssignmentRepository for assignment operations', async () => {
      const spy = jest.spyOn(assignmentRepository, 'findById');
      
      const boundaries = {
        enabled: true,
        globalBoundary: 'moderate' as const,
        allowedAssistanceTypes: ['grammar'] as AIAssistanceType[],
        stageSpecificSettings: [],
        requireReflection: true,
        reflectionPrompts: []
      };

      await aiService.configureAssignmentBoundaries(
        'assignment-1',
        'instructor-1',
        boundaries
      );
      
      expect(spy).toHaveBeenCalledWith('assignment-1');
    });

    test('should use AIInteractionRepository for interaction operations', async () => {
      const spy = jest.spyOn(aiInteractionRepository, 'findByStudentId');
      
      await aiService.getAIUsageAnalytics('student-1', 'assignment-1');
      
      expect(spy).toHaveBeenCalled();
    });
  });
});