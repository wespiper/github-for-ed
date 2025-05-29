import { Router, Response } from 'express';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

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

// Helper to get word count from version metadata
const getWordCountFromVersion = (version: any): number => {
  if (typeof version.metadata === 'object' && version.metadata && 'wordCount' in version.metadata) {
    return (version.metadata as any).wordCount;
  }
  if (version.content) {
    return version.content.trim().split(/\s+/).filter((word: string) => word.length > 0).length;
  }
  return 0;
};

// Create a new document
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, courseId, submissionId, type = 'draft', settings } = req.body;
    const userId = req.userId!;

    // If courseId provided, verify course access
    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          enrollments: {
            where: { studentId: userId }
          }
        }
      });
      
      if (!course) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }

      // Check if user has access to the course
      const isInstructor = course.instructorId === userId;
      const isStudent = course.enrollments.length > 0;
      const isAdmin = req.user!.role === 'admin';

      if (!isInstructor && !isStudent && !isAdmin) {
        res.status(403).json({ error: 'Access denied to this course' });
        return;
      }
    }

    // Create document
    const document = await prisma.document.create({
      data: {
        title,
        content: '',
        authorId: userId,
        ...(courseId && { courseId }),
        ...(submissionId && { submissionId }),
        type,
        settings: {
          autoSave: true,
          autoSaveInterval: 30,
          allowCollaboration: false,
          ...settings
        },
        metadata: {
          lastEditedBy: userId
        },
        isActive: true
      },
      include: {
        author: {
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

    // Create initial version
    await prisma.documentVersion.create({
      data: {
        documentId: document.id,
        version: 1,
        content: '',
        title,
        changes: {
          summary: 'Initial document creation',
          type: 'initial'
        },
        authorId: userId,
        metadata: {
          wordCount: 0,
          characterCount: 0,
          readingTime: 0
        }
      }
    });

    res.status(201).json({
      message: 'Document created successfully',
      data: document
    });
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

// Get user's documents
router.get('/my-documents', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { courseId, type, isActive } = req.query;

    const filter: any = {
      OR: [
        { authorId: userId },
        { collaborators: { some: { id: userId } } }
      ]
    };

    if (courseId) filter.courseId = courseId;
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const documents = await prisma.document.findMany({
      where: filter,
      include: {
        author: {
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
        },
        _count: {
          select: {
            versions: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      message: 'Documents retrieved successfully',
      data: documents
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get document by ID
router.get('/:documentId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { documentId } = req.params;
    const userId = req.userId!;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        author: {
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
            instructorId: true,
            enrollments: {
              select: {
                studentId: true
              }
            }
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
      }
    });

    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Check access permissions
    const isAuthor = document.authorId === userId;
    const isCollaborator = document.collaborators.some(collab => collab.user.id === userId);
    const isInstructor = document.course?.instructorId === userId;
    const isEnrolled = document.course?.enrollments.some(enrollment => enrollment.studentId === userId);
    const isAdmin = req.user!.role === 'admin';

    if (!isAuthor && !isCollaborator && !isInstructor && !isEnrolled && !isAdmin) {
      res.status(403).json({ error: 'Access denied to this document' });
      return;
    }

    res.json({
      message: 'Document retrieved successfully',
      data: document
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Update document content
router.put('/:documentId/content', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { documentId } = req.params;
    const { content, title, createVersion } = req.body;
    const userId = req.userId!;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        collaborators: {
          include: {
            user: true
          }
        }
      }
    });

    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Check edit permissions
    const isAuthor = document.authorId === userId;
    const isCollaborator = document.collaborators.some(collab => collab.user.id === userId);
    const isAdmin = req.user!.role === 'admin';

    if (!isAuthor && !isCollaborator && !isAdmin) {
      res.status(403).json({ error: 'You do not have permission to edit this document' });
      return;
    }

    // Calculate differences
    const diff = calculateDiff(document.content || '', content || '');
    const wordCount = content ? content.trim().split(/\s+/).filter((word: string) => word.length > 0).length : 0;

    // Update document
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        content: content || document.content,
        ...(title && { title }),
        metadata: {
          ...(document.metadata as any),
          lastEditedBy: userId,
          lastEditedAt: new Date()
        }
      }
    });

    // Create version if requested or significant changes
    if (createVersion || diff.addedWords > 50 || diff.deletedWords > 50) {
      const latestVersion = await prisma.documentVersion.findFirst({
        where: { documentId },
        orderBy: { version: 'desc' }
      });

      await prisma.documentVersion.create({
        data: {
          documentId,
          version: (latestVersion?.version || 0) + 1,
          content: content || document.content,
          title: title || document.title,
          changes: {
            summary: `${diff.addedWords} words added, ${diff.deletedWords} words deleted`,
            addedWords: diff.addedWords,
            deletedWords: diff.deletedWords
          },
          diff,
          authorId: userId,
          metadata: {
            diff,
            editDuration: 0
          }
        }
      });
    }

    res.json({
      message: 'Document updated successfully',
      data: updatedDocument
    });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// Get document versions
router.get('/:documentId/versions', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { documentId } = req.params;
    const userId = req.userId!;

    // Verify document exists and user has access
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        collaborators: {
          include: {
            user: true
          }
        },
        course: {
          select: {
            instructorId: true,
            enrollments: {
              select: {
                studentId: true
              }
            }
          }
        }
      }
    });

    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Check access permissions
    const isAuthor = document.authorId === userId;
    const isCollaborator = document.collaborators.some(collab => collab.user.id === userId);
    const isInstructor = document.course?.instructorId === userId;
    const isEnrolled = document.course?.enrollments.some(enrollment => enrollment.studentId === userId);
    const isAdmin = req.user!.role === 'admin';

    if (!isAuthor && !isCollaborator && !isInstructor && !isEnrolled && !isAdmin) {
      res.status(403).json({ error: 'Access denied to this document' });
      return;
    }

    const versions = await prisma.documentVersion.findMany({
      where: { documentId },
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
      orderBy: { version: 'desc' }
    });

    res.json({
      message: 'Document versions retrieved successfully',
      data: versions
    });
  } catch (error) {
    console.error('Error fetching document versions:', error);
    res.status(500).json({ error: 'Failed to fetch document versions' });
  }
});

// Compare two versions
router.get('/:documentId/versions/compare', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { documentId } = req.params;
    const { from, to } = req.query;
    const userId = req.userId!;

    if (!from || !to) {
      res.status(400).json({ error: 'Both from and to version IDs are required' });
      return;
    }

    // Verify document exists and user has access
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        collaborators: {
          include: {
            user: true
          }
        },
        course: {
          select: {
            instructorId: true,
            enrollments: {
              select: {
                studentId: true
              }
            }
          }
        }
      }
    });

    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Check access permissions
    const isAuthor = document.authorId === userId;
    const isCollaborator = document.collaborators.some(collab => collab.user.id === userId);
    const isInstructor = document.course?.instructorId === userId;
    const isEnrolled = document.course?.enrollments.some(enrollment => enrollment.studentId === userId);
    const isAdmin = req.user!.role === 'admin';

    if (!isAuthor && !isCollaborator && !isInstructor && !isEnrolled && !isAdmin) {
      res.status(403).json({ error: 'Access denied to this document' });
      return;
    }

    const [fromVersion, toVersion] = await Promise.all([
      prisma.documentVersion.findUnique({
        where: { id: from as string },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }),
      prisma.documentVersion.findUnique({
        where: { id: to as string },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })
    ]);

    if (!fromVersion || !toVersion) {
      res.status(404).json({ error: 'One or both versions not found' });
      return;
    }

    const diff = calculateDiff(fromVersion.content || '', toVersion.content || '');

    res.json({
      message: 'Version comparison completed',
      data: {
        from: fromVersion,
        to: toVersion,
        diff,
        summary: {
          wordsAdded: diff.addedWords,
          wordsDeleted: diff.deletedWords,
          charactersAdded: diff.addedChars,
          charactersDeleted: diff.deletedChars,
          netWordChange: diff.addedWords - diff.deletedWords,
          netCharacterChange: diff.addedChars - diff.deletedChars
        }
      }
    });
  } catch (error) {
    console.error('Error comparing versions:', error);
    res.status(500).json({ error: 'Failed to compare versions' });
  }
});

