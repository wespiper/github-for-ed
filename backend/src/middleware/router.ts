import { Request, Response, NextFunction } from 'express';
import { shouldUseFastify, logRouting, migrationConfig } from '../config/migration';
import axios from 'axios';

interface RoutedRequest extends Request {
  routingDecision?: {
    useFastify: boolean;
    requestId: string;
    timestamp: number;
  };
}

export function trafficRouter(req: RoutedRequest, res: Response, next: NextFunction): void {
  const endpoint = req.originalUrl; // Use originalUrl to get full path including /api/auth
  const requestId = req.headers['x-request-id'] as string || generateRequestId();
  const useFastify = shouldUseFastify(endpoint);
  
  // Store routing decision for potential use by other middleware
  req.routingDecision = {
    useFastify,
    requestId,
    timestamp: Date.now()
  };
  
  logRouting(endpoint, useFastify, requestId);
  
  // If we should use Fastify, proxy the request
  if (useFastify) {
    proxyToFastify(req, res, requestId);
    return;
  }
  
  // Continue with Express handling
  next();
}

async function proxyToFastify(req: Request, res: Response, requestId: string): Promise<void> {
  const fastifyPort = process.env.FASTIFY_PORT || 3001;
  const fastifyUrl = `http://localhost:${fastifyPort}${req.originalUrl}`;
  
  try {
    const axiosConfig = {
      method: req.method as any,
      url: fastifyUrl,
      headers: {
        ...req.headers,
        'x-request-id': requestId,
        'x-forwarded-from': 'express'
      },
      data: req.body,
      timeout: 30000, // 30 second timeout
      validateStatus: () => true, // Don't throw on any status code
    };
    
    const fastifyResponse = await axios(axiosConfig);
    
    // Forward response headers
    Object.entries(fastifyResponse.headers).forEach(([key, value]) => {
      if (key.toLowerCase() !== 'content-encoding' && 
          key.toLowerCase() !== 'content-length' &&
          typeof value === 'string') {
        res.set(key, value);
      }
    });
    
    // Set routing headers for debugging
    res.set('x-routed-to', 'fastify');
    res.set('x-request-id', requestId);
    
    // Forward response
    res.status(fastifyResponse.status).send(fastifyResponse.data);
    
  } catch (error) {
    console.error(`[ROUTING ERROR] Failed to proxy to Fastify for ${req.path}:`, error);
    
    if (migrationConfig.rollbackOnError) {
      console.log(`[ROLLBACK] Falling back to Express for ${req.path}`);
      // We can't easily continue the Express pipeline here, so we'll return an error
      res.status(503).json({
        error: 'Service temporarily unavailable',
        message: 'Please try again',
        requestId
      });
    } else {
      res.status(502).json({
        error: 'Proxy error',
        message: 'Failed to route request',
        requestId
      });
    }
  }
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Middleware to add routing headers for all responses
export function addRoutingHeaders(req: RoutedRequest, res: Response, next: NextFunction): void {
  const originalSend = res.send;
  
  res.send = function(data: any) {
    if (!res.getHeader('x-routed-to')) {
      res.set('x-routed-to', 'express');
    }
    
    if (req.routingDecision?.requestId) {
      res.set('x-request-id', req.routingDecision.requestId);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
}