import express, { Response } from 'express';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { checkPrivacyConsent, requireAnalyticsConsent, applyMinorProtections } from '../middleware/privacyConsent';
import { ResilientWritingAnalysisMCPClient } from '../services/mcp/ResilientWritingAnalysisMCPClient';

/**
 * Resilient Analytics Routes with Circuit Breaker and Fallback
 * Provides high-availability writing analysis with graceful degradation
 */

const router = express.Router();

// Apply privacy middleware to all analytics routes
router.use(checkPrivacyConsent);
router.use(applyMinorProtections);

/**
 * Enhanced error handler for analytics routes
 */
function handleAnalyticsError(error: any, res: Response, operation: string): void {
  console.error(`Analytics error in ${operation}:`, error);
  
  res.status(500).json({
    message: `Failed to ${operation}`,
    error: process.env.NODE_ENV === 'development' ? error.message : 'Analysis service temporarily unavailable',
    fallbackAvailable: true,
    recommendations: [
      'Try again in a few moments',
      'Basic analysis may be available in limited mode',
      'Contact support if issue persists',
    ],
    timestamp: new Date().toISOString(),
  });
}

/**
 * @route GET /api/analytics/writing-progress/:studentId/:assignmentId
 * @desc Get comprehensive writing progress metrics with resilient MCP
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
      const mcpClient = req.mcpClient as ResilientWritingAnalysisMCPClient;
      
      // Check permissions
      if (userRole === 'student' && studentId !== userId) {
        res.status(403).json({ message: 'Access denied: Can only view your own progress' });
        return;
      }
      
      if (!mcpClient) {
        res.status(503).json({ 
          message: 'Writing analysis service unavailable',
          fallbackMode: true,
        });
        return;
      }

      // Use resilient MCP client with automatic fallback
      const progressData = await mcpClient.trackWritingProgress({
        userId: studentId,
        assignmentId,
        sessionData: {
          // This would typically come from writing session data
          requestTimestamp: new Date(),
        },
        privacyContext,
      });
      
      // Check if we're in fallback mode and inform user
      const fallbackMode = progressData.fallbackMode || false;
      
      res.json({
        message: 'Writing progress metrics retrieved successfully',
        data: {
          ...progressData,
          privacyMetadata: {
            consentLevel: privacyContext.hasConsent,
            dataProtection: 'Content analyzed with privacy safeguards',
            auditTrail: 'Access logged for compliance',
            fallbackMode,
          },
        },
        fallbackMode,
        privacyCompliant: true,
        timestamp: new Date().toISOString(),
      });
      
    } catch (error: any) {
      handleAnalyticsError(error, res, 'retrieve writing progress metrics');
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
      const { reflection } = req.query;
      const userId = req.userId!;
      const userRole = req.userRole!;
      const privacyContext = req.privacyContext!;
      const mcpClient = req.mcpClient as ResilientWritingAnalysisMCPClient;

      // Check permissions
      if (userRole === 'student' && studentId !== userId) {
        res.status(403).json({ message: 'Access denied: Can only view your own reflection quality' });
        return;
      }

      if (!reflection) {
        res.status(400).json({ message: 'Reflection content is required for quality analysis' });
        return;
      }

      if (!mcpClient) {
        res.status(503).json({ 
          message: 'Reflection analysis service unavailable',
          fallbackMode: true,
        });
        return;
      }

      // Use resilient MCP client
      const qualityAnalysis = await mcpClient.evaluateReflectionQuality({
        reflection: reflection as string,
        userId: studentId,
        role: privacyContext.role,
        purpose: 'reflection quality assessment and learning support',
        consent: privacyContext.hasConsent.analytics,
      });

      const fallbackMode = qualityAnalysis.fallbackMode || false;

      res.json({
        message: 'Reflection quality analysis completed successfully',
        data: {
          currentAccessLevel: qualityAnalysis.progressiveAccess?.currentLevel || 'unknown',
          qualityScore: qualityAnalysis.quality?.overall || 0,
          nextLevelRequirements: qualityAnalysis.progressiveAccess?.nextLevelRequirements || [],
          strengths: qualityAnalysis.quality?.strengths || [],
          improvements: qualityAnalysis.quality?.improvements || [],
          fallbackMode,
          privacyProtected: true,
        },
        fallbackMode,
        privacyCompliant: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      handleAnalyticsError(error, res, 'analyze reflection quality');
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
      const mcpClient = req.mcpClient as ResilientWritingAnalysisMCPClient;

      if (!content) {
        res.status(400).json({ message: 'Content is required for analysis' });
        return;
      }

      if (!mcpClient) {
        res.status(503).json({ 
          message: 'Content analysis service unavailable',
          fallbackMode: true,
        });
        return;
      }

      // First classify content sensitivity
      const classification = await mcpClient.classifyContentSensitivity({
        content,
        context: {
          contentType: contentType as 'essay' | 'reflection' | 'notes' | 'feedback',
          academicLevel: 'undergraduate', // Could be fetched from user profile
        },
      });

      let patterns = null;
      const classificationFallback = classification.fallbackMode || false;

      // Then analyze writing patterns if consent allows and content not too sensitive
      if (classification.sensitivityLevel !== 'high' || privacyContext.hasConsent.research) {
        try {
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
        } catch (patternError) {
          console.warn('Pattern analysis failed, continuing with classification only:', patternError);
          patterns = null;
        }
      }

      const fallbackMode = classificationFallback || (patterns && patterns.fallbackMode);

      res.json({
        message: 'Content analysis completed successfully',
        data: {
          classification: {
            sensitivityLevel: classification.sensitivityLevel,
            sensitivityScore: classification.sensitivityScore,
            recommendations: classification.recommendations,
            fallbackMode: classificationFallback,
          },
          patterns,
          privacyMetadata: {
            contentRedacted: classification.sensitivityLevel === 'high',
            consentRespected: true,
            auditLogged: true,
            fallbackMode,
          },
        },
        fallbackMode,
        privacyCompliant: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      handleAnalyticsError(error, res, 'analyze content');
    }
  }
);

/**
 * @route GET /api/analytics/class-insights/:courseId
 * @desc Get privacy-aware class-level insights with resilient analysis
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
      const mcpClient = req.mcpClient as ResilientWritingAnalysisMCPClient;

      if (!mcpClient) {
        res.status(503).json({ 
          message: 'Class insights service unavailable',
          fallbackMode: true,
        });
        return;
      }

      // Generate class-level insights with privacy protection
      const insights = await mcpClient.generateWritingInsights({
        scope: 'class',
        targetId: courseId,
        timeframe: timeframe as 'day' | 'week' | 'month' | 'semester',
        role: 'educator',
        purpose: 'class performance analysis and teaching improvement',
        includeRecommendations: true,
      });

      const fallbackMode = insights.privacyMetadata?.fallbackMode || false;

      res.json({
        message: 'Class insights retrieved successfully',
        data: insights.insights,
        privacyMetadata: {
          ...insights.privacyMetadata,
          fallbackMode,
        },
        fallbackMode,
        privacyCompliant: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      handleAnalyticsError(error, res, 'retrieve class insights');
    }
  }
);

/**
 * @route GET /api/analytics/ai-boundaries/:studentId/:assignmentId
 * @desc Check AI assistance boundaries for student
 * @access Private (Students for own data, Instructors for their students)
 */
