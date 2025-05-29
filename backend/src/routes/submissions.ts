import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Helper function to validate UUID format
const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// Helper function to calculate text differences
const calculateDiff = (oldText: string, newText: string) => {
  const oldWords = oldText.trim().split(/\s+/).filter(word => word.length > 0);
  const newWords = newText.trim().split(/\s+/).filter(word => word.length > 0);
  
  const addedWords = Math.max(0, newWords.length - oldWords.length);
  const deletedWords = Math.max(0, oldWords.length - newWords.length);
  const addedChars = Math.max(0, newText.length - oldText.length);
  const deletedChars = Math.max(0, oldText.length - newText.length);
  
  return { addedWords, deletedWords, addedChars, deletedChars };
};

// Helper function to count words
const countWords = (text: string): number => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

// Get user's assignment submissions
router.get('/my-submissions', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { status, assignment } = req.query;

    // Build where clause for Prisma
    const whereClause: any = {
      OR: [
        { authorId: userId },
        { collaborators: { some: { userId: userId } } }
      ]
    };

    if (status && typeof status === 'string') {
      whereClause.status = status;
    }

    if (assignment && typeof assignment === 'string' && isValidUUID(assignment)) {
      whereClause.assignmentId = assignment;
    }

    const submissions = await prisma.assignmentSubmission.findMany({
      where: whereClause,
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            dueDate: true,
            course: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
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
                lastName: true,
                email: true
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
      message: 'Submissions retrieved successfully',
      data: submissions
    });
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Get submission by ID
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const userRole = req.user!.role;

    if (!isValidUUID(id)) {
      res.status(400).json({ error: 'Invalid submission ID format' });
      return;
    }

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            instructions: true,
            dueDate: true,
            instructorId: true,
            course: {
              select: {
                id: true,
                title: true,
                instructorId: true
              }
            }
          }
        },
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
                lastName: true,
                email: true
              }
            }
          }
        },
        documents: {
          select: {
            id: true,
            title: true,
            content: true,
            updatedAt: true
          }
        }
      }
    });

    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    // Check access permissions
    const isAuthor = submission.authorId === userId;
    const isCollaborator = submission.collaborators.some(collab => collab.userId === userId);
    const isAssignmentOwner = submission.assignment.instructorId === userId;
    const isCourseOwner = submission.assignment.course.instructorId === userId;
    const isAdmin = userRole === 'admin';

    const hasAccess = isAuthor || isCollaborator || isAssignmentOwner || isCourseOwner || isAdmin;

    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied to submission' });
      return;
    }

    res.json({
      message: 'Submission retrieved successfully',
      data: submission
    });
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

// Create or update submission
router.post('/:assignmentId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    const userId = req.userId!;
    const { title, content } = req.body;

    if (!isValidUUID(assignmentId)) {
      res.status(400).json({ error: 'Invalid assignment ID format' });
      return;
    }

    // Verify assignment exists and user has access
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: {
          select: {
            id: true,
            instructorId: true
          }
        }
      }
    });

    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    // Check if user is enrolled in the course
    const enrollment = await prisma.courseEnrollment.findFirst({
      where: {
        courseId: assignment.courseId,
        studentId: userId,
        status: 'active'
      }
    });

    if (!enrollment) {
      res.status(403).json({ error: 'Not enrolled in course' });
      return;
    }

    // Check if submission already exists
    let submission = await prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId,
        authorId: userId
      }
    });

    const wordCount = countWords(content || '');

    if (submission) {
      // Update existing submission
      submission = await prisma.assignmentSubmission.update({
        where: { id: submission.id },
        data: {
          title: title || submission.title,
          content: content || submission.content,
          wordCount,
          status: 'draft'
        },
        include: {
          assignment: {
            select: {
              id: true,
              title: true,
              dueDate: true
            }
          },
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });
    } else {
      // Create new submission
      submission = await prisma.assignmentSubmission.create({
        data: {
          assignmentId,
          authorId: userId,
          title: title || assignment.title,
          content: content || '',
          wordCount,
          status: 'draft'
        },
        include: {
          assignment: {
            select: {
              id: true,
              title: true,
              dueDate: true
            }
          },
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });
    }

    res.json({
      message: 'Submission saved successfully',
      data: submission
    });
  } catch (error) {
    console.error('Error saving submission:', error);
    res.status(500).json({ error: 'Failed to save submission' });
  }
});

