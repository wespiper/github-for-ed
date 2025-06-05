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

// Helper function to calculate text differences
const calculateDiff = (oldText: string, newText: string) => {
  const oldWords = oldText.trim().split(/\s+/).filter(word => word.length > 0);
  const newWords = newText.trim().split(/\s+/).filter(word => word.length > 0);
  
  const addedWords = Math.max(0, newWords.length - oldWords.length);
  const deletedWords = Math.max(0, oldWords.length - newWords.length);
  const addedChars = Math.max(0, newText.length - oldText.length);
  const deletedChars = Math.max(0, oldText.length - newText.length);
  
  return { addedWords, deletedWords, addedChars, deletedChars };
};

// Helper to get word count from version metadata
const getWordCountFromVersion = (version: any): number => {
  if (typeof version.metadata === 'object' && version.metadata && 'wordCount' in version.metadata) {
    return (version.metadata as any).wordCount;
  }
  if (version.content) {
    return version.content.trim().split(/\s+/).filter((word: string) => word.length > 0).length;
  }
  return 0;
};

// TypeBox Schemas
const CreateDocumentSchema = Type.Object({
  title: Type.String({ minLength: 1, maxLength: 255 }),
  courseId: Type.Optional(Type.String()),
  submissionId: Type.Optional(Type.String()),
  type: Type.Optional(Type.Union([
    Type.Literal('draft'),
    Type.Literal('submission'),
    Type.Literal('reflection'),
    Type.Literal('assignment')
  ])),
  settings: Type.Optional(Type.Object({
    allowVersioning: Type.Optional(Type.Boolean()),
    trackChanges: Type.Optional(Type.Boolean()),
    collaborativeEditing: Type.Optional(Type.Boolean())
  }))
});

const UpdateContentSchema = Type.Object({
  content: Type.String(),
  reflection: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Object({
    wordCount: Type.Optional(Type.Number()),
    characterCount: Type.Optional(Type.Number()),
    editingTime: Type.Optional(Type.Number()),
    aiAssistanceUsed: Type.Optional(Type.Boolean())
  })),
  createVersion: Type.Optional(Type.Boolean({ default: true }))
});

const StartSessionSchema = Type.Object({
  sessionType: Type.Optional(Type.Union([
    Type.Literal('writing'),
    Type.Literal('editing'),
    Type.Literal('review')
  ])),
  metadata: Type.Optional(Type.Object({
    environment: Type.Optional(Type.String()),
    device: Type.Optional(Type.String())
  }))
});

const EndSessionSchema = Type.Object({
  finalContent: Type.Optional(Type.String()),
  reflection: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Object({
    totalWords: Type.Optional(Type.Number()),
    totalTime: Type.Optional(Type.Number()),
    keystrokeCount: Type.Optional(Type.Number())
  }))
});

const SuccessResponseSchema = Type.Object({
  message: Type.String(),
  data: Type.Any()
});

const ErrorResponseSchema = Type.Object({
  error: Type.String()
});

