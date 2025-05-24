import { Router, Response } from 'express';
import { CourseAssignment, ICourseAssignment } from '../models/CourseAssignment';
import { AssignmentTemplate } from '../models/AssignmentTemplate';
import { Course } from '../models/Course';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Helper function to extract instructor ID from populated or non-populated field
const getInstructorId = (instructor: any): string => {
  return typeof instructor === 'object' && instructor._id 
    ? instructor._id.toString() 
    : instructor.toString();
};

// Deploy template to course
router.post('/deploy', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      templateId,
      courseId,
      dueDate,
      customInstructions,
      courseSpecificRequirements,
      stageDueDates,
      allowLateSubmissions = true,
      maxCollaborators
    } = req.body;

    const userId = req.userId!;

    // Verify template exists and is accessible
    const template = await AssignmentTemplate.findById(templateId);
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    // Check template access
    const isTemplateOwner = getInstructorId(template.instructor) === userId;
    const isTemplatePublic = template.isPublic && template.status === 'published';
    const isAdmin = req.user!.role === 'admin';

    // Allow deployment of own templates regardless of status
    const hasTemplateAccess = isTemplateOwner || isTemplatePublic || isAdmin;

    // Debug logging
    console.log('Template deployment access check:', {
      templateId,
      instructorId: getInstructorId(template.instructor),
      currentUserId: userId,
      isTemplateOwner,
      templateIsPublic: template.isPublic,
      templateStatus: template.status,
      isTemplatePublic,
      isAdmin,
      userRole: req.user!.role,
      hasTemplateAccess
    });

    if (!hasTemplateAccess) {
      res.status(403).json({ 
        error: 'Access denied to this template',
        debug: {
          isTemplateOwner,
          isTemplatePublic,
          isAdmin,
          templateStatus: template.status,
          templateIsPublic: template.isPublic,
          note: 'You can only deploy templates you own, public published templates, or if you are an admin'
        }
      });
      return;
    }

    // Verify course exists and user has access
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    // Check course access
    const isCourseInstructor = course.instructor.toString() === userId;
    if (!isCourseInstructor && !isAdmin) {
      res.status(403).json({ error: 'Only course instructors can deploy assignments' });
      return;
    }

    // Check if template is already deployed to this course
    const existingDeployment = await CourseAssignment.findOne({ 
      template: templateId, 
      course: courseId 
    });
    
    if (existingDeployment) {
      res.status(400).json({ error: 'Template is already deployed to this course' });
      return;
    }

    // Validate stage due dates reference valid stages
    if (stageDueDates && stageDueDates.length > 0) {
      const templateStageIds = new Set(template.writingStages.map(stage => stage.id));
      for (const stageDue of stageDueDates) {
        if (!templateStageIds.has(stageDue.stageId)) {
          res.status(400).json({ 
            error: `Invalid stage ID in due dates: ${stageDue.stageId}` 
          });
          return;
        }
      }
    }

    // Create course assignment
    const courseAssignment = new CourseAssignment({
      template: templateId,
      course: courseId,
      instructor: userId,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      customInstructions,
      courseSpecificRequirements,
      stageDueDates,
      allowLateSubmissions,
      maxCollaborators,
      status: 'draft'
    });

    await courseAssignment.save();
    
    // Populate for response
    await courseAssignment.populate([
      { path: 'template', select: 'title type learningObjectives writingStages' },
      { path: 'course', select: 'title' },
      { path: 'instructor', select: 'firstName lastName email' }
    ]);
    
    res.status(201).json({
      success: true,
      data: courseAssignment
    });
  } catch (error) {
    console.error('Error deploying template:', error);
    if (error instanceof Error && (error as any).code === 11000) {
      res.status(400).json({ error: 'Template is already deployed to this course' });
    } else {
      res.status(500).json({ error: 'Failed to deploy template' });
    }
  }
});

// Get course assignments for instructor
router.get('/my-assignments', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { status, course } = req.query;
    
    let filters: any = {};
    if (status) filters.status = status;
    if (course) filters.course = course;
    
    const assignments = await (CourseAssignment as any).findByInstructor(userId, filters);
    
    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching instructor assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get course assignments for a specific course
router.get('/course/:courseId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const userId = req.userId!;
    const userRole = req.user!.role;
    
    // Verify course access
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }
    
    // Check access (instructor, enrolled student, or admin)
    const isInstructor = course.instructor.toString() === userId;
    const isStudent = course.students.includes(userId as any);
    const isAdmin = userRole === 'admin';
    
    if (!isInstructor && !isStudent && !isAdmin) {
      res.status(403).json({ error: 'Access denied to this course' });
      return;
    }
    
    // Students can only see published assignments
    const statusFilter = isInstructor || isAdmin ? {} : { status: 'published' };
    
    const assignments = await (CourseAssignment as any).findByCourse(courseId, statusFilter);
    
    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching course assignments:', error);
    res.status(500).json({ error: 'Failed to fetch course assignments' });
  }
});

