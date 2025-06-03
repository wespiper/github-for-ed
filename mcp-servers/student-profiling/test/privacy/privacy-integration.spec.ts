import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrivacyChoicesService } from '../../src/data-agency/services/privacy-choices.service';
import { DifferentialPrivacyService } from '../../src/privacy-analytics/services/differential-privacy.service';
import { AccessValidatorService } from '../../src/data-agency/services/access-validator.service';
import { PrivacyDashboardService } from '../../src/data-agency/services/privacy-dashboard.service';

describe('Privacy Integration Tests', () => {
  let app: TestingModule;
  let privacyChoicesService: PrivacyChoicesService;
  let differentialPrivacyService: DifferentialPrivacyService;
  let accessValidatorService: AccessValidatorService;
  let dashboardService: PrivacyDashboardService;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    privacyChoicesService = app.get<PrivacyChoicesService>(PrivacyChoicesService);
    differentialPrivacyService = app.get<DifferentialPrivacyService>(DifferentialPrivacyService);
    accessValidatorService = app.get<AccessValidatorService>(AccessValidatorService);
    dashboardService = app.get<PrivacyDashboardService>(PrivacyDashboardService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Privacy Choices Management', () => {
    it('should manage student privacy choices with versioning', async () => {
      const studentId = 'privacy-test-student-1';
      const choices = {
        educationalSharing: {
          teacher: true,
          peer: false,
          parent: true,
        },
        platformImprovement: {
          anonymousPatterns: true,
          featureAnalytics: false,
          research: false,
        },
        personalBenefits: {
          enhancedAnalytics: false,
          portfolio: true,
          careerGuidance: false,
        },
        privacyControls: {
          retentionPeriod: '6_months',
          sensitiveContent: 'hide',
          thirdParty: 'none',
        },
      };

      const update = await privacyChoicesService.managePrivacyChoices(studentId, choices);

      expect(update).toBeDefined();
      expect(update.studentId).toBe(studentId);
      expect(update.newChoices).toMatchObject(choices);
      expect(update.version).toBe('1.0');
      expect(update.timestamp).toBeInstanceOf(Date);
    });

    it('should provide value exchange explanations', async () => {
      const explanations = await privacyChoicesService.getValueExchangeExplanations('student-1');

      expect(explanations).toBeDefined();
      expect(explanations.length).toBeGreaterThan(0);
      expect(explanations[0]).toHaveProperty('feature');
      expect(explanations[0]).toHaveProperty('dataRequired');
      expect(explanations[0]).toHaveProperty('benefit');
      expect(explanations[0]).toHaveProperty('privacyImpact');
      expect(explanations[0]).toHaveProperty('alternativeWithoutData');
    });

    it('should validate choice consistency', async () => {
      const inconsistentChoices = {
        educationalSharing: { teacher: true, peer: false, parent: false },
        platformImprovement: {
          anonymousPatterns: false,
          featureAnalytics: false,
          research: false,
        },
        personalBenefits: {
          enhancedAnalytics: true, // Requires featureAnalytics
          portfolio: false,
          careerGuidance: true, // Works better with anonymousPatterns
        },
        privacyControls: {
          retentionPeriod: '1_year',
          sensitiveContent: 'blur',
          thirdParty: 'none',
        },
      };

      const validation = await privacyChoicesService.validateChoiceConsistency(inconsistentChoices);

      expect(validation.valid).toBe(false);
      expect(validation.issues).toBeDefined();
      expect(validation.issues!.length).toBeGreaterThan(0);
    });
  });

  describe('Differential Privacy Analytics', () => {
    it('should generate privacy-preserving analytics with noise', async () => {
      const cohortIds = Array.from({ length: 15 }, (_, i) => `student-${i}`);
      const metrics = ['average_writing_score', 'completion_rate'];

      const analytics = await differentialPrivacyService.generatePrivacyPreservingAnalytics(
        cohortIds,
        metrics,
        1.0, // epsilon
        1e-5 // delta
      );

      expect(analytics).toBeDefined();
      expect(analytics.cohortSize).toBe(15);
      expect(analytics.metrics).toHaveLength(2);
      expect(analytics.privacyParameters.noiseAdded).toBe(true);
      expect(analytics.privacyParameters.epsilon).toBe(1.0);

      // Check that values are different from raw (noise added)
      analytics.metrics.forEach(metric => {
        if (!metric.suppressed) {
          expect(metric.privatizedValue).not.toBe(metric.rawValue);
          expect(metric.confidence).toBeGreaterThan(0);
        }
      });
    });

    it('should suppress small cohorts', async () => {
      const smallCohort = ['student-1', 'student-2', 'student-3']; // Below minimum
      const metrics = ['average_writing_score'];

      await expect(
        differentialPrivacyService.generatePrivacyPreservingAnalytics(
          smallCohort,
          metrics
        )
      ).rejects.toThrow(/cohort size.*below minimum/i);
    });

    it('should track privacy budget', async () => {
      const entityId = 'class-A';
      
      // Check initial budget
      const initialBudget = await differentialPrivacyService.checkPrivacyBudget(entityId);
      expect(initialBudget.remainingBudget).toBe(10.0);

      // Use some budget
      await differentialPrivacyService.generatePrivacyPreservingAnalytics(
        Array.from({ length: 20 }, (_, i) => `student-${i}`),
        ['test_metric'],
        2.0 // epsilon
      );

      // Check updated budget
      const updatedBudget = await differentialPrivacyService.checkPrivacyBudget(entityId);
      expect(updatedBudget.usedBudget).toBeGreaterThan(0);
      expect(updatedBudget.remainingBudget).toBeLessThan(10.0);
    });
  });

  describe('Access Validation and Control', () => {
    it('should validate teacher access with educational interest', async () => {
      const request = {
        requesterId: 'teacher-123',
        requesterType: 'teacher' as const,
        studentId: 'student-456',
        purpose: 'grade_assignment',
        dataTypes: ['writing_samples', 'skill_assessments'],
        studentBenefit: 'Provide targeted feedback for improvement',
      };

      const result = await accessValidatorService.validateAccessRequest(request);

      expect(result.approved).toBe(true);
      expect(result.accessToken).toBeDefined();
      expect(result.restrictions).toHaveLength(2); // time and field restrictions
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.auditLog).toBeDefined();
    });

    it('should deny access without consent', async () => {
      const request = {
        requesterId: 'researcher-789',
        requesterType: 'researcher' as const,
        studentId: 'student-no-consent',
        purpose: 'academic_study',
        dataTypes: ['learning_patterns', 'behavioral_data'],
        studentBenefit: 'Contribute to educational research',
      };

      const result = await accessValidatorService.validateAccessRequest(request);

      expect(result.approved).toBe(false);
      expect(result.reason).toContain('not consented');
      expect(result.accessToken).toBeUndefined();
    });

    it('should enforce access restrictions for peers', async () => {
      const request = {
        requesterId: 'student-peer-123',
        requesterType: 'peer' as const,
        studentId: 'student-456',
        purpose: 'study_group_formation',
        dataTypes: ['shared_documents', 'public_achievements'],
        studentBenefit: 'Find compatible study partners',
      };

      const result = await accessValidatorService.validateAccessRequest(request);

      // Assuming peer sharing is not consented by default
      expect(result.approved).toBe(false);
    });

    it('should track and query access logs', async () => {
      const studentId = 'student-with-access-logs';
      
      // Create some access requests
      await accessValidatorService.validateAccessRequest({
        requesterId: 'teacher-1',
        requesterType: 'teacher',
        studentId,
        purpose: 'grade_assignment',
        dataTypes: ['writing_samples'],
        studentBenefit: 'Feedback',
      });

      // Query access logs
      const logs = await accessValidatorService.getAccessLogs(studentId);

      expect(logs).toBeDefined();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].studentId).toBe(studentId);
      expect(logs[0].timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Privacy Dashboard Generation', () => {
    it('should create comprehensive privacy dashboard', async () => {
      const studentId = 'dashboard-test-student';
      
      // Set up some privacy data first
      await privacyChoicesService.managePrivacyChoices(studentId, {
        educationalSharing: { teacher: true, peer: false, parent: true },
        platformImprovement: { anonymousPatterns: true, featureAnalytics: true, research: false },
        personalBenefits: { enhancedAnalytics: true, portfolio: false, careerGuidance: false },
        privacyControls: { retentionPeriod: '1_year', sensitiveContent: 'blur', thirdParty: 'none' },
      });

      const dashboard = await dashboardService.createDashboard(
        studentId,
        true, // include recommendations
        'month'
      );

      expect(dashboard).toBeDefined();
      expect(dashboard.studentId).toBe(studentId);
      expect(dashboard.currentChoices).toBeDefined();
      expect(dashboard.privacyScore).toBeDefined();
      expect(dashboard.privacyScore.overallScore).toBeGreaterThan(0);
      expect(dashboard.recommendations).toBeInstanceOf(Array);
      expect(dashboard.dataInventory).toBeDefined();
      expect(dashboard.controls).toBeDefined();
    });

    it('should provide privacy insights and alerts', async () => {
      const insights = await dashboardService.getPrivacyInsights('student-123');

      expect(insights).toBeDefined();
      expect(insights.insights).toBeInstanceOf(Array);
      expect(insights.alerts).toBeInstanceOf(Array);
    });
  });

  describe('End-to-End Privacy Flow', () => {
    it('should enforce privacy choices across all operations', async () => {
      const studentId = 'e2e-privacy-test-student';

      // Step 1: Set restrictive privacy choices
      await privacyChoicesService.managePrivacyChoices(studentId, {
        educationalSharing: { teacher: false, peer: false, parent: false },
        platformImprovement: { anonymousPatterns: false, featureAnalytics: false, research: false },
        personalBenefits: { enhancedAnalytics: false, portfolio: false, careerGuidance: false },
        privacyControls: { retentionPeriod: '3_months', sensitiveContent: 'remove', thirdParty: 'none' },
      });

      // Step 2: Try to access data as teacher (should fail)
      const teacherAccess = await accessValidatorService.validateAccessRequest({
        requesterId: 'teacher-999',
        requesterType: 'teacher',
        studentId,
        purpose: 'grade_assignment',
        dataTypes: ['writing_samples'],
        studentBenefit: 'Feedback',
      });

      expect(teacherAccess.approved).toBe(false);
      expect(teacherAccess.reason).toContain('not consented');

      // Step 3: Update choices to allow teacher access
      await privacyChoicesService.managePrivacyChoices(studentId, {
        educationalSharing: { teacher: true, peer: false, parent: false },
      });

      // Step 4: Retry teacher access (should succeed)
      const teacherAccessRetry = await accessValidatorService.validateAccessRequest({
        requesterId: 'teacher-999',
        requesterType: 'teacher',
        studentId,
        purpose: 'grade_assignment',
        dataTypes: ['writing_samples'],
        studentBenefit: 'Feedback',
      });

      expect(teacherAccessRetry.approved).toBe(true);
      expect(teacherAccessRetry.accessToken).toBeDefined();

      // Step 5: Verify in dashboard
      const dashboard = await dashboardService.createDashboard(studentId);
      expect(dashboard.currentChoices.educationalSharing.teacher).toBe(true);
      expect(dashboard.dataAccessLog.length).toBeGreaterThan(0);
    });
  });
});