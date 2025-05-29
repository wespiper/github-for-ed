/**
 * Shared Authentication Types for Scribe Tree
 * 
 * This file contains all authentication-related type definitions shared between
 * frontend and backend to ensure consistency and eliminate duplication.
 */

/**
 * User Role Types
 * Defines the role-based access control system
 */
export type UserRole = 'student' | 'educator' | 'admin';

/**
 * User Interface
 * Complete user profile structure
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profilePicture?: string;
  bio?: string;
  isVerified: boolean;
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
}

/**
 * Authentication Response Interface
 * Response structure for login/register operations
 */
export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

/**
 * Registration Input Interface
 * Data required for user registration
 */
export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

/**
 * Login Input Interface
 * Data required for user login
 */
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Update Profile Input Interface
 * Data that can be updated in user profile
 */
export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  bio?: string;
  profilePicture?: string;
}

/**
 * JWT Payload Interface
 * Structure of decoded JWT token
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

/**
 * Authentication State Interface
 * Frontend authentication state management
 */
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading?: boolean;
}