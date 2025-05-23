import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface AppNotification {
  _id: string;
  recipient: string;
  sender?: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  category: 'general' | 'educational_intervention' | 'assignment_management' | 'collaboration' | 'system';
  status: 'unread' | 'read' | 'resolved';
  readAt?: Date;
  createdAt: Date;
  actionRequired: boolean;
  actionUrl?: string;
  context?: {
    course?: string;
    assignment?: string;
    submission?: string;
  };
  intervention?: {
    type: string;
    severity: 'info' | 'warning' | 'critical';
    suggestedActions: string[];
    deadline: Date;
    resolvedAt?: Date;
    resolution?: string;
    actionsTaken?: string[];
  };
  relatedMetrics?: {
    student: string;
    metricType: string;
    currentValue: number;
    previousValue?: number;
    threshold?: number;
    trend: 'improving' | 'declining' | 'stable';
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  recent: number;
  breakdown: {
    byPriority: Record<string, number>;
    byCategory: Record<string, number>;
  };
}

export interface InterventionSummary {
  totalInterventions: number;
  criticalInterventions: number;
  commonIssues: { type: string; count: number }[];
  studentsAtRisk: number;
  recentTrends: { improving: number; declining: number; stable: number };
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const fetchNotifications = useCallback(async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    priority?: string;
    category?: string;
    unreadOnly?: boolean;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/notifications', { params });
      const { notifications: notifs, pagination: pag, unreadCount: count } = response.data;
      
      setNotifications(notifs);
      setPagination(pag);
      setUnreadCount(count);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, status: 'read' as const, readAt: new Date() }
            : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to mark notification as read');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch('/notifications/read-all');
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, status: 'read' as const, readAt: new Date() }))
      );
      
      setUnreadCount(0);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to mark all notifications as read');
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      
      // Update unread count if deleted notification was unread
      const deletedNotif = notifications.find(n => n._id === notificationId);
      if (deletedNotif && deletedNotif.status === 'unread') {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete notification');
    }
  }, [notifications]);

  const resolveIntervention = useCallback(async (notificationId: string, resolution: string, actionsTaken?: string[]) => {
    try {
      await api.patch(`/notifications/${notificationId}/resolve`, {
        resolution,
        actionsTaken
      });
      
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { 
                ...notif, 
                status: 'resolved' as const,
                intervention: {
                  ...notif.intervention!,
                  resolvedAt: new Date(),
                  resolution,
                  actionsTaken
                }
              }
            : notif
        )
      );
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resolve intervention');
    }
  }, []);

  const fetchStats = useCallback(async (days = 30): Promise<NotificationStats | null> => {
    try {
      const response = await api.get('/notifications/stats', { params: { days } });
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch notification stats');
      return null;
    }
  }, []);

  const fetchInterventionSummary = useCallback(async (courseId?: string): Promise<InterventionSummary | null> => {
    try {
      const response = await api.get('/notifications/interventions/summary', { 
        params: courseId ? { courseId } : undefined 
      });
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch intervention summary');
      return null;
    }
  }, []);

  const analyzeStudent = useCallback(async (studentId: string, courseId?: string, timeframeDays = 7) => {
    try {
      const response = await api.post(`/notifications/interventions/analyze/${studentId}`, {
        courseId,
        timeframeDays
      });
      
      // Refresh notifications to show new interventions
      await fetchNotifications();
      
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to analyze student');
      return null;
    }
  }, [fetchNotifications]);

  const analyzeCourse = useCallback(async (courseId: string) => {
    try {
      const response = await api.post(`/notifications/interventions/analyze-course/${courseId}`);
      
      // Refresh notifications to show new interventions
      await fetchNotifications();
      
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to analyze course');
      return null;
    }
  }, [fetchNotifications]);

  const createNotification = useCallback(async (notificationData: {
    recipientId: string;
    type: string;
    priority?: string;
    title: string;
    message: string;
    category?: string;
    actionRequired?: boolean;
    actionUrl?: string;
  }) => {
    try {
      const response = await api.post('/notifications', notificationData);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create notification');
      return null;
    }
  }, []);

  // Auto-refresh notifications periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchNotifications({ page: 1, limit: pagination.limit });
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [fetchNotifications, loading, pagination.limit]);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    pagination,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    resolveIntervention,
    fetchStats,
    fetchInterventionSummary,
    analyzeStudent,
    analyzeCourse,
    createNotification,
    clearError: () => setError(null)
  };
};