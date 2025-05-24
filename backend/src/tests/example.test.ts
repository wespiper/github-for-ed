/**
 * Example Test File
 * 
 * Demonstrates proper test structure for the GitHub for Writers backend
 */

import mongoose from 'mongoose';
import { Assignment } from '../models/Assignment';
import { validateRequest, assignmentValidationSchemas } from '../middleware/validation';

describe('Example Tests', () => {
  
  beforeEach(async () => {
    // Clean up before each test
    await Assignment.deleteMany({});
  });

  describe('Assignment Model', () => {
    test('should create a basic assignment', async () => {
      const assignmentData = {
        title: 'Test Assignment',
        description: 'Test description',
        instructions: 'Test instructions',
        course: new mongoose.Types.ObjectId(),
        instructor: new mongoose.Types.ObjectId(),
        type: 'individual' as const,
        allowLateSubmissions: true,
        requirements: {},
        collaboration: {
          enabled: false,
          allowRealTimeEditing: false,
          allowComments: true,
          allowSuggestions: true,
          requireApprovalForChanges: false
        },
        versionControl: {
          autoSaveInterval: 30,
          createVersionOnSubmit: true,
          allowVersionRevert: false,
          trackAllChanges: true
        },
        aiSettings: {
          enabled: false,
          globalBoundary: 'moderate' as const,
          allowedAssistanceTypes: [],
          requireReflection: true,
          reflectionPrompts: [],
          stageSpecificSettings: []
        },
        grading: {
          enabled: false,
          allowPeerReview: false
        },
        learningObjectives: [],
        writingStages: []
      };

      const assignment = new Assignment(assignmentData);
      const savedAssignment = await assignment.save();

      expect(savedAssignment._id).toBeDefined();
      expect(savedAssignment.title).toBe('Test Assignment');
      expect(savedAssignment.type).toBe('individual');
      expect(savedAssignment.status).toBe('draft'); // default value
    });

    test('should validate required fields', async () => {
      const assignment = new Assignment({
        // Missing required fields
        course: new mongoose.Types.ObjectId(),
        instructor: new mongoose.Types.ObjectId()
      });

      await expect(assignment.save()).rejects.toThrow();
    });
  });

  describe('Validation Middleware', () => {
    test('should validate assignment creation schema', () => {
      const schema = assignmentValidationSchemas.createAssignment;
      
      expect(schema.body).toBeDefined();
      expect(schema.body?.find(rule => rule.field === 'title')).toMatchObject({
        field: 'title',
        required: true,
        type: 'string',
        maxLength: 200
      });
    });

    test('should validate MongoDB ObjectId format', () => {
      const { customValidators } = require('../middleware/validation');
      
      expect(customValidators.mongoId('507f1f77bcf86cd799439011')).toBeNull(); // valid
      expect(customValidators.mongoId('invalid-id')).toBe('Invalid MongoDB ObjectId format'); // invalid
    });
  });

  describe('Learning Objectives Validation', () => {
    test('should validate learning objectives weights', () => {
      const { customValidators } = require('../middleware/validation');
      
      const validObjectives = [
        { weight: 60 },
        { weight: 40 }
      ];
      
      const invalidObjectives = [
        { weight: 60 },
        { weight: 30 } // Total = 90%, not 100%
      ];
      
      expect(customValidators.learningObjectivesWeights(validObjectives)).toBeNull();
      expect(customValidators.learningObjectivesWeights(invalidObjectives))
        .toBe('Learning objectives weights must sum to 100%');
    });
  });

});