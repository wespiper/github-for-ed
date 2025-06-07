/**
 * Academic Integrity MCP Server
 * Implements Model Context Protocol for AI detection and educational validation
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { MCPToolsService } from './mcp-tools.service';
import { AIAssistanceDetectorService } from '../ai-detection/services/ai-assistance-detector.service';
import { IntegrityAnalyzerService } from '../integrity-analysis/services/integrity-analyzer.service';
import { EducationalValidatorService } from '../educational-validation/services/educational-validator.service';
import { ReportGeneratorService } from '../reporting/services/report-generator.service';

export class MCPServer {
  private server: Server;
  private transport: StdioServerTransport;
  private toolsService: MCPToolsService;

  constructor() {
    this.server = new Server(
      {
        name: 'academic-integrity-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.transport = new StdioServerTransport();
    
    // Instantiate service dependencies
    const aiDetector = new AIAssistanceDetectorService();
    const integrityAnalyzer = new IntegrityAnalyzerService();
    const educationalValidator = new EducationalValidatorService();
    const reportGenerator = new ReportGeneratorService();
    
    this.toolsService = new MCPToolsService(
      aiDetector,
      integrityAnalyzer,
      educationalValidator,
      reportGenerator
    );
    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'detect_ai_assistance_levels',
            description: 'Detect AI assistance levels in student work with privacy protection',
            inputSchema: {
              type: 'object',
              properties: {
                studentId: {
                  type: 'string',
                  description: 'Student identifier (will be hashed for privacy)'
                },
                assignmentId: {
                  type: 'string',
                  description: 'Assignment identifier'
                },
                content: {
                  type: 'string',
                  description: 'Student work content to analyze'
                },
                privacyContext: {
                  type: 'object',
                  description: 'Privacy context for educational justification',
                  properties: {
                    requesterId: { type: 'string' },
                    requesterType: { type: 'string', enum: ['student', 'educator', 'system', 'admin'] },
                    purpose: { type: 'string' },
                    educationalJustification: { type: 'string' }
                  },
                  required: ['requesterId', 'requesterType', 'purpose']
                }
              },
              required: ['studentId', 'assignmentId', 'content', 'privacyContext']
            }
          },
          {
            name: 'analyze_academic_integrity',
            description: 'Comprehensive academic integrity analysis with educational context',
            inputSchema: {
              type: 'object',
              properties: {
                studentId: {
                  type: 'string',
                  description: 'Student identifier (privacy protected)'
                },
                assignmentId: {
                  type: 'string',
                  description: 'Assignment identifier'
                },
                submissionData: {
                  type: 'object',
                  description: 'Submission data for analysis',
                  properties: {
                    content: { type: 'string' },
                    metadata: { type: 'object' },
                    writingPatterns: { type: 'object' }
                  },
                  required: ['content']
                },
                privacyContext: {
                  type: 'object',
                  description: 'Privacy context for educational justification',
                  properties: {
                    requesterId: { type: 'string' },
                    requesterType: { type: 'string', enum: ['student', 'educator', 'system', 'admin'] },
                    purpose: { type: 'string' },
                    educationalJustification: { type: 'string' }
                  },
                  required: ['requesterId', 'requesterType', 'purpose']
                }
              },
              required: ['studentId', 'assignmentId', 'submissionData', 'privacyContext']
            }
          },
          {
            name: 'validate_educational_ai_use',
            description: 'Validate educational value and boundary compliance of AI interactions',
            inputSchema: {
              type: 'object',
              properties: {
                studentId: {
                  type: 'string',
                  description: 'Student identifier (privacy protected)'
                },
                assignmentId: {
                  type: 'string',
                  description: 'Assignment identifier'
                },
                aiInteraction: {
                  type: 'object',
                  description: 'AI interaction to validate',
                  properties: {
                    type: { type: 'string' },
                    content: { type: 'string' },
                    context: { type: 'object' }
                  },
                  required: ['type', 'content']
                },
                privacyContext: {
                  type: 'object',
                  description: 'Privacy context for educational justification',
                  properties: {
                    requesterId: { type: 'string' },
                    requesterType: { type: 'string', enum: ['student', 'educator', 'system', 'admin'] },
                    purpose: { type: 'string' },
                    educationalJustification: { type: 'string' }
                  },
                  required: ['requesterId', 'requesterType', 'purpose']
                }
              },
              required: ['studentId', 'assignmentId', 'aiInteraction', 'privacyContext']
            }
          },
          {
            name: 'generate_integrity_reports',
            description: 'Generate comprehensive integrity reports with privacy controls',
            inputSchema: {
              type: 'object',
              properties: {
                criteria: {
                  type: 'object',
                  description: 'Report generation criteria',
                  properties: {
                    reportType: { 
                      type: 'string', 
                      enum: ['individual', 'class', 'assignment', 'course'] 
                    },
                    targetId: { type: 'string' },
                    timeframe: {
                      type: 'object',
                      properties: {
                        start: { type: 'string', format: 'date-time' },
                        end: { type: 'string', format: 'date-time' }
                      },
                      required: ['start', 'end']
                    },
                    includeIndividualData: { type: 'boolean' }
                  },
                  required: ['reportType', 'timeframe']
                },
                privacyContext: {
                  type: 'object',
                  description: 'Privacy context for educational justification',
                  properties: {
                    requesterId: { type: 'string' },
                    requesterType: { type: 'string', enum: ['student', 'educator', 'system', 'admin'] },
                    purpose: { type: 'string' },
                    educationalJustification: { type: 'string' }
                  },
                  required: ['requesterId', 'requesterType', 'purpose']
                }
              },
              required: ['criteria', 'privacyContext']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'detect_ai_assistance_levels':
            return await this.toolsService.detectAIAssistanceLevels(args as any);
            
          case 'analyze_academic_integrity':
            return await this.toolsService.analyzeAcademicIntegrity(args as any);
            
          case 'validate_educational_ai_use':
            return await this.toolsService.validateEducationalAIUse(args as any);
            
          case 'generate_integrity_reports':
            return await this.toolsService.generateIntegrityReports(args as any);
            
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`Error executing tool ${name}:`, error);
        throw error;
      }
    });
  }

  async start(): Promise<void> {
    await this.server.connect(this.transport);
    console.log('📊 Academic Integrity MCP Server connected and ready');
  }

  async stop(): Promise<void> {
    await this.server.close();
    console.log('📊 Academic Integrity MCP Server stopped');
  }
}