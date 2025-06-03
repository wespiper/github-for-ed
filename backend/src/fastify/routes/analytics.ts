import { FastifyInstance } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import { AdaptiveWritingAnalysisManager } from '../../services/adaptive/AdaptiveWritingAnalysisManager';
import { ServiceFactory } from '../../container/ServiceFactory';

// Schema Definitions
const WritingProgressParamsSchema = Type.Object({
  studentId: Type.String(),
  assignmentId: Type.String()
});

const AnalyzeWritingPatternsSchema = Type.Object({
  content: Type.String({ minLength: 1 }),
  sessionId: Type.String(),
  metadata: Type.Optional(Type.Object({
    assignmentId: Type.Optional(Type.String()),
    studentId: Type.Optional(Type.String()),
    timestamp: Type.Optional(Type.String())
  }))
});

const EvaluateReflectionQualitySchema = Type.Object({
  reflectionText: Type.String({ minLength: 1 }),
  criteria: Type.Optional(Type.Object({
    depth: Type.Boolean(),
    selfAwareness: Type.Boolean(),
    criticalThinking: Type.Boolean(),
    learningEvidence: Type.Boolean()
  }))
});

const TrackWritingProgressSchema = Type.Object({
  sessionId: Type.String(),
  progress: Type.Object({
    wordsWritten: Type.Number(),
    timeSpent: Type.Number(),
    revisions: Type.Number(),
    completionPercentage: Type.Number()
  })
});

const GenerateWritingInsightsSchema = Type.Object({
  studentId: Type.String(),
  timeRange: Type.Optional(Type.Union([
    Type.Literal('week'),
    Type.Literal('month'),
    Type.Literal('semester')
  ]))
});

const StandardResponseSchema = Type.Object({
  success: Type.Boolean(),
  data: Type.Any(),
  message: Type.Optional(Type.String()),
  serviceUsed: Type.Optional(Type.String())
});

const ErrorResponseSchema = Type.Object({
  success: Type.Literal(false),
  error: Type.String(),
  message: Type.String(),
  fallbackAvailable: Type.Optional(Type.Boolean()),
  recommendations: Type.Optional(Type.Array(Type.String()))
});

// Type definitions
type WritingProgressParams = Static<typeof WritingProgressParamsSchema>;
type AnalyzeWritingPatternsRequest = Static<typeof AnalyzeWritingPatternsSchema>;
type EvaluateReflectionQualityRequest = Static<typeof EvaluateReflectionQualitySchema>;
type TrackWritingProgressRequest = Static<typeof TrackWritingProgressSchema>;
type GenerateWritingInsightsRequest = Static<typeof GenerateWritingInsightsSchema>;

