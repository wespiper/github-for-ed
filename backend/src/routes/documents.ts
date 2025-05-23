import { Router, Response } from 'express';
import { DocumentModel, IDocument } from '../models/Document';
import { DocumentVersion, IDocumentVersion } from '../models/DocumentVersion';
import { WritingSession, IWritingSession } from '../models/WritingSession';
import { Course } from '../models/Course';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { Types } from 'mongoose';

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

// Create a new document
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, courseId, chapter, lesson, type = 'draft', settings } = req.body;
    const userId = req.userId!;

    // Verify course access
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    // Check if user has access to the course
    const isInstructor = course.instructor.toString() === userId;
    const isStudent = course.students.some((studentId: any) => studentId.toString() === userId);
    const isAdmin = req.user!.role === 'admin';

    if (!isInstructor && !isStudent && !isAdmin) {
      res.status(403).json({ error: 'Access denied to this course' });
      return;
    }

    // Create document
    const document = new DocumentModel({
      title,
      content: '',
      course: courseId,
      author: userId,
      chapter,
      lesson,
      type,
      settings: {
        autoSave: true,
        autoSaveInterval: 30,
        allowCollaboration: false,
        ...settings
      },
      metadata: {
        lastEditedBy: userId
      }
    });

    await document.save();

    // Create initial version
    const initialVersion = new DocumentVersion({
      document: document._id,
      version: 1,
      content: '',
      title,
      changes: {
        type: 'manual',
        description: 'Initial document creation',
        addedChars: 0,
        deletedChars: 0,
        addedWords: 0,
        deletedWords: 0
      },
      author: userId,
      metadata: {
        wordCount: 0,
        characterCount: 0,
        readingTime: 0
      }
    });

    await initialVersion.save();

    const populatedDocument = await DocumentModel.findById(document._id)
      .populate('author', 'firstName lastName email')
      .populate('course', 'title');

    res.status(201).json({
      message: 'Document created successfully',
      data: populatedDocument
    });
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

