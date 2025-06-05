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
const CreateSubmissionSchema = Type.Object({
  content: Type.String({ minLength: 1 }),
  reflection: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Object({
    wordCount: Type.Optional(Type.Number()),
    timeSpent: Type.Optional(Type.Number()),
    aiAssistanceUsed: Type.Optional(Type.Boolean()),
    aiAssistanceDescription: Type.Optional(Type.String()),
    sources: Type.Optional(Type.Array(Type.String()))
  })),
  isDraft: Type.Optional(Type.Boolean({ default: true }))
});

const SubmitForGradingSchema = Type.Object({
  finalReflection: Type.Optional(Type.String()),
  confirmSubmission: Type.Boolean({ default: true }),
  metadata: Type.Optional(Type.Object({
    submissionTime: Type.Optional(Type.String()),
    finalWordCount: Type.Optional(Type.Number()),
    collaborators: Type.Optional(Type.Array(Type.String()))
  }))
});

const AddCollaboratorSchema = Type.Object({
  collaboratorId: Type.String(),
  permissions: Type.Optional(Type.Array(Type.Union([
    Type.Literal('read'),
    Type.Literal('comment'),
    Type.Literal('edit')
  ]))),
  message: Type.Optional(Type.String())
});

const SuccessResponseSchema = Type.Object({
  message: Type.String(),
  data: Type.Any()
});

const ErrorResponseSchema = Type.Object({
  error: Type.String()
});

