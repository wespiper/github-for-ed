import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import { verifyToken, extractTokenFromHeader } from '../../utils/jwt';
import { CourseService } from '../../services/CourseService';
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

// TypeBox Schemas for Course Routes
const CreateCourseSchema = Type.Object({
  title: Type.String({ minLength: 1, maxLength: 255 }),
  description: Type.String({ minLength: 1 }),
  maxStudents: Type.Optional(Type.Number({ minimum: 1, maximum: 1000 })),
  tags: Type.Optional(Type.Array(Type.String())),
  settings: Type.Optional(Type.Object({
    allowSelfEnrollment: Type.Optional(Type.Boolean()),
    requireApproval: Type.Optional(Type.Boolean()),
    isPublic: Type.Optional(Type.Boolean())
  }))
});

const UpdateCourseSchema = Type.Partial(CreateCourseSchema);

const EnrollRequestSchema = Type.Object({
  enrollmentCode: Type.String({ minLength: 1 })
});

type CreateCourseType = Static<typeof CreateCourseSchema>;
type UpdateCourseType = Static<typeof UpdateCourseSchema>;
type EnrollRequestType = Static<typeof EnrollRequestSchema>;

// Standard API response schemas
const SuccessResponseSchema = Type.Object({
  message: Type.String(),
  data: Type.Any()
});

const ErrorResponseSchema = Type.Object({
  error: Type.String()
});

