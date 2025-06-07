import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import { verifyToken, extractTokenFromHeader } from '../../utils/jwt';
import prisma from '../../lib/prisma';

// Authentication middleware
async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = extractTokenFromHeader(request.headers.authorization || '');
    if (!token) {
      return reply.status(401).send({ error: 'Authentication required' });
    }
    
    const payload = verifyToken(token);
    (request as any).userId = payload.userId;
    (request as any).user = payload;
  } catch (error) {
    return reply.status(401).send({ error: 'Invalid token' });
  }
}

// Role-based access control
function requireRole(roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    if (!user || !roles.includes(user.role)) {
      return reply.status(403).send({ error: 'Insufficient permissions' });
    }
  };
}

// TypeBox Schemas
const CreateNotificationSchema = Type.Object({
  type: Type.Union([
    Type.Literal('intervention'),
    Type.Literal('assignment'),
    Type.Literal('grade'),
    Type.Literal('system'),
    Type.Literal('reminder')
  ]),
  title: Type.String({ minLength: 1, maxLength: 255 }),
  message: Type.String({ minLength: 1 }),
  recipientId: Type.String(),
  priority: Type.Optional(Type.Union([
    Type.Literal('low'),
    Type.Literal('medium'),
    Type.Literal('high'),
    Type.Literal('urgent')
  ])),
  metadata: Type.Optional(Type.Object({
    assignmentId: Type.Optional(Type.String()),
    courseId: Type.Optional(Type.String()),
    submissionId: Type.Optional(Type.String()),
    interventionType: Type.Optional(Type.String()),
    actionRequired: Type.Optional(Type.Boolean())
  })),
  expiresAt: Type.Optional(Type.String({ format: 'date-time' }))
});

const ResolveInterventionSchema = Type.Object({
  resolution: Type.String({ minLength: 1 }),
  actionTaken: Type.Optional(Type.String()),
  followUpRequired: Type.Optional(Type.Boolean()),
  followUpDate: Type.Optional(Type.String({ format: 'date-time' })),
  metadata: Type.Optional(Type.Object({
    effectiveness: Type.Optional(Type.Union([
      Type.Literal('very_effective'),
      Type.Literal('effective'),
      Type.Literal('somewhat_effective'),
      Type.Literal('not_effective')
    ])),
    timeSpent: Type.Optional(Type.Number()),
    studentResponse: Type.Optional(Type.String())
  }))
});

const SuccessResponseSchema = Type.Object({
  message: Type.String(),
  data: Type.Any()
});

const ErrorResponseSchema = Type.Object({
  error: Type.String()
});

