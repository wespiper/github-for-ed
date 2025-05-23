import { Router, Response } from 'express';
import { Assignment, IAssignment } from '../models/Assignment';
import { AssignmentSubmission, IAssignmentSubmission } from '../models/AssignmentSubmission';
import { Course } from '../models/Course';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { Types } from 'mongoose';
import { CreateAssignmentInput, UpdateAssignmentInput, AssignmentFilters } from '@shared/types';
import { AssignmentService } from '../services';

const router = Router();

// Create a new assignment
router.post('/', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const assignmentData: CreateAssignmentInput = req.body;

    const assignment = await AssignmentService.createAssignment(assignmentData, userId);

    res.status(201).json({
      message: 'Assignment created successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    const message = error instanceof Error ? error.message : 'Failed to create assignment';
    const statusCode = message.includes('not found') ? 404 : 
                      message.includes('denied') || message.includes('Only') ? 403 : 500;
    res.status(statusCode).json({ error: message });
  }
});

// Get assignments for a course
router.get('/course/:courseId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { status, type } = req.query;
    const userId = req.userId!;
    const userRole = req.user!.role;

    const filters: any = {};
    if (status) filters.status = status;
    if (type) filters.type = type;

    const assignments = await AssignmentService.getAssignmentsByCourse(courseId, userId, userRole, filters);

    res.json({
      message: 'Assignments retrieved successfully',
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch assignments';
    const statusCode = message.includes('not found') ? 404 : 
                      message.includes('denied') ? 403 : 500;
    res.status(statusCode).json({ error: message });
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
      'maxCollaborators', 'requirements', 'collaboration', 'versionControl', 
      'learningObjectives', 'writingStages', 'aiSettings', 'status', 'grading'
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

// Educational workflow endpoints

// Get assignments by learning objective category
router.get('/by-objective/:category', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { category } = req.params;
    const { courseId } = req.query;
    const userId = req.userId!;

    // If courseId provided, verify access
    if (courseId) {
      const course = await Course.findById(courseId);
      if (!course) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }

      const isInstructor = course.instructor.toString() === userId;
      const isAdmin = req.user!.role === 'admin';

      if (!isInstructor && !isAdmin) {
        res.status(403).json({ error: 'Access denied to this course' });
        return;
      }
    }

    const assignments = await (Assignment as any).findByLearningObjectiveCategory(
      category, 
      courseId as string
    );

    res.json({
      message: `Assignments with ${category} learning objectives retrieved successfully`,
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching assignments by objective category:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get assignments by Bloom's taxonomy level
router.get('/by-blooms/:level', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { level } = req.params;
    const { courseId } = req.query;
    const userId = req.userId!;
    const bloomsLevel = parseInt(level);

    if (isNaN(bloomsLevel) || bloomsLevel < 1 || bloomsLevel > 6) {
      res.status(400).json({ error: 'Bloom\'s level must be between 1 and 6' });
      return;
    }

    // If courseId provided, verify access
    if (courseId) {
      const course = await Course.findById(courseId);
      if (!course) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }

      const isInstructor = course.instructor.toString() === userId;
      const isAdmin = req.user!.role === 'admin';

      if (!isInstructor && !isAdmin) {
        res.status(403).json({ error: 'Access denied to this course' });
        return;
      }
    }

    const assignments = await (Assignment as any).findByBloomsLevel(
      bloomsLevel, 
      courseId as string
    );

    res.json({
      message: `Assignments with Bloom's level ${bloomsLevel} retrieved successfully`,
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching assignments by Bloom\'s level:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get multi-stage assignments
router.get('/multi-stage', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.query;
    const userId = req.userId!;

    // If courseId provided, verify access
    if (courseId) {
      const course = await Course.findById(courseId);
      if (!course) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }

      const isInstructor = course.instructor.toString() === userId;
      const isAdmin = req.user!.role === 'admin';

      if (!isInstructor && !isAdmin) {
        res.status(403).json({ error: 'Access denied to this course' });
        return;
      }
    }

    const assignments = await (Assignment as any).findMultiStageAssignments(courseId as string);

    res.json({
      message: 'Multi-stage assignments retrieved successfully',
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching multi-stage assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get assignments with AI enabled
router.get('/with-ai', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.query;
    const userId = req.userId!;

    // If courseId provided, verify access
    if (courseId) {
      const course = await Course.findById(courseId);
      if (!course) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }

      const isInstructor = course.instructor.toString() === userId;
      const isAdmin = req.user!.role === 'admin';

      if (!isInstructor && !isAdmin) {
        res.status(403).json({ error: 'Access denied to this course' });
        return;
      }
    }

    const assignments = await (Assignment as any).findWithAIEnabled(courseId as string);

    res.json({
      message: 'AI-enabled assignments retrieved successfully',
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching AI-enabled assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Clone assignment template
router.post('/:assignmentId/clone', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    const { title, courseId, adjustments } = req.body;
    const userId = req.userId!;

    const originalAssignment = await Assignment.findById(assignmentId);
    if (!originalAssignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    // Verify course access for target course
    const targetCourse = await Course.findById(courseId);
    if (!targetCourse) {
      res.status(404).json({ error: 'Target course not found' });
      return;
    }

    const isInstructor = targetCourse.instructor.toString() === userId;
    const isAdmin = req.user!.role === 'admin';

    if (!isInstructor && !isAdmin) {
      res.status(403).json({ error: 'Only course instructors can create assignments' });
      return;
    }

    // Clone assignment
    const clonedData = originalAssignment.toObject();
    const { _id, createdAt, updatedAt, publishedAt, ...dataToClone } = clonedData;
    
    dataToClone.title = title || `${originalAssignment.title} (Copy)`;
    dataToClone.course = new Types.ObjectId(courseId);
    dataToClone.instructor = new Types.ObjectId(userId);
    dataToClone.status = 'draft';

    // Apply any adjustments
    if (adjustments) {
      Object.assign(dataToClone, adjustments);
    }

    const clonedAssignment = new Assignment(dataToClone);
    await clonedAssignment.save();

    const populatedClone = await Assignment.findById(clonedAssignment._id)
      .populate('instructor', 'firstName lastName email')
      .populate('course', 'title');

    res.status(201).json({
      message: 'Assignment cloned successfully',
      data: populatedClone
    });
  } catch (error) {
    console.error('Error cloning assignment:', error);
    res.status(500).json({ error: 'Failed to clone assignment' });
  }
});

// Validate assignment before publishing
router.post('/:assignmentId/validate', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    const userId = req.userId!;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    const isInstructor = assignment.instructor.toString() === userId;
    const isAdmin = req.user!.role === 'admin';

    if (!isInstructor && !isAdmin) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const validationResults = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[]
    };

    // Check required fields
    if (!assignment.title?.trim()) {
      validationResults.errors.push('Title is required');
    }
    if (!assignment.description?.trim()) {
      validationResults.errors.push('Description is required');
    }
    if (!assignment.instructions?.trim()) {
      validationResults.errors.push('Instructions are required');
    }

    // Validate learning objectives
    if (!assignment.learningObjectives || assignment.learningObjectives.length === 0) {
      validationResults.warnings.push('No learning objectives defined');
    } else {
      const totalWeight = assignment.learningObjectives.reduce((sum, obj) => sum + obj.weight, 0);
      if (totalWeight !== 100) {
        validationResults.errors.push('Learning objectives weights must sum to 100%');
      }
    }

    // Validate writing stages
    if (assignment.writingStages && assignment.writingStages.length > 0) {
      const orders = assignment.writingStages.map(stage => stage.order);
      const uniqueOrders = new Set(orders);
      if (orders.length !== uniqueOrders.size) {
        validationResults.errors.push('Writing stages must have unique order values');
      }
    }

    // Validate AI settings
    if (assignment.aiSettings.enabled && assignment.aiSettings.stageSpecificSettings) {
      const stageIds = new Set(assignment.writingStages?.map(stage => stage.id) || []);
      for (const setting of assignment.aiSettings.stageSpecificSettings) {
        if (!stageIds.has(setting.stageId)) {
          validationResults.errors.push(`AI setting references invalid stage ID: ${setting.stageId}`);
        }
      }
    }

    validationResults.isValid = validationResults.errors.length === 0;

    res.json({
      message: 'Assignment validation completed',
      data: validationResults
    });
  } catch (error) {
    console.error('Error validating assignment:', error);
    res.status(500).json({ error: 'Failed to validate assignment' });
  }
});

export default router;