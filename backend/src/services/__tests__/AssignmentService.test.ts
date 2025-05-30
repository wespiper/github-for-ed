import { CreateAssignmentInput } from '@shared/types';

// Mock Prisma before importing AssignmentService
jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    assignment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    },
    course: {
      findUnique: jest.fn()
    },
    $disconnect: jest.fn()
  }
}));

// Import AssignmentService after mocks are set up
import { AssignmentService } from '../AssignmentService';
import prisma from '../../lib/prisma';

describe('AssignmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAssignment', () => {
    const validAssignmentData: CreateAssignmentInput = {
      title: 'Test Assignment',
      description: 'Test Description',
      instructions: 'Test Instructions',
      courseId: '123e4567-e89b-12d3-a456-426614174000',
      type: 'individual',
      learningObjectives: [
        {
          id: 'obj1',
          description: 'Test objective',
          category: 'knowledge',
          bloomsLevel: 1,
          assessmentCriteria: ['criteria1'],
          weight: 100
        }
      ]
    };

    const mockCourse = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      instructorId: '123e4567-e89b-12d3-a456-426614174001',
      title: 'Test Course',
      description: 'Test course description',
      subject: 'English',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockAssignment = {
      id: '123e4567-e89b-12d3-a456-426614174002',
      ...validAssignmentData,
      instructorId: '123e4567-e89b-12d3-a456-426614174001',
      status: 'draft' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should create assignment successfully with valid data', async () => {
      // Arrange
      (prisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse as any);
      (prisma.assignment.create as jest.Mock).mockResolvedValue(mockAssignment as any);

      // Act
      const result = await AssignmentService.createAssignment(
        validAssignmentData,
        '123e4567-e89b-12d3-a456-426614174001'
      );

      // Assert
      expect(prisma.course.findUnique).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' }
      });
      expect(prisma.assignment.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw error if course not found', async () => {
      // Arrange
      (prisma.course.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        AssignmentService.createAssignment(validAssignmentData, '123e4567-e89b-12d3-a456-426614174001')
      ).rejects.toThrow('Course not found');
    });

    it('should throw error if user is not instructor', async () => {
      // Arrange
      const mockCourseWithDifferentInstructor = {
        ...mockCourse,
        instructorId: 'different_instructor_id'
      };
      (prisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourseWithDifferentInstructor as any);

      // Act & Assert
      await expect(
        AssignmentService.createAssignment(validAssignmentData, '123e4567-e89b-12d3-a456-426614174001')
      ).rejects.toThrow('Only course instructors can create assignments');
    });

    it('should throw error if title is missing', async () => {
      // Arrange
      const invalidData = { ...validAssignmentData, title: '' };

      // Act & Assert
      await expect(
        AssignmentService.createAssignment(invalidData, '123e4567-e89b-12d3-a456-426614174001')
      ).rejects.toThrow('Assignment title is required');
    });

    it('should throw error if learning objectives weights do not sum to 100%', async () => {
      // Arrange
      (prisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse as any);
      const invalidData = {
        ...validAssignmentData,
        learningObjectives: [
          {
            id: 'obj1',
            description: 'Test objective',
            category: 'knowledge' as const,
            bloomsLevel: 1 as const,
            assessmentCriteria: ['criteria1'],
            weight: 50 // Should be 100 for single objective
          }
        ]
      };

      // Act & Assert
      await expect(
        AssignmentService.createAssignment(invalidData, '123e4567-e89b-12d3-a456-426614174001')
      ).rejects.toThrow('Learning objectives weights must sum to 100%');
    });

    it('should throw error if writing stages have duplicate orders', async () => {
      // Arrange
      (prisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse as any);
      const invalidData = {
        ...validAssignmentData,
        writingStages: [
          {
            id: 'stage1',
            name: 'Stage 1',
            description: 'First stage',
            order: 1,
            required: true,
            allowAI: false,
            aiAssistanceLevel: 'none' as const
          },
          {
            id: 'stage2',
            name: 'Stage 2',
            description: 'Second stage',
            order: 1, // Duplicate order
            required: true,
            allowAI: false,
            aiAssistanceLevel: 'none' as const
          }
        ]
      };

      // Act & Assert
      await expect(
        AssignmentService.createAssignment(invalidData, '123e4567-e89b-12d3-a456-426614174001')
      ).rejects.toThrow('Writing stages must have unique order values');
    });
  });

  describe('validateAssignmentEducationalRequirements', () => {
    const mockAssignment = {
      title: 'Test Assignment',
      description: 'Test Description',
      instructions: 'Test Instructions',
      learningObjectives: [
        {
          id: 'obj1',
          description: 'Test objective',
          category: 'knowledge',
          bloomsLevel: 1,
          assessmentCriteria: ['criteria1'],
          weight: 100
        }
      ],
      writingStages: [
        {
          id: 'stage1',
          name: 'Stage 1',
          description: 'First stage',
          order: 1,
          required: true,
          allowAI: false,
          aiAssistanceLevel: 'none'
        }
      ],
      aiSettings: {
        enabled: false,
        globalBoundary: 'moderate',
        allowedAssistanceTypes: [],
        requireReflection: true,
        reflectionPrompts: [],
        stageSpecificSettings: []
      }
    } as any;

    it('should return valid for properly structured assignment', () => {
      // Act
      const result = AssignmentService.validateAssignmentEducationalRequirements(mockAssignment);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for missing required fields', () => {
      // Arrange
      const invalidAssignment = { ...mockAssignment, title: '' };

      // Act
      const result = AssignmentService.validateAssignmentEducationalRequirements(invalidAssignment);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title is required');
    });

    it('should return warning for missing learning objectives', () => {
      // Arrange
      const assignmentWithoutObjectives = { ...mockAssignment, learningObjectives: [] };

      // Act
      const result = AssignmentService.validateAssignmentEducationalRequirements(assignmentWithoutObjectives);

      // Assert
      expect(result.warnings).toContain('No learning objectives defined');
    });

    it('should return error for invalid learning objectives weights', () => {
      // Arrange
      const assignmentWithInvalidWeights = {
        ...mockAssignment,
        learningObjectives: [
          { ...mockAssignment.learningObjectives[0], weight: 50 }
        ]
      };

      // Act
      const result = AssignmentService.validateAssignmentEducationalRequirements(assignmentWithInvalidWeights);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Learning objectives weights must sum to 100%');
    });
  });

  describe('publishAssignment', () => {
    const mockAssignment = {
      id: '123e4567-e89b-12d3-a456-426614174002',
      instructorId: '123e4567-e89b-12d3-a456-426614174001',
      title: 'Test Assignment',
      description: 'Test Description',
      instructions: 'Test Instructions',
      learningObjectives: [
        {
          id: 'obj1',
          description: 'Test objective',
          category: 'knowledge',
          bloomsLevel: 1,
          assessmentCriteria: ['criteria1'],
          weight: 100
        }
      ],
      aiSettings: {
        enabled: false,
        globalBoundary: 'moderate',
        allowedAssistanceTypes: [],
        requireReflection: true,
        reflectionPrompts: [],
        stageSpecificSettings: []
      },
      status: 'draft' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should publish assignment successfully', async () => {
      // Arrange
      const updatedAssignment = { ...mockAssignment, status: 'published' as const };
      (prisma.assignment.findUnique as jest.Mock).mockResolvedValue(mockAssignment as any);
      (prisma.assignment.update as jest.Mock).mockResolvedValue(updatedAssignment as any);

      // Act
      const result = await AssignmentService.publishAssignment(
        '123e4567-e89b-12d3-a456-426614174002',
        '123e4567-e89b-12d3-a456-426614174001'
      );

      // Assert
      expect(prisma.assignment.update).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174002' },
        data: { status: 'published' }
      });
      expect(result).toBeDefined();
    });

    it('should throw error if assignment not found', async () => {
      // Arrange
      (prisma.assignment.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        AssignmentService.publishAssignment('invalid_id', '123e4567-e89b-12d3-a456-426614174001')
      ).rejects.toThrow('Assignment not found');
    });

    it('should throw error if user is not assignment creator', async () => {
      // Arrange
      const assignmentWithDifferentInstructor = {
        ...mockAssignment,
        instructorId: 'different_instructor_id'
      };
      (prisma.assignment.findUnique as jest.Mock).mockResolvedValue(assignmentWithDifferentInstructor as any);

      // Act & Assert
      await expect(
        AssignmentService.publishAssignment('123e4567-e89b-12d3-a456-426614174002', '123e4567-e89b-12d3-a456-426614174001')
      ).rejects.toThrow('Only the assignment creator can modify it');
    });
  });
});