export default async function courseRoutes(fastify: FastifyInstance) {
  // Get courses based on user role
  fastify.get('/', {
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
      const userRole = (request as any).user.role;
      
      let courses: any[];
      
      if (userRole === 'educator') {
        courses = await CourseService.getInstructorCourses(userId);
      } else if (userRole === 'student') {
        courses = await CourseService.getStudentCourses(userId);
      } else if (userRole === 'admin') {
        // Admins see all courses
        courses = await prisma.course.findMany({
          include: {
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            _count: {
              select: {
                enrollments: true,
                assignments: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      } else {
        courses = [];
      }

      reply.send({
        message: 'Courses retrieved successfully',
        data: courses
      });
    } catch (error) {
      console.error('Error fetching courses:', error);
      reply.status(500).send({ error: 'Failed to fetch courses' });
    }
    }
  });

  // Get current user's courses
  fastify.get('/my-courses', {
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
        const userRole = (request as any).user.role;

        let courses: any[];
        
        if (userRole === 'educator') {
          courses = await prisma.course.findMany({
            where: { instructorId: userId },
            include: {
              _count: {
                select: {
                  enrollments: true,
                  assignments: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          });
        } else if (userRole === 'student') {
          courses = await prisma.course.findMany({
            where: {
              enrollments: {
                some: { studentId: userId }
              }
            },
            include: {
              instructor: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            _count: {
              select: {
                assignments: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      } else {
        courses = [];
      }

      reply.send({
        message: 'My courses retrieved successfully',
        data: courses
      });
    } catch (error) {
      console.error('Error fetching user courses:', error);
      reply.status(500).send({ error: 'Failed to fetch courses' });
    }
    }
  });

  // Get enrolled courses (students only)
  fastify.get('/enrolled', {
    schema: {
      response: {
        200: SuccessResponseSchema,
        403: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate, requireRole(['student'])],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;

      const enrolledCourses = await CourseService.getStudentCourses(userId);

      reply.send({
        message: 'Enrolled courses retrieved successfully',
        data: enrolledCourses
      });
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      reply.status(500).send({ error: 'Failed to fetch enrolled courses' });
    }
    }
  });

  // Create a new course (educators only)
  fastify.post('/', {
    schema: {
      body: CreateCourseSchema,
      response: {
        201: SuccessResponseSchema,
        400: ErrorResponseSchema,
        403: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate, requireRole(['educator'])],
    handler: async (request: FastifyRequest<{ Body: CreateCourseType }>, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;
      const courseData = request.body;

      const course = await CourseService.createCourse({
        ...courseData,
        instructorId: userId
      });

      reply.status(201).send({
        message: 'Course created successfully',
        data: course
      });
    } catch (error) {
      console.error('Error creating course:', error);
      const message = error instanceof Error ? error.message : 'Failed to create course';
      const statusCode = message.includes('validation') || message.includes('required') ? 400 : 500;
      reply.status(statusCode).send({ error: message });
    }
    }
  });

  // Get a specific course
  fastify.get('/:courseId', {
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
    preHandler: [authenticate],
    handler: async (request: FastifyRequest<{ Params: { courseId: string } }>, reply: FastifyReply) => {
    try {
      const { courseId } = request.params;
      const userId = (request as any).userId;
      const userRole = (request as any).user.role;

      const course = await CourseService.getCourseById(courseId, true);

      if (!course) {
        return reply.status(404).send({ error: 'Course not found' });
      }

      reply.send({
        message: 'Course retrieved successfully',
        data: course
      });
    } catch (error) {
      console.error('Error fetching course:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch course';
      const statusCode = message.includes('not found') ? 404 : 
                        message.includes('access') || message.includes('permission') ? 403 : 500;
      reply.status(statusCode).send({ error: message });
    }
    }
  });

  // Update a course (educators only)
  fastify.put('/:courseId', {
    schema: {
      params: Type.Object({
        courseId: Type.String()
      }),
      body: UpdateCourseSchema,
      response: {
        200: SuccessResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate, requireRole(['educator'])],
    handler: async (request: FastifyRequest<{ 
      Params: { courseId: string },
      Body: UpdateCourseType 
    }>, reply: FastifyReply) => {
    try {
      const { courseId } = request.params;
      const updateData = request.body;
      const userId = (request as any).userId;

      // Direct Prisma update since CourseService.updateCourse doesn't exist
      const course = await prisma.course.update({
        where: { id: courseId },
        data: updateData,
        include: {
          instructor: { select: { firstName: true, lastName: true, email: true } },
          enrollments: { include: { student: { select: { firstName: true, lastName: true } } } }
        }
      });

      reply.send({
        message: 'Course updated successfully',
        data: course
      });
    } catch (error) {
      console.error('Error updating course:', error);
      const message = error instanceof Error ? error.message : 'Failed to update course';
      const statusCode = message.includes('not found') ? 404 : 
                        message.includes('access') || message.includes('permission') ? 403 : 500;
      reply.status(statusCode).send({ error: message });
    }
    }
  });

  // Enroll in a course (students only)
  fastify.post('/enroll', {
    schema: {
      body: EnrollRequestSchema,
      response: {
        201: SuccessResponseSchema,
        400: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        409: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate, requireRole(['student'])],
    handler: async (request: FastifyRequest<{ Body: EnrollRequestType }>, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;
      const { enrollmentCode } = request.body;

      // Find course by enrollment code
      const course = await prisma.course.findFirst({
        where: { enrollmentCode }
      });

      if (!course) {
        return reply.status(404).send({ error: 'Invalid enrollment code' });
      }

      // Check if already enrolled
      const existingEnrollment = await prisma.courseEnrollment.findFirst({
        where: {
          studentId: userId,
          courseId: course.id
        }
      });

      if (existingEnrollment) {
        return reply.status(409).send({ error: 'Already enrolled in this course' });
      }

      // Create enrollment
      const enrollment = await prisma.courseEnrollment.create({
        data: {
          studentId: userId,
          courseId: course.id,
          status: 'active'
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              description: true
            }
          }
        }
      });

      reply.status(201).send({
        message: 'Successfully enrolled in course',
        data: enrollment
      });
    } catch (error) {
      console.error('Error enrolling in course:', error);
      const message = error instanceof Error ? error.message : 'Failed to enroll in course';
      
      let statusCode = 500;
      if (message.includes('not found') || message.includes('invalid code')) {
        statusCode = 404;
      } else if (message.includes('already enrolled') || message.includes('duplicate')) {
        statusCode = 409;
      } else if (message.includes('full') || message.includes('capacity')) {
        statusCode = 400;
      }
      
      reply.status(statusCode).send({ error: message });
    }
    }
  });

  // Unenroll from a course (students only)
  fastify.post('/:courseId/unenroll', {
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
    preHandler: [authenticate, requireRole(['student'])],
    handler: async (request: FastifyRequest<{ Params: { courseId: string } }>, reply: FastifyReply) => {
    try {
      const { courseId } = request.params;
      const userId = (request as any).userId;

      // Check if enrollment exists
      const enrollment = await prisma.courseEnrollment.findFirst({
        where: {
          studentId: userId,
          courseId: courseId
        }
      });

      if (!enrollment) {
        return reply.status(404).send({ error: 'Not enrolled in this course' });
      }

      // Delete enrollment
      await prisma.courseEnrollment.delete({
        where: {
          id: enrollment.id
        }
      });

      reply.send({
        message: 'Successfully unenrolled from course',
        data: { courseId, userId }
      });
    } catch (error) {
      console.error('Error unenrolling from course:', error);
      const message = error instanceof Error ? error.message : 'Failed to unenroll from course';
      const statusCode = message.includes('not found') || message.includes('not enrolled') ? 404 : 500;
      reply.status(statusCode).send({ error: message });
    }
    }
  });

  // Get course assignments
  fastify.get('/:courseId/assignments', {
    schema: {
      params: Type.Object({
        courseId: Type.String()
      }),
      querystring: Type.Object({
        status: Type.Optional(Type.String()),
        includeSubmissions: Type.Optional(Type.Boolean())
      }),
      response: {
        200: SuccessResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate],
    handler: async (request: FastifyRequest<{ 
      Params: { courseId: string },
      Querystring: { status?: string, includeSubmissions?: string }
    }>, reply: FastifyReply) => {
    try {
      const { courseId } = request.params;
      const { status, includeSubmissions } = request.query;
      const userId = (request as any).userId;
      const userRole = (request as any).user.role;

      // Verify course access first
      const course = await prisma.course.findUnique({
        where: { id: courseId }
      });

      if (!course) {
        return reply.status(404).send({ error: 'Course not found' });
      }

      // Check access permissions
      const isInstructor = course.instructorId === userId;
      const isAdmin = userRole === 'admin';
      
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

      const hasAccess = isInstructor || isAdmin || isEnrolled;
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied to course' });
      }

      // Build assignment query
      const whereClause: any = { courseId };
      if (status) {
        whereClause.status = status;
      }

      const assignments = await prisma.assignment.findMany({
        where: whereClause,
        include: {
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          submissions: includeSubmissions === 'true' ? {
            where: userRole === 'student' ? { authorId: userId } : undefined,
            select: {
              id: true,
              authorId: true,
              status: true,
              submittedAt: true,
              wordCount: true
            }
          } : false,
          _count: {
            select: {
              submissions: true
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
      const message = error instanceof Error ? error.message : 'Failed to fetch course assignments';
      const statusCode = message.includes('not found') ? 404 : 
                        message.includes('access') || message.includes('permission') ? 403 : 500;
      reply.status(statusCode).send({ error: message });
    }
    }
  });
}