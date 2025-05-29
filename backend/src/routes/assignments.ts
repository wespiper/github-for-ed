import { Router, Response } from 'express';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { CreateAssignmentInput, UpdateAssignmentInput, AssignmentFilters } from '@shared/types';
import { AssignmentService } from '../services';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

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

    const filter: any = { instructorId: userId };
    if (status) filter.status = status;
    if (course) filter.courseId = course;

    const assignments = await prisma.assignment.findMany({
      where: filter,
      include: {
        course: {
          select: {
            id: true,
            title: true
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

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            enrollments: {
              select: {
                studentId: true
              }
            }
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      }
    });

    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    // Check access permissions
    const isInstructor = assignment.instructor.id === userId;
    const isStudent = assignment.course.enrollments.some(enrollment => enrollment.studentId === userId);
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
    const updateData: UpdateAssignmentInput = req.body;

    const updatedAssignment = await AssignmentService.updateAssignment(assignmentId, updateData, userId);

    res.json({
      message: 'Assignment updated successfully',
      data: updatedAssignment
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    const message = error instanceof Error ? error.message : 'Failed to update assignment';
    const statusCode = message.includes('not found') ? 404 : 
                      message.includes('Only') ? 403 : 500;
    res.status(statusCode).json({ error: message });
  }
});

// Create or get assignment submission
router.post('/:assignmentId/submit', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    const { title, isCollaborative } = req.body;
    const userId = req.userId!;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: {
          include: {
            enrollments: {
              where: {
                studentId: userId
              }
            }
          }
        }
      }
    });

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
    const isStudent = assignment.course.enrollments.length > 0;
    const isAdmin = req.user!.role === 'admin';

    if (!isStudent && !isAdmin) {
      res.status(403).json({ error: 'Only enrolled students can submit to this assignment' });
      return;
    }

    // Check if submission already exists
    let submission = await prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId,
        authorId: userId
      }
    });

    if (!submission) {
      // Create new submission
      submission = await prisma.assignmentSubmission.create({
        data: {
          assignmentId,
          authorId: userId,
          status: 'draft',
          wordCount: 0,
          analytics: {
            writingSessions: 0,
            totalWritingTime: 0,
            averageSessionLength: 0,
            writingPattern: [],
            collaborationMetrics: {
              contributorStats: [{
                user: userId,
                wordsContributed: 0,
                editsCount: 0,
                commentsCount: 0
              }],
              conflictsResolved: 0,
              realTimeMinutes: 0
            }
          }
        }
      });
    }

    const populatedSubmission = await prisma.assignmentSubmission.findUnique({
      where: { id: submission.id },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            dueDate: true,
            requirements: true
          }
        },
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

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

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    });
    
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    // Check permissions
    const isInstructor = assignment.instructorId === userId;
    const isAdmin = req.user!.role === 'admin';

    if (!isInstructor && !isAdmin) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const filter: any = { assignmentId };
    if (status) filter.status = status;

    const submissions = await prisma.assignmentSubmission.findMany({
      where: filter,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

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

    const assignment = await AssignmentService.publishAssignment(assignmentId, userId);

    res.json({
      message: 'Assignment published successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Error publishing assignment:', error);
    const message = error instanceof Error ? error.message : 'Failed to publish assignment';
    const statusCode = message.includes('not found') ? 404 : 
                      message.includes('Only') ? 403 : 500;
    res.status(statusCode).json({ error: message });
  }
});

