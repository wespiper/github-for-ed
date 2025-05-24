import { AuthService } from '../AuthService';
import { User } from '../../models/User';
import { generateToken } from '../../utils/jwt';
import { RegisterInput, LoginInput, UpdateProfileInput } from '@shared/types';

// Mock the dependencies
jest.mock('../../models/User', () => ({
  User: jest.fn()
}));
jest.mock('../../utils/jwt');

const { User: MockedUser } = require('../../models/User');
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
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'student',
      isVerified: false,
      createdAt: new Date(),
      save: jest.fn().mockResolvedValue(true)
    };

    it('should register user successfully with valid data', async () => {
      // Arrange
      MockedUser.findOne = jest.fn().mockResolvedValue(null); // No existing user
      MockedUser.mockImplementation(() => mockUser as any);
      mockGenerateToken.mockReturnValue('mock_token');

      // Act
      const result = await AuthService.registerUser(validRegistrationData);

      // Assert
      expect(MockedUser.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockGenerateToken).toHaveBeenCalledWith(mockUser);
      expect(result.message).toBe('User registered successfully');
      expect(result.token).toBe('mock_token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw error if user already exists', async () => {
      // Arrange
      MockedUser.findOne = jest.fn().mockResolvedValue(mockUser as any);

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
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'student',
      isVerified: false,
      createdAt: new Date(),
      comparePassword: jest.fn()
    };

    it('should authenticate user successfully with valid credentials', async () => {
      // Arrange
      MockedUser.findOne = jest.fn().mockResolvedValue(mockUser as any);
      mockUser.comparePassword.mockResolvedValue(true);
      mockGenerateToken.mockReturnValue('mock_token');

      // Act
      const result = await AuthService.authenticateUser(validLoginData);

      // Assert
      expect(MockedUser.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(mockGenerateToken).toHaveBeenCalledWith(mockUser);
      expect(result.message).toBe('Login successful');
      expect(result.token).toBe('mock_token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw error if user not found', async () => {
      // Arrange
      MockedUser.findOne = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(
        AuthService.authenticateUser(validLoginData)
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error if password is incorrect', async () => {
      // Arrange
      MockedUser.findOne = jest.fn().mockResolvedValue(mockUser as any);
      mockUser.comparePassword.mockResolvedValue(false);

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
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'student',
      isVerified: false,
      createdAt: new Date()
    };

    it('should return user profile successfully', async () => {
      // Arrange
      MockedUser.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      // Act
      const result = await AuthService.getUserProfile('507f1f77bcf86cd799439011');

      // Assert
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.firstName).toBe('John');
      expect(result.user.role).toBe('student');
    });

    it('should throw error if user not found', async () => {
      // Arrange
      MockedUser.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

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
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'student',
      bio: 'Updated bio',
      isVerified: false,
      createdAt: new Date()
    };

    it('should update user profile successfully', async () => {
      // Arrange
      MockedUser.findByIdAndUpdate = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      // Act
      const result = await AuthService.updateUserProfile('507f1f77bcf86cd799439011', updateData);

      // Assert
      expect(MockedUser.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { firstName: 'Jane', lastName: 'Smith', bio: 'Updated bio' },
        { new: true, runValidators: true }
      );
      expect(result.user.firstName).toBe('Jane');
      expect(result.user.bio).toBe('Updated bio');
    });

    it('should throw error if user not found', async () => {
      // Arrange
      MockedUser.findByIdAndUpdate = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

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
        AuthService.updateUserProfile('507f1f77bcf86cd799439011', invalidData)
      ).rejects.toThrow('Bio cannot exceed 500 characters');
    });

    it('should throw error if first name is too short', async () => {
      // Arrange
      const invalidData = { ...updateData, firstName: 'A' };

      // Act & Assert
      await expect(
        AuthService.updateUserProfile('507f1f77bcf86cd799439011', invalidData)
      ).rejects.toThrow('First name must be at least 2 characters long');
    });
  });

  describe('changePassword', () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      comparePassword: jest.fn(),
      password: '',
      save: jest.fn().mockResolvedValue(true)
    };

    it('should change password successfully', async () => {
      // Arrange
      MockedUser.findById = jest.fn().mockResolvedValue(mockUser as any);
      mockUser.comparePassword.mockResolvedValue(true);

      // Act
      await AuthService.changePassword('507f1f77bcf86cd799439011', 'oldpassword', 'newpassword123');

      // Assert
      expect(mockUser.comparePassword).toHaveBeenCalledWith('oldpassword');
      expect(mockUser.password).toBe('newpassword123');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw error if current password is incorrect', async () => {
      // Arrange
      MockedUser.findById = jest.fn().mockResolvedValue(mockUser as any);
      mockUser.comparePassword.mockResolvedValue(false);

      // Act & Assert
      await expect(
        AuthService.changePassword('507f1f77bcf86cd799439011', 'wrongpassword', 'newpassword123')
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should throw error if new password is too short', async () => {
      // Act & Assert
      await expect(
        AuthService.changePassword('507f1f77bcf86cd799439011', 'oldpassword', '123')
      ).rejects.toThrow('Password must be at least 6 characters long');
    });

    it('should throw error if user not found', async () => {
      // Arrange
      MockedUser.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(
        AuthService.changePassword('invalid_id', 'oldpassword', 'newpassword123')
      ).rejects.toThrow('User not found');
    });
  });
});