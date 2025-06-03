/**
 * Real-time notification gateway using WebSockets
 * Provides immediate alert delivery to educators
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnection,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '../utils/logger';

interface EducatorConnection {
  socketId: string;
  educatorId: string;
  connectionTime: Date;
  subscriptions: string[];
}

interface NotificationMessage {
  type: 'alert' | 'reminder' | 'intervention_update' | 'system';
  educatorId: string;
  studentId?: string;
  assignmentId?: string;
  courseId?: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'urgent';
  data?: any;
  timestamp: string;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5001'],
    credentials: true
  },
  namespace: '/educator-alerts'
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnection {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('NotificationGateway');
  private connections: Map<string, EducatorConnection> = new Map();
  private educatorSockets: Map<string, string[]> = new Map(); // educatorId -> socketIds

  afterInit(server: Server) {
    this.logger.info('WebSocket server initialized for educator alerts');
  }

  handleConnection(client: Socket) {
    this.logger.info(`Client connected: ${client.id}`);
    
    // Extract educator ID from query or auth token
    const educatorId = this.extractEducatorId(client);
    
    if (educatorId) {
      const connection: EducatorConnection = {
        socketId: client.id,
        educatorId,
        connectionTime: new Date(),
        subscriptions: []
      };
      
      this.connections.set(client.id, connection);
      
      // Track educator sockets
      if (!this.educatorSockets.has(educatorId)) {
        this.educatorSockets.set(educatorId, []);
      }
      this.educatorSockets.get(educatorId)!.push(client.id);
      
      // Send connection confirmation
      client.emit('connected', {
        message: 'Connected to educator alerts system',
        educatorId,
        timestamp: new Date().toISOString()
      });
      
      this.logger.info(`Educator ${educatorId} connected via socket ${client.id}`);
    } else {
      this.logger.warn(`Connection rejected - no valid educator ID for socket ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const connection = this.connections.get(client.id);
    
    if (connection) {
      // Remove from educator sockets
      const educatorSockets = this.educatorSockets.get(connection.educatorId);
      if (educatorSockets) {
        const index = educatorSockets.indexOf(client.id);
        if (index > -1) {
          educatorSockets.splice(index, 1);
        }
        
        // Clean up if no more sockets for this educator
        if (educatorSockets.length === 0) {
          this.educatorSockets.delete(connection.educatorId);
        }
      }
      
      this.connections.delete(client.id);
      this.logger.info(`Educator ${connection.educatorId} disconnected from socket ${client.id}`);
    }
    
    this.logger.info(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe_to_alerts')
  handleSubscribeToAlerts(
    @MessageBody() data: { types: string[]; courses?: string[]; students?: string[] },
    @ConnectedSocket() client: Socket
  ) {
    const connection = this.connections.get(client.id);
    
    if (!connection) {
      client.emit('error', { message: 'Invalid connection' });
      return;
    }
    
    connection.subscriptions = data.types || [];
    this.logger.info(`Educator ${connection.educatorId} subscribed to alert types: ${data.types?.join(', ')}`);
    
    client.emit('subscription_confirmed', {
      types: data.types,
      courses: data.courses,
      students: data.students,
      timestamp: new Date().toISOString()
    });
  }

  @SubscribeMessage('get_connection_status')
  handleGetConnectionStatus(@ConnectedSocket() client: Socket) {
    const connection = this.connections.get(client.id);
    
    if (connection) {
      client.emit('connection_status', {
        educatorId: connection.educatorId,
        connected: true,
        connectionTime: connection.connectionTime,
        subscriptions: connection.subscriptions,
        activeConnections: this.educatorSockets.get(connection.educatorId)?.length || 0
      });
    }
  }

  @SubscribeMessage('test_notification')
  handleTestNotification(@ConnectedSocket() client: Socket) {
    const connection = this.connections.get(client.id);
    
    if (connection) {
      const testNotification: NotificationMessage = {
        type: 'system',
        educatorId: connection.educatorId,
        title: 'Test Notification',
        message: 'This is a test notification from the educator alerts system',
        severity: 'low',
        timestamp: new Date().toISOString()
      };
      
      client.emit('notification', testNotification);
      this.logger.info(`Sent test notification to educator ${connection.educatorId}`);
    }
  }

  // Public methods for sending notifications

  /**
   * Send notification to specific educator
   */
  async sendToEducator(educatorId: string, notification: Omit<NotificationMessage, 'educatorId'>) {
    const socketIds = this.educatorSockets.get(educatorId);
    
    if (!socketIds || socketIds.length === 0) {
      this.logger.warn(`No active connections for educator ${educatorId}`);
      return false;
    }
    
    const fullNotification: NotificationMessage = {
      ...notification,
      educatorId
    };
    
    let sentCount = 0;
    for (const socketId of socketIds) {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit('notification', fullNotification);
        sentCount++;
      }
    }
    
    this.logger.info(`Sent notification to educator ${educatorId} via ${sentCount} connections`);
    return sentCount > 0;
  }

  /**
   * Send urgent alert to educator (bypasses quiet hours)
   */
  async sendUrgentAlert(educatorId: string, alert: Omit<NotificationMessage, 'educatorId' | 'type' | 'severity'>) {
    const urgentAlert: Omit<NotificationMessage, 'educatorId'> = {
      ...alert,
      type: 'alert',
      severity: 'urgent'
    };
    
    const sent = await this.sendToEducator(educatorId, urgentAlert);
    
    if (sent) {
      // Also trigger additional urgent notification methods (e.g., push notification, email)
      await this.triggerUrgentNotificationMethods(educatorId, urgentAlert);
    }
    
    return sent;
  }

  /**
   * Broadcast system notification to all connected educators
   */
  async broadcastSystemNotification(notification: Omit<NotificationMessage, 'educatorId' | 'type'>) {
    const systemNotification: Omit<NotificationMessage, 'educatorId'> = {
      ...notification,
      type: 'system'
    };
    
    let sentCount = 0;
    for (const [educatorId, socketIds] of this.educatorSockets.entries()) {
      const sent = await this.sendToEducator(educatorId, systemNotification);
      if (sent) sentCount++;
    }
    
    this.logger.info(`Broadcast system notification to ${sentCount} educators`);
    return sentCount;
  }

  /**
   * Get connection statistics
   */
  getConnectionStats() {
    const totalConnections = this.connections.size;
    const uniqueEducators = this.educatorSockets.size;
    const connectionsByEducator = Array.from(this.educatorSockets.entries()).map(([educatorId, socketIds]) => ({
      educatorId,
      connectionCount: socketIds.length
    }));
    
    return {
      totalConnections,
      uniqueEducators,
      connectionsByEducator,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check if educator is online
   */
  isEducatorOnline(educatorId: string): boolean {
    return this.educatorSockets.has(educatorId);
  }

  /**
   * Get active educators
   */
  getActiveEducators(): string[] {
    return Array.from(this.educatorSockets.keys());
  }

  // Private helper methods

  private extractEducatorId(client: Socket): string | null {
    // Extract from query parameters
    const educatorId = client.handshake.query.educatorId as string;
    
    if (educatorId) {
      return educatorId;
    }
    
    // Could also extract from JWT token in auth header
    const token = client.handshake.auth?.token;
    if (token) {
      // Parse JWT token to extract educator ID
      // Implementation would depend on your auth system
    }
    
    return null;
  }

  private async triggerUrgentNotificationMethods(educatorId: string, alert: any) {
    // In a real implementation, this would trigger:
    // - Push notifications to mobile devices
    // - SMS alerts if configured
    // - Email notifications
    // - Integration with external notification services (Slack, Teams, etc.)
    
    this.logger.info(`Triggered urgent notification methods for educator ${educatorId}`);
  }
}