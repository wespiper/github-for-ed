import { Router, Response } from 'express';
import { AssignmentSubmission, IAssignmentSubmission } from '../models/AssignmentSubmission';
import { Assignment } from '../models/Assignment';
import { DocumentVersion } from '../models/DocumentVersion';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
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

// Get user's assignment submissions
router.get('/my-submissions', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { status, assignment } = req.query;

    const filter: any = {
      $or: [
        { author: userId },
        { collaborators: userId }
      ]
    };

    if (status) filter.status = status;
    if (assignment) filter.assignment = assignment;

    const submissions = await AssignmentSubmission.find(filter)
      .populate('assignment', 'title dueDate course')
      .populate('author', 'firstName lastName email')
      .populate('collaborators', 'firstName lastName email')
      .sort({ lastSavedAt: -1 });

    res.json({
      message: 'Submissions retrieved successfully',
      data: submissions
    });
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Get a specific submission
router.get('/:submissionId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { submissionId } = req.params;
    const userId = req.userId!;

    const submission = await AssignmentSubmission.findById(submissionId)
      .populate('assignment', 'title dueDate requirements collaboration instructor course')
      .populate('author', 'firstName lastName email')
      .populate('collaborators', 'firstName lastName email')
      .populate('comments.author', 'firstName lastName email')
      .populate('comments.replies.author', 'firstName lastName email');

    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    // Check access permissions
    const assignment = submission.assignment as any;
    const isAuthor = (submission.author as any)._id.toString() === userId;
    const isCollaborator = submission.collaborators.some((collab: any) => collab._id.toString() === userId);
    const isInstructor = assignment.instructor.toString() === userId;
    const isAdmin = req.user!.role === 'admin';

    if (!isAuthor && !isCollaborator && !isInstructor && !isAdmin) {
      res.status(403).json({ error: 'Access denied to this submission' });
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

// Update submission content (auto-save and real-time collaboration)
router.put('/:submissionId/content', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { submissionId } = req.params;
    const { content, title, saveType = 'auto', sessionDuration } = req.body;
    const userId = req.userId!;

    const submission = await AssignmentSubmission.findById(submissionId)
      .populate('assignment', 'collaboration versionControl');

    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    // Check edit permissions
    const isAuthor = submission.author.toString() === userId;
    const isCollaborator = submission.collaborators.some((collab: any) => collab.toString() === userId);
    const assignment = submission.assignment as any;
    const canEdit = isAuthor || isCollaborator || assignment.collaboration.allowRealTimeEditing;

    if (!canEdit) {
      res.status(403).json({ error: 'No edit permissions for this submission' });
      return;
    }

    const oldContent = submission.content;
    const oldTitle = submission.title;
    const oldWordCount = submission.wordCount;

    // Calculate differences
    const diff = calculateDiff(oldContent, content);

    // Update submission content
    submission.content = content;
    if (title) submission.title = title;
    submission.lastSavedAt = new Date();

    // Update collaboration tracking
    if (submission.collaboration.isCollaborative) {
      submission.collaboration.lastActiveAt = new Date();
      if (!submission.collaboration.activeUsers.includes(new Types.ObjectId(userId))) {
        submission.collaboration.activeUsers.push(new Types.ObjectId(userId));
      }
    }

    // Update analytics
    const currentDate = new Date().toDateString();
    let todayPattern = submission.analytics.writingPattern.find(
      pattern => new Date(pattern.date).toDateString() === currentDate
    );

    if (!todayPattern) {
      todayPattern = {
        date: new Date(),
        wordsWritten: 0,
        timeSpent: 0,
        revisionsCount: 0
      };
      submission.analytics.writingPattern.push(todayPattern);
    }

    todayPattern.wordsWritten += diff.addedWords;
    todayPattern.revisionsCount += 1;
    if (sessionDuration) {
      todayPattern.timeSpent += sessionDuration;
      submission.analytics.totalWritingTime += sessionDuration;
    }

    // Update contributor stats
    let contributorStat = submission.analytics.collaborationMetrics.contributorStats.find(
      stat => stat.user.toString() === userId
    );

    if (!contributorStat) {
      contributorStat = {
        user: new Types.ObjectId(userId),
        wordsContributed: 0,
        editsCount: 0,
        commentsCount: 0
      };
      submission.analytics.collaborationMetrics.contributorStats.push(contributorStat);
    }

    contributorStat.wordsContributed += diff.addedWords;
    contributorStat.editsCount += 1;

    await submission.save();

    // Create version if significant changes
    const shouldCreateVersion = 
      saveType === 'manual' || 
      diff.addedWords > 25 || 
      diff.deletedWords > 25 ||
      Math.abs(diff.addedChars) > 200;

    if (shouldCreateVersion) {
      const latestVersion = await DocumentVersion.getLatestVersion(submissionId);
      
      const newVersion = new DocumentVersion({
        document: submissionId,
        version: latestVersion + 1,
        content,
        title: title || submission.title,
        changes: {
          type: saveType,
          description: saveType === 'auto' ? 'Auto-save checkpoint' : 'Manual save',
          ...diff
        },
        author: userId,
        metadata: {
          wordCount: submission.wordCount,
          characterCount: submission.characterCount,
          readingTime: submission.estimatedReadingTime
        }
      });

      await newVersion.save();
      submission.currentVersion = latestVersion + 1;

      // Create major milestone if significant progress
      if (diff.addedWords > 100 || saveType === 'manual') {
        submission.majorMilestones.push({
          version: latestVersion + 1,
          timestamp: new Date(),
          description: `Added ${diff.addedWords} words - ${saveType} save`,
          wordCount: submission.wordCount,
          author: new Types.ObjectId(userId)
        });
      }

      await submission.save();
    }

    res.json({
      message: 'Submission updated successfully',
      data: {
        submission,
        versionCreated: shouldCreateVersion,
        currentVersion: submission.currentVersion,
        diff
      }
    });
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ error: 'Failed to update submission' });
  }
});

