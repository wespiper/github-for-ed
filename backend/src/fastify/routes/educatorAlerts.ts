/**
 * Educator Alerts Fastify Routes
 * Privacy-aware educator alert and intervention management using Fastify
 */

import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import { EducatorAlertsService } from '../../services/EducatorAlertsService';
import { PrivacyContext } from '../../types/privacy';
import { ServiceFactory } from '../../container/ServiceFactory';

// Request/Response schemas using TypeBox for Fastify
const InterventionRecommendationSchema = Type.Object({
  studentId: Type.String({ format: 'uuid' }),
  analysisData: Type.Object({
    cognitiveLoad: Type.Optional(Type.Number({ minimum: 0, maximum: 1 })),
    engagementScore: Type.Optional(Type.Number({ minimum: 0, maximum: 1 })),
    qualityScore: Type.Optional(Type.Number({ minimum: 0, maximum: 1 })),
    reflectionDepth: Type.Optional(Type.Number({ minimum: 0, maximum: 1 })),
    timeOnTask: Type.Optional(Type.Number({ minimum: 0 })),
    strugglingDuration: Type.Optional(Type.Number({ minimum: 0 }))
  }),
  educationalContext: Type.Object({
    assignmentId: Type.Optional(Type.String({ format: 'uuid' })),
    courseId: Type.Optional(Type.String({ format: 'uuid' })),
    learningObjectives: Type.Optional(Type.Array(Type.String())),
    writingStage: Type.Optional(Type.String()),
    dueDate: Type.Optional(Type.String({ format: 'date-time' }))
  })
});

const SendAlertsSchema = Type.Object({
  alerts: Type.Array(Type.Object({
    educatorId: Type.String({ format: 'uuid' }),
    studentId: Type.String({ format: 'uuid' }),
    assignmentId: Type.Optional(Type.String({ format: 'uuid' })),
    courseId: Type.Optional(Type.String({ format: 'uuid' })),
    alertType: Type.Union([
      Type.Literal('intervention_needed'),
      Type.Literal('progress_concern'),
      Type.Literal('academic_integrity'),
      Type.Literal('engagement_drop'),
      Type.Literal('quality_decline'),
      Type.Literal('urgent_support')
    ]),
    severity: Type.Union([
      Type.Literal('low'),
      Type.Literal('medium'),
      Type.Literal('high'),
      Type.Literal('critical'),
      Type.Literal('urgent')
    ]),
    title: Type.String({ minLength: 1, maxLength: 200 }),
    description: Type.String({ minLength: 1, maxLength: 1000 }),
    recommendedActions: Type.Array(Type.Object({
      id: Type.String(),
      type: Type.Union([
        Type.Literal('contact_student'),
        Type.Literal('schedule_meeting'),
        Type.Literal('provide_feedback'),
        Type.Literal('modify_assignment'),
        Type.Literal('refer_support'),
        Type.Literal('adjust_ai_boundaries')
      ]),
      title: Type.String(),
      description: Type.String(),
      priority: Type.Union([
        Type.Literal('low'),
        Type.Literal('medium'),
        Type.Literal('high'),
        Type.Literal('urgent')
      ]),
      estimatedTime: Type.String(),
      completed: Type.Optional(Type.Boolean())
    })),
    triggerData: Type.Record(Type.String(), Type.Any())
  })),
  deliveryOptions: Type.Object({
    immediate: Type.Optional(Type.Boolean()),
    channels: Type.Optional(Type.Array(Type.Union([
      Type.Literal('in_app'),
      Type.Literal('email'),
      Type.Literal('sms')
    ]))),
    batchWithOthers: Type.Optional(Type.Boolean())
  })
});

