import { StudentProfile, CourseEnrollment, AssignmentSubmission, AIInteractionLog } from '@prisma/client';
import { StudentRepository, Student } from '../interfaces/StudentRepository';
import { FindManyOptions, CountOptions, CreateData, UpdateData } from '../interfaces/BaseRepository';

/**
 * Mock implementation of StudentRepository for testing
 */
export class MockStudentRepository implements StudentRepository {
  private students: Map<string, Student> = new Map();
  private profiles: Map<string, StudentProfile> = new Map();
  private enrollments: Map<string, CourseEnrollment[]> = new Map();
  private submissions: Map<string, AssignmentSubmission[]> = new Map();
  private aiInteractions: Map<string, AIInteractionLog[]> = new Map();

  constructor() {
    this.seedTestData();
  }

  async findById(id: string): Promise<Student | null> {
    return this.students.get(id) || null;
  }

  async findMany(options: FindManyOptions<Student> = {}): Promise<Student[]> {
    const { where, orderBy, skip = 0, take } = options;
    let results = Array.from(this.students.values());

    // Apply where filtering
    if (where) {
      results = results.filter(student => {
        return Object.entries(where).every(([key, value]) => {
          if (key === 'role') return student.role === value;
          return (student as any)[key] === value;
        });
      });
    }

    // Apply ordering
    if (orderBy) {
      const [field, direction] = Object.entries(orderBy)[0];
      results.sort((a, b) => {
        const aVal = (a as any)[field];
        const bVal = (b as any)[field];
        if (direction === 'desc') return bVal > aVal ? 1 : -1;
        return aVal > bVal ? 1 : -1;
      });
    }

    // Apply pagination
    if (take) {
      results = results.slice(skip, skip + take);
    } else if (skip > 0) {
      results = results.slice(skip);
    }

    return results;
  }