// Restore a specific version
router.post('/:documentId/versions/:versionId/restore', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { documentId, versionId } = req.params;
    const userId = req.userId!;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        collaborators: {
          include: {
            user: true
          }
        }
      }
    });

    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Check edit permissions
    const isAuthor = document.authorId === userId;
    const isCollaborator = document.collaborators.some(collab => collab.user.id === userId);
    const isAdmin = req.user!.role === 'admin';

    if (!isAuthor && !isCollaborator && !isAdmin) {
      res.status(403).json({ error: 'You do not have permission to edit this document' });
      return;
    }

    const versionToRestore = await prisma.documentVersion.findUnique({
      where: { id: versionId }
    });

    if (!versionToRestore || versionToRestore.documentId !== documentId) {
      res.status(404).json({ error: 'Version not found' });
      return;
    }

    // Update document with version content
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        content: versionToRestore.content,
        ...(versionToRestore.title && { title: versionToRestore.title }),
        metadata: {
          ...(document.metadata as any),
          lastEditedBy: userId,
          lastEditedAt: new Date(),
          restoredFromVersion: versionToRestore.version
        }
      }
    });

    // Create new version for the restore action
    const latestVersion = await prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { version: 'desc' }
    });

    await prisma.documentVersion.create({
      data: {
        documentId,
        version: (latestVersion?.version || 0) + 1,
        content: versionToRestore.content,
        title: versionToRestore.title,
        changes: {
          summary: `Restored from version ${versionToRestore.version}`,
          type: 'restore',
          restoredFromVersion: versionToRestore.version
        },
        authorId: userId,
        metadata: {
          restoredFrom: versionToRestore.version,
          restoredAt: new Date()
        }
      }
    });

    res.json({
      message: 'Version restored successfully',
      data: updatedDocument
    });
  } catch (error) {
    console.error('Error restoring version:', error);
    res.status(500).json({ error: 'Failed to restore version' });
  }
});

