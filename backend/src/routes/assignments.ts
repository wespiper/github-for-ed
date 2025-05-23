import { Router, Response } from 'express';
import { Assignment, IAssignment } from '../models/Assignment';
import { AssignmentSubmission, IAssignmentSubmission } from '../models/AssignmentSubmission';
import { Course } from '../models/Course';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { Types } from 'mongoose';

const router = Router();

// Create a new assignment
router.post('/', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      instructions,
      courseId,
      type = 'individual',
      dueDate,
      requirements,
      collaboration,
      versionControl,
      aiSettings,
      grading
    } = req.body;

    const userId = req.userId!;

    // Verify course access
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    // Check if user is the instructor or admin
    const isInstructor = course.instructor.toString() === userId;
    const isAdmin = req.user!.role === 'admin';

    if (!isInstructor && !isAdmin) {
      res.status(403).json({ error: 'Only course instructors can create assignments' });
      return;
    }

    // Create assignment
    const assignment = new Assignment({
      title,
      description,
      instructions,
      course: courseId,
      instructor: userId,
      type,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      requirements: requirements || {},
      collaboration: {
        enabled: type === 'collaborative',
        allowRealTimeEditing: type === 'collaborative',
        allowComments: true,
        allowSuggestions: true,
        requireApprovalForChanges: false,
        ...collaboration
      },
      versionControl: {
        autoSaveInterval: 30,
        createVersionOnSubmit: true,
        allowVersionRevert: false,
        trackAllChanges: true,
        ...versionControl
      },
      aiSettings: {
        enabled: false,
        allowedAssistanceTypes: [],
        requireReflection: true,
        boundaryLevel: 'moderate',
        ...aiSettings
      },
      grading: {
        enabled: false,
        allowPeerReview: false,
        ...grading
      }
    });

    await assignment.save();

    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate('instructor', 'firstName lastName email')
      .populate('course', 'title');

    res.status(201).json({
      message: 'Assignment created successfully',
      data: populatedAssignment
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// Get assignments for a course
router.get('/course/:courseId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { status, type } = req.query;
    const userId = req.userId!;

    // Verify course access
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    const isInstructor = course.instructor.toString() === userId;
    const isStudent = course.students.some((studentId: any) => studentId.toString() === userId);
    const isAdmin = req.user!.role === 'admin';

    if (!isInstructor && !isStudent && !isAdmin) {
      res.status(403).json({ error: 'Access denied to this course' });
      return;
    }

    // Build filter
    const filter: any = { course: courseId };
    if (status) filter.status = status;
    if (type) filter.type = type;

    // Students only see published assignments
    if (!isInstructor && !isAdmin) {
      filter.status = 'published';
    }

    const assignments = await Assignment.find(filter)
      .populate('instructor', 'firstName lastName email')
      .populate('submissionCount')
      .sort({ createdAt: -1 });

    res.json({
      message: 'Assignments retrieved successfully',
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get instructor's assignments
router.get('/my-assignments', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { status, course } = req.query;

    const filter: any = { instructor: userId };
    if (status) filter.status = status;
    if (course) filter.course = course;

    const assignments = await Assignment.find(filter)
      .populate('course', 'title')
      .populate('submissionCount')
      .sort({ createdAt: -1 });

    res.json({
      message: 'Assignments retrieved successfully',
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching instructor assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get a specific assignment
router.get('/:assignmentId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    const userId = req.userId!;

    const assignment = await Assignment.findById(assignmentId)
      .populate('instructor', 'firstName lastName email')
      .populate('course', 'title students')
      .populate('submissionCount');

    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    // Check access permissions
    const course = assignment.course as any;
    const isInstructor = (assignment.instructor as any)._id.toString() === userId;
    const isStudent = course.students.some((studentId: any) => studentId.toString() === userId);
    const isAdmin = req.user!.role === 'admin';

    if (!isInstructor && !isStudent && !isAdmin) {
      res.status(403).json({ error: 'Access denied to this assignment' });
      return;
    }

    // Students can only see published assignments
    if (!isInstructor && !isAdmin && assignment.status !== 'published') {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    res.json({
      message: 'Assignment retrieved successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
});

// Update assignment
router.put('/:assignmentId', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    const userId = req.userId!;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    // Check permissions
    const isInstructor = assignment.instructor.toString() === userId;
    const isAdmin = req.user!.role === 'admin';

    if (!isInstructor && !isAdmin) {
      res.status(403).json({ error: 'Only the assignment creator can update it' });
      return;
    }

    // Update fields
    const allowedUpdates = [
      'title', 'description', 'instructions', 'type', 'dueDate', 'allowLateSubmissions',
      'maxCollaborators', 'requirements', 'collaboration', 'versionControl', 'aiSettings',
      'status', 'grading'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        (assignment as any)[field] = req.body[field];
      }
    });

    await assignment.save();

    const updatedAssignment = await Assignment.findById(assignmentId)
      .populate('instructor', 'firstName lastName email')
      .populate('course', 'title');

    res.json({
      message: 'Assignment updated successfully',
      data: updatedAssignment
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// Create or get assignment submission
router.post('/:assignmentId/submit', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    const { title, isCollaborative } = req.body;
    const userId = req.userId!;

    const assignment = await Assignment.findById(assignmentId)
      .populate('course', 'students');

    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    // Check if assignment is published
    if (assignment.status !== 'published') {
      res.status(400).json({ error: 'Assignment is not yet available' });
      return;
    }

    // Check if user is enrolled in the course
    const course = assignment.course as any;
    const isStudent = course.students.some((studentId: any) => studentId.toString() === userId);
    const isAdmin = req.user!.role === 'admin';

    if (!isStudent && !isAdmin) {
      res.status(403).json({ error: 'Only enrolled students can submit to this assignment' });
      return;
    }

    // Check if submission already exists
    let submission = await AssignmentSubmission.findOne({
      assignment: assignmentId,
      author: userId
    });

    if (!submission) {
      // Create new submission
      submission = new AssignmentSubmission({
        assignment: assignmentId,
        author: userId,
        title: title || `${assignment.title} - Submission`,
        collaboration: {
          isCollaborative: isCollaborative || assignment.type === 'collaborative',
          activeUsers: [userId],
          lastActiveAt: new Date(),
          conflictResolution: 'auto'
        },
        analytics: {
          writingSessions: 0,
          totalWritingTime: 0,
          averageSessionLength: 0,
          writingPattern: [],
          collaborationMetrics: {
            contributorStats: [{
              user: new Types.ObjectId(userId),
              wordsContributed: 0,
              editsCount: 0,
              commentsCount: 0
            }],
            conflictsResolved: 0,
            realTimeMinutes: 0
          }
        }
      });

      await submission.save();
    }

    const populatedSubmission = await AssignmentSubmission.findById(submission._id)
      .populate('assignment', 'title dueDate requirements collaboration')
      .populate('author', 'firstName lastName email')
      .populate('collaborators', 'firstName lastName email');

    res.status(201).json({
      message: 'Assignment submission ready',
      data: populatedSubmission
    });
  } catch (error) {
    console.error('Error creating assignment submission:', error);
    res.status(500).json({ error: 'Failed to create assignment submission' });
  }
});

// Get assignment submissions (for instructors)
router.get('/:assignmentId/submissions', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    const { status } = req.query;
    const userId = req.userId!;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    // Check permissions
    const isInstructor = assignment.instructor.toString() === userId;
    const isAdmin = req.user!.role === 'admin';

    if (!isInstructor && !isAdmin) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const filter: any = { assignment: assignmentId };
    if (status) filter.status = status;

    const submissions = await AssignmentSubmission.find(filter)
      .populate('author', 'firstName lastName email')
      .populate('collaborators', 'firstName lastName email')
      .sort({ lastSavedAt: -1 });

    res.json({
      message: 'Assignment submissions retrieved successfully',
      data: submissions
    });
  } catch (error) {
    console.error('Error fetching assignment submissions:', error);
    res.status(500).json({ error: 'Failed to fetch assignment submissions' });
  }
});

// Publish assignment
router.patch('/:assignmentId/publish', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    const userId = req.userId!;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    // Check permissions
    const isInstructor = assignment.instructor.toString() === userId;
    const isAdmin = req.user!.role === 'admin';

    if (!isInstructor && !isAdmin) {
      res.status(403).json({ error: 'Only the assignment creator can publish it' });
      return;
    }

    assignment.status = 'published';
    assignment.publishedAt = new Date();
    await assignment.save();

    res.json({
      message: 'Assignment published successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Error publishing assignment:', error);
    res.status(500).json({ error: 'Failed to publish assignment' });
  }
});

// Delete assignment
router.delete('/:assignmentId', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    const userId = req.userId!;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    // Check permissions
    const isInstructor = assignment.instructor.toString() === userId;
    const isAdmin = req.user!.role === 'admin';

    if (!isInstructor && !isAdmin) {
      res.status(403).json({ error: 'Only the assignment creator can delete it' });
      return;
    }

    assignment.status = 'archived';
    await assignment.save();

    res.json({
      message: 'Assignment archived successfully'
    });
  } catch (error) {
    console.error('Error archiving assignment:', error);
    res.status(500).json({ error: 'Failed to archive assignment' });
  }
});

export default router;