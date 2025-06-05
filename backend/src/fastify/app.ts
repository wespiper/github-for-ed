import { FastifyInstance } from 'fastify';
import { buildFastifyServer } from './server';
import authRoutes from './routes/auth';
import aiRoutes from './routes/ai';
import educatorAlertsRoutes from './routes/educatorAlerts';
import educationalAIValidatorRoutes from './routes/educationalAIValidator';
import academicIntegrityRoutes from './routes/academicIntegrity';
import { analyticsRoutes } from './routes/analytics';
import { studentProfilingRoutes } from './routes/studentProfiling';

// Newly migrated routes
import assignmentRoutes from './routes/assignments';
import courseRoutes from './routes/courses';
import documentRoutes from './routes/documents';
import submissionRoutes from './routes/submissions';
import notificationRoutes from './routes/notifications';
import adminRoutes from './routes/admin';
import courseAssignmentRoutes from './routes/courseAssignments';
import assignmentTemplateRoutes from './routes/assignmentTemplates';
import reflectionRoutes from './routes/reflections';
import learningObjectiveRoutes from './routes/learningObjectives';
import boundaryIntelligenceRoutes from './routes/boundaryIntelligence';

export async function createFastifyApp(): Promise<FastifyInstance> {
  const fastify = await buildFastifyServer();

  // Register existing routes
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(aiRoutes, { prefix: '/api/ai' });
  await fastify.register(educatorAlertsRoutes, { prefix: '/api/educator-alerts' });
  await fastify.register(educationalAIValidatorRoutes, { prefix: '/api/educational-ai-validator' });
  await fastify.register(academicIntegrityRoutes, { prefix: '/api/academic-integrity' });
  await fastify.register(analyticsRoutes, { prefix: '/api/analytics' });
  // TODO: Temporarily disabled StudentProfiling route to focus on core migration testing
  // await fastify.register(studentProfilingRoutes, { prefix: '/api/student-profiling' });

  // Register newly migrated and FIXED routes
  // Core routes - ALL TypeScript errors fixed!
  
  // Simple test route to verify registration pattern works
  await fastify.register(async function testRoutes(fastify: FastifyInstance) {
    fastify.get('/test', {
      schema: {
        response: {
          200: { type: 'object', properties: { message: { type: 'string' } } }
        }
      },
      handler: async (request, reply) => {
        reply.send({ message: 'Fastify route registration working!' });
      }
    });
  }, { prefix: '/api' });

  // Register simple working example routes
  const simpleRoutes = await import('./routes/simple');
  await fastify.register(simpleRoutes.default, { prefix: '/api/simple' });
  
  // Register CONFIRMED WORKING routes
  await fastify.register(learningObjectiveRoutes, { prefix: '/api/learning-objectives' });
  await fastify.register(adminRoutes, { prefix: '/api/admin' });
  await fastify.register(assignmentTemplateRoutes, { prefix: '/api/assignment-templates' });
  
  // Additional routes ready for testing
  await fastify.register(notificationRoutes, { prefix: '/api/notifications' });
  
  // CORE ROUTES - ALL TYPESCRIPT ERRORS FIXED!
  await fastify.register(assignmentRoutes, { prefix: '/api/assignments' });
  await fastify.register(courseRoutes, { prefix: '/api/courses' });
  await fastify.register(submissionRoutes, { prefix: '/api/submissions' });
  await fastify.register(reflectionRoutes, { prefix: '/api/reflections' });
  
  // Additional functional routes
  await fastify.register(documentRoutes, { prefix: '/api/documents' });
  await fastify.register(boundaryIntelligenceRoutes, { prefix: '/api/boundary-intelligence' });

  return fastify;
}

export async function startFastifyServer(port: number = 3001): Promise<FastifyInstance> {
  const fastify = await createFastifyApp();

  try {
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Fastify server listening on port ${port}`);
    return fastify;
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}