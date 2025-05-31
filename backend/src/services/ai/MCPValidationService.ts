import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import path from 'path';
import { 
  BoundedEnhancementValidation, 
  BloomsTaxonomyAssessment,
  DependencyRiskAssessment,
  PhilosophyComplianceResult 
} from '../../../mcp-servers/educational-ai-validator/src/types/validation-results.js';
import { 
  EducationalContext, 
  AIResponse,
  StudentProfile 
} from '../../../mcp-servers/educational-ai-validator/src/types/educational-contexts.js';

export class MCPValidationService {
  private static client: Client | null = null;
  private static initialized = false;
  private static mcpProcess: any = null;

  /**
   * Initialize MCP client connection
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Spawn the MCP server process
      const serverPath = path.resolve(__dirname, '../../../mcp-servers/educational-ai-validator/dist/index.js');
      
      this.mcpProcess = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Create transport
      const transport = new StdioClientTransport({
        stdin: this.mcpProcess.stdin,
        stdout: this.mcpProcess.stdout
      });

      // Create and connect client
      this.client = new Client({
        name: 'scribe-tree-backend',
        version: '1.0.0'
      }, {
        capabilities: {}
      });

      await this.client.connect(transport);
      this.initialized = true;

      console.log('MCP Validation Service initialized successfully');

      // Handle process errors
      this.mcpProcess.on('error', (error: Error) => {
        console.error('MCP server process error:', error);
        this.initialized = false;
      });

      this.mcpProcess.on('exit', (code: number) => {
        console.log(`MCP server process exited with code ${code}`);
        this.initialized = false;
      });

    } catch (error) {
      console.error('Failed to initialize MCP Validation Service:', error);
      throw error;
    }
  }

  /**
   * Ensure service is initialized
   */
  private static async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Validate AI response against bounded enhancement principles
   */
  static async validateBoundedEnhancement(
    aiResponse: AIResponse,
    context: EducationalContext
  ): Promise<BoundedEnhancementValidation> {
    await this.ensureInitialized();

    if (!this.client) {
      throw new Error('MCP client not initialized');
    }

    const result = await this.client.request({
      method: 'tools/call',
      params: {
        name: 'validate_bounded_enhancement',
        arguments: {
          aiResponse,
          context
        }
      }
    });

    return JSON.parse(result.content[0].text);
  }

  /**
   * Analyze questions for Bloom's taxonomy levels
   */
  static async assessBloomsTaxonomy(
    questions: string[],
    targetLevel?: number,
    academicLevel?: string
  ): Promise<BloomsTaxonomyAssessment> {
    await this.ensureInitialized();

    if (!this.client) {
      throw new Error('MCP client not initialized');
    }

    const result = await this.client.request({
      method: 'tools/call',
      params: {
        name: 'assess_blooms_taxonomy',
        arguments: {
          questions,
          targetLevel,
          academicLevel
        }
      }
    });

    return JSON.parse(result.content[0].text);
  }

  /**
   * Check AI dependency risk
   */
  static async checkDependencyRisk(
    interactionPattern: {
      frequency: number;
      requestTypes: string[];
      reflectionQuality?: number;
      independentWorkRatio?: number;
    },
    studentProfile?: StudentProfile
  ): Promise<DependencyRiskAssessment> {
    await this.ensureInitialized();

    if (!this.client) {
      throw new Error('MCP client not initialized');
    }

    const result = await this.client.request({
      method: 'tools/call',
      params: {
        name: 'check_dependency_risk',
        arguments: {
          interactionPattern,
          studentProfile
        }
      }
    });

    return JSON.parse(result.content[0].text);
  }

  /**
   * Enforce philosophy principles
   */
  static async enforcePhilosophyPrinciples(
    response: any,
    principles?: any
  ): Promise<PhilosophyComplianceResult> {
    await this.ensureInitialized();

    if (!this.client) {
      throw new Error('MCP client not initialized');
    }

    const result = await this.client.request({
      method: 'tools/call',
      params: {
        name: 'enforce_philosophy_principles',
        arguments: {
          response,
          principles
        }
      }
    });

    return JSON.parse(result.content[0].text);
  }

  /**
   * Validate reflection requirements
   */
  static async validateReflectionRequirements(
    response: AIResponse,
    studentProfile: StudentProfile,
    previousReflections?: any[]
  ): Promise<any> {
    await this.ensureInitialized();

    if (!this.client) {
      throw new Error('MCP client not initialized');
    }

    const result = await this.client.request({
      method: 'tools/call',
      params: {
        name: 'validate_reflection_requirements',
        arguments: {
          response,
          studentProfile,
          previousReflections
        }
      }
    });

    return JSON.parse(result.content[0].text);
  }

  /**
   * Generate educational rationale
   */
  static async generateEducationalRationale(
    aiAction: any,
    context: EducationalContext,
    educationalGoals?: string[]
  ): Promise<any> {
    await this.ensureInitialized();

    if (!this.client) {
      throw new Error('MCP client not initialized');
    }

    const result = await this.client.request({
      method: 'tools/call',
      params: {
        name: 'generate_educational_rationale',
        arguments: {
          aiAction,
          context,
          educationalGoals
        }
      }
    });

    return JSON.parse(result.content[0].text);
  }

  /**
   * Analyze question educational value
   */
  static async analyzeQuestionEducationalValue(
    question: string,
    context: EducationalContext,
    learningObjectives?: string[]
  ): Promise<any> {
    await this.ensureInitialized();

    if (!this.client) {
      throw new Error('MCP client not initialized');
    }

    const result = await this.client.request({
      method: 'tools/call',
      params: {
        name: 'analyze_question_educational_value',
        arguments: {
          question,
          context,
          learningObjectives
        }
      }
    });

    return JSON.parse(result.content[0].text);
  }

  /**
   * Validate progressive access
   */
  static async validateProgressiveAccess(
    currentAccessLevel: string,
    studentMetrics: any,
    proposedChange?: any
  ): Promise<any> {
    await this.ensureInitialized();

    if (!this.client) {
      throw new Error('MCP client not initialized');
    }

    const result = await this.client.request({
      method: 'tools/call',
      params: {
        name: 'validate_progressive_access',
        arguments: {
          currentAccessLevel,
          studentMetrics,
          proposedChange
        }
      }
    });

    return JSON.parse(result.content[0].text);
  }

  /**
   * Cleanup and disconnect
   */
  static async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }

    if (this.mcpProcess) {
      this.mcpProcess.kill();
      this.mcpProcess = null;
    }

    this.initialized = false;
  }
}