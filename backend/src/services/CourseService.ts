/**
 * Course Service - PostgreSQL/Prisma Version
 * 
 * Business logic for course management using Prisma ORM
 * This is an example of how to convert from Mongoose to Prisma
 */

import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

export interface CreateCourseInput {
  title: string;
  description?: string;
  subject?: string;
  instructorId: string;
  isPublic?: boolean;
  maxStudents?: number;
  startDate?: Date;
  endDate?: Date;
  settings?: any;
  tags?: string[];
}

export interface EnrollStudentInput {
  courseId: string;
  studentId: string;
}

export class CourseService {
  /**
   * Create a new course
   */
  static async createCourse(data: CreateCourseInput) {
    try {
      // Generate unique enrollment code
      const enrollmentCode = await this.generateUniqueEnrollmentCode();
      
      const course = await prisma.course.create({
        data: {
          ...data,
          enrollmentCode,
          settings: data.settings || {},
          tags: data.tags || [],
          status: 'planning',
          isActive: true,
        },
        include: {
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
              assignments: true,
            },
          },
        },
      });
      
      return course;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('A course with this enrollment code already exists');
        }
        if (error.code === 'P2003') {
          throw new Error('Invalid instructor ID');
        }
      }
      throw error;
    }
  }
  
  /**
   * Get course by ID with related data
   */
  static async getCourseById(courseId: string, includeStudents = false) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePicture: true,
          },
        },
        enrollments: includeStudents ? {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profilePicture: true,
              },
            },
          },
          where: {
            status: 'active',
          },
        } : false,
        _count: {
          select: {
            enrollments: true,
            assignments: true,
          },
        },
      },
    });
    
    if (!course) {
      throw new Error('Course not found');
    }
    
    // Transform to include students array if requested
    if (includeStudents && course.enrollments) {
      return {
        ...course,
        students: course.enrollments.map(e => (e as any).student),
      };
    }
    
    return course;
  }
  
  /**
   * Enroll a student in a course
   */
  static async enrollStudent({ courseId, studentId }: EnrollStudentInput) {
    // Check if course exists and has capacity
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
    });
    
    if (!course) {
      throw new Error('Course not found');
    }
    
    if (course._count.enrollments >= course.maxStudents) {
      throw new Error('Course is full');
    }
    
    // Check if student exists
    const student = await prisma.user.findUnique({
      where: { id: studentId, role: 'student' },
    });
    
    if (!student) {
      throw new Error('Student not found');
    }
    
    try {
      // Create enrollment
      const enrollment = await prisma.courseEnrollment.create({
        data: {
          courseId,
          studentId,
          status: 'active',
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          course: {
            select: {
              title: true,
            },
          },
        },
      });
      
      // Create notification for student
      await prisma.notification.create({
        data: {
          recipientId: studentId,
          type: 'course_enrollment',
          category: 'course',
          title: 'Course Enrollment Successful',
          message: `You have been enrolled in ${course.title}`,
          context: { courseId },
        },
      });
      
      return enrollment;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('Student is already enrolled in this course');
        }
      }
      throw error;
    }
  }
  
  /**
   * Get courses for an instructor
   */
  static async getInstructorCourses(instructorId: string) {
    const courses = await prisma.course.findMany({
      where: {
        instructorId,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            enrollments: true,
            assignments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return courses;
  }
  
  /**
   * Get courses for a student
   */
  static async getStudentCourses(studentId: string) {
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        studentId,
        status: 'active',
      },
      include: {
        course: {
          include: {
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            _count: {
              select: {
                assignments: true,
              },
            },
          },
        },
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    });
    
    return enrollments.map(e => ({
      ...e.course,
      enrolledAt: e.enrolledAt,
    }));
  }
  
  /**
   * Search courses with filters
   */
  static async searchCourses(filters: {
    search?: string;
    isPublic?: boolean;
    tags?: string[];
    hasSpace?: boolean;
  }) {
    const where: Prisma.CourseWhereInput = {
      isActive: true,
    };
    
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { subject: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    
    if (filters.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }
    
    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }
    
    const courses = await prisma.course.findMany({
      where,
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Filter by available space if requested
    if (filters.hasSpace) {
      return courses.filter(course => course._count.enrollments < course.maxStudents);
    }
    
    return courses;
  }
  
  /**
   * Generate unique enrollment code
   */
  private static async generateUniqueEnrollmentCode(): Promise<string> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    let isUnique = false;
    
    while (!isUnique) {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      
      const existing = await prisma.course.findUnique({
        where: { enrollmentCode: code },
      });
      
      if (!existing) {
        isUnique = true;
      }
    }
    
    return code!;
  }
  
  /**
   * Update course settings
   */
  static async updateCourseSettings(courseId: string, settings: any) {
    const course = await prisma.course.update({
      where: { id: courseId },
      data: {
        settings: {
          ...settings,
          updatedAt: new Date(),
        },
      },
    });
    
    return course;
  }
  
  /**
   * Get course statistics
   */
  static async getCourseStatistics(courseId: string) {
    const [
      enrollmentCount,
      activeAssignments,
      completedSubmissions,
      avgProgress,
    ] = await Promise.all([
      prisma.courseEnrollment.count({
        where: { courseId, status: 'active' },
      }),
      prisma.assignment.count({
        where: { courseId, status: 'published' },
      }),
      prisma.assignmentSubmission.count({
        where: {
          assignment: { courseId },
          status: 'submitted',
        },
      }),
      prisma.assignmentSubmission.aggregate({
        where: {
          assignment: { courseId },
        },
        _avg: {
          wordCount: true,
        },
      }),
    ]);
    
    return {
      enrollmentCount,
      activeAssignments,
      completedSubmissions,
      averageWordCount: Math.round(avgProgress._avg.wordCount || 0),
    };
  }
}