import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { initializeServiceFactory, getServiceFactory, ServiceFactory } from '../container/repositories';
import { ResilientWritingAnalysisMCPClient } from '../services/mcp/ResilientWritingAnalysisMCPClient';

/**
 * Enhanced Service Container Middleware with Resilient MCP Client
 * Provides high-availability writing analysis services with fallback
 */

declare global {
  namespace Express {
    interface Request {
      serviceFactory?: ServiceFactory;
      aiService?: {
        boundaryService: any;
        educationalService: any;
      };
      mcpClient?: ResilientWritingAnalysisMCPClient;
    }
  }
}

let globalServiceFactory: ServiceFactory | null = null;
let globalMCPClient: ResilientWritingAnalysisMCPClient | null = null;

/**
 * Initialize service container with Prisma client and MCP client
 */
export function initializeEnhancedServices(prisma: PrismaClient): {
  serviceFactory: ServiceFactory;
  mcpClient: ResilientWritingAnalysisMCPClient;
} {
  if (!globalServiceFactory) {
    globalServiceFactory = initializeServiceFactory(prisma);
    console.log('✅ Service container initialized with repository pattern');
  }

  if (!globalMCPClient) {
    globalMCPClient = new ResilientWritingAnalysisMCPClient();
    // Initialize the module (registers circuit breaker)
    globalMCPClient.onModuleInit().catch((error) => {
      console.error('❌ Failed to initialize MCP client:', error);
    });
    console.log('✅ Resilient MCP client initialized with circuit breaker');
  }

  return {
    serviceFactory: globalServiceFactory,
    mcpClient: globalMCPClient,
  };
}

/**
 * Enhanced middleware with resilient MCP client
 */
export function attachEnhancedServices(req: Request, res: Response, next: NextFunction): void {
  try {
    if (!globalServiceFactory || !globalMCPClient) {
      res.status(500).json({ 
        message: 'Enhanced service container not initialized' 
      });
      return;
    }

    req.serviceFactory = globalServiceFactory;
    req.mcpClient = globalMCPClient;
    
    // Attach commonly used services for convenience
    req.aiService = {
      boundaryService: globalServiceFactory.getBoundaryService(),
      educationalService: globalServiceFactory.getEducationalService(),
    };

    next();
  } catch (error) {
    console.error('Error in enhanced service middleware:', error);
    res.status(500).json({ 
      message: 'Service attachment failed',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

/**
 * Get services (backwards compatibility)
 */
export function getEnhancedServices(): {
  serviceFactory: ServiceFactory | null;
  mcpClient: ResilientWritingAnalysisMCPClient | null;
} {
  return {
    serviceFactory: globalServiceFactory,
    mcpClient: globalMCPClient,
  };
}

/**
 * Health check for all services
 */
export async function servicesHealthCheck(): Promise<{
  serviceFactory: boolean;
  mcpClient: any;
  overall: boolean;
}> {
  const serviceFactoryHealth = !!globalServiceFactory;
  
  let mcpHealth;
  try {
    mcpHealth = globalMCPClient ? await globalMCPClient.healthCheck() : { healthy: false, error: 'Not initialized' };
  } catch (error) {
    mcpHealth = { healthy: false, error: (error as Error).message };
  }

  return {
    serviceFactory: serviceFactoryHealth,
    mcpClient: mcpHealth,
    overall: serviceFactoryHealth && (mcpHealth.healthy || mcpHealth.fallbackAvailable),
  };
}

/**
 * Graceful shutdown
 */
export async function shutdownEnhancedServices(): Promise<void> {
  if (globalMCPClient) {
    try {
      await globalMCPClient.onModuleDestroy();
      console.log('✅ MCP client shut down gracefully');
    } catch (error) {
      console.error('❌ Error shutting down MCP client:', error);
    }
  }

  globalServiceFactory = null;
  globalMCPClient = null;
}