  async create(data: CreateData<Student>): Promise<Student> {
    const student: Student = {
      id: `student-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
      role: 'student'
    } as Student;

    this.students.set(student.id, student);
    return student;
  }

  async update(id: string, data: UpdateData<Student>): Promise<Student> {
    const existing = this.students.get(id);
    if (!existing) {
      throw new Error(`Student not found: ${id}`);
    }

    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date()
    };

    this.students.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!this.students.has(id)) {
      throw new Error(`Student not found: ${id}`);
    }
    this.students.delete(id);
  }

  async count(options: CountOptions<Student> = {}): Promise<number> {
    const { where } = options;
    let results = Array.from(this.students.values());

    if (where) {
      results = results.filter(student => {
        return Object.entries(where).every(([key, value]) => {
          return (student as any)[key] === value;
        });
      });
    }

    return results.length;
  }

  async findByCourseId(courseId: string): Promise<Student[]> {
    const courseEnrollments = this.enrollments.get(courseId) || [];
    const studentIds = courseEnrollments.map(e => e.studentId);
    
    return studentIds
      .map(id => this.students.get(id))
      .filter(Boolean) as Student[];
  }

  async findByMultipleCourses(courseIds: string[]): Promise<Student[]> {
    const studentIds = new Set<string>();
    
    courseIds.forEach(courseId => {
      const enrollments = this.enrollments.get(courseId) || [];
      enrollments.forEach(e => studentIds.add(e.studentId));
    });

    return Array.from(studentIds)
      .map(id => this.students.get(id))
      .filter(Boolean) as Student[];
  }

  async findByIdWithProfile(studentId: string): Promise<(Student & { 
    studentProfile: StudentProfile | null;
    enrollments: CourseEnrollment[];
  }) | null> {
    const student = this.students.get(studentId);
    if (!student) return null;

    const profile = this.profiles.get(studentId) || null;
    const enrollments = Object.values(this.enrollments)
      .flat()
      .filter(e => e.studentId === studentId);

    return {
      ...student,
      studentProfile: profile,
      enrollments
    } as Student & { 
      studentProfile: StudentProfile | null;
      enrollments: CourseEnrollment[];
    };
  }

  async findWithRecentAIActivity(
    timeframe: { start: Date; end: Date },
    courseId?: string
  ): Promise<(Student & { aiInteractionLogs: AIInteractionLog[] })[]> {
    const results: (Student & { aiInteractionLogs: AIInteractionLog[] })[] = [];

    for (const [studentId, interactions] of this.aiInteractions) {
      const recentInteractions = interactions.filter(log => 
        log.createdAt >= timeframe.start && log.createdAt <= timeframe.end
      );

      if (recentInteractions.length > 0) {
        const student = this.students.get(studentId);
        if (student) {
          results.push({
            ...student,
            aiInteractionLogs: recentInteractions
          });
        }
      }
    }

    return results;
  }

  async findByAssignmentWithSubmissions(assignmentId: string): Promise<(Student & {
    submissions: AssignmentSubmission[];
  })[]> {
    const results: (Student & { submissions: AssignmentSubmission[] })[] = [];

    for (const [studentId, submissions] of this.submissions) {
      const assignmentSubmissions = submissions.filter(s => s.assignmentId === assignmentId);
      
      if (assignmentSubmissions.length > 0) {
        const student = this.students.get(studentId);
        if (student) {
          results.push({
            ...student,
            submissions: assignmentSubmissions
          });
        }
      }
    }

    return results;
  }

  async searchByNameOrEmail(query: string, courseId?: string): Promise<Student[]> {
    const searchTerm = query.toLowerCase();
    let students = Array.from(this.students.values());

    // Filter by course if specified
    if (courseId) {
      const courseEnrollments = this.enrollments.get(courseId) || [];
      const courseStudentIds = courseEnrollments.map(e => e.studentId);
      students = students.filter(s => courseStudentIds.includes(s.id));
    }

    return students.filter(student => 
      student.firstName.toLowerCase().includes(searchTerm) ||
      student.lastName.toLowerCase().includes(searchTerm) ||
      student.email.toLowerCase().includes(searchTerm)
    );
  }

  async findLearningAnalytics(
    studentId: string,
    timeframe: { start: Date; end: Date }
  ): Promise<{
    student: Student;
    totalSubmissions: number;
    averageWordCount: number;
    aiInteractionCount: number;
    reflectionQuality: number;
    courseProgress: Array<{
      courseId: string;
      completedAssignments: number;
      totalAssignments: number;
    }>;
  } | null> {
    const student = this.students.get(studentId);
    if (!student) return null;

    const submissions = this.submissions.get(studentId) || [];
    const interactions = this.aiInteractions.get(studentId) || [];

    const timeframeSubmissions = submissions.filter(s => 
      s.createdAt >= timeframe.start && s.createdAt <= timeframe.end
    );

    const timeframeInteractions = interactions.filter(i =>
      i.createdAt >= timeframe.start && i.createdAt <= timeframe.end
    );

    const totalSubmissions = timeframeSubmissions.length;
    const averageWordCount = totalSubmissions > 0 
      ? timeframeSubmissions.reduce((sum, s) => sum + (s.wordCount || 0), 0) / totalSubmissions
      : 0;

    const aiInteractionCount = timeframeInteractions.length;
    
    const reflectionsWithQuality = timeframeInteractions.filter(i => 
      i.reflectionCompleted && i.reflectionQualityScore
    );
    const reflectionQuality = reflectionsWithQuality.length > 0
      ? reflectionsWithQuality.reduce((sum, i) => sum + (i.reflectionQualityScore || 0), 0) / reflectionsWithQuality.length
      : 0;

    // Mock course progress
    const courseProgress = [
      { courseId: 'course-1', completedAssignments: 3, totalAssignments: 5 },
      { courseId: 'course-2', completedAssignments: 2, totalAssignments: 3 }
    ];

    return {
      student,
      totalSubmissions,
      averageWordCount,
      aiInteractionCount,
      reflectionQuality,
      courseProgress
    };
  }

  async findStudentsNeedingIntervention(courseId: string): Promise<(Student & {
    aiInteractionLogs: AIInteractionLog[];
    submissions: AssignmentSubmission[];
  })[]> {
    const results: (Student & { aiInteractionLogs: AIInteractionLog[]; submissions: AssignmentSubmission[] })[] = [];

    // Simple mock logic - students with more than 10 interactions in last week
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    for (const [studentId, interactions] of this.aiInteractions) {
      const recentInteractions = interactions.filter(i => i.createdAt >= oneWeekAgo);
      
      if (recentInteractions.length > 10) {
        const student = this.students.get(studentId);
        const submissions = this.submissions.get(studentId) || [];
        
        if (student) {
          results.push({
            ...student,
            aiInteractionLogs: recentInteractions,
            submissions
          });
        }
      }
    }

    return results;
  }

  async getAssignmentPerformance(
    studentId: string,
    assignmentId: string
  ): Promise<{
    student: Student;
    submission: AssignmentSubmission | null;
    aiInteractions: AIInteractionLog[];
    reflectionQuality: number;
    timeSpent: number;
    wordCount: number;
  } | null> {
    const student = this.students.get(studentId);
    if (!student) return null;

    const submissions = this.submissions.get(studentId) || [];
    const interactions = this.aiInteractions.get(studentId) || [];

    const submission = submissions.find(s => s.assignmentId === assignmentId) || null;
    const aiInteractions = interactions.filter(i => i.assignmentId === assignmentId);

    const reflectionsWithQuality = aiInteractions.filter(i => 
      i.reflectionCompleted && i.reflectionQualityScore
    );
    const reflectionQuality = reflectionsWithQuality.length > 0
      ? reflectionsWithQuality.reduce((sum, i) => sum + (i.reflectionQualityScore || 0), 0) / reflectionsWithQuality.length
      : 0;

    return {
      student,
      submission,
      aiInteractions,
      reflectionQuality,
      timeSpent: 120, // Mock: 2 hours
      wordCount: submission?.wordCount || 0
    };
  }

  async findSimilarLearningProfiles(
    studentId: string,
    courseId?: string
  ): Promise<(Student & { studentProfile: StudentProfile })[]> {
    // Mock implementation - return students with profiles
    const results: (Student & { studentProfile: StudentProfile })[] = [];
    
    for (const [id, profile] of this.profiles) {
      if (id !== studentId) {
        const student = this.students.get(id);
        if (student) {
          results.push({
            ...student,
            studentProfile: profile
          });
        }
      }
    }

    return results.slice(0, 5); // Return up to 5 similar students
  }

  async updateLearningProfile(
    studentId: string,
    profileData: Partial<StudentProfile>
  ): Promise<StudentProfile> {
    const existingProfile = this.profiles.get(studentId);
    
    const profile: StudentProfile = {
      id: existingProfile?.id || `profile-${studentId}`,
      studentId,
      createdAt: existingProfile?.createdAt || new Date(),
      updatedAt: new Date(),
      // Default values
      questionComplexity: 'mixed',
      preferredLearningStyle: 'mixed',
      averageReflectionDepth: 0,
      bestRespondsTo: [],
      strugglesWith: [],
      evidenceAnalysis: 50,
      perspectiveTaking: 50,
      logicalReasoning: 50,
      creativeThinking: 50,
      organizationalSkills: 50,
      metacognition: 50,
      currentCognitiveLoad: 'optimal',
      emotionalState: 'neutral',
      currentFocus: null,
      recentBreakthrough: false,
      strugglingDuration: 0,
      lastSuccessfulInteraction: null,
      lastActivityTime: null,
      aiRequestFrequency: 0,
      independentWorkStreak: 0,
      qualityWithoutAI: 0,
      independenceTrend: 'stable',
      lastMilestone: null,
      bestTimeOfDay: 'afternoon',
      averageSessionLength: 30,
      breakFrequency: 2,
      productivityPattern: 'steady',
      sessionMetrics: {},
      ...existingProfile,
      ...profileData
    };

    this.profiles.set(studentId, profile);
    return profile;
  }

  async logWritingActivity(
    studentId: string,
    documentId: string,
    activityData: {
      sessionLength: number;
      wordsWritten: number;
      aiInteractions: number;
      breaks: number;
    }
  ): Promise<void> {
    // Mock implementation - in real implementation would create writing session
    console.log(`Logged writing activity for student ${studentId}: ${JSON.stringify(activityData)}`);
  }

  // Helper methods for testing

  addMockStudent(student: Partial<Student>): Student {
    const mockStudent: Student = {
      id: `mock-${Date.now()}`,
      email: `student${Date.now()}@test.com`,
      passwordHash: 'hashed',
      firstName: 'Test',
      lastName: 'Student',
      role: 'student',
      profilePicture: null,
      bio: null,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...student
    };

    this.students.set(mockStudent.id, mockStudent);
    return mockStudent;
  }

  addMockSubmission(studentId: string, submission: Partial<AssignmentSubmission>): AssignmentSubmission {
    const mockSubmission: AssignmentSubmission = {
      id: `submission-${Date.now()}`,
      assignmentId: 'test-assignment',
      authorId: studentId,
      title: 'Test Submission',
      content: 'Test content',
      wordCount: 500,
      status: 'draft',
      submittedAt: null,
      collaborationSettings: {},
      majorMilestones: [],
      analytics: {},
      grade: null,
      aiInteractions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...submission
    };

    const submissions = this.submissions.get(studentId) || [];
    submissions.push(mockSubmission);
    this.submissions.set(studentId, submissions);
    
    return mockSubmission;
  }

  addMockAIInteraction(studentId: string, interaction: Partial<AIInteractionLog>): AIInteractionLog {
    const mockInteraction: AIInteractionLog = {
      id: `interaction-${Date.now()}`,
      studentId,
      assignmentId: 'test-assignment',
      assistanceType: 'grammar',
      questionsGenerated: 1,
      educationallySound: true,
      writingStage: 'drafting',
      questionText: 'Test question',
      responseId: 'test-response',
      reflectionCompleted: false,
      reflectionQualityScore: null,
      reflectionSubmittedAt: null,
      metadata: {},
      createdAt: new Date(),
      ...interaction
    };

    const interactions = this.aiInteractions.get(studentId) || [];
    interactions.push(mockInteraction);
    this.aiInteractions.set(studentId, interactions);
    
    return mockInteraction;
  }

  clearMockData(): void {
    this.students.clear();
    this.profiles.clear();
    this.enrollments.clear();
    this.submissions.clear();
    this.aiInteractions.clear();
  }

  private seedTestData(): void {
    // Add some default test students
    this.addMockStudent({
      id: 'student-1',
      email: 'alice@test.com',
      firstName: 'Alice',
      lastName: 'Johnson'
    });

    this.addMockStudent({
      id: 'student-2', 
      email: 'bob@test.com',
      firstName: 'Bob',
      lastName: 'Smith'
    });

    // Add mock profiles
    this.updateLearningProfile('student-1', {
      evidenceAnalysis: 75,
      metacognition: 80
    });

    // Add mock submissions and interactions
    this.addMockSubmission('student-1', {
      assignmentId: 'assignment-1',
      wordCount: 750,
      status: 'submitted'
    });

    this.addMockAIInteraction('student-1', {
      assignmentId: 'assignment-1',
      reflectionCompleted: true,
      reflectionQualityScore: 85
    });
  }
}