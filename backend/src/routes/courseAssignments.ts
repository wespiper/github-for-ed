import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get assignments for the authenticated user
router.get('/my-assignments', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { status, course } = req.query;

    // Build where clause based on filters
    const whereClause: any = {};
    
    if (status) {
      whereClause.status = status as string;
    }
    
    if (course) {
      if (!isValidUUID(course as string)) {
        res.status(400).json({ error: 'Invalid course ID format' });
        return;
      }
      whereClause.courseId = course as string;
    }

    // Check user role to determine access level
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    // Build assignment query based on user role
    let assignmentWhere: any = { ...whereClause };
    
    if (user?.role !== 'admin') {
      // For students and educators, only show assignments from courses they're enrolled in
      assignmentWhere.course = {
        enrollments: {
          some: {
            studentId: userId
          }
        }
      };
    }
    // For admins, show all assignments (no additional filtering)

    const assignments = await prisma.assignment.findMany({
      where: assignmentWhere,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true
          }
        },
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        submissions: {
          where: {
            authorId: userId
          },
          select: {
            id: true,
            status: true,
            submittedAt: true,
            wordCount: true
          }
        }
      },
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching user assignments:', error);
    res.status(500).json({ 
      error: 'Failed to fetch assignments',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// Helper function to validate UUID format
const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// Deploy template to course (create assignment from template)
router.post('/deploy', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      templateId,
      courseId,
      dueDate,
      customInstructions,
      courseSpecificRequirements,
      allowLateSubmissions = true,
      maxCollaborators
    } = req.body;

    const userId = req.userId!;

    // Validate required fields
    if (!templateId || !courseId) {
      res.status(400).json({ error: 'Template ID and Course ID are required' });
      return;
    }

    if (!isValidUUID(templateId) || !isValidUUID(courseId)) {
      res.status(400).json({ error: 'Invalid template or course ID format' });
      return;
    }

    // Verify template exists and is accessible
    const template = await prisma.assignmentTemplate.findUnique({
      where: { id: templateId },
      include: {
        instructor: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    // Check template access
    const isTemplateOwner = template.instructorId === userId;
    const isTemplatePublic = template.isPublic;
    const isAdmin = req.user!.role === 'admin';
    const hasTemplateAccess = isTemplateOwner || isTemplatePublic || isAdmin;

    if (!hasTemplateAccess) {
      res.status(403).json({ error: 'Access denied to template' });
      return;
    }

    // Verify course exists and user has access
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    // Check course access
    const isCourseOwner = course.instructorId === userId;
    const hasCourseAccess = isCourseOwner || isAdmin;

    if (!hasCourseAccess) {
      res.status(403).json({ error: 'Access denied to course' });
      return;
    }

    // Create assignment from template
    const assignment = await prisma.assignment.create({
      data: {
        templateId,
        courseId,
        instructorId: userId,
        title: template.title,
        instructions: customInstructions || template.instructions,
        requirements: {
          ...(template.requirements as object || {}),
          ...(courseSpecificRequirements || {}),
          allowLateSubmissions,
          maxCollaborators
        },
        learningObjectives: template.learningObjectives as any,
        writingStages: template.writingStages as any,
        aiSettings: template.aiSettings as any,
        gradingCriteria: template.gradingCriteria as any,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'published'
      },
      include: {
        template: {
          select: {
            id: true,
            title: true,
            usageCount: true
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        },
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Increment template usage count
    await prisma.assignmentTemplate.update({
      where: { id: templateId },
      data: {
        usageCount: {
          increment: 1
        }
      }
    });

    res.status(201).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Error deploying template:', error);
    res.status(500).json({ error: 'Failed to deploy template' });
  }
});

// Get all assignments for a course
router.get('/course/:courseId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const userId = req.userId!;
    const userRole = req.user!.role;

    if (!isValidUUID(courseId)) {
      res.status(400).json({ error: 'Invalid course ID format' });
      return;
    }

    // Check course access
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    const isCourseOwner = course.instructorId === userId;
    const isAdmin = userRole === 'admin';

    // Check if user is enrolled in course (for students)
    let isEnrolled = false;
    if (userRole === 'student') {
      const enrollment = await prisma.courseEnrollment.findFirst({
        where: {
          courseId,
          studentId: userId,
          status: 'active'
        }
      });
      isEnrolled = !!enrollment;
    }

    const hasAccess = isCourseOwner || isAdmin || isEnrolled;

    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied to course' });
      return;
    }

    // Get assignments for the course
    const assignments = await prisma.assignment.findMany({
      where: { courseId },
      include: {
        template: {
          select: {
            id: true,
            title: true
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        },
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        submissions: userRole === 'student' ? {
          where: { authorId: userId },
          select: {
            id: true,
            status: true,
            wordCount: true,
            submittedAt: true,
            updatedAt: true
          }
        } : {
          select: {
            id: true,
            authorId: true,
            status: true,
            submittedAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching course assignments:', error);
    res.status(500).json({ error: 'Failed to fetch course assignments' });
  }
});

// Get assignment by ID
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const userRole = req.user!.role;

    if (!isValidUUID(id)) {
      res.status(400).json({ error: 'Invalid assignment ID format' });
      return;
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        template: {
          select: {
            id: true,
            title: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            instructorId: true
          }
        },
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    // Check access permissions
    const isOwner = assignment.instructorId === userId;
    const isAdmin = userRole === 'admin';

    // Check if user is enrolled in course (for students)
    let isEnrolled = false;
    if (userRole === 'student') {
      const enrollment = await prisma.courseEnrollment.findFirst({
        where: {
          courseId: assignment.courseId,
          studentId: userId,
          status: 'active'
        }
      });
      isEnrolled = !!enrollment;
    }

    const hasAccess = isOwner || isAdmin || isEnrolled;

    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied to assignment' });
      return;
    }

    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
});

// Update assignment
router.put('/:id', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const userRole = req.user!.role;

    if (!isValidUUID(id)) {
      res.status(400).json({ error: 'Invalid assignment ID format' });
      return;
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id }
    });

    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    // Check ownership
    const isOwner = assignment.instructorId === userId;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: 'Only assignment owner can update assignment' });
      return;
    }

    // Update assignment
    const updatedAssignment = await prisma.assignment.update({
      where: { id },
      data: {
        title: req.body.title || assignment.title,
        instructions: req.body.instructions || assignment.instructions,
        requirements: req.body.requirements || assignment.requirements,
        learningObjectives: req.body.learningObjectives || assignment.learningObjectives,
        writingStages: req.body.writingStages || assignment.writingStages,
        aiSettings: req.body.aiSettings || assignment.aiSettings,
        gradingCriteria: req.body.gradingCriteria || assignment.gradingCriteria,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : assignment.dueDate,
        status: req.body.status || assignment.status
      },
      include: {
        template: {
          select: {
            id: true,
            title: true
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        },
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedAssignment
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// Delete assignment
router.delete('/:id', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const userRole = req.user!.role;

    if (!isValidUUID(id)) {
      res.status(400).json({ error: 'Invalid assignment ID format' });
      return;
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id }
    });

    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    // Check ownership
    const isOwner = assignment.instructorId === userId;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: 'Only assignment owner can delete assignment' });
      return;
    }

    // Check if assignment has submissions
    const submissionCount = await prisma.assignmentSubmission.count({
      where: { assignmentId: id }
    });

    if (submissionCount > 0) {
      res.status(400).json({ 
        error: 'Cannot delete assignment with existing submissions',
        submissionCount
      });
      return;
    }

    await prisma.assignment.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

// Get assignment submissions (for educators)
router.get('/:id/submissions', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const userRole = req.user!.role;

    if (!isValidUUID(id)) {
      res.status(400).json({ error: 'Invalid assignment ID format' });
      return;
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id }
    });

    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    // Check ownership
    const isOwner = assignment.instructorId === userId;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: 'Only assignment owner can view submissions' });
      return;
    }

    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId: id },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Error fetching assignment submissions:', error);
    res.status(500).json({ error: 'Failed to fetch assignment submissions' });
  }
});

export default router;