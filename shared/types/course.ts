/**
 * Shared Course Types for Scribe Tree
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
  id: string;
  title: string;
  description?: string;
  subject?: string;
  instructorId: string;
  instructor?: User; // Populated when needed
  
  // Course Configuration
  isPublic: boolean;
  isActive: boolean;
  maxStudents: number;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  enrollmentCode?: string;
  tags: string[];
  
  // Course Settings
  settings: Record<string, any>;
  
  // Status
  status: string;
  
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
  id: string;
  courseId: string;
  course?: Course;
  studentId: string;
  student?: User;
  enrolledAt: string;
  status: string;
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