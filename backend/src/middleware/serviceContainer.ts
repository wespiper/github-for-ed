import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { initializeServiceFactory, getServiceFactory, ServiceFactory } from '../container/repositories';

/**
 * Service Container Middleware
 * Initializes and provides access to services with dependency injection
 */

declare global {
  namespace Express {
    interface Request {
      serviceFactory?: ServiceFactory;
      aiService?: {
        boundaryService: any;
        educationalService: any;
      };
      mcpClient?: any; // Add MCP client to request
    }
  }
}

let globalServiceFactory: ServiceFactory | null = null;

/**
 * Initialize service container with Prisma client
 */
export function initializeServices(prisma: PrismaClient): ServiceFactory {
  if (!globalServiceFactory) {
    globalServiceFactory = initializeServiceFactory(prisma);
    console.log('✅ Service container initialized with repository pattern');
  }
  return globalServiceFactory;
}

/**
 * Middleware to attach service factory to request
 */
export function attachServices(req: Request, res: Response, next: NextFunction): void {
  try {
    if (!globalServiceFactory) {
      res.status(500).json({ 
        message: 'Service container not initialized' 
      });
      return;
    }

    req.serviceFactory = globalServiceFactory;
    
    // Attach commonly used services for convenience
    req.aiService = {
      boundaryService: globalServiceFactory.createAIBoundaryService(),
      educationalService: globalServiceFactory.createEducationalAIService()
    };

    next();
  } catch (error) {
    console.error('Error attaching services:', error);
    res.status(500).json({ 
      message: 'Failed to initialize request services',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

/**
 * Get service factory instance (for use in non-request contexts)
 */
export function getServices(): ServiceFactory {
  if (!globalServiceFactory) {
    throw new Error('Service container not initialized. Call initializeServices first.');
  }
  return globalServiceFactory;
}

/**
 * Health check for service container
 */
export async function healthCheckServices(): Promise<{
  healthy: boolean;
  services: Record<string, boolean>;
  repositories: Record<string, boolean>;
}> {
  try {
    if (!globalServiceFactory) {
      return {
        healthy: false,
        services: { serviceFactory: false },
        repositories: {}
      };
    }

    // Test service creation
    const services: Record<string, boolean> = {};
    let allServicesHealthy = true;

    try {
      globalServiceFactory.createAIBoundaryService();
      services.aiBoundaryService = true;
    } catch (error) {
      console.error('AIBoundaryService health check failed:', error);
      services.aiBoundaryService = false;
      allServicesHealthy = false;
    }

    try {
      globalServiceFactory.createEducationalAIService();
      services.educationalAIService = true;
    } catch (error) {
      console.error('EducationalAIService health check failed:', error);
      services.educationalAIService = false;
      allServicesHealthy = false;
    }

    // Test repository health (this would require access to the container)
    const repositories = {
      student: true, // Simplified for now
      assignment: true,
      aiInteraction: true
    };

    return {
      healthy: allServicesHealthy,
      services,
      repositories
    };
  } catch (error) {
    console.error('Service health check failed:', error);
    return {
      healthy: false,
      services: { error: false },
      repositories: { error: false }
    };
  }
}

/**
 * Reset service container (useful for testing)
 */
export function resetServices(): void {
  globalServiceFactory = null;
  console.log('🔄 Service container reset');
}