import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import { verifyToken, extractTokenFromHeader } from '../../utils/jwt';
import prisma from '../../lib/prisma';

// Authentication middleware
async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = extractTokenFromHeader(request.headers.authorization || '');
    if (!token) {
      return reply.status(401).send({ error: 'Authentication required' });
    }
    
    const payload = verifyToken(token);
    (request as any).userId = payload.userId;
    (request as any).user = payload;
  } catch (error) {
    return reply.status(401).send({ error: 'Invalid token' });
  }
}

// Role-based access control
function requireRole(roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    if (!user || !roles.includes(user.role)) {
      return reply.status(403).send({ error: 'Insufficient permissions' });
    }
  };
}

// TypeBox Schemas
const SwitchRoleSchema = Type.Object({
  targetUserId: Type.String(),
  newRole: Type.Union([
    Type.Literal('student'),
    Type.Literal('educator'),
    Type.Literal('admin')
  ]),
  reason: Type.Optional(Type.String()),
  temporary: Type.Optional(Type.Boolean()),
  expiresAt: Type.Optional(Type.String({ format: 'date-time' }))
});

const ToggleRoleSchema = Type.Object({
  targetRole: Type.Union([
    Type.Literal('student'),
    Type.Literal('educator')
  ])
});

const SuccessResponseSchema = Type.Object({
  message: Type.String(),
  data: Type.Any()
});

const ErrorResponseSchema = Type.Object({
  error: Type.String()
});