// Add comment to submission
router.post('/:submissionId/comments', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { submissionId } = req.params;
    const { content, position, type = 'comment' } = req.body;
    const userId = req.userId!;

    const submission = await AssignmentSubmission.findById(submissionId)
      .populate('assignment', 'instructor course');

    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    // Check comment permissions
    const assignment = submission.assignment as any;
    const isAuthor = submission.author.toString() === userId;
    const isCollaborator = submission.collaborators.some((collab: any) => collab.toString() === userId);
    const isInstructor = assignment.instructor.toString() === userId;
    const isAdmin = req.user!.role === 'admin';

    if (!isAuthor && !isCollaborator && !isInstructor && !isAdmin) {
      res.status(403).json({ error: 'No permission to comment on this submission' });
      return;
    }

    const newComment = {
      id: new Types.ObjectId(),
      author: new Types.ObjectId(userId),
      content,
      position,
      type,
      resolved: false,
      createdAt: new Date(),
      replies: []
    };

    submission.comments.push(newComment);

    // Update contributor stats for comments
    let contributorStat = submission.analytics.collaborationMetrics.contributorStats.find(
      stat => stat.user.toString() === userId
    );

    if (contributorStat) {
      contributorStat.commentsCount += 1;
    }

    await submission.save();

    const populatedSubmission = await AssignmentSubmission.findById(submissionId)
      .populate('comments.author', 'firstName lastName email');

    res.status(201).json({
      message: 'Comment added successfully',
      data: populatedSubmission
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Reply to comment
router.post('/:submissionId/comments/:commentId/reply', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { submissionId, commentId } = req.params;
    const { content } = req.body;
    const userId = req.userId!;

    const submission = await AssignmentSubmission.findById(submissionId);
    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    const comment = submission.comments.find(c => c.id.toString() === commentId);
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    const reply = {
      author: new Types.ObjectId(userId),
      content,
      createdAt: new Date()
    };

    comment.replies = comment.replies || [];
    comment.replies.push(reply);

    await submission.save();

    res.json({
      message: 'Reply added successfully',
      data: submission
    });
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ error: 'Failed to add reply' });
  }
});

// Resolve comment
router.patch('/:submissionId/comments/:commentId/resolve', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { submissionId, commentId } = req.params;
    const userId = req.userId!;

    const submission = await AssignmentSubmission.findById(submissionId)
      .populate('assignment', 'instructor');

    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    const comment = submission.comments.find(c => c.id.toString() === commentId);
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    // Check permissions - author, instructor, or comment creator can resolve
    const assignment = submission.assignment as any;
    const isAuthor = submission.author.toString() === userId;
    const isInstructor = assignment.instructor.toString() === userId;
    const isCommentAuthor = comment.author.toString() === userId;
    const isAdmin = req.user!.role === 'admin';

    if (!isAuthor && !isInstructor && !isCommentAuthor && !isAdmin) {
      res.status(403).json({ error: 'No permission to resolve this comment' });
      return;
    }

    comment.resolved = true;
    await submission.save();

    res.json({
      message: 'Comment resolved successfully',
      data: submission
    });
  } catch (error) {
    console.error('Error resolving comment:', error);
    res.status(500).json({ error: 'Failed to resolve comment' });
  }
});

