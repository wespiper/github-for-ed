import prisma from '../lib/prisma';

export interface NotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}

export class NotificationService {
  /**
   * Create a notification for a user
   */
  static async createNotification(data: NotificationData): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          recipientId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          priority: data.priority,
          metadata: data.metadata || {},
          isRead: false
        }
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      // Don't throw - notifications shouldn't break main functionality
    }
  }

  /**
   * Send real-time notification (placeholder for WebSocket implementation)
   */
  static async sendRealTime(userId: string, notification: any): Promise<void> {
    // TODO: Implement WebSocket notification
    console.log(`Real-time notification for ${userId}:`, notification);
  }
}