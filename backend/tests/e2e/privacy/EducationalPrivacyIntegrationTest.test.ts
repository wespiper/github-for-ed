import { describe, beforeAll, afterAll, beforeEach, test, expect } from '@jest/globals';
import { PrivacyE2ETestFramework, TestUser, PrivacyProfile } from './PrivacyE2ETestFramework';

/**
 * Educational Privacy Integration End-to-End Tests
 * 
 * Tests privacy-preserving educational features including AI assistance,
 * learning analytics, collaborative features, and adaptive learning.
 */
describe('Educational Privacy Integration E2E Tests', () => {
  let framework: PrivacyE2ETestFramework;
  let studentUser: TestUser;
  let educatorUser: TestUser;
  let peerUser: TestUser;
  let adminUser: TestUser;

  beforeAll(async () => {
    framework = new PrivacyE2ETestFramework({
      baseURL: process.env.E2E_BASE_URL || 'http://localhost:5001',
      testDatabaseURL: process.env.E2E_DATABASE_URL || 'postgresql://test:test@localhost:5432/scribe_tree_e2e_test'
    });

    await framework.initialize();
  }, 60000);

  afterAll(async () => {
    await framework.cleanup();
  }, 30000);

  beforeEach(async () => {
    const studentProfile: PrivacyProfile = {
      isMinor: false,
      jurisdiction: 'US',
      consents: {
        educational_data_sharing: true,
        optional_analytics: true,
        research_participation: false
      },
      privacyLevel: 'standard',
      dataSharing: 'educational_only'
    };

    const educatorProfile: PrivacyProfile = {
      isMinor: false,
      jurisdiction: 'US',
      consents: {
        educational_data_sharing: true,
        optional_analytics: true,
        research_participation: true
      },
      privacyLevel: 'standard',
      dataSharing: 'research_opt_in'
    };

    const peerProfile: PrivacyProfile = {
      isMinor: false,
      jurisdiction: 'US',
      consents: {
        educational_data_sharing: true,
        optional_analytics: false,
        research_participation: false
      },
      privacyLevel: 'maximum',
      dataSharing: 'educational_only'
    };

    const adminProfile: PrivacyProfile = {
      isMinor: false,
      jurisdiction: 'US',
      consents: {
        educational_data_sharing: true,
        optional_analytics: true,
        research_participation: true
      },
      privacyLevel: 'minimal',
      dataSharing: 'research_opt_in'
    };

    studentUser = await framework.createTestUser('student', studentProfile);
    educatorUser = await framework.createTestUser('educator', educatorProfile);
    peerUser = await framework.createTestUser('student', peerProfile);
    adminUser = await framework.createTestUser('admin', adminProfile);
  }, 30000);

  describe('Privacy-Preserving Learning Analytics', () => {
    test('should provide anonymized class analytics to educators', async () => {
      // Start test implementation
      const startTime = Date.now();
      
      try {
        // Create some learning activity data
        await Promise.all([
          framework.testWritingSessionPrivacy(studentUser),
          framework.testWritingSessionPrivacy(peerUser)
        ]);

        // Request class analytics as educator
        const analyticsResponse = await framework['client'].get('/analytics/class-performance', {
          headers: { Authorization: `Bearer ${educatorUser.authToken}` },
          params: { classId: 'test-class-privacy' }
        });

        expect(analyticsResponse.status).toBe(200);
        expect(analyticsResponse.data).toBeDefined();
        
        // Validate privacy protection in analytics
        const analytics = analyticsResponse.data;
        
        // Should contain aggregated insights
        expect(analytics.classMetrics).toBeDefined();
        expect(analytics.performanceTrends).toBeDefined();
        
        // Should NOT contain individual student identifiers
        expect(analytics.personalInformation).toBeUndefined();
        expect(analytics.studentNames).toBeUndefined();
        expect(analytics.studentEmails).toBeUndefined();
        
        // Should use anonymized identifiers
        if (analytics.individualMetrics) {
          analytics.individualMetrics.forEach((metric: any) => {
            expect(metric.studentId).toMatch(/^anon_/);
            expect(metric.realStudentId).toBeUndefined();
          });
        }

        const responseTime = Date.now() - startTime;
        expect(responseTime).toBeLessThan(1000); // Should be fast

      } catch (error) {
        fail(`Privacy-preserving analytics test failed: ${error.message}`);
      }
    }, 20000);

    test('should apply differential privacy to aggregated student data', async () => {
      try {
        // Generate activity from multiple students
        const studentActivities = await Promise.all([
          framework.testWritingSessionPrivacy(studentUser),
          framework.testWritingSessionPrivacy(peerUser)
        ]);

        // Request aggregated analytics with differential privacy
        const dpAnalyticsResponse = await framework['client'].get('/analytics/differential-privacy', {
          headers: { Authorization: `Bearer ${educatorUser.authToken}` },
          params: { 
            epsilon: 1.0, 
            delta: 0.0001,
            cohortSize: 2
          }
        });

        expect(dpAnalyticsResponse.status).toBe(200);
        
        const dpAnalytics = dpAnalyticsResponse.data;
        
        // Should contain noisy but useful aggregate data
        expect(dpAnalytics.aggregateMetrics).toBeDefined();
        expect(dpAnalytics.privacyBudgetUsed).toBeDefined();
        expect(dpAnalytics.noiseAdded).toBe(true);
        
        // Should document privacy parameters
        expect(dpAnalytics.epsilon).toBe(1.0);
        expect(dpAnalytics.delta).toBe(0.0001);
        
        // Should respect minimum cohort size
        expect(dpAnalytics.cohortSize).toBeGreaterThanOrEqual(2);

      } catch (error) {
        fail(`Differential privacy test failed: ${error.message}`);
      }
    }, 15000);

    test('should provide privacy-compliant learning insights without exposing sensitive patterns', async () => {
      try {
        // Create learning activity with potentially sensitive content
        const writingResult = await framework.testWritingSessionPrivacy(studentUser);
        expect(writingResult.passed).toBe(true);

        // Request learning insights
        const insightsResponse = await framework['client'].get('/analytics/learning-insights', {
          headers: { Authorization: `Bearer ${studentUser.authToken}` }
        });

        expect(insightsResponse.status).toBe(200);
        
        const insights = insightsResponse.data;
        
        // Should provide educational value
        expect(insights.writingProgress).toBeDefined();
        expect(insights.skillDevelopment).toBeDefined();
        expect(insights.recommendations).toBeDefined();
        
        // Should NOT reveal sensitive patterns
        expect(insights.personalTopics).toBeUndefined();
        expect(insights.emotionalPatterns).toBeUndefined();
        expect(insights.familyInformation).toBeUndefined();
        
        // Should focus on educational aspects only
        expect(insights.writingProgress.length).toBeGreaterThan(0);
        expect(insights.recommendations.every((rec: any) => rec.type === 'educational')).toBe(true);

      } catch (error) {
        fail(`Learning insights privacy test failed: ${error.message}`);
      }
    }, 15000);
  });

  describe('Privacy-Aware AI Educational Assistance', () => {
    test('should provide AI assistance while protecting student personal information', async () => {
      try {
        // Start writing session with personal content
        const sessionResponse = await framework['client'].post('/writing/sessions', {
          assignmentId: 'test-assignment-ai-privacy',
          content: 'My family immigrated from Mexico when I was 5. This experience shaped my worldview...',
          aiAssistanceLevel: 'standard'
        }, {
          headers: { Authorization: `Bearer ${studentUser.authToken}` }
        });

        expect(sessionResponse.status).toBe(201);
        const sessionId = sessionResponse.data.sessionId;

        // Request AI assistance
        const aiResponse = await framework['client'].post(`/ai/writing-assistance`, {
          sessionId,
          requestType: 'improvement_suggestions',
          content: sessionResponse.data.content
        }, {
          headers: { Authorization: `Bearer ${studentUser.authToken}` }
        });

        expect(aiResponse.status).toBe(200);
        
        const assistance = aiResponse.data;
        
        // Should provide helpful suggestions
        expect(assistance.suggestions).toBeDefined();
        expect(assistance.suggestions.length).toBeGreaterThan(0);
        
        // Should NOT include personal information in AI interaction logs
        const aiLogsResponse = await framework['client'].get(`/ai/interaction-logs/${sessionId}`, {
          headers: { Authorization: `Bearer ${studentUser.authToken}` }
        });

        expect(aiLogsResponse.status).toBe(200);
        
        const logs = aiLogsResponse.data;
        logs.interactions.forEach((interaction: any) => {
          expect(interaction.personalInformationRemoved).toBe(true);
          expect(interaction.content).not.toMatch(/Mexico|family|immigrated/i);
        });

      } catch (error) {
        fail(`AI assistance privacy test failed: ${error.message}`);
      }
    }, 20000);

    test('should respect student AI privacy preferences in educational interactions', async () => {
      try {
        // Set restrictive AI privacy preferences
        const preferencesResponse = await framework['client'].put('/privacy/ai-preferences', {
          aiDataSharing: 'none',
          aiPersonalization: false,
          aiContentAnalysis: 'surface_only'
        }, {
          headers: { Authorization: `Bearer ${studentUser.authToken}` }
        });

        expect(preferencesResponse.status).toBe(200);

        // Request AI assistance with restrictive settings
        const aiResponse = await framework['client'].post('/ai/writing-assistance', {
          content: 'Help me improve this paragraph about personal growth.',
          assistanceType: 'general_feedback'
        }, {
          headers: { Authorization: `Bearer ${studentUser.authToken}` }
        });

        expect(aiResponse.status).toBe(200);
        
        const assistance = aiResponse.data;
        
        // Should provide limited but helpful assistance
        expect(assistance.suggestions).toBeDefined();
        expect(assistance.privacyMode).toBe('restricted');
        
        // Should NOT use personalization
        expect(assistance.personalizedRecommendations).toBeUndefined();
        expect(assistance.historicalPatterns).toBeUndefined();
        
        // Should document privacy restrictions
        expect(assistance.privacyNotice).toBeDefined();
        expect(assistance.privacyNotice).toMatch(/restricted.*privacy.*settings/i);

      } catch (error) {
        fail(`AI privacy preferences test failed: ${error.message}`);
      }
    }, 15000);

    test('should enable progressive AI assistance based on reflection quality without privacy violations', async () => {
      try {
        // Submit high-quality reflection
        const reflectionResponse = await framework['client'].post('/reflections', {
          assignmentId: 'test-assignment-reflection',
          content: 'Through this writing process, I have learned to identify my strengths in argumentation while recognizing areas for improvement in evidence synthesis. The peer feedback helped me understand different perspectives and refine my critical thinking approach.',
          type: 'process_reflection'
        }, {
          headers: { Authorization: `Bearer ${studentUser.authToken}` }
        });

        expect(reflectionResponse.status).toBe(201);

        // Check reflection quality assessment
        const qualityResponse = await framework['client'].get(`/reflections/${reflectionResponse.data.reflectionId}/quality`, {
          headers: { Authorization: `Bearer ${studentUser.authToken}` }
        });

        expect(qualityResponse.status).toBe(200);
        expect(qualityResponse.data.qualityScore).toBeGreaterThan(80);
        expect(qualityResponse.data.aiAccessLevel).toBe('enhanced');

        // Request enhanced AI assistance
        const enhancedAIResponse = await framework['client'].post('/ai/enhanced-assistance', {
          content: 'I need help developing a more sophisticated argument structure.',
          accessLevel: qualityResponse.data.aiAccessLevel
        }, {
          headers: { Authorization: `Bearer ${studentUser.authToken}` }
        });

        expect(enhancedAIResponse.status).toBe(200);
        
        const enhancedAssistance = enhancedAIResponse.data;
        
        // Should provide enhanced assistance
        expect(enhancedAssistance.suggestions).toBeDefined();
        expect(enhancedAssistance.depth).toBe('enhanced');
        
        // Should still protect privacy even with enhanced access
        expect(enhancedAssistance.privacyProtected).toBe(true);
        expect(enhancedAssistance.personalDataUsed).toBe(false);

      } catch (error) {
        fail(`Progressive AI assistance test failed: ${error.message}`);
      }
    }, 20000);
  });

  describe('Privacy-Protected Collaborative Learning', () => {
    test('should enable peer collaboration while protecting individual privacy', async () => {
      try {
        // Create collaborative assignment
        const assignmentResponse = await framework['client'].post('/assignments/collaborative', {
          title: 'Collaborative Writing Project',
          allowPeerReview: true,
          privacyMode: 'protected_collaboration'
        }, {
          headers: { Authorization: `Bearer ${educatorUser.authToken}` }
        });

        expect(assignmentResponse.status).toBe(201);
        const assignmentId = assignmentResponse.data.assignmentId;

        // Student creates submission
        const submissionResponse = await framework['client'].post('/submissions', {
          assignmentId,
          content: 'My draft explores themes of resilience and personal growth through challenges.',
          shareLevel: 'peer_review_only'
        }, {
          headers: { Authorization: `Bearer ${studentUser.authToken}` }
        });

        expect(submissionResponse.status).toBe(201);

        // Peer views submission for review
        const peerViewResponse = await framework['client'].get(`/submissions/${submissionResponse.data.submissionId}/peer-view`, {
          headers: { Authorization: `Bearer ${peerUser.authToken}` }
        });

        expect(peerViewResponse.status).toBe(200);
        
        const peerView = peerViewResponse.data;
        
        // Should show content for review
        expect(peerView.content).toBeDefined();
        
        // Should protect author identity
        expect(peerView.authorId).toMatch(/^anon_/);
        expect(peerView.authorName).toBe('Anonymous Student');
        expect(peerView.authorEmail).toBeUndefined();
        
        // Should log peer access for audit
        const auditResponse = await framework['client'].get('/audit/peer-access', {
          headers: { Authorization: `Bearer ${adminUser.authToken}` },
          params: { submissionId: submissionResponse.data.submissionId }
        });

        expect(auditResponse.status).toBe(200);
        expect(auditResponse.data.accessEvents.length).toBeGreaterThan(0);

      } catch (error) {
        fail(`Collaborative learning privacy test failed: ${error.message}`);
      }
    }, 25000);

    test('should respect privacy boundaries in peer feedback systems', async () => {
      try {
        // Set privacy preferences for peer interaction
        const peerPrivacyResponse = await framework['client'].put('/privacy/peer-settings', {
          allowAnonymousReviews: true,
          shareWritingPatterns: false,
          limitFeedbackAccess: true
        }, {
          headers: { Authorization: `Bearer ${studentUser.authToken}` }
        });

        expect(peerPrivacyResponse.status).toBe(200);

        // Submit work for peer review
        const workSubmissionResponse = await framework['client'].post('/peer-review/submit', {
          content: 'This is my work that includes some personal experiences.',
          privacyLevel: 'high'
        }, {
          headers: { Authorization: `Bearer ${studentUser.authToken}` }
        });

        expect(workSubmissionResponse.status).toBe(201);

        // Peer provides feedback
        const feedbackResponse = await framework['client'].post('/peer-review/feedback', {
          submissionId: workSubmissionResponse.data.submissionId,
          feedback: 'The argument structure is clear and well-developed.',
          rating: 4
        }, {
          headers: { Authorization: `Bearer ${peerUser.authToken}` }
        });

        expect(feedbackResponse.status).toBe(201);

        // Verify privacy protection in feedback exchange
        const feedbackDataResponse = await framework['client'].get(`/peer-review/feedback/${feedbackResponse.data.feedbackId}`, {
          headers: { Authorization: `Bearer ${studentUser.authToken}` }
        });

        expect(feedbackDataResponse.status).toBe(200);
        
        const feedbackData = feedbackDataResponse.data;
        
        // Should receive feedback
        expect(feedbackData.feedback).toBeDefined();
        
        // Should protect reviewer identity (if requested)
        expect(feedbackData.reviewerId).toMatch(/^anon_/);
        
        // Should not expose personal patterns
        expect(feedbackData.reviewerPatterns).toBeUndefined();
        expect(feedbackData.personalAnalysis).toBeUndefined();

      } catch (error) {
        fail(`Peer feedback privacy test failed: ${error.message}`);
      }
    }, 20000);
  });

  describe('Adaptive Privacy-Aware Learning', () => {
    test('should adapt learning recommendations while preserving privacy', async () => {
      try {
        // Generate learning activity data
        await Promise.all([
          framework.testWritingSessionPrivacy(studentUser),
          framework.testWritingSessionPrivacy(studentUser),
          framework.testWritingSessionPrivacy(studentUser)
        ]);

        // Request adaptive learning recommendations
        const adaptiveResponse = await framework['client'].get('/learning/adaptive-recommendations', {
          headers: { Authorization: `Bearer ${studentUser.authToken}` }
        });

        expect(adaptiveResponse.status).toBe(200);
        
        const recommendations = adaptiveResponse.data;
        
        // Should provide personalized recommendations
        expect(recommendations.skillRecommendations).toBeDefined();
        expect(recommendations.nextSteps).toBeDefined();
        
        // Should be based on aggregated patterns, not personal content
        expect(recommendations.basedOnPersonalContent).toBe(false);
        expect(recommendations.privacyPreserving).toBe(true);
        
        // Should explain privacy approach
        expect(recommendations.privacyNotice).toBeDefined();
        expect(recommendations.privacyNotice).toMatch(/privacy.*preserving.*approach/i);

      } catch (error) {
        fail(`Adaptive learning privacy test failed: ${error.message}`);
      }
    }, 15000);

    test('should provide learning analytics dashboard with privacy controls', async () => {
      try {
        // Access student learning dashboard
        const dashboardResponse = await framework['client'].get('/dashboard/learning-analytics', {
          headers: { Authorization: `Bearer ${studentUser.authToken}` }
        });

        expect(dashboardResponse.status).toBe(200);
        
        const dashboard = dashboardResponse.data;
        
        // Should provide learning insights
        expect(dashboard.progressMetrics).toBeDefined();
        expect(dashboard.skillDevelopment).toBeDefined();
        
        // Should include privacy controls
        expect(dashboard.privacyControls).toBeDefined();
        expect(dashboard.privacyControls.dataSharing).toBeDefined();
        expect(dashboard.privacyControls.analyticsLevel).toBeDefined();
        
        // Should show data usage transparency
        expect(dashboard.dataUsageExplanation).toBeDefined();
        expect(dashboard.dataUsageExplanation.purpose).toBeDefined();
        expect(dashboard.dataUsageExplanation.dataTypes).toBeDefined();

        // Test privacy control functionality
        const privacyUpdateResponse = await framework['client'].put('/dashboard/privacy-controls', {
          analyticsLevel: 'minimal',
          shareAggregatedData: false
        }, {
          headers: { Authorization: `Bearer ${studentUser.authToken}` }
        });

        expect(privacyUpdateResponse.status).toBe(200);

        // Verify updated dashboard reflects privacy changes
        const updatedDashboardResponse = await framework['client'].get('/dashboard/learning-analytics', {
          headers: { Authorization: `Bearer ${studentUser.authToken}` }
        });

        expect(updatedDashboardResponse.status).toBe(200);
        expect(updatedDashboardResponse.data.privacyControls.analyticsLevel).toBe('minimal');

      } catch (error) {
        fail(`Learning dashboard privacy test failed: ${error.message}`);
      }
    }, 20000);
  });

  describe('Privacy in Educational Assessment', () => {
    test('should conduct privacy-preserving automated assessment', async () => {
      try {
        // Submit work for automated assessment
        const assessmentResponse = await framework['client'].post('/assessment/automated', {
          content: 'This essay discusses the impact of technology on education and society.',
          assessmentType: 'writing_quality',
          privacyMode: 'assessment_only'
        }, {
          headers: { Authorization: `Bearer ${studentUser.authToken}` }
        });

        expect(assessmentResponse.status).toBe(200);
        
        const assessment = assessmentResponse.data;
        
        // Should provide assessment results
        expect(assessment.scores).toBeDefined();
        expect(assessment.feedback).toBeDefined();
        
        // Should indicate privacy protection
        expect(assessment.privacyProtected).toBe(true);
        expect(assessment.contentStored).toBe(false);
        
        // Should not retain content beyond assessment
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const contentCheckResponse = await framework['client'].get(`/assessment/content/${assessment.assessmentId}`, {
          headers: { Authorization: `Bearer ${studentUser.authToken}` }
        });

        expect(contentCheckResponse.status).toBe(404); // Content should be deleted

      } catch (error) {
        fail(`Automated assessment privacy test failed: ${error.message}`);
      }
    }, 15000);

    test('should enable educator assessment review with appropriate privacy protection', async () => {
      try {
        // Student submits assessment
        const submissionResponse = await framework['client'].post('/assessment/submission', {
          assignmentId: 'test-assessment-privacy',
          content: 'My response to the assessment question with personal examples.',
          allowEducatorReview: true
        }, {
          headers: { Authorization: `Bearer ${studentUser.authToken}` }
        });

        expect(submissionResponse.status).toBe(201);

        // Educator reviews submission
        const reviewResponse = await framework['client'].get(`/assessment/educator-review/${submissionResponse.data.submissionId}`, {
          headers: { Authorization: `Bearer ${educatorUser.authToken}` }
        });

        expect(reviewResponse.status).toBe(200);
        
        const review = reviewResponse.data;
        
        // Should show academic content for assessment
        expect(review.content).toBeDefined();
        expect(review.studentWork).toBeDefined();
        
        // Should mask or limit personal information
        expect(review.personalInformationMasked).toBe(true);
        
        // Should log educator access
        expect(review.accessLogged).toBe(true);
        expect(review.accessJustification).toBe('educational_assessment');

      } catch (error) {
        fail(`Educator assessment review privacy test failed: ${error.message}`);
      }
    }, 15000);
  });
});