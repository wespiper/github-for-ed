import { MockStudentRepository, MockAssignmentRepository, MockAIInteractionRepository } from '../../repositories/mock';

describe('Repository Pattern Basic Tests', () => {
  let studentRepo: MockStudentRepository;
  let assignmentRepo: MockAssignmentRepository;
  let aiRepo: MockAIInteractionRepository;

  beforeEach(() => {
    studentRepo = new MockStudentRepository();
    assignmentRepo = new MockAssignmentRepository();
    aiRepo = new MockAIInteractionRepository();
  });

  afterEach(() => {
    studentRepo.clearMockData();
    assignmentRepo.clearMockData();
    aiRepo.clearMockData();
  });

  describe('StudentRepository', () => {
    test('should find students by ID', async () => {
      const student = await studentRepo.findById('student-1');
      expect(student).toBeTruthy();
      expect(student?.id).toBe('student-1');
      expect(student?.role).toBe('student');
    });

    test('should count students', async () => {
      const count = await studentRepo.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should create new student', async () => {
      const newStudent = await studentRepo.create({
        email: 'new@test.com',
        passwordHash: 'hashed',
        firstName: 'New',
        lastName: 'Student',
        role: 'student',
        profilePicture: null,
        bio: null,
        isVerified: true
      });

      expect(newStudent.id).toBeTruthy();
      expect(newStudent.email).toBe('new@test.com');
      expect(newStudent.role).toBe('student');
    });

    test('should find students by course', async () => {
      const students = await studentRepo.findByCourseId('course-1');
      expect(students).toBeInstanceOf(Array);
    });
  });

  describe('AssignmentRepository', () => {
    test('should find assignments by ID', async () => {
      const assignment = await assignmentRepo.findById('assignment-1');
      expect(assignment).toBeTruthy();
      expect(assignment?.id).toBe('assignment-1');
    });

    test('should count assignments', async () => {
      const count = await assignmentRepo.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should find assignments by course', async () => {
      const assignments = await assignmentRepo.findByCourseId('course-1');
      expect(assignments).toBeInstanceOf(Array);
      expect(assignments.length).toBeGreaterThan(0);
    });

    test('should find assignments by instructor', async () => {
      const assignments = await assignmentRepo.findByInstructorId('instructor-1');
      expect(assignments).toBeInstanceOf(Array);
    });
  });

  describe('AIInteractionRepository', () => {
    test('should find interactions by ID', async () => {
      const interaction = await aiRepo.findById('interaction-1');
      expect(interaction).toBeTruthy();
      expect(interaction?.id).toBe('interaction-1');
    });

    test('should count interactions', async () => {
      const count = await aiRepo.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should find interactions by student', async () => {
      const interactions = await aiRepo.findByStudentId('student-1');
      expect(interactions).toBeInstanceOf(Array);
    });

    test('should log new interaction', async () => {
      const newInteraction = await aiRepo.logInteraction({
        studentId: 'test-student',
        assignmentId: 'test-assignment',
        assistanceType: 'grammar',
        writingStage: 'drafting',
        questionText: 'Test question',
        educationallySound: true
      });

      expect(newInteraction.id).toBeTruthy();
      expect(newInteraction.studentId).toBe('test-student');
      expect(newInteraction.assistanceType).toBe('grammar');
    });

    test('should mark reflection as completed', async () => {
      const interaction = await aiRepo.findById('interaction-1');
      if (interaction) {
        const updated = await aiRepo.markReflectionCompleted(interaction.id, {
          qualityScore: 90,
          submittedAt: new Date()
        });

        expect(updated.reflectionCompleted).toBe(true);
        expect(updated.reflectionQualityScore).toBe(90);
      }
    });
  });

  describe('Repository Integration', () => {
    test('should work together for complex queries', async () => {
      // Test that repositories can work together
      const student = await studentRepo.findById('student-1');
      const interactions = await aiRepo.findByStudentId('student-1');
      const assignments = await assignmentRepo.findByCourseId('course-1');

      expect(student).toBeTruthy();
      expect(interactions).toBeInstanceOf(Array);
      expect(assignments).toBeInstanceOf(Array);
    });

    test('should handle analytics queries', async () => {
      const analytics = await studentRepo.findLearningAnalytics(
        'student-1',
        {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date()
        }
      );

      expect(analytics).toBeTruthy();
      expect(analytics?.student).toBeTruthy();
      expect(analytics?.totalSubmissions).toBeGreaterThanOrEqual(0);
      expect(analytics?.aiInteractionCount).toBeGreaterThanOrEqual(0);
    });

    test('should handle assignment performance queries', async () => {
      const performance = await studentRepo.getAssignmentPerformance(
        'student-1',
        'assignment-1'
      );

      expect(performance).toBeTruthy();
      expect(performance?.student).toBeTruthy();
      expect(performance?.timeSpent).toBeGreaterThanOrEqual(0);
    });
  });
});