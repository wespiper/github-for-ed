import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '../../utils/jwt';
import { User } from '@prisma/client';
import prisma from '../../lib/prisma';

// Type definitions
interface AuthenticatedRequest extends FastifyRequest {
  user?: User;
  userId?: string;
  userRole?: string;
}

// Schema for generate endpoint
const generateSchema = {
  body: {
    type: 'object',
    required: ['prompt', 'type'],
    properties: {
      prompt: { type: 'string', minLength: 1, maxLength: 4000 },
      type: { 
        type: 'string', 
        enum: ['suggestion', 'feedback', 'analysis', 'reflection'] 
      },
      context: {
        type: 'object',
        properties: {
          assignmentId: { type: 'string' },
          documentId: { type: 'string' },
          studentLevel: { type: 'string' }
        }
      }
    }
  }
};

// Authentication hook
async function authenticate(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
    const token = extractTokenFromHeader(request.headers.authorization);
    
    if (!token) {
      throw new Error('Access token required');
    }

    const decoded: JWTPayload = verifyToken(token);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user) {
      throw new Error('User not found');
    }

    request.user = user;
    request.userId = user.id;
    request.userRole = user.role;
  } catch (error) {
    reply.code(401).send({ error: 'Invalid or expired token' });
    return;
  }
}

export default async function aiRoutes(fastify: FastifyInstance) {
  // AI Generate endpoint with rate limiting
  fastify.post('/generate', {
    schema: generateSchema,
    preHandler: [authenticate],
    config: {
      rateLimit: {
        max: 10, // 10 requests
        timeWindow: '1 minute'
      }
    }
  }, async (request: any, reply: FastifyReply) => {
      try {
        const { prompt, type, context } = request.body;
        const userId = request.userId!;
        const userRole = request.userRole!;

        // Log the AI request for monitoring
        fastify.log.info('AI generate request', {
          userId,
          userRole,
          type,
          promptLength: prompt.length,
          context
        });

        // Simulate AI processing (replace with actual AI service call)
        const response = await generateAIResponse(prompt, type, context, userRole);

        // TODO: Log AI usage for analytics when aiUsageLog table is added
        /* await prisma.aiUsageLog.create({
          data: {
            userId,
            requestType: type,
            promptTokens: Math.ceil(prompt.length / 4), // Rough token estimate
            responseTokens: Math.ceil(response.content.length / 4),
            context: context || {},
            successful: true
          }
        }).catch((error: any) => {
          // Don't fail the request if logging fails
          fastify.log.warn('Failed to log AI usage:', error);
        }); */

        reply.send({
          success: true,
          data: response,
          usage: {
            promptTokens: Math.ceil(prompt.length / 4),
            responseTokens: Math.ceil(response.content.length / 4)
          }
        });
      } catch (error) {
        fastify.log.error('AI generation error:', error);
        
        // TODO: Log failed AI usage when aiUsageLog table is added
        /* await prisma.aiUsageLog.create({
          data: {
            userId: request.userId!,
            requestType: request.body.type,
            promptTokens: Math.ceil(request.body.prompt.length / 4),
            responseTokens: 0,
            context: request.body.context || {},
            successful: false,
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          }
        }).catch(() => {
          // Silently ignore logging errors
        }); */

        const message = error instanceof Error ? error.message : 'AI generation failed';
        const statusCode = message.includes('rate limit') ? 429 :
                          message.includes('invalid') || message.includes('required') ? 400 : 500;
        
        reply.code(statusCode).send({ 
          success: false,
          error: message 
        });
      }
    });

  // AI capabilities endpoint
  fastify.get('/capabilities', {
    preHandler: authenticate,
    handler: async (request: AuthenticatedRequest, reply: FastifyReply) => {
      const userRole = request.userRole!;
      
      const capabilities = {
        student: ['suggestion', 'analysis'],
        educator: ['suggestion', 'feedback', 'analysis', 'reflection'],
        admin: ['suggestion', 'feedback', 'analysis', 'reflection']
      };

      reply.send({
        success: true,
        data: {
          availableTypes: capabilities[userRole as keyof typeof capabilities] || ['suggestion'],
          rateLimits: {
            perMinute: 10,
            perHour: 100
          }
        }
      });
    }
  });
}

// Mock AI response generator (replace with actual AI service)
async function generateAIResponse(
  prompt: string, 
  type: string, 
  context: any, 
  userRole: string
): Promise<{ content: string; type: string; confidence: number }> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // Mock responses based on type
  const responses = {
    suggestion: `Based on your writing, here are some suggestions: Consider expanding on your main argument with specific examples. The flow between paragraphs could be improved with better transitions.`,
    feedback: `Your writing shows good understanding of the topic. Areas for improvement: 1) Strengthen your thesis statement, 2) Provide more evidence for your claims, 3) Consider the counterarguments.`,
    analysis: `Analysis of your writing process shows consistent improvement in structure and clarity. Your argument development has strengthened over the past three drafts.`,
    reflection: `Reflection prompt: What was the most challenging aspect of this assignment? How did your understanding of the topic evolve as you wrote?`
  };

  return {
    content: responses[type as keyof typeof responses] || 'AI response generated successfully.',
    type,
    confidence: 0.85
  };
}