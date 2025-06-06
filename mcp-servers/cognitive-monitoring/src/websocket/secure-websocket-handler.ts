import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, WebSocket } from 'ws';
import { ConsentManagerService } from '../privacy/consent-manager.service';
import { PrivacyMonitorService } from '../privacy/privacy-monitor.service';
import { EphemeralBufferService } from '../data/ephemeral-buffer.service';
import { PrivacyContext, CognitiveEvent } from '../privacy/privacy.types';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({ 
  port: 3003,
  transports: ['websocket'],
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5001',
    credentials: true
  }
})
export class SecureWebSocketHandler implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SecureWebSocketHandler.name);
  private readonly connections = new Map<string, {
    socket: WebSocket;
    sessionId: string;
    privacyContext: PrivacyContext;
    lastActivity: number;
    consentValidated: boolean;
  }>();

  constructor(
    private readonly consentManager: ConsentManagerService,
    private readonly privacyMonitor: PrivacyMonitorService,
    private readonly bufferService: EphemeralBufferService,
  ) {}

  async handleConnection(client: WebSocket, ...args: any[]) {
    try {
      // Extract authentication token from connection
      const token = this.extractAuthToken(client);
      
      if (!token) {
        client.close(1008, 'Authentication required');
        return;
      }

      // Verify JWT token and extract user context
      const userContext = await this.verifyAuthToken(token);
      
      if (!userContext) {
        client.close(1008, 'Invalid authentication');
        return;
      }

      // Create privacy context
      const privacyContext: PrivacyContext = {
        studentId: userContext.studentId,
        requesterRole: userContext.role,
        purpose: 'cognitive_assessment',
        consentLevel: 'basic', // Will be validated shortly
        sessionId: userContext.sessionId,
        timestamp: new Date()
      };

      // Validate consent before establishing connection
      const hasConsent = await this.consentManager.validateConsent(privacyContext);
      
      if (!hasConsent) {
        client.close(1008, 'Consent required for cognitive monitoring');
        return;
      }

      // Register connection
      const connectionId = this.generateConnectionId();
      this.connections.set(connectionId, {
        socket: client,
        sessionId: userContext.sessionId,
        privacyContext,
        lastActivity: Date.now(),
        consentValidated: true
      });

      // Create ephemeral buffer for this session
      this.bufferService.createCognitiveEventBuffer(userContext.sessionId);

      // Send connection confirmation with privacy notice
      this.sendMessage(client, 'connection_established', {
        connectionId,
        privacyNotice: 'Your cognitive monitoring session is privacy-protected with ephemeral data processing',
        consentValidated: true,
        dataRetention: 'session_only',
        anonymizationLevel: 'high'
      });

      this.logger.log(`Secure connection established: ${connectionId} (session: ${userContext.sessionId.substring(0, 8)}...)`);

    } catch (error) {
      this.logger.error('Error handling WebSocket connection:', error);
      client.close(1011, 'Internal server error');
    }
  }

  async handleDisconnect(client: WebSocket) {
    try {
      // Find and clean up connection
      const connectionEntry = Array.from(this.connections.entries())
        .find(([, conn]) => conn.socket === client);

      if (connectionEntry) {
        const [connectionId, connection] = connectionEntry;
        
        // Clean up ephemeral data
        this.bufferService.destroyBuffer(connection.sessionId);
        
        // Remove connection
        this.connections.delete(connectionId);
        
        this.logger.log(`Connection closed and data cleaned: ${connectionId}`);
      }

    } catch (error) {
      this.logger.error('Error handling disconnect:', error);
    }
  }

  @SubscribeMessage('cognitive_events')
  async handleCognitiveEvents(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() data: { events: CognitiveEvent[]; sessionId: string }
  ) {
    try {
      const connection = this.getConnectionBySocket(client);
      
      if (!connection) {
        this.sendError(client, 'No active connection found');
        return;
      }

      // Update activity timestamp
      connection.lastActivity = Date.now();

      // Validate privacy context
      const violations = await this.privacyMonitor.detectViolations(
        'cognitive_events_processing',
        data,
        connection.privacyContext
      );

      if (violations.length > 0) {
        this.sendError(client, 'Privacy violation detected - processing halted');
        this.logger.warn(`Privacy violations detected for connection ${this.getConnectionId(client)}: ${violations.length} violations`);
        return;
      }

      // Process events through ephemeral buffer
      const insights = await this.bufferService.processCognitiveEvents(
        connection.sessionId,
        data.events
      );

      // Send privacy-safe insights back to client
      this.sendMessage(client, 'cognitive_insights', {
        insights,
        privacyProtected: true,
        processingTimestamp: new Date().toISOString(),
        sessionId: connection.sessionId
      });

    } catch (error) {
      this.logger.error('Error processing cognitive events:', error);
      this.sendError(client, 'Processing error - data not retained');
    }
  }

  @SubscribeMessage('consent_update')
  async handleConsentUpdate(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() data: { consentPreferences: any }
  ) {
    try {
      const connection = this.getConnectionBySocket(client);
      
      if (!connection) {
        this.sendError(client, 'No active connection found');
        return;
      }

      // Update consent preferences
      const updated = await this.consentManager.updateConsentPreferences(
        connection.privacyContext.studentId,
        data.consentPreferences,
        connection.privacyContext
      );

      if (updated) {
        // Update connection consent status
        connection.consentValidated = true;
        connection.lastActivity = Date.now();
        
        this.sendMessage(client, 'consent_updated', {
          success: true,
          updatedAt: new Date().toISOString(),
          privacyLevel: this.determinePrivacyLevel(data.consentPreferences)
        });
      } else {
        this.sendError(client, 'Failed to update consent preferences');
      }

    } catch (error) {
      this.logger.error('Error updating consent:', error);
      this.sendError(client, 'Consent update failed');
    }
  }

  @SubscribeMessage('session_status')
  async handleSessionStatus(@ConnectedSocket() client: WebSocket) {
    try {
      const connection = this.getConnectionBySocket(client);
      
      if (!connection) {
        this.sendError(client, 'No active connection found');
        return;
      }

      const bufferStats = this.bufferService.getBufferStatistics();
      
      this.sendMessage(client, 'session_status', {
        sessionActive: true,
        sessionId: connection.sessionId,
        consentValidated: connection.consentValidated,
        lastActivity: connection.lastActivity,
        bufferActive: bufferStats.totalBuffers > 0,
        privacyCompliant: true,
        dataRetention: 'ephemeral_only'
      });

    } catch (error) {
      this.logger.error('Error getting session status:', error);
      this.sendError(client, 'Status unavailable');
    }
  }

  // Periodic cleanup of inactive connections
  startPeriodicCleanup() {
    setInterval(() => {
      this.cleanupInactiveConnections();
    }, 60000); // Check every minute
  }

  private extractAuthToken(client: WebSocket): string | null {
    try {
      // Extract token from headers or URL parameters
      const url = (client as any).upgradeReq?.url || '';
      const tokenMatch = url.match(/[?&]token=([^&]+)/);
      
      if (tokenMatch) {
        return decodeURIComponent(tokenMatch[1]);
      }

      // Try authorization header
      const headers = (client as any).upgradeReq?.headers || {};
      const authHeader = headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }

      return null;
    } catch (error) {
      this.logger.error('Error extracting auth token:', error);
      return null;
    }
  }

  private async verifyAuthToken(token: string): Promise<any> {
    try {
      // In production, use proper JWT verification
      const decoded = jwt.decode(token) as any;
      
      if (!decoded || !decoded.studentId || !decoded.sessionId) {
        return null;
      }

      return {
        studentId: decoded.studentId,
        sessionId: decoded.sessionId,
        role: decoded.role || 'student'
      };
    } catch (error) {
      this.logger.error('Error verifying auth token:', error);
      return null;
    }
  }

  private generateConnectionId(): string {
    return 'conn_' + Math.random().toString(36).substring(2, 15);
  }

  private sendMessage(client: WebSocket, type: string, data: any) {
    try {
      const message = JSON.stringify({
        type,
        data,
        timestamp: new Date().toISOString(),
        privacyProtected: true
      });

      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    } catch (error) {
      this.logger.error('Error sending message:', error);
    }
  }

  private sendError(client: WebSocket, message: string) {
    this.sendMessage(client, 'error', {
      message,
      privacySafe: true,
      timestamp: new Date().toISOString()
    });
  }

  private getConnectionBySocket(client: WebSocket) {
    return Array.from(this.connections.values())
      .find(conn => conn.socket === client);
  }

  private getConnectionId(client: WebSocket): string | null {
    const entry = Array.from(this.connections.entries())
      .find(([, conn]) => conn.socket === client);
    
    return entry ? entry[0] : null;
  }

  private determinePrivacyLevel(preferences: any): string {
    if (preferences.cognitiveMonitoring && preferences.behavioralAnalytics) {
      return 'enhanced';
    } else if (preferences.cognitiveMonitoring || preferences.behavioralAnalytics) {
      return 'standard';
    }
    return 'basic';
  }

  private cleanupInactiveConnections() {
    const now = Date.now();
    const inactivityThreshold = 30 * 60 * 1000; // 30 minutes

    const inactiveConnections = Array.from(this.connections.entries())
      .filter(([, conn]) => now - conn.lastActivity > inactivityThreshold);

    inactiveConnections.forEach(([connectionId, connection]) => {
      this.logger.log(`Cleaning up inactive connection: ${connectionId}`);
      
      // Clean up buffer
      this.bufferService.destroyBuffer(connection.sessionId);
      
      // Close socket
      if (connection.socket.readyState === WebSocket.OPEN) {
        connection.socket.close(1000, 'Session expired due to inactivity');
      }
      
      // Remove from connections
      this.connections.delete(connectionId);
    });

    if (inactiveConnections.length > 0) {
      this.logger.log(`Cleaned up ${inactiveConnections.length} inactive connections`);
    }
  }
}