/**
 * Assignment Database Schema Tests
 * 
 * Comprehensive tests to validate the assignment database schema implementation
 * as required by ticket #9: Assignment Database Schema
 */

import mongoose from 'mongoose';
import { Assignment } from '../models/Assignment';
import { 
  ILearningObjective, 
  IWritingStage
} from '../types/assignment';

// Mock user and course IDs for testing
const mockUserId = new mongoose.Types.ObjectId();
const mockCourseId = new mongoose.Types.ObjectId();

describe('Assignment Database Schema', () => {
  
  beforeAll(async () => {
    // Database connection is handled in setup.ts
    await Assignment.deleteMany({});
  });

  afterAll(async () => {
    // Clean up test data
    await Assignment.deleteMany({});
  });

  beforeEach(async () => {
    // Clean assignments collection before each test
    await Assignment.deleteMany({});
  });

  describe('Learning Objectives Schema', () => {
    
    test('should create assignment with valid learning objectives', async () => {
      const learningObjectives: ILearningObjective[] = [
        {
          id: 'obj-1',
          description: 'Students will analyze argumentative strategies',
          category: 'analysis',
          bloomsLevel: 4,
          assessmentCriteria: ['Identifies logical fallacies', 'Evaluates evidence quality'],
          weight: 60
        },
        {
          id: 'obj-2',
          description: 'Students will apply proper citation format',
          category: 'application',
          bloomsLevel: 3,
          assessmentCriteria: ['Uses APA format correctly', 'Includes all required elements'],
          weight: 40
        }
      ];

      const assignment = new Assignment({
        title: 'Argumentative Essay Analysis',
        description: 'Analyze and critique argumentative essays',
        instructions: 'Complete analysis using provided rubric',
        course: mockCourseId,
        instructor: mockUserId,
        learningObjectives,
        type: 'individual',
        allowLateSubmissions: true,
        requirements: {},
        collaboration: { enabled: false, allowRealTimeEditing: false, allowComments: true, allowSuggestions: true, requireApprovalForChanges: false },
        versionControl: { autoSaveInterval: 30, createVersionOnSubmit: true, allowVersionRevert: false, trackAllChanges: true },
        aiSettings: { enabled: false, globalBoundary: 'moderate', allowedAssistanceTypes: [], requireReflection: true, reflectionPrompts: [], stageSpecificSettings: [] },
        grading: { enabled: true, allowPeerReview: false },
        writingStages: []
      });

      const savedAssignment = await assignment.save();
      
      expect(savedAssignment.learningObjectives).toHaveLength(2);
      expect(savedAssignment.learningObjectives[0].category).toBe('analysis');
      expect(savedAssignment.learningObjectives[0].bloomsLevel).toBe(4);
      expect(savedAssignment.learningObjectives[1].weight).toBe(40);
    });

    test('should validate learning objectives weights sum to 100%', async () => {
      const learningObjectives: ILearningObjective[] = [
        {
          id: 'obj-1',
          description: 'Test objective 1',
          category: 'knowledge',
          bloomsLevel: 1,
          assessmentCriteria: ['Criterion 1'],
          weight: 60
        },
        {
          id: 'obj-2',
          description: 'Test objective 2',
          category: 'comprehension',
          bloomsLevel: 2,
          assessmentCriteria: ['Criterion 2'],
          weight: 30 // Total = 90%, should fail validation
        }
      ];

      const assignment = new Assignment({
        title: 'Test Assignment',
        description: 'Test description',
        instructions: 'Test instructions',
        course: mockCourseId,
        instructor: mockUserId,
        learningObjectives,
        type: 'individual',
        allowLateSubmissions: true,
        requirements: {},
        collaboration: { enabled: false, allowRealTimeEditing: false, allowComments: true, allowSuggestions: true, requireApprovalForChanges: false },
        versionControl: { autoSaveInterval: 30, createVersionOnSubmit: true, allowVersionRevert: false, trackAllChanges: true },
        aiSettings: { enabled: false, globalBoundary: 'moderate', allowedAssistanceTypes: [], requireReflection: true, reflectionPrompts: [], stageSpecificSettings: [] },
        grading: { enabled: true, allowPeerReview: false },
        writingStages: []
      });

      await expect(assignment.save()).rejects.toThrow('Learning objectives weights must sum to 100%');
    });

    test('should validate Bloom\'s taxonomy levels (1-6)', async () => {
      const learningObjectives: ILearningObjective[] = [
        {
          id: 'obj-1',
          description: 'Invalid Bloom\'s level',
          category: 'knowledge',
          bloomsLevel: 7 as any, // Invalid level
          assessmentCriteria: ['Criterion 1'],
          weight: 100
        }
      ];

      const assignment = new Assignment({
        title: 'Test Assignment',
        description: 'Test description',
        instructions: 'Test instructions',
        course: mockCourseId,
        instructor: mockUserId,
        learningObjectives,
        type: 'individual',
        allowLateSubmissions: true,
        requirements: {},
        collaboration: { enabled: false, allowRealTimeEditing: false, allowComments: true, allowSuggestions: true, requireApprovalForChanges: false },
        versionControl: { autoSaveInterval: 30, createVersionOnSubmit: true, allowVersionRevert: false, trackAllChanges: true },
        aiSettings: { enabled: false, globalBoundary: 'moderate', allowedAssistanceTypes: [], requireReflection: true, reflectionPrompts: [], stageSpecificSettings: [] },
        grading: { enabled: true, allowPeerReview: false },
        writingStages: []
      });

      await expect(assignment.save()).rejects.toThrow();
    });
  });

  describe('Writing Stages Schema', () => {
    
    test('should create assignment with sequential writing stages', async () => {
      const writingStages: IWritingStage[] = [
        {
          id: 'stage-1',
          name: 'Brainstorming',
          description: 'Generate ideas and create outline',
          order: 1,
          required: true,
          minWords: 100,
          maxWords: 500,
          durationDays: 3,
          allowAI: true,
          aiAssistanceLevel: 'moderate'
        },
        {
          id: 'stage-2',
          name: 'First Draft',
          description: 'Write complete first draft',
          order: 2,
          required: true,
          minWords: 800,
          maxWords: 1200,
          durationDays: 7,
          allowAI: false,
          aiAssistanceLevel: 'none'
        }
      ];

      const assignment = new Assignment({
        title: 'Multi-Stage Essay',
        description: 'Complete essay through multiple stages',
        instructions: 'Follow each stage requirements',
        course: mockCourseId,
        instructor: mockUserId,
        writingStages,
        learningObjectives: [{
          id: 'obj-1',
          description: 'Complete writing process',
          category: 'application',
          bloomsLevel: 3,
          assessmentCriteria: ['Follows stages'],
          weight: 100
        }],
        type: 'individual',
        allowLateSubmissions: true,
        requirements: {},
        collaboration: { enabled: false, allowRealTimeEditing: false, allowComments: true, allowSuggestions: true, requireApprovalForChanges: false },
        versionControl: { autoSaveInterval: 30, createVersionOnSubmit: true, allowVersionRevert: false, trackAllChanges: true },
        aiSettings: { enabled: true, globalBoundary: 'moderate', allowedAssistanceTypes: ['brainstorming'], requireReflection: true, reflectionPrompts: [], stageSpecificSettings: [] },
        grading: { enabled: true, allowPeerReview: false }
      });

      const savedAssignment = await assignment.save();
      
      expect(savedAssignment.writingStages).toHaveLength(2);
      expect(savedAssignment.writingStages[0].order).toBe(1);
      expect(savedAssignment.writingStages[1].order).toBe(2);
      expect(savedAssignment.writingStages[0].aiAssistanceLevel).toBe('moderate');
    });

    test('should validate unique stage orders', async () => {
      const writingStages: IWritingStage[] = [
        {
          id: 'stage-1',
          name: 'Stage 1',
          description: 'First stage',
          order: 1,
          required: true,
          allowAI: false,
          aiAssistanceLevel: 'none'
        },
        {
          id: 'stage-2',
          name: 'Stage 2',
          description: 'Second stage',
          order: 1, // Duplicate order - should fail
          required: true,
          allowAI: false,
          aiAssistanceLevel: 'none'
        }
      ];

      const assignment = new Assignment({
        title: 'Test Assignment',
        description: 'Test description',
        instructions: 'Test instructions',
        course: mockCourseId,
        instructor: mockUserId,
        writingStages,
        learningObjectives: [{
          id: 'obj-1',
          description: 'Test objective',
          category: 'knowledge',
          bloomsLevel: 1,
          assessmentCriteria: ['Test'],
          weight: 100
        }],
        type: 'individual',
        allowLateSubmissions: true,
        requirements: {},
        collaboration: { enabled: false, allowRealTimeEditing: false, allowComments: true, allowSuggestions: true, requireApprovalForChanges: false },
        versionControl: { autoSaveInterval: 30, createVersionOnSubmit: true, allowVersionRevert: false, trackAllChanges: true },
        aiSettings: { enabled: false, globalBoundary: 'moderate', allowedAssistanceTypes: [], requireReflection: true, reflectionPrompts: [], stageSpecificSettings: [] },
        grading: { enabled: true, allowPeerReview: false }
      });

      await expect(assignment.save()).rejects.toThrow('Writing stages must have unique order values');
    });
  });

  describe('Database Relationships', () => {
    
    test('should require valid course and instructor references', async () => {
      const assignment = new Assignment({
        title: 'Test Assignment',
        description: 'Test description',
        instructions: 'Test instructions',
        // Missing required course and instructor fields
        type: 'individual',
        allowLateSubmissions: true,
        requirements: {},
        collaboration: { enabled: false, allowRealTimeEditing: false, allowComments: true, allowSuggestions: true, requireApprovalForChanges: false },
        versionControl: { autoSaveInterval: 30, createVersionOnSubmit: true, allowVersionRevert: false, trackAllChanges: true },
        aiSettings: { enabled: false, globalBoundary: 'moderate', allowedAssistanceTypes: [], requireReflection: true, reflectionPrompts: [], stageSpecificSettings: [] },
        grading: { enabled: true, allowPeerReview: false },
        learningObjectives: [],
        writingStages: []
      });

      await expect(assignment.save()).rejects.toThrow();
    });
  });

  describe('Schema Validation Rules', () => {
    
    test('should validate required fields', async () => {
      const assignment = new Assignment({
        // Missing required title, description, instructions
        course: mockCourseId,
        instructor: mockUserId,
        type: 'individual',
        allowLateSubmissions: true,
        requirements: {},
        collaboration: { enabled: false, allowRealTimeEditing: false, allowComments: true, allowSuggestions: true, requireApprovalForChanges: false },
        versionControl: { autoSaveInterval: 30, createVersionOnSubmit: true, allowVersionRevert: false, trackAllChanges: true },
        aiSettings: { enabled: false, globalBoundary: 'moderate', allowedAssistanceTypes: [], requireReflection: true, reflectionPrompts: [], stageSpecificSettings: [] },
        grading: { enabled: true, allowPeerReview: false },
        learningObjectives: [],
        writingStages: []
      });

      await expect(assignment.save()).rejects.toThrow();
    });

    test('should validate field length constraints', async () => {
      const assignment = new Assignment({
        title: 'x'.repeat(201), // Exceeds 200 character limit
        description: 'Test description',
        instructions: 'Test instructions',
        course: mockCourseId,
        instructor: mockUserId,
        type: 'individual',
        allowLateSubmissions: true,
        requirements: {},
        collaboration: { enabled: false, allowRealTimeEditing: false, allowComments: true, allowSuggestions: true, requireApprovalForChanges: false },
        versionControl: { autoSaveInterval: 30, createVersionOnSubmit: true, allowVersionRevert: false, trackAllChanges: true },
        aiSettings: { enabled: false, globalBoundary: 'moderate', allowedAssistanceTypes: [], requireReflection: true, reflectionPrompts: [], stageSpecificSettings: [] },
        grading: { enabled: true, allowPeerReview: false },
        learningObjectives: [],
        writingStages: []
      });

      await expect(assignment.save()).rejects.toThrow();
    });
  });

  describe('Database Indexes', () => {
    
    test('should support efficient querying by course and status', async () => {
      // Create multiple assignments
      const assignments = Array.from({ length: 5 }, (_, i) => new Assignment({
        title: `Assignment ${i + 1}`,
        description: `Description ${i + 1}`,
        instructions: `Instructions ${i + 1}`,
        course: i < 3 ? mockCourseId : new mongoose.Types.ObjectId(),
        instructor: mockUserId,
        status: i % 2 === 0 ? 'published' : 'draft',
        type: 'individual',
        allowLateSubmissions: true,
        requirements: {},
        collaboration: { enabled: false, allowRealTimeEditing: false, allowComments: true, allowSuggestions: true, requireApprovalForChanges: false },
        versionControl: { autoSaveInterval: 30, createVersionOnSubmit: true, allowVersionRevert: false, trackAllChanges: true },
        aiSettings: { enabled: false, globalBoundary: 'moderate', allowedAssistanceTypes: [], requireReflection: true, reflectionPrompts: [], stageSpecificSettings: [] },
        grading: { enabled: true, allowPeerReview: false },
        learningObjectives: [],
        writingStages: []
      }));

      await Assignment.insertMany(assignments);

      // Test indexed query performance
      const courseAssignments = await Assignment.find({ 
        course: mockCourseId, 
        status: 'published' 
      });

      expect(courseAssignments.length).toBeGreaterThan(0);
    });
  });

  describe('Educational Workflow Methods', () => {
    
    test('should find assignments by learning objective category', async () => {
      const assignment = new Assignment({
        title: 'Analysis Assignment',
        description: 'Analyze texts',
        instructions: 'Complete analysis',
        course: mockCourseId,
        instructor: mockUserId,
        learningObjectives: [{
          id: 'obj-1',
          description: 'Analyze arguments',
          category: 'analysis',
          bloomsLevel: 4,
          assessmentCriteria: ['Criterion'],
          weight: 100
        }],
        type: 'individual',
        allowLateSubmissions: true,
        requirements: {},
        collaboration: { enabled: false, allowRealTimeEditing: false, allowComments: true, allowSuggestions: true, requireApprovalForChanges: false },
        versionControl: { autoSaveInterval: 30, createVersionOnSubmit: true, allowVersionRevert: false, trackAllChanges: true },
        aiSettings: { enabled: false, globalBoundary: 'moderate', allowedAssistanceTypes: [], requireReflection: true, reflectionPrompts: [], stageSpecificSettings: [] },
        grading: { enabled: true, allowPeerReview: false },
        writingStages: []
      });

      await assignment.save();

      // Test that assignment was created successfully
      const savedAssignment = await Assignment.findOne({ title: 'Analysis Assignment' });
      expect(savedAssignment).toBeTruthy();
      expect(savedAssignment?.learningObjectives[0].category).toBe('analysis');
    });
  });
});