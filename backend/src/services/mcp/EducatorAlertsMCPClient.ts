import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import * as path from 'path';

export interface MCPToolResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface InterventionRecommendation {
  id: string;
  type: string;
  confidence: number;
  rationale: string;
  suggestedActions: Array<{
    actionType: string;
    description: string;
    urgency: string;
    expectedDuration: string;
  }>;
  expectedOutcomes: string[];
  timeframe: string;
  evidenceData: Record<string, any>;
}

export interface EducatorAlert {
  id: string;
  educatorId: string;
  studentId: string;
  assignmentId?: string;
  courseId?: string;
  alertType: string;
  severity: string;
  title: string;
  description: string;
  recommendedActions: Array<{
    type: string;
    title: string;
    description: string;
    priority: string;
    estimatedTime?: string;
  }>;
  status: string;
  createdAt: string;
  deliveryChannels: string[];
  privacyProtected: boolean;
}

export interface InterventionSchedule {
  id: string;
  interventionId: string;
  educatorId: string;
  studentId: string;
  scheduledType: string;
  scheduledFor: string;
  duration: number;
  location?: string;
  virtualMeetingUrl?: string;
  agenda: string[];
  preparationMaterials: string[];
  followUpRequired: boolean;
  status: string;
  remindersSent: string[];
  createdAt: string;
  updatedAt: string;
  privacyProtected: boolean;
}

export interface InterventionEffectiveness {
  id: string;
  interventionId: string;
  measurementType: string;
  metrics: Record<string, number>;
  baselineData: Record<string, any>;
  postInterventionData: Record<string, any>;
  improvementScore: number;
  confidenceLevel: number;
  measurementDate: string;
  notes?: string;
  followUpRecommendations: string[];
  privacyProtected: boolean;
  comparisonPeriod: {
    baseline: { start: string; end: string };
    measurement: { start: string; end: string };
  };
}

/**
 * MCP Client for Educator Alerts and Intervention Management
 * Follows the established MCP client pattern with privacy-aware operations
 */
