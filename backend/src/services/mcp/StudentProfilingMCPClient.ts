import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
// Removed NestJS dependency for Express compatibility
import * as path from 'path';

export interface MCPToolResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface StudentProfile {
  profileId: string;
  studentId: string;
  publicProfile: {
    displayName: string;
    grade: number;
    learningGoals: string[];
    interests: string[];
    achievements: any[];
  };
  privateProfile?: {
    learningChallenges: string[];
    accommodations: string[];
    personalNotes: string[];
  };
  privacySettings: any;
  createdAt: Date;
  lastUpdated: Date;
}

export interface PrivacyChoices {
  educationalSharing: {
    teacher: boolean;
    peer: boolean;
    parent: boolean;
  };
  platformImprovement: {
    anonymousPatterns: boolean;
    featureAnalytics: boolean;
    research: boolean;
  };
  personalBenefits: {
    enhancedAnalytics: boolean;
    portfolio: boolean;
    careerGuidance: boolean;
  };
  privacyControls: {
    retentionPeriod: string;
    sensitiveContent: string;
    thirdParty: string;
  };
}

export interface PrivacyDashboard {
  dashboardId: string;
  studentId: string;
  currentChoices: PrivacyChoices;
  dataAccessLog: any[];
  privacyScore: {
    overallScore: number;
    dataMinimization: number;
    consentCompliance: number;
    accessControl: number;
    dataProtection: number;
  };
  recommendations: any[];
  dataInventory: any;
  controls: any;
  generatedAt: Date;
}

export class StudentProfilingMCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private readonly logger = console;
  private connected = false;

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      // Get MCP server path from environment or use default
      const mcpServerPath = process.env.MCP_STUDENT_PROFILING_PATH || 
        path.join(__dirname, '../../../../mcp-servers/student-profiling/dist/main.js');

      this.transport = new StdioClientTransport({
        command: 'node',
        args: [mcpServerPath, 'mcp'],
      });

      this.client = new Client({
        name: 'scribe-tree-backend',
        version: '1.0.0',
      }, {
        capabilities: {},
      });

      await this.client.connect(this.transport);
      this.connected = true;
      console.log('Connected to Student Profiling MCP Server');
    } catch (error) {
      console.error('Failed to connect to Student Profiling MCP server:', error);
      // Don't throw - allow fallback to HTTP API or direct service
      console.warn('Student Profiling MCP unavailable, will use fallback methods');
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.connected) {
      await this.client.close();
      this.connected = false;
      console.log('Disconnected from Student Profiling MCP Server');
    }
  }

  private async callTool<T>(toolName: string, params: any): Promise<MCPToolResponse<T>> {
    if (!this.client || !this.connected) {
      return {
        success: false,
        error: 'MCP client not connected'
      };
    }

    try {
      const result = await this.client.callTool({
        name: toolName,
        arguments: params
      });

      if (result.content?.[0]?.type === 'text') {
        const data = JSON.parse(result.content[0].text);
        return {
          success: true,
          data
        };
      }

      return {
        success: false,
        error: 'Invalid response format'
      };
    } catch (error) {
      console.error(`Error calling tool ${toolName}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Build a student profile with privacy controls
   */
  async buildStudentProfile(
    studentId: string,
    requesterContext: {
      userId: string;
      role: 'student' | 'teacher' | 'parent' | 'admin';
      purpose: string;
    },
    includePrivateData: boolean = false
  ): Promise<MCPToolResponse<StudentProfile>> {
    return this.callTool<StudentProfile>('build_student_profile', {
      studentId,
      requesterContext,
      includePrivateData
    });
  }

  /**
   * Manage student privacy choices
   */
  async managePrivacyChoices(
    studentId: string,
    choices: Partial<PrivacyChoices>
  ): Promise<MCPToolResponse<any>> {
    return this.callTool('manage_student_privacy_choices', {
      studentId,
      choices
    });
  }

  /**
   * Generate privacy-preserving analytics
   */
  async generatePrivacyPreservingAnalytics(
    cohortIds: string[],
    metrics: string[],
    epsilon?: number,
    delta?: number
  ): Promise<MCPToolResponse<any>> {
    return this.callTool('generate_privacy_preserving_analytics', {
      cohortIds,
      metrics,
      epsilon,
      delta
    });
  }

  /**
   * Validate data access request
   */
  async validateDataAccessRequest(
    requesterId: string,
    requesterType: 'teacher' | 'peer' | 'platform' | 'researcher',
    studentId: string,
    purpose: string,
    dataTypes: string[],
    studentBenefit?: string
  ): Promise<MCPToolResponse<any>> {
    return this.callTool('validate_data_access_requests', {
      requesterId,
      requesterType,
      studentId,
      purpose,
      dataTypes,
      studentBenefit
    });
  }

  /**
   * Create student privacy dashboard
   */
  async createPrivacyDashboard(
    studentId: string,
    includeRecommendations: boolean = true,
    timeRange: string = 'month'
  ): Promise<MCPToolResponse<PrivacyDashboard>> {
    return this.callTool<PrivacyDashboard>('create_student_privacy_dashboard', {
      studentId,
      includeRecommendations,
      timeRange
    });
  }

  /**
   * Track learning trajectory with privacy controls
   */
  async trackLearningTrajectory(
    studentId: string,
    milestone: {
      skill: string;
      level: number;
      evidence?: string[];
    },
    privacyLevel: 'full' | 'anonymized' | 'aggregate' = 'anonymized'
  ): Promise<MCPToolResponse<any>> {
    return this.callTool('track_learning_trajectory', {
      studentId,
      milestone,
      privacyLevel
    });
  }

  /**
   * Assess skill development with sharing controls
   */
  async assessSkillDevelopment(
    studentId: string,
    skills: Array<{
      skillName: string;
      currentLevel: number;
      targetLevel: number;
      progress: number;
    }>,
    sharedWith: string[] = []
  ): Promise<MCPToolResponse<any>> {
    return this.callTool('assess_skill_development', {
      studentId,
      skills,
      sharedWith
    });
  }

  /**
   * Generate personalized recommendations with value exchange
   */
  async generatePersonalizedRecommendations(
    studentId: string,
    useEnhancedData: boolean = false,
    recommendationTypes?: string[]
  ): Promise<MCPToolResponse<any>> {
    return this.callTool('generate_personalized_recommendations', {
      studentId,
      useEnhancedData,
      recommendationTypes
    });
  }

  /**
   * Health check for the MCP connection
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get available tools
   */
  async getAvailableTools(): Promise<string[]> {
    if (!this.client || !this.connected) {
      return [];
    }

    try {
      const result = await this.client.listTools();
      return result.tools?.map(tool => tool.name) || [];
    } catch (error) {
      console.error('Error listing tools:', error);
      return [];
    }
  }
}