// Add collaborator to submission
router.post('/:submissionId/collaborators', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { submissionId } = req.params;
    const { collaboratorId } = req.body;
    const userId = req.userId!;

    const submission = await AssignmentSubmission.findById(submissionId)
      .populate('assignment', 'collaboration maxCollaborators course');

    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    // Check permissions - only author can add collaborators
    const isAuthor = submission.author.toString() === userId;
    const isAdmin = req.user!.role === 'admin';

    if (!isAuthor && !isAdmin) {
      res.status(403).json({ error: 'Only the submission author can add collaborators' });
      return;
    }

    // Check if collaboration is enabled
    const assignment = submission.assignment as any;
    if (!assignment.collaboration.enabled) {
      res.status(400).json({ error: 'Collaboration is not enabled for this assignment' });
      return;
    }

    // Check collaborator limit
    if (assignment.maxCollaborators && submission.collaborators.length >= assignment.maxCollaborators) {
      res.status(400).json({ error: 'Maximum number of collaborators reached' });
      return;
    }

    // Check if user is already a collaborator
    if (submission.collaborators.some((collab: any) => collab.toString() === collaboratorId)) {
      res.status(400).json({ error: 'User is already a collaborator' });
      return;
    }

    submission.collaborators.push(new Types.ObjectId(collaboratorId));
    submission.collaboration.isCollaborative = true;

    // Add to contributor stats
    submission.analytics.collaborationMetrics.contributorStats.push({
      user: new Types.ObjectId(collaboratorId),
      wordsContributed: 0,
      editsCount: 0,
      commentsCount: 0
    });

    await submission.save();

    const updatedSubmission = await AssignmentSubmission.findById(submissionId)
      .populate('collaborators', 'firstName lastName email');

    res.json({
      message: 'Collaborator added successfully',
      data: updatedSubmission
    });
  } catch (error) {
    console.error('Error adding collaborator:', error);
    res.status(500).json({ error: 'Failed to add collaborator' });
  }
});

// Submit for grading
router.patch('/:submissionId/submit', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { submissionId } = req.params;
    const userId = req.userId!;

    const submission = await AssignmentSubmission.findById(submissionId)
      .populate('assignment', 'dueDate versionControl');

    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    // Check permissions
    const isAuthor = submission.author.toString() === userId;
    const isAdmin = req.user!.role === 'admin';

    if (!isAuthor && !isAdmin) {
      res.status(403).json({ error: 'Only the submission author can submit for grading' });
      return;
    }

    submission.status = 'submitted';
    submission.submittedAt = new Date();

    // Create final version if enabled
    const assignment = submission.assignment as any;
    if (assignment.versionControl.createVersionOnSubmit) {
      const latestVersion = await DocumentVersion.getLatestVersion(submissionId);
      
      const finalVersion = new DocumentVersion({
        document: submissionId,
        version: latestVersion + 1,
        content: submission.content,
        title: submission.title,
        changes: {
          type: 'manual',
          description: 'Final submission for grading',
          addedChars: 0,
          deletedChars: 0,
          addedWords: 0,
          deletedWords: 0
        },
        author: userId,
        metadata: {
          wordCount: submission.wordCount,
          characterCount: submission.characterCount,
          readingTime: submission.estimatedReadingTime
        }
      });

      await finalVersion.save();
      submission.currentVersion = latestVersion + 1;

      // Add final milestone
      submission.majorMilestones.push({
        version: latestVersion + 1,
        timestamp: new Date(),
        description: 'Final submission for grading',
        wordCount: submission.wordCount,
        author: new Types.ObjectId(userId)
      });
    }

    await submission.save();

    res.json({
      message: 'Submission submitted for grading successfully',
      data: submission
    });
  } catch (error) {
    console.error('Error submitting for grading:', error);
    res.status(500).json({ error: 'Failed to submit for grading' });
  }
});

// Get submission versions
router.get('/:submissionId/versions', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { submissionId } = req.params;
    const { limit } = req.query;
    const userId = req.userId!;

    // Verify submission exists and user has access
    const submission = await AssignmentSubmission.findById(submissionId);
    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    // Check permissions
    const canAccess = submission.author.toString() === userId ||
                     submission.collaborators.some(c => c.toString() === userId);

    if (!canAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Get versions from DocumentVersion collection
    const query = DocumentVersion.find({ document: submissionId })
      .sort({ version: -1 })
      .populate('author', 'firstName lastName email');

    if (limit) {
      query.limit(parseInt(limit as string));
    }

    const versions = await query.exec();

    res.json({
      message: 'Submission versions retrieved successfully',
      data: versions
    });
  } catch (error) {
    console.error('Error getting submission versions:', error);
    res.status(500).json({ error: 'Failed to get submission versions' });
  }
});

export default router;