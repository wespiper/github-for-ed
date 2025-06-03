/**
 * Notification Service for managing educator alerts and notifications
 */

import { Injectable } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { Logger } from '../utils/logger';

export interface NotificationPreferences {
  educatorId: string;
  channels: ('in_app' | 'email' | 'sms' | 'slack')[];
  quietHours: {
    start: string; // HH:MM format
    end: string; // HH:MM format
    timezone: string;
  };
  alertTypes: string[];
  minimumSeverity: 'low' | 'medium' | 'high' | 'critical' | 'urgent';
  batchAlerts: boolean;
  immediateTypes: string[];
}

export interface ScheduledNotification {
  id: string;
  educatorId: string;
  scheduledFor: Date;
  notification: any;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  retryCount: number;
  maxRetries: number;
}

@Injectable()
export class NotificationService {
  private logger = new Logger('NotificationService');
  private preferences: Map<string, NotificationPreferences> = new Map();
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();
  private notificationQueue: any[] = [];
  private batchProcessor: NodeJS.Timeout | null = null;

  constructor(private notificationGateway: NotificationGateway) {
    this.startBatchProcessor();
  }

  /**
   * Send immediate notification to educator
   */
  async sendImmediate(educatorId: string, notification: any): Promise<boolean> {
    try {
      const prefs = this.getEducatorPreferences(educatorId);
      
      // Check if notification should be sent immediately
      if (!this.shouldSendImmediate(notification, prefs)) {
        // Queue for batch processing
        this.queueNotification(educatorId, notification);
        return true;
      }

      // Send via WebSocket
      const sent = await this.notificationGateway.sendToEducator(educatorId, notification);
      
      if (sent) {
        this.logger.info(`Immediate notification sent to educator ${educatorId}`);
        
        // Also send via other configured channels if needed
        await this.sendViaOtherChannels(educatorId, notification, prefs);
      }
      
      return sent;
    } catch (error) {
      this.logger.error(`Failed to send immediate notification to educator ${educatorId}:`, error);
      return false;
    }
  }

  /**
   * Send urgent alert (bypasses all preferences and quiet hours)
   */
  async sendUrgentAlert(educatorId: string, alert: any): Promise<boolean> {
    try {
      const sent = await this.notificationGateway.sendUrgentAlert(educatorId, alert);
      
      if (sent) {
        this.logger.info(`Urgent alert sent to educator ${educatorId}`);
        
        // Send via all available channels for urgent alerts
        const prefs = this.getEducatorPreferences(educatorId);
        await this.sendViaAllChannels(educatorId, alert, prefs);
      }
      
      return sent;
    } catch (error) {
      this.logger.error(`Failed to send urgent alert to educator ${educatorId}:`, error);
      return false;
    }
  }

  /**
   * Queue notification for batch processing
   */
  queueNotification(educatorId: string, notification: any): void {
    this.notificationQueue.push({
      educatorId,
      notification,
      queuedAt: new Date()
    });
    
    this.logger.debug(`Notification queued for educator ${educatorId}`);
  }

