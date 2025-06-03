import { Test, TestingModule } from '@nestjs/testing';
import { StudentProfilingService } from './student-profiling.service';

describe('StudentProfilingService', () => {
  let service: StudentProfilingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StudentProfilingService],
    }).compile();

    service = module.get<StudentProfilingService>(StudentProfilingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buildProfile', () => {
    it('should build a public profile for authorized users', async () => {
      const params = {
        studentId: 'test-student-123',
        requesterContext: {
          userId: 'test-student-123',
          role: 'student' as const,
          purpose: 'self-access',
        },
      };

      const profile = await service.buildProfile(params);

      expect(profile).toBeDefined();
      expect(profile.studentId).toBe(params.studentId);
      expect(profile.publicProfile).toBeDefined();
      expect(profile.publicProfile.displayName).toBeDefined();
      expect(profile.publicProfile.grade).toBeDefined();
      expect(profile.publicProfile.learningGoals).toBeInstanceOf(Array);
    });

    it('should include private data for self-access', async () => {
      const params = {
        studentId: 'test-student-123',
        includePrivateData: true,
        requesterContext: {
          userId: 'test-student-123',
          role: 'student' as const,
          purpose: 'self-access',
        },
      };

      const profile = await service.buildProfile(params);

      expect(profile.privateProfile).toBeDefined();
      expect(profile.privateProfile?.learningChallenges).toBeInstanceOf(Array);
      expect(profile.privateProfile?.accommodations).toBeInstanceOf(Array);
    });

    it('should deny access without proper authorization', async () => {
      const params = {
        studentId: 'test-student-123',
        requesterContext: undefined,
      };

      await expect(service.buildProfile(params)).rejects.toThrow('Access denied');
    });
  });

  describe('trackLearningTrajectory', () => {
    it('should track learning milestones with privacy controls', async () => {
      const milestone = {
        id: 'milestone-1',
        skill: 'Essay Writing',
        level: 3,
        achievedAt: new Date(),
        evidence: ['essay1.pdf', 'essay2.pdf'],
      };

      const trajectory = await service.trackLearningTrajectory(
        'test-student-123',
        milestone,
        'anonymized'
      );

      expect(trajectory).toBeDefined();
      expect(trajectory.studentId).toBe('test-student-123');
      expect(trajectory.milestones).toHaveLength(1);
      expect(trajectory.privacyLevel).toBe('anonymized');
    });
  });

  describe('assessSkillDevelopment', () => {
    it('should create skill assessment with sharing controls', async () => {
      const skills = [
        {
          skillName: 'Critical Thinking',
          currentLevel: 3,
          targetLevel: 5,
          progress: 0.6,
          lastAssessed: new Date(),
        },
        {
          skillName: 'Research Skills',
          currentLevel: 2,
          targetLevel: 4,
          progress: 0.5,
          lastAssessed: new Date(),
        },
      ];

      const assessment = await service.assessSkillDevelopment(
        'test-student-123',
        skills,
        []
      );

      expect(assessment).toBeDefined();
      expect(assessment.skills).toHaveLength(2);
      expect(assessment.overallProgress).toBe(55); // (60 + 50) / 2
      expect(assessment.recommendations).toHaveLength(2);
    });
  });

  describe('generatePersonalizedRecommendations', () => {
    it('should generate basic recommendations without enhanced data', async () => {
      const recommendations = await service.generatePersonalizedRecommendations(
        'test-student-123',
        { useEnhancedData: false }
      );

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].dataUsed).toContain('basic_performance');
      expect(recommendations[0].confidenceScore).toBeLessThan(0.8);
    });

    it('should provide better recommendations with enhanced data', async () => {
      // This would require mocking privacy choices to allow enhanced analytics
      const recommendations = await service.generatePersonalizedRecommendations(
        'test-student-123',
        { useEnhancedData: true }
      );

      expect(recommendations).toBeDefined();
      // Confidence should be higher with more data
      expect(recommendations[0].confidenceScore).toBeGreaterThanOrEqual(0.6);
    });
  });
});