const ScheduleInterventionSchema = Type.Object({
  interventionId: Type.String({ format: 'uuid' }),
  scheduleData: Type.Object({
    educatorId: Type.String({ format: 'uuid' }),
    studentId: Type.String({ format: 'uuid' }),
    scheduledType: Type.Union([
      Type.Literal('meeting'),
      Type.Literal('check_in'),
      Type.Literal('feedback_session'),
      Type.Literal('support_call'),
      Type.Literal('progress_review')
    ]),
    scheduledFor: Type.String({ format: 'date-time' }),
    duration: Type.Number({ minimum: 5, maximum: 300 }),
    location: Type.Optional(Type.String()),
    virtualMeetingUrl: Type.Optional(Type.String({ format: 'uri' })),
    agenda: Type.Array(Type.String()),
    followUpRequired: Type.Optional(Type.Boolean())
  }),
  reminderSettings: Type.Object({
    sendReminders: Type.Boolean(),
    reminderTimes: Type.Array(Type.String()),
    includePreparation: Type.Optional(Type.Boolean())
  })
});

const TrackEffectivenessSchema = Type.Object({
  interventionId: Type.String({ format: 'uuid' }),
  measurementData: Type.Object({
    measurementType: Type.Union([
      Type.Literal('pre_post'),
      Type.Literal('longitudinal'),
      Type.Literal('immediate'),
      Type.Literal('delayed')
    ]),
    metrics: Type.Record(Type.String(), Type.Number()),
    baselineData: Type.Record(Type.String(), Type.Any()),
    postInterventionData: Type.Record(Type.String(), Type.Any()),
    confidenceLevel: Type.Number({ minimum: 0, maximum: 1 }),
    notes: Type.Optional(Type.String()),
    followUpRecommendations: Type.Array(Type.String())
  }),
  comparisonPeriod: Type.Object({
    baseline: Type.Object({
      start: Type.String({ format: 'date-time' }),
      end: Type.String({ format: 'date-time' })
    }),
    measurement: Type.Object({
      start: Type.String({ format: 'date-time' }),
      end: Type.String({ format: 'date-time' })
    })
  })
});

const AlertFiltersSchema = Type.Object({
  educatorId: Type.Optional(Type.String({ format: 'uuid' })),
  studentId: Type.Optional(Type.String({ format: 'uuid' })),
  assignmentId: Type.Optional(Type.String({ format: 'uuid' })),
  courseId: Type.Optional(Type.String({ format: 'uuid' })),
  alertType: Type.Optional(Type.Union([
    Type.Literal('intervention_needed'),
    Type.Literal('progress_concern'),
    Type.Literal('academic_integrity'),
    Type.Literal('engagement_drop'),
    Type.Literal('quality_decline'),
    Type.Literal('urgent_support')
  ])),
  severity: Type.Optional(Type.Union([
    Type.Literal('low'),
    Type.Literal('medium'),
    Type.Literal('high'),
    Type.Literal('critical'),
    Type.Literal('urgent')
  ])),
  status: Type.Optional(Type.Union([
    Type.Literal('pending'),
    Type.Literal('acknowledged'),
    Type.Literal('addressed'),
    Type.Literal('dismissed'),
    Type.Literal('escalated')
  ])),
  fromDate: Type.Optional(Type.String({ format: 'date-time' })),
  toDate: Type.Optional(Type.String({ format: 'date-time' })),
  unacknowledgedOnly: Type.Optional(Type.Boolean()),
  urgentOnly: Type.Optional(Type.Boolean())
});

const AcknowledgeAlertsSchema = Type.Object({
  alertIds: Type.Array(Type.String({ format: 'uuid' })),
  acknowledgmentData: Type.Object({
    acknowledgedBy: Type.String({ format: 'uuid' }),
    notes: Type.Optional(Type.String()),
    plannedActions: Type.Optional(Type.Array(Type.String()))
  })
});

// Type definitions
type InterventionRecommendationRequest = Static<typeof InterventionRecommendationSchema>;
type SendAlertsRequest = Static<typeof SendAlertsSchema>;
type ScheduleInterventionRequest = Static<typeof ScheduleInterventionSchema>;
type TrackEffectivenessRequest = Static<typeof TrackEffectivenessSchema>;
type AlertFiltersQuery = Static<typeof AlertFiltersSchema>;
type AcknowledgeAlertsRequest = Static<typeof AcknowledgeAlertsSchema>;

