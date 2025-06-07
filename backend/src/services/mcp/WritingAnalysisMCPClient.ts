import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Logger } from '@nestjs/common';
import * as path from 'path';

export interface MCPToolResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class WritingAnalysisMCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private readonly logger = new Logger(WritingAnalysisMCPClient.name);
  private connected = false;

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      // Get MCP server path from environment or use default
      const mcpServerPath = process.env.MCP_WRITING_ANALYSIS_PATH || 
        path.join(__dirname, '../../../../mcp-servers/writing-analysis/dist/index.js');

      this.transport = new StdioClientTransport({
        command: 'node',
        args: [mcpServerPath],
      });

      this.client = new Client({
        name: 'scribe-tree-backend',
        version: '1.0.0',
      }, {
        capabilities: {},
      });

      await this.client.connect(this.transport);
      this.connected = true;
      this.logger.log('Connected to Writing Analysis MCP Server');
    } catch (error) {
      this.logger.error('Failed to connect to MCP server:', error);
      throw new Error('MCP connection failed');
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.connected) {
      await this.client.close();
      this.connected = false;
      this.logger.log('Disconnected from Writing Analysis MCP Server');
    }
  }

  private async ensureConnected(): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }
  }

  private async callTool<T = any>(toolName: string, args: any): Promise<T> {
    await this.ensureConnected();

    if (!this.client) {
      throw new Error('MCP client not initialized');
    }

    try {
      const result = await (this.client.request as any)({
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args,
        },
      });

      return result as T;
    } catch (error) {
      this.logger.error(`MCP tool call failed for ${toolName}:`, error);
      throw error;
    }
  }

  // Writing Analysis Tools

  async analyzeWritingPatterns(params: {
    content: string;
    userId: string;
    role: 'student' | 'educator' | 'administrator';
    purpose: string;
    consent?: boolean;
    options?: {
      includeStructure?: boolean;
      includeSentiment?: boolean;
      includeComplexity?: boolean;
    };
  }): Promise<MCPToolResponse> {
    return this.callTool('analyze_writing_patterns', params);
  }

  async evaluateReflectionQuality(params: {
    reflection: string;
    userId: string;
    role: 'student' | 'educator' | 'administrator';
    purpose: string;
    consent?: boolean;
    assignmentContext?: {
      assignmentId?: string;
      rubric?: any;
    };
  }): Promise<MCPToolResponse> {
    return this.callTool('evaluate_reflection_quality', params);
  }

  async trackWritingProgress(params: {
    userId: string;
    sessionId: string;
    metrics: {
      wordCount: number;
      timeSpent: number;
      revisions: number;
    };
    role: 'student' | 'educator' | 'administrator';
    purpose: string;
    consent?: boolean;
  }): Promise<MCPToolResponse> {
    return this.callTool('track_writing_progress', params);
  }

  async generateWritingInsights(params: {
    scope: 'individual' | 'class' | 'cohort';
    targetId: string;
    timeframe: 'day' | 'week' | 'month' | 'semester';
    role: 'student' | 'educator' | 'administrator';
    purpose: string;
    includeRecommendations?: boolean;
  }): Promise<MCPToolResponse> {
    return this.callTool('generate_writing_insights', params);
  }

  // Privacy Tools

  async classifyContentSensitivity(params: {
    content: string;
    context?: {
      contentType?: 'essay' | 'reflection' | 'notes' | 'feedback';
      academicLevel?: string;
    };
  }): Promise<MCPToolResponse> {
    return this.callTool('classify_content_sensitivity', params);
  }

  async validateEducationalPurpose(params: {
    purpose: string;
    requestedData: string[];
    requesterRole: 'student' | 'educator' | 'administrator' | 'researcher';
    targetUsers?: string[];
  }): Promise<MCPToolResponse> {
    return this.callTool('validate_educational_purpose', params);
  }

  async applyAIBoundaries(params: {
    request: {
      prompt: string;
      context: string;
      requestType: 'assistance' | 'feedback' | 'explanation' | 'answer';
    };
    studentContext: {
      assignmentType: string;
      reflectionCompleted: boolean;
      progressLevel: number;
    };
  }): Promise<MCPToolResponse> {
    return this.callTool('apply_ai_boundaries', params);
  }

  async auditWritingDataAccess(params: {
    accessType: 'read' | 'write' | 'analyze' | 'share';
    dataType: string;
    userId: string;
    accessedBy: string;
    purpose: string;
    educationalContext?: {
      courseId?: string;
      assignmentId?: string;
    };
  }): Promise<MCPToolResponse> {
    return this.callTool('audit_writing_data_access', params);
  }

  // Health check
  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    try {
      await this.ensureConnected();
      return { healthy: true };
    } catch (error) {
      return { 
        healthy: false, 
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}