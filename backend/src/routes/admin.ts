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

export default router;