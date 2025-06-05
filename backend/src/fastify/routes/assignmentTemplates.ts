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
const CreateTemplateSchema = Type.Object({
  title: Type.String({ minLength: 1, maxLength: 255 }),
  description: Type.Optional(Type.String()),
  instructions: Type.String({ minLength: 1 }),
  requirements: Type.Optional(Type.Any()),
  learningObjectives: Type.Optional(Type.Any()),
  writingStages: Type.Optional(Type.Any()),
  aiSettings: Type.Optional(Type.Any()),
  grading: Type.Optional(Type.Any()),
  tags: Type.Optional(Type.Array(Type.String())),
  isPublic: Type.Optional(Type.Boolean())
});

const UpdateTemplateSchema = Type.Object({
  title: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
  description: Type.Optional(Type.String()),
  instructions: Type.Optional(Type.String({ minLength: 1 })),
  requirements: Type.Optional(Type.Any()),
  learningObjectives: Type.Optional(Type.Any()),
  writingStages: Type.Optional(Type.Any()),
  aiSettings: Type.Optional(Type.Any()),
  grading: Type.Optional(Type.Any()),
  tags: Type.Optional(Type.Array(Type.String())),
  isPublic: Type.Optional(Type.Boolean())
});

const SuccessResponseSchema = Type.Object({
  message: Type.String(),
  data: Type.Any()
});

const ErrorResponseSchema = Type.Object({
  error: Type.String()
});

