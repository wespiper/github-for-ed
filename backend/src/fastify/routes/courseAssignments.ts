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

// Helper function to validate UUID format
const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// TypeBox Schemas
const DeployTemplateSchema = Type.Object({
  templateId: Type.String(),
  courseId: Type.String(),
  dueDate: Type.Optional(Type.String({ format: 'date-time' })),
  customInstructions: Type.Optional(Type.String()),
  courseSpecificRequirements: Type.Optional(Type.Any()),
  allowLateSubmissions: Type.Optional(Type.Boolean()),
  maxCollaborators: Type.Optional(Type.Number({ minimum: 1 }))
});

const UpdateAssignmentSchema = Type.Object({
  title: Type.Optional(Type.String({ minLength: 1 })),
  instructions: Type.Optional(Type.String()),
  requirements: Type.Optional(Type.Any()),
  learningObjectives: Type.Optional(Type.Any()),
  writingStages: Type.Optional(Type.Any()),
  aiSettings: Type.Optional(Type.Any()),
  gradingCriteria: Type.Optional(Type.Any()),
  dueDate: Type.Optional(Type.String({ format: 'date-time' })),
  status: Type.Optional(Type.Union([
    Type.Literal('draft'),
    Type.Literal('published'),
    Type.Literal('archived')
  ]))
});

const SuccessResponseSchema = Type.Object({
  message: Type.String(),
  data: Type.Any()
});

const ErrorResponseSchema = Type.Object({
  error: Type.String()
});