router.get('/ai-boundaries/:studentId/:assignmentId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { studentId, assignmentId } = req.params;
      const { aiRequest } = req.query;
      const userId = req.userId!;
      const userRole = req.userRole!;
      const mcpClient = req.mcpClient as ResilientWritingAnalysisMCPClient;

      // Check permissions
      if (userRole === 'student' && studentId !== userId) {
        res.status(403).json({ message: 'Access denied: Can only check your own AI boundaries' });
        return;
      }

      if (!mcpClient) {
        // Fallback: Restrictive AI boundaries when service unavailable
        res.json({
          message: 'AI boundaries checked (fallback mode)',
          data: {
            allowed: false,
            boundariesApplied: ['service_unavailable', 'fallback_mode'],
            suggestions: [
              'AI assistance temporarily unavailable',
              'Focus on independent work',
              'Try again later when service is restored',
            ],
            reasoning: 'AI boundaries service unavailable - defaulting to restricted access',
            fallbackMode: true,
          },
          fallbackMode: true,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Mock student context - in real implementation, fetch from database
      const studentContext = {
        assignmentType: 'essay',
        reflectionCompleted: true, // Would be checked from database
        progressLevel: 0.7, // Would be calculated from actual progress
      };

      const boundaryCheck = await mcpClient.applyAIBoundaries({
        request: {
          prompt: aiRequest as string || 'General AI assistance request',
          context: `Assignment: ${assignmentId}`,
          requestType: 'assistance',
        },
        studentContext,
      });

      const fallbackMode = boundaryCheck.fallbackMode || false;

      res.json({
        message: 'AI boundaries checked successfully',
        data: {
          ...boundaryCheck,
          fallbackMode,
        },
        fallbackMode,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      handleAnalyticsError(error, res, 'check AI boundaries');
    }
  }
);

/**
 * @route GET /api/analytics/health
 * @desc Health check for resilient analytics system
 * @access Private (Admins only)
 */
router.get('/health',
  authenticate,
  requireRole(['admin']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const mcpClient = req.mcpClient as ResilientWritingAnalysisMCPClient;
      
      if (!mcpClient) {
        res.json({
          message: 'Analytics health check completed',
          data: {
            mcpClient: { healthy: false, error: 'Client not initialized' },
            fallbackServices: { available: true },
            overall: false,
          },
          fallbackMode: true,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const health = await mcpClient.healthCheck();
      const metrics = mcpClient.getMetrics();

      res.json({
        message: 'Analytics health check completed',
        data: {
          ...health,
          metrics,
          overall: health.healthy || health.fallbackAvailable,
        },
        fallbackMode: !health.mcpStatus?.healthy,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error in analytics health check:', error);
      res.status(500).json({
        message: 'Health check failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Health check failed',
        healthy: false,
        fallbackMode: true,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @route POST /api/analytics/circuit-breaker/reset
 * @desc Reset circuit breaker for MCP service
 * @access Private (Admins only)
 */
router.post('/circuit-breaker/reset',
  authenticate,
  requireRole(['admin']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const mcpClient = req.mcpClient as ResilientWritingAnalysisMCPClient;
      
      if (!mcpClient) {
        res.status(503).json({
          message: 'MCP client not available for circuit breaker reset',
          success: false,
        });
        return;
      }

      const reset = mcpClient.resetCircuitBreaker();
      
      res.json({
        message: reset ? 'Circuit breaker reset successfully' : 'Failed to reset circuit breaker',
        success: reset,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      handleAnalyticsError(error, res, 'reset circuit breaker');
    }
  }
);

/**
 * @route POST /api/analytics/fallback-mode
 * @desc Force fallback mode for testing/maintenance
 * @access Private (Admins only)
 */
router.post('/fallback-mode',
  authenticate,
  requireRole(['admin']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const mcpClient = req.mcpClient as ResilientWritingAnalysisMCPClient;
      
      if (!mcpClient) {
        res.status(503).json({
          message: 'MCP client not available',
          success: false,
        });
        return;
      }

      mcpClient.forceFallbackMode();
      
      res.json({
        message: 'Fallback mode activated successfully',
        success: true,
        note: 'All analytics requests will use fallback services until circuit breaker is reset',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      handleAnalyticsError(error, res, 'activate fallback mode');
    }
  }
);

export default router;