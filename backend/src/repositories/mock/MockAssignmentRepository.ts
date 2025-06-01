import { Assignment, AssignmentSubmission, Course, User, AIInteractionLog } from '@prisma/client';
import { AssignmentRepository, AssignmentWithRelations } from '../interfaces/AssignmentRepository';
import { FindManyOptions, CountOptions, CreateData, UpdateData } from '../interfaces/BaseRepository';

/**
 * Mock implementation of AssignmentRepository for testing
 */
export class MockAssignmentRepository implements AssignmentRepository {
  private assignments: Map<string, Assignment> = new Map();
  private courses: Map<string, Course> = new Map();
  private instructors: Map<string, User> = new Map();
  private submissions: Map<string, AssignmentSubmission[]> = new Map();
  private aiInteractions: Map<string, AIInteractionLog[]> = new Map();

  constructor() {
    this.seedTestData();
  }

  async findById(id: string): Promise<Assignment | null> {
    return this.assignments.get(id) || null;
  }

  async findMany(options: FindManyOptions<Assignment> = {}): Promise<Assignment[]> {
    const { where, orderBy, skip = 0, take } = options;
    let results = Array.from(this.assignments.values());

    // Apply where filtering
    if (where) {
      results = results.filter(assignment => {
        return Object.entries(where).every(([key, value]) => {
          return (assignment as any)[key] === value;
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

  async create(data: CreateData<Assignment>): Promise<Assignment> {
    const assignment: Assignment = {
      id: `assignment-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data
    } as Assignment;

    this.assignments.set(assignment.id, assignment);
    return assignment;
  }

  async update(id: string, data: UpdateData<Assignment>): Promise<Assignment> {
    const existing = this.assignments.get(id);
    if (!existing) {
      throw new Error(`Assignment not found: ${id}`);
    }

    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date()
    };

    this.assignments.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!this.assignments.has(id)) {
      throw new Error(`Assignment not found: ${id}`);
    }
    this.assignments.delete(id);
  }

  async count(options: CountOptions<Assignment> = {}): Promise<number> {
    const { where } = options;
    let results = Array.from(this.assignments.values());

    if (where) {
      results = results.filter(assignment => {
        return Object.entries(where).every(([key, value]) => {
          return (assignment as any)[key] === value;
        });
      });
    }

    return results.length;
  }

  async findByCourseId(courseId: string): Promise<Assignment[]> {
    return Array.from(this.assignments.values())
      .filter(assignment => assignment.courseId === courseId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findByInstructorId(instructorId: string): Promise<Assignment[]> {
    return Array.from(this.assignments.values())
      .filter(assignment => assignment.instructorId === instructorId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findByIdWithSubmissions(assignmentId: string): Promise<(Assignment & {
    submissions: AssignmentSubmission[];
    course: Course;
  }) | null> {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) return null;

    const submissions = this.submissions.get(assignmentId) || [];
    const course = this.courses.get(assignment.courseId);
    
    if (!course) {
      throw new Error(`Course not found: ${assignment.courseId}`);
    }

    return {
      ...assignment,
      submissions,
      course
    };
  }

  async findWithAIAnalytics(courseId?: string): Promise<(Assignment & {
    aiInteractionLogs: AIInteractionLog[];
    submissions: AssignmentSubmission[];
  })[]> {
    let assignments = Array.from(this.assignments.values());
    
    if (courseId) {
      assignments = assignments.filter(a => a.courseId === courseId);
    }

    return assignments.map(assignment => ({
      ...assignment,
      aiInteractionLogs: this.aiInteractions.get(assignment.id) || [],
      submissions: this.submissions.get(assignment.id) || []
    }));
  }

  async findByDueDateRange(
    start: Date,
    end: Date,
    courseId?: string
  ): Promise<Assignment[]> {
    let assignments = Array.from(this.assignments.values());

    if (courseId) {
      assignments = assignments.filter(a => a.courseId === courseId);
    }

    return assignments
      .filter(assignment => 
        assignment.dueDate && 
        assignment.dueDate >= start && 
        assignment.dueDate <= end
      )
      .sort((a, b) => {
        if (!a.dueDate || !b.dueDate) return 0;
        return a.dueDate.getTime() - b.dueDate.getTime();
      });
  }

  async findByAISettings(
    settingsCriteria: {
      aiEnabled?: boolean;
      boundaryLevel?: string;
      assistanceTypes?: string[];
    },
    courseId?: string
  ): Promise<Assignment[]> {
    let assignments = Array.from(this.assignments.values());

    if (courseId) {
      assignments = assignments.filter(a => a.courseId === courseId);
    }

    return assignments.filter(assignment => {
      const aiSettings = assignment.aiSettings as any;
      
      if (settingsCriteria.aiEnabled !== undefined) {
        return aiSettings?.enabled === settingsCriteria.aiEnabled;
      }
      
      return true;
    });
  }

  async getCompletionStats(assignmentId: string): Promise<{
    assignment: Assignment;
    totalStudents: number;
    submittedCount: number;
    draftCount: number;
    notStartedCount: number;
    averageWordCount: number;
    averageTimeSpent: number;
    aiUsageStats: {
      studentsUsingAI: number;
      totalAIInteractions: number;
      averageInteractionsPerStudent: number;
    };
  } | null> {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) return null;

    const submissions = this.submissions.get(assignmentId) || [];
    const aiInteractions = this.aiInteractions.get(assignmentId) || [];

    const submittedCount = submissions.filter(s => s.status === 'submitted').length;
    const draftCount = submissions.filter(s => s.status === 'draft' || s.status === 'in_progress').length;
    const totalStudents = 25; // Mock total
    const notStartedCount = totalStudents - submissions.length;

    const averageWordCount = submissions.length > 0
      ? submissions.reduce((sum, s) => sum + (s.wordCount || 0), 0) / submissions.length
      : 0;

    const studentsUsingAI = new Set(aiInteractions.map(log => log.studentId)).size;
    const totalAIInteractions = aiInteractions.length;
    const averageInteractionsPerStudent = studentsUsingAI > 0 
      ? totalAIInteractions / studentsUsingAI 
      : 0;

    return {
      assignment,
      totalStudents,
      submittedCount,
      draftCount,
      notStartedCount,
      averageWordCount,
      averageTimeSpent: 120, // Mock: 2 hours
      aiUsageStats: {
        studentsUsingAI,
        totalAIInteractions,
        averageInteractionsPerStudent
      }
    };
  }

  async findRequiringAttention(instructorId: string): Promise<(Assignment & {
    submissions: Array<AssignmentSubmission & {
      aiInteractionLogs: AIInteractionLog[];
    }>;
  })[]> {
    const assignments = Array.from(this.assignments.values())
      .filter(a => a.instructorId === instructorId);

    return assignments.map(assignment => ({
      ...assignment,
      submissions: (this.submissions.get(assignment.id) || []).map(submission => ({
        ...submission,
        aiInteractionLogs: (this.aiInteractions.get(assignment.id) || [])
          .filter(log => log.studentId === submission.authorId)
      }))
    }));
  }

  async getAIBoundaryAnalysis(assignmentId: string): Promise<{
    assignment: Assignment;
    currentSettings: any;
    studentUsagePatterns: Array<{
      studentId: string;
      aiUsageCount: number;
      reflectionQuality: number;
      independenceLevel: string;
    }>;
    recommendations: Array<{
      type: 'increase_restrictions' | 'reduce_restrictions' | 'modify_requirements';
      reason: string;
      affectedStudents: string[];
      impact: string;
    }>;
  } | null> {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) return null;

    const aiInteractions = this.aiInteractions.get(assignmentId) || [];
    
    // Analyze student usage patterns
    const studentStats = new Map<string, { count: number; reflections: number; totalQuality: number }>();
    
    aiInteractions.forEach(log => {
      const stats = studentStats.get(log.studentId) || { count: 0, reflections: 0, totalQuality: 0 };
      stats.count++;
      
      if (log.reflectionCompleted && log.reflectionQualityScore) {
        stats.reflections++;
        stats.totalQuality += log.reflectionQualityScore;
      }
      
      studentStats.set(log.studentId, stats);
    });

    const studentUsagePatterns = Array.from(studentStats.entries()).map(([studentId, stats]) => ({
      studentId,
      aiUsageCount: stats.count,
      reflectionQuality: stats.reflections > 0 ? stats.totalQuality / stats.reflections : 0,
      independenceLevel: stats.count > 10 ? 'low' : stats.count > 5 ? 'medium' : 'high'
    }));

    // Generate mock recommendations
    const recommendations = [];
    const highUsageStudents = studentUsagePatterns.filter(p => p.aiUsageCount > 10);

    if (highUsageStudents.length > studentUsagePatterns.length * 0.3) {
      recommendations.push({
        type: 'increase_restrictions' as const,
        reason: 'High percentage of students showing over-reliance on AI assistance',
        affectedStudents: highUsageStudents.map(s => s.studentId),
        impact: 'May improve student independence and critical thinking'
      });
    }

    return {
      assignment,
      currentSettings: assignment.aiSettings,
      studentUsagePatterns,
      recommendations
    };
  }

  async findByLearningObjectives(
    objectives: string[],
    courseId?: string
  ): Promise<Assignment[]> {
    let assignments = Array.from(this.assignments.values());

    if (courseId) {
      assignments = assignments.filter(a => a.courseId === courseId);
    }

    return assignments.filter(assignment => {
      const assignmentObjectives = assignment.learningObjectives as string[];
      return objectives.some(obj => assignmentObjectives.includes(obj));
    });
  }

  async getPerformanceAnalytics(
    assignmentId: string,
    timeframe?: { start: Date; end: Date }
  ): Promise<{
    assignment: Assignment;
    submissionMetrics: {
      onTimeSubmissions: number;
      lateSubmissions: number;
      averageWordsPerSubmission: number;
      qualityDistribution: Record<string, number>;
    };
    aiUsageMetrics: {
      totalInteractions: number;
      uniqueStudentsUsingAI: number;
      averageInteractionsPerStudent: number;
      mostCommonAssistanceTypes: Array<{ type: string; count: number }>;
    };
    learningOutcomes: {
      reflectionQualityScore: number;
      independenceTrend: 'increasing' | 'stable' | 'decreasing';
      skillDevelopmentIndicators: string[];
    };
  } | null> {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) return null;

    const submissions = this.submissions.get(assignmentId) || [];
    let aiInteractions = this.aiInteractions.get(assignmentId) || [];

    if (timeframe) {
      aiInteractions = aiInteractions.filter(i => 
        i.createdAt >= timeframe.start && i.createdAt <= timeframe.end
      );
    }

    const onTimeSubmissions = submissions.filter(s => 
      s.submittedAt && assignment.dueDate && s.submittedAt <= assignment.dueDate
    ).length;
    
    const lateSubmissions = submissions.filter(s => 
      s.submittedAt && assignment.dueDate && s.submittedAt > assignment.dueDate
    ).length;

    const averageWordsPerSubmission = submissions.length > 0
      ? submissions.reduce((sum, s) => sum + (s.wordCount || 0), 0) / submissions.length
      : 0;

    const uniqueStudentsUsingAI = new Set(aiInteractions.map(log => log.studentId)).size;
    const averageInteractionsPerStudent = uniqueStudentsUsingAI > 0 
      ? aiInteractions.length / uniqueStudentsUsingAI 
      : 0;

    // Calculate most common assistance types
    const assistanceTypeCounts = aiInteractions.reduce((acc, log) => {
      acc[log.assistanceType] = (acc[log.assistanceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCommonAssistanceTypes = Object.entries(assistanceTypeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const reflectionsWithQuality = aiInteractions.filter(i => 
      i.reflectionCompleted && i.reflectionQualityScore
    );
    const reflectionQualityScore = reflectionsWithQuality.length > 0
      ? reflectionsWithQuality.reduce((sum, i) => sum + (i.reflectionQualityScore || 0), 0) / reflectionsWithQuality.length
      : 0;

    return {
      assignment,
      submissionMetrics: {
        onTimeSubmissions,
        lateSubmissions,
        averageWordsPerSubmission,
        qualityDistribution: { high: 5, medium: 10, low: 3 } // Mock
      },
      aiUsageMetrics: {
        totalInteractions: aiInteractions.length,
        uniqueStudentsUsingAI,
        averageInteractionsPerStudent,
        mostCommonAssistanceTypes
      },
      learningOutcomes: {
        reflectionQualityScore,
        independenceTrend: 'stable',
        skillDevelopmentIndicators: [
          reflectionQualityScore > 70 ? 'High-quality reflections' : 'Developing reflection skills'
        ]
      }
    };
  }

  async findSimilarAssignments(
    assignmentId: string,
    similarity: 'learning_objectives' | 'ai_settings' | 'structure'
  ): Promise<Assignment[]> {
    const sourceAssignment = this.assignments.get(assignmentId);
    if (!sourceAssignment) return [];

    // For mock, return assignments from same course
    return Array.from(this.assignments.values())
      .filter(a => a.id !== assignmentId && a.courseId === sourceAssignment.courseId)
      .slice(0, 10);
  }

  async updateAIBoundaries(
    assignmentId: string,
    boundaries: {
      enabled: boolean;
      globalBoundary: string;
      allowedAssistanceTypes: string[];
      stageSpecificSettings: any[];
      requireReflection: boolean;
      reflectionPrompts: string[];
    }
  ): Promise<Assignment> {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) {
      throw new Error(`Assignment not found: ${assignmentId}`);
    }

    const updated = {
      ...assignment,
      aiSettings: boundaries,
      updatedAt: new Date()
    };

    this.assignments.set(assignmentId, updated);
    return updated;
  }

  async cloneAssignment(
    sourceAssignmentId: string,
    targetCourseId: string,
    modifications: Partial<Assignment>
  ): Promise<Assignment> {
    const sourceAssignment = this.assignments.get(sourceAssignmentId);
    if (!sourceAssignment) {
      throw new Error(`Source assignment not found: ${sourceAssignmentId}`);
    }

    const cloned: Assignment = {
      ...sourceAssignment,
      id: `assignment-${Date.now()}`,
      courseId: targetCourseId,
      title: modifications.title || `${sourceAssignment.title} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...modifications
    };

    this.assignments.set(cloned.id, cloned);
    return cloned;
  }

  async getTimeline(assignmentId: string): Promise<{
    assignment: Assignment;
    timeline: Array<{
      date: Date;
      event: 'created' | 'published' | 'due' | 'closed';
      description: string;
    }>;
    submissions: Array<{
      studentId: string;
      submittedAt: Date | null;
      status: string;
      wordCount: number;
    }>;
    aiActivity: Array<{
      date: Date;
      studentId: string;
      interactionCount: number;
      assistanceType: string;
    }>;
  } | null> {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) return null;

    const timeline: Array<{
      date: Date;
      event: 'created' | 'published' | 'due' | 'closed';
      description: string;
    }> = [
      {
        date: assignment.createdAt,
        event: 'created',
        description: 'Assignment created'
      }
    ];

    if (assignment.dueDate) {
      timeline.push({
        date: assignment.dueDate,
        event: 'due',
        description: 'Assignment due'
      });
    }

    const submissions = (this.submissions.get(assignmentId) || []).map(sub => ({
      studentId: sub.authorId,
      submittedAt: sub.submittedAt,
      status: sub.status,
      wordCount: sub.wordCount || 0
    }));

    const aiInteractions = this.aiInteractions.get(assignmentId) || [];
    const aiActivity = aiInteractions.map(log => ({
      date: log.createdAt,
      studentId: log.studentId,
      interactionCount: 1,
      assistanceType: log.assistanceType
    }));

    return {
      assignment,
      timeline: timeline.sort((a, b) => a.date.getTime() - b.date.getTime()),
      submissions,
      aiActivity
    };
  }

  // Helper methods for testing

  addMockAssignment(assignment: Partial<Assignment>): Assignment {
    const mockAssignment: Assignment = {
      id: `assignment-${Date.now()}`,
      templateId: null,
      courseId: 'test-course',
      instructorId: 'test-instructor',
      title: 'Test Assignment',
      instructions: 'Test instructions',
      requirements: {},
      writingStages: [],
      learningObjectives: [],
      aiSettings: {},
      aiBoundarySettings: {},
      gradingCriteria: null,
      dueDate: null,
      stageDueDates: null,
      status: 'draft',
      type: 'individual',
      collaborationSettings: {},
      versionControlSettings: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      ...assignment
    };

    this.assignments.set(mockAssignment.id, mockAssignment);
    return mockAssignment;
  }

  addMockSubmission(assignmentId: string, submission: Partial<AssignmentSubmission>): AssignmentSubmission {
    const mockSubmission: AssignmentSubmission = {
      id: `submission-${Date.now()}`,
      assignmentId,
      authorId: 'test-student',
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

    const submissions = this.submissions.get(assignmentId) || [];
    submissions.push(mockSubmission);
    this.submissions.set(assignmentId, submissions);
    
    return mockSubmission;
  }

  addMockAIInteraction(assignmentId: string, interaction: Partial<AIInteractionLog>): AIInteractionLog {
    const mockInteraction: AIInteractionLog = {
      id: `interaction-${Date.now()}`,
      studentId: 'test-student',
      assignmentId,
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

    const interactions = this.aiInteractions.get(assignmentId) || [];
    interactions.push(mockInteraction);
    this.aiInteractions.set(assignmentId, interactions);
    
    return mockInteraction;
  }

  clearMockData(): void {
    this.assignments.clear();
    this.courses.clear();
    this.instructors.clear();
    this.submissions.clear();
    this.aiInteractions.clear();
  }

  private seedTestData(): void {
    // Add mock course
    const mockCourse: Course = {
      id: 'course-1',
      title: 'Test Course',
      description: 'A test course',
      subject: 'Writing',
      instructorId: 'instructor-1',
      isPublic: false,
      maxStudents: 30,
      startDate: new Date(),
      endDate: null,
      settings: {},
      status: 'active',
      isActive: true,
      enrollmentCode: 'TEST123',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.courses.set(mockCourse.id, mockCourse);

    // Add mock instructor
    const mockInstructor: User = {
      id: 'instructor-1',
      email: 'instructor@test.com',
      passwordHash: 'hashed',
      firstName: 'Test',
      lastName: 'Instructor',
      role: 'educator',
      profilePicture: null,
      bio: null,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.instructors.set(mockInstructor.id, mockInstructor);

    // Add mock assignment
    this.addMockAssignment({
      id: 'assignment-1',
      courseId: 'course-1',
      instructorId: 'instructor-1',
      title: 'Argumentative Essay',
      aiSettings: {
        enabled: true,
        globalBoundary: 'moderate'
      },
      learningObjectives: ['Critical thinking', 'Argumentation']
    });

    // Add mock submissions
    this.addMockSubmission('assignment-1', {
      authorId: 'student-1',
      wordCount: 750,
      status: 'submitted'
    });

    // Add mock AI interactions
    this.addMockAIInteraction('assignment-1', {
      studentId: 'student-1',
      reflectionCompleted: true,
      reflectionQualityScore: 85
    });
  }
}