export class EducatorAlertsMCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private readonly logger = console;
  private connected = false;
  private readonly serverPath: string;

  constructor() {
    // Get MCP server path from environment or use default
    this.serverPath = process.env.MCP_EDUCATOR_ALERTS_PATH || 
      path.join(__dirname, '../../../../mcp-servers/educator-alerts/dist/index.js');
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      this.logger.log('Connecting to Educator Alerts MCP server...');
      
      // Create transport for the educator alerts MCP server
      this.transport = new StdioClientTransport({
        command: 'node',
        args: [this.serverPath, 'mcp']
      });

      // Create and connect client
      this.client = new Client(
        {
          name: 'educator-alerts-backend-client',
          version: '1.0.0'
        },
        {
          capabilities: {
            roots: {
              listChanged: false
            }
          }
        }
      );

      await this.client.connect(this.transport);
      this.connected = true;
      this.logger.log('✅ Connected to Educator Alerts MCP server');

    } catch (error) {
      this.logger.error('❌ Failed to connect to Educator Alerts MCP server:', error);
      this.connected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.transport) {
      await this.client.close();
      this.client = null;
      this.transport = null;
      this.connected = false;
      this.logger.log('Disconnected from Educator Alerts MCP server');
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  private async callTool<T>(toolName: string, args: any): Promise<MCPToolResponse<T>> {
    if (!this.connected || !this.client) {
      await this.connect();
    }

    try {
      this.logger.log(`Calling MCP tool: ${toolName}`);
      
      const result = await this.client!.callTool({
        name: toolName,
        arguments: args
      });

      if ((result as any).content && (result as any).content[0] && (result as any).content[0].type === 'text') {
        const response = JSON.parse((result as any).content[0].text);
        
        if (response.success) {
          this.logger.log(`✅ MCP tool ${toolName} completed successfully`);
          return {
            success: true,
            data: response.data
          };
        } else {
          this.logger.error(`❌ MCP tool ${toolName} failed:`, response.error);
          return {
            success: false,
            error: response.error
          };
        }
      } else {
        throw new Error('Invalid response format from MCP server');
      }

    } catch (error) {
      this.logger.error(`❌ Error calling MCP tool ${toolName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate personalized intervention recommendations
   */
  async generateInterventionRecommendations(
    studentId: string,
    analysisData: {
      cognitiveLoad: number;
      engagementScore: number;
      qualityScore: number;
      reflectionDepth: number;
      timeOnTask?: number;
      strugglingDuration?: number;
    },
    educationalContext: {
      assignmentId?: string;
      courseId?: string;
      learningObjectives?: string[];
      writingStage?: string;
      dueDate?: string;
    },
    privacyContext: {
      requesterId: string;
      requesterType: 'student' | 'educator' | 'admin';
      purpose: string;
      educationalJustification?: string;
    }
  ): Promise<MCPToolResponse<{ recommendations: InterventionRecommendation[] }>> {
    return this.callTool<{ recommendations: InterventionRecommendation[] }>('generate_intervention_recommendations', {
      studentId,
      analysisData,
      educationalContext,
      privacyContext
    });
  }

  /**
   * Send privacy-aware alerts to educators
   */
  async sendEducatorAlerts(
    alerts: Array<{
      educatorId: string;
      studentId: string;
      assignmentId?: string;
      courseId?: string;
      alertType: string;
      severity: string;
      title: string;
      description: string;
      recommendedActions?: Array<{
        type: string;
        title: string;
        description: string;
        priority: string;
        estimatedTime?: string;
      }>;
      triggerData?: Record<string, any>;
    }>,
    deliveryOptions: {
      immediate?: boolean;
      channels?: string[];
      batchWithOthers?: boolean;
      respectQuietHours?: boolean;
    },
    privacyContext: {
      requesterId: string;
      requesterType: 'student' | 'educator' | 'admin';
      purpose: string;
      educationalJustification?: string;
    }
  ): Promise<MCPToolResponse<{
    sent: EducatorAlert[];
    queued: EducatorAlert[];
    failed: Array<{ alert: any; reason: string }>;
    summary: {
      totalAlerts: number;
      sentCount: number;
      queuedCount: number;
      failedCount: number;
    };
  }>> {
    return this.callTool('send_educator_alerts', {
      alerts,
      deliveryOptions,
      privacyContext
    });
  }

  /**
   * Schedule intervention actions with calendar integration
   */
  async scheduleInterventionActions(
    interventionId: string,
    scheduleData: {
      educatorId: string;
      studentId: string;
      scheduledType: 'meeting' | 'check_in' | 'feedback_session' | 'support_call' | 'progress_review';
      scheduledFor: string; // ISO date string
      duration: number; // minutes
      location?: string;
      virtualMeetingUrl?: string;
      agenda?: string[];
      preparationMaterials?: string[];
      followUpRequired?: boolean;
    },
    reminderSettings: {
      sendReminders?: boolean;
      reminderTimes?: string[]; // e.g., ["24h", "1h", "15m"]
      includePreparation?: boolean;
      channels?: string[];
    },
    privacyContext: {
      requesterId: string;
      requesterType: 'student' | 'educator' | 'admin';
      purpose: string;
      educationalJustification?: string;
    }
  ): Promise<MCPToolResponse<{
    schedule: InterventionSchedule;
    reminders: Array<{
      id: string;
      scheduledFor: string;
      type: string;
      channels: string[];
      includePreparation: boolean;
      status: string;
    }>;
  }>> {
    return this.callTool('schedule_intervention_actions', {
      interventionId,
      scheduleData,
      reminderSettings,
      privacyContext
    });
  }

  /**
   * Track and measure intervention effectiveness
   */
  async trackInterventionEffectiveness(
    interventionId: string,
    measurementData: {
      measurementType: 'pre_post' | 'longitudinal' | 'immediate' | 'delayed';
      metrics: {
        engagementScore?: number;
        qualityScore?: number;
        progressRate?: number;
        reflectionDepth?: number;
        cognitiveLoad?: number;
        timeEfficiency?: number;
      };
      baselineData: Record<string, any>;
      postInterventionData: Record<string, any>;
      confidenceLevel: number; // 0-1
      notes?: string;
      followUpRecommendations?: string[];
    },
    comparisonPeriod: {
      baseline: { start: string; end: string };
      measurement: { start: string; end: string };
    },
    privacyContext: {
      requesterId: string;
      requesterType: 'student' | 'educator' | 'admin';
      purpose: string;
      educationalJustification?: string;
    }
  ): Promise<MCPToolResponse<{
    effectiveness: InterventionEffectiveness;
    analysis: {
      improvements: Record<string, number>;
      overallImprovement: number;
      statisticalSignificance: string;
      metricCount: number;
    };
    insights: string[];
    recommendations: string[];
  }>> {
    return this.callTool('track_intervention_effectiveness', {
      interventionId,
      measurementData,
      comparisonPeriod,
      privacyContext
    });
  }

  /**
   * Check server health and connection status
   */
  async healthCheck(): Promise<{
    connected: boolean;
    serverVersion?: string;
    toolsAvailable?: number;
    responseTime?: number;
  }> {
    const startTime = Date.now();
    
    try {
      if (!this.connected) {
        await this.connect();
      }

      // Test connection by listing available tools
      const tools = await this.client!.listTools();
      const responseTime = Date.now() - startTime;

      return {
        connected: true,
        toolsAvailable: tools.tools?.length || 0,
        responseTime
      };

    } catch (error) {
      return {
        connected: false
      };
    }
  }
}