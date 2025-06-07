import { Controller, Logger } from '@nestjs/common';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { WritingPatternAnalyzerService } from '../writing-analysis/services/writing-pattern-analyzer.service';
import { WritingProgressTrackerService } from '../writing-analysis/services/writing-progress-tracker.service';
import { ReflectionQualityAssessorService } from '../reflection-analysis/services/reflection-quality-assessor.service';
import { InsightsGeneratorService } from '../insights-generation/services/insights-generator.service';
import { ContentClassifierService } from '../content-privacy/services/content-classifier.service';
import { PurposeValidatorService } from '../educational-validation/services/purpose-validator.service';
import { AIBoundaryEnforcerService } from '../content-privacy/services/ai-boundary-enforcer.service';
import { AuditLoggerService } from '../content-privacy/services/audit-logger.service';

@Controller()
export class McpToolsController {
  private readonly logger = new Logger(McpToolsController.name);

  constructor(
    private readonly writingPatternAnalyzer: WritingPatternAnalyzerService,
    private readonly writingProgressTracker: WritingProgressTrackerService,
    private readonly reflectionQualityAssessor: ReflectionQualityAssessorService,
    private readonly insightsGenerator: InsightsGeneratorService,
    private readonly contentClassifier: ContentClassifierService,
    private readonly purposeValidator: PurposeValidatorService,
    private readonly aiBoundaryEnforcer: AIBoundaryEnforcerService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  async registerTools(server: Server): Promise<void> {
    this.logger.log('Registering MCP tools...');

    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getToolDefinitions(),
    }));

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      return await this.handleToolCall(name, args);
    });

    this.logger.log('Successfully registered 8 MCP tools (4 original + 4 privacy)');
  }

  private getToolDefinitions() {
    return [
      {
        name: 'analyze_writing_patterns',
        description: 'Analyze writing patterns with privacy-aware content processing',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Writing content to analyze' },
            userId: { type: 'string', description: 'User ID for privacy context' },
            role: { type: 'string', enum: ['student', 'educator', 'administrator'] },
            purpose: { type: 'string', description: 'Educational purpose of analysis' },
            consent: { type: 'boolean', description: 'User consent status' },
            options: {
              type: 'object',
              properties: {
                includeStructure: { type: 'boolean' },
                includeSentiment: { type: 'boolean' },
                includeComplexity: { type: 'boolean' },
              },
            },
          },
          required: ['content', 'userId', 'role', 'purpose'],
        },
      },
      {
        name: 'evaluate_reflection_quality',
        description: 'Evaluate reflection quality with privacy safeguards',
        inputSchema: {
          type: 'object',
          properties: {
            reflection: { type: 'string', description: 'Reflection text to evaluate' },
            userId: { type: 'string', description: 'User ID for privacy context' },
            role: { type: 'string', enum: ['student', 'educator', 'administrator'] },
            purpose: { type: 'string', description: 'Educational purpose' },
            consent: { type: 'boolean', description: 'User consent status' },
            assignmentContext: {
              type: 'object',
              properties: {
                assignmentId: { type: 'string' },
                rubric: { type: 'object' },
              },
            },
          },
          required: ['reflection', 'userId', 'role', 'purpose'],
        },
      },
      {
        name: 'track_writing_progress',
        description: 'Track writing progress with privacy-aware data collection',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string', description: 'User ID' },
            sessionId: { type: 'string', description: 'Writing session ID' },
            metrics: {
              type: 'object',
              properties: {
                wordCount: { type: 'number' },
                timeSpent: { type: 'number' },
                revisions: { type: 'number' },
              },
            },
            role: { type: 'string', enum: ['student', 'educator', 'administrator'] },
            purpose: { type: 'string' },
            consent: { type: 'boolean' },
          },
          required: ['userId', 'sessionId', 'metrics', 'role', 'purpose'],
        },
      },
      {
        name: 'generate_writing_insights',
        description: 'Generate privacy-first educational insights from writing data',
        inputSchema: {
          type: 'object',
          properties: {
            scope: { type: 'string', enum: ['individual', 'class', 'cohort'] },
            targetId: { type: 'string', description: 'User, class, or cohort ID' },
            timeframe: { type: 'string', enum: ['day', 'week', 'month', 'semester'] },
            role: { type: 'string', enum: ['student', 'educator', 'administrator'] },
            purpose: { type: 'string' },
            includeRecommendations: { type: 'boolean' },
          },
          required: ['scope', 'targetId', 'timeframe', 'role', 'purpose'],
        },
      },
      {
        name: 'classify_content_sensitivity',
        description: 'Classify content sensitivity for privacy protection',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Content to classify' },
            context: {
              type: 'object',
              properties: {
                contentType: { type: 'string', enum: ['essay', 'reflection', 'notes', 'feedback'] },
                academicLevel: { type: 'string' },
              },
            },
          },
          required: ['content'],
        },
      },
      {
        name: 'validate_educational_purpose',
        description: 'Validate educational purpose for data access',
        inputSchema: {
          type: 'object',
          properties: {
            purpose: { type: 'string', description: 'Stated purpose' },
            requestedData: {
              type: 'array',
              items: { type: 'string' },
              description: 'Types of data requested',
            },
            requesterRole: { type: 'string', enum: ['student', 'educator', 'administrator', 'researcher'] },
            targetUsers: {
              type: 'array',
              items: { type: 'string' },
              description: 'User IDs whose data is requested',
            },
          },
          required: ['purpose', 'requestedData', 'requesterRole'],
        },
      },
      {
        name: 'apply_ai_boundaries',
        description: 'Apply AI boundaries to ensure educational integrity',
        inputSchema: {
          type: 'object',
          properties: {
            request: {
              type: 'object',
              properties: {
                prompt: { type: 'string' },
                context: { type: 'string' },
                requestType: { type: 'string', enum: ['assistance', 'feedback', 'explanation', 'answer'] },
              },
            },
            studentContext: {
              type: 'object',
              properties: {
                assignmentType: { type: 'string' },
                reflectionCompleted: { type: 'boolean' },
                progressLevel: { type: 'number' },
              },
            },
          },
          required: ['request', 'studentContext'],
        },
      },
      {
        name: 'audit_writing_data_access',
        description: 'Audit data access for privacy compliance',
        inputSchema: {
          type: 'object',
          properties: {
            accessType: { type: 'string', enum: ['read', 'write', 'analyze', 'share'] },
            dataType: { type: 'string', description: 'Type of data accessed' },
            userId: { type: 'string', description: 'User whose data was accessed' },
            accessedBy: { type: 'string', description: 'User who accessed the data' },
            purpose: { type: 'string', description: 'Purpose of access' },
            educationalContext: {
              type: 'object',
              properties: {
                courseId: { type: 'string' },
                assignmentId: { type: 'string' },
              },
            },
          },
          required: ['accessType', 'dataType', 'userId', 'accessedBy', 'purpose'],
        },
      },
    ];
  }

  private async handleToolCall(name: string, args: any): Promise<any> {
    this.logger.log(`Handling tool call: ${name}`);
    
    try {
      switch (name) {
        case 'analyze_writing_patterns':
          return await this.writingPatternAnalyzer.analyzePatterns(args);
          
        case 'evaluate_reflection_quality':
          return await this.reflectionQualityAssessor.evaluateQuality(args);
          
        case 'track_writing_progress':
          return await this.writingProgressTracker.trackProgress(args);
          
        case 'generate_writing_insights':
          return await this.insightsGenerator.generateInsights(args);
          
        case 'classify_content_sensitivity':
          return await this.contentClassifier.classifyContent(args);
          
        case 'validate_educational_purpose':
          return await this.purposeValidator.validatePurpose(args);
          
        case 'apply_ai_boundaries':
          return await this.aiBoundaryEnforcer.enforceBoundaries(args);
          
        case 'audit_writing_data_access':
          return await this.auditLogger.logAccess(args);
          
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      this.logger.error(`Error executing tool ${name}:`, error);
      return { 
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }
}