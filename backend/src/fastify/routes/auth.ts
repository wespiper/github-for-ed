import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../../services';
import { RegisterInput, LoginInput, UpdateProfileInput } from '@shared/types';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '../../utils/jwt';
import { User } from '@prisma/client';
import prisma from '../../lib/prisma';

// Type definitions
interface AuthenticatedRequest extends FastifyRequest {
  user?: User;
  userId?: string;
  userRole?: string;
}

// Schemas for validation
const registerSchema = {
  body: {
    type: 'object',
    required: ['email', 'password', 'firstName', 'lastName', 'role'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 },
      firstName: { type: 'string', minLength: 1 },
      lastName: { type: 'string', minLength: 1 },
      role: { type: 'string', enum: ['student', 'educator', 'admin'] }
    }
  }
};

const loginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 1 }
    }
  }
};

const updateProfileSchema = {
  body: {
    type: 'object',
    properties: {
      firstName: { type: 'string', minLength: 1 },
      lastName: { type: 'string', minLength: 1 },
      email: { type: 'string', format: 'email' }
    }
  }
};

// Authentication hook
async function authenticate(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
    const token = extractTokenFromHeader(request.headers.authorization);
    
    if (!token) {
      throw new Error('Access token required');
    }

    const decoded: JWTPayload = verifyToken(token);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user) {
      throw new Error('User not found');
    }

    request.user = user;
    request.userId = user.id;
    request.userRole = user.role;
  } catch (error) {
    reply.code(401).send({ error: 'Invalid or expired token' });
    return;
  }
}

export default async function authRoutes(fastify: FastifyInstance) {
  // Register new user
  fastify.post('/register', {
    schema: registerSchema,
    handler: async (request: FastifyRequest<{ Body: RegisterInput }>, reply: FastifyReply) => {
      try {
        const registrationData = request.body;
        const authResponse = await AuthService.registerUser(registrationData);

        reply.code(201).send(authResponse);
      } catch (error) {
        fastify.log.error('Registration error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        const statusCode = message.includes('already exists') ? 409 : 
                          message.includes('required') || message.includes('must') ? 400 : 500;
        reply.code(statusCode).send({ error: message });
      }
    }
  });

  // Login user
  fastify.post('/login', {
    schema: loginSchema,
    handler: async (request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) => {
      try {
        const loginData = request.body;
        const authResponse = await AuthService.authenticateUser(loginData);

        reply.send(authResponse);
      } catch (error) {
        fastify.log.error('Login error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        const statusCode = message.includes('Invalid') ? 401 : 
                          message.includes('required') ? 400 : 500;
        reply.code(statusCode).send({ error: message });
      }
    }
  });

  // Get current user profile (protected route)
  fastify.get('/profile', {
    preHandler: authenticate,
    handler: async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const userId = request.userId!;
        const userProfile = await AuthService.getUserProfile(userId);

        reply.send(userProfile);
      } catch (error) {
        fastify.log.error('Profile error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        const statusCode = message.includes('not found') ? 404 : 500;
        reply.code(statusCode).send({ error: message });
      }
    }
  });

  // Update user profile (protected route)
  fastify.put('/profile', {
    schema: updateProfileSchema,
    preHandler: authenticate
  }, async (request: any, reply: FastifyReply) => {
      try {
        const userId = request.userId!;
        const updateData = request.body;

        const result = await AuthService.updateUserProfile(userId, updateData);

        reply.send({
          message: 'Profile updated successfully',
          ...result
        });
      } catch (error) {
        fastify.log.error('Profile update error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        const statusCode = message.includes('not found') ? 404 : 
                          message.includes('exceed') || message.includes('required') ? 400 : 500;
        reply.code(statusCode).send({ error: message });
      }
    });

  // Token verification endpoint
  fastify.post('/verify', {
    schema: {
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string' }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Body: { token: string } }>, reply: FastifyReply) => {
      try {
        const { token } = request.body;
        const decoded: JWTPayload = verifyToken(token);
        
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            createdAt: true,
            updatedAt: true
          }
        });
        
        if (!user) {
          reply.code(401).send({ error: 'User not found' });
          return;
        }

        reply.send({
          valid: true,
          user,
          decoded
        });
      } catch (error) {
        fastify.log.error('Token verification error:', error);
        reply.code(401).send({ 
          valid: false, 
          error: 'Invalid or expired token' 
        });
      }
    }
  });
}