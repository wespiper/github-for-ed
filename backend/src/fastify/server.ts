import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import rateLimit from '@fastify/rate-limit';

export async function buildFastifyServer(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: true,
    trustProxy: true,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    disableRequestLogging: false,
    bodyLimit: 5 * 1024 * 1024, // 5MB
  });

  // Register core plugins
  await fastify.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: false, // We'll configure CSP separately for our SPA
  });

  await fastify.register(compress, {
    global: true,
    threshold: 1024, // Only compress responses larger than 1KB
    encodings: ['gzip', 'deflate'],
  });

  await fastify.register(rateLimit, {
    global: false, // We'll apply rate limiting per route
    max: 100,
    timeWindow: '1 minute',
  });

  // Health check endpoint
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      server: 'fastify',
    };
  });

  // Error handling
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? 'Internal Server Error' : error.message;
    
    reply.status(statusCode).send({
      error: {
        message,
        statusCode,
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
      },
    });
  });

  // Not found handler
  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: {
        message: 'Route not found',
        statusCode: 404,
      },
    });
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    fastify.log.info('SIGINT received, shutting down gracefully...');
    await fastify.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    fastify.log.info('SIGTERM received, shutting down gracefully...');
    await fastify.close();
    process.exit(0);
  });

  return fastify;
}