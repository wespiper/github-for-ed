/**
 * Assignment Service - PostgreSQL/Prisma Version
 * 
 * Business logic for assignment management using Prisma ORM
 */

import prisma from '../lib/prisma';
import { Prisma, Assignment } from '@prisma/client';
// Note: Shared types temporarily inlined to resolve import issues
interface CreateAssignmentInput {
  title: string;
  instructions?: string; // Made optional to match route usage
  description?: string; // Alternative field name sometimes used
  courseId: string;
  dueDate?: Date | string; // Support both Date and string for flexibility
  maxPoints?: number;
  type?: 'essay' | 'research' | 'creative' | 'reflection' | 'analysis';
  status?: 'draft' | 'published' | 'archived';
  settings?: {
    allowLateSubmissions?: boolean;
    requireReflection?: boolean;
    aiAssistanceLevel?: 'none' | 'basic' | 'standard' | 'enhanced';
    plagiarismDetection?: boolean;
    collaborativeWriting?: boolean;
  };
  learningObjectives?: string[];
  // Additional properties used by service implementation
  requirements?: any;
  writingStages?: any;
  aiSettings?: any;
  grading?: any;
  gradingCriteria?: any; // Alternative field name
  collaboration?: any;
  versionControl?: any;
}

interface UpdateAssignmentInput extends Partial<CreateAssignmentInput> {}

interface AssignmentValidation {
  valid: boolean;
  isValid?: boolean; // Legacy compatibility
  warnings: string[];
  suggestions: string[];
  errors?: string[]; // Legacy compatibility
  educationalMetrics?: {
    bloomsLevelDistribution: Record<number, number>;
    categoryDistribution: Record<string, number>;
    averageWeight: number;
    totalObjectives: number;
  };
}

export class AssignmentService {
  /**
   * Create a new assignment with comprehensive validation
   */
  static async createAssignment(data: CreateAssignmentInput, userId: string): Promise<Assignment> {
    // Validate input data
    this.validateCreateAssignmentInput(data);
    
    // Verify course access and permissions
    await this.validateCourseAccess(data.courseId, userId);
    
    // Validate educational requirements
    this.validateEducationalRequirements(data);
    
    // Build assignment data with defaults
    const assignmentData = this.buildAssignmentData(data, userId);
    
    // Create assignment with relations
    const assignment = await prisma.assignment.create({
      data: assignmentData,
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });
    
    return assignment;
  }
  