export async function analyticsRoutes(fastify: FastifyInstance) {
  const adaptiveManager = new AdaptiveWritingAnalysisManager();
  await adaptiveManager.onModuleInit();

  // Add authentication hook for all routes
  fastify.addHook('preHandler', async (request, reply) => {
    // Check for authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.code(401).send({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // TODO: Verify JWT token and set user context
    // For now, we'll add a placeholder
    (request as any).userId = 'authenticated-user';
    (request as any).userRole = 'educator';
  });

  /**
   * Get writing progress analytics
   */
  fastify.get<{
    Params: WritingProgressParams
  }>('/writing-progress/:studentId/:assignmentId', {
    schema: {
      params: WritingProgressParamsSchema,
      response: {
        200: StandardResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    }
  }, async (request, reply) => {
    try {
      const { studentId, assignmentId } = request.params;
      const userId = (request as any).userId;
      const userRole = (request as any).userRole;

      // Check permissions
      if (userRole !== 'educator' && userId !== studentId) {
        return reply.code(403).send({
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to view this data'
        });
      }

      // Get writing progress using adaptive manager
      const result = await adaptiveManager.trackWritingProgress({
        sessionId: `${studentId}-${assignmentId}`,
        progress: {
          wordsWritten: 0,
          timeSpent: 0,
          revisions: 0,
          completionPercentage: 0
        }
      });

      return {
        success: true,
        data: result.data,
        message: 'Writing progress retrieved successfully',
        serviceUsed: result.serviceUsed
      };
    } catch (error) {
      fastify.log.error(error as Error);
      reply.code(500).send({
        success: false,
        error: (error as Error).message,
        message: 'Failed to retrieve writing progress',
        fallbackAvailable: true,
        recommendations: [
          'Try again in a few moments',
          'Basic analysis may be available in limited mode',
          'Contact support if issue persists'
        ]
      });
    }
  });

  /**
   * Analyze writing patterns
   */
  fastify.post<{
    Body: AnalyzeWritingPatternsRequest
  }>('/analyze-patterns', {
    schema: {
      body: AnalyzeWritingPatternsSchema,
      response: {
        200: StandardResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    }
  }, async (request, reply) => {
    try {
      const { content, sessionId, metadata } = request.body;

      const result = await adaptiveManager.analyzeWritingPatterns({
        content,
        sessionId,
        metadata
      });

      return {
        success: true,
        data: result.data,
        message: 'Writing patterns analyzed successfully',
        serviceUsed: result.serviceUsed
      };
    } catch (error) {
      fastify.log.error(error as Error);
      reply.code(500).send({
        success: false,
        error: (error as Error).message,
        message: 'Failed to analyze writing patterns',
        fallbackAvailable: true
      });
    }
  });

  /**
   * Evaluate reflection quality
   */
  fastify.post<{
    Body: EvaluateReflectionQualityRequest
  }>('/evaluate-reflection', {
    schema: {
      body: EvaluateReflectionQualitySchema,
      response: {
        200: StandardResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    }
  }, async (request, reply) => {
    try {
      const { reflectionText, criteria } = request.body;

      const result = await adaptiveManager.evaluateReflectionQuality({
        reflectionText,
        criteria
      });

      return {
        success: true,
        data: result.data,
        message: 'Reflection quality evaluated successfully',
        serviceUsed: result.serviceUsed
      };
    } catch (error) {
      fastify.log.error(error as Error);
      reply.code(500).send({
        success: false,
        error: (error as Error).message,
        message: 'Failed to evaluate reflection quality',
        fallbackAvailable: true
      });
    }
  });

  /**
   * Track writing progress
   */
  fastify.post<{
    Body: TrackWritingProgressRequest
  }>('/track-progress', {
    schema: {
      body: TrackWritingProgressSchema,
      response: {
        200: StandardResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    }
  }, async (request, reply) => {
    try {
      const { sessionId, progress } = request.body;

      const result = await adaptiveManager.trackWritingProgress({
        sessionId,
        progress
      });

      return {
        success: true,
        data: result.data,
        message: 'Writing progress tracked successfully',
        serviceUsed: result.serviceUsed
      };
    } catch (error) {
      fastify.log.error(error as Error);
      reply.code(500).send({
        success: false,
        error: (error as Error).message,
        message: 'Failed to track writing progress',
        fallbackAvailable: true
      });
    }
  });

  /**
   * Generate writing insights
   */
  fastify.post<{
    Body: GenerateWritingInsightsRequest
  }>('/generate-insights', {
    schema: {
      body: GenerateWritingInsightsSchema,
      response: {
        200: StandardResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    }
  }, async (request, reply) => {
    try {
      const { studentId, timeRange } = request.body;

      const result = await adaptiveManager.generateWritingInsights({
        studentId,
        timeRange
      });

      return {
        success: true,
        data: result.data,
        message: 'Writing insights generated successfully',
        serviceUsed: result.serviceUsed
      };
    } catch (error) {
      fastify.log.error(error as Error);
      reply.code(500).send({
        success: false,
        error: (error as Error).message,
        message: 'Failed to generate writing insights',
        fallbackAvailable: true
      });
    }
  });

  /**
   * Privacy-enhanced endpoints
   */
  
  /**
   * Classify content sensitivity
   */
  fastify.post('/classify-sensitivity', {
    schema: {
      body: Type.Object({
        content: Type.String({ minLength: 1 }),
        context: Type.Optional(Type.Object({
          studentId: Type.String(),
          assignmentId: Type.String()
        }))
      }),
      response: {
        200: StandardResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    }
  }, async (request, reply) => {
    try {
      const { content, context } = request.body;

      const result = await adaptiveManager.classifyContentSensitivity({
        content,
        context
      });

      return {
        success: true,
        data: result.data,
        message: 'Content sensitivity classified successfully',
        serviceUsed: result.serviceUsed
      };
    } catch (error) {
      fastify.log.error(error as Error);
      reply.code(500).send({
        success: false,
        error: (error as Error).message,
        message: 'Failed to classify content sensitivity'
      });
    }
  });

  /**
   * Validate educational purpose
   */
  fastify.post('/validate-educational-purpose', {
    schema: {
      body: Type.Object({
        purpose: Type.String(),
        requestContext: Type.Object({
          userId: Type.String(),
          role: Type.String(),
          dataRequested: Type.Array(Type.String())
        })
      }),
      response: {
        200: StandardResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    }
  }, async (request, reply) => {
    try {
      const { purpose, requestContext } = request.body;

      const result = await adaptiveManager.validateEducationalPurpose({
        purpose,
        requestContext
      });

      return {
        success: true,
        data: result.data,
        message: 'Educational purpose validated successfully',
        serviceUsed: result.serviceUsed
      };
    } catch (error) {
      fastify.log.error(error as Error);
      reply.code(500).send({
        success: false,
        error: (error as Error).message,
        message: 'Failed to validate educational purpose'
      });
    }
  });

  /**
   * Apply AI boundaries
   */
  fastify.post('/apply-ai-boundaries', {
    schema: {
      body: Type.Object({
        content: Type.String(),
        aiRequest: Type.String(),
        assignmentContext: Type.Object({
          type: Type.String(),
          restrictions: Type.Array(Type.String())
        })
      }),
      response: {
        200: StandardResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    }
  }, async (request, reply) => {
    try {
      const { content, aiRequest, assignmentContext } = request.body;

      const result = await adaptiveManager.applyAIBoundaries({
        content,
        aiRequest,
        assignmentContext
      });

      return {
        success: true,
        data: result.data,
        message: 'AI boundaries applied successfully',
        serviceUsed: result.serviceUsed
      };
    } catch (error) {
      fastify.log.error(error as Error);
      reply.code(500).send({
        success: false,
        error: (error as Error).message,
        message: 'Failed to apply AI boundaries'
      });
    }
  });

  /**
   * Audit writing data access
   */
  fastify.post('/audit-data-access', {
    schema: {
      body: Type.Object({
        accessLog: Type.Object({
          userId: Type.String(),
          dataType: Type.String(),
          purpose: Type.String(),
          timestamp: Type.String()
        })
      }),
      response: {
        200: StandardResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    }
  }, async (request, reply) => {
    try {
      const { accessLog } = request.body;

      const result = await adaptiveManager.auditWritingDataAccess({
        accessLog
      });

      return {
        success: true,
        data: result.data,
        message: 'Data access audited successfully',
        serviceUsed: result.serviceUsed
      };
    } catch (error) {
      fastify.log.error(error as Error);
      reply.code(500).send({
        success: false,
        error: (error as Error).message,
        message: 'Failed to audit data access'
      });
    }
  });

  /**
   * Service health check
   */
  fastify.get('/health', {
    schema: {
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            status: Type.String(),
            services: Type.Object({
              mcp: Type.Boolean(),
              direct: Type.Boolean(),
              fallback: Type.Boolean()
            }),
            metrics: Type.Any()
          }),
          message: Type.String()
        })
      }
    }
  }, async (request, reply) => {
    try {
      const healthStatus = await adaptiveManager.getHealthStatus();
      const serviceMetrics = adaptiveManager.getPerformanceMetrics();

      return {
        success: true,
        data: {
          status: 'healthy',
          services: healthStatus,
          metrics: Object.fromEntries(serviceMetrics)
        },
        message: 'Analytics service is healthy'
      };
    } catch (error) {
      fastify.log.error(error as Error);
      reply.code(500).send({
        success: false,
        error: (error as Error).message,
        message: 'Failed to retrieve health status'
      });
    }
  });
}