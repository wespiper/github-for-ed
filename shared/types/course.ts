/**
 * Shared Course Types for GitHub for Education
 * 
 * This file contains all course-related type definitions shared between
 * frontend and backend to ensure consistency and eliminate duplication.
 */

import { type User } from './auth';

/**
 * Course Interface
 * Complete course structure
 */
export interface Course {
  _id: string;
  title: string;
  description: string;
  subject: string;
  instructor: User | string; // Populated or ObjectId
  students: (User | string)[]; // Populated or ObjectId array
  
  // Course Configuration
  isPublic: boolean;
  maxStudents?: number;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  
  // Course Settings
  settings: {
    allowSelfEnrollment: boolean;
    requireApprovalToJoin: boolean;
    allowStudentDiscussions: boolean;
    gradingScale: 'points' | 'percentage' | 'letter';
  };
  
  // Status
  status: 'draft' | 'published' | 'archived';
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

/**
 * Create Course Input Interface
 */
export interface CreateCourseInput {
  title: string;
  description: string;
  subject: string;
  isPublic?: boolean;
  maxStudents?: number;
  startDate?: string;
  endDate?: string;
  settings?: {
    allowSelfEnrollment?: boolean;
    requireApprovalToJoin?: boolean;
    allowStudentDiscussions?: boolean;
    gradingScale?: 'points' | 'percentage' | 'letter';
  };
}

/**
 * Update Course Input Interface
 */
export interface UpdateCourseInput {
  title?: string;
  description?: string;
  subject?: string;
  isPublic?: boolean;
  maxStudents?: number;
  startDate?: string;
  endDate?: string;
  settings?: Partial<{
    allowSelfEnrollment: boolean;
    requireApprovalToJoin: boolean;
    allowStudentDiscussions: boolean;
    gradingScale: 'points' | 'percentage' | 'letter';
  }>;
  status?: 'draft' | 'published' | 'archived';
}

/**
 * Course Enrollment Interface
 */
export interface CourseEnrollment {
  _id: string;
  course: Course | string;
  student: User | string;
  enrolledAt: string;
  status: 'pending' | 'enrolled' | 'completed' | 'withdrawn';
  grade?: number;
  finalGrade?: string;
}

/**
 * Course Filters Interface
 */
export interface CourseFilters {
  instructor?: string;
  subject?: string;
  status?: 'draft' | 'published' | 'archived';
  isPublic?: boolean;
  search?: string;
}