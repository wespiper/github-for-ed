import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import * as path from 'path';

export interface MCPToolResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface BoundedEnhancementValidation {
  isValid: boolean;
  score: number;
  violations: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    suggestion: string;
  }>;
  recommendations: string[];
  educational_value: number;
  independence_promotion: number;
}

export interface BloomsTaxonomyAnalysis {
  cognitive_levels: Array<{
    level: string;
    percentage: number;
    examples: string[];
  }>;
  overall_level: string;
  complexity_score: number;
  educational_progression: {
    current_level: string;
    next_level: string;
    suggestions: string[];
  };
}

export interface DependencyRiskAssessment {
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_factors: Array<{
    factor: string;
    severity: number;
    description: string;
  }>;
  independence_score: number;
  recommendations: string[];
  monitoring_suggestions: string[];
}

export interface EducationalRationale {
  rationale: string;
  learning_objectives: string[];
  cognitive_benefits: string[];
  skill_development: string[];
  evidence_based_support: string[];
  limitations: string[];
}

export interface PhilosophyCompliance {
  compliant: boolean;
  philosophy_alignment: number;
  principle_analysis: Array<{
    principle: string;
    compliant: boolean;
    score: number;
    explanation: string;
  }>;
  overall_assessment: string;
  recommendations: string[];
}

export interface ReflectionRequirement {
  required: boolean;
  reflection_type: string;
  minimum_depth: number;
  suggested_prompts: string[];
  assessment_criteria: string[];
  learning_indicators: string[];
}

/**
 * MCP Client for Educational AI Validation
 * Ensures all AI interactions comply with Scribe Tree's educational philosophy
 */
export class EducationalAIValidatorMCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private readonly logger = console;
  private connected = false;
  private readonly serverPath: string;

  constructor() {
    // Get MCP server path from environment or use default
    this.serverPath = process.env.MCP_EDUCATIONAL_AI_VALIDATOR_PATH || 
      path.join(__dirname, '../../../../mcp-servers/educational-ai-validator/dist/index.js');
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      this.logger.log('Connecting to Educational AI Validator MCP server...');
      
      // Create transport for the educational AI validator MCP server
      this.transport = new StdioClientTransport({
        command: 'node',
        args: [this.serverPath]
      });

      // Create and connect client
      this.client = new Client(
        {
          name: 'educational-ai-validator-backend-client',
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
      this.logger.log('✅ Connected to Educational AI Validator MCP server');

    } catch (error) {
      this.logger.error('❌ Failed to connect to Educational AI Validator MCP server:', error);
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
      this.logger.log('Disconnected from Educational AI Validator MCP server');
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
      this.logger.log(`Calling Educational AI Validator tool: ${toolName}`);
      
      const result = await this.client!.callTool({
        name: toolName,
        arguments: args
      });

      if (result.content && result.content[0] && result.content[0].type === 'text') {
        const response = JSON.parse(result.content[0].text);
        
        this.logger.log(`✅ Educational AI Validator tool ${toolName} completed successfully`);
        return {
          success: true,
          data: response
        };
      } else {
        throw new Error('Invalid response format from Educational AI Validator MCP server');
      }

    } catch (error) {
      this.logger.error(`❌ Error calling Educational AI Validator tool ${toolName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate AI response against bounded enhancement principles
   */
  async validateBoundedEnhancement(
    aiResponse: {
      questions?: string[];
      educationalRationale?: string;
      attribution?: string;
      limitations?: string[];
      content?: string;
    },
    context: {
      writingStage: string;
      academicLevel: string;
      studentProfile?: {
        gradLevel?: number;
        learningStyle?: string;
        strugglingAreas?: string[];
        strengths?: string[];
      };
      assignmentType?: string;
      learningObjectives?: string[];
    }
  ): Promise<MCPToolResponse<BoundedEnhancementValidation>> {
    return this.callTool<BoundedEnhancementValidation>('validate_bounded_enhancement', {
      aiResponse,
      context
    });
  }

  /**
   * Analyze content against Bloom's Taxonomy cognitive levels
   */
  async analyzeBloomsTaxonomy(
    questions: string[],
    targetLevel?: number,
    academicLevel?: string
  ): Promise<MCPToolResponse<BloomsTaxonomyAnalysis>> {
    return this.callTool<BloomsTaxonomyAnalysis>('assess_blooms_taxonomy', {
      questions,
      targetLevel,
      academicLevel
    });
  }

  /**
   * Assess risk of AI dependency in student interactions
   */
  async detectDependencyRisk(
    interactionPattern: {
      frequency: number;
      requestTypes: string[];
      reflectionQuality?: number;
      independentWorkRatio?: number;
    },
    studentProfile?: any
  ): Promise<MCPToolResponse<DependencyRiskAssessment>> {
    return this.callTool<DependencyRiskAssessment>('check_dependency_risk', {
      interactionPattern,
      studentProfile
    });
  }

  /**
   * Generate educational rationale for AI assistance
   */
  async generateEducationalRationale(
    request: {
      studentQuestion: string;
      context: string;
      writingStage: string;
      strugglingArea?: string;
    },
    constraints: {
      academicLevel: string;
      maxComplexity: string;
      focusAreas: string[];
      avoidDirectAnswers: boolean;
    }
  ): Promise<MCPToolResponse<EducationalRationale>> {
    return this.callTool<EducationalRationale>('generate_educational_rationale', {
      request,
      constraints
    });
  }

  /**
   * Enforce educational philosophy compliance
   */
  async enforcePhilosophy(
    response: any,
    principles?: {
      questionsOnly?: boolean;
      mandatoryReflection?: boolean;
      progressiveAccess?: boolean;
      transparentAttribution?: boolean;
      independenceBuilding?: boolean;
    }
  ): Promise<MCPToolResponse<PhilosophyCompliance>> {
    return this.callTool<PhilosophyCompliance>('enforce_philosophy_principles', {
      response,
      principles: principles || {
        questionsOnly: true,
        mandatoryReflection: true,
        progressiveAccess: true,
        transparentAttribution: true,
        independenceBuilding: true
      }
    });
  }

  /**
   * Validate reflection requirements for AI interactions
   */
  async validateReflectionRequirement(
    response: {
      reflectionRequirements?: any;
    },
    studentProfile: any,
    previousReflections?: any[]
  ): Promise<MCPToolResponse<ReflectionRequirement>> {
    return this.callTool<ReflectionRequirement>('validate_reflection_requirements', {
      response,
      studentProfile,
      previousReflections: previousReflections || []
    });
  }

  /**
   * Check server health and available tools
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