// Get assignment by ID with full configuration
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const userRole = req.user!.role;
    
    const assignment = await CourseAssignment.findById(id)
      .populate([
        { path: 'template' },
        { path: 'course', select: 'title students' },
        { path: 'instructor', select: 'firstName lastName email' }
      ]);
    
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }
    
    // Check access
    const course = assignment.course as any;
    const isInstructor = assignment.instructor.toString() === userId;
    const isStudent = course.students.includes(userId);
    const isAdmin = userRole === 'admin';
    
    if (!isInstructor && !isStudent && !isAdmin) {
      res.status(403).json({ error: 'Access denied to this assignment' });
      return;
    }
    
    // Students can only see published assignments
    if (!isInstructor && !isAdmin && assignment.status !== 'published') {
      res.status(403).json({ error: 'Assignment not yet published' });
      return;
    }
    
    // Get effective configuration (merged template + course overrides)
    const effectiveConfig = await assignment.getEffectiveConfiguration();
    
    res.json({
      success: true,
      data: {
        ...assignment.toJSON(),
        effectiveConfiguration: effectiveConfig
      }
    });
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
});

// Update course assignment
router.put('/:id', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const userRole = req.user!.role;
    
    const assignment = await CourseAssignment.findById(id);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }
    
    // Check ownership
    const isOwner = assignment.instructor.toString() === userId;
    const isAdmin = userRole === 'admin';
    
    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: 'Only assignment instructor can update assignment' });
      return;
    }
    
    // Validate stage due dates if provided
    if (req.body.stageDueDates) {
      await assignment.populate('template');
      const template = assignment.template as any;
      const templateStageIds = new Set(template.writingStages.map((stage: any) => stage.id));
      
      for (const stageDue of req.body.stageDueDates) {
        if (!templateStageIds.has(stageDue.stageId)) {
          res.status(400).json({ 
            error: `Invalid stage ID in due dates: ${stageDue.stageId}` 
          });
          return;
        }
      }
    }
    
    // Update assignment
    Object.assign(assignment, req.body);
    await assignment.save();
    
    // Populate for response
    await assignment.populate([
      { path: 'template', select: 'title type' },
      { path: 'course', select: 'title' },
      { path: 'instructor', select: 'firstName lastName email' }
    ]);
    
    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// Publish assignment
router.patch('/:id/publish', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const userRole = req.user!.role;
    
    const assignment = await CourseAssignment.findById(id);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }
    
    // Check ownership
    const isOwner = assignment.instructor.toString() === userId;
    const isAdmin = userRole === 'admin';
    
    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: 'Only assignment instructor can publish assignment' });
      return;
    }
    
    assignment.status = 'published';
    await assignment.save();
    
    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Error publishing assignment:', error);
    res.status(500).json({ error: 'Failed to publish assignment' });
  }
});

// Get upcoming assignments
router.get('/upcoming/all', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { course, days = 30 } = req.query;
    const assignments = await (CourseAssignment as any).findUpcoming(course);
    
    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching upcoming assignments:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming assignments' });
  }
});

// Get assignments due soon
router.get('/due-soon/all', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { course, days = 7 } = req.query;
    const assignments = await (CourseAssignment as any).findDueSoon(parseInt(days as string), course);
    
    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching assignments due soon:', error);
    res.status(500).json({ error: 'Failed to fetch assignments due soon' });
  }
});

// Create submission for assignment
router.post('/:id/submit', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { title, isCollaborative } = req.body;
    
    const assignment = await CourseAssignment.findById(id)
      .populate('course', 'students');
    
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }
    
    // Check if assignment is published
    if (assignment.status !== 'published') {
      res.status(400).json({ error: 'Assignment is not yet published' });
      return;
    }
    
    // Check if user is enrolled in course
    const course = assignment.course as any;
    if (!course.students.includes(userId)) {
      res.status(403).json({ error: 'You are not enrolled in this course' });
      return;
    }
    
    // Create submission
    const submission = await assignment.createSubmission(userId, {
      title,
      isCollaborative
    });
    
    res.status(201).json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Error creating submission:', error);
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

// Archive assignment
router.patch('/:id/archive', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const userRole = req.user!.role;
    
    const assignment = await CourseAssignment.findById(id);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }
    
    // Check ownership
    const isOwner = assignment.instructor.toString() === userId;
    const isAdmin = userRole === 'admin';
    
    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: 'Only assignment instructor can archive assignment' });
      return;
    }
    
    assignment.status = 'archived';
    await assignment.save();
    
    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Error archiving assignment:', error);
    res.status(500).json({ error: 'Failed to archive assignment' });
  }
});

// Delete assignment
router.delete('/:id', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const userRole = req.user!.role;
    
    const assignment = await CourseAssignment.findById(id);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }
    
    // Check ownership
    const isOwner = assignment.instructor.toString() === userId;
    const isAdmin = userRole === 'admin';
    
    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: 'Only assignment instructor can delete assignment' });
      return;
    }
    
    // Check if assignment has submissions
    const submissionCount = await require('../models/AssignmentSubmission').AssignmentSubmission.countDocuments({ 
      assignment: id 
    });
    
    if (submissionCount > 0) {
      res.status(400).json({ 
        error: 'Cannot delete assignment with submissions. Archive it instead.' 
      });
      return;
    }
    
    await CourseAssignment.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

export default router;