export default async function courseAssignmentRoutes(fastify: FastifyInstance) {
  // Get assignments for the authenticated user
  fastify.get('/my-assignments', {
    schema: {
      querystring: Type.Object({
        status: Type.Optional(Type.String()),
        course: Type.Optional(Type.String())
      }),
      response: {
        200: SuccessResponseSchema,
        400: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;
      const { status, course } = request.query as any;

      // Build where clause based on filters
      const whereClause: any = {};
      
      if (status) {
        whereClause.status = status;
      }
      
      if (course) {
        if (!isValidUUID(course)) {
          return reply.status(400).send({ error: 'Invalid course ID format' });
        }
        whereClause.courseId = course;
      }

      // Check user role to determine access level
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      // Build assignment query based on user role
      let assignmentWhere: any = { ...whereClause };
      
      if (user?.role !== 'admin') {
        // For students and educators, only show assignments from courses they're enrolled in
        assignmentWhere.course = {
          enrollments: {
            some: {
              studentId: userId
            }
          }
        };
      }
      // For admins, show all assignments (no additional filtering)

      const assignments = await prisma.assignment.findMany({
        where: assignmentWhere,
        include: {
          course: {
            select: {
              id: true,
              title: true,
              description: true
            }
          },
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          submissions: {
            where: {
              authorId: userId
            },
            select: {
              id: true,
              status: true,
              submittedAt: true,
              wordCount: true
            }
          }
        },
        orderBy: [
          { dueDate: 'asc' },
          { createdAt: 'desc' }
        ]
      });

      reply.send({
        message: 'User assignments retrieved successfully',
        data: assignments
      });
    } catch (error) {
      console.error('Error fetching user assignments:', error);
      reply.status(500).send({ 
        error: 'Failed to fetch assignments'
      });
    }
  }
  });

  // Deploy template to course (create assignment from template)
  fastify.post('/deploy', {
    schema: {
      body: DeployTemplateSchema,
      response: {
        201: SuccessResponseSchema,
        400: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate, requireRole(['educator', 'admin'])],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const {
        templateId,
        courseId,
        dueDate,
        customInstructions,
        courseSpecificRequirements,
        allowLateSubmissions = true,
        maxCollaborators
      } = request.body as any;

      const userId = (request as any).userId;

      if (!isValidUUID(templateId) || !isValidUUID(courseId)) {
        return reply.status(400).send({ error: 'Invalid template or course ID format' });
      }

      // Verify template exists and is accessible
      const template = await prisma.assignmentTemplate.findUnique({
        where: { id: templateId },
        include: {
          instructor: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      });

      if (!template) {
        return reply.status(404).send({ error: 'Template not found' });
      }

      // Check template access
      const isTemplateOwner = template.instructorId === userId;
      const isTemplatePublic = template.isPublic;
      const isAdmin = (request as any).user.role === 'admin';
      const hasTemplateAccess = isTemplateOwner || isTemplatePublic || isAdmin;

      if (!hasTemplateAccess) {
        return reply.status(403).send({ error: 'Access denied to template' });
      }

      // Verify course exists and user has access
      const course = await prisma.course.findUnique({
        where: { id: courseId }
      });

      if (!course) {
        return reply.status(404).send({ error: 'Course not found' });
      }

      // Check course access
      const isCourseOwner = course.instructorId === userId;
      const hasCourseAccess = isCourseOwner || isAdmin;

      if (!hasCourseAccess) {
        return reply.status(403).send({ error: 'Access denied to course' });
      }

      // Create assignment from template
      const assignment = await prisma.assignment.create({
        data: {
          templateId,
          courseId,
          instructorId: userId,
          title: template.title,
          instructions: customInstructions || template.instructions,
          requirements: {
            ...(template.requirements as object || {}),
            ...(courseSpecificRequirements || {}),
            allowLateSubmissions,
            maxCollaborators
          },
          learningObjectives: template.learningObjectives as any,
          writingStages: template.writingStages as any,
          aiSettings: template.aiSettings as any,
          gradingCriteria: template.gradingCriteria as any,
          dueDate: dueDate ? new Date(dueDate) : null,
          status: 'published'
        },
        include: {
          template: {
            select: {
              id: true,
              title: true,
              usageCount: true
            }
          },
          course: {
            select: {
              id: true,
              title: true
            }
          },
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      // Increment template usage count
      await prisma.assignmentTemplate.update({
        where: { id: templateId },
        data: {
          usageCount: {
            increment: 1
          }
        }
      });

      reply.status(201).send({
        message: 'Template deployed successfully',
        data: assignment
      });
    } catch (error) {
      console.error('Error deploying template:', error);
      reply.status(500).send({ error: 'Failed to deploy template' });
    }
  }
  });

  // Get all assignments for a course
  fastify.get('/course/:courseId', {
    schema: {
      params: Type.Object({
        courseId: Type.String()
      }),
      response: {
        200: SuccessResponseSchema,
        400: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { courseId } = request.params as any;
      const userId = (request as any).userId;
      const userRole = (request as any).user.role;

      if (!isValidUUID(courseId)) {
        return reply.status(400).send({ error: 'Invalid course ID format' });
      }

      // Check course access
      const course = await prisma.course.findUnique({
        where: { id: courseId }
      });

      if (!course) {
        return reply.status(404).send({ error: 'Course not found' });
      }

      const isCourseOwner = course.instructorId === userId;
      const isAdmin = userRole === 'admin';

      // Check if user is enrolled in course (for students)
      let isEnrolled = false;
      if (userRole === 'student') {
        const enrollment = await prisma.courseEnrollment.findFirst({
          where: {
            courseId,
            studentId: userId,
            status: 'active'
          }
        });
        isEnrolled = !!enrollment;
      }

      const hasAccess = isCourseOwner || isAdmin || isEnrolled;

      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied to course' });
      }

      // Get assignments for the course
      const assignments = await prisma.assignment.findMany({
        where: { courseId },
        include: {
          template: {
            select: {
              id: true,
              title: true
            }
          },
          course: {
            select: {
              id: true,
              title: true
            }
          },
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          submissions: userRole === 'student' ? {
            where: { authorId: userId },
            select: {
              id: true,
              status: true,
              wordCount: true,
              submittedAt: true,
              updatedAt: true
            }
          } : {
            select: {
              id: true,
              authorId: true,
              status: true,
              submittedAt: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      reply.send({
        message: 'Course assignments retrieved successfully',
        data: assignments
      });
    } catch (error) {
      console.error('Error fetching course assignments:', error);
      reply.status(500).send({ error: 'Failed to fetch course assignments' });
    }
  }
  });

  // Get assignment by ID
  fastify.get('/:id', {
    schema: {
      params: Type.Object({
        id: Type.String()
      }),
      response: {
        200: SuccessResponseSchema,
        400: ErrorResponseSchema,
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
      const userRole = (request as any).user.role;

      if (!isValidUUID(id)) {
        return reply.status(400).send({ error: 'Invalid assignment ID format' });
      }

      const assignment = await prisma.assignment.findUnique({
        where: { id },
        include: {
          template: {
            select: {
              id: true,
              title: true
            }
          },
          course: {
            select: {
              id: true,
              title: true,
              instructorId: true
            }
          },
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!assignment) {
        return reply.status(404).send({ error: 'Assignment not found' });
      }

      // Check access permissions
      const isOwner = assignment.instructorId === userId;
      const isAdmin = userRole === 'admin';

      // Check if user is enrolled in course (for students)
      let isEnrolled = false;
      if (userRole === 'student') {
        const enrollment = await prisma.courseEnrollment.findFirst({
          where: {
            courseId: assignment.courseId,
            studentId: userId,
            status: 'active'
          }
        });
        isEnrolled = !!enrollment;
      }

      const hasAccess = isOwner || isAdmin || isEnrolled;

      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied to assignment' });
      }

      reply.send({
        message: 'Assignment retrieved successfully',
        data: assignment
      });
    } catch (error) {
      console.error('Error fetching assignment:', error);
      reply.status(500).send({ error: 'Failed to fetch assignment' });
    }
  }
  });

  // Update assignment
  fastify.put('/:id', {
    schema: {
      params: Type.Object({
        id: Type.String()
      }),
      body: UpdateAssignmentSchema,
      response: {
        200: SuccessResponseSchema,
        400: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate, requireRole(['educator', 'admin'])],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const userId = (request as any).userId;
      const userRole = (request as any).user.role;

      if (!isValidUUID(id)) {
        return reply.status(400).send({ error: 'Invalid assignment ID format' });
      }

      const assignment = await prisma.assignment.findUnique({
        where: { id }
      });

      if (!assignment) {
        return reply.status(404).send({ error: 'Assignment not found' });
      }

      // Check ownership
      const isOwner = assignment.instructorId === userId;
      const isAdmin = userRole === 'admin';

      if (!isOwner && !isAdmin) {
        return reply.status(403).send({ error: 'Only assignment owner can update assignment' });
      }

      // Update assignment
      const updatedAssignment = await prisma.assignment.update({
        where: { id },
        data: {
          title: (request.body as any).title || assignment.title,
          instructions: (request.body as any).instructions || assignment.instructions,
          requirements: (request.body as any).requirements || assignment.requirements,
          learningObjectives: (request.body as any).learningObjectives || assignment.learningObjectives,
          writingStages: (request.body as any).writingStages || assignment.writingStages,
          aiSettings: (request.body as any).aiSettings || assignment.aiSettings,
          gradingCriteria: (request.body as any).gradingCriteria || assignment.gradingCriteria,
          dueDate: (request.body as any).dueDate ? new Date((request.body as any).dueDate) : assignment.dueDate,
          status: (request.body as any).status || assignment.status
        },
        include: {
          template: {
            select: {
              id: true,
              title: true
            }
          },
          course: {
            select: {
              id: true,
              title: true
            }
          },
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      reply.send({
        message: 'Assignment updated successfully',
        data: updatedAssignment
      });
    } catch (error) {
      console.error('Error updating assignment:', error);
      reply.status(500).send({ error: 'Failed to update assignment' });
    }
  }
  });

  // Delete assignment
  fastify.delete('/:id', {
    schema: {
      params: Type.Object({
        id: Type.String()
      }),
      response: {
        200: SuccessResponseSchema,
        400: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate, requireRole(['educator', 'admin'])],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const userId = (request as any).userId;
      const userRole = (request as any).user.role;

      if (!isValidUUID(id)) {
        return reply.status(400).send({ error: 'Invalid assignment ID format' });
      }

      const assignment = await prisma.assignment.findUnique({
        where: { id }
      });

      if (!assignment) {
        return reply.status(404).send({ error: 'Assignment not found' });
      }

      // Check ownership
      const isOwner = assignment.instructorId === userId;
      const isAdmin = userRole === 'admin';

      if (!isOwner && !isAdmin) {
        return reply.status(403).send({ error: 'Only assignment owner can delete assignment' });
      }

      // Check if assignment has submissions (simplified)
      const submissionCount = await prisma.assignmentSubmission.count({
        where: { assignmentId: id }
      });

      if (submissionCount > 0) {
        return reply.status(400).send({ 
          error: 'Cannot delete assignment with existing submissions'
        });
      }

      await prisma.assignment.delete({
        where: { id }
      });

      reply.send({
        message: 'Assignment deleted successfully',
        data: { assignmentId: id }
      });
    } catch (error) {
      console.error('Error deleting assignment:', error);
      reply.status(500).send({ error: 'Failed to delete assignment' });
    }
  }
  });

  // Get assignment submissions (for educators)
  fastify.get('/:id/submissions', {
    schema: {
      params: Type.Object({
        id: Type.String()
      }),
      response: {
        200: SuccessResponseSchema,
        400: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate, requireRole(['educator', 'admin'])],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const userId = (request as any).userId;
      const userRole = (request as any).user.role;

      if (!isValidUUID(id)) {
        return reply.status(400).send({ error: 'Invalid assignment ID format' });
      }

      const assignment = await prisma.assignment.findUnique({
        where: { id }
      });

      if (!assignment) {
        return reply.status(404).send({ error: 'Assignment not found' });
      }

      // Check ownership
      const isOwner = assignment.instructorId === userId;
      const isAdmin = userRole === 'admin';

      if (!isOwner && !isAdmin) {
        return reply.status(403).send({ error: 'Only assignment owner can view submissions' });
      }

      // Simplified submission query - using existing submission model
      const submissions = await prisma.assignmentSubmission.findMany({
        where: { assignmentId: id },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      reply.send({
        message: 'Assignment submissions retrieved successfully',
        data: submissions
      });
    } catch (error) {
      console.error('Error fetching assignment submissions:', error);
      reply.status(500).send({ error: 'Failed to fetch assignment submissions' });
    }
  }
  });
}