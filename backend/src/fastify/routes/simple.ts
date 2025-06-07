import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Type } from '@sinclair/typebox';

/**
 * Simple test route to verify Fastify registration pattern
 * This serves as a template for fixing other migrated routes
 */
export default async function simpleRoutes(fastify: FastifyInstance) {
  
  // Simple GET route
  fastify.get('/hello', {
    schema: {
      response: {
        200: Type.Object({
          message: Type.String(),
          timestamp: Type.String()
        })
      }
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      reply.send({
        message: 'Hello from migrated Fastify route!',
        timestamp: new Date().toISOString()
      });
    }
  });

  // POST route with body validation
  fastify.post('/echo', {
    schema: {
      body: Type.Object({
        message: Type.String()
      }),
      response: {
        200: Type.Object({
          echo: Type.String(),
          received: Type.String()
        })
      }
    },
    handler: async (request: FastifyRequest<{ Body: { message: string } }>, reply: FastifyReply) => {
      const { message } = request.body;
      reply.send({
        echo: message,
        received: new Date().toISOString()
      });
    }
  });

  // Route with parameters
  fastify.get('/item/:id', {
    schema: {
      params: Type.Object({
        id: Type.String()
      }),
      response: {
        200: Type.Object({
          id: Type.String(),
          found: Type.Boolean()
        })
      }
    },
    handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      reply.send({
        id,
        found: true
      });
    }
  });
}