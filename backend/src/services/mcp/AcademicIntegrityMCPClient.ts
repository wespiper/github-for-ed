import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Logger } from '@nestjs/common';
import * as path from 'path';

export interface MCPToolResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AIDetectionResult {
  assistanceLevel: string;
  confidence: number;
  patterns: string[];
  educationalContext: {
    detectionPurpose: string;
    educationalJustification: string;
    analysisTimestamp: string;
    correlationId: string;
    privacyCompliant: boolean;
    educationalValue: number;
    learningOpportunity: string[];
    nextSteps: string[];
    academicIntegrityGuidance: string;
  };
  recommendations: string[];
  processingTime: number;
  studentId: string;
  privacyProtected: boolean;
  analysisTimestamp: string;
}

export interface IntegrityAnalysisResult {
  integrityScore: number;
  authenticityScore: number;
  violations: string[];
  suggestedInterventions: string[];
  educationalValue: number;
  confidence: number;
  educationalContext: {
    analysisTimestamp: string;
    correlationId: string;
    privacyCompliant: boolean;
    educationalJustification: string;
    academicIntegrityGuidance: string;
  };
  recommendations: string[];
  processingTime: number;
  studentId: string;
  privacyProtected: boolean;
  analysisTimestamp: string;
}

export interface EducationalValidationResult {
  isEducationallyValid: boolean;
  complianceScore: number;
  boundaryViolations: string[];
  educationalJustification: string;
  recommendations: string[];
  metadata: {
    assignmentType: string;
    studentLevel: string;
    totalAIInteractions: number;
    analysisTimestamp: string;
  };
}

export interface IntegrityReport {
  reportId: string;
  generatedAt: string;
  summary: {
    overallIntegrityScore: number;
    aiAssistanceLevel: string;
    majorFindings: string[];
    recommendations: string[];
    pedagogicalInsights?: string[];
  };
  detailedAnalysis: {
    contentAuthenticity: {
      score: number;
      indicators: string[];
    };
    aiUsagePatterns: {
      appropriateUse: string[];
      concerningUse: string[];
    };
    educationalAlignment: {
      alignmentScore: number;
      learningObjectivesMet: string[];
      areasForImprovement: string[];
    };
  };
  privacyProtected: boolean;
  metadata: {
    format: string;
    documentIdHash: string;
    generationOptions: {
      includeDetailedAnalysis: boolean;
      focusAreas: string[];
    };
  };
}

export interface PrivacyContext {
  requesterId: string;
  requesterType: 'student' | 'educator' | 'system' | 'admin';
  purpose: string;
  educationalJustification?: string;
}

