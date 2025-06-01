import { FastifyInstance } from 'fastify';
import { buildFastifyServer } from './server';
import authRoutes from './routes/auth';
import aiRoutes from './routes/ai';

export async function createFastifyApp(): Promise<FastifyInstance> {
  const fastify = await buildFastifyServer();

  // Register routes
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(aiRoutes, { prefix: '/api/ai' });

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