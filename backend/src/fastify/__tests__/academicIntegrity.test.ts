/**
 * Academic Integrity Routes Tests
 * Comprehensive test suite for academic integrity endpoints
 */

import { FastifyInstance } from 'fastify';
import { createFastifyApp } from '../app';
import { ServiceFactory } from '../../container/ServiceFactory';
import { MockAcademicIntegrityRepository } from '../../repositories/__mocks__/AcademicIntegrityRepository.mock';

describe('Academic Integrity Routes', () => {
  let fastify: FastifyInstance;
  let serviceFactory: ServiceFactory;
  let mockRepository: MockAcademicIntegrityRepository;

  beforeAll(async () => {
    // Reset service factory
    serviceFactory = ServiceFactory.getInstance();
    serviceFactory.reset();
    
    // Initialize with mock repository
    await serviceFactory.initialize();
    mockRepository = serviceFactory.getAcademicIntegrityRepository() as MockAcademicIntegrityRepository;
    
    // Create Fastify app
    fastify = await createFastifyApp();
  });

  afterAll(async () => {
    await fastify.close();
    serviceFactory.reset();
  });

  beforeEach(() => {
    // Clear mock data before each test
    if (mockRepository && 'clearMockData' in mockRepository) {
      (mockRepository as any).clearMockData();
    }
  });

  describe('POST /api/academic-integrity/ai-assistance/detect', () => {
    const validRequest = {
      studentId: 'student-123',
      assignmentId: 'assignment-456',
      content: 'This is a sample student submission for analysis.',
      privacyContext: {
        requesterId: 'educator-789',
        requesterType: 'educator' as const,
        purpose: 'academic_integrity_monitoring',
        educationalJustification: 'Monitoring student AI usage for educational support'
      }
    };

    it('should detect AI assistance levels successfully', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/academic-integrity/ai-assistance/detect',
        payload: validRequest
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.assistanceLevel).toMatch(/^(none|minimal|moderate|significant|generated)$/);
      expect(result.data.confidence).toBeGreaterThanOrEqual(0);
      expect(result.data.confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(result.data.patterns)).toBe(true);
      expect(Array.isArray(result.data.recommendations)).toBe(true);
      expect(result.message).toBe('AI assistance levels detected successfully');
    });

    it('should validate required fields', async () => {
      const invalidRequest: any = { ...validRequest };
      delete invalidRequest.studentId;

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/academic-integrity/ai-assistance/detect',
        payload: invalidRequest
      });

      expect(response.statusCode).toBe(400);
    });

    it('should validate privacy context', async () => {
      const invalidRequest = {
        ...validRequest,
        privacyContext: {
          requesterId: 'educator-789',
          requesterType: 'educator' as const,
          purpose: 'invalid_purpose'
        }
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/academic-integrity/ai-assistance/detect',
        payload: invalidRequest
      });

      expect(response.statusCode).toBe(500); // Service will reject invalid purpose
    });

    it('should handle empty content', async () => {
      const emptyContentRequest = {
        ...validRequest,
        content: ''
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/academic-integrity/ai-assistance/detect',
        payload: emptyContentRequest
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
    });
  });

  describe('POST /api/academic-integrity/integrity/analyze', () => {
    const validRequest = {
      studentId: 'student-123',
      assignmentId: 'assignment-456',
      submissionData: {
        content: 'This is a comprehensive analysis of the topic with original insights.',
        metadata: {
          wordCount: 150,
          submissionTime: new Date().toISOString()
        },
        writingPatterns: {
          avgSentenceLength: 15,
          vocabularyComplexity: 0.6
        }
      },
      privacyContext: {
        requesterId: 'educator-789',
        requesterType: 'educator' as const,
        purpose: 'academic_integrity_monitoring',
        educationalJustification: 'Comprehensive integrity analysis for academic support'
      }
    };

    it('should analyze academic integrity successfully', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/academic-integrity/integrity/analyze',
        payload: validRequest
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.integrityScore).toBeGreaterThanOrEqual(0);
      expect(result.data.integrityScore).toBeLessThanOrEqual(1);
      expect(Array.isArray(result.data.flags)).toBe(true);
      expect(Array.isArray(result.data.recommendations)).toBe(true);
      expect(result.data.educationalValue).toBeGreaterThanOrEqual(0);
      expect(result.data.confidence).toBeGreaterThanOrEqual(0);
      expect(result.message).toBe('Academic integrity analyzed successfully');
    });

    it('should handle submission without metadata', async () => {
      const requestWithoutMetadata = {
        ...validRequest,
        submissionData: {
          content: 'Simple content without metadata'
        }
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/academic-integrity/integrity/analyze',
        payload: requestWithoutMetadata
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
    });
  });

  describe('POST /api/academic-integrity/ai-validation/validate', () => {
    const validRequest = {
      studentId: 'student-123',
      assignmentId: 'assignment-456',
      aiInteraction: {
        type: 'brainstorming',
        content: 'Help me understand the main concepts of this topic',
        context: {
          sessionId: 'session-789',
          timestamp: new Date().toISOString()
        }
      },
      privacyContext: {
        requesterId: 'educator-789',
        requesterType: 'educator' as const,
        purpose: 'academic_integrity_monitoring',
        educationalJustification: 'Validating appropriate AI use for educational purposes'
      }
    };

    it('should validate educational AI use successfully', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/academic-integrity/ai-validation/validate',
        payload: validRequest
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.validationStatus).toMatch(/^(approved|flagged|prohibited)$/);
      expect(result.data.boundaryCompliance).toBeDefined();
      expect(result.data.educationalValue).toBeDefined();
      expect(Array.isArray(result.data.recommendations)).toBe(true);
      expect(result.message).toBe('Educational AI interaction validated successfully');
    });

    it('should flag inappropriate AI interactions', async () => {
      const inappropriateRequest = {
        ...validRequest,
        aiInteraction: {
          type: 'complete-work',
          content: 'Write my entire essay for me',
          context: {}
        }
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/academic-integrity/ai-validation/validate',
        payload: inappropriateRequest
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      // The service should detect this as inappropriate
      expect(['flagged', 'prohibited']).toContain(result.data.validationStatus);
    });
  });

  describe('POST /api/academic-integrity/reports/generate', () => {
    const validRequest = {
      criteria: {
        reportType: 'class' as const,
        targetId: 'class-123',
        timeframe: {
          start: '2024-01-01',
          end: '2024-12-31'
        },
        includeIndividualData: false
      },
      privacyContext: {
        requesterId: 'educator-789',
        requesterType: 'educator' as const,
        purpose: 'academic_integrity_monitoring',
        educationalJustification: 'Generating class-level integrity report for educational insights'
      }
    };

    it('should generate integrity reports successfully', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/academic-integrity/reports/generate',
        payload: validRequest
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.reportId).toBeDefined();
      expect(result.data.reportType).toBe('class');
      expect(result.data.generatedAt).toBeDefined();
      expect(result.data.summary).toBeDefined();
      expect(result.data.insights).toBeDefined();
      expect(result.data.data).toBeDefined();
      expect(result.message).toBe('Integrity report generated successfully');
    });

    it('should validate timeframe', async () => {
      const invalidTimeframeRequest = {
        ...validRequest,
        criteria: {
          ...validRequest.criteria,
          timeframe: {
            start: '2024-12-31',
            end: '2024-01-01' // End before start
          }
        }
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/academic-integrity/reports/generate',
        payload: invalidTimeframeRequest
      });

      expect(response.statusCode).toBe(500); // Service will reject invalid timeframe
    });

    it('should require educational justification for individual data', async () => {
      const individualDataRequest = {
        ...validRequest,
        criteria: {
          ...validRequest.criteria,
          includeIndividualData: true
        },
        privacyContext: {
          ...validRequest.privacyContext,
          educationalJustification: undefined
        }
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/academic-integrity/reports/generate',
        payload: individualDataRequest
      });

      expect(response.statusCode).toBe(500); // Service will reject missing justification
    });
  });

  describe('GET /api/academic-integrity/health', () => {
    it('should return health status', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/academic-integrity/health'
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.status).toBe('healthy');
      expect(result.service).toBe('academic-integrity');
      expect(result.timestamp).toBeDefined();
      expect(Array.isArray(result.capabilities)).toBe(true);
      expect(result.capabilities).toContain('ai-assistance-detection');
      expect(result.capabilities).toContain('academic-integrity-analysis');
      expect(result.capabilities).toContain('educational-ai-validation');
      expect(result.capabilities).toContain('integrity-reporting');
    });
  });

  describe('GET /api/academic-integrity/tools', () => {
    it('should list available tools', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/academic-integrity/tools'
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(Array.isArray(result.tools)).toBe(true);
      expect(result.tools).toHaveLength(4);
      
      const toolNames = result.tools.map((tool: any) => tool.name);
      expect(toolNames).toContain('detect_ai_assistance_levels');
      expect(toolNames).toContain('analyze_academic_integrity');
      expect(toolNames).toContain('validate_educational_ai_use');
      expect(toolNames).toContain('generate_integrity_reports');
      
      result.tools.forEach((tool: any) => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.category).toBeDefined();
        expect(tool.privacyAware).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service failures gracefully', async () => {
      // Force service to throw error by passing invalid data
      const invalidRequest = {
        studentId: '', // Empty student ID should cause error
        assignmentId: 'assignment-456',
        content: 'test content',
        privacyContext: {
          requesterId: 'educator-789',
          requesterType: 'educator' as const,
          purpose: 'academic_integrity_monitoring'
        }
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/academic-integrity/ai-assistance/detect',
        payload: invalidRequest
      });

      expect(response.statusCode).toBe(500);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.message).toBeDefined();
    });

    it('should handle malformed JSON', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/academic-integrity/ai-assistance/detect',
        payload: 'invalid json',
        headers: {
          'content-type': 'application/json'
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Privacy and Security', () => {
    it('should reject requests without privacy context', async () => {
      const requestWithoutPrivacy = {
        studentId: 'student-123',
        assignmentId: 'assignment-456',
        content: 'test content'
        // Missing privacyContext
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/academic-integrity/ai-assistance/detect',
        payload: requestWithoutPrivacy
      });

      expect(response.statusCode).toBe(400);
    });

    it('should validate requester permissions', async () => {
      const studentRequest = {
        studentId: 'student-123',
        assignmentId: 'assignment-456',
        content: 'test content',
        privacyContext: {
          requesterId: 'different-student-456',
          requesterType: 'student' as const,
          purpose: 'academic_integrity_monitoring'
        }
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/academic-integrity/ai-assistance/detect',
        payload: studentRequest
      });

      expect(response.statusCode).toBe(500); // Service should reject invalid permissions
    });
  });

  describe('Performance', () => {
    it('should complete AI detection within reasonable time', async () => {
      const startTime = Date.now();
      
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/academic-integrity/ai-assistance/detect',
        payload: {
          studentId: 'student-123',
          assignmentId: 'assignment-456',
          content: 'This is a longer piece of content that requires more processing time to analyze for AI assistance patterns and educational context.',
          privacyContext: {
            requesterId: 'educator-789',
            requesterType: 'educator' as const,
            purpose: 'academic_integrity_monitoring',
            educationalJustification: 'Performance testing for AI detection'
          }
        }
      });
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(response.statusCode).toBe(200);
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
    });
  });
});