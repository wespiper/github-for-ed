import { FastifyInstance } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import { StudentProfilingService } from '../../services/StudentProfilingService';

// Schema Definitions
const BuildProfileRequestSchema = Type.Object({
  studentId: Type.String(),
  requesterContext: Type.Object({
    userId: Type.String(),
    role: Type.Union([
      Type.Literal('student'),
      Type.Literal('teacher'),
      Type.Literal('parent'),
      Type.Literal('admin')
    ]),
    purpose: Type.String()
  }),
  includePrivateData: Type.Optional(Type.Boolean())
});

const PrivacyChoicesSchema = Type.Object({
  educationalSharing: Type.Optional(Type.Object({
    teacher: Type.Boolean(),
    peer: Type.Boolean(),
    parent: Type.Boolean()
  })),
  platformImprovement: Type.Optional(Type.Object({
    anonymousPatterns: Type.Boolean(),
    featureAnalytics: Type.Boolean(),
    research: Type.Boolean()
  })),
  personalBenefits: Type.Optional(Type.Object({
    enhancedAnalytics: Type.Boolean(),
    portfolio: Type.Boolean(),
    careerGuidance: Type.Boolean()
  })),
  privacyControls: Type.Optional(Type.Object({
    retentionPeriod: Type.String(),
    sensitiveContent: Type.String(),
    thirdParty: Type.String()
  }))
});

const PrivacyAnalyticsRequestSchema = Type.Object({
  cohortIds: Type.Array(Type.String()),
  metrics: Type.Array(Type.String()),
  epsilon: Type.Optional(Type.Number({ minimum: 0.1, maximum: 10 })),
  delta: Type.Optional(Type.Number({ minimum: 0.00001, maximum: 0.1 }))
});

const AccessValidationRequestSchema = Type.Object({
  requesterId: Type.String(),
  requesterType: Type.Union([
    Type.Literal('teacher'),
    Type.Literal('peer'),
    Type.Literal('platform'),
    Type.Literal('researcher')
  ]),
  studentId: Type.String(),
  purpose: Type.String(),
  dataTypes: Type.Array(Type.String()),
  studentBenefit: Type.Optional(Type.String())
});

const LearningTrajectoryRequestSchema = Type.Object({
  milestone: Type.Object({
    skill: Type.String(),
    level: Type.Integer({ minimum: 1, maximum: 10 }),
    evidence: Type.Optional(Type.Array(Type.String()))
  }),
  privacyLevel: Type.Optional(Type.Union([
    Type.Literal('full'),
    Type.Literal('anonymized'),
    Type.Literal('aggregate')
  ]))
});

const SkillAssessmentRequestSchema = Type.Object({
  skills: Type.Array(Type.Object({
    skillName: Type.String(),
    currentLevel: Type.Integer({ minimum: 0, maximum: 10 }),
    targetLevel: Type.Integer({ minimum: 0, maximum: 10 }),
    progress: Type.Number({ minimum: 0, maximum: 1 })
  })),
  sharedWith: Type.Optional(Type.Array(Type.String()))
});

const RecommendationsRequestSchema = Type.Object({
  useEnhancedData: Type.Optional(Type.Boolean()),
  recommendationTypes: Type.Optional(Type.Array(Type.String()))
});

const StandardResponseSchema = Type.Object({
  success: Type.Boolean(),
  data: Type.Any(),
  message: Type.String()
});

const ErrorResponseSchema = Type.Object({
  success: Type.Literal(false),
  error: Type.String(),
  message: Type.String()
});

// Type definitions
type BuildProfileRequest = Static<typeof BuildProfileRequestSchema>;
type PrivacyChoices = Static<typeof PrivacyChoicesSchema>;
type PrivacyAnalyticsRequest = Static<typeof PrivacyAnalyticsRequestSchema>;
type AccessValidationRequest = Static<typeof AccessValidationRequestSchema>;
type LearningTrajectoryRequest = Static<typeof LearningTrajectoryRequestSchema>;
type SkillAssessmentRequest = Static<typeof SkillAssessmentRequestSchema>;
type RecommendationsRequest = Static<typeof RecommendationsRequestSchema>;