export default async function submissionRoutes(fastify: FastifyInstance) {
  // Get user's submissions
  fastify.get('/my-submissions', {
    schema: {
      querystring: Type.Object({
        assignmentId: Type.Optional(Type.String()),
        courseId: Type.Optional(Type.String()),
        status: Type.Optional(Type.Union([
          Type.Literal('draft'),
          Type.Literal('submitted'),
          Type.Literal('graded'),
          Type.Literal('returned')
        ])),
        page: Type.Optional(Type.Number({ minimum: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 }))
      }),
      response: {
        200: SuccessResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;
      const { assignmentId, courseId, status, page = 1, limit = 20 } = request.query as any;

      const where: any = { authorId: userId };
      if (assignmentId) where.assignmentId = assignmentId;
      if (status) where.status = status;
      
      // If courseId provided, filter by course
      if (courseId) {
        where.assignment = {
          courseId
        };
      }

      const skip = (page - 1) * limit;

      const [submissions, total] = await Promise.all([
        prisma.assignmentSubmission.findMany({
          where,
          skip,
          take: limit,
          include: {
            assignment: {
              select: {
                id: true,
                title: true,
                dueDate: true,
                gradingCriteria: true,
                course: {
                  select: {
                    id: true,
                    title: true
                  }
                }
              }
            },
            collaborators: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            },
            // Note: Grade relation removed - handled via analytics JSON field
          },
          orderBy: { updatedAt: 'desc' }
        }),
        prisma.assignmentSubmission.count({ where })
      ]);

      reply.send({
        message: 'Submissions retrieved successfully',
        data: {
          submissions,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching submissions:', error);
      reply.status(500).send({ error: 'Failed to fetch submissions' });
    }
  });

  // Get a specific submission
  fastify.get('/:id', {
    schema: {
      params: Type.Object({
        id: Type.String()
      }),
      querystring: Type.Object({
        includeCollaborators: Type.Optional(Type.Boolean()),
        includeVersions: Type.Optional(Type.Boolean()),
        includeGrade: Type.Optional(Type.Boolean())
      }),
      response: {
        200: SuccessResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const { includeCollaborators, includeVersions, includeGrade } = request.query as any;
      const userId = (request as any).userId;
      const userRole = (request as any).user.role;

      const submission = await prisma.assignmentSubmission.findUnique({
        where: { id },
        include: {
          assignment: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  instructorId: true
                }
              }
            }
          },
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          collaborators: includeCollaborators ? {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          } : false,
          // Note: Versions and Grade models removed from schema - using simplified approach
        }
      });

      if (!submission) {
        return reply.status(404).send({ error: 'Submission not found' });
      }

      // Check access permissions  
      const isStudent = submission.authorId === userId;
      const isInstructor = submission.assignment.course.instructorId === userId;
      // Note: Collaborators check simplified - using assignment-level access
      const isAdmin = userRole === 'admin';

      if (!isStudent && !isInstructor && !isAdmin) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      reply.send({
        message: 'Submission retrieved successfully',
        data: submission
      });
    } catch (error) {
      console.error('Error fetching submission:', error);
      reply.status(500).send({ error: 'Failed to fetch submission' });
    }
  });

  // Create or update submission
  fastify.post('/:assignmentId', {
    schema: {
      params: Type.Object({
        assignmentId: Type.String()
      }),
      body: CreateSubmissionSchema,
      response: {
        201: SuccessResponseSchema,
        200: SuccessResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { assignmentId } = request.params as any;
      const { content, reflection, metadata, isDraft = true } = request.body as any;
      const userId = (request as any).userId;

      // Verify assignment exists and is accessible
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: {
          course: {
            include: {
              enrollments: {
                where: { studentId: userId }
              }
            }
          }
        }
      });

      if (!assignment) {
        return reply.status(404).send({ error: 'Assignment not found' });
      }

      const isEnrolled = assignment.course.enrollments.length > 0;
      if (!isEnrolled) {
        return reply.status(403).send({ error: 'Not enrolled in this course' });
      }

      // Check if submission already exists
      const existingSubmission = await prisma.assignmentSubmission.findFirst({
        where: {
          assignmentId,
          authorId: userId
        }
      });

      let submission;
      let isNew = false;

      if (existingSubmission) {
        // Update existing submission
        submission = await prisma.assignmentSubmission.update({
          where: { id: existingSubmission.id },
          data: {
            content,
            analytics: {
              ...(existingSubmission.analytics as any),
              reflection,
              metadata
            },
            status: isDraft ? 'draft' : 'submitted',
            updatedAt: new Date()
          },
          include: {
            assignment: {
              select: {
                title: true,
                dueDate: true
              }
            }
          }
        });
      } else {
        // Create new submission
        submission = await prisma.assignmentSubmission.create({
          data: {
            assignmentId,
            authorId: userId,
            content,
            analytics: {
              reflection,
              metadata
            },
            status: isDraft ? 'draft' : 'submitted'
          },
          include: {
            assignment: {
              select: {
                title: true,
                dueDate: true
              }
            }
          }
        });
        isNew = true;
      }

      // Note: Version tracking functionality simplified for migration
      // TODO: Add SubmissionVersion model to schema if version tracking is needed

      reply.status(isNew ? 201 : 200).send({
        message: isNew ? 'Submission created successfully' : 'Submission updated successfully',
        data: submission
      });
    } catch (error) {
      console.error('Error creating/updating submission:', error);
      reply.status(500).send({ error: 'Failed to create/update submission' });
    }
  });

  // Submit for grading
  fastify.patch('/:id/submit', {
    schema: {
      params: Type.Object({
        id: Type.String()
      }),
      body: SubmitForGradingSchema,
      response: {
        200: SuccessResponseSchema,
        400: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const { finalReflection, confirmSubmission, metadata } = request.body as any;
      const userId = (request as any).userId;

      if (!confirmSubmission) {
        return reply.status(400).send({ error: 'Submission confirmation required' });
      }

      // Get submission and verify ownership
      const submission = await prisma.assignmentSubmission.findUnique({
        where: { id },
        include: {
          assignment: {
            select: {
              id: true,
              title: true,
              dueDate: true,
              course: {
                select: {
                  title: true
                }
              }
            }
          }
        }
      });

      if (!submission) {
        return reply.status(404).send({ error: 'Submission not found' });
      }

      if (submission.authorId !== userId) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      if (submission.status === 'submitted') {
        return reply.status(400).send({ error: 'Submission already submitted' });
      }

      // Check if past due date (optional warning)
      const isLate = submission.assignment.dueDate && new Date() > submission.assignment.dueDate;

      // Update submission status
      const updatedSubmission = await prisma.assignmentSubmission.update({
        where: { id },
        data: {
          status: 'submitted',
          submittedAt: new Date(),
          analytics: {
            ...(submission.analytics as any),
            reflection: finalReflection,
            submissionMetadata: {
              ...metadata,
              submittedLate: isLate
            }
          }
        }
      });

      reply.send({
        message: 'Submission submitted for grading successfully',
        data: {
          submission: updatedSubmission,
          warnings: isLate ? ['Submission was submitted after the due date'] : []
        }
      });
    } catch (error) {
      console.error('Error submitting for grading:', error);
      reply.status(500).send({ error: 'Failed to submit for grading' });
    }
  });

  // Add collaborator
  fastify.post('/:id/collaborators', {
    schema: {
      params: Type.Object({
        id: Type.String()
      }),
      body: AddCollaboratorSchema,
      response: {
        201: SuccessResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        409: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const { collaboratorId, permissions = ['read', 'comment'], message } = request.body as any;
      const userId = (request as any).userId;

      // Verify submission exists and user is owner
      const submission = await prisma.assignmentSubmission.findUnique({
        where: { id },
        include: {
          assignment: {
            select: {
              title: true,
              course: {
                include: {
                  enrollments: {
                    where: { studentId: collaboratorId }
                  }
                }
              }
            }
          },
          collaborators: {
            where: { userId: collaboratorId }
          }
        }
      });

      if (!submission) {
        return reply.status(404).send({ error: 'Submission not found' });
      }

      if (submission.authorId !== userId) {
        return reply.status(403).send({ error: 'Only submission owner can add collaborators' });
      }

      // Check if collaborator is enrolled in the course
      const isEnrolled = submission.assignment.course.enrollments.length > 0;
      if (!isEnrolled) {
        return reply.status(403).send({ error: 'Collaborator must be enrolled in the course' });
      }

      // Check if already a collaborator
      if (submission.collaborators.length > 0) {
        return reply.status(409).send({ error: 'User is already a collaborator' });
      }

      // Add collaborator
      const collaborator = await prisma.submissionCollaborator.create({
        data: {
          submissionId: id,
          userId: collaboratorId,
          role: permissions.includes('edit') ? 'editor' : 'collaborator'
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      reply.status(201).send({
        message: 'Collaborator added successfully',
        data: collaborator
      });
    } catch (error) {
      console.error('Error adding collaborator:', error);
      reply.status(500).send({ error: 'Failed to add collaborator' });
    }
  });

  // Get submission analytics (educators only)
  fastify.get('/:id/analytics', {
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
    preHandler: [authenticate, requireRole(['educator', 'admin'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const userId = (request as any).userId;

      // Get submission with detailed info
      const submission = await prisma.assignmentSubmission.findUnique({
        where: { id },
        include: {
          assignment: {
            include: {
              course: {
                select: {
                  instructorId: true
                }
              }
            }
          },
          author: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
          // Note: Versions and Collaborators models removed from schema
        }
      });

      if (!submission) {
        return reply.status(404).send({ error: 'Submission not found' });
      }

      // Verify instructor access
      if (submission.assignment.course.instructorId !== userId) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      // Calculate analytics
      const content = submission.content || '';
      const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
      const characterCount = content.length;
      
      // Simplified analytics without removed models
      const analytics = {
        submission: {
          id: submission.id,
          status: submission.status,
          submittedAt: submission.submittedAt,
          author: submission.author
        },
        content: {
          wordCount,
          characterCount,
          hasReflection: !!(submission.analytics as any)?.reflection
        },
        metadata: (submission.analytics as any)?.metadata || {},
        analytics: submission.analytics || {}
      };

      reply.send({
        message: 'Submission analytics retrieved successfully',
        data: analytics
      });
    } catch (error) {
      console.error('Error fetching submission analytics:', error);
      reply.status(500).send({ error: 'Failed to fetch submission analytics' });
    }
  });

  // Delete submission
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
    preHandler: [authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const userId = (request as any).userId;

      // Verify submission exists and user is owner
      const submission = await prisma.assignmentSubmission.findUnique({
        where: { id },
        select: {
          authorId: true,
          status: true,
          assignment: {
            select: {
              title: true
            }
          }
        }
      });

      if (!submission) {
        return reply.status(404).send({ error: 'Submission not found' });
      }

      if (submission.authorId !== userId) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      if (submission.status === 'submitted' || submission.status === 'graded') {
        return reply.status(403).send({ error: 'Cannot delete submitted or graded submissions' });
      }

      // Delete submission and related data
      await prisma.$transaction([
        // Note: SubmissionVersion deletion removed due to missing model
        prisma.submissionCollaborator.deleteMany({ where: { submissionId: id } }),
        prisma.assignmentSubmission.delete({ where: { id } })
      ]);

      reply.send({
        message: 'Submission deleted successfully',
        data: { submissionId: id }
      });
    } catch (error) {
      console.error('Error deleting submission:', error);
      reply.status(500).send({ error: 'Failed to delete submission' });
    }
  });
}