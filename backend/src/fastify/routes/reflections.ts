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
    (request as any).userRole = payload.role;
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
const SubmitReflectionSchema = Type.Object({
  aiInteractionId: Type.String(),
  assignmentId: Type.String(),
  reflection: Type.String({ minLength: 1 }),
  writingStage: Type.String()
});

const SuccessResponseSchema = Type.Object({
  message: Type.String(),
  data: Type.Any()
});

const ErrorResponseSchema = Type.Object({
  error: Type.String()
});

// Simplified reflection analysis service for Fastify migration
const ReflectionAnalysisService = {
  async analyzeReflection(reflection: string, context: any) {
    // Simplified analysis - in production, this would use the real service
    const wordCount = reflection.split(' ').length;
    const qualityScore = Math.min(100, Math.max(20, wordCount * 2)); // Simple scoring
    
    return {
      overall: {
        qualityScore,
        progressiveAccessLevel: qualityScore > 80 ? 'enhanced' : qualityScore > 60 ? 'standard' : 'basic',
        recommendations: [
          qualityScore < 50 ? 'Consider providing more detailed reflection' : 'Good reflection quality'
        ],
        authenticityScore: qualityScore
      },
      depth: { score: Math.min(100, qualityScore + 10) },
      selfAwareness: { score: Math.min(100, qualityScore + 5) },
      criticalEngagement: { score: Math.min(100, qualityScore - 5) },
      growthMindset: { score: Math.min(100, qualityScore) }
    };
  },

  async getStudentReflectionHistory(studentId: string, assignmentId?: string) {
    const whereClause: any = {
      studentId,
      reflectionCompleted: true
    };
    
    if (assignmentId) {
      whereClause.assignmentId = assignmentId;
    }

    const reflections = await prisma.aIInteractionLog.findMany({
      where: whereClause,
      select: {
        id: true,
        assignmentId: true,
        metadata: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      studentId,
      totalReflections: reflections.length,
      reflections: reflections.map(r => ({
        id: r.id,
        assignmentId: r.assignmentId,
        reflection: (r.metadata as any)?.reflection || '',
        analysis: (r.metadata as any)?.reflectionAnalysis || {},
        submittedAt: r.createdAt
      }))
    };
  }
};

export default async function reflectionRoutes(fastify: FastifyInstance) {
  // Submit and analyze a reflection for an AI interaction
  fastify.post('/submit', {
    schema: {
      body: SubmitReflectionSchema,
      response: {
        200: SuccessResponseSchema,
        400: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate, requireRole(['student'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const studentId = (request as any).userId;
      const { 
        aiInteractionId, 
        assignmentId, 
        reflection, 
        writingStage 
      } = request.body as any;

      // Verify the AI interaction exists and belongs to this student
      const aiInteraction = await prisma.aIInteractionLog.findFirst({
        where: {
          id: aiInteractionId,
          studentId: studentId
        }
      });

      if (!aiInteraction) {
        return reply.status(404).send({ 
          error: 'AI interaction not found or access denied' 
        });
      }

      // Analyze the reflection
      const analysis = await ReflectionAnalysisService.analyzeReflection(
        reflection,
        {
          studentId,
          assignmentId,
          aiInteractionId,
          writingStage
        }
      );

      // Update the AI interaction to mark reflection as completed
      await prisma.aIInteractionLog.update({
        where: { id: aiInteractionId },
        data: {
          reflectionCompleted: true,
          metadata: {
            ...(aiInteraction.metadata as any || {}),
            reflection: reflection,
            reflectionAnalysis: analysis,
            reflectionSubmittedAt: new Date()
          }
        }
      });

      reply.send({
        message: 'Reflection submitted and analyzed successfully',
        data: {
          analysis,
          progressiveAccessLevel: analysis.overall.progressiveAccessLevel,
          recommendations: analysis.overall.recommendations
        }
      });
    } catch (error: any) {
      console.error('Error submitting reflection:', error);
      reply.status(500).send({ 
        error: 'Failed to submit reflection'
      });
    }
  });

  // Get reflection history and analytics for a student
  fastify.get('/history/:studentId', {
    schema: {
      params: Type.Object({
        studentId: Type.String()
      }),
      querystring: Type.Object({
        assignmentId: Type.Optional(Type.String())
      }),
      response: {
        200: SuccessResponseSchema,
        403: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { studentId } = request.params as any;
      const { assignmentId } = request.query as any;
      const userId = (request as any).userId;
      const userRole = (request as any).userRole;

      // Check permissions
      if (userRole === 'student' && studentId !== userId) {
        return reply.status(403).send({ 
          error: 'Access denied: Can only view your own reflection history' 
        });
      }

      // If educator, verify they have access to this student
      if (userRole === 'educator') {
        const hasAccess = await prisma.assignment.findFirst({
          where: {
            instructorId: userId,
            submissions: {
              some: {
                authorId: studentId
              }
            }
          }
        });

        if (!hasAccess) {
          return reply.status(403).send({ 
            error: 'Access denied: No access to this student\'s data' 
          });
        }
      }

      const history = await ReflectionAnalysisService.getStudentReflectionHistory(
        studentId,
        assignmentId
      );

      reply.send({
        message: 'Reflection history retrieved successfully',
        data: history
      });
    } catch (error: any) {
      console.error('Error getting reflection history:', error);
      reply.status(500).send({ 
        error: 'Failed to get reflection history'
      });
    }
  });

  // Get aggregate reflection quality report for an assignment
  fastify.get('/quality-report/:assignmentId', {
    schema: {
      params: Type.Object({
        assignmentId: Type.String()
      }),
      response: {
        200: SuccessResponseSchema,
        403: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate, requireRole(['educator'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { assignmentId } = request.params as any;
      const instructorId = (request as any).userId;

      // Verify educator owns this assignment
      const assignment = await prisma.assignment.findFirst({
        where: {
          id: assignmentId,
          instructorId: instructorId
        }
      });

      if (!assignment) {
        return reply.status(403).send({ 
          error: 'Access denied: Assignment not found or you do not have access' 
        });
      }

      // Get all reflections for this assignment
      const reflections = await prisma.aIInteractionLog.findMany({
        where: {
          assignmentId: assignmentId,
          reflectionCompleted: true
        },
        select: {
          studentId: true,
          metadata: true,
          createdAt: true
        }
      });

      // Aggregate quality metrics
      const studentMetrics = new Map<string, any>();
      
      reflections.forEach((reflection: any) => {
        const analysis = reflection.metadata?.reflectionAnalysis;
        if (!analysis) return;

        const studentId = reflection.studentId;
        if (!studentMetrics.has(studentId)) {
          studentMetrics.set(studentId, {
            totalReflections: 0,
            totalQualityScore: 0,
            depthScores: [],
            selfAwarenessScores: [],
            criticalThinkingScores: [],
            growthMindsetScores: [],
            authenticityScores: []
          });
        }

        const metrics = studentMetrics.get(studentId);
        metrics.totalReflections++;
        metrics.totalQualityScore += analysis.overall?.qualityScore || 0;
        metrics.depthScores.push(analysis.depth?.score || 0);
        metrics.selfAwarenessScores.push(analysis.selfAwareness?.score || 0);
        metrics.criticalThinkingScores.push(analysis.criticalEngagement?.score || 0);
        metrics.growthMindsetScores.push(analysis.growthMindset?.score || 0);
        metrics.authenticityScores.push(analysis.overall?.authenticityScore || 0);
      });

      // Calculate averages
      const report = {
        assignmentId,
        totalStudents: studentMetrics.size,
        totalReflections: reflections.length,
        classAverages: {
          overallQuality: 0,
          depth: 0,
          selfAwareness: 0,
          criticalThinking: 0,
          growthMindset: 0,
          authenticity: 0
        },
        studentBreakdown: [] as any[]
      };

      let classQualitySum = 0;
      let classDepthSum = 0;
      let classSelfAwarenessSum = 0;
      let classCriticalThinkingSum = 0;
      let classGrowthMindsetSum = 0;
      let classAuthenticitySum = 0;

      studentMetrics.forEach((metrics, studentId) => {
        const avgQuality = metrics.totalQualityScore / metrics.totalReflections;
        const avgDepth = metrics.depthScores.reduce((a: number, b: number) => a + b, 0) / metrics.depthScores.length;
        const avgSelfAwareness = metrics.selfAwarenessScores.reduce((a: number, b: number) => a + b, 0) / metrics.selfAwarenessScores.length;
        const avgCriticalThinking = metrics.criticalThinkingScores.reduce((a: number, b: number) => a + b, 0) / metrics.criticalThinkingScores.length;
        const avgGrowthMindset = metrics.growthMindsetScores.reduce((a: number, b: number) => a + b, 0) / metrics.growthMindsetScores.length;
        const avgAuthenticity = metrics.authenticityScores.reduce((a: number, b: number) => a + b, 0) / metrics.authenticityScores.length;

        classQualitySum += avgQuality;
        classDepthSum += avgDepth;
        classSelfAwarenessSum += avgSelfAwareness;
        classCriticalThinkingSum += avgCriticalThinking;
        classGrowthMindsetSum += avgGrowthMindset;
        classAuthenticitySum += avgAuthenticity;

        report.studentBreakdown.push({
          studentId,
          totalReflections: metrics.totalReflections,
          averageQuality: Math.round(avgQuality),
          dimensions: {
            depth: Math.round(avgDepth),
            selfAwareness: Math.round(avgSelfAwareness),
            criticalThinking: Math.round(avgCriticalThinking),
            growthMindset: Math.round(avgGrowthMindset),
            authenticity: Math.round(avgAuthenticity)
          }
        });
      });

      // Calculate class averages
      if (studentMetrics.size > 0) {
        report.classAverages = {
          overallQuality: Math.round(classQualitySum / studentMetrics.size),
          depth: Math.round(classDepthSum / studentMetrics.size),
          selfAwareness: Math.round(classSelfAwarenessSum / studentMetrics.size),
          criticalThinking: Math.round(classCriticalThinkingSum / studentMetrics.size),
          growthMindset: Math.round(classGrowthMindsetSum / studentMetrics.size),
          authenticity: Math.round(classAuthenticitySum / studentMetrics.size)
        };
      }

      reply.send({
        message: 'Reflection quality report generated successfully',
        data: report
      });
    } catch (error: any) {
      console.error('Error generating quality report:', error);
      reply.status(500).send({ 
        error: 'Failed to generate quality report'
      });
    }
  });
}