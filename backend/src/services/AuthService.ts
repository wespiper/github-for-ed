import { User, IUser } from '../models/User';
import { generateToken } from '../utils/jwt';
import { RegisterInput, LoginInput, AuthResponse, UpdateProfileInput } from '@shared/types';

export class AuthService {
  /**
   * Register a new user with validation
   */
  static async registerUser(data: RegisterInput): Promise<AuthResponse> {
    // Validate input data
    this.validateRegistrationInput(data);
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      throw new Error('User already exists with this email');
    }
    
    // Create new user
    const user = new User({
      email: data.email.toLowerCase(),
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role
    });
    
    await user.save();
    
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
    const user = await User.findOne({ email: data.email.toLowerCase() });
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(data.password);
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
    const user = await User.findById(userId).select('-password');
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
    
    const updateData: Partial<IUser> = {};
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.profilePicture !== undefined) updateData.profilePicture = data.profilePicture;
    
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const userResponse = this.formatUserResponse(user);
    return { user: userResponse };
  }
  
  /**
   * Change user password
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Validate password requirements
    this.validatePassword(newPassword);
    
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
  }
  
  /**
   * Verify user email (for future email verification feature)
   */
  static async verifyUserEmail(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    user.isVerified = true;
    await user.save();
  }
  
  /**
   * Get users by role (admin functionality)
   */
  static async getUsersByRole(role: string, adminUserId: string): Promise<IUser[]> {
    // Verify admin access
    const adminUser = await User.findById(adminUserId);
    if (!adminUser || adminUser.role !== 'admin') {
      throw new Error('Admin access required');
    }
    
    return await User.find({ role })
      .select('-password')
      .sort({ createdAt: -1 });
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
  
  private static formatUserResponse(user: IUser): any {
    return {
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
  }
}