// Get documents for a course
router.get('/course/:courseId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { chapter, lesson, type, author } = req.query;
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
    const filter: any = { course: courseId, status: 'active' };
    if (chapter) filter.chapter = chapter;
    if (lesson) filter.lesson = lesson;
    if (type) filter.type = type;
    if (author) filter.author = author;

    // Students can only see their own documents unless it's collaborative
    if (!isInstructor && !isAdmin) {
      filter.$or = [
        { author: userId },
        { collaborators: userId },
        { type: 'collaborative' }
      ];
    }

    const documents = await DocumentModel.find(filter)
      .populate('author', 'firstName lastName email')
      .populate('collaborators', 'firstName lastName email')
      .populate('metadata.lastEditedBy', 'firstName lastName')
      .populate('versionCount')
      .sort({ 'metadata.lastEditedAt': -1 });

    res.json({
      message: 'Documents retrieved successfully',
      data: documents
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get user's documents
router.get('/my-documents', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { course, type, status = 'active' } = req.query;

    const filter: any = { 
      $or: [
        { author: userId },
        { collaborators: userId }
      ],
      status 
    };

    if (course) filter.course = course;
    if (type) filter.type = type;

    const documents = await DocumentModel.find(filter)
      .populate('course', 'title')
      .populate('author', 'firstName lastName email')
      .populate('collaborators', 'firstName lastName email')
      .populate('versionCount')
      .sort({ 'metadata.lastEditedAt': -1 });

    res.json({
      message: 'Documents retrieved successfully',
      data: documents
    });
  } catch (error) {
    console.error('Error fetching user documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get a specific document
router.get('/:documentId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { documentId } = req.params;
    const userId = req.userId!;

    const document = await DocumentModel.findOne({ _id: documentId, status: 'active' })
      .populate('author', 'firstName lastName email')
      .populate('collaborators', 'firstName lastName email')
      .populate('course', 'title instructor')
      .populate('metadata.lastEditedBy', 'firstName lastName');

    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Check access permissions
    const isAuthor = (document.author as any)._id.toString() === userId;
    const isCollaborator = document.collaborators.some((collab: any) => collab._id.toString() === userId);
    const isInstructor = (document.course as any).instructor.toString() === userId;
    const isAdmin = req.user!.role === 'admin';

    if (!isAuthor && !isCollaborator && !isInstructor && !isAdmin) {
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

// Update document content (auto-save)
router.put('/:documentId/content', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { documentId } = req.params;
    const { content, title, sessionId, saveType = 'auto' } = req.body;
    const userId = req.userId!;

    const document = await DocumentModel.findOne({ _id: documentId, status: 'active' });
    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Check edit permissions
    const isAuthor = document.author.toString() === userId;
    const isCollaborator = document.collaborators.some((collab: any) => collab.toString() === userId);
    const canEdit = isAuthor || isCollaborator || document.settings.allowCollaboration;

    if (!canEdit) {
      res.status(403).json({ error: 'No edit permissions for this document' });
      return;
    }

    const oldContent = document.content;
    const oldTitle = document.title;

    // Calculate differences
    const diff = calculateDiff(oldContent, content);

    // Update document
    document.content = content;
    if (title) document.title = title;
    document.metadata.lastEditedBy = new Types.ObjectId(userId);
    await document.save();

    // Create new version if significant changes
    const shouldCreateVersion = 
      saveType === 'manual' || 
      diff.addedWords > 10 || 
      diff.deletedWords > 10 ||
      Math.abs(diff.addedChars) > 100;

    if (shouldCreateVersion) {
      const latestVersion = await DocumentVersion.getLatestVersion(documentId);
      
      const newVersion = new DocumentVersion({
        document: documentId,
        version: latestVersion + 1,
        content,
        title: title || document.title,
        changes: {
          type: saveType,
          description: saveType === 'auto' ? 'Auto-save' : 'Manual save',
          ...diff
        },
        author: userId,
        metadata: {
          wordCount: document.metadata.wordCount,
          characterCount: document.metadata.characterCount,
          readingTime: document.metadata.readingTime
        }
      });

      await newVersion.save();
    }

    res.json({
      message: 'Document updated successfully',
      data: {
        document,
        versionCreated: shouldCreateVersion
      }
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
    const { limit = 10 } = req.query;
    const userId = req.userId!;

    // Check document access
    const document = await DocumentModel.findOne({ _id: documentId, status: 'active' })
      .populate('course', 'instructor');

    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    const isAuthor = document.author.toString() === userId;
    const isCollaborator = document.collaborators.some((collab: any) => collab.toString() === userId);
    const isInstructor = (document.course as any).instructor.toString() === userId;
    const isAdmin = req.user!.role === 'admin';

    if (!isAuthor && !isCollaborator && !isInstructor && !isAdmin) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const versions = await DocumentVersion.getHistory(documentId, Number(limit));

    res.json({
      message: 'Versions retrieved successfully',
      data: versions
    });
  } catch (error) {
    console.error('Error fetching versions:', error);
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
});

// Compare two versions
router.get('/:documentId/compare/:version1/:version2', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { documentId, version1, version2 } = req.params;
    const userId = req.userId!;

    // Check document access
    const document = await DocumentModel.findOne({ _id: documentId, status: 'active' })
      .populate('course', 'instructor');

    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    const isAuthor = document.author.toString() === userId;
    const isCollaborator = document.collaborators.some((collab: any) => collab.toString() === userId);
    const isInstructor = (document.course as any).instructor.toString() === userId;
    const isAdmin = req.user!.role === 'admin';

    if (!isAuthor && !isCollaborator && !isInstructor && !isAdmin) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const comparison = await DocumentVersion.compareVersions(documentId, Number(version1), Number(version2));

    res.json({
      message: 'Version comparison retrieved successfully',
      data: comparison
    });
  } catch (error) {
    console.error('Error comparing versions:', error);
    res.status(500).json({ error: 'Failed to compare versions' });
  }
});

// Add collaborator to document
router.post('/:documentId/collaborators', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { documentId } = req.params;
    const { userId: collaboratorId } = req.body;
    const userId = req.userId!;

    const document = await DocumentModel.findOne({ _id: documentId, status: 'active' });
    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Only author or instructor can add collaborators
    const course = await Course.findById(document.course);
    const isAuthor = document.author.toString() === userId;
    const isInstructor = course?.instructor.toString() === userId;
    const isAdmin = req.user!.role === 'admin';

    if (!isAuthor && !isInstructor && !isAdmin) {
      res.status(403).json({ error: 'No permission to add collaborators' });
      return;
    }

    // Check if user is already a collaborator
    if (document.collaborators.some((collab: any) => collab.toString() === collaboratorId)) {
      res.status(400).json({ error: 'User is already a collaborator' });
      return;
    }

    document.collaborators.push(new Types.ObjectId(collaboratorId));
    await document.save();

    const updatedDocument = await DocumentModel.findById(documentId)
      .populate('collaborators', 'firstName lastName email');

    res.json({
      message: 'Collaborator added successfully',
      data: updatedDocument
    });
  } catch (error) {
    console.error('Error adding collaborator:', error);
    res.status(500).json({ error: 'Failed to add collaborator' });
  }
});

// Delete document (soft delete)
router.delete('/:documentId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { documentId } = req.params;
    const userId = req.userId!;

    const document = await DocumentModel.findOne({ _id: documentId, status: 'active' })
      .populate('course', 'instructor');

    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    const isAuthor = document.author.toString() === userId;
    const isInstructor = (document.course as any).instructor.toString() === userId;
    const isAdmin = req.user!.role === 'admin';

    if (!isAuthor && !isInstructor && !isAdmin) {
      res.status(403).json({ error: 'No permission to delete this document' });
      return;
    }

    document.status = 'deleted';
    await document.save();

    res.json({
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;