export default async function assignmentTemplateRoutes(fastify: FastifyInstance) {
  // Get all templates for an instructor
  fastify.get('/my-templates', {
    schema: {
      querystring: Type.Object({
        status: Type.Optional(Type.String()),
        tags: Type.Optional(Type.Union([Type.String(), Type.Array(Type.String())])),
        search: Type.Optional(Type.String())
      }),
      response: {
        200: SuccessResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate, requireRole(['educator', 'admin'])],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;
      const { status, tags, search } = request.query as any;
      
      // Build where clause for Prisma
      const whereClause: any = {
        instructorId: userId
      };
      
      if (status && typeof status === 'string') {
        // Note: status field doesn't exist in current schema, but keeping for API compatibility
        whereClause.isPublic = status === 'published';
      }
      
      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        whereClause.tags = {
          hasSome: tagArray
        };
      }
      
      // Handle search
      if (search && typeof search === 'string') {
        whereClause.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { instructions: { contains: search, mode: 'insensitive' } }
        ];
      }
      
      const templates = await prisma.assignmentTemplate.findMany({
        where: whereClause,
        include: {
          instructor: {
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
        message: 'Instructor templates retrieved successfully',
        data: templates
      });
    } catch (error) {
      console.error('Error fetching instructor templates:', error);
      reply.status(500).send({ error: 'Failed to fetch templates' });
    }
  }
  });

  // Get public template library
  fastify.get('/library', {
    schema: {
      querystring: Type.Object({
        category: Type.Optional(Type.String()),
        bloomsLevel: Type.Optional(Type.String()),
        tags: Type.Optional(Type.Union([Type.String(), Type.Array(Type.String())])),
        search: Type.Optional(Type.String())
      }),
      response: {
        200: SuccessResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { category, bloomsLevel, tags, search } = request.query as any;
      
      // Build where clause for public templates
      const whereClause: any = {
        isPublic: true
      };
      
      // Handle learning objectives filtering (JSONB queries)
      if (category || bloomsLevel) {
        const learningObjectivesFilter: any = {};
        if (category) {
          learningObjectivesFilter.path = ['category'];
          learningObjectivesFilter.equals = category;
        }
        if (bloomsLevel) {
          learningObjectivesFilter.path = ['bloomsLevel'];
          learningObjectivesFilter.equals = parseInt(bloomsLevel);
        }
        whereClause.learningObjectives = learningObjectivesFilter;
      }
      
      // Handle tags filter
      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        whereClause.tags = {
          hasSome: tagArray
        };
      }
      
      // Handle search
      if (search && typeof search === 'string') {
        whereClause.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { instructions: { contains: search, mode: 'insensitive' } }
        ];
      }
      
      const templates = await prisma.assignmentTemplate.findMany({
        where: whereClause,
        include: {
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: [
          { usageCount: 'desc' },
          { updatedAt: 'desc' }
        ]
      });
      
      reply.send({
        message: 'Template library retrieved successfully',
        data: templates
      });
    } catch (error) {
      console.error('Error fetching template library:', error);
      reply.status(500).send({ error: 'Failed to fetch template library' });
    }
  }
  });

  // Get template by ID
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
        return reply.status(400).send({ error: 'Invalid template ID format' });
      }
      
      const template = await prisma.assignmentTemplate.findUnique({
        where: { id },
        include: {
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
      
      if (!template) {
        return reply.status(404).send({ error: 'Template not found' });
      }
      
      // Check access permissions
      const isOwner = template.instructorId === userId;
      const isPublic = template.isPublic;
      const isAdmin = userRole === 'admin';
      
      // Allow access to own templates regardless of status (for editing/deployment)
      const hasAccess = isOwner || isPublic || isAdmin;
      
      if (!hasAccess) {
        return reply.status(403).send({ 
          error: 'Access denied to this template'
        });
      }
      
      reply.send({
        message: 'Template retrieved successfully',
        data: template
      });
    } catch (error) {
      console.error('Error fetching template:', error);
      reply.status(500).send({ error: 'Failed to fetch template' });
    }
  }
  });

  // Create new template
  fastify.post('/', {
    schema: {
      body: CreateTemplateSchema,
      response: {
        201: SuccessResponseSchema,
        400: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate, requireRole(['educator', 'admin'])],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const {
        title,
        description,
        instructions,
        requirements,
        learningObjectives,
        writingStages,
        aiSettings,
        grading,
        tags,
        isPublic = false
      } = request.body as any;

      const userId = (request as any).userId;

      // Create template using Prisma
      const template = await prisma.assignmentTemplate.create({
        data: {
          title,
          description: description || null,
          instructions,
          instructorId: userId,
          requirements: requirements || {},
          writingStages: writingStages || [],
          learningObjectives: learningObjectives || [],
          aiSettings: {
            enabled: false,
            globalBoundary: 'moderate',
            allowedAssistanceTypes: [],
            requireReflection: true,
            reflectionPrompts: [],
            stageSpecificSettings: [],
            ...aiSettings
          },
          gradingCriteria: grading ? {
            enabled: false,
            allowPeerReview: false,
            ...grading
          } : null,
          tags: tags || [],
          isPublic: isPublic || false
        },
        include: {
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
      
      reply.status(201).send({
        message: 'Template created successfully',
        data: template
      });
    } catch (error) {
      console.error('Error creating template:', error);
      reply.status(500).send({ error: 'Failed to create template' });
    }
  }
  });

  // Update template
  fastify.put('/:id', {
    schema: {
      params: Type.Object({
        id: Type.String()
      }),
      body: UpdateTemplateSchema,
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
        return reply.status(400).send({ error: 'Invalid template ID format' });
      }
      
      const template = await prisma.assignmentTemplate.findUnique({
        where: { id }
      });
      
      if (!template) {
        return reply.status(404).send({ error: 'Template not found' });
      }
      
      // Check ownership
      const isOwner = template.instructorId === userId;
      const isAdmin = userRole === 'admin';
      
      if (!isOwner && !isAdmin) {
        return reply.status(403).send({ error: 'Only template owner can update template' });
      }
      
      // Update template
      const updatedTemplate = await prisma.assignmentTemplate.update({
        where: { id },
        data: {
          title: (request.body as any).title || template.title,
          description: (request.body as any).description !== undefined ? (request.body as any).description : template.description,
          instructions: (request.body as any).instructions || template.instructions,
          requirements: (request.body as any).requirements || template.requirements,
          writingStages: (request.body as any).writingStages || template.writingStages,
          learningObjectives: (request.body as any).learningObjectives || template.learningObjectives,
          aiSettings: (request.body as any).aiSettings || template.aiSettings,
          gradingCriteria: (request.body as any).grading || template.gradingCriteria,
          tags: (request.body as any).tags || template.tags,
          isPublic: (request.body as any).isPublic !== undefined ? (request.body as any).isPublic : template.isPublic
        },
        include: {
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
        message: 'Template updated successfully',
        data: updatedTemplate
      });
    } catch (error) {
      console.error('Error updating template:', error);
      reply.status(500).send({ error: 'Failed to update template' });
    }
  }
  });

  // Publish template
  fastify.patch('/:id/publish', {
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
        return reply.status(400).send({ error: 'Invalid template ID format' });
      }
      
      const template = await prisma.assignmentTemplate.findUnique({
        where: { id }
      });
      
      if (!template) {
        return reply.status(404).send({ error: 'Template not found' });
      }
      
      // Check ownership
      const isOwner = template.instructorId === userId;
      const isAdmin = userRole === 'admin';
      
      if (!isOwner && !isAdmin) {
        return reply.status(403).send({ error: 'Only template owner can publish template' });
      }
      
      const updatedTemplate = await prisma.assignmentTemplate.update({
        where: { id },
        data: { isPublic: true },
        include: {
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
        message: 'Template published successfully',
        data: updatedTemplate
      });
    } catch (error) {
      console.error('Error publishing template:', error);
      reply.status(500).send({ error: 'Failed to publish template' });
    }
  }
  });

  // Clone template
  fastify.post('/:id/clone', {
    schema: {
      params: Type.Object({
        id: Type.String()
      }),
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
      const { id } = request.params as any;
      const userId = (request as any).userId;
      
      if (!isValidUUID(id)) {
        return reply.status(400).send({ error: 'Invalid template ID format' });
      }
      
      const originalTemplate = await prisma.assignmentTemplate.findUnique({
        where: { id }
      });
      
      if (!originalTemplate) {
        return reply.status(404).send({ error: 'Template not found' });
      }
      
      // Check if template is accessible (public or owned by user)
      const isOwner = originalTemplate.instructorId === userId;
      const isPublic = originalTemplate.isPublic;
      
      if (!isOwner && !isPublic) {
        return reply.status(403).send({ error: 'Cannot clone private template' });
      }
      
      // Create cloned template
      const clonedTemplate = await prisma.assignmentTemplate.create({
        data: {
          title: `${originalTemplate.title} (Copy)`,
          description: originalTemplate.description,
          instructions: originalTemplate.instructions,
          instructorId: userId,
          requirements: originalTemplate.requirements as any,
          writingStages: originalTemplate.writingStages as any,
          learningObjectives: originalTemplate.learningObjectives as any,
          aiSettings: originalTemplate.aiSettings as any,
          gradingCriteria: originalTemplate.gradingCriteria as any,
          tags: originalTemplate.tags,
          isPublic: false // Clones are private by default
        },
        include: {
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
      
      // Increment usage count of original template
      await prisma.assignmentTemplate.update({
        where: { id },
        data: {
          usageCount: {
            increment: 1
          }
        }
      });
      
      reply.status(201).send({
        message: 'Template cloned successfully',
        data: clonedTemplate
      });
    } catch (error) {
      console.error('Error cloning template:', error);
      reply.status(500).send({ error: 'Failed to clone template' });
    }
  }
  });

  // Delete template
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
        return reply.status(400).send({ error: 'Invalid template ID format' });
      }
      
      const template = await prisma.assignmentTemplate.findUnique({
        where: { id }
      });
      
      if (!template) {
        return reply.status(404).send({ error: 'Template not found' });
      }
      
      // Check ownership
      const isOwner = template.instructorId === userId;
      const isAdmin = userRole === 'admin';
      
      if (!isOwner && !isAdmin) {
        return reply.status(403).send({ error: 'Only template owner can delete template' });
      }
      
      await prisma.assignmentTemplate.delete({
        where: { id }
      });
      
      reply.send({
        message: 'Template deleted successfully',
        data: { templateId: id }
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      reply.status(500).send({ error: 'Failed to delete template' });
    }
  }
  });
}