  /**
   * Schedule notification for future delivery
   */
  scheduleNotification(
    educatorId: string, 
    notification: any, 
    scheduledFor: Date,
    options: { maxRetries?: number } = {}
  ): string {
    const id = `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const scheduled: ScheduledNotification = {
      id,
      educatorId,
      scheduledFor,
      notification,
      status: 'pending',
      retryCount: 0,
      maxRetries: options.maxRetries || 3
    };
    
    this.scheduledNotifications.set(id, scheduled);
    
    // Set timeout for delivery
    const delay = scheduledFor.getTime() - Date.now();
    if (delay > 0) {
      setTimeout(() => {
        this.processScheduledNotification(id);
      }, delay);
    } else {
      // Should be sent immediately
      this.processScheduledNotification(id);
    }
    
    this.logger.info(`Notification scheduled for educator ${educatorId} at ${scheduledFor.toISOString()}`);
    return id;
  }

  /**
   * Cancel scheduled notification
   */
  cancelScheduledNotification(notificationId: string): boolean {
    const scheduled = this.scheduledNotifications.get(notificationId);
    
    if (scheduled && scheduled.status === 'pending') {
      scheduled.status = 'cancelled';
      this.scheduledNotifications.set(notificationId, scheduled);
      this.logger.info(`Cancelled scheduled notification ${notificationId}`);
      return true;
    }
    
    return false;
  }

  /**
   * Update educator notification preferences
   */
  updateEducatorPreferences(educatorId: string, preferences: Partial<NotificationPreferences>): void {
    const existing = this.preferences.get(educatorId) || this.getDefaultPreferences(educatorId);
    const updated = { ...existing, ...preferences };
    
    this.preferences.set(educatorId, updated);
    this.logger.info(`Updated notification preferences for educator ${educatorId}`);
  }

  /**
   * Get educator notification preferences
   */
  getEducatorPreferences(educatorId: string): NotificationPreferences {
    return this.preferences.get(educatorId) || this.getDefaultPreferences(educatorId);
  }

  /**
   * Get notification statistics
   */
  getNotificationStats() {
    const queuedCount = this.notificationQueue.length;
    const scheduledCount = Array.from(this.scheduledNotifications.values())
      .filter(n => n.status === 'pending').length;
    const failedCount = Array.from(this.scheduledNotifications.values())
      .filter(n => n.status === 'failed').length;
    
    return {
      queuedNotifications: queuedCount,
      scheduledNotifications: scheduledCount,
      failedNotifications: failedCount,
      connectionStats: this.notificationGateway.getConnectionStats(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check if educator is online
   */
  isEducatorOnline(educatorId: string): boolean {
    return this.notificationGateway.isEducatorOnline(educatorId);
  }

  // Private methods

  private shouldSendImmediate(notification: any, prefs: NotificationPreferences): boolean {
    // Always send urgent and critical immediately
    if (notification.severity === 'urgent' || notification.severity === 'critical') {
      return true;
    }
    
    // Check if alert type is in immediate types
    if (prefs.immediateTypes.includes(notification.type)) {
      return true;
    }
    
    // Check minimum severity threshold
    const severityOrder = { 'low': 0, 'medium': 1, 'high': 2, 'critical': 3, 'urgent': 4 };
    if (severityOrder[notification.severity] < severityOrder[prefs.minimumSeverity]) {
      return false;
    }
    
    // Check quiet hours
    if (this.isQuietHours(prefs)) {
      return notification.severity === 'urgent' || notification.severity === 'critical';
    }
    
    // Check if batching is enabled
    if (prefs.batchAlerts && notification.severity !== 'high') {
      return false;
    }
    
    return true;
  }

  private isQuietHours(prefs: NotificationPreferences): boolean {
    const now = new Date();
    const currentTime = now.toTimeString().substr(0, 5); // HH:MM format
    
    // Simple time comparison (doesn't handle timezone conversion)
    const start = prefs.quietHours.start;
    const end = prefs.quietHours.end;
    
    if (start <= end) {
      // Same day quiet hours (e.g., 22:00 to 07:00 next day)
      return currentTime >= start && currentTime <= end;
    } else {
      // Overnight quiet hours (e.g., 22:00 to 07:00 next day)
      return currentTime >= start || currentTime <= end;
    }
  }

  private async sendViaOtherChannels(
    educatorId: string, 
    notification: any, 
    prefs: NotificationPreferences
  ): Promise<void> {
    for (const channel of prefs.channels) {
      if (channel !== 'in_app') {
        await this.sendViaChannel(educatorId, notification, channel);
      }
    }
  }

  private async sendViaAllChannels(
    educatorId: string, 
    notification: any, 
    prefs: NotificationPreferences
  ): Promise<void> {
    for (const channel of prefs.channels) {
      await this.sendViaChannel(educatorId, notification, channel);
    }
  }

  private async sendViaChannel(
    educatorId: string, 
    notification: any, 
    channel: string
  ): Promise<void> {
    try {
      switch (channel) {
        case 'email':
          await this.sendEmail(educatorId, notification);
          break;
        case 'sms':
          await this.sendSMS(educatorId, notification);
          break;
        case 'slack':
          await this.sendSlack(educatorId, notification);
          break;
      }
    } catch (error) {
      this.logger.error(`Failed to send notification via ${channel} to educator ${educatorId}:`, error);
    }
  }

  private async sendEmail(educatorId: string, notification: any): Promise<void> {
    // Mock email implementation
    this.logger.info(`[MOCK] Sending email notification to educator ${educatorId}`);
  }

  private async sendSMS(educatorId: string, notification: any): Promise<void> {
    // Mock SMS implementation  
    this.logger.info(`[MOCK] Sending SMS notification to educator ${educatorId}`);
  }

  private async sendSlack(educatorId: string, notification: any): Promise<void> {
    // Mock Slack implementation
    this.logger.info(`[MOCK] Sending Slack notification to educator ${educatorId}`);
  }

  private async processScheduledNotification(notificationId: string): Promise<void> {
    const scheduled = this.scheduledNotifications.get(notificationId);
    
    if (!scheduled || scheduled.status !== 'pending') {
      return;
    }
    
    try {
      const sent = await this.sendImmediate(scheduled.educatorId, scheduled.notification);
      
      if (sent) {
        scheduled.status = 'sent';
        this.logger.info(`Scheduled notification ${notificationId} sent successfully`);
      } else {
        throw new Error('Failed to send notification');
      }
    } catch (error) {
      scheduled.retryCount++;
      
      if (scheduled.retryCount < scheduled.maxRetries) {
        // Retry after delay
        setTimeout(() => {
          this.processScheduledNotification(notificationId);
        }, 5000 * scheduled.retryCount); // Exponential backoff
        
        this.logger.warn(`Scheduled notification ${notificationId} failed, retrying (${scheduled.retryCount}/${scheduled.maxRetries})`);
      } else {
        scheduled.status = 'failed';
        this.logger.error(`Scheduled notification ${notificationId} failed after ${scheduled.maxRetries} retries`);
      }
    }
    
    this.scheduledNotifications.set(notificationId, scheduled);
  }

  private startBatchProcessor(): void {
    // Process queued notifications every 5 minutes
    this.batchProcessor = setInterval(() => {
      this.processBatchedNotifications();
    }, 5 * 60 * 1000);
  }

  private async processBatchedNotifications(): Promise<void> {
    if (this.notificationQueue.length === 0) {
      return;
    }
    
    this.logger.info(`Processing ${this.notificationQueue.length} batched notifications`);
    
    // Group notifications by educator
    const notificationsByEducator = new Map<string, any[]>();
    
    for (const item of this.notificationQueue) {
      if (!notificationsByEducator.has(item.educatorId)) {
        notificationsByEducator.set(item.educatorId, []);
      }
      notificationsByEducator.get(item.educatorId)!.push(item.notification);
    }
    
    // Send batched notifications
    for (const [educatorId, notifications] of notificationsByEducator.entries()) {
      await this.sendBatchedNotifications(educatorId, notifications);
    }
    
    // Clear the queue
    this.notificationQueue = [];
  }

  private async sendBatchedNotifications(educatorId: string, notifications: any[]): Promise<void> {
    try {
      const batchNotification = {
        type: 'batch',
        title: `${notifications.length} New Alerts`,
        message: `You have ${notifications.length} new notifications`,
        severity: 'medium',
        data: {
          notifications,
          count: notifications.length
        },
        timestamp: new Date().toISOString()
      };
      
      await this.notificationGateway.sendToEducator(educatorId, batchNotification);
      this.logger.info(`Sent batched notifications to educator ${educatorId}: ${notifications.length} items`);
      
    } catch (error) {
      this.logger.error(`Failed to send batched notifications to educator ${educatorId}:`, error);
    }
  }

  private getDefaultPreferences(educatorId: string): NotificationPreferences {
    return {
      educatorId,
      channels: ['in_app', 'email'],
      quietHours: {
        start: '22:00',
        end: '07:00',
        timezone: 'America/New_York'
      },
      alertTypes: ['intervention_needed', 'progress_concern', 'engagement_drop'],
      minimumSeverity: 'medium',
      batchAlerts: true,
      immediateTypes: ['urgent_support', 'academic_integrity']
    };
  }
}