// Standard API response type
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

const educatorAlertsRoutes: FastifyPluginAsync = async (fastify) => {
  // Initialize service
  const serviceFactory = ServiceFactory.getInstance();
  const educatorAlertsService = new EducatorAlertsService();

  // Helper function to create privacy context from request
  function createPrivacyContext(request: FastifyRequest): PrivacyContext {
    return {
      requesterId: (request as any).user?.id || 'anonymous',
      requesterType: (request as any).user?.role || 'student',
      purpose: 'educator_alerts_api',
      educationalJustification: 'Educator alert management and intervention support',
      timestamp: new Date(),
      correlationId: (request.headers['x-correlation-id'] as string) || `ea_${Date.now()}`,
      sessionId: (request as any).session?.id,
      userId: (request as any).user?.id
    };
  }

  // Helper function to handle API errors
  function handleApiError(reply: FastifyReply, error: any, operation: string): FastifyReply {
    fastify.log.error(`${operation} failed:`, error);
    
    if (error.message.includes('validation failed')) {
      return reply.status(400).send({
        success: false,
        message: 'Validation error',
        error: error.message
      } as ApiResponse);
    }

    if (error.message.includes('Insufficient permissions')) {
      return reply.status(403).send({
        success: false,
        message: 'Insufficient permissions',
        error: error.message
      } as ApiResponse);
    }

    if (error.message.includes('not found')) {
      return reply.status(404).send({
        success: false,
        message: 'Resource not found',
        error: error.message
      } as ApiResponse);
    }

    return reply.status(500).send({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
    } as ApiResponse);
  }

  // Middleware to validate educator permissions
  async function validateEducatorPermissions(request: FastifyRequest, reply: FastifyReply) {
    if (!(request as any).user) {
      return reply.status(401).send({
        success: false,
        message: 'Authentication required'
      } as ApiResponse);
    }

    if ((request as any).user.role !== 'educator' && (request as any).user.role !== 'admin') {
      return reply.status(403).send({
        success: false,
        message: 'Educator permissions required'
      } as ApiResponse);
    }
  }

  // Add preHandler for all routes
  fastify.addHook('preHandler', validateEducatorPermissions);

  /**
   * POST /recommendations
   * Generate intervention recommendations
   */
  fastify.post<{ Body: InterventionRecommendationRequest }>('/recommendations', {
    schema: {
      body: InterventionRecommendationSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Any(),
          message: Type.Optional(Type.String())
        })
      }
    }
  }, async (request, reply) => {
    try {
      const privacyContext = createPrivacyContext(request);

      const recommendations = await educatorAlertsService.generateInterventionRecommendations(
        request.body.studentId,
        request.body.analysisData,
        request.body.educationalContext,
        privacyContext
      );

      return reply.send({
        success: true,
        data: recommendations,
        message: `Generated ${recommendations.length} intervention recommendations`
      } as ApiResponse);
    } catch (error) {
      return handleApiError(reply, error, 'generateInterventionRecommendations');
    }
  });

  /**
   * POST /send
   * Send educator alerts
   */
  fastify.post<{ Body: SendAlertsRequest }>('/send', {
    schema: {
      body: SendAlertsSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Any(),
          message: Type.Optional(Type.String())
        })
      }
    }
  }, async (request, reply) => {
    try {
      const privacyContext = createPrivacyContext(request);

      // Temporarily simplified for testing - add required fields
      const alertsWithStatus = request.body.alerts.map((alert: any) => ({
        ...alert,
        status: 'pending' // Add required status field
      }));
      
      const result = await educatorAlertsService.sendEducatorAlerts(
        alertsWithStatus,
        request.body.deliveryOptions,
        privacyContext
      );

      return reply.send({
        success: true,
        data: result,
        message: `Sent ${result.sent.length} alerts, queued ${result.queued.length}, failed ${result.failed.length}`
      } as ApiResponse);
    } catch (error) {
      return handleApiError(reply, error, 'sendEducatorAlerts');
    }
  });

  /**
   * POST /schedule
   * Schedule intervention actions
   */
  fastify.post<{ Body: ScheduleInterventionRequest }>('/schedule', {
    schema: {
      body: ScheduleInterventionSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Any(),
          message: Type.Optional(Type.String())
        })
      }
    }
  }, async (request, reply) => {
    try {
      const privacyContext = createPrivacyContext(request);

      // Convert string dates to Date objects and add required fields
      const scheduleData = {
        ...request.body.scheduleData,
        scheduledFor: new Date(request.body.scheduleData.scheduledFor),
        status: 'scheduled' as const, // Add required status field
        interventionId: request.body.interventionId, // Add required interventionId
        remindersSent: [], // Add required remindersSent field (Date array)
        followUpRequired: request.body.scheduleData.followUpRequired ?? false // Ensure boolean type
      };

      const schedule = await educatorAlertsService.scheduleInterventionActions(
        request.body.interventionId,
        scheduleData,
        request.body.reminderSettings,
        privacyContext
      );

      return reply.send({
        success: true,
        data: schedule,
        message: 'Intervention scheduled successfully'
      } as ApiResponse);
    } catch (error) {
      return handleApiError(reply, error, 'scheduleInterventionActions');
    }
  });

  /**
   * POST /track-effectiveness
   * Track intervention effectiveness
   */
  fastify.post<{ Body: TrackEffectivenessRequest }>('/track-effectiveness', {
    schema: {
      body: TrackEffectivenessSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Any(),
          message: Type.Optional(Type.String())
        })
      }
    }
  }, async (request, reply) => {
    try {
      const privacyContext = createPrivacyContext(request);

      // Convert string dates to Date objects
      const comparisonPeriod = {
        baseline: {
          start: new Date(request.body.comparisonPeriod.baseline.start),
          end: new Date(request.body.comparisonPeriod.baseline.end)
        },
        measurement: {
          start: new Date(request.body.comparisonPeriod.measurement.start),
          end: new Date(request.body.comparisonPeriod.measurement.end)
        }
      };

      // Add required fields to measurement data
      const measurementDataWithRequired = {
        ...request.body.measurementData,
        interventionId: request.body.interventionId, // Add required interventionId
        improvementScore: (request.body.measurementData as any).improvementScore || 0 // Add required improvementScore
      };

      const effectiveness = await educatorAlertsService.trackInterventionEffectiveness(
        request.body.interventionId,
        measurementDataWithRequired,
        comparisonPeriod,
        privacyContext
      );

      return reply.send({
        success: true,
        data: effectiveness,
        message: 'Intervention effectiveness tracked successfully'
      } as ApiResponse);
    } catch (error) {
      return handleApiError(reply, error, 'trackInterventionEffectiveness');
    }
  });

  /**
   * GET /educator/:educatorId
   * Get alerts for an educator
   */
  fastify.get<{
    Params: { educatorId: string };
    Querystring: AlertFiltersQuery;
  }>('/educator/:educatorId', {
    schema: {
      params: Type.Object({
        educatorId: Type.String({ format: 'uuid' })
      }),
      querystring: AlertFiltersSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Any(),
          message: Type.Optional(Type.String())
        })
      }
    }
  }, async (request, reply) => {
    try {
      const privacyContext = createPrivacyContext(request);

      const filters = {
        ...request.query,
        fromDate: request.query.fromDate ? new Date(request.query.fromDate) : undefined,
        toDate: request.query.toDate ? new Date(request.query.toDate) : undefined
      };

      const alerts = await educatorAlertsService.findByEducator(
        request.params.educatorId,
        filters,
        privacyContext
      );

      return reply.send({
        success: true,
        data: alerts,
        message: `Found ${alerts.length} alerts for educator`
      } as ApiResponse);
    } catch (error) {
      return handleApiError(reply, error, 'findByEducator');
    }
  });

  /**
   * GET /urgent/:educatorId
   * Get urgent alerts for an educator
   */
  fastify.get<{
    Params: { educatorId: string };
  }>('/urgent/:educatorId', {
    schema: {
      params: Type.Object({
        educatorId: Type.String({ format: 'uuid' })
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Any(),
          message: Type.Optional(Type.String())
        })
      }
    }
  }, async (request, reply) => {
    try {
      const privacyContext = createPrivacyContext(request);

      const alerts = await educatorAlertsService.getUrgentAlerts(
        request.params.educatorId,
        privacyContext
      );

      return reply.send({
        success: true,
        data: alerts,
        message: `Found ${alerts.length} urgent alerts`
      } as ApiResponse);
    } catch (error) {
      return handleApiError(reply, error, 'getUrgentAlerts');
    }
  });

  /**
   * POST /acknowledge
   * Acknowledge alerts
   */
  fastify.post<{ Body: AcknowledgeAlertsRequest }>('/acknowledge', {
    schema: {
      body: AcknowledgeAlertsSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Any(),
          message: Type.Optional(Type.String())
        })
      }
    }
  }, async (request, reply) => {
    try {
      const privacyContext = createPrivacyContext(request);

      const acknowledgedAlerts = await educatorAlertsService.acknowledgeAlerts(
        request.body.alertIds,
        request.body.acknowledgmentData,
        privacyContext
      );

      return reply.send({
        success: true,
        data: acknowledgedAlerts,
        message: `Acknowledged ${acknowledgedAlerts.length} alerts`
      } as ApiResponse);
    } catch (error) {
      return handleApiError(reply, error, 'acknowledgeAlerts');
    }
  });

  /**
   * GET /preferences/:educatorId
   * Get educator preferences
   */
  fastify.get<{
    Params: { educatorId: string };
  }>('/preferences/:educatorId', {
    schema: {
      params: Type.Object({
        educatorId: Type.String({ format: 'uuid' })
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Any(),
          message: Type.Optional(Type.String())
        })
      }
    }
  }, async (request, reply) => {
    try {
      const privacyContext = createPrivacyContext(request);

      const preferences = await educatorAlertsService.getEducatorPreferences(
        request.params.educatorId,
        privacyContext
      );

      return reply.send({
        success: true,
        data: preferences,
        message: preferences ? 'Preferences found' : 'No preferences found'
      } as ApiResponse);
    } catch (error) {
      return handleApiError(reply, error, 'getEducatorPreferences');
    }
  });

  /**
   * GET /analytics
   * Get alert analytics
   */
  fastify.get<{
    Querystring: AlertFiltersQuery;
  }>('/analytics', {
    schema: {
      querystring: AlertFiltersSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Any(),
          message: Type.Optional(Type.String())
        })
      }
    }
  }, async (request, reply) => {
    try {
      const privacyContext = createPrivacyContext(request);

      const filters = {
        ...request.query,
        fromDate: request.query.fromDate ? new Date(request.query.fromDate) : undefined,
        toDate: request.query.toDate ? new Date(request.query.toDate) : undefined
      };

      const analytics = await educatorAlertsService.getAlertAnalytics(
        filters,
        {
          minimumCohortSize: 10,
          dateRange: {
            start: filters.fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            end: filters.toDate || new Date()
          }
        },
        privacyContext
      );

      return reply.send({
        success: true,
        data: analytics,
        message: 'Analytics retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      return handleApiError(reply, error, 'getAlertAnalytics');
    }
  });

  /**
   * GET /health
   * Get service health status
   */
  fastify.get('/health', {
    schema: {
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Any(),
          message: Type.Optional(Type.String())
        })
      }
    }
  }, async (request, reply) => {
    try {
      const healthStatus = educatorAlertsService.getHealthStatus();
      const activeServices = educatorAlertsService.getActiveServices();
      const currentTier = educatorAlertsService.getCurrentTier();

      return reply.send({
        success: true,
        data: {
          health: healthStatus,
          services: activeServices,
          currentTier,
          timestamp: new Date()
        },
        message: 'Health status retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      return handleApiError(reply, error, 'getHealthStatus');
    }
  });
};

export default educatorAlertsRoutes;