export default async function adminRoutes(fastify: FastifyInstance) {
  // Switch user role (admin only)
  fastify.post('/switch-role', {
    schema: {
      body: SwitchRoleSchema,
      response: {
        200: SuccessResponseSchema,
        400: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate, requireRole(['admin'])],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { targetUserId, newRole, reason, temporary, expiresAt } = request.body as any;
      const adminUserId = (request as any).userId;

      // Verify target user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true
        }
      });

      if (!targetUser) {
        return reply.status(404).send({ error: 'Target user not found' });
      }

      if (targetUser.role === newRole) {
        return reply.status(400).send({ error: `User already has role: ${newRole}` });
      }

      // Log the role change (simplified - using console for now)
      console.log(`[ADMIN AUDIT] Role change: ${targetUser.email} from ${targetUser.role} to ${newRole} by admin ${adminUserId}`);
      
      // TODO: Implement proper audit logging when auditLog table is available

      // Update user role
      const updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: { role: newRole },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          updatedAt: true
        }
      });

      // If temporary role change, schedule reversal (simplified - using console for now)
      if (temporary && expiresAt) {
        console.log(`[ADMIN SCHEDULE] Temporary role change scheduled: ${targetUser.email} will revert from ${newRole} to ${targetUser.role} at ${expiresAt}`);
        // TODO: Implement proper role scheduling when roleChangeSchedule table is available
      }

      reply.send({
        message: 'User role updated successfully',
        data: {
          user: updatedUser,
          changes: {
            from: targetUser.role,
            to: newRole,
            temporary: temporary || false,
            reason: reason || 'Admin role change'
          }
        }
      });
    } catch (error) {
      console.error('Error switching user role:', error);
      reply.status(500).send({ error: 'Failed to switch user role' });
    }
  }
  });

  // Toggle own role between student and educator
  fastify.post('/toggle-my-role', {
    schema: {
      body: ToggleRoleSchema,
      response: {
        200: SuccessResponseSchema,
        400: ErrorResponseSchema,
        403: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { targetRole } = request.body as any;
      const userId = (request as any).userId;
      const currentUser = (request as any).user;

      // Only allow toggling between student and educator
      if (!['student', 'educator'].includes(targetRole)) {
        return reply.status(400).send({ error: 'Can only toggle between student and educator roles' });
      }

      if (currentUser.role === 'admin') {
        return reply.status(403).send({ error: 'Admins cannot toggle their role' });
      }

      if (currentUser.role === targetRole) {
        return reply.status(400).send({ error: `Already have role: ${targetRole}` });
      }

      // Log the self role change (simplified - using console for now)
      console.log(`[ADMIN AUDIT] Self role toggle: ${currentUser.email} from ${currentUser.role} to ${targetRole}`);
      
      // TODO: Implement proper audit logging when auditLog table is available

      // Update user role
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role: targetRole },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          updatedAt: true
        }
      });

      reply.send({
        message: 'Role toggled successfully',
        data: {
          user: updatedUser,
          previousRole: currentUser.role,
          newRole: targetRole
        }
      });
    } catch (error) {
      console.error('Error toggling user role:', error);
      reply.status(500).send({ error: 'Failed to toggle role' });
    }
  }
  });

  // Get all users (admin only)
  fastify.get('/users', {
    schema: {
      querystring: Type.Object({
        role: Type.Optional(Type.String()),
        search: Type.Optional(Type.String()),
        page: Type.Optional(Type.Number({ minimum: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
        sortBy: Type.Optional(Type.Union([
          Type.Literal('createdAt'),
          Type.Literal('lastName'),
          Type.Literal('email'),
          Type.Literal('role')
        ])),
        sortOrder: Type.Optional(Type.Union([
          Type.Literal('asc'),
          Type.Literal('desc')
        ]))
      }),
      response: {
        200: SuccessResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate, requireRole(['admin'])],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { 
        role, 
        search, 
        page = 1, 
        limit = 20, 
        sortBy = 'createdAt', 
        sortOrder = 'desc' 
      } = request.query as any;

      const where: any = {};
      
      // Filter by role
      if (role) {
        where.role = role;
      }

      // Search filter
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }

      const skip = (page - 1) * limit;
      const orderBy = { [sortBy]: sortOrder };

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                enrollments: true,
                submissions: true
              }
            }
          }
        }),
        prisma.user.count({ where })
      ]);

      // Get role distribution
      const roleDistribution = await prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      });

      reply.send({
        message: 'Users retrieved successfully',
        data: {
          users,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          },
          roleDistribution: roleDistribution.reduce((acc, item) => {
            acc[item.role] = item._count.role;
            return acc;
          }, {} as Record<string, number>)
        }
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      reply.status(500).send({ error: 'Failed to fetch users' });
    }
  }
  });

  // View API endpoints (admin only)
  fastify.get('/api-endpoints', {
    schema: {
      response: {
        200: SuccessResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate, requireRole(['admin'])],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Get all registered routes from Fastify
      const routes = fastify.printRoutes({ includeHooks: false, includeMeta: false });
      
      // Parse routes into structured format
      const parsedRoutes = routes
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const match = line.match(/^(\S+)\s+(.+)$/);
          if (match) {
            const [, method, path] = match;
            return {
              method: method.trim(),
              path: path.trim(),
              category: path.startsWith('/api/') ? 
                path.split('/')[2] || 'unknown' : 'system'
            };
          }
          return null;
        })
        .filter(Boolean);

      // Group by category
      const groupedRoutes = parsedRoutes.reduce((acc, route) => {
        if (!route) return acc;
        
        const category = route.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push({
          method: route.method,
          path: route.path
        });
        return acc;
      }, {} as Record<string, Array<{ method: string; path: string }>>);

      // Get route statistics
      const stats = {
        totalRoutes: parsedRoutes.length,
        routesByMethod: parsedRoutes.reduce((acc, route) => {
          if (!route) return acc;
          acc[route.method] = (acc[route.method] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        routesByCategory: Object.keys(groupedRoutes).reduce((acc, category) => {
          acc[category] = groupedRoutes[category].length;
          return acc;
        }, {} as Record<string, number>)
      };

      reply.send({
        message: 'API endpoints retrieved successfully',
        data: {
          routes: groupedRoutes,
          statistics: stats,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error fetching API endpoints:', error);
      reply.status(500).send({ error: 'Failed to fetch API endpoints' });
    }
  }
  });
}