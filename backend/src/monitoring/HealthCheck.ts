/**
 * Service health checks and monitoring
 */

import { ServiceFactory } from '../container/ServiceFactory';
import prisma from '../lib/prisma';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  services: {
    [key: string]: {
      status: 'up' | 'down' | 'degraded';
      responseTime?: number;
      error?: string;
      details?: any;
    };
  };
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

export class HealthCheck {
  private static startTime = Date.now();

  /**
   * Perform comprehensive health check
   */
  static async check(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkCache(),
      this.checkMessageQueue(),
      this.checkEventBus()
    ]);

    const services: HealthStatus['services'] = {};
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Process results
    const serviceNames = ['database', 'cache', 'messageQueue', 'eventBus'];
    checks.forEach((result, index) => {
      const serviceName = serviceNames[index];
      
      if (result.status === 'fulfilled') {
        services[serviceName] = result.value;
        
        if (result.value.status === 'down') {
          overallStatus = 'unhealthy';
        } else if (result.value.status === 'degraded' && overallStatus !== 'unhealthy') {
          overallStatus = 'degraded';
        }
      } else {
        services[serviceName] = {
          status: 'down',
          error: result.reason?.message || 'Unknown error'
        };
        overallStatus = 'unhealthy';
      }
    });

    // Memory usage
    const memUsage = process.memoryUsage();
    const memory = {
      used: Math.round(memUsage.heapUsed / 1024 / 1024),
      total: Math.round(memUsage.heapTotal / 1024 / 1024),
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
    };

    return {
      status: overallStatus,
      timestamp: new Date(),
      services,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      memory
    };
  }

  /**
   * Check database connectivity
   */
  private static async checkDatabase(): Promise<any> {
    const start = Date.now();
    
    try {
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;
      
      return {
        status: responseTime > 1000 ? 'degraded' : 'up',
        responseTime,
        details: {
          connected: true,
          latency: `${responseTime}ms`
        }
      };
    } catch (error) {
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Database connection failed',
        responseTime: Date.now() - start
      };
    }
  }

  /**
   * Check cache service
   */
  private static async checkCache(): Promise<any> {
    const start = Date.now();
    const serviceFactory = ServiceFactory.getInstance();
    
    try {
      const cache = serviceFactory.getCache();
      const testKey = '__health_check__';
      const testValue = { timestamp: Date.now() };
      
      await cache.set(testKey, testValue, { ttl: 10 });
      const retrieved = await cache.get(testKey);
      await cache.delete(testKey);
      
      const responseTime = Date.now() - start;
      const isHealthy = (retrieved as any)?.timestamp === testValue.timestamp;
      
      return {
        status: isHealthy ? (responseTime > 500 ? 'degraded' : 'up') : 'down',
        responseTime,
        details: {
          connected: isHealthy,
          latency: `${responseTime}ms`
        }
      };
    } catch (error) {
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Cache service failed',
        responseTime: Date.now() - start
      };
    }
  }

  /**
   * Check message queue
   */
  private static async checkMessageQueue(): Promise<any> {
    const start = Date.now();
    const serviceFactory = ServiceFactory.getInstance();
    
    try {
      const messageQueue = serviceFactory.getMessageQueue();
      const isConnected = messageQueue.isConnected();
      const responseTime = Date.now() - start;
      
      if (!isConnected) {
        return {
          status: 'down',
          error: 'Message queue not connected',
          responseTime
        };
      }
      
      // Check queue stats
      const stats = await messageQueue.getQueueStats('__health_check__').catch(() => null);
      
      return {
        status: responseTime > 500 ? 'degraded' : 'up',
        responseTime,
        details: {
          connected: true,
          latency: `${responseTime}ms`,
          queueStats: stats
        }
      };
    } catch (error) {
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Message queue failed',
        responseTime: Date.now() - start
      };
    }
  }

  /**
   * Check event bus
   */
  private static async checkEventBus(): Promise<any> {
    const start = Date.now();
    const serviceFactory = ServiceFactory.getInstance();
    
    try {
      const eventBus = serviceFactory.getEventBus();
      const eventTypes = eventBus.getRegisteredEventTypes();
      const responseTime = Date.now() - start;
      
      return {
        status: 'up',
        responseTime,
        details: {
          registeredEvents: eventTypes.length,
          eventTypes: eventTypes.slice(0, 10) // First 10 for brevity
        }
      };
    } catch (error) {
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Event bus failed',
        responseTime: Date.now() - start
      };
    }
  }

  /**
   * Express route handler
   */
  static async handler(req: any, res: any): Promise<void> {
    try {
      const health = await HealthCheck.check();
      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 503 : 500;
      
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Health check failed'
      });
    }
  }
}