export async function studentProfilingRoutes(fastify: FastifyInstance) {
  const studentProfilingService = new StudentProfilingService();
  
  // Initialize the service
  await studentProfilingService.initialize();

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
   * Build student profile
   */
  fastify.post<{
    Body: BuildProfileRequest
  }>('/profiles/build', {
    schema: {
      body: BuildProfileRequestSchema,
      response: {
        200: StandardResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    }
  }, async (request, reply) => {
    try {
      const { studentId, requesterContext, includePrivateData = false } = request.body;

      const result = await studentProfilingService.buildStudentProfile(
        studentId,
        requesterContext,
        includePrivateData
      );

      if (result.success) {
        return {
          success: true,
          data: result.data,
          message: 'Profile built successfully'
        };
      } else {
        reply.code(400).send({
          success: false,
          error: result.error || 'Unknown error',
          message: 'Failed to build profile'
        });
      }
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: error.message,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Update privacy choices
   */
  fastify.put<{
    Params: { studentId: string };
    Body: PrivacyChoices;
  }>('/profiles/:studentId/privacy-choices', {
    schema: {
      params: Type.Object({
        studentId: Type.String()
      }),
      body: PrivacyChoicesSchema,
      response: {
        200: StandardResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    }
  }, async (request, reply) => {
    try {
      const { studentId } = request.params;
      const choices = request.body;

      const result = await studentProfilingService.managePrivacyChoices(studentId, choices);

      if (result.success) {
        return {
          success: true,
          data: result.data,
          message: 'Privacy choices updated successfully'
        };
      } else {
        reply.code(400).send({
          success: false,
          error: result.error || 'Unknown error',
          message: 'Failed to update privacy choices'
        });
      }
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: error.message,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Generate privacy-preserving analytics
   */
  fastify.post<{
    Body: PrivacyAnalyticsRequest
  }>('/analytics/privacy-preserving', {
    schema: {
      body: PrivacyAnalyticsRequestSchema,
      response: {
        200: StandardResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    }
  }, async (request, reply) => {
    try {
      const { cohortIds, metrics, epsilon, delta } = request.body;

      const result = await studentProfilingService.generatePrivacyPreservingAnalytics(
        cohortIds,
        metrics,
        epsilon,
        delta
      );

      if (result.success) {
        return {
          success: true,
          data: result.data,
          message: 'Privacy-preserving analytics generated successfully'
        };
      } else {
        reply.code(400).send({
          success: false,
          error: result.error || 'Unknown error',
          message: 'Failed to generate analytics'
        });
      }
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: error.message,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Validate data access request
   */
  fastify.post<{
    Body: AccessValidationRequest
  }>('/access-validation', {
    schema: {
      body: AccessValidationRequestSchema,
      response: {
        200: StandardResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    }
  }, async (request, reply) => {
    try {
      const { requesterId, requesterType, studentId, purpose, dataTypes, studentBenefit } = request.body;

      const result = await studentProfilingService.validateDataAccessRequest(
        requesterId,
        requesterType,
        studentId,
        purpose,
        dataTypes,
        studentBenefit
      );

      if (result.success) {
        return {
          success: true,
          data: result.data,
          message: 'Access validation completed'
        };
      } else {
        reply.code(400).send({
          success: false,
          error: result.error || 'Unknown error',
          message: 'Access validation failed'
        });
      }
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: error.message,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Get privacy dashboard
   */
  fastify.get<{
    Params: { studentId: string };
    Querystring: {
      includeRecommendations?: boolean;
      timeRange?: 'week' | 'month' | 'semester' | 'all';
    }
  }>('/profiles/:studentId/privacy-dashboard', {
    schema: {
      params: Type.Object({
        studentId: Type.String()
      }),
      querystring: Type.Object({
        includeRecommendations: Type.Optional(Type.Boolean()),
        timeRange: Type.Optional(Type.Union([
          Type.Literal('week'),
          Type.Literal('month'),
          Type.Literal('semester'),
          Type.Literal('all')
        ]))
      }),
      response: {
        200: StandardResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    }
  }, async (request, reply) => {
    try {
      const { studentId } = request.params;
      const { includeRecommendations = true, timeRange = 'month' } = request.query;

      const result = await studentProfilingService.createPrivacyDashboard(
        studentId,
        includeRecommendations,
        timeRange
      );

      if (result.success) {
        return {
          success: true,
          data: result.data,
          message: 'Privacy dashboard generated successfully'
        };
      } else {
        reply.code(400).send({
          success: false,
          error: result.error || 'Unknown error',
          message: 'Failed to generate privacy dashboard'
        });
      }
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: error.message,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Track learning trajectory
   */
  fastify.post<{
    Params: { studentId: string };
    Body: LearningTrajectoryRequest;
  }>('/profiles/:studentId/learning-trajectory', {
    schema: {
      params: Type.Object({
        studentId: Type.String()
      }),
      body: LearningTrajectoryRequestSchema,
      response: {
        200: StandardResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    }
  }, async (request, reply) => {
    try {
      const { studentId } = request.params;
      const { milestone, privacyLevel = 'anonymized' } = request.body;

      const result = await studentProfilingService.trackLearningTrajectory(
        studentId,
        milestone,
        privacyLevel
      );

      if (result.success) {
        return {
          success: true,
          data: result.data,
          message: 'Learning trajectory updated successfully'
        };
      } else {
        reply.code(400).send({
          success: false,
          error: result.error || 'Unknown error',
          message: 'Failed to update learning trajectory'
        });
      }
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: error.message,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Assess skill development
   */
  fastify.post<{
    Params: { studentId: string };
    Body: SkillAssessmentRequest;
  }>('/profiles/:studentId/skill-assessment', {
    schema: {
      params: Type.Object({
        studentId: Type.String()
      }),
      body: SkillAssessmentRequestSchema,
      response: {
        200: StandardResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    }
  }, async (request, reply) => {
    try {
      const { studentId } = request.params;
      const { skills, sharedWith = [] } = request.body;

      const result = await studentProfilingService.assessSkillDevelopment(
        studentId,
        skills,
        sharedWith
      );

      if (result.success) {
        return {
          success: true,
          data: result.data,
          message: 'Skill assessment completed successfully'
        };
      } else {
        reply.code(400).send({
          success: false,
          error: result.error || 'Unknown error',
          message: 'Failed to complete skill assessment'
        });
      }
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: error.message,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Generate personalized recommendations
   */
  fastify.post<{
    Params: { studentId: string };
    Body: RecommendationsRequest;
  }>('/profiles/:studentId/recommendations', {
    schema: {
      params: Type.Object({
        studentId: Type.String()
      }),
      body: RecommendationsRequestSchema,
      response: {
        200: StandardResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    }
  }, async (request, reply) => {
    try {
      const { studentId } = request.params;
      const { useEnhancedData = false, recommendationTypes } = request.body;

      const result = await studentProfilingService.generatePersonalizedRecommendations(
        studentId,
        useEnhancedData,
        recommendationTypes
      );

      if (result.success) {
        return {
          success: true,
          data: result.data,
          message: 'Personalized recommendations generated successfully'
        };
      } else {
        reply.code(400).send({
          success: false,
          error: result.error || 'Unknown error',
          message: 'Failed to generate recommendations'
        });
      }
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: error.message,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Get service status
   */
  fastify.get('/status', {
    schema: {
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            mcpConnected: Type.Boolean(),
            httpConnected: Type.Boolean(),
            repositoryAvailable: Type.Boolean(),
            preferredMethod: Type.Union([
              Type.Literal('MCP'),
              Type.Literal('HTTP'),
              Type.Literal('Repository')
            ])
          }),
          message: Type.String()
        }),
        500: ErrorResponseSchema
      }
    }
  }, async (request, reply) => {
    try {
      const status = studentProfilingService.getServiceStatus();
      
      return {
        success: true,
        data: status,
        message: 'Service status retrieved successfully'
      };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: error.message,
        message: 'Failed to retrieve service status'
      });
    }
  });
}