// Start writing session
router.post('/:documentId/sessions', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { documentId } = req.params;
    const { writingStage, assignmentId } = req.body;
    const userId = req.userId!;

    // Verify document exists and user has access
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        collaborators: {
          include: {
            user: true
          }
        }
      }
    });

    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Check access permissions
    const isAuthor = document.authorId === userId;
    const isCollaborator = document.collaborators.some(collab => collab.user.id === userId);
    const isAdmin = req.user!.role === 'admin';

    if (!isAuthor && !isCollaborator && !isAdmin) {
      res.status(403).json({ error: 'Access denied to this document' });
      return;
    }

    // Create writing session
    const session = await prisma.writingSession.create({
      data: {
        documentId,
        userId,
        startTime: new Date(),
        activity: {
          writingStage: writingStage || 'drafting',
          keystrokes: 0,
          pauseCount: 0,
          revisionCount: 0
        }
      }
    });

    res.status(201).json({
      message: 'Writing session started',
      data: session
    });
  } catch (error) {
    console.error('Error starting writing session:', error);
    res.status(500).json({ error: 'Failed to start writing session' });
  }
});

// End writing session
router.put('/:documentId/sessions/:sessionId/end', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { documentId, sessionId } = req.params;
    const { wordCount, analytics } = req.body;
    const userId = req.userId!;

    const session = await prisma.writingSession.findUnique({
      where: { id: sessionId }
    });

    if (!session || session.documentId !== documentId || session.userId !== userId) {
      res.status(404).json({ error: 'Session not found or access denied' });
      return;
    }

    if (session.endTime) {
      res.status(400).json({ error: 'Session already ended' });
      return;
    }

    const duration = Math.floor((new Date().getTime() - session.startTime.getTime()) / 60000); // Duration in minutes

    const updatedSession = await prisma.writingSession.update({
      where: { id: sessionId },
      data: {
        endTime: new Date(),
        duration,
        activity: { ...(session.activity as any), wordCount: wordCount || 0, ...analytics }
      }
    });

    res.json({
      message: 'Writing session ended',
      data: updatedSession
    });
  } catch (error) {
    console.error('Error ending writing session:', error);
    res.status(500).json({ error: 'Failed to end writing session' });
  }
});

// Get document statistics
router.get('/:documentId/stats', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { documentId } = req.params;
    const userId = req.userId!;

    // Verify document exists and user has access
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        collaborators: {
          include: {
            user: true
          }
        },
        course: {
          select: {
            instructorId: true,
            enrollments: {
              select: {
                studentId: true
              }
            }
          }
        }
      }
    });

    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Check access permissions
    const isAuthor = document.authorId === userId;
    const isCollaborator = document.collaborators.some(collab => collab.user.id === userId);
    const isInstructor = document.course?.instructorId === userId;
    const isEnrolled = document.course?.enrollments.some(enrollment => enrollment.studentId === userId);
    const isAdmin = req.user!.role === 'admin';

    if (!isAuthor && !isCollaborator && !isInstructor && !isEnrolled && !isAdmin) {
      res.status(403).json({ error: 'Access denied to this document' });
      return;
    }

    // Get statistics
    const [versionCount, sessionCount, totalSessionTime] = await Promise.all([
      prisma.documentVersion.count({ where: { documentId } }),
      prisma.writingSession.count({ where: { documentId } }),
      prisma.writingSession.aggregate({
        where: { documentId },
        _sum: { duration: true }
      })
    ]);

    const sessions = await prisma.writingSession.findMany({
      where: { documentId },
      orderBy: { startTime: 'desc' },
      take: 10
    });

    res.json({
      message: 'Document statistics retrieved',
      data: {
        document: {
          id: document.id,
          title: document.title,
          wordCount: document.content ? document.content.trim().split(/\s+/).filter((word: string) => word.length > 0).length : 0,
          createdAt: document.createdAt,
          lastSavedAt: document.updatedAt
        },
        statistics: {
          versionCount,
          sessionCount,
          totalWritingTime: totalSessionTime._sum.duration || 0,
          averageSessionLength: sessionCount > 0 ? Math.round((totalSessionTime._sum.duration || 0) / sessionCount) : 0,
          recentSessions: sessions
        }
      }
    });
  } catch (error) {
    console.error('Error fetching document statistics:', error);
    res.status(500).json({ error: 'Failed to fetch document statistics' });
  }
});

export default router;