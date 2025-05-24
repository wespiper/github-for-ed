/**
 * Central type definitions for the GitHub for Writers backend
 * 
 * This file exports all type interfaces used throughout the application
 * for assignments, learning objectives, writing stages, and educational workflows.
 */

// Assignment-related types
export * from './assignment';

/**
 * Common Response Interfaces
 */
export interface IAPIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface IPaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Educational Workflow Types
 */
export interface IEducationalMetrics {
  bloomsLevelDistribution: Record<number, number>;
  categoryDistribution: Record<string, number>;
  averageWeight: number;
  totalObjectives: number;
}

export interface IAssignmentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  educationalMetrics: IEducationalMetrics;
}

/**
 * Query Filter Types
 */
export interface IAssignmentFilters {
  courseId?: string;
  instructorId?: string;
  status?: 'draft' | 'published' | 'in_progress' | 'completed' | 'archived';
  type?: 'individual' | 'collaborative' | 'peer-review';
  bloomsLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  category?: 'knowledge' | 'comprehension' | 'application' | 'analysis' | 'synthesis' | 'evaluation';
  hasAI?: boolean;
  hasCollaboration?: boolean;
  dueAfter?: Date;
  dueBefore?: Date;
}

export interface ISortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface IPaginationOptions {
  page: number;
  limit: number;
  sort?: ISortOptions;
}