import { Request, Response, NextFunction } from 'express';

/**
 * Validation middleware for API requests
 * Provides request body and parameter validation without external dependencies
 */

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  enum?: string[];
  custom?: (value: any) => string | null; // Returns error message or null if valid
}

export interface ValidationSchema {
  body?: ValidationRule[];
  params?: ValidationRule[];
  query?: ValidationRule[];
}

/**
 * Validates a value against a validation rule
 */
function validateField(value: any, rule: ValidationRule): string[] {
  const errors: string[] = [];
  const { field, required, type, minLength, maxLength, pattern, enum: enumValues, custom } = rule;

  // Check if required field is missing
  if (required && (value === undefined || value === null || value === '')) {
    errors.push(`${field} is required`);
    return errors; // If required field is missing, skip other validations
  }

  // Skip validation if field is optional and not provided
  if (!required && (value === undefined || value === null)) {
    return errors;
  }

  // Type validation
  if (type && value !== undefined && value !== null) {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${field} must be a string`);
        }
        break;
      case 'number':
        if (typeof value !== 'number' && isNaN(Number(value))) {
          errors.push(`${field} must be a number`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`${field} must be a boolean`);
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`${field} must be an array`);
        }
        break;
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) {
          errors.push(`${field} must be an object`);
        }
        break;
    }
  }

  // String-specific validations
  if (typeof value === 'string') {
    if (minLength && value.length < minLength) {
      errors.push(`${field} must be at least ${minLength} characters long`);
    }
    if (maxLength && value.length > maxLength) {
      errors.push(`${field} cannot exceed ${maxLength} characters`);
    }
    if (pattern && !pattern.test(value)) {
      errors.push(`${field} format is invalid`);
    }
  }

  // Enum validation
  if (enumValues && !enumValues.includes(value)) {
    errors.push(`${field} must be one of: ${enumValues.join(', ')}`);
  }

  // Custom validation
  if (custom) {
    const customError = custom(value);
    if (customError) {
      errors.push(customError);
    }
  }

  return errors;
}

/**
 * Creates validation middleware for the given schema
 */
export function validateRequest(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    // Validate request body
    if (schema.body) {
      for (const rule of schema.body) {
        const fieldErrors = validateField(req.body[rule.field], rule);
        errors.push(...fieldErrors);
      }
    }

    // Validate request parameters
    if (schema.params) {
      for (const rule of schema.params) {
        const fieldErrors = validateField(req.params[rule.field], rule);
        errors.push(...fieldErrors);
      }
    }

    // Validate query parameters
    if (schema.query) {
      for (const rule of schema.query) {
        const fieldErrors = validateField(req.query[rule.field], rule);
        errors.push(...fieldErrors);
      }
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
      return;
    }

    // If validation passes, continue to the next middleware
    next();
  };
}

/**
 * Common validation schemas for assignments
 */
export const assignmentValidationSchemas = {
  // Validation for creating assignments
  createAssignment: {
    body: [
      { field: 'title', required: true, type: 'string' as const, minLength: 1, maxLength: 200 },
      { field: 'description', required: true, type: 'string' as const, minLength: 1, maxLength: 2000 },
      { field: 'instructions', required: true, type: 'string' as const, minLength: 1, maxLength: 10000 },
      { field: 'courseId', required: true, type: 'string' as const },
      { 
        field: 'type', 
        required: false, 
        type: 'string' as const, 
        enum: ['individual', 'collaborative', 'peer-review'] 
      },
      { field: 'requirements', required: false, type: 'object' as const },
      { field: 'learningObjectives', required: false, type: 'array' as const },
      { field: 'writingStages', required: false, type: 'array' as const }
    ]
  },

  // Validation for updating assignments
  updateAssignment: {
    params: [
      { field: 'assignmentId', required: true, type: 'string' as const, minLength: 24, maxLength: 24 }
    ],
    body: [
      { field: 'title', required: false, type: 'string' as const, minLength: 1, maxLength: 200 },
      { field: 'description', required: false, type: 'string' as const, minLength: 1, maxLength: 2000 },
      { field: 'instructions', required: false, type: 'string' as const, minLength: 1, maxLength: 10000 },
      { 
        field: 'type', 
        required: false, 
        type: 'string' as const, 
        enum: ['individual', 'collaborative', 'peer-review'] 
      },
      { 
        field: 'status', 
        required: false, 
        type: 'string' as const, 
        enum: ['draft', 'published', 'in_progress', 'completed', 'archived'] 
      }
    ]
  },

  // Validation for getting assignment by ID
  getAssignment: {
    params: [
      { field: 'assignmentId', required: true, type: 'string' as const, minLength: 24, maxLength: 24 }
    ]
  },

  // Validation for getting course assignments
  getCourseAssignments: {
    params: [
      { field: 'courseId', required: true, type: 'string' as const, minLength: 24, maxLength: 24 }
    ],
    query: [
      { 
        field: 'status', 
        required: false, 
        type: 'string' as const, 
        enum: ['draft', 'published', 'in_progress', 'completed', 'archived'] 
      },
      { 
        field: 'type', 
        required: false, 
        type: 'string' as const, 
        enum: ['individual', 'collaborative', 'peer-review'] 
      }
    ]
  }
};

/**
 * Custom validation functions for complex business rules
 */
export const customValidators = {
  mongoId: (value: string): string | null => {
    const mongoIdPattern = /^[0-9a-fA-F]{24}$/;
    return mongoIdPattern.test(value) ? null : 'Invalid MongoDB ObjectId format';
  },

  learningObjectivesWeights: (objectives: any[]): string | null => {
    if (!Array.isArray(objectives) || objectives.length === 0) {
      return null; // Allow empty objectives
    }
    
    const totalWeight = objectives.reduce((sum, obj) => {
      return sum + (typeof obj.weight === 'number' ? obj.weight : 0);
    }, 0);
    
    return totalWeight === 100 ? null : 'Learning objectives weights must sum to 100%';
  },

  writingStagesOrder: (stages: any[]): string | null => {
    if (!Array.isArray(stages) || stages.length === 0) {
      return null; // Allow empty stages
    }
    
    const orders = stages.map(stage => stage.order).filter(order => typeof order === 'number');
    const uniqueOrders = new Set(orders);
    
    return orders.length === uniqueOrders.size ? null : 'Writing stages must have unique order values';
  }
};