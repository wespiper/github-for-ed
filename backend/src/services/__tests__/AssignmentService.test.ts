import { AssignmentService } from '../AssignmentService';
import { Assignment } from '../../models/Assignment';
import { Course } from '../../models/Course';
import { CreateAssignmentInput } from '@shared/types';

// Mock the models
jest.mock('../../models/Assignment', () => ({
  Assignment: jest.fn()
}));
jest.mock('../../models/Course', () => ({
  Course: {
    findById: jest.fn()
  }
}));

const { Assignment: MockedAssignment } = require('../../models/Assignment');
const { Course: MockedCourse } = require('../../models/Course');

describe('AssignmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAssignment', () => {
    const validAssignmentData: CreateAssignmentInput = {
      title: 'Test Assignment',
      description: 'Test Description',
      instructions: 'Test Instructions',
      courseId: '507f1f77bcf86cd799439011',
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
      _id: '507f1f77bcf86cd799439011',
      instructor: '507f1f77bcf86cd799439012',
      title: 'Test Course'
    };

    const mockAssignment = {
      _id: '507f1f77bcf86cd799439013',
      ...validAssignmentData,
      save: jest.fn().mockResolvedValue(true)
    };

    it('should create assignment successfully with valid data', async () => {
      // Arrange
      MockedCourse.findById.mockResolvedValue(mockCourse as any);
      MockedAssignment.mockImplementation(() => mockAssignment as any);
      MockedAssignment.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockAssignment)
        })
      });

      // Act
      const result = await AssignmentService.createAssignment(
        validAssignmentData,
        '507f1f77bcf86cd799439012'
      );

      // Assert
      expect(MockedCourse.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockAssignment.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw error if course not found', async () => {
      // Arrange
      MockedCourse.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        AssignmentService.createAssignment(validAssignmentData, '507f1f77bcf86cd799439012')
      ).rejects.toThrow('Course not found');
    });

    it('should throw error if user is not instructor', async () => {
      // Arrange
      const mockCourseWithDifferentInstructor = {
        ...mockCourse,
        instructor: 'different_instructor_id'
      };
      MockedCourse.findById.mockResolvedValue(mockCourseWithDifferentInstructor as any);

      // Act & Assert
      await expect(
        AssignmentService.createAssignment(validAssignmentData, '507f1f77bcf86cd799439012')
      ).rejects.toThrow('Only course instructors can create assignments');
    });

    it('should throw error if title is missing', async () => {
      // Arrange
      const invalidData = { ...validAssignmentData, title: '' };

      // Act & Assert
      await expect(
        AssignmentService.createAssignment(invalidData, '507f1f77bcf86cd799439012')
      ).rejects.toThrow('Assignment title is required');
    });

    it('should throw error if learning objectives weights do not sum to 100%', async () => {
      // Arrange
      MockedCourse.findById.mockResolvedValue(mockCourse as any);
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
        AssignmentService.createAssignment(invalidData, '507f1f77bcf86cd799439012')
      ).rejects.toThrow('Learning objectives weights must sum to 100%');
    });

    it('should throw error if writing stages have duplicate orders', async () => {
      // Arrange
      MockedCourse.findById.mockResolvedValue(mockCourse as any);
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
        AssignmentService.createAssignment(invalidData, '507f1f77bcf86cd799439012')
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
      _id: '507f1f77bcf86cd799439013',
      instructor: '507f1f77bcf86cd799439012',
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
      status: 'draft',
      save: jest.fn().mockResolvedValue(true)
    };

    it('should publish assignment successfully', async () => {
      // Arrange
      MockedAssignment.findById.mockResolvedValue(mockAssignment as any);

      // Act
      const result = await AssignmentService.publishAssignment(
        '507f1f77bcf86cd799439013',
        '507f1f77bcf86cd799439012'
      );

      // Assert
      expect(mockAssignment.status).toBe('published');
      expect(mockAssignment.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw error if assignment not found', async () => {
      // Arrange
      MockedAssignment.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        AssignmentService.publishAssignment('invalid_id', '507f1f77bcf86cd799439012')
      ).rejects.toThrow('Assignment not found');
    });

    it('should throw error if user is not assignment creator', async () => {
      // Arrange
      const assignmentWithDifferentInstructor = {
        ...mockAssignment,
        instructor: 'different_instructor_id'
      };
      MockedAssignment.findById.mockResolvedValue(assignmentWithDifferentInstructor as any);

      // Act & Assert
      await expect(
        AssignmentService.publishAssignment('507f1f77bcf86cd799439013', '507f1f77bcf86cd799439012')
      ).rejects.toThrow('Only the assignment creator can modify it');
    });
  });
});