  /**
   * Update an existing assignment
   */
  static async updateAssignment(assignmentId: string, data: UpdateAssignmentInput, userId: string): Promise<Assignment> {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true }
    });
    
    if (!assignment) {
      throw new Error('Assignment not found');
    }
    
    // Check permissions
    await this.validateAssignmentAccess(assignment, userId);
    
    // Validate educational requirements if provided
    if (this.hasEducationalData(data)) {
      this.validateEducationalRequirements(data as CreateAssignmentInput);
    }
    
    // Build update data with proper type handling
    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.instructions || data.description) {
      updateData.instructions = data.instructions || data.description;
    }
    if (data.type) updateData.type = data.type;
    if (data.dueDate) {
      updateData.dueDate = typeof data.dueDate === 'string' ? new Date(data.dueDate) : data.dueDate;
    }
    if (data.requirements) updateData.requirements = data.requirements as any;
    if (data.writingStages) updateData.writingStages = data.writingStages as any;
    if (data.learningObjectives) updateData.learningObjectives = data.learningObjectives as any;
    if (data.aiSettings) updateData.aiSettings = data.aiSettings as any;
    if (data.grading || data.gradingCriteria) {
      updateData.gradingCriteria = (data.grading || data.gradingCriteria) as any;
    }
    if (data.status) updateData.status = data.status;
    updateData.updatedAt = new Date();

    // Update assignment
    const updatedAssignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: updateData,
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });
    
    return updatedAssignment;
  }
  
  /**
   * Publish an assignment
   */
  static async publishAssignment(assignmentId: string, userId: string): Promise<Assignment> {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true }
    });
    
    if (!assignment) {
      throw new Error('Assignment not found');
    }
    
    // Check permissions
    await this.validateAssignmentAccess(assignment, userId);
    
    // Validate assignment is ready for publication
    await this.validateForPublication(assignment);
    
    const publishedAssignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        status: 'published',
        updatedAt: new Date()
      },
      include: {
        instructor: true,
        course: true
      }
    });
    
    return publishedAssignment;
  }
  
  /**
   * Get assignment by ID with relations
   */
  static async getAssignmentById(assignmentId: string, includeSubmissions = false): Promise<Assignment | null> {
    return await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        submissions: includeSubmissions ? {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        } : false,
        _count: {
          select: {
            submissions: true
          }
        }
      }
    });
  }
  
  /**
   * Get assignments by course
   */
  static async getAssignmentsByCourse(courseId: string, userId: string, userRole: string, filters: any = {}): Promise<Assignment[]> {
    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        enrollments: {
          where: { studentId: userId }
        }
      }
    });
    
    if (!course) {
      throw new Error('Course not found');
    }
    
    // Check access permissions
    const isInstructor = course.instructorId === userId;
    const isStudent = course.enrollments.length > 0;
    const isAdmin = userRole === 'admin';
    
    if (!isInstructor && !isStudent && !isAdmin) {
      throw new Error('Access denied to this course');
    }
    
    const where: Prisma.AssignmentWhereInput = {
      courseId
    };
    
    // Apply filters
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    
    // Students can only see published assignments
    if (!isInstructor && !isAdmin) {
      where.status = 'published';
    }
    
    return await prisma.assignment.findMany({
      where,
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    });
  }
  
  /**
   * Get assignments by instructor
   */
  static async getAssignmentsByInstructor(instructorId: string): Promise<Assignment[]> {
    return await prisma.assignment.findMany({
      where: {
        instructorId
      },
      include: {
        course: {
          select: {
            id: true,
            title: true
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
  
  /**
   * Search assignments with filters
   */
  static async searchAssignments(filters: {
    search?: string;
    courseId?: string;
    status?: string;
    type?: string;
    hasAI?: boolean;
    dueBefore?: Date;
    dueAfter?: Date;
  }): Promise<Assignment[]> {
    const where: Prisma.AssignmentWhereInput = {};
    
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { instructions: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    
    if (filters.courseId) where.courseId = filters.courseId;
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    
    if (filters.dueBefore || filters.dueAfter) {
      where.dueDate = {};
      if (filters.dueBefore) where.dueDate.lte = filters.dueBefore;
      if (filters.dueAfter) where.dueDate.gte = filters.dueAfter;
    }
    
    return await prisma.assignment.findMany({
      where,
      include: {
        course: true,
        instructor: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
  
  /**
   * Validate assignment educational requirements
   */
  static validateAssignmentEducationalRequirements(assignment: any): AssignmentValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check required fields
    if (!assignment.title?.trim()) {
      errors.push('Title is required');
    }
    if (!assignment.instructions?.trim()) {
      errors.push('Instructions are required');
    }
    
    // Validate learning objectives
    const learningObjectives = assignment.learningObjectives as any[];
    if (!learningObjectives || learningObjectives.length === 0) {
      warnings.push('No learning objectives defined');
    } else {
      // Check if weights sum to 100
      const totalWeight = learningObjectives.reduce((sum, obj) => sum + (obj.weight || 0), 0);
      if (Math.abs(totalWeight - 100) > 0.01) {
        errors.push(`Learning objective weights must sum to 100% (currently ${totalWeight}%)`);
      }
    }
    
    // Validate writing stages
    const writingStages = assignment.writingStages as any[];
    if (!writingStages || writingStages.length === 0) {
      warnings.push('No writing stages defined');
    } else {
      // Check for unique order values
      const orders = writingStages.map(stage => stage.order);
      const uniqueOrders = new Set(orders);
      if (uniqueOrders.size !== orders.length) {
        errors.push('Writing stages must have unique order values');
      }
    }
    
    // Educational metrics
    const educationalMetrics = {
      bloomsLevelDistribution: this.calculateBloomsDistribution(learningObjectives),
      categoryDistribution: this.calculateCategoryDistribution(learningObjectives),
      averageWeight: learningObjectives?.length > 0 
        ? learningObjectives.reduce((sum, obj) => sum + (obj.weight || 0), 0) / learningObjectives.length 
        : 0,
      totalObjectives: learningObjectives?.length || 0
    };
    
    return {
      valid: errors.length === 0,
      isValid: errors.length === 0, // Legacy compatibility
      errors,
      warnings,
      suggestions: [], // Default empty suggestions
      educationalMetrics
    };
  }
  
  // Private helper methods
  
  private static validateCreateAssignmentInput(data: CreateAssignmentInput): void {
    if (!data.title?.trim()) {
      throw new Error('Assignment title is required');
    }
    // Accept either instructions or description
    const content = data.instructions || data.description;
    if (!content?.trim()) {
      throw new Error('Assignment instructions or description are required');
    }
    if (!data.courseId) {
      throw new Error('Course ID is required');
    }
  }
  
  private static async validateCourseAccess(courseId: string, userId: string): Promise<void> {
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });
    
    if (!course) {
      throw new Error('Course not found');
    }
    
    if (course.instructorId !== userId) {
      throw new Error('Only the course instructor can create assignments');
    }
  }
  
  private static validateEducationalRequirements(data: CreateAssignmentInput): void {
    const validation = this.validateAssignmentEducationalRequirements(data);
    if (!validation.isValid) {
      throw new Error(`Educational validation failed: ${validation.errors.join(', ')}`);
    }
  }
  
  private static buildAssignmentData(data: CreateAssignmentInput, userId: string): Prisma.AssignmentCreateInput {
    // Handle instructions vs description
    const instructions = data.instructions || data.description || '';
    
    // Handle date conversion
    let dueDate: Date | undefined = undefined;
    if (data.dueDate) {
      dueDate = typeof data.dueDate === 'string' ? new Date(data.dueDate) : data.dueDate;
    }
    
    return {
      title: data.title,
      instructions,
      requirements: (data.requirements || {}) as any,
      writingStages: (data.writingStages || []) as any,
      learningObjectives: (data.learningObjectives || []) as any,
      aiSettings: (data.aiSettings || {}) as any,
      gradingCriteria: (data.grading || data.gradingCriteria || {}) as any,
      dueDate,
      stageDueDates: {},
      status: data.status || 'draft',
      type: data.type || 'individual',
      collaborationSettings: data.collaboration || {},
      versionControlSettings: data.versionControl || {},
      course: {
        connect: { id: data.courseId }
      },
      instructor: {
        connect: { id: userId }
      }
    };
  }
  
  private static hasEducationalData(data: UpdateAssignmentInput): boolean {
    return !!(data.learningObjectives || data.writingStages || data.grading);
  }
  
  private static async validateAssignmentAccess(assignment: any, userId: string): Promise<void> {
    if (assignment.instructorId !== userId) {
      // Check if user is course instructor
      const course = await prisma.course.findUnique({
        where: { id: assignment.courseId }
      });
      
      if (!course || course.instructorId !== userId) {
        throw new Error('You do not have permission to modify this assignment');
      }
    }
  }
  
  private static async validateForPublication(assignment: any): Promise<void> {
    const validation = this.validateAssignmentEducationalRequirements(assignment);
    
    if (!validation.isValid) {
      throw new Error(`Cannot publish assignment: ${validation.errors.join(', ')}`);
    }
    
    if (!assignment.dueDate) {
      throw new Error('Due date is required for publication');
    }
    
    if (new Date(assignment.dueDate) < new Date()) {
      throw new Error('Due date must be in the future');
    }
  }
  
  private static calculateBloomsDistribution(objectives: any[]): Record<number, number> {
    const distribution: Record<number, number> = {};
    if (!objectives) return distribution;
    
    objectives.forEach(obj => {
      const level = obj.bloomsLevel || 1;
      distribution[level] = (distribution[level] || 0) + (obj.weight || 0);
    });
    
    return distribution;
  }
  
  private static calculateCategoryDistribution(objectives: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    if (!objectives) return distribution;
    
    objectives.forEach(obj => {
      const category = obj.category || 'uncategorized';
      distribution[category] = (distribution[category] || 0) + (obj.weight || 0);
    });
    
    return distribution;
  }
}