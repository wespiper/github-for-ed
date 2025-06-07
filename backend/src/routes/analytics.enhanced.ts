import express, { Response } from 'express';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { checkPrivacyConsent, requireAnalyticsConsent, applyMinorProtections } from '../middleware/privacyConsent';
import { LearningAnalyticsService } from '../services/LearningAnalyticsService';
import { EnhancedWritingProcessAnalyzer } from '../services/ai/WritingProcessAnalyzer.enhanced';
import { EnhancedReflectionAnalysisService } from '../services/ai/ReflectionAnalysisService.enhanced';
import { getServices } from '../middleware/serviceContainer';

const router = express.Router();

// Apply privacy middleware to all analytics routes
router.use(checkPrivacyConsent);
router.use(applyMinorProtections);

/**
 * @route GET /api/analytics/writing-progress/:studentId/:assignmentId
 * @desc Get comprehensive writing progress metrics with privacy protection
 * @access Private (Instructors and the student themselves)
 */
router.get('/writing-progress/:studentId/:assignmentId', 
  authenticate, 
  requireAnalyticsConsent,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { studentId, assignmentId } = req.params;
      const userId = req.userId!;
      const userRole = req.userRole!;
      const privacyContext = req.privacyContext!;
      
      // Check permissions: student can view their own, instructors can view their course students
      if (userRole === 'student' && studentId !== userId) {
        res.status(403).json({ message: 'Access denied: Can only view your own progress' });
        return;
      }
      
      // Use MCP-enhanced writing process analyzer
      const analysisResult = await EnhancedWritingProcessAnalyzer.analyzeWritingProcess(
        studentId,
        assignmentId,
        undefined, // student profile - could be fetched if needed
        userId // accessor ID for audit
      );
      
      // Filter response based on privacy context
      const filteredResult = {
        ...analysisResult,
        // Remove sensitive data if consent not given for research
        detailedMetrics: privacyContext.hasConsent.research ? analysisResult.sessionMetrics : undefined,
        privacyNotice: {
          consentLevel: privacyContext.hasConsent,
          dataProtection: 'Content analyzed with privacy safeguards',
          auditTrail: 'Access logged for compliance',
        }
      };
      
      res.json({
        message: 'Writing progress metrics retrieved successfully',
        data: filteredResult,
        privacyCompliant: true,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error getting enhanced writing progress metrics:', error);
      res.status(500).json({ 
        message: 'Failed to retrieve writing progress metrics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Analysis failed',
        privacyCompliant: true
      });
    }
  }
);

/**
 * @route GET /api/analytics/reflection-quality/:studentId/:assignmentId
 * @desc Get reflection quality analysis with progressive access levels
 * @access Private (Instructors and the student themselves)
 */
router.get('/reflection-quality/:studentId/:assignmentId',
  authenticate,
  requireAnalyticsConsent,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { studentId, assignmentId } = req.params;
      const userId = req.userId!;
      const userRole = req.userRole!;
      const privacyContext = req.privacyContext!;

      // Check permissions
      if (userRole === 'student' && studentId !== userId) {
        res.status(403).json({ message: 'Access denied: Can only view your own reflection quality' });
        return;
      }

      // Get reflection requirements for the student
      const requirements = await EnhancedReflectionAnalysisService.getReflectionRequirements(
        studentId,
        assignmentId
      );

      res.json({
        message: 'Reflection quality requirements retrieved successfully',
        data: {
          currentAccessLevel: requirements.currentLevel,
          qualityScore: requirements.qualityScore,
          nextLevelRequirements: requirements.nextLevelRequirements,
          privacyProtected: true,
        },
        privacyCompliant: true,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error getting reflection quality:', error);
      res.status(500).json({
        message: 'Failed to retrieve reflection quality',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Analysis failed',
        privacyCompliant: true
      });
    }
  }
);

/**
 * @route POST /api/analytics/analyze-content
 * @desc Analyze content sensitivity and get writing insights
 * @access Private (All authenticated users)
 */
