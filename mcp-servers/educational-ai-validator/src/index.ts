#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError
} from '@modelcontextprotocol/sdk/types.js';

// Import our tools
import { BoundedEnhancementValidator } from './tools/bounded-enhancement-validator.js';
import { BloomsTaxonomyAnalyzer } from './tools/blooms-taxonomy-analyzer.js';
import { DependencyRiskDetector } from './tools/dependency-risk-detector.js';
import { PhilosophyEnforcer } from './tools/philosophy-enforcer.js';
import { ReflectionRequirementValidator } from './tools/reflection-requirement-validator.js';
import { EducationalRationaleGenerator } from './tools/educational-rationale-generator.js';

// Create server instance
const server = new Server(
  {
    name: 'educational-ai-validator',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'validate_bounded_enhancement',
        description: 'Validates AI responses against bounded enhancement principles (questions only, no answers)',
        inputSchema: {
          type: 'object',
          properties: {
            aiResponse: {
              type: 'object',
              properties: {
                questions: { type: 'array', items: { type: 'string' } },
                educationalRationale: { type: 'string' },
                attribution: { type: 'string' },
                limitations: { type: 'array', items: { type: 'string' } }
              },
              required: ['questions', 'educationalRationale', 'attribution', 'limitations']
            },
            context: {
              type: 'object',
              properties: {
                writingStage: { type: 'string' },
                academicLevel: { type: 'string' },
                learningObjectives: { type: 'array', items: { type: 'string' } },
                studentProfile: { type: 'object' }
              },
              required: ['writingStage', 'academicLevel']
            }
          },
          required: ['aiResponse', 'context']
        }
      },
      {
        name: 'assess_blooms_taxonomy',
        description: 'Analyzes questions for Bloom\'s taxonomy cognitive levels',
        inputSchema: {
          type: 'object',
          properties: {
            questions: { type: 'array', items: { type: 'string' } },
            targetLevel: { type: 'number', minimum: 1, maximum: 6 },
            academicLevel: { type: 'string' }
          },
          required: ['questions']
        }
      },
      {
        name: 'check_dependency_risk',
        description: 'Assesses risk of AI dependency based on usage patterns',
        inputSchema: {
          type: 'object',
          properties: {
            interactionPattern: {
              type: 'object',
              properties: {
                frequency: { type: 'number' },
                requestTypes: { type: 'array', items: { type: 'string' } },
                reflectionQuality: { type: 'number' },
                independentWorkRatio: { type: 'number' }
              },
              required: ['frequency', 'requestTypes']
            },
            studentProfile: { type: 'object' }
          },
          required: ['interactionPattern']
        }
      },
      {
        name: 'enforce_philosophy_principles',
        description: 'Validates AI responses against Scribe Tree educational philosophy',
        inputSchema: {
          type: 'object',
          properties: {
            response: { type: 'object' },
            principles: {
              type: 'object',
              properties: {
                questionsOnly: { type: 'boolean' },
                mandatoryReflection: { type: 'boolean' },
                progressiveAccess: { type: 'boolean' },
                transparentAttribution: { type: 'boolean' },
                independenceBuilding: { type: 'boolean' }
              }
            }
          },
          required: ['response']
        }
      },
      {
        name: 'validate_reflection_requirements',
        description: 'Ensures reflection requirements are appropriate for student profile',
        inputSchema: {
          type: 'object',
          properties: {
            response: {
              type: 'object',
              properties: {
                reflectionRequirements: { type: 'object' }
              }
            },
            studentProfile: { type: 'object' },
            previousReflections: { type: 'array', items: { type: 'object' } }
          },
          required: ['response', 'studentProfile']
        }
      },
      {
        name: 'generate_educational_rationale',
        description: 'Creates transparent educational rationale for AI actions',
        inputSchema: {
          type: 'object',
          properties: {
            aiAction: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                content: { type: 'array', items: { type: 'string' } },
                timing: { type: 'string' }
              },
              required: ['type', 'content']
            },
            context: { type: 'object' },
            educationalGoals: { type: 'array', items: { type: 'string' } }
          },
          required: ['aiAction', 'context']
        }
      },
      {
        name: 'analyze_question_educational_value',
        description: 'Deep analysis of individual question educational value',
        inputSchema: {
          type: 'object',
          properties: {
            question: { type: 'string' },
            context: { type: 'object' },
            learningObjectives: { type: 'array', items: { type: 'string' } }
          },
          required: ['question']
        }
      },
      {
        name: 'validate_progressive_access',
        description: 'Validates student AI access level changes',
        inputSchema: {
          type: 'object',
          properties: {
            currentAccessLevel: { type: 'string' },
            studentMetrics: {
              type: 'object',
              properties: {
                reflectionQualityAverage: { type: 'number' },
                independenceScore: { type: 'number' },
                consistencyScore: { type: 'number' },
                timeInCurrentLevel: { type: 'number' },
                totalInteractions: { type: 'number' },
                recentBreakthroughs: { type: 'number' },
                strugglingIndicators: { type: 'number' }
              }
            },
            proposedChange: { type: 'object' }
          },
          required: ['currentAccessLevel', 'studentMetrics']
        }
      }
    ]
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Type guard for args
    if (!args || typeof args !== 'object') {
      throw new Error(`Arguments are required for ${name}`);
    }

    // Cast args to any for easier access
    const toolArgs = args as any;

    switch (name) {
      case 'validate_bounded_enhancement':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await BoundedEnhancementValidator.validate(toolArgs.aiResponse, toolArgs.context),
                null,
                2
              )
            }
          ]
        };

      case 'assess_blooms_taxonomy':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await BloomsTaxonomyAnalyzer.analyze(toolArgs.questions, toolArgs.targetLevel, toolArgs.academicLevel),
                null,
                2
              )
            }
          ]
        };

      case 'check_dependency_risk':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await DependencyRiskDetector.assess(toolArgs.interactionPattern, toolArgs.studentProfile),
                null,
                2
              )
            }
          ]
        };

      case 'enforce_philosophy_principles':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await PhilosophyEnforcer.enforce(toolArgs.response, toolArgs.principles),
                null,
                2
              )
            }
          ]
        };

      case 'validate_reflection_requirements':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await ReflectionRequirementValidator.validate(
                  toolArgs.response, 
                  toolArgs.studentProfile, 
                  toolArgs.previousReflections
                ),
                null,
                2
              )
            }
          ]
        };

      case 'generate_educational_rationale':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await EducationalRationaleGenerator.generate(
                  toolArgs.aiAction, 
                  toolArgs.context, 
                  toolArgs.educationalGoals
                ),
                null,
                2
              )
            }
          ]
        };

      case 'analyze_question_educational_value':
        // This tool is implemented within BoundedEnhancementValidator
        const { QuestionQualityValidator } = await import('./validators/question-quality-validator.js');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await QuestionQualityValidator.assessEducationalValue(
                  toolArgs.question,
                  toolArgs.context
                ),
                null,
                2
              )
            }
          ]
        };

      case 'validate_progressive_access':
        // This tool is implemented within the progressive access validator
        const { ProgressiveAccessValidator } = await import('./validators/progressive-access-validator.js');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await ProgressiveAccessValidator.validate(
                  toolArgs.currentAccessLevel,
                  toolArgs.studentMetrics,
                  toolArgs.proposedChange
                ),
                null,
                2
              )
            }
          ]
        };

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Tool ${name} not found`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${errorMessage}`);
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Educational AI Validator MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});