// Submit assignment for grading
router.patch('/:id/submit', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    if (!isValidUUID(id)) {
      res.status(400).json({ error: 'Invalid submission ID format' });
      return;
    }

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id },
      include: {
        assignment: {
          select: {
            dueDate: true,
            title: true
          }
        }
      }
    });

    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    // Check if user is the author
    if (submission.authorId !== userId) {
      res.status(403).json({ error: 'Only submission author can submit' });
      return;
    }

    // Check if already submitted
    if (submission.status === 'submitted') {
      res.status(400).json({ error: 'Submission already submitted' });
      return;
    }

    // Check word count requirement (basic validation)
    if (submission.wordCount < 50) {
      res.status(400).json({ 
        error: 'Submission too short. Minimum 50 words required.',
        currentWordCount: submission.wordCount
      });
      return;
    }

    // Update submission status
    const updatedSubmission = await prisma.assignmentSubmission.update({
      where: { id },
      data: {
        status: 'submitted',
        submittedAt: new Date()
      },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            dueDate: true
          }
        },
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({
      message: 'Assignment submitted successfully',
      data: updatedSubmission
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
});

// Add collaborator to submission
router.post('/:id/collaborators', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { collaboratorId, role = 'collaborator' } = req.body;

    if (!isValidUUID(id) || !isValidUUID(collaboratorId)) {
      res.status(400).json({ error: 'Invalid ID format' });
      return;
    }

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id }
    });

    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    // Check if user is the author
    if (submission.authorId !== userId) {
      res.status(403).json({ error: 'Only submission author can add collaborators' });
      return;
    }

    // Check if user exists
    const collaborator = await prisma.user.findUnique({
      where: { id: collaboratorId }
    });

    if (!collaborator) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if already a collaborator
    const existingCollaboration = await prisma.submissionCollaborator.findFirst({
      where: {
        submissionId: id,
        userId: collaboratorId
      }
    });

    if (existingCollaboration) {
      res.status(400).json({ error: 'User is already a collaborator' });
      return;
    }

    // Add collaborator
    const collaboration = await prisma.submissionCollaborator.create({
      data: {
        submissionId: id,
        userId: collaboratorId,
        role
      },
      include: {
        user: {
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
      message: 'Collaborator added successfully',
      data: collaboration
    });
  } catch (error) {
    console.error('Error adding collaborator:', error);
    res.status(500).json({ error: 'Failed to add collaborator' });
  }
});

// Get submission analytics (for educators)
router.get('/:id/analytics', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const userRole = req.user!.role;

    if (!isValidUUID(id)) {
      res.status(400).json({ error: 'Invalid submission ID format' });
      return;
    }

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id },
      include: {
        assignment: {
          select: {
            instructorId: true,
            course: {
              select: {
                instructorId: true
              }
            }
          }
        }
      }
    });

    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    // Check if user has permission to view analytics
    const isAssignmentOwner = submission.assignment.instructorId === userId;
    const isCourseOwner = submission.assignment.course.instructorId === userId;
    const isAdmin = userRole === 'admin';

    if (!isAssignmentOwner && !isCourseOwner && !isAdmin) {
      res.status(403).json({ error: 'Access denied to submission analytics' });
      return;
    }

    // Get writing sessions for this submission
    const writingSessions = await prisma.writingSession.findMany({
      where: {
        document: {
          submissionId: id
        }
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        duration: true,
        activity: true
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    // Calculate basic analytics
    const totalSessions = writingSessions.length;
    const totalWritingTime = writingSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    const averageSessionLength = totalSessions > 0 ? totalWritingTime / totalSessions : 0;

    const analytics = {
      submissionId: id,
      wordCount: submission.wordCount,
      totalSessions,
      totalWritingTime,
      averageSessionLength,
      status: submission.status,
      submittedAt: submission.submittedAt,
      lastActivity: submission.updatedAt,
      writingSessions: writingSessions.map(session => ({
        id: session.id,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        activity: session.activity
      }))
    };

    res.json({
      message: 'Submission analytics retrieved successfully',
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching submission analytics:', error);
    res.status(500).json({ error: 'Failed to fetch submission analytics' });
  }
});

// Delete submission (only if not submitted)
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const userRole = req.user!.role;

    if (!isValidUUID(id)) {
      res.status(400).json({ error: 'Invalid submission ID format' });
      return;
    }

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id },
      include: {
        assignment: {
          select: {
            instructorId: true
          }
        }
      }
    });

    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    // Check permission
    const isAuthor = submission.authorId === userId;
    const isAssignmentOwner = submission.assignment.instructorId === userId;
    const isAdmin = userRole === 'admin';

    if (!isAuthor && !isAssignmentOwner && !isAdmin) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Cannot delete submitted assignments (unless you're the instructor/admin)
    if (submission.status === 'submitted' && isAuthor && !isAssignmentOwner && !isAdmin) {
      res.status(400).json({ error: 'Cannot delete submitted assignment' });
      return;
    }

    await prisma.assignmentSubmission.delete({
      where: { id }
    });

    res.json({
      message: 'Submission deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ error: 'Failed to delete submission' });
  }
});

export default router;