import express, { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Notification, INotification } from '../models/Notification';
import { InterventionEngine, InterventionAlert } from '../services/InterventionEngine';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = express.Router();
const interventionEngine = new InterventionEngine();

// Get notifications for the authenticated user
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { 
      page = 1, 
      limit = 20, 
      status, 
      type, 
      priority,
      category,
      unreadOnly 
    } = req.query;

    const filter: any = { recipient: userId };
    
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (unreadOnly === 'true') filter.readAt = { $exists: false };

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .populate('relatedMetrics.student', 'firstName lastName email')
      .populate('context.course', 'title')
      .populate('context.assignment', 'title');

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      readAt: { $exists: false }
    });

    res.json({
      notifications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      },
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const notificationId = req.params.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    res.json({ 
      message: 'Notification marked as read',
      notification 
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark all notifications as read
router.patch('/read-all', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    await Notification.updateMany(
      { recipient: userId, readAt: { $exists: false } },
      { readAt: new Date() }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete notification
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const notificationId = req.params.id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark intervention as resolved (educators only)
router.patch('/:id/resolve', authenticate, requireRole(['educator']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const notificationId = req.params.id;
    const { resolution, actionsTaken } = req.body;

    if (!resolution) {
      res.status(400).json({ error: 'Resolution description is required' });
      return;
    }

    const notification = await Notification.findOneAndUpdate(
      { 
        _id: notificationId, 
        recipient: userId,
        category: 'educational_intervention'
      },
      { 
        'intervention.resolvedAt': new Date(),
        'intervention.resolution': resolution,
        'intervention.actionsTaken': actionsTaken,
        status: 'resolved'
      },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ error: 'Intervention notification not found' });
      return;
    }

    res.json({ 
      message: 'Intervention marked as resolved',
      notification 
    });
  } catch (error) {
    console.error('Resolve intervention error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Run intervention analysis for a student (educators only)
router.post('/interventions/analyze/:studentId', authenticate, requireRole(['educator']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const instructorId = req.userId!;
    const { studentId } = req.params;
    const { courseId, timeframeDays = 7 } = req.body;

    if (!Types.ObjectId.isValid(studentId)) {
      res.status(400).json({ error: 'Invalid student ID' });
      return;
    }

    const interventions = await interventionEngine.analyzeStudentWritingProgress(
      studentId, 
      courseId, 
      Number(timeframeDays)
    );

    // Create notifications for interventions
    const notifications: INotification[] = [];
    for (const intervention of interventions) {
      const notification = await interventionEngine.createInterventionNotification(
        intervention, 
        instructorId
      );
      notifications.push(notification);
    }

    res.json({
      message: `Found ${interventions.length} intervention alerts`,
      interventions,
      notifications: notifications.map(n => n._id)
    });
  } catch (error) {
    console.error('Intervention analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Run intervention analysis for entire course (educators only)
router.post('/interventions/analyze-course/:courseId', authenticate, requireRole(['educator']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const instructorId = req.userId!;
    const { courseId } = req.params;

    if (!Types.ObjectId.isValid(courseId)) {
      res.status(400).json({ error: 'Invalid course ID' });
      return;
    }

    const interventions = await interventionEngine.runCourseInterventionAnalysis(courseId);

    // Create notifications for interventions
    const notifications: INotification[] = [];
    for (const intervention of interventions) {
      const notification = await interventionEngine.createInterventionNotification(
        intervention, 
        instructorId
      );
      notifications.push(notification);
    }

    res.json({
      message: `Analyzed course and found ${interventions.length} intervention alerts`,
      interventions,
      notifications: notifications.map(n => n._id)
    });
  } catch (error) {
    console.error('Course intervention analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get intervention summary for educator dashboard
router.get('/interventions/summary', authenticate, requireRole(['educator']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const instructorId = req.userId!;
    const { courseId } = req.query;

    const summary = await interventionEngine.getInterventionSummary(
      instructorId, 
      courseId as string
    );

    res.json(summary);
  } catch (error) {
    console.error('Intervention summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get notification statistics
router.get('/stats', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { days = 30 } = req.query;
    
    const startDate = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

    const [total, unread, recent, byPriority, byCategory] = await Promise.all([
      // Total notifications
      Notification.countDocuments({ recipient: userId }),
      
      // Unread notifications
      Notification.countDocuments({ 
        recipient: userId, 
        readAt: { $exists: false } 
      }),
      
      // Recent notifications
      Notification.countDocuments({ 
        recipient: userId, 
        createdAt: { $gte: startDate } 
      }),
      
      // By priority
      Notification.aggregate([
        { $match: { recipient: new Types.ObjectId(userId) } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      
      // By category
      Notification.aggregate([
        { $match: { recipient: new Types.ObjectId(userId) } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      total,
      unread,
      recent,
      breakdown: {
        byPriority: byPriority.reduce((acc: any, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byCategory: byCategory.reduce((acc: any, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Notification stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create manual notification (educators only - for testing or manual alerts)
router.post('/', authenticate, requireRole(['educator']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const senderId = req.userId!;
    const {
      recipientId,
      type,
      priority = 'medium',
      title,
      message,
      category = 'general',
      actionRequired = false,
      actionUrl
    } = req.body;

    if (!recipientId || !type || !title || !message) {
      res.status(400).json({ error: 'recipientId, type, title, and message are required' });
      return;
    }

    if (!Types.ObjectId.isValid(recipientId)) {
      res.status(400).json({ error: 'Invalid recipient ID' });
      return;
    }

    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      type,
      priority,
      title,
      message,
      category,
      actionRequired,
      actionUrl
    });

    await notification.save();

    res.status(201).json({
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;