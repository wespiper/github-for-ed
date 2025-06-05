/**
 * Academic Integrity Routes (Fastify)
 * Handles academic integrity monitoring and analysis endpoints
 */

import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { ServiceFactory } from '../../container/ServiceFactory';
import { AcademicIntegrityService } from '../../services/AcademicIntegrityService';

interface AIDetectionRequest {
  studentId: string;
  assignmentId: string;
  content: string;
  privacyContext: {
    requesterId: string;
    requesterType: 'student' | 'educator' | 'system' | 'admin';
    purpose: string;
    educationalJustification?: string;
  };
}

interface IntegrityAnalysisRequest {
  studentId: string;
  assignmentId: string;
  submissionData: {
    content: string;
    metadata?: Record<string, any>;
    writingPatterns?: Record<string, any>;
  };
  privacyContext: {
    requesterId: string;
    requesterType: 'student' | 'educator' | 'system' | 'admin';
    purpose: string;
    educationalJustification?: string;
  };
}

interface EducationalValidationRequest {
  studentId: string;
  assignmentId: string;
  aiInteraction: {
    type: string;
    content: string;
    context?: Record<string, any>;
  };
  privacyContext: {
    requesterId: string;
    requesterType: 'student' | 'educator' | 'system' | 'admin';
    purpose: string;
    educationalJustification?: string;
  };
}

interface ReportGenerationRequest {
  criteria: {
    reportType: 'individual' | 'class' | 'assignment' | 'course';
    targetId?: string;
    timeframe: {
      start: string;
      end: string;
    };
    includeIndividualData?: boolean;
  };
  privacyContext: {
    requesterId: string;
    requesterType: 'student' | 'educator' | 'system' | 'admin';
    purpose: string;
    educationalJustification?: string;
  };
}

