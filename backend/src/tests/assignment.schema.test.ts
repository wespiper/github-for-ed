/**
 * Assignment Database Schema Tests
 * 
 * Comprehensive tests to validate the assignment database schema implementation
 * using PostgreSQL/Prisma for the educational writing platform
 */

import prisma from '../lib/prisma';

describe('Assignment Schema Tests', () => {
  
  beforeEach(async () => {
    // Clean up before each test
    await prisma.assignment.deleteMany({});
    await prisma.course.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    // Cleanup after all tests
    await prisma.$disconnect();
  });

  describe('Assignment Creation', () => {
    it('should create assignment with required fields', async () => {
      // Create test user and course first
      const user = await prisma.user.create({
        data: {
          email: 'instructor@test.com',
          passwordHash: 'hashed_password',
          firstName: 'Test',
          lastName: 'Instructor',
          role: 'educator',
          isVerified: true
        }
      });

      const course = await prisma.course.create({
        data: {
          title: 'Test Course',
          instructorId: user.id,
          isPublic: false,
          isActive: true,
          maxStudents: 30,
          tags: [],
          settings: {}
        }
      });

      // Create assignment
      const assignment = await prisma.assignment.create({
        data: {
          title: 'Test Assignment',
          instructions: 'Complete this assignment',
          courseId: course.id,
          instructorId: user.id,
          requirements: {},
          writingStages: [],
          learningObjectives: [],
          aiSettings: {},
          collaborationSettings: {},
          versionControlSettings: {}
        }
      });

      expect(assignment).toBeDefined();
      expect(assignment.title).toBe('Test Assignment');
      expect(assignment.courseId).toBe(course.id);
      expect(assignment.instructorId).toBe(user.id);
    });

    it('should create assignment with learning objectives', async () => {
      // Create test data
      const user = await prisma.user.create({
        data: {
          email: 'instructor2@test.com',
          passwordHash: 'hashed_password',
          firstName: 'Test',
          lastName: 'Instructor',
          role: 'educator',
          isVerified: true
        }
      });

      const course = await prisma.course.create({
        data: {
          title: 'Advanced Writing Course',
          instructorId: user.id,
          isPublic: false,
          isActive: true,
          maxStudents: 25,
          tags: ['writing', 'advanced'],
          settings: {}
        }
      });

      const learningObjectives = [
        {
          id: 'obj1',
          description: 'Demonstrate understanding of thesis statements',
          category: 'comprehension',
          bloomsLevel: 2,
          assessmentCriteria: ['Clear thesis', 'Proper placement'],
          weight: 25
        },
        {
          id: 'obj2', 
          description: 'Apply critical analysis techniques',
          category: 'application',
          bloomsLevel: 3,
          assessmentCriteria: ['Evidence analysis', 'Logical reasoning'],
          weight: 40
        }
      ];

      const assignment = await prisma.assignment.create({
        data: {
          title: 'Critical Analysis Essay',
          instructions: 'Write a critical analysis of the provided text',
          courseId: course.id,
          instructorId: user.id,
          requirements: {
            minWords: 1000,
            maxWords: 1500,
            citationStyle: 'MLA'
          },
          writingStages: [
            {
              id: 'stage1',
              name: 'Prewriting',
              description: 'Research and outline',
              order: 1,
              required: true,
              allowAI: true,
              aiAssistanceLevel: 'moderate'
            }
          ],
          learningObjectives,
          aiSettings: {
            enabled: true,
            globalBoundary: 'moderate',
            allowedAssistanceTypes: ['research', 'outlining'],
            requireReflection: true
          },
          collaborationSettings: {
            enabled: false,
            allowRealTimeEditing: false,
            allowComments: true,
            allowSuggestions: false,
            requireApprovalForChanges: false
          },
          versionControlSettings: {
            autoSaveInterval: 30,
            createVersionOnSubmit: true,
            allowVersionRevert: true,
            trackAllChanges: true
          }
        }
      });

      expect(assignment.learningObjectives).toEqual(learningObjectives);
      expect(assignment.requirements).toMatchObject({
        minWords: 1000,
        maxWords: 1500,
        citationStyle: 'MLA'
      });
    });
  });

  describe('Assignment Queries', () => {
    it('should retrieve assignments by course', async () => {
      // Create test data
      const user = await prisma.user.create({
        data: {
          email: 'instructor3@test.com',
          passwordHash: 'hashed_password',
          firstName: 'Test',
          lastName: 'Instructor',
          role: 'educator',
          isVerified: true
        }
      });

      const course = await prisma.course.create({
        data: {
          title: 'Writing Fundamentals',
          instructorId: user.id,
          isPublic: false,
          isActive: true,
          maxStudents: 30,
          tags: [],
          settings: {}
        }
      });

      // Create multiple assignments
      await prisma.assignment.createMany({
        data: [
          {
            title: 'Assignment 1',
            instructions: 'First assignment',
            courseId: course.id,
            instructorId: user.id,
            requirements: {},
            writingStages: [],
            learningObjectives: [],
            aiSettings: {},
            collaborationSettings: {},
            versionControlSettings: {}
          },
          {
            title: 'Assignment 2', 
            instructions: 'Second assignment',
            courseId: course.id,
            instructorId: user.id,
            requirements: {},
            writingStages: [],
            learningObjectives: [],
            aiSettings: {},
            collaborationSettings: {},
            versionControlSettings: {}
          }
        ]
      });

      const assignments = await prisma.assignment.findMany({
        where: { courseId: course.id },
        orderBy: { title: 'asc' }
      });

      expect(assignments).toHaveLength(2);
      expect(assignments[0].title).toBe('Assignment 1');
      expect(assignments[1].title).toBe('Assignment 2');
    });
  });
});