export default async function documentRoutes(fastify: FastifyInstance) {
  // Create a new document
  fastify.post('/', {
    schema: {
      body: CreateDocumentSchema,
      response: {
        201: SuccessResponseSchema,
        400: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { title, courseId, submissionId, type = 'draft', settings } = request.body as any;
      const userId = (request as any).userId;

      // If courseId provided, verify course access
      if (courseId) {
        const course = await prisma.course.findUnique({
          where: { id: courseId },
          include: {
            enrollments: {
              where: { studentId: userId }
            }
          }
        });
        
        if (!course) {
          return reply.status(404).send({ error: 'Course not found' });
        }

        const userRole = (request as any).user.role;
        const isInstructor = course.instructorId === userId;
        const isEnrolled = course.enrollments.length > 0;
        
        if (!isInstructor && !isEnrolled && userRole !== 'admin') {
          return reply.status(403).send({ error: 'Access denied to this course' });
        }
      }

      // Create document
      const document = await prisma.document.create({
        data: {
          title,
          authorId: userId,
          courseId: courseId || null,
          submissionId: submissionId || null,
          type,
          settings: settings || {},
          content: '',
          status: 'draft'
        },
        include: {
          author: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          course: courseId ? {
            select: {
              title: true
            }
          } : false
        }
      });

      // Create initial version
      await prisma.documentVersion.create({
        data: {
          documentId: document.id,
          content: '',
          version: 1,
          metadata: {
            wordCount: 0,
            characterCount: 0
          }
        }
      });

      reply.status(201).send({
        message: 'Document created successfully',
        data: document
      });
    } catch (error) {
      console.error('Error creating document:', error);
      const message = error instanceof Error ? error.message : 'Failed to create document';
      reply.status(500).send({ error: message });
    }
    }
  });

  // Get user's documents
  fastify.get('/my-documents', {
    schema: {
      querystring: Type.Object({
        courseId: Type.Optional(Type.String()),
        type: Type.Optional(Type.String()),
        status: Type.Optional(Type.String()),
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
      const { courseId, type, status, page = 1, limit = 20 } = request.query as any;

      const where: any = { authorId: userId };
      if (courseId) where.courseId = courseId;
      if (type) where.type = type;
      if (status) where.status = status;

      const skip = (page - 1) * limit;

      const [documents, total] = await Promise.all([
        prisma.document.findMany({
          where,
          skip,
          take: limit,
          include: {
            course: {
              select: {
                id: true,
                title: true
              }
            },
            _count: {
              select: {
                versions: true,
                writingSessions: true
              }
            }
          },
          orderBy: { updatedAt: 'desc' }
        }),
        prisma.document.count({ where })
      ]);

      reply.send({
        message: 'Documents retrieved successfully',
        data: {
          documents,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching documents:', error);
      reply.status(500).send({ error: 'Failed to fetch documents' });
    }
    }
  });

  // Get a specific document
  fastify.get('/:documentId', {
    schema: {
      params: Type.Object({
        documentId: Type.String()
      }),
      querystring: Type.Object({
        includeVersions: Type.Optional(Type.Boolean()),
        includeSessions: Type.Optional(Type.Boolean())
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
      const { documentId } = request.params as any;
      const { includeVersions, includeSessions } = request.query as any;
      const userId = (request as any).userId;
      const userRole = (request as any).user.role;

      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          course: {
            select: {
              id: true,
              title: true,
              instructorId: true,
              enrollments: {
                where: { studentId: userId },
                select: { id: true }
              }
            }
          },
          versions: includeVersions ? {
            orderBy: { createdAt: 'desc' },
            take: 10
          } : false,
          writingSessions: includeSessions ? {
            orderBy: { startTime: 'desc' },
            take: 5
          } : false
        }
      });

      if (!document) {
        return reply.status(404).send({ error: 'Document not found' });
      }

      // Check access permissions
      const isAuthor = document.authorId === userId;
      const isInstructor = document.course?.instructorId === userId;
      const isEnrolled = document.course?.enrollments?.length > 0;
      const isAdmin = userRole === 'admin';

      if (!isAuthor && !isInstructor && !isEnrolled && !isAdmin) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      reply.send({
        message: 'Document retrieved successfully',
        data: document
      });
    } catch (error) {
      console.error('Error fetching document:', error);
      reply.status(500).send({ error: 'Failed to fetch document' });
    }
    }
  });

  // Update document content
  fastify.put('/:documentId/content', {
    schema: {
      params: Type.Object({
        documentId: Type.String()
      }),
      body: UpdateContentSchema,
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
      const { documentId } = request.params as any;
      const { content, reflection, metadata, createVersion = true } = request.body as any;
      const userId = (request as any).userId;

      // Get document and verify access
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          course: {
            select: {
              instructorId: true,
              enrollments: {
                where: { studentId: userId },
                select: { id: true }
              }
            }
          }
        }
      });

      if (!document) {
        return reply.status(404).send({ error: 'Document not found' });
      }

      // Check permissions
      const isAuthor = document.authorId === userId;
      const isInstructor = document.course?.instructorId === userId;
      const isEnrolled = document.course?.enrollments?.length > 0;

      if (!isAuthor && !isInstructor && !isEnrolled) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      // Get previous content for diff calculation
      const previousContent = document.content || '';
      const diff = calculateDiff(previousContent, content);

      // Update document
      const updatedDocument = await prisma.document.update({
        where: { id: documentId },
        data: {
          content,
          updatedAt: new Date()
        }
      });

      // Create new version if requested
      if (createVersion && previousContent !== content) {
        const lastVersion = await prisma.documentVersion.findFirst({
          where: { documentId },
          orderBy: { version: 'desc' }
        });

        const version = (lastVersion?.version || 0) + 1;
        
        await prisma.documentVersion.create({
          data: {
            documentId,
            content,
            version,
            metadata: {
              ...metadata,
              wordCount: content.trim().split(/\s+/).filter(word => word.length > 0).length,
              characterCount: content.length,
              diff
            }
          }
        });
      }

      reply.send({
        message: 'Document content updated successfully',
        data: {
          document: updatedDocument,
          diff,
          versionCreated: createVersion
        }
      });
    } catch (error) {
      console.error('Error updating document content:', error);
      reply.status(500).send({ error: 'Failed to update document content' });
    }
    }
  });

  // Get document versions
  fastify.get('/:documentId/versions', {
    schema: {
      params: Type.Object({
        documentId: Type.String()
      }),
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 50 }))
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
      const { documentId } = request.params as any;
      const { page = 1, limit = 20 } = request.query as any;
      const userId = (request as any).userId;

      // Verify document access
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        select: {
          authorId: true,
          course: {
            select: {
              instructorId: true,
              enrollments: {
                where: { studentId: userId },
                select: { id: true }
              }
            }
          }
        }
      });

      if (!document) {
        return reply.status(404).send({ error: 'Document not found' });
      }

      const isAuthor = document.authorId === userId;
      const isInstructor = document.course?.instructorId === userId;
      const isEnrolled = document.course?.enrollments?.length > 0;

      if (!isAuthor && !isInstructor && !isEnrolled) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      const skip = (page - 1) * limit;

      const [versions, total] = await Promise.all([
        prisma.documentVersion.findMany({
          where: { documentId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.documentVersion.count({ where: { documentId } })
      ]);

      reply.send({
        message: 'Document versions retrieved successfully',
        data: {
          versions,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching document versions:', error);
      reply.status(500).send({ error: 'Failed to fetch document versions' });
    }
    }
  });

  // Compare document versions
  fastify.get('/:documentId/versions/compare', {
    schema: {
      params: Type.Object({
        documentId: Type.String()
      }),
      querystring: Type.Object({
        from: Type.Number({ minimum: 1 }),
        to: Type.Number({ minimum: 1 })
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
      const { documentId } = request.params as any;
      const { from, to } = request.query as any;
      const userId = (request as any).userId;

      if (from === to) {
        return reply.status(400).send({ error: 'Cannot compare version to itself' });
      }

      // Verify access (simplified)
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        select: { authorId: true }
      });

      if (!document || document.authorId !== userId) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      const [fromVersion, toVersion] = await Promise.all([
        prisma.documentVersion.findFirst({
          where: { documentId, version: from }
        }),
        prisma.documentVersion.findFirst({
          where: { documentId, version: to }
        })
      ]);

      if (!fromVersion || !toVersion) {
        return reply.status(404).send({ error: 'One or both versions not found' });
      }

      const diff = calculateDiff(fromVersion.content, toVersion.content);

      reply.send({
        message: 'Version comparison completed',
        data: {
          fromVersion,
          toVersion,
          comparison: diff
        }
      });
    } catch (error) {
      console.error('Error comparing versions:', error);
      reply.status(500).send({ error: 'Failed to compare versions' });
    }
    }
  });

  // Restore document version
  fastify.post('/:documentId/versions/:versionId/restore', {
    schema: {
      params: Type.Object({
        documentId: Type.String(),
        versionId: Type.String()
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
      const { documentId, versionId } = request.params as any;
      const userId = (request as any).userId;

      // Verify document ownership
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        select: { authorId: true, content: true }
      });

      if (!document || document.authorId !== userId) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      // Get version to restore
      const version = await prisma.documentVersion.findUnique({
        where: { id: versionId }
      });

      if (!version || version.documentId !== documentId) {
        return reply.status(404).send({ error: 'Version not found' });
      }

      // Update document content
      const updatedDocument = await prisma.document.update({
        where: { id: documentId },
        data: {
          content: version.content,
          updatedAt: new Date()
        }
      });

      reply.send({
        message: 'Document restored successfully',
        data: {
          document: updatedDocument,
          restoredFromVersion: version.version
        }
      });
    } catch (error) {
      console.error('Error restoring document version:', error);
      reply.status(500).send({ error: 'Failed to restore document version' });
    }
    }
  });

  // Start writing session
  fastify.post('/:documentId/sessions', {
    schema: {
      params: Type.Object({
        documentId: Type.String()
      }),
      body: StartSessionSchema,
      response: {
        201: SuccessResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { documentId } = request.params as any;
      const { sessionType = 'writing', metadata = {} } = request.body as any;
      const userId = (request as any).userId;

      // Verify document access
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        select: { authorId: true }
      });

      if (!document || document.authorId !== userId) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      // Create writing session
      const session = await prisma.writingSession.create({
        data: {
          documentId,
          userId,
          startTime: new Date(),
          activity: {
            sessionType,
            ...metadata
          }
        }
      });

      reply.status(201).send({
        message: 'Writing session started successfully',
        data: session
      });
    } catch (error) {
      console.error('Error starting writing session:', error);
      reply.status(500).send({ error: 'Failed to start writing session' });
    }
    }
  });

  // End writing session
  fastify.put('/:documentId/sessions/:sessionId/end', {
    schema: {
      params: Type.Object({
        documentId: Type.String(),
        sessionId: Type.String()
      }),
      body: EndSessionSchema,
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
      const { documentId, sessionId } = request.params as any;
      const { finalContent, reflection, metadata = {} } = request.body as any;
      const userId = (request as any).userId;

      // Verify session ownership
      const session = await prisma.writingSession.findUnique({
        where: { id: sessionId },
        include: {
          document: {
            select: { authorId: true }
          }
        }
      });

      if (!session || session.userId !== userId || session.documentId !== documentId) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      // Update session
      const endTime = new Date();
      const duration = endTime.getTime() - session.startTime.getTime();

      const updatedSession = await prisma.writingSession.update({
        where: { id: sessionId },
        data: {
          endTime,
          duration,
          activity: {
            ...(session.activity as any),
            finalContent,
            reflection,
            ...metadata
          }
        }
      });

      reply.send({
        message: 'Writing session ended successfully',
        data: updatedSession
      });
    } catch (error) {
      console.error('Error ending writing session:', error);
      reply.status(500).send({ error: 'Failed to end writing session' });
    }
    }
  });

  // Get document statistics
  fastify.get('/:documentId/stats', {
    schema: {
      params: Type.Object({
        documentId: Type.String()
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
      const { documentId } = request.params as any;
      const userId = (request as any).userId;

      // Verify document access
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        select: { 
          authorId: true, 
          content: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!document || document.authorId !== userId) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      // Calculate statistics
      const content = document.content || '';
      const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
      const characterCount = content.length;
      const characterCountNoSpaces = content.replace(/\s/g, '').length;

      // Get version and session counts
      const [versionCount, sessionCount, sessions] = await Promise.all([
        prisma.documentVersion.count({ where: { documentId } }),
        prisma.writingSession.count({ where: { documentId } }),
        prisma.writingSession.findMany({
          where: { documentId, endTime: { not: null } },
          select: { duration: true }
        })
      ]);

      const totalWritingTime = sessions.reduce((total, session) => total + (session.duration || 0), 0);

      const stats = {
        content: {
          wordCount,
          characterCount,
          characterCountNoSpaces
        },
        versions: {
          total: versionCount
        },
        sessions: {
          total: sessionCount,
          totalWritingTime
        },
        timeline: {
          created: document.createdAt,
          lastModified: document.updatedAt
        }
      };

      reply.send({
        message: 'Document statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      console.error('Error fetching document statistics:', error);
      reply.status(500).send({ error: 'Failed to fetch document statistics' });
    }
    }
  });
}