import { User, UserRole, CourseEnrollment, AssignmentSubmission, StudentProfile, AIInteractionLog } from '@prisma/client';
import { BaseRepository } from './BaseRepository';

/**
 * Student-specific data type (User with student role)
 */
export type Student = User & {
  role: 'student';
  enrollments?: CourseEnrollment[];
  submissions?: AssignmentSubmission[];
  studentProfile?: StudentProfile;
  aiInteractionLogs?: AIInteractionLog[];
};

/**
 * Student Repository Interface
 * Handles student-specific queries and operations
 */
export interface StudentRepository extends BaseRepository<Student> {
  /**
   * Find students by course enrollment
   */
  findByCourseId(courseId: string): Promise<Student[]>;

  /**
   * Find students enrolled in multiple courses
   */
  findByMultipleCourses(courseIds: string[]): Promise<Student[]>;

  /**
   * Find student with their complete profile data
   */
  findByIdWithProfile(studentId: string): Promise<(Student & { 
    studentProfile: StudentProfile | null;
    enrollments: CourseEnrollment[];
  }) | null>;

  /**
   * Find students with recent AI interactions
   */
  findWithRecentAIActivity(
    timeframe: { start: Date; end: Date },
    courseId?: string
  ): Promise<(Student & { 
    aiInteractionLogs: AIInteractionLog[];
  })[]>;

  /**
   * Find students by assignment with their submissions
   */
  findByAssignmentWithSubmissions(assignmentId: string): Promise<(Student & {
    submissions: AssignmentSubmission[];
  })[]>;

  /**
   * Search students by name or email
   */
  searchByNameOrEmail(query: string, courseId?: string): Promise<Student[]>;

  /**
   * Get student learning analytics data
   */
  findLearningAnalytics(
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
  } | null>;

  /**
   * Find students who may need intervention based on AI usage patterns
   */
  findStudentsNeedingIntervention(courseId: string): Promise<(Student & {
    aiInteractionLogs: AIInteractionLog[];
    submissions: AssignmentSubmission[];
  })[]>;

  /**
   * Get student performance metrics for an assignment
   */
  getAssignmentPerformance(
    studentId: string,
    assignmentId: string
  ): Promise<{
    student: Student;
    submission: AssignmentSubmission | null;
    aiInteractions: AIInteractionLog[];
    reflectionQuality: number;
    timeSpent: number; // in minutes
    wordCount: number;
  } | null>;

  /**
   * Find students with similar learning profiles
   */
  findSimilarLearningProfiles(
    studentId: string,
    courseId?: string
  ): Promise<(Student & { 
    studentProfile: StudentProfile;
  })[]>;

  /**
   * Update student's learning profile
   */
  updateLearningProfile(
    studentId: string,
    profileData: Partial<StudentProfile>
  ): Promise<StudentProfile>;

  /**
   * Track student's writing session activity
   */
  logWritingActivity(
    studentId: string,
    documentId: string,
    activityData: {
      sessionLength: number;
      wordsWritten: number;
      aiInteractions: number;
      breaks: number;
    }
  ): Promise<void>;
}