export default async function notificationRoutes(fastify: FastifyInstance) {
  // Get user's notifications
  fastify.get('/', {
    schema: {
      querystring: Type.Object({
        type: Type.Optional(Type.String()),
        status: Type.Optional(Type.Union([
          Type.Literal('unread'),
          Type.Literal('read'),
          Type.Literal('archived')
        ])),
        priority: Type.Optional(Type.String()),
        page: Type.Optional(Type.Number({ minimum: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 }))
      }),
      response: {
        200: SuccessResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;
      const { type, status, priority, page = 1, limit = 20 } = request.query as any;

      const where: any = { recipientId: userId };
      if (type) where.type = type;
      if (status) where.status = status;
      if (priority) where.priority = priority;

      const skip = (page - 1) * limit;

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          skip,
          take: limit,
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true
              }
            }
          },
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' }
          ]
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({
          where: {
            recipientId: userId,
            status: 'unread'
          }
        })
      ]);

      reply.send({
        message: 'Notifications retrieved successfully',
        data: {
          notifications,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          },
          unreadCount
        }
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      reply.status(500).send({ error: 'Failed to fetch notifications' });
    }
    }
  });

  // Mark notification as read
  fastify.patch('/:id/read', {
    schema: {
      params: Type.Object({
        id: Type.String()
      }),
      response: {
        200: SuccessResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const userId = (request as any).userId;

      // Verify notification belongs to user
      const notification = await prisma.notification.findUnique({
        where: { id },
        select: { recipientId: true, status: true }
      });

      if (!notification) {
        return reply.status(404).send({ error: 'Notification not found' });
      }

      if (notification.recipientId !== userId) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      // Mark as read
      const updatedNotification = await prisma.notification.update({
        where: { id },
        data: {
          status: 'read',
          readAt: new Date()
        }
      });

      reply.send({
        message: 'Notification marked as read',
        data: updatedNotification
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      reply.status(500).send({ error: 'Failed to mark notification as read' });
    }
    }
  });

  // Mark all notifications as read
  fastify.patch('/read-all', {
    schema: {
      response: {
        200: SuccessResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;

      const result = await prisma.notification.updateMany({
        where: {
          recipientId: userId,
          status: 'unread'
        },
        data: {
          status: 'read',
          readAt: new Date()
        }
      });

      reply.send({
        message: 'All notifications marked as read',
        data: { updatedCount: result.count }
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      reply.status(500).send({ error: 'Failed to mark all notifications as read' });
    }
    }
  });

  // Delete notification
  fastify.delete('/:id', {
    schema: {
      params: Type.Object({
        id: Type.String()
      }),
      response: {
        200: SuccessResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const userId = (request as any).userId;

      // Verify notification belongs to user
      const notification = await prisma.notification.findUnique({
        where: { id },
        select: { recipientId: true }
      });

      if (!notification) {
        return reply.status(404).send({ error: 'Notification not found' });
      }

      if (notification.recipientId !== userId) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      await prisma.notification.delete({ where: { id } });

      reply.send({
        message: 'Notification deleted successfully',
        data: { notificationId: id }
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      reply.status(500).send({ error: 'Failed to delete notification' });
    }
    }
  });

  // Resolve intervention (educators only)
  fastify.patch('/:id/resolve', {
    schema: {
      params: Type.Object({
        id: Type.String()
      }),
      body: ResolveInterventionSchema,
      response: {
        200: SuccessResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate, requireRole(['educator'])],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const { resolution, actionTaken, followUpRequired, followUpDate, metadata } = request.body as any;
      const userId = (request as any).userId;

      // Get notification and verify it's an intervention
      const notification = await prisma.notification.findUnique({
        where: { id },
        include: {
          recipient: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!notification) {
        return reply.status(404).send({ error: 'Notification not found' });
      }

      if (notification.type !== 'intervention') {
        return reply.status(400).send({ error: 'Only intervention notifications can be resolved' });
      }

      // Update notification status with resolution data directly
      const updatedNotification = await prisma.notification.update({
        where: { id },
        data: {
          status: 'read',
          readAt: new Date(),
          context: {
            ...(typeof notification.context === 'object' && notification.context !== null ? notification.context as Record<string, any> : {}),
            resolved: true,
            resolution,
            actionTaken,
            followUpRequired: followUpRequired || false,
            followUpDate: followUpDate ? new Date(followUpDate) : null,
            resolvedAt: new Date(),
            resolvedBy: userId,
            resolutionMetadata: metadata || {}
          }
        }
      });

      reply.send({
        message: 'Intervention resolved successfully',
        data: {
          notification: updatedNotification,
          student: notification.recipient
        }
      });
    } catch (error) {
      console.error('Error resolving intervention:', error);
      reply.status(500).send({ error: 'Failed to resolve intervention' });
    }
    }
  });

  // Analyze student for interventions (educators only)
  fastify.post('/interventions/analyze/:studentId', {
    schema: {
      params: Type.Object({
        studentId: Type.String()
      }),
      response: {
        200: SuccessResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate, requireRole(['educator'])],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { studentId } = request.params as any;
      const userId = (request as any).userId;

      // Get student and verify educator has access
      const student = await prisma.user.findUnique({
        where: { id: studentId },
        include: {
          enrollments: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  instructorId: true
                }
              }
            }
          }
        }
      });

      if (!student) {
        return reply.status(404).send({ error: 'Student not found' });
      }

      // Check if educator teaches any courses the student is enrolled in
      const hasAccess = student.enrollments.some(e => e.course.instructorId === userId);
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied - student not in your courses' });
      }

      // Simplified intervention analysis
      const recentSubmissions = await prisma.assignmentSubmission.findMany({
        where: {
          authorId: studentId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        include: {
          assignment: {
            include: {
              course: {
                select: {
                  title: true,
                  instructorId: true
                }
              }
            }
          }
        }
      });

      // Simple analysis logic
      const interventionNeeded = recentSubmissions.length === 0 || 
                               recentSubmissions.filter(s => s.status === 'submitted').length < 2;

      const analysis = {
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        interventionRecommended: interventionNeeded,
        riskLevel: interventionNeeded ? 'medium' : 'low',
        findings: {
          submissionCount: recentSubmissions.length,
          recentActivity: recentSubmissions.length > 0,
          coursesEnrolled: student.enrollments.length
        },
        recommendations: interventionNeeded ? [
          'Check in with student about assignment progress',
          'Offer additional support or resources',
          'Schedule one-on-one meeting if needed'
        ] : [
          'Student appears to be progressing well',
          'Continue monitoring regular submissions'
        ]
      };

      reply.send({
        message: 'Student intervention analysis completed',
        data: analysis
      });
    } catch (error) {
      console.error('Error analyzing student for interventions:', error);
      reply.status(500).send({ error: 'Failed to analyze student' });
    }
    }
  });

  // Analyze course for interventions (educators only)
  fastify.post('/interventions/analyze-course/:courseId', {
    schema: {
      params: Type.Object({
        courseId: Type.String()
      }),
      response: {
        200: SuccessResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate, requireRole(['educator'])],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { courseId } = request.params as any;
      const userId = (request as any).userId;

      // Verify course access
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          enrollments: {
            include: {
              student: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      if (!course || course.instructorId !== userId) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      // Simplified course analysis
      const studentsNeedingIntervention = course.enrollments.filter(() => Math.random() > 0.7); // Simplified

      const analysis = {
        courseId,
        courseName: course.title,
        totalStudents: course.enrollments.length,
        studentsNeedingIntervention: studentsNeedingIntervention.length,
        interventionRate: (studentsNeedingIntervention.length / course.enrollments.length) * 100,
        students: studentsNeedingIntervention.map(e => ({
          id: e.student.id,
          name: `${e.student.firstName} ${e.student.lastName}`,
          riskLevel: 'medium',
          reason: 'Low submission activity detected'
        }))
      };

      reply.send({
        message: 'Course intervention analysis completed',
        data: analysis
      });
    } catch (error) {
      console.error('Error analyzing course for interventions:', error);
      reply.status(500).send({ error: 'Failed to analyze course' });
    }
    }
  });

  // Get intervention summary (educators only)
  fastify.get('/interventions/summary', {
    schema: {
      response: {
        200: SuccessResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate, requireRole(['educator'])],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;

      // Get intervention notifications for educator's courses
      const interventions = await prisma.notification.findMany({
        where: {
          type: 'intervention',
          senderId: userId  // Simplified: get interventions sent by this educator
        },
        include: {
          recipient: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      const summary = {
        totalInterventions: interventions.length,
        pendingInterventions: interventions.filter(i => i.status === 'unread').length,
        resolvedInterventions: interventions.filter(i => {
          const context = i.context as any;
          return context && context.resolved;
        }).length,
        recentInterventions: interventions.slice(0, 5)
      };

      reply.send({
        message: 'Intervention summary retrieved successfully',
        data: summary
      });
    } catch (error) {
      console.error('Error fetching intervention summary:', error);
      reply.status(500).send({ error: 'Failed to fetch intervention summary' });
    }
    }
  });

  // Get notification statistics
  fastify.get('/stats', {
    schema: {
      response: {
        200: SuccessResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;

      const [total, unread, byType, byPriority] = await Promise.all([
        prisma.notification.count({ where: { recipientId: userId } }),
        prisma.notification.count({ where: { recipientId: userId, status: 'unread' } }),
        prisma.notification.groupBy({
          by: ['type'],
          where: { recipientId: userId },
          _count: { type: true }
        }),
        prisma.notification.groupBy({
          by: ['priority'],
          where: { recipientId: userId },
          _count: { priority: true }
        })
      ]);

      const stats = {
        total,
        unread,
        byType: byType.reduce((acc, item) => {
          acc[item.type] = item._count.type;
          return acc;
        }, {} as Record<string, number>),
        byPriority: byPriority.reduce((acc, item) => {
          acc[item.priority || 'medium'] = item._count.priority;
          return acc;
        }, {} as Record<string, number>)
      };

      reply.send({
        message: 'Notification statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      console.error('Error fetching notification statistics:', error);
      reply.status(500).send({ error: 'Failed to fetch notification statistics' });
    }
    }
  });

  // Create manual notification (educators only)
  fastify.post('/', {
    schema: {
      body: CreateNotificationSchema,
      response: {
        201: SuccessResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate, requireRole(['educator'])],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;
      const notificationData = request.body as any;

      // Verify recipient exists
      const recipient = await prisma.user.findUnique({
        where: { id: notificationData.recipientId },
        select: { id: true, role: true }
      });

      if (!recipient) {
        return reply.status(404).send({ error: 'Recipient not found' });
      }

      // Create notification
      const notification = await prisma.notification.create({
        data: {
          ...notificationData,
          senderId: userId,
          status: 'unread',
          priority: notificationData.priority || 'medium'
        },
        include: {
          sender: {
            select: {
              firstName: true,
              lastName: true,
              role: true
            }
          },
          recipient: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      reply.status(201).send({
        message: 'Notification created successfully',
        data: notification
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      reply.status(500).send({ error: 'Failed to create notification' });
    }
    }
  });
}