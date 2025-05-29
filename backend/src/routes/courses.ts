import express, { Response } from 'express';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { CourseService } from '../services/CourseService';
import prisma from '../lib/prisma';

const router = express.Router();

interface CreateCourseRequest {
  title: string;
  description: string;
  maxStudents?: number;
  tags?: string[];
}

// Get courses based on user role
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const userRole = req.user!.role;
    
    let courses: any[];
    
    if (userRole === 'educator') {
      courses = await CourseService.getInstructorCourses(userId);
    } else if (userRole === 'student') {
      courses = await CourseService.getStudentCourses(userId);
    } else if (userRole === 'admin') {
      // Admins see all courses
      courses = await prisma.course.findMany({
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
        orderBy: { createdAt: 'desc' },
      });
    } else {
      courses = [];
    }

    res.json({ 
      success: true,
      data: courses,
      totalCount: courses.length 
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get courses for current user (both educators and students)
router.get('/my-courses', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const userRole = req.user!.role;
    
    let courses: any[];
    
    if (userRole === 'educator') {
      courses = await CourseService.getInstructorCourses(userId);
    } else if (userRole === 'student') {
      courses = await CourseService.getStudentCourses(userId);
    } else if (userRole === 'admin') {
      courses = await prisma.course.findMany({
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
        orderBy: { createdAt: 'desc' },
      });
    } else {
      courses = [];
    }

    res.json({ 
      success: true,
      data: courses,
      totalCount: courses.length 
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get enrolled courses for student
router.get('/enrolled', authenticate, requireRole(['student']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.userId!;
    const courses = await CourseService.getStudentCourses(studentId);

    res.json({ courses });
  } catch (error) {
    console.error('Get enrolled courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new course (educator only)
router.post('/', authenticate, requireRole(['educator']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, description, maxStudents, tags }: CreateCourseRequest = req.body;
    const instructorId = req.userId!;

    // Validation
    if (!title || !description) {
      res.status(400).json({ error: 'Title and description are required' });
      return;
    }

    if (title.length > 200) {
      res.status(400).json({ error: 'Title must be less than 200 characters' });
      return;
    }

    if (description.length > 1000) {
      res.status(400).json({ error: 'Description must be less than 1000 characters' });
      return;
    }

    // Create course
    const course = await CourseService.createCourse({
      title: title.trim(),
      description: description.trim(),
      instructorId,
      maxStudents: maxStudents || 30,
      tags: tags?.map(tag => tag.trim().toLowerCase()) || [],
      isPublic: true,
    });

    res.status(201).json({
      message: 'Course created successfully',
      course
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get course by ID
router.get('/:courseId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const userId = req.userId!;

    const course = await CourseService.getCourseById(courseId, true);

    // Check authorization
    const isInstructor = course.instructor.id === userId;
    const isEnrolledStudent = course.enrollments ? 
      course.enrollments.some(enrollment => enrollment.studentId === userId) : false;
    const isAdmin = req.user!.role === 'admin';

    if (!isInstructor && !isEnrolledStudent && !isAdmin) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({ course });
  } catch (error) {
    console.error('Get course error:', error);
    if (error instanceof Error && error.message === 'Course not found') {
      res.status(404).json({ error: 'Course not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update course (instructor only)
router.put('/:courseId', authenticate, requireRole(['educator']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { title, description, maxStudents, tags, isActive } = req.body;
    const instructorId = req.userId!;

    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    if (course.instructorId !== instructorId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Update fields
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(maxStudents !== undefined && { maxStudents }),
        ...(tags !== undefined && { tags: tags.map((tag: string) => tag.trim().toLowerCase()) }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        _count: {
          select: {
            enrollments: true,
            assignments: true,
          }
        }
      }
    });

    res.json({
      message: 'Course updated successfully',
      course: updatedCourse
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enroll in course (student only)
router.post('/enroll', authenticate, requireRole(['student']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { enrollmentCode } = req.body;
    const studentId = req.userId!;

    if (!enrollmentCode) {
      res.status(400).json({ error: 'Enrollment code is required' });
      return;
    }

    const course = await prisma.course.findUnique({ 
      where: { 
        enrollmentCode: enrollmentCode.toUpperCase(),
        isActive: true 
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    });

    if (!course) {
      res.status(404).json({ error: 'Course not found or inactive' });
      return;
    }

    // Use CourseService to handle enrollment logic
    try {
      const enrollment = await CourseService.enrollStudent({
        courseId: course.id,
        studentId
      });

      res.json({
        message: 'Successfully enrolled in course',
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
          instructor: course.instructor,
          enrollmentCode: course.enrollmentCode,
          tags: course.tags
        }
      });
    } catch (enrollError) {
      if (enrollError instanceof Error) {
        if (enrollError.message.includes('already enrolled')) {
          res.status(400).json({ error: 'Already enrolled in this course' });
        } else if (enrollError.message.includes('full')) {
          res.status(400).json({ error: 'Course is at maximum capacity' });
        } else {
          res.status(400).json({ error: enrollError.message });
        }
      } else {
        throw enrollError;
      }
    }
  } catch (error) {
    console.error('Enroll course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unenroll from course (student only)
router.post('/:courseId/unenroll', authenticate, requireRole(['student']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const studentId = req.userId!;

    // Check if enrollment exists
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId
        }
      }
    });

    if (!enrollment) {
      res.status(400).json({ error: 'Not enrolled in this course' });
      return;
    }

    // Delete enrollment
    await prisma.courseEnrollment.delete({
      where: {
        courseId_studentId: {
          courseId,
          studentId
        }
      }
    });

    res.json({ message: 'Successfully unenrolled from course' });
  } catch (error) {
    console.error('Unenroll course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get assignments for a specific course
router.get('/:courseId/assignments', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { status, type } = req.query;
    const userId = req.userId!;

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });
    
    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    // Check access permissions
    const isInstructor = course.instructorId === userId;
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId: userId
        }
      }
    });
    const isStudent = !!enrollment;
    const isAdmin = req.user!.role === 'admin';

    if (!isInstructor && !isStudent && !isAdmin) {
      res.status(403).json({ error: 'Access denied to this course' });
      return;
    }

    // Build filter for assignments
    const filter: any = { courseId };
    if (status && typeof status === 'string') filter.status = status;
    if (type && typeof type === 'string') filter.type = type;

    // Students can only see published assignments
    if (!isInstructor && !isAdmin) {
      filter.status = 'published';
    }

    const assignments = await prisma.assignment.findMany({
      where: filter,
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      message: 'Course assignments retrieved successfully',
      data: {
        course: {
          id: course.id,
          title: course.title,
          description: course.description
        },
        assignments,
        totalCount: assignments.length
      }
    });
  } catch (error) {
    console.error('Error fetching course assignments:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch course assignments' 
    });
  }
});

export default router;