import { generateToken } from '../../utils/jwt';
import { RegisterInput, LoginInput, UpdateProfileInput } from '@shared/types';

// Mock Prisma before importing AuthService
jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn()
    },
    $disconnect: jest.fn()
  }
}));

jest.mock('../../utils/jwt');

// Import AuthService after mocks are set up
import { AuthService } from '../AuthService';
import prisma from '../../lib/prisma';

const mockGenerateToken = generateToken as jest.MockedFunction<typeof generateToken>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    const validRegistrationData: RegisterInput = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      role: 'student'
    };

    const mockUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'student' as const,
      isVerified: false,
      passwordHash: 'hashedPassword',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should register user successfully with valid data', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // No existing user
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser as any);
      mockGenerateToken.mockReturnValue('mock_token');

      // Act
      const result = await AuthService.registerUser(validRegistrationData);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(prisma.user.create).toHaveBeenCalled();
      expect(mockGenerateToken).toHaveBeenCalledWith(expect.objectContaining({ email: 'test@example.com' }));
      expect(result.message).toBe('User registered successfully');
      expect(result.token).toBe('mock_token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw error if user already exists', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser as any);

      // Act & Assert
      await expect(
        AuthService.registerUser(validRegistrationData)
      ).rejects.toThrow('User already exists with this email');
    });

    it('should throw error if email is missing', async () => {
      // Arrange
      const invalidData = { ...validRegistrationData, email: '' };

      // Act & Assert
      await expect(
        AuthService.registerUser(invalidData)
      ).rejects.toThrow('All fields are required');
    });

    it('should throw error if password is too short', async () => {
      // Arrange
      const invalidData = { ...validRegistrationData, password: '123' };

      // Act & Assert
      await expect(
        AuthService.registerUser(invalidData)
      ).rejects.toThrow('Password must be at least 6 characters long');
    });

    it('should throw error if role is invalid', async () => {
      // Arrange
      const invalidData = { ...validRegistrationData, role: 'invalid' as any };

      // Act & Assert
      await expect(
        AuthService.registerUser(invalidData)
      ).rejects.toThrow('Role must be either student or educator');
    });

    it('should throw error if email format is invalid', async () => {
      // Arrange
      const invalidData = { ...validRegistrationData, email: 'invalid-email' };

      // Act & Assert
      await expect(
        AuthService.registerUser(invalidData)
      ).rejects.toThrow('Please provide a valid email address');
    });

    it('should throw error if first name is too short', async () => {
      // Arrange
      const invalidData = { ...validRegistrationData, firstName: 'A' };

      // Act & Assert
      await expect(
        AuthService.registerUser(invalidData)
      ).rejects.toThrow('First name must be at least 2 characters long');
    });
  });

  describe('authenticateUser', () => {
    const validLoginData: LoginInput = {
      email: 'test@example.com',
      password: 'password123'
    };

    const mockUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'student' as const,
      isVerified: false,
      passwordHash: 'hashedPassword',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should authenticate user successfully with valid credentials', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser as any);
      // Mock bcrypt.compare for password verification
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      mockGenerateToken.mockReturnValue('mock_token');

      // Act
      const result = await AuthService.authenticateUser(validLoginData);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(mockGenerateToken).toHaveBeenCalledWith(mockUser);
      expect(result.message).toBe('Login successful');
      expect(result.token).toBe('mock_token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw error if user not found', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        AuthService.authenticateUser(validLoginData)
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error if password is incorrect', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser as any);
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      // Act & Assert
      await expect(
        AuthService.authenticateUser(validLoginData)
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error if email or password is missing', async () => {
      // Arrange
      const invalidData = { ...validLoginData, email: '' };

      // Act & Assert
      await expect(
        AuthService.authenticateUser(invalidData)
      ).rejects.toThrow('Email and password are required');
    });
  });

  describe('getUserProfile', () => {
    const mockUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'student' as const,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should return user profile successfully', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser as any);

      // Act
      const result = await AuthService.getUserProfile('123e4567-e89b-12d3-a456-426614174000');

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
        select: expect.objectContaining({
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true
        })
      });
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.firstName).toBe('John');
      expect(result.user.role).toBe('student');
    });

    it('should throw error if user not found', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        AuthService.getUserProfile('invalid_id')
      ).rejects.toThrow('User not found');
    });
  });

  describe('updateUserProfile', () => {
    const updateData: UpdateProfileInput = {
      firstName: 'Jane',
      lastName: 'Smith',
      bio: 'Updated bio'
    };

    const mockUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'student' as const,
      bio: 'Updated bio',
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should update user profile successfully', async () => {
      // Arrange
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser as any);

      // Act
      const result = await AuthService.updateUserProfile('123e4567-e89b-12d3-a456-426614174000', updateData);

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
        data: { firstName: 'Jane', lastName: 'Smith', bio: 'Updated bio' },
        select: expect.objectContaining({
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true
        })
      });
      expect(result.user.firstName).toBe('Jane');
      expect(result.user.bio).toBe('Updated bio');
    });

    it('should throw error if user not found', async () => {
      // Arrange
      (prisma.user.update as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        AuthService.updateUserProfile('invalid_id', updateData)
      ).rejects.toThrow('User not found');
    });

    it('should throw error if bio exceeds maximum length', async () => {
      // Arrange
      const invalidData = { ...updateData, bio: 'a'.repeat(501) };

      // Act & Assert
      await expect(
        AuthService.updateUserProfile('123e4567-e89b-12d3-a456-426614174000', invalidData)
      ).rejects.toThrow('Bio cannot exceed 500 characters');
    });

    it('should throw error if first name is too short', async () => {
      // Arrange
      const invalidData = { ...updateData, firstName: 'A' };

      // Act & Assert
      await expect(
        AuthService.updateUserProfile('123e4567-e89b-12d3-a456-426614174000', invalidData)
      ).rejects.toThrow('First name must be at least 2 characters long');
    });
  });

  describe('changePassword', () => {
    const mockUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      passwordHash: 'hashedPassword',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should change password successfully', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser as any);
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('newHashedPassword');
      (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, passwordHash: 'newHashedPassword' } as any);

      // Act
      await AuthService.changePassword('123e4567-e89b-12d3-a456-426614174000', 'oldpassword', 'newpassword123');

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith('oldpassword', 'hashedPassword');
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
        data: { passwordHash: 'newHashedPassword' }
      });
    });

    it('should throw error if current password is incorrect', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser as any);
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      // Act & Assert
      await expect(
        AuthService.changePassword('123e4567-e89b-12d3-a456-426614174000', 'wrongpassword', 'newpassword123')
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should throw error if new password is too short', async () => {
      // Act & Assert
      await expect(
        AuthService.changePassword('123e4567-e89b-12d3-a456-426614174000', 'oldpassword', '123')
      ).rejects.toThrow('Password must be at least 6 characters long');
    });

    it('should throw error if user not found', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        AuthService.changePassword('invalid_id', 'oldpassword', 'newpassword123')
      ).rejects.toThrow('User not found');
    });
  });
});