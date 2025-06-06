import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import rateLimit from '@fastify/rate-limit';
import { DistributedServicesManager } from '../services/integration/DistributedServicesManager';

let distributedServicesManager: DistributedServicesManager | null = null;

export async function buildFastifyServer(enableDistributedServices: boolean = true): Promise<FastifyInstance> {
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

  // Initialize distributed services if enabled
  if (enableDistributedServices) {
    distributedServicesManager = new DistributedServicesManager(fastify, {
      gateway: { enabled: true },
      monitoring: { enabled: true },
      orchestration: { enabled: true }
    });
    
    await distributedServicesManager.initialize();
    
    // Add distributed services health to main health check
    fastify.get('/health', async (request, reply) => {
      const systemHealth = distributedServicesManager?.getSystemHealth();
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        server: 'fastify',
        distributedServices: systemHealth ? {
          status: systemHealth.status,
          services: systemHealth.services,
          healthyServices: systemHealth.healthyServices,
          components: systemHealth.components
        } : 'disabled'
      };
    });
  } else {
    // Standard health check endpoint
    fastify.get('/health', async (request, reply) => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        server: 'fastify',
        distributedServices: 'disabled'
      };
    });
  }

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
    
    // Shutdown distributed services first
    if (distributedServicesManager) {
      await distributedServicesManager.shutdown();
    }
    
    await fastify.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    fastify.log.info('SIGTERM received, shutting down gracefully...');
    
    // Shutdown distributed services first
    if (distributedServicesManager) {
      await distributedServicesManager.shutdown();
    }
    
    await fastify.close();
    process.exit(0);
  });

  return fastify;
}

// Export distributed services manager for external access
export function getDistributedServicesManager(): DistributedServicesManager | null {
  return distributedServicesManager;
}