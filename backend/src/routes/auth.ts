import express, { Request, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { RegisterInput, LoginInput, UpdateProfileInput } from '@shared/types';
import { AuthService } from '../services';

const router = express.Router();

// Register new user
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const registrationData: RegisterInput = req.body;
    const authResponse = await AuthService.registerUser(registrationData);

    res.status(201).json(authResponse);
  } catch (error) {
    console.error('Registration error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = message.includes('already exists') ? 409 : 
                      message.includes('required') || message.includes('must') ? 400 : 500;
    res.status(statusCode).json({ error: message });
  }
});

// Login user
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const loginData: LoginInput = req.body;
    const authResponse = await AuthService.authenticateUser(loginData);

    res.json(authResponse);
  } catch (error) {
    console.error('Login error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = message.includes('Invalid') ? 401 : 
                      message.includes('required') ? 400 : 500;
    res.status(statusCode).json({ error: message });
  }
});

// Get current user profile
router.get('/profile', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const userProfile = await AuthService.getUserProfile(userId);

    res.json(userProfile);
  } catch (error) {
    console.error('Profile error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ error: message });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const updateData: UpdateProfileInput = req.body;

    const result = await AuthService.updateUserProfile(userId, updateData);

    res.json({
      message: 'Profile updated successfully',
      ...result
    });
  } catch (error) {
    console.error('Profile update error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = message.includes('not found') ? 404 : 
                      message.includes('exceed') || message.includes('required') ? 400 : 500;
    res.status(statusCode).json({ error: message });
  }
});

export default router;