export default async function academicIntegrityRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Get Academic Integrity Service
  let academicIntegrityService: AcademicIntegrityService;
  
  try {
    const serviceFactory = ServiceFactory.getInstance();
    await serviceFactory.initialize();
    academicIntegrityService = serviceFactory.getAcademicIntegrityService();
  } catch (error) {
    fastify.log.error('Failed to initialize Academic Integrity Service:', error);
    throw error;
  }

  // AI Assistance Detection
  fastify.post<{ Body: AIDetectionRequest }>(
    '/ai-assistance/detect',
    {
      schema: {
          body: {
          type: 'object',
          required: ['studentId', 'assignmentId', 'content', 'privacyContext'],
          properties: {
            studentId: { type: 'string', description: 'Student identifier' },
            assignmentId: { type: 'string', description: 'Assignment identifier' },
            content: { type: 'string', description: 'Student work content to analyze' },
            privacyContext: {
              type: 'object',
              required: ['requesterId', 'requesterType', 'purpose'],
              properties: {
                requesterId: { type: 'string' },
                requesterType: { type: 'string', enum: ['student', 'educator', 'system', 'admin'] },
                purpose: { type: 'string' },
                educationalJustification: { type: 'string' }
              }
            }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  assistanceLevel: { type: 'string', enum: ['none', 'minimal', 'moderate', 'significant', 'generated'] },
                  confidence: { type: 'number' },
                  patterns: { type: 'array', items: { type: 'string' } },
                  recommendations: { type: 'array', items: { type: 'string' } },
                  processingTime: { type: 'number' }
                }
              },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: AIDetectionRequest }>, reply: FastifyReply) => {
      try {
        const result = await academicIntegrityService.detectAIAssistanceLevels(
          request.body.studentId,
          request.body.assignmentId,
          request.body.content,
          {
            ...request.body.privacyContext,
            timestamp: new Date()
          }
        );

        return reply.code(200).send({
          success: true,
          data: result,
          message: 'AI assistance levels detected successfully'
        });
      } catch (error) {
        fastify.log.error('AI assistance detection failed:', error);
        return reply.code(500).send({
          success: false,
          error: 'AI assistance detection failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // Academic Integrity Analysis
  fastify.post<{ Body: IntegrityAnalysisRequest }>(
    '/integrity/analyze',
    {
      schema: {
          body: {
          type: 'object',
          required: ['studentId', 'assignmentId', 'submissionData', 'privacyContext'],
          properties: {
            studentId: { type: 'string' },
            assignmentId: { type: 'string' },
            submissionData: {
              type: 'object',
              required: ['content'],
              properties: {
                content: { type: 'string' },
                metadata: { type: 'object' },
                writingPatterns: { type: 'object' }
              }
            },
            privacyContext: {
              type: 'object',
              required: ['requesterId', 'requesterType', 'purpose'],
              properties: {
                requesterId: { type: 'string' },
                requesterType: { type: 'string', enum: ['student', 'educator', 'system', 'admin'] },
                purpose: { type: 'string' },
                educationalJustification: { type: 'string' }
              }
            }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  integrityScore: { type: 'number' },
                  flags: { type: 'array', items: { type: 'string' } },
                  recommendations: { type: 'array', items: { type: 'string' } },
                  educationalValue: { type: 'number' },
                  confidence: { type: 'number' },
                  processingTime: { type: 'number' }
                }
              }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: IntegrityAnalysisRequest }>, reply: FastifyReply) => {
      try {
        const result = await academicIntegrityService.analyzeAcademicIntegrity(
          request.body.studentId,
          request.body.assignmentId,
          request.body.submissionData,
          {
            ...request.body.privacyContext,
            timestamp: new Date()
          }
        );

        return reply.code(200).send({
          success: true,
          data: result,
          message: 'Academic integrity analyzed successfully'
        });
      } catch (error) {
        fastify.log.error('Academic integrity analysis failed:', error);
        return reply.code(500).send({
          success: false,
          error: 'Academic integrity analysis failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // Educational AI Validation
  fastify.post<{ Body: EducationalValidationRequest }>(
    '/ai-validation/validate',
    {
      schema: {
          body: {
          type: 'object',
          required: ['studentId', 'assignmentId', 'aiInteraction', 'privacyContext'],
          properties: {
            studentId: { type: 'string' },
            assignmentId: { type: 'string' },
            aiInteraction: {
              type: 'object',
              required: ['type', 'content'],
              properties: {
                type: { type: 'string' },
                content: { type: 'string' },
                context: { type: 'object' }
              }
            },
            privacyContext: {
              type: 'object',
              required: ['requesterId', 'requesterType', 'purpose'],
              properties: {
                requesterId: { type: 'string' },
                requesterType: { type: 'string', enum: ['student', 'educator', 'system', 'admin'] },
                purpose: { type: 'string' },
                educationalJustification: { type: 'string' }
              }
            }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  validationStatus: { type: 'string', enum: ['approved', 'flagged', 'prohibited'] },
                  boundaryCompliance: { type: 'object' },
                  educationalValue: { type: 'object' },
                  recommendations: { type: 'array', items: { type: 'string' } },
                  processingTime: { type: 'number' }
                }
              }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: EducationalValidationRequest }>, reply: FastifyReply) => {
      try {
        const result = await academicIntegrityService.validateEducationalAIUse(
          request.body.studentId,
          request.body.assignmentId,
          {
            ...request.body.aiInteraction,
            context: request.body.aiInteraction.context || {}
          },
          {
            ...request.body.privacyContext,
            timestamp: new Date()
          }
        );

        return reply.code(200).send({
          success: true,
          data: result,
          message: 'Educational AI interaction validated successfully'
        });
      } catch (error) {
        fastify.log.error('Educational AI validation failed:', error);
        return reply.code(500).send({
          success: false,
          error: 'Educational AI validation failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // Integrity Report Generation
  fastify.post<{ Body: ReportGenerationRequest }>(
    '/reports/generate',
    {
      schema: {
          body: {
          type: 'object',
          required: ['criteria', 'privacyContext'],
          properties: {
            criteria: {
              type: 'object',
              required: ['reportType', 'timeframe'],
              properties: {
                reportType: { type: 'string', enum: ['individual', 'class', 'assignment', 'course'] },
                targetId: { type: 'string' },
                timeframe: {
                  type: 'object',
                  required: ['start', 'end'],
                  properties: {
                    start: { type: 'string', format: 'date' },
                    end: { type: 'string', format: 'date' }
                  }
                },
                includeIndividualData: { type: 'boolean' }
              }
            },
            privacyContext: {
              type: 'object',
              required: ['requesterId', 'requesterType', 'purpose'],
              properties: {
                requesterId: { type: 'string' },
                requesterType: { type: 'string', enum: ['student', 'educator', 'system', 'admin'] },
                purpose: { type: 'string' },
                educationalJustification: { type: 'string' }
              }
            }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  reportId: { type: 'string' },
                  reportType: { type: 'string' },
                  generatedAt: { type: 'string', format: 'date-time' },
                  summary: { type: 'object' },
                  insights: { type: 'object' },
                  data: { type: 'object' },
                  processingTime: { type: 'number' }
                }
              }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: ReportGenerationRequest }>, reply: FastifyReply) => {
      try {
        // Convert string dates to Date objects
        const criteria = {
          ...request.body.criteria,
          timeframe: {
            start: new Date(request.body.criteria.timeframe.start),
            end: new Date(request.body.criteria.timeframe.end)
          }
        };
        
        const result = await academicIntegrityService.generateIntegrityReports(
          criteria,
          {
            ...request.body.privacyContext,
            timestamp: new Date()
          }
        );

        return reply.code(200).send({
          success: true,
          data: result,
          message: 'Integrity report generated successfully'
        });
      } catch (error) {
        fastify.log.error('Integrity report generation failed:', error);
        return reply.code(500).send({
          success: false,
          error: 'Integrity report generation failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // Health Check
  fastify.get('/health', {
    schema: {
      description: 'Academic integrity service health check',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            service: { type: 'string' },
            timestamp: { type: 'string' },
            capabilities: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  }, async (request, reply) => {
    return {
      status: 'healthy',
      service: 'academic-integrity',
      timestamp: new Date().toISOString(),
      capabilities: [
        'ai-assistance-detection',
        'academic-integrity-analysis', 
        'educational-ai-validation',
        'integrity-reporting'
      ]
    };
  });

  // List Available Tools
  fastify.get('/tools', {
    schema: {
      description: 'List available academic integrity tools',
      tags: ['Tools'],
      response: {
        200: {
          type: 'object',
          properties: {
            tools: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  category: { type: 'string' },
                  privacyAware: { type: 'boolean' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    return {
      tools: [
        {
          name: 'detect_ai_assistance_levels',
          description: 'Detect AI assistance levels in student work',
          category: 'ai-detection',
          privacyAware: true
        },
        {
          name: 'analyze_academic_integrity',
          description: 'Comprehensive academic integrity analysis',
          category: 'integrity-analysis',
          privacyAware: true
        },
        {
          name: 'validate_educational_ai_use',
          description: 'Validate educational AI interactions',
          category: 'educational-validation',
          privacyAware: true
        },
        {
          name: 'generate_integrity_reports',
          description: 'Generate integrity reports with privacy controls',
          category: 'reporting',
          privacyAware: true
        }
      ]
    };
  });
}