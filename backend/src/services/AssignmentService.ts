import { Assignment, IAssignment } from '../models/Assignment';
import { Course } from '../models/Course';
import { CreateAssignmentInput, UpdateAssignmentInput, AssignmentValidation } from '@shared/types';
import { Types } from 'mongoose';

export class AssignmentService {
  /**
   * Create a new assignment with comprehensive validation
   */
  static async createAssignment(data: CreateAssignmentInput, userId: string): Promise<IAssignment> {
    // Validate input data
    this.validateCreateAssignmentInput(data);
    
    // Verify course access and permissions
    await this.validateCourseAccess(data.courseId, userId);
    
    // Validate educational requirements
    this.validateEducationalRequirements(data);
    
    // Create assignment with defaults
    const assignmentData = this.buildAssignmentData(data, userId);
    
    const assignment = new Assignment(assignmentData);
    await assignment.save();
    
    // Return populated assignment
    return await Assignment.findById(assignment._id)
      .populate('instructor', 'firstName lastName email')
      .populate('course', 'title') as IAssignment;
  }
  
  /**
   * Update an existing assignment
   */
  static async updateAssignment(assignmentId: string, data: UpdateAssignmentInput, userId: string): Promise<IAssignment> {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      throw new Error('Assignment not found');
    }
    
    // Check permissions
    await this.validateAssignmentAccess(assignment, userId);
    
    // Validate educational requirements if provided
    if (this.hasEducationalData(data)) {
      this.validateEducationalRequirements(data as CreateAssignmentInput);
    }
    
    // Update assignment
    Object.assign(assignment, data);
    await assignment.save();
    
