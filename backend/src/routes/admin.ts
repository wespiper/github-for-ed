import express, { Response } from 'express';
import { User } from '../models/User';
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
    const user = await User.findById(userId).select('-password');
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
    user.role = newRole as 'student' | 'educator';
    await user.save();

    const userResponse = {
      id: user._id,
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
    const user = await User.findByIdAndUpdate(
      userId,
      { role: newRole },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userResponse = {
      id: user._id,
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
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    const usersResponse = users.map(user => ({
      id: user._id,
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