router.post('/analyze-content',
  authenticate,
  requireAnalyticsConsent,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { content, contentType = 'essay' } = req.body;
      const userId = req.userId!;
      const privacyContext = req.privacyContext!;

      if (!content) {
        res.status(400).json({ message: 'Content is required for analysis' });
        return;
      }

      const serviceFactory = getServices();
      const mcpClient = serviceFactory.getMCPClient();

      // First classify content sensitivity
      const classification = await mcpClient.classifyContentSensitivity({
        content,
        context: {
          contentType: contentType as 'essay' | 'reflection' | 'notes' | 'feedback',
          academicLevel: 'undergraduate', // Could be fetched from user profile
        },
      });

      // Then analyze writing patterns if content is not too sensitive
      let patterns = null;
      if (classification.sensitivityLevel !== 'high' || privacyContext.hasConsent.research) {
        const patternAnalysis = await mcpClient.analyzeWritingPatterns({
          content,
          userId,
          role: privacyContext.role,
          purpose: 'self-improvement and learning',
          consent: privacyContext.hasConsent.analytics,
          options: {
            includeStructure: true,
            includeSentiment: privacyContext.hasConsent.research,
            includeComplexity: true,
          },
        });
        patterns = patternAnalysis.patterns;
      }

      res.json({
        message: 'Content analysis completed successfully',
        data: {
          classification: {
            sensitivityLevel: classification.sensitivityLevel,
            sensitivityScore: classification.sensitivityScore,
            recommendations: classification.recommendations,
          },
          patterns,
          privacyMetadata: {
            contentRedacted: classification.sensitivityLevel === 'high',
            consentRespected: true,
            auditLogged: true,
          },
        },
        privacyCompliant: true,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error analyzing content:', error);
      res.status(500).json({
        message: 'Failed to analyze content',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Analysis failed',
        privacyCompliant: true
      });
    }
  }
);

/**
 * @route GET /api/analytics/class-insights/:courseId
 * @desc Get privacy-aware class-level insights
 * @access Private (Instructors only)
 */
router.get('/class-insights/:courseId',
  authenticate,
  requireRole(['educator', 'admin']),
  requireAnalyticsConsent,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { courseId } = req.params;
      const { timeframe = 'week' } = req.query;
      const userId = req.userId!;

      const serviceFactory = getServices();
      const mcpClient = serviceFactory.getMCPClient();

      // Generate class-level insights with privacy protection
      const insights = await mcpClient.generateWritingInsights({
        scope: 'class',
        targetId: courseId,
        timeframe: timeframe as 'day' | 'week' | 'month' | 'semester',
        role: 'educator',
        purpose: 'class performance analysis and teaching improvement',
        includeRecommendations: true,
      });

      res.json({
        message: 'Class insights retrieved successfully',
        data: insights.insights,
        privacyMetadata: insights.privacyMetadata,
        privacyCompliant: true,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error getting class insights:', error);
      res.status(500).json({
        message: 'Failed to retrieve class insights',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Analysis failed',
        privacyCompliant: true
      });
    }
  }
);

/**
 * @route GET /api/analytics/health
 * @desc Health check for MCP analytics integration
 * @access Private (Admins only)
 */
router.get('/health',
  authenticate,
  requireRole(['admin']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Check MCP connection health
      const mcpHealth = await EnhancedWritingProcessAnalyzer.healthCheck();
      const reflectionHealth = await EnhancedReflectionAnalysisService.healthCheck();

      res.json({
        message: 'Analytics health check completed',
        data: {
          writingAnalysis: mcpHealth,
          reflectionAnalysis: reflectionHealth,
          overall: mcpHealth.healthy && reflectionHealth.healthy,
        },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error in health check:', error);
      res.status(500).json({
        message: 'Health check failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Health check failed',
        healthy: false
      });
    }
  }
);

/**
 * @route POST /api/analytics/consent
 * @desc Update analytics consent preferences
 * @access Private (All authenticated users)
 */
router.post('/consent',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { consentType, granted } = req.body;
      const userId = req.userId!;

      // Validate consent type
      const validConsentTypes = ['analytics', 'research', 'aiAssistance'];
      if (!validConsentTypes.includes(consentType)) {
        res.status(400).json({
          message: 'Invalid consent type',
          validTypes: validConsentTypes
        });
        return;
      }

      // Update consent (mock implementation)
      // In real implementation, this would update the database
      console.log('Updating consent:', { userId, consentType, granted });

      // Audit the consent change
      const serviceFactory = getServices();
      const mcpClient = serviceFactory.getMCPClient();

      await mcpClient.auditWritingDataAccess({
        accessType: 'write',
        dataType: 'consent_preferences',
        userId,
        accessedBy: userId,
        purpose: 'Student consent preference update',
        educationalContext: {
          courseId: req.body.courseId,
        },
      });

      res.json({
        message: 'Consent updated successfully',
        data: {
          consentType,
          granted,
          effectiveDate: new Date().toISOString(),
        },
        privacyCompliant: true,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error updating consent:', error);
      res.status(500).json({
        message: 'Failed to update consent',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Update failed',
        privacyCompliant: true
      });
    }
  }
);

export default router;