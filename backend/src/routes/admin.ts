import express, { Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Switch user role (admin only)
router.post('/switch-role', authenticate, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId, newRole } = req.body;

    // Validation
    if (!userId || !newRole) {
      res.status(400).json({ error: 'userId and newRole are required' });
      return;
    }

    if (!['student', 'educator'].includes(newRole)) {
      res.status(400).json({ error: 'Role must be either student or educator' });
      return;
    }

    // Find the user to switch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Don't allow switching admin roles
    if (user.role === 'admin') {
      res.status(403).json({ error: 'Cannot switch admin roles' });
      return;
    }

    // Update the role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole as 'student' | 'educator' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        profilePicture: true,
        bio: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const userResponse = {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: updatedUser.role,
      profilePicture: updatedUser.profilePicture,
      bio: updatedUser.bio,
      isVerified: updatedUser.isVerified,
      createdAt: updatedUser.createdAt
    };

    res.json({
      message: `User role switched to ${newRole}`,
      user: userResponse
    });
  } catch (error) {
    console.error('Switch role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle current user's role between student and educator
router.post('/toggle-my-role', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const currentUser = req.user!;

    // Don't allow admins to toggle their own role
    if (currentUser.role === 'admin') {
      res.status(403).json({ error: 'Admins cannot toggle their own role' });
      return;
    }

    // Toggle between student and educator
    const newRole = currentUser.role === 'student' ? 'educator' : 'student';

    // Update the role
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        profilePicture: true,
        bio: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      profilePicture: user.profilePicture,
      bio: user.bio,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    };

    res.json({
      message: `Role switched from ${currentUser.role} to ${newRole}`,
      user: userResponse
    });
  } catch (error) {
    console.error('Toggle role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (admin only)
router.get('/users', authenticate, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        profilePicture: true,
        bio: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const usersResponse = users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      profilePicture: user.profilePicture,
      bio: user.bio,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    }));

    res.json({ users: usersResponse });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get API endpoints (admin only)
router.get('/api-endpoints', authenticate, requireRole(['admin']), async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const endpoints = [
      {
        category: 'Authentication',
        routes: [
          { method: 'POST', path: '/api/auth/register', description: 'Register new user', roles: ['public'] },
          { method: 'POST', path: '/api/auth/login', description: 'User login', roles: ['public'] },
          { method: 'GET', path: '/api/auth/me', description: 'Get current user profile', roles: ['student', 'educator', 'admin'] },
          { method: 'PUT', path: '/api/auth/profile', description: 'Update user profile', roles: ['student', 'educator', 'admin'] }
        ]
      },
      {
        category: 'Admin',
        routes: [
          { method: 'POST', path: '/api/admin/switch-role', description: 'Switch user role (admin only)', roles: ['admin'] },
          { method: 'POST', path: '/api/admin/toggle-my-role', description: 'Toggle own role between student/educator', roles: ['student', 'educator'] },
          { method: 'GET', path: '/api/admin/users', description: 'Get all users', roles: ['admin'] },
          { method: 'GET', path: '/api/admin/api-endpoints', description: 'View API endpoints', roles: ['admin'] }
        ]
      },
      {
        category: 'Courses',
        routes: [
          { method: 'GET', path: '/api/courses', description: 'Get courses for current user', roles: ['student', 'educator', 'admin'] },
          { method: 'POST', path: '/api/courses', description: 'Create new course', roles: ['educator', 'admin'] },
          { method: 'GET', path: '/api/courses/:id', description: 'Get course details', roles: ['student', 'educator', 'admin'] },
          { method: 'PUT', path: '/api/courses/:id', description: 'Update course', roles: ['educator', 'admin'] },
          { method: 'DELETE', path: '/api/courses/:id', description: 'Delete course', roles: ['educator', 'admin'] }
        ]
      },
      {
        category: 'Assignments',
        routes: [
          { method: 'GET', path: '/api/assignments', description: 'Get assignments for current user', roles: ['student', 'educator', 'admin'] },
          { method: 'POST', path: '/api/assignments', description: 'Create new assignment', roles: ['educator', 'admin'] },
          { method: 'GET', path: '/api/assignments/:id', description: 'Get assignment details', roles: ['student', 'educator', 'admin'] },
          { method: 'PUT', path: '/api/assignments/:id', description: 'Update assignment', roles: ['educator', 'admin'] },
          { method: 'DELETE', path: '/api/assignments/:id', description: 'Delete assignment', roles: ['educator', 'admin'] }
        ]
      },
      {
        category: 'Assignment Templates',
        routes: [
          { method: 'GET', path: '/api/assignment-templates', description: 'Get assignment templates', roles: ['educator', 'admin'] },
          { method: 'POST', path: '/api/assignment-templates', description: 'Create assignment template', roles: ['educator', 'admin'] },
          { method: 'GET', path: '/api/assignment-templates/:id', description: 'Get template details', roles: ['educator', 'admin'] },
          { method: 'PUT', path: '/api/assignment-templates/:id', description: 'Update template', roles: ['educator', 'admin'] },
          { method: 'DELETE', path: '/api/assignment-templates/:id', description: 'Delete template', roles: ['educator', 'admin'] }
        ]
      },
      {
        category: 'Course Assignments',
        routes: [
          { method: 'GET', path: '/api/course-assignments/:courseId', description: 'Get assignments for course', roles: ['student', 'educator', 'admin'] },
          { method: 'POST', path: '/api/course-assignments/:courseId/deploy/:templateId', description: 'Deploy template to course', roles: ['educator', 'admin'] }
        ]
      },
      {
        category: 'Documents',
        routes: [
          { method: 'GET', path: '/api/documents', description: 'Get user documents', roles: ['student', 'educator', 'admin'] },
          { method: 'POST', path: '/api/documents', description: 'Create new document', roles: ['student', 'educator', 'admin'] },
          { method: 'GET', path: '/api/documents/:id', description: 'Get document details', roles: ['student', 'educator', 'admin'] },
          { method: 'PUT', path: '/api/documents/:id', description: 'Update document', roles: ['student', 'educator', 'admin'] },
          { method: 'DELETE', path: '/api/documents/:id', description: 'Delete document', roles: ['student', 'educator', 'admin'] }
        ]
      },
      {
        category: 'Submissions',
        routes: [
          { method: 'GET', path: '/api/submissions', description: 'Get user submissions', roles: ['student', 'educator', 'admin'] },
          { method: 'POST', path: '/api/submissions', description: 'Create submission', roles: ['student'] },
          { method: 'GET', path: '/api/submissions/:id', description: 'Get submission details', roles: ['student', 'educator', 'admin'] },
          { method: 'PUT', path: '/api/submissions/:id', description: 'Update submission', roles: ['student', 'educator', 'admin'] }
        ]
      },
      {
        category: 'Learning Objectives',
        routes: [
          { method: 'GET', path: '/api/learning-objectives', description: 'Get learning objectives', roles: ['educator', 'admin'] },
          { method: 'POST', path: '/api/learning-objectives', description: 'Create learning objective', roles: ['educator', 'admin'] },
          { method: 'GET', path: '/api/learning-objectives/:id', description: 'Get objective details', roles: ['educator', 'admin'] },
          { method: 'PUT', path: '/api/learning-objectives/:id', description: 'Update objective', roles: ['educator', 'admin'] },
          { method: 'DELETE', path: '/api/learning-objectives/:id', description: 'Delete objective', roles: ['educator', 'admin'] }
        ]
      },
      {
        category: 'Analytics',
        routes: [
          { method: 'GET', path: '/api/analytics/writing-process/:assignmentId', description: 'Get writing process analytics', roles: ['educator', 'admin'] },
          { method: 'GET', path: '/api/analytics/student-progress/:studentId', description: 'Get student progress', roles: ['educator', 'admin'] },
          { method: 'GET', path: '/api/analytics/course-overview/:courseId', description: 'Get course analytics', roles: ['educator', 'admin'] }
        ]
      },
      {
        category: 'Notifications',
        routes: [
          { method: 'GET', path: '/api/notifications', description: 'Get user notifications', roles: ['student', 'educator', 'admin'] },
          { method: 'POST', path: '/api/notifications', description: 'Create notification', roles: ['educator', 'admin'] },
          { method: 'PUT', path: '/api/notifications/:id/read', description: 'Mark notification as read', roles: ['student', 'educator', 'admin'] }
        ]
      },
      {
        category: 'System',
        routes: [
          { method: 'GET', path: '/api/health', description: 'Health check endpoint', roles: ['public'] }
        ]
      }
    ];

    res.json({ 
      success: true,
      data: endpoints,
      message: 'API endpoints retrieved successfully'
    });
  } catch (error) {
    console.error('Get API endpoints error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve API endpoints'
    });
  }
});

export default router;