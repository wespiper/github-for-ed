import express, { Request, Response } from 'express';
import prisma from '../lib/prisma';
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

    const where: any = { recipientId: userId };
    
    if (status) where.status = status;
    if (type) where.type = type;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (unreadOnly === 'true') where.readAt = null;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: (Number(page) - 1) * Number(limit),
        include: {
          recipient: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          sender: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          recipientId: userId,
          readAt: null,
        },
      }),
    ]);

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

    const notification = await prisma.notification.update({
      where: { 
        id: notificationId,
        recipientId: userId,
      },
      data: { readAt: new Date() },
      include: {
        recipient: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        sender: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

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

    await prisma.notification.updateMany({
      where: { 
        recipientId: userId, 
        readAt: null 
      },
      data: { readAt: new Date() }
    });

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

    await prisma.notification.delete({
      where: { 
        id: notificationId,
        recipientId: userId,
      },
    });

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

    // Get current intervention data and update it
    const currentNotification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        recipientId: userId,
        category: 'educational_intervention',
      },
    });

    if (!currentNotification) {
      res.status(404).json({ error: 'Intervention notification not found' });
      return;
    }

    const updatedIntervention = {
      ...(currentNotification.intervention as any || {}),
      resolvedAt: new Date().toISOString(),
      resolution,
      actionsTaken,
    };

    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { 
        intervention: updatedIntervention,
        status: 'resolved'
      },
      include: {
        recipient: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        sender: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

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

    // Basic UUID validation for PostgreSQL
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(studentId)) {
      res.status(400).json({ error: 'Invalid student ID' });
      return;
    }

    const interventions = await interventionEngine.analyzeStudentWritingProgress(
      studentId, 
      courseId, 
      Number(timeframeDays)
    );

    // Create notifications for interventions
    const notifications: any[] = [];
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
      notifications: notifications.map(n => n.id)
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

    // Basic UUID validation for PostgreSQL
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(courseId)) {
      res.status(400).json({ error: 'Invalid course ID' });
      return;
    }

    const interventions = await interventionEngine.runCourseInterventionAnalysis(courseId);

    // Create notifications for interventions
    const notifications: any[] = [];
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
      notifications: notifications.map(n => n.id)
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
      prisma.notification.count({ 
        where: { recipientId: userId } 
      }),
      
      // Unread notifications
      prisma.notification.count({ 
        where: { 
          recipientId: userId, 
          readAt: null 
        } 
      }),
      
      // Recent notifications
      prisma.notification.count({ 
        where: { 
          recipientId: userId, 
          createdAt: { gte: startDate } 
        } 
      }),
      
      // By priority
      prisma.notification.groupBy({
        by: ['priority'],
        where: { recipientId: userId },
        _count: { priority: true }
      }),
      
      // By category
      prisma.notification.groupBy({
        by: ['category'],
        where: { recipientId: userId },
        _count: { category: true }
      })
    ]);

    res.json({
      total,
      unread,
      recent,
      breakdown: {
        byPriority: byPriority.reduce((acc: any, item) => {
          acc[item.priority] = item._count.priority;
          return acc;
        }, {}),
        byCategory: byCategory.reduce((acc: any, item) => {
          acc[item.category] = item._count.category;
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
      priority = 'normal',
      title,
      message,
      category = 'general',
      actionRequired = false,
      expiresAt
    } = req.body;

    if (!recipientId || !type || !title || !message) {
      res.status(400).json({ error: 'recipientId, type, title, and message are required' });
      return;
    }

    // Basic UUID validation for PostgreSQL
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(recipientId)) {
      res.status(400).json({ error: 'Invalid recipient ID' });
      return;
    }

    const notification = await prisma.notification.create({
      data: {
        recipientId,
        senderId,
        type,
        priority,
        title,
        message,
        category,
        actionRequired,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        context: {},
      },
      include: {
        recipient: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        sender: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

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