export class AcademicIntegrityMCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private readonly logger = new Logger(AcademicIntegrityMCPClient.name);
  private connected = false;

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      // Get MCP server path from environment or use default
      const mcpServerPath = process.env.MCP_ACADEMIC_INTEGRITY_PATH || 
        path.join(__dirname, '../../../../mcp-servers/academic-integrity/dist/index.js');

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
      this.logger.log('Connected to Academic Integrity MCP Server');
    } catch (error) {
      this.logger.error('Failed to connect to Academic Integrity MCP server:', error);
      throw new Error('Academic Integrity MCP connection failed');
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.connected) {
      try {
        await this.client.close();
        this.connected = false;
        this.logger.log('Disconnected from Academic Integrity MCP Server');
      } catch (error) {
        this.logger.error('Error disconnecting from Academic Integrity MCP server:', error);
      }
    }
  }

  /**
   * Detect AI assistance levels in student work
   */
  async detectAIAssistanceLevels(
    studentId: string,
    assignmentId: string,
    content: string,
    privacyContext: PrivacyContext
  ): Promise<MCPToolResponse<AIDetectionResult>> {
    await this.connect();

    if (!this.client) {
      throw new Error('MCP client not connected');
    }

    try {
      const response = await this.client.request(
        {
          method: 'tools/call',
          params: {
            name: 'detect_ai_assistance_levels',
            arguments: {
              studentId,
              assignmentId,
              content,
              privacyContext
            }
          }
        },
        { timeout: 30000 }
      );

      // Parse the response content
      const contentText = response.content[0]?.text;
      if (!contentText) {
        throw new Error('No content in MCP response');
      }

      const parsedResponse = JSON.parse(contentText);
      return parsedResponse;
    } catch (error) {
      this.logger.error('AI assistance detection failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'AI assistance detection failed'
      };
    }
  }

  /**
   * Analyze academic integrity of student submission
   */
  async analyzeAcademicIntegrity(
    studentId: string,
    assignmentId: string,
    submissionData: {
      content: string;
      metadata?: Record<string, any>;
      writingPatterns?: Record<string, any>;
    },
    privacyContext: PrivacyContext
  ): Promise<MCPToolResponse<IntegrityAnalysisResult>> {
    await this.connect();

    if (!this.client) {
      throw new Error('MCP client not connected');
    }

    try {
      const response = await this.client.request(
        {
          method: 'tools/call',
          params: {
            name: 'analyze_academic_integrity',
            arguments: {
              studentId,
              assignmentId,
              submissionData,
              privacyContext
            }
          }
        },
        { timeout: 30000 }
      );

      const contentText = response.content[0]?.text;
      if (!contentText) {
        throw new Error('No content in MCP response');
      }

      const parsedResponse = JSON.parse(contentText);
      return parsedResponse;
    } catch (error) {
      this.logger.error('Academic integrity analysis failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Academic integrity analysis failed'
      };
    }
  }

  /**
   * Validate educational AI use
   */
  async validateEducationalAIUse(
    studentId: string,
    assignmentId: string,
    aiInteraction: {
      type: string;
      content: string;
      context?: Record<string, any>;
    },
    privacyContext: PrivacyContext
  ): Promise<MCPToolResponse<EducationalValidationResult>> {
    await this.connect();

    if (!this.client) {
      throw new Error('MCP client not connected');
    }

    try {
      const response = await this.client.request(
        {
          method: 'tools/call',
          params: {
            name: 'validate_educational_ai_use',
            arguments: {
              studentId,
              assignmentId,
              aiInteraction,
              privacyContext
            }
          }
        },
        { timeout: 30000 }
      );

      const contentText = response.content[0]?.text;
      if (!contentText) {
        throw new Error('No content in MCP response');
      }

      const parsedResponse = JSON.parse(contentText);
      return parsedResponse;
    } catch (error) {
      this.logger.error('Educational AI validation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Educational AI validation failed'
      };
    }
  }

  /**
   * Generate integrity reports
   */
  async generateIntegrityReports(
    criteria: {
      reportType: 'individual' | 'class' | 'assignment' | 'course';
      targetId?: string;
      timeframe: {
        start: string;
        end: string;
      };
      includeIndividualData?: boolean;
    },
    privacyContext: PrivacyContext
  ): Promise<MCPToolResponse<IntegrityReport>> {
    await this.connect();

    if (!this.client) {
      throw new Error('MCP client not connected');
    }

    try {
      const response = await this.client.request(
        {
          method: 'tools/call',
          params: {
            name: 'generate_integrity_reports',
            arguments: {
              criteria,
              privacyContext
            }
          }
        },
        { timeout: 30000 }
      );

      const contentText = response.content[0]?.text;
      if (!contentText) {
        throw new Error('No content in MCP response');
      }

      const parsedResponse = JSON.parse(contentText);
      return parsedResponse;
    } catch (error) {
      this.logger.error('Integrity report generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Integrity report generation failed'
      };
    }
  }

  /**
   * List available tools
   */
  async listTools(): Promise<any> {
    await this.connect();

    if (!this.client) {
      throw new Error('MCP client not connected');
    }

    try {
      const response = await this.client.request(
        {
          method: 'tools/list',
          params: {}
        },
        { timeout: 10000 }
      );

      return response.tools;
    } catch (error) {
      this.logger.error('Failed to list tools:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.connect();
      const tools = await this.listTools();
      return tools && tools.length > 0;
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return false;
    }
  }
}