/**
 * Shared Common Types for Scribe Tree
 * 
 * This file contains common type definitions used across multiple domains
 * to ensure consistency and eliminate duplication.
 */

/**
 * API Response Interfaces
 */
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
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
export interface EducationalMetrics {
  bloomsLevelDistribution: Record<number, number>;
  categoryDistribution: Record<string, number>;
  averageWeight: number;
  totalObjectives: number;
}

export interface AssignmentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  educationalMetrics?: EducationalMetrics;
}

/**
 * Query Options
 */
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sort?: SortOptions;
}

/**
 * Error Types
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface APIError {
  status: number;
  message: string;
  errors?: ValidationError[];
  timestamp: string;
}