// Delete assignment
router.delete('/:assignmentId', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    const userId = req.userId!;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    });
    
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    // Check permissions
    const isInstructor = assignment.instructorId === userId;
    const isAdmin = req.user!.role === 'admin';

    if (!isInstructor && !isAdmin) {
      res.status(403).json({ error: 'Only the assignment creator can delete it' });
      return;
    }

    await prisma.assignment.update({
      where: { id: assignmentId },
      data: { status: 'archived' }
    });

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
      const course = await prisma.course.findUnique({
        where: { id: courseId as string }
      });
      
      if (!course) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }

      const isInstructor = course.instructorId === userId;
      const isAdmin = req.user!.role === 'admin';

      if (!isInstructor && !isAdmin) {
        res.status(403).json({ error: 'Access denied to this course' });
        return;
      }
    }

    const assignments = await prisma.assignment.findMany({
      where: {
        ...(courseId && { courseId: courseId as string }),
        learningObjectives: {
          path: ['$[*].category'],
          array_contains: category
        }
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

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
      const course = await prisma.course.findUnique({
        where: { id: courseId as string }
      });
      
      if (!course) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }

      const isInstructor = course.instructorId === userId;
      const isAdmin = req.user!.role === 'admin';

      if (!isInstructor && !isAdmin) {
        res.status(403).json({ error: 'Access denied to this course' });
        return;
      }
    }

    const assignments = await prisma.assignment.findMany({
      where: {
        ...(courseId && { courseId: courseId as string }),
        learningObjectives: {
          path: ['$[*].bloomsLevel'],
          array_contains: bloomsLevel
        }
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

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
      const course = await prisma.course.findUnique({
        where: { id: courseId as string }
      });
      
      if (!course) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }

      const isInstructor = course.instructorId === userId;
      const isAdmin = req.user!.role === 'admin';

      if (!isInstructor && !isAdmin) {
        res.status(403).json({ error: 'Access denied to this course' });
        return;
      }
    }

    const assignments = await prisma.assignment.findMany({
      where: {
        ...(courseId && { courseId: courseId as string }),
        writingStages: {
          not: Prisma.JsonNull
        }
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

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
      const course = await prisma.course.findUnique({
        where: { id: courseId as string }
      });
      
      if (!course) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }

      const isInstructor = course.instructorId === userId;
      const isAdmin = req.user!.role === 'admin';

      if (!isInstructor && !isAdmin) {
        res.status(403).json({ error: 'Access denied to this course' });
        return;
      }
    }

    const assignments = await prisma.assignment.findMany({
      where: {
        ...(courseId && { courseId: courseId as string }),
        aiSettings: {
          path: ['enabled'],
          equals: true
        }
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

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

    const originalAssignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    });
    
    if (!originalAssignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    // Verify course access for target course
    const targetCourse = await prisma.course.findUnique({
      where: { id: courseId }
    });
    
    if (!targetCourse) {
      res.status(404).json({ error: 'Target course not found' });
      return;
    }

    const isInstructor = targetCourse.instructorId === userId;
    const isAdmin = req.user!.role === 'admin';

    if (!isInstructor && !isAdmin) {
      res.status(403).json({ error: 'Only course instructors can create assignments' });
      return;
    }

    // Clone assignment
    const { id, createdAt, updatedAt, ...dataToClone } = originalAssignment;
    
    const clonedAssignment = await prisma.assignment.create({
      data: {
        ...dataToClone,
        title: title || `${originalAssignment.title} (Copy)`,
        courseId,
        instructorId: userId,
        status: 'draft',
        ...(adjustments || {})
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Assignment cloned successfully',
      data: clonedAssignment
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

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    });
    
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    const isInstructor = assignment.instructorId === userId;
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
    if (!assignment.instructions?.trim()) {
      validationResults.errors.push('Instructions are required');
    }

    // Validate learning objectives
    const learningObjectives = assignment.learningObjectives as any[];
    if (!learningObjectives || learningObjectives.length === 0) {
      validationResults.warnings.push('No learning objectives defined');
    } else {
      const totalWeight = learningObjectives.reduce((sum, obj) => sum + (obj.weight || 0), 0);
      if (totalWeight !== 100) {
        validationResults.errors.push('Learning objectives weights must sum to 100%');
      }
    }

    // Validate writing stages
    const writingStages = assignment.writingStages as any[];
    if (writingStages && writingStages.length > 0) {
      const orders = writingStages.map(stage => stage.order);
      const uniqueOrders = new Set(orders);
      if (orders.length !== uniqueOrders.size) {
        validationResults.errors.push('Writing stages must have unique order values');
      }
    }

    // Validate AI settings
    const aiSettings = assignment.aiSettings as any;
    if (aiSettings?.enabled && aiSettings?.stageSpecificSettings) {
      const stageIds = new Set(writingStages?.map(stage => stage.id) || []);
      for (const setting of aiSettings.stageSpecificSettings) {
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