    return await Assignment.findById(assignmentId)
      .populate('instructor', 'firstName lastName email')
      .populate('course', 'title') as IAssignment;
  }
  
  /**
   * Publish an assignment
   */
  static async publishAssignment(assignmentId: string, userId: string): Promise<IAssignment> {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      throw new Error('Assignment not found');
    }
    
    // Check permissions
    await this.validateAssignmentAccess(assignment, userId);
    
    // Validate assignment is ready for publication
    await this.validateForPublication(assignment);
    
    assignment.status = 'published';
    assignment.publishedAt = new Date();
    await assignment.save();
    
    return assignment;
  }
  
  /**
   * Validate assignment educational requirements
   */
  static validateAssignmentEducationalRequirements(assignment: IAssignment): AssignmentValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check required fields
    if (!assignment.title?.trim()) {
      errors.push('Title is required');
    }
    if (!assignment.description?.trim()) {
      errors.push('Description is required');
    }
    if (!assignment.instructions?.trim()) {
      errors.push('Instructions are required');
    }
    
    // Validate learning objectives
    if (!assignment.learningObjectives || assignment.learningObjectives.length === 0) {
      warnings.push('No learning objectives defined');
    } else {
      const totalWeight = assignment.learningObjectives.reduce((sum, obj) => sum + obj.weight, 0);
      if (totalWeight !== 100) {
        errors.push('Learning objectives weights must sum to 100%');
      }
    }
    
    // Validate writing stages
    if (assignment.writingStages && assignment.writingStages.length > 0) {
      const orders = assignment.writingStages.map(stage => stage.order);
      const uniqueOrders = new Set(orders);
      if (orders.length !== uniqueOrders.size) {
        errors.push('Writing stages must have unique order values');
      }
    }
    
    // Validate AI settings
    if (assignment.aiSettings.enabled && assignment.aiSettings.stageSpecificSettings) {
      const stageIds = new Set(assignment.writingStages?.map(stage => stage.id) || []);
      for (const setting of assignment.aiSettings.stageSpecificSettings) {
        if (!stageIds.has(setting.stageId)) {
          errors.push(`AI setting references invalid stage ID: ${setting.stageId}`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Get assignments by course with proper access control
   */
  static async getAssignmentsByCourse(courseId: string, userId: string, userRole: string, filters: any = {}): Promise<IAssignment[]> {
    // Verify course access
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    
    const isInstructor = course.instructor.toString() === userId;
    const isStudent = course.students.some((studentId: any) => studentId.toString() === userId);
    const isAdmin = userRole === 'admin';
    
    if (!isInstructor && !isStudent && !isAdmin) {
      throw new Error('Access denied to this course');
    }
    
    // Build filter
    const filter: any = { course: courseId };
    Object.assign(filter, filters);
    
    // Students only see published assignments
    if (!isInstructor && !isAdmin) {
      filter.status = 'published';
    }
    
    return await Assignment.find(filter)
      .populate('instructor', 'firstName lastName email')
      .populate('submissionCount')
      .sort({ createdAt: -1 });
  }
  
  /**
   * Archive an assignment (soft delete)
   */
  static async archiveAssignment(assignmentId: string, userId: string): Promise<void> {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      throw new Error('Assignment not found');
    }
    
    await this.validateAssignmentAccess(assignment, userId);
    
    assignment.status = 'archived';
    await assignment.save();
  }
  
  // Private helper methods
  
  private static validateCreateAssignmentInput(data: CreateAssignmentInput): void {
    if (!data.title?.trim()) {
      throw new Error('Assignment title is required');
    }
    if (!data.description?.trim()) {
      throw new Error('Assignment description is required');
    }
    if (!data.instructions?.trim()) {
      throw new Error('Assignment instructions are required');
    }
    if (!data.courseId) {
      throw new Error('Course ID is required');
    }
  }
  
  private static async validateCourseAccess(courseId: string, userId: string): Promise<void> {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    
    const isInstructor = course.instructor.toString() === userId;
    // Note: We'd need to get user role from somewhere, possibly pass it as parameter
    // For now, assuming instructor access is sufficient
    if (!isInstructor) {
      throw new Error('Only course instructors can create assignments');
    }
  }
  
  private static async validateAssignmentAccess(assignment: IAssignment, userId: string): Promise<void> {
    const isInstructor = assignment.instructor.toString() === userId;
    // Note: Would check admin role if passed as parameter
    if (!isInstructor) {
      throw new Error('Only the assignment creator can modify it');
    }
  }
  
  private static validateEducationalRequirements(data: CreateAssignmentInput | UpdateAssignmentInput): void {
    // Validate learning objectives weights if provided
    if (data.learningObjectives && data.learningObjectives.length > 0) {
      const totalWeight = data.learningObjectives.reduce((sum, obj) => sum + obj.weight, 0);
      if (totalWeight !== 100) {
        throw new Error('Learning objectives weights must sum to 100%');
      }
    }
    
    // Validate writing stages have unique orders if provided
    if (data.writingStages && data.writingStages.length > 0) {
      const orders = data.writingStages.map(stage => stage.order);
      const uniqueOrders = new Set(orders);
      if (orders.length !== uniqueOrders.size) {
        throw new Error('Writing stages must have unique order values');
      }
    }
    
    // Validate AI stage settings reference valid stages if provided
    if (data.aiSettings?.stageSpecificSettings && data.writingStages) {
      const stageIds = new Set(data.writingStages.map(stage => stage.id));
      for (const setting of data.aiSettings.stageSpecificSettings) {
        if (!stageIds.has(setting.stageId)) {
          throw new Error(`AI setting references invalid stage ID: ${setting.stageId}`);
        }
      }
    }
  }
  
  private static buildAssignmentData(data: CreateAssignmentInput, userId: string): any {
    return {
      title: data.title,
      description: data.description,
      instructions: data.instructions,
      course: new Types.ObjectId(data.courseId),
      instructor: new Types.ObjectId(userId),
      type: data.type || 'individual',
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      requirements: data.requirements || {},
      collaboration: {
        enabled: data.type === 'collaborative',
        allowRealTimeEditing: data.type === 'collaborative',
        allowComments: true,
        allowSuggestions: true,
        requireApprovalForChanges: false,
        ...data.collaboration
      },
      versionControl: {
        autoSaveInterval: 30,
        createVersionOnSubmit: true,
        allowVersionRevert: false,
        trackAllChanges: true,
        ...data.versionControl
      },
      learningObjectives: data.learningObjectives || [],
      writingStages: data.writingStages || [],
      aiSettings: {
        enabled: false,
        globalBoundary: 'moderate' as const,
        allowedAssistanceTypes: [],
        requireReflection: true,
        reflectionPrompts: [],
        stageSpecificSettings: [],
        ...data.aiSettings
      },
      grading: {
        enabled: false,
        allowPeerReview: false,
        ...data.grading
      }
    };
  }
  
  private static async validateForPublication(assignment: IAssignment): Promise<void> {
    const validation = this.validateAssignmentEducationalRequirements(assignment);
    if (!validation.isValid) {
      throw new Error(`Cannot publish assignment: ${validation.errors.join(', ')}`);
    }
  }
  
  private static hasEducationalData(data: UpdateAssignmentInput): boolean {
    return !!(data.learningObjectives || data.writingStages || data.aiSettings);
  }
}