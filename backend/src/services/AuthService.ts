/**
 * Auth Service - PostgreSQL/Prisma Version
 * 
 * Authentication and user management using Prisma ORM
 */

import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';
import { generateToken } from '../utils/jwt';
import { RegisterInput, LoginInput, AuthResponse, UpdateProfileInput } from '@shared/types';
import { Prisma, User } from '@prisma/client';

export class AuthService {
  /**
   * Register a new user with validation
   */
  static async registerUser(data: RegisterInput): Promise<AuthResponse> {
    // Validate input data
    this.validateRegistrationInput(data);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() }
    });
    
    if (existingUser) {
      throw new Error('User already exists with this email');
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);
    
    // Create new user
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role
      }
    });
    
    // Generate token
    const token = generateToken(user);
    
    // Return user data (without password)
    const userResponse = this.formatUserResponse(user);
    
    return {
      message: 'User registered successfully',
      user: userResponse,
      token
    };
  }
  
  /**
   * Authenticate user login
   */
  static async authenticateUser(data: LoginInput): Promise<AuthResponse> {
    // Validate input data
    this.validateLoginInput(data);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() }
    });
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }
    
    // Generate token
    const token = generateToken(user);
    
    // Return user data (without password)
    const userResponse = this.formatUserResponse(user);
    
    return {
      message: 'Login successful',
      user: userResponse,
      token
    };
  }
  
  /**
   * Get user profile by ID
   */
  static async getUserProfile(userId: string): Promise<{ user: any }> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const userResponse = this.formatUserResponse(user);
    return { user: userResponse };
  }
  
  /**
   * Update user profile
   */
  static async updateUserProfile(userId: string, data: UpdateProfileInput): Promise<{ user: any }> {
    // Validate update data
    this.validateProfileUpdateInput(data);
    
    const updateData: Prisma.UserUpdateInput = {};
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.profilePicture !== undefined) updateData.profilePicture = data.profilePicture;
    
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData
      });
      
      const userResponse = this.formatUserResponse(user);
      return { user: userResponse };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new Error('User not found');
      }
      throw error;
    }
  }
  
  /**
   * Change user password
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Validate password requirements
    this.validatePassword(newPassword);
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }
    
    // Hash new password and update
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });
  }
  
  /**
   * Verify user email (for future email verification feature)
   */
  static async verifyUserEmail(userId: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { isVerified: true }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new Error('User not found');
      }
      throw error;
    }
  }
  
  /**
   * Get users by role (admin functionality)
   */
  static async getUsersByRole(role: string, adminUserId: string): Promise<User[]> {
    // Verify admin access
    const adminUser = await prisma.user.findUnique({
      where: { id: adminUserId }
    });
    
    if (!adminUser || adminUser.role !== 'admin') {
      throw new Error('Admin access required');
    }
    
    return await prisma.user.findMany({
      where: { role: role as any },
      orderBy: { createdAt: 'desc' }
    });
  }
  
  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
  }
  
  /**
   * Get multiple users by IDs
   */
  static async getUsersByIds(userIds: string[]): Promise<User[]> {
    return await prisma.user.findMany({
      where: {
        id: { in: userIds }
      }
    });
  }
  
  /**
   * Search users by name or email
   */
  static async searchUsers(query: string, excludeUserId?: string): Promise<User[]> {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return await prisma.user.findMany({
      where: {
        AND: [
          excludeUserId ? { NOT: { id: excludeUserId } } : {},
          {
            OR: searchTerms.map(term => ({
              OR: [
                { email: { contains: term, mode: 'insensitive' } },
                { firstName: { contains: term, mode: 'insensitive' } },
                { lastName: { contains: term, mode: 'insensitive' } }
              ]
            }))
          }
        ]
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });
  }
  
  // Private helper methods
  
  private static validateRegistrationInput(data: RegisterInput): void {
    if (!data.email || !data.password || !data.firstName || !data.lastName || !data.role) {
      throw new Error('All fields are required');
    }
    
    if (!['student', 'educator'].includes(data.role)) {
      throw new Error('Role must be either student or educator');
    }
    
    this.validatePassword(data.password);
    this.validateEmail(data.email);
    this.validateName(data.firstName, 'First name');
    this.validateName(data.lastName, 'Last name');
  }
  
  private static validateLoginInput(data: LoginInput): void {
    if (!data.email || !data.password) {
      throw new Error('Email and password are required');
    }
  }
  
  private static validateProfileUpdateInput(data: UpdateProfileInput): void {
    if (data.firstName !== undefined) {
      this.validateName(data.firstName, 'First name');
    }
    if (data.lastName !== undefined) {
      this.validateName(data.lastName, 'Last name');
    }
    if (data.bio !== undefined && data.bio.length > 500) {
      throw new Error('Bio cannot exceed 500 characters');
    }
  }
  
  private static validatePassword(password: string): void {
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
    // Additional password requirements can be added here
    // e.g., complexity requirements for production
  }
  
  private static validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please provide a valid email address');
    }
  }
  
  private static validateName(name: string, fieldName: string): void {
    if (!name.trim()) {
      throw new Error(`${fieldName} is required`);
    }
    if (name.trim().length < 2) {
      throw new Error(`${fieldName} must be at least 2 characters long`);
    }
    if (name.length > 50) {
      throw new Error(`${fieldName} cannot exceed 50 characters`);
    }
  }
  
  private static formatUserResponse(user: User): any {
    return {
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
  }
}