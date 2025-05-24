import express, { Response } from 'express';
import { Course, ICourse } from '../models/Course';
import { User } from '../models/User';
import { Assignment } from '../models/Assignment';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

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
    
    let courses: ICourse[];
    
    if (userRole === 'educator') {
      // Educators see their own courses
      courses = await Course.find({ instructor: userId })
        .populate('students', 'firstName lastName email')
        .sort({ createdAt: -1 });
    } else if (userRole === 'student') {
      // Students see courses they're enrolled in
      courses = await Course.find({ 
        students: userId,
        isActive: true 
      })
        .populate('instructor', 'firstName lastName email')
        .sort({ createdAt: -1 });
    } else if (userRole === 'admin') {
      // Admins see all courses
      courses = await Course.find()
        .populate('instructor', 'firstName lastName email')
        .populate('students', 'firstName lastName email')
        .sort({ createdAt: -1 });
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

// Get all courses for instructor
router.get('/my-courses', authenticate, requireRole(['educator']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const instructorId = req.userId!;
    
    const courses = await Course.find({ instructor: instructorId })
      .populate('students', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({ courses });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get enrolled courses for student
router.get('/enrolled', authenticate, requireRole(['student']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.userId!;
    
    const courses = await Course.find({ 
      students: studentId,
      isActive: true 
    })
      .populate('instructor', 'firstName lastName email')
      .sort({ createdAt: -1 });

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
    const course = new Course({
      title: title.trim(),
      description: description.trim(),
      instructor: instructorId,
      maxStudents,
      tags: tags?.map(tag => tag.trim().toLowerCase()) || []
    });

    await course.save();
    await course.populate('instructor', 'firstName lastName email');

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

    const course = await Course.findById(courseId)
      .populate('instructor', 'firstName lastName email')
      .populate('students', 'firstName lastName email');

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    // Check authorization
    const isInstructor = course.instructor._id.toString() === userId;
    const isEnrolledStudent = course.students.some(student => student._id.toString() === userId);

    if (!isInstructor && !isEnrolledStudent) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({ course });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update course (instructor only)
router.put('/:courseId', authenticate, requireRole(['educator']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { title, description, maxStudents, tags, isActive } = req.body;
    const instructorId = req.userId!;

    const course = await Course.findById(courseId);

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    if (course.instructor.toString() !== instructorId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Update fields
    if (title !== undefined) course.title = title.trim();
    if (description !== undefined) course.description = description.trim();
    if (maxStudents !== undefined) course.maxStudents = maxStudents;
    if (tags !== undefined) course.tags = tags.map((tag: string) => tag.trim().toLowerCase());
    if (isActive !== undefined) course.isActive = isActive;

    await course.save();
    await course.populate('instructor', 'firstName lastName email');
    await course.populate('students', 'firstName lastName email');

    res.json({
      message: 'Course updated successfully',
      course
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

    const course = await Course.findOne({ 
      enrollmentCode: enrollmentCode.toUpperCase(),
      isActive: true 
    });

    if (!course) {
      res.status(404).json({ error: 'Course not found or inactive' });
      return;
    }

    // Check if student is already enrolled
    if (course.students.includes(studentId as any)) {
      res.status(400).json({ error: 'Already enrolled in this course' });
      return;
    }

    // Check enrollment limit
    if (course.maxStudents && course.students.length >= course.maxStudents) {
      res.status(400).json({ error: 'Course is at maximum capacity' });
      return;
    }

    // Enroll student
    course.students.push(studentId as any);
    await course.save();
    await course.populate('instructor', 'firstName lastName email');

    res.json({
      message: 'Successfully enrolled in course',
      course: {
        _id: course._id,
        title: course.title,
        description: course.description,
        instructor: course.instructor,
        enrollmentCode: course.enrollmentCode,
        tags: course.tags
      }
    });
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

    const course = await Course.findById(courseId);

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    // Check if student is enrolled
    const studentIndex = course.students.indexOf(studentId as any);
    if (studentIndex === -1) {
      res.status(400).json({ error: 'Not enrolled in this course' });
      return;
    }

    // Remove student
    course.students.splice(studentIndex, 1);
    await course.save();

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
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    // Check access permissions
    const isInstructor = course.instructor.toString() === userId;
    const isStudent = course.students.some((studentId: any) => studentId.toString() === userId);
    const isAdmin = req.user!.role === 'admin';

    if (!isInstructor && !isStudent && !isAdmin) {
      res.status(403).json({ error: 'Access denied to this course' });
      return;
    }

    // Build filter for assignments
    const filter: any = { course: courseId };
    if (status && typeof status === 'string') filter.status = status;
    if (type && typeof type === 'string') filter.type = type;

    // Students can only see published assignments
    if (!isInstructor && !isAdmin) {
      filter.status = 'published';
    }

    const assignments = await Assignment.find(filter)
      .populate('instructor', 'firstName lastName email')
      .populate('submissionCount')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Course assignments retrieved successfully',
      data: {
        course: {
          _id: course._id,
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