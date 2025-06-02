#!/usr/bin/env node

// Scribe Tree Strategic CTO MCP Server
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { JSONStorageAdapter } from './storage/StorageAdapter.js';
import { ConversationTools } from './tools/conversationTools.js';
import { GoalTools } from './tools/goalTools.js';
import { TemplateTools } from './tools/templateTools.js';
import { IntegrationTools } from './tools/integrationTools.js';
import { IntelligenceTools } from './tools/intelligenceTools.js';
import { AnalyticsTools } from './tools/analyticsTools.js';
import { ForecastingTools } from './tools/forecastingTools.js';
import { CollaborationTools } from './tools/collaborationTools.js';
import { ReportingTools } from './tools/reportingTools.js';

// Initialize storage and tools
const storage = new JSONStorageAdapter('./strategic-data.json');
const conversationTools = new ConversationTools(storage);
const goalTools = new GoalTools(storage);
const templateTools = new TemplateTools(storage);
const integrationTools = new IntegrationTools(storage);
const intelligenceTools = new IntelligenceTools(storage);
const analyticsTools = new AnalyticsTools(storage);
const forecastingTools = new ForecastingTools(storage);
const collaborationTools = new CollaborationTools(storage);
const reportingTools = new ReportingTools(storage);

// Create MCP server
const server = new Server(
  {
    name: 'scribe-tree-strategic-cto',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
const TOOLS = {
  // Strategic Conversation Tools
  start_strategy_session: {
    name: 'start_strategy_session',
    description: 'Initialize a new strategic conversation with structured context',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['market-analysis', 'product-roadmap', 'competitive-strategy', 'monetization', 'go-to-market', 'technical-milestone-review', 'business-goal-assessment'],
          description: 'Type of strategic conversation'
        },
        title: {
          type: 'string',
          description: 'Title of the strategic conversation'
        },
        context: {
          type: 'object',
          properties: {
            technicalMilestone: { type: 'string', description: 'Related technical milestone or achievement' },
            businessTrigger: { type: 'string', description: 'Business event that triggered this conversation' },
            marketEvent: { type: 'string', description: 'Market event or signal that prompted discussion' },
            urgency: { 
              type: 'string', 
              enum: ['low', 'medium', 'high', 'critical'],
              description: 'Urgency level of the strategic conversation'
            }
          },
          description: 'Context that triggered this strategic conversation'
        },
        participants: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of conversation participants'
        }
      },
      required: ['type', 'title']
    }
  },

  capture_strategic_insight: {
    name: 'capture_strategic_insight',
    description: 'Record a strategic insight with categorization and impact assessment',
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: { type: 'string', description: 'ID of the conversation this insight belongs to' },
        insight: { type: 'string', description: 'The strategic insight content' },
        category: {
          type: 'string',
          enum: ['competitive-advantage', 'market-opportunity', 'technical-capability', 'business-model', 'risk-mitigation', 'resource-optimization'],
          description: 'Category of strategic insight'
        },
        impact: {
          type: 'string',
          enum: ['critical', 'high', 'medium', 'low'],
          description: 'Impact level of this insight'
        },
        evidence: {
          type: 'array',
          items: { type: 'string' },
          description: 'Evidence supporting this insight'
        },
        actionable: { type: 'boolean', description: 'Whether this insight leads to specific actions' },
        linkedInsights: {
          type: 'array',
          items: { type: 'string' },
          description: 'IDs of related insights'
        }
      },
      required: ['conversationId', 'insight', 'category', 'impact']
    }
  },

  track_strategic_decision: {
    name: 'track_strategic_decision',
    description: 'Document a strategic decision with rationale and review triggers',
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: { type: 'string', description: 'ID of the conversation this decision belongs to' },
        decision: { type: 'string', description: 'The strategic decision made' },
        rationale: { type: 'string', description: 'Reasoning behind the decision' },
        tradeoffs: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tradeoffs considered in this decision'
        },
        reviewTriggers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Events that should trigger review of this decision'
        },
        timeline: { type: 'string', description: 'Expected timeline for decision implementation' },
        owner: { type: 'string', description: 'Person responsible for decision implementation' }
      },
      required: ['conversationId', 'decision', 'rationale']
    }
  },

  add_action_item: {
    name: 'add_action_item',
    description: 'Add an action item to a strategic conversation',
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: { type: 'string', description: 'ID of the conversation' },
        description: { type: 'string', description: 'Description of the action item' },
        owner: { type: 'string', description: 'Person responsible for this action' },
        dueDate: { type: 'string', description: 'Due date for the action item (ISO string)' },
        priority: {
          type: 'string',
          enum: ['critical', 'high', 'medium', 'low'],
          description: 'Priority level of the action item'
        },
        linkedGoals: {
          type: 'array',
          items: { type: 'string' },
          description: 'IDs of business goals this action supports'
        }
      },
      required: ['conversationId', 'description', 'owner', 'dueDate', 'priority']
    }
  },

  update_conversation_summary: {
    name: 'update_conversation_summary',
    description: 'Update the summary and key questions for a strategic conversation',
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: { type: 'string', description: 'ID of the conversation to update' },
        summary: { type: 'string', description: 'Summary of the strategic conversation' },
        keyQuestions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Key questions arising from this conversation'
        },
        status: {
          type: 'string',
          enum: ['draft', 'active', 'completed', 'archived'],
          description: 'Current status of the conversation'
        }
      },
      required: ['conversationId', 'summary']
    }
  },

  get_conversation: {
    name: 'get_conversation',
    description: 'Retrieve a specific strategic conversation',
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: { type: 'string', description: 'ID of the conversation to retrieve' }
      },
      required: ['conversationId']
    }
  },

  list_conversations: {
    name: 'list_conversations',
    description: 'List strategic conversations with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['market-analysis', 'product-roadmap', 'competitive-strategy', 'monetization', 'go-to-market', 'technical-milestone-review', 'business-goal-assessment'],
          description: 'Filter by conversation type'
        },
        status: {
          type: 'string',
          enum: ['draft', 'active', 'completed', 'archived'],
          description: 'Filter by conversation status'
        },
        limit: { type: 'number', description: 'Maximum number of conversations to return' }
      }
    }
  },

  // Business Goal Tools
  create_business_goal: {
    name: 'create_business_goal',
    description: 'Create a new business goal with metrics and dependencies',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['revenue', 'product', 'market', 'technical', 'operational'],
          description: 'Category of business goal'
        },
        title: { type: 'string', description: 'Title of the business goal' },
        description: { type: 'string', description: 'Detailed description of the goal' },
        owner: { type: 'string', description: 'Person responsible for this goal' },
        stakeholders: {
          type: 'array',
          items: { type: 'string' },
          description: 'Stakeholders involved in this goal'
        },
        dependencies: {
          type: 'object',
          properties: {
            technicalFeatures: {
              type: 'array',
              items: { type: 'string' },
              description: 'Technical features this goal depends on'
            },
            businessPrerequisites: {
              type: 'array',
              items: { type: 'string' },
              description: 'Business prerequisites for this goal'
            },
            externalFactors: {
              type: 'array',
              items: { type: 'string' },
              description: 'External factors affecting this goal'
            }
          },
          description: 'Dependencies for achieving this goal'
        },
        initialMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Name of the metric' },
              type: {
                type: 'string',
                enum: ['revenue', 'growth', 'efficiency', 'quality', 'satisfaction'],
                description: 'Type of metric'
              },
              target: { type: 'number', description: 'Target value for the metric' },
              unit: { type: 'string', description: 'Unit of measurement' },
              timeframe: { type: 'string', description: 'Timeframe for achieving target' }
            },
            required: ['name', 'type', 'target', 'unit', 'timeframe']
          },
          description: 'Initial metrics for this goal'
        }
      },
      required: ['category', 'title', 'description', 'owner']
    }
  },

  update_goal_progress: {
    name: 'update_goal_progress',
    description: 'Update progress on a business goal with metrics and confidence',
    inputSchema: {
      type: 'object',
      properties: {
        goalId: { type: 'string', description: 'ID of the goal to update' },
        metricUpdates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metricId: { type: 'string', description: 'ID of the metric to update' },
              currentValue: { type: 'number', description: 'Current value of the metric' }
            },
            required: ['metricId', 'currentValue']
          },
          description: 'Updates to goal metrics'
        },
        confidence: { 
          type: 'number', 
          minimum: 0, 
          maximum: 100,
          description: 'Confidence level in achieving this goal (0-100)' 
        },
        notes: { type: 'string', description: 'Notes about current progress' },
        blockers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Current blockers preventing progress'
        },
        achievements: {
          type: 'array',
          items: { type: 'string' },
          description: 'Recent achievements toward this goal'
        },
        risks: {
          type: 'array',
          items: { type: 'string' },
          description: 'Risks that could impact goal achievement'
        }
      },
      required: ['goalId']
    }
  },

  add_milestone: {
    name: 'add_milestone',
    description: 'Add a milestone to a business goal',
    inputSchema: {
      type: 'object',
      properties: {
        goalId: { type: 'string', description: 'ID of the goal to add milestone to' },
        title: { type: 'string', description: 'Title of the milestone' },
        description: { type: 'string', description: 'Description of the milestone' },
        targetDate: { type: 'string', description: 'Target completion date (ISO string)' },
        linkedTechnicalWork: {
          type: 'array',
          items: { type: 'string' },
          description: 'Technical work items linked to this milestone'
        }
      },
      required: ['goalId', 'title', 'description', 'targetDate']
    }
  },

  get_goal: {
    name: 'get_goal',
    description: 'Retrieve a specific business goal with current completion status',
    inputSchema: {
      type: 'object',
      properties: {
        goalId: { type: 'string', description: 'ID of the goal to retrieve' }
      },
      required: ['goalId']
    }
  },

  list_goals: {
    name: 'list_goals',
    description: 'List business goals with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['revenue', 'product', 'market', 'technical', 'operational'],
          description: 'Filter by goal category'
        },
        status: {
          type: 'string',
          enum: ['planning', 'active', 'blocked', 'completed', 'paused'],
          description: 'Filter by goal status'
        },
        owner: { type: 'string', description: 'Filter by goal owner' }
      }
    }
  },

  get_goal_analytics: {
    name: 'get_goal_analytics',
    description: 'Get analytics summary for all business goals',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },

  // Template Tools
  list_conversation_templates: {
    name: 'list_conversation_templates',
    description: 'List available strategic conversation templates',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },

  get_conversation_template: {
    name: 'get_conversation_template',
    description: 'Get details of a specific conversation template',
    inputSchema: {
      type: 'object',
      properties: {
        templateId: { type: 'string', description: 'ID of the template to retrieve' }
      },
      required: ['templateId']
    }
  },

  start_templated_conversation: {
    name: 'start_templated_conversation',
    description: 'Start a strategic conversation using a predefined template',
    inputSchema: {
      type: 'object',
      properties: {
        templateId: { type: 'string', description: 'ID of the template to use' },
        title: { type: 'string', description: 'Title for the conversation' },
        context: {
          type: 'object',
          properties: {
            technicalMilestone: { type: 'string', description: 'Related technical milestone' },
            businessTrigger: { type: 'string', description: 'Business event trigger' },
            marketEvent: { type: 'string', description: 'Market event trigger' },
            urgency: { 
              type: 'string', 
              enum: ['low', 'medium', 'high', 'critical'],
              description: 'Urgency level' 
            }
          },
          description: 'Context for the templated conversation'
        },
        participants: {
          type: 'array',
          items: { type: 'string' },
          description: 'Conversation participants'
        }
      },
      required: ['templateId', 'title']
    }
  },

  apply_template_guidance: {
    name: 'apply_template_guidance',
    description: 'Get guidance for a specific section of a conversation template',
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: { type: 'string', description: 'ID of the conversation' },
        templateId: { type: 'string', description: 'ID of the template' },
        sectionIndex: { type: 'number', description: 'Index of the template section' },
        context: { type: 'object', description: 'Additional context for guidance' }
      },
      required: ['conversationId', 'templateId', 'sectionIndex']
    }
  },

  generate_conversation_report: {
    name: 'generate_conversation_report',
    description: 'Generate a comprehensive report for a strategic conversation',
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: { type: 'string', description: 'ID of the conversation' },
        templateId: { type: 'string', description: 'Template ID for template-specific analysis' },
        includeTemplate: { type: 'boolean', description: 'Include template completion analysis' }
      },
      required: ['conversationId']
    }
  },

  // Integration Tools
  extract_insights_from_files: {
    name: 'extract_insights_from_files',
    description: 'Extract strategic insights from .claude/insights and .claude/reflections files',
    inputSchema: {
      type: 'object',
      properties: {
        includeInsights: { type: 'boolean', description: 'Include .claude/insights files' },
        includeReflections: { type: 'boolean', description: 'Include .claude/reflections files' },
        minBusinessRelevance: { 
          type: 'number', 
          minimum: 0, 
          maximum: 100,
          description: 'Minimum business relevance score (0-100)' 
        }
      }
    }
  },

  generate_business_implications: {
    name: 'generate_business_implications',
    description: 'Generate business implications from extracted technical and educational insights',
    inputSchema: {
      type: 'object',
      properties: {
        minBusinessRelevance: { 
          type: 'number', 
          minimum: 0, 
          maximum: 100,
          description: 'Minimum business relevance score' 
        },
        includeAlignmentMappings: { 
          type: 'boolean', 
          description: 'Include technical-business alignment mappings' 
        }
      }
    }
  },

  link_insight_to_conversation: {
    name: 'link_insight_to_conversation',
    description: 'Link an extracted insight to a strategic conversation',
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: { type: 'string', description: 'ID of the conversation' },
        insightContent: { type: 'string', description: 'Content of the insight' },
        category: {
          type: 'string',
          enum: ['competitive-advantage', 'market-opportunity', 'technical-capability', 'business-model', 'risk-mitigation', 'resource-optimization'],
          description: 'Strategic category for the insight'
        },
        impact: {
          type: 'string',
          enum: ['critical', 'high', 'medium', 'low'],
          description: 'Impact level of the insight'
        },
        sourceFile: { type: 'string', description: 'Source file where insight was extracted' },
        businessRelevance: { 
          type: 'number', 
          minimum: 0, 
          maximum: 100,
          description: 'Business relevance score' 
        }
      },
      required: ['conversationId', 'insightContent', 'category', 'impact']
    }
  },

  create_insight_based_conversation: {
    name: 'create_insight_based_conversation',
    description: 'Create a strategic conversation based on extracted insights',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title for the conversation' },
        type: {
          type: 'string',
          enum: ['technical-milestone-review', 'market-analysis', 'competitive-strategy'],
          description: 'Type of strategic conversation'
        },
        sourceInsights: {
          type: 'array',
          items: { type: 'string' },
          description: 'Insight contents to base conversation on'
        },
        context: {
          type: 'object',
          properties: {
            technicalMilestone: { type: 'string' },
            businessTrigger: { type: 'string' },
            marketEvent: { type: 'string' }
          },
          description: 'Additional context for the conversation'
        }
      },
      required: ['title', 'type', 'sourceInsights']
    }
  },

  // Intelligence Tools
  create_technical_milestone: {
    name: 'create_technical_milestone',
    description: 'Create a technical milestone with business impact analysis',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the technical milestone' },
        description: { type: 'string', description: 'Detailed description of the milestone' },
        category: {
          type: 'string',
          enum: ['architecture', 'feature', 'performance', 'security', 'integration', 'infrastructure'],
          description: 'Category of the milestone'
        },
        plannedDate: { type: 'string', description: 'Planned completion date (ISO string)' },
        effort: { type: 'number', description: 'Estimated effort in person-hours' },
        complexity: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Complexity level of the milestone'
        },
        codebaseChanges: {
          type: 'array',
          items: { type: 'string' },
          description: 'Files or components that will be changed'
        },
        performanceImpact: {
          type: 'object',
          properties: {
            metric: { type: 'string', description: 'Performance metric being improved' },
            improvement: { type: 'string', description: 'Description of improvement' },
            measurement: { type: 'string', description: 'How improvement will be measured' }
          },
          description: 'Expected performance impact'
        },
        architecturalImpact: { type: 'string', description: 'Impact on overall architecture' },
        risksMitigated: {
          type: 'array',
          items: { type: 'string' },
          description: 'Risks that this milestone will mitigate'
        },
        businessContext: {
          type: 'object',
          properties: {
            strategicImportance: { 
              type: 'number', 
              minimum: 0, 
              maximum: 100,
              description: 'Strategic importance score (0-100)' 
            },
            customerImpact: { type: 'string', description: 'How this impacts customers' },
            revenueImplication: { type: 'number', description: 'Projected revenue impact' },
            competitiveAdvantage: { type: 'string', description: 'Competitive advantage gained' },
            marketTiming: {
              type: 'string',
              enum: ['early', 'competitive', 'late', 'critical'],
              description: 'Market timing assessment'
            }
          },
          description: 'Business context and impact'
        }
      },
      required: ['name', 'description', 'category', 'plannedDate', 'effort', 'complexity', 'codebaseChanges']
    }
  },

  update_milestone_progress: {
    name: 'update_milestone_progress',
    description: 'Update progress on a technical milestone',
    inputSchema: {
      type: 'object',
      properties: {
        milestoneId: { type: 'string', description: 'ID of the milestone to update' },
        completionPercentage: { 
          type: 'number', 
          minimum: 0, 
          maximum: 100,
          description: 'Completion percentage (0-100)' 
        },
        blockers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Current blockers preventing progress'
        },
        achievements: {
          type: 'array',
          items: { type: 'string' },
          description: 'Recent achievements or milestones reached'
        },
        nextSteps: {
          type: 'array',
          items: { type: 'string' },
          description: 'Planned next steps'
        },
        estimatedCompletionDate: { 
          type: 'string', 
          description: 'Updated estimated completion date (ISO string)' 
        },
        confidenceLevel: { 
          type: 'number', 
          minimum: 0, 
          maximum: 100,
          description: 'Confidence in completion estimate (0-100)' 
        },
        businessImpactUpdate: { 
          type: 'string', 
          description: 'Update on business impact or changes' 
        }
      },
      required: ['milestoneId', 'completionPercentage']
    }
  },

  analyze_development_business_alignment: {
    name: 'analyze_development_business_alignment',
    description: 'Analyze alignment between technical milestones and business goals',
    inputSchema: {
      type: 'object',
      properties: {
        includeCorrelations: { 
          type: 'boolean', 
          description: 'Include correlation analysis between milestones and goals' 
        },
        includeProjections: { 
          type: 'boolean', 
          description: 'Include business impact projections' 
        },
        includePredictiveInsights: { 
          type: 'boolean', 
          description: 'Include predictive insights and forecasting' 
        }
      }
    }
  },

  generate_business_impact_forecast: {
    name: 'generate_business_impact_forecast',
    description: 'Generate business impact forecast based on technical milestone completion',
    inputSchema: {
      type: 'object',
      properties: {
        timeframe: {
          type: 'string',
          enum: ['3-months', '6-months', '12-months', '24-months'],
          description: 'Forecast timeframe'
        },
        confidence: {
          type: 'string',
          enum: ['conservative', 'realistic', 'optimistic'],
          description: 'Confidence level for projections'
        },
        includeScenarios: { 
          type: 'boolean', 
          description: 'Include multiple scenario analysis' 
        }
      },
      required: ['timeframe']
    }
  },

  identify_strategic_opportunities: {
    name: 'identify_strategic_opportunities',
    description: 'Identify strategic opportunities based on technical capabilities and market timing',
    inputSchema: {
      type: 'object',
      properties: {
        analysisType: {
          type: 'string',
          enum: ['technical-gaps', 'market-timing', 'competitive-advantage', 'all'],
          description: 'Type of opportunity analysis to perform'
        },
        minImpact: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Minimum impact level for opportunities'
        }
      }
    }
  },

  get_milestone_business_alignment: {
    name: 'get_milestone_business_alignment',
    description: 'Get comprehensive business alignment analysis for a specific milestone',
    inputSchema: {
      type: 'object',
      properties: {
        milestoneId: { type: 'string', description: 'ID of the milestone to analyze' }
      },
      required: ['milestoneId']
    }
  },

  // Analytics Tools
  run_comprehensive_analysis: {
    name: 'run_comprehensive_analysis',
    description: 'Run comprehensive strategic analysis including patterns, trends, goal health, and insights',
    inputSchema: {
      type: 'object',
      properties: {
        includePatterns: { type: 'boolean', description: 'Include pattern recognition analysis' },
        includeTrends: { type: 'boolean', description: 'Include trend analysis' },
        includeGoalHealth: { type: 'boolean', description: 'Include goal health assessment' },
        includeInsights: { type: 'boolean', description: 'Include strategic insight generation' },
        analysisDepth: {
          type: 'string',
          enum: ['basic', 'standard', 'comprehensive'],
          description: 'Depth of analysis to perform'
        }
      }
    }
  },

  generate_strategic_dashboard: {
    name: 'generate_strategic_dashboard',
    description: 'Generate strategic dashboard with key metrics and visualizations',
    inputSchema: {
      type: 'object',
      properties: {
        timeframe: {
          type: 'string',
          enum: ['30-days', '90-days', '6-months', '12-months'],
          description: 'Timeframe for dashboard analysis'
        },
        focus: {
          type: 'string',
          enum: ['overview', 'risks', 'opportunities', 'performance'],
          description: 'Primary focus area for dashboard'
        }
      }
    }
  },

  generate_goal_health_report: {
    name: 'generate_goal_health_report',
    description: 'Generate comprehensive goal health report with velocity and forecasting',
    inputSchema: {
      type: 'object',
      properties: {
        goalId: { type: 'string', description: 'Specific goal ID to analyze (optional - analyzes all if not provided)' },
        includeForecasting: { type: 'boolean', description: 'Include completion forecasting' },
        includeRecommendations: { type: 'boolean', description: 'Include actionable recommendations' }
      }
    }
  },

  generate_pattern_analysis_report: {
    name: 'generate_pattern_analysis_report',
    description: 'Generate detailed pattern analysis report with actionable insights',
    inputSchema: {
      type: 'object',
      properties: {
        patternTypes: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['efficiency', 'velocity', 'correlation', 'risk', 'opportunity', 'trend']
          },
          description: 'Types of patterns to analyze'
        },
        confidenceThreshold: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          description: 'Minimum confidence threshold for patterns'
        },
        includeActionablePlan: { type: 'boolean', description: 'Include actionable implementation plan' }
      }
    }
  },

  generate_executive_insights_brief: {
    name: 'generate_executive_insights_brief',
    description: 'Generate executive-level insights brief for strategic decision making',
    inputSchema: {
      type: 'object',
      properties: {
        timeframe: {
          type: 'string',
          enum: ['30-days', '90-days', '6-months'],
          description: 'Timeframe for insights analysis'
        },
        focusAreas: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['competitive-advantage', 'market-timing', 'operational-efficiency', 'strategic-risks', 'all']
          },
          description: 'Areas of strategic focus'
        }
      }
    }
  },

  // Forecasting Tools
  generate_scenario_forecast: {
    name: 'generate_scenario_forecast',
    description: 'Generate multi-scenario forecasts with balanced optimism/pessimism (25%/50%/25%)',
    inputSchema: {
      type: 'object',
      properties: {
        timeframe: {
          type: 'string',
          enum: ['3-months', '6-months', '12-months', '18-months', '24-months'],
          description: 'Forecast timeframe'
        },
        focusArea: {
          type: 'string',
          enum: ['revenue', 'growth', 'market-share', 'technical', 'all'],
          description: 'Primary focus area for forecast'
        },
        includeDisruption: {
          type: 'boolean',
          description: 'Include market disruption scenarios'
        }
      },
      required: ['timeframe']
    }
  },

  identify_strategy_gaps: {
    name: 'identify_strategy_gaps',
    description: 'Identify gaps in current strategy across multiple dimensions',
    inputSchema: {
      type: 'object',
      properties: {
        marketContext: {
          type: 'array',
          items: { type: 'string' },
          description: 'Market context factors to consider'
        },
        minSeverity: {
          type: 'string',
          enum: ['minor', 'moderate', 'significant', 'critical'],
          description: 'Minimum severity level to report'
        }
      }
    }
  },

  generate_competitive_intelligence: {
    name: 'generate_competitive_intelligence',
    description: 'Generate comprehensive competitive intelligence analysis',
    inputSchema: {
      type: 'object',
      properties: {
        marketSegment: { type: 'string', description: 'Market segment to analyze' },
        marketSize: { type: 'number', description: 'Total addressable market size' },
        competitors: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of specific competitors to analyze'
        },
        trends: {
          type: 'array',
          items: { type: 'string' },
          description: 'Market trends to consider'
        }
      }
    }
  },

  run_what_if_analysis: {
    name: 'run_what_if_analysis',
    description: 'Run what-if scenarios to test strategic assumptions',
    inputSchema: {
      type: 'object',
      properties: {
        scenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Scenario name' },
              description: { type: 'string', description: 'Scenario description' },
              assumptions: {
                type: 'object',
                properties: {
                  completionRateChange: { type: 'number', description: '% change in milestone completion rate' },
                  revenueRealizationChange: { type: 'number', description: '% change in revenue realization' },
                  competitorActions: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of competitor actions'
                  },
                  marketChanges: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of market changes'
                  }
                }
              }
            },
            required: ['name', 'description', 'assumptions']
          },
          description: 'Scenarios to analyze'
        },
        timeframe: {
          type: 'string',
          enum: ['6-months', '12-months', '24-months'],
          description: 'Analysis timeframe'
        }
      },
      required: ['scenarios', 'timeframe']
    }
  },

  generate_confidence_intervals: {
    name: 'generate_confidence_intervals',
    description: 'Generate confidence intervals for key metrics with balanced projections',
    inputSchema: {
      type: 'object',
      properties: {
        metric: {
          type: 'string',
          enum: ['revenue', 'customer-acquisition', 'market-share', 'milestone-completion'],
          description: 'Metric to analyze'
        },
        timeframes: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['3-months', '6-months', '12-months']
          },
          description: 'Timeframes to analyze'
        },
        confidenceLevels: {
          type: 'array',
          items: { type: 'number' },
          description: 'Confidence levels (e.g., [50, 75, 90])'
        }
      },
      required: ['metric', 'timeframes']
    }
  },

  // Strategy Review Automation Tools
  evaluate_strategy_review_triggers: {
    name: 'evaluate_strategy_review_triggers',
    description: 'Evaluate automated strategy review triggers based on milestones, metrics, and events',
    inputSchema: {
      type: 'object',
      properties: {
        includeCompetitiveContext: { type: 'boolean', description: 'Include competitive threat analysis' },
        includeStrategyGaps: { type: 'boolean', description: 'Include strategy gap analysis' },
        marketEvents: {
          type: 'array',
          items: { type: 'string' },
          description: 'Market events to consider'
        }
      }
    }
  },

  configure_strategy_review_trigger: {
    name: 'configure_strategy_review_trigger',
    description: 'Create, update, enable, or disable strategy review triggers',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['create', 'update', 'enable', 'disable'],
          description: 'Action to perform'
        },
        triggerId: { type: 'string', description: 'ID of trigger to modify (for update/enable/disable)' },
        triggerConfig: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Trigger name' },
            type: {
              type: 'string',
              enum: ['milestone-based', 'time-based', 'metric-based', 'event-based', 'threshold-based'],
              description: 'Type of trigger'
            },
            enabled: { type: 'boolean', description: 'Whether trigger is enabled' },
            conditions: {
              type: 'array',
              items: { type: 'object' },
              description: 'Trigger conditions'
            },
            actions: {
              type: 'array',
              items: { type: 'object' },
              description: 'Actions to take when triggered'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              description: 'Trigger priority'
            }
          },
          description: 'Trigger configuration (for create/update)'
        }
      },
      required: ['action']
    }
  },

  get_strategy_reviews: {
    name: 'get_strategy_reviews',
    description: 'Get strategy reviews with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'in-progress', 'completed', 'cancelled'],
          description: 'Filter by review status'
        },
        includeQuestions: { type: 'boolean', description: 'Include review questions in response' }
      }
    }
  },

  complete_strategy_review: {
    name: 'complete_strategy_review',
    description: 'Complete a strategy review with decisions and next steps',
    inputSchema: {
      type: 'object',
      properties: {
        reviewId: { type: 'string', description: 'ID of review to complete' },
        decisions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decision: { type: 'string', description: 'Decision made' },
              rationale: { type: 'string', description: 'Reasoning for decision' },
              impact: {
                type: 'string',
                enum: ['high', 'medium', 'low'],
                description: 'Impact level'
              },
              implementation: { type: 'string', description: 'Implementation plan' },
              owner: { type: 'string', description: 'Person responsible' },
              deadline: { type: 'string', description: 'Implementation deadline' }
            },
            required: ['decision', 'rationale', 'impact', 'implementation', 'owner', 'deadline']
          },
          description: 'Strategic decisions made'
        },
        nextSteps: {
          type: 'array',
          items: { type: 'string' },
          description: 'Next steps to take'
        }
      },
      required: ['reviewId', 'decisions', 'nextSteps']
    }
  },

  // Collaboration Tools
  create_collaboration_session: {
    name: 'create_collaboration_session',
    description: 'Create a new strategic collaboration session for team planning',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the collaboration session' },
        description: { type: 'string', description: 'Description of the session' },
        type: {
          type: 'string',
          enum: ['planning', 'review', 'brainstorming', 'decision-making'],
          description: 'Type of collaboration session'
        },
        templateId: { type: 'string', description: 'Template to use for the session' },
        scheduled: { type: 'string', description: 'Scheduled date/time (ISO string)' },
        participants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Participant ID' },
              name: { type: 'string', description: 'Participant name' },
              role: {
                type: 'string',
                enum: ['strategist', 'technical-lead', 'product-owner', 'stakeholder', 'advisor'],
                description: 'Participant role'
              },
              email: { type: 'string', description: 'Email address' },
              attendance: {
                type: 'string',
                enum: ['confirmed', 'tentative', 'declined'],
                description: 'Attendance status'
              }
            },
            required: ['id', 'name', 'role']
          },
          description: 'Session participants'
        },
        moderator: { type: 'string', description: 'Session moderator' },
        sharedContext: {
          type: 'object',
          description: 'Shared context for the session'
        }
      },
      required: ['title', 'description', 'type', 'participants', 'moderator']
    }
  },

  add_session_contribution: {
    name: 'add_session_contribution',
    description: 'Add a contribution to an active collaboration session',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'ID of the collaboration session' },
        participantId: { type: 'string', description: 'ID of the participant making the contribution' },
        type: {
          type: 'string',
          enum: ['insight', 'question', 'suggestion', 'concern', 'data'],
          description: 'Type of contribution'
        },
        content: { type: 'string', description: 'Content of the contribution' },
        metadata: {
          type: 'object',
          properties: {
            category: { type: 'string', description: 'Category of the contribution' },
            importance: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              description: 'Importance level'
            },
            requiresFollowUp: { type: 'boolean', description: 'Whether this requires follow-up' }
          },
          description: 'Additional metadata'
        }
      },
      required: ['sessionId', 'participantId', 'type', 'content']
    }
  },

  record_session_decision: {
    name: 'record_session_decision',
    description: 'Record a strategic decision made during a collaboration session',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'ID of the collaboration session' },
        decision: { type: 'string', description: 'The decision made' },
        rationale: { type: 'string', description: 'Rationale for the decision' },
        implementation: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Person responsible for implementation' },
            deadline: { type: 'string', description: 'Implementation deadline' },
            successCriteria: {
              type: 'array',
              items: { type: 'string' },
              description: 'Success criteria'
            }
          },
          required: ['owner', 'deadline', 'successCriteria'],
          description: 'Implementation details'
        },
        risks: {
          type: 'array',
          items: { type: 'string' },
          description: 'Associated risks'
        },
        dependencies: {
          type: 'array',
          items: { type: 'string' },
          description: 'Dependencies'
        }
      },
      required: ['sessionId', 'decision', 'rationale', 'implementation']
    }
  },

  complete_collaboration_session: {
    name: 'complete_collaboration_session',
    description: 'Complete a collaboration session with summary and follow-up',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'ID of the session to complete' },
        keyDecisions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Key decisions made'
        },
        nextSteps: {
          type: 'array',
          items: { type: 'string' },
          description: 'Next steps to take'
        },
        followUp: {
          type: 'object',
          properties: {
            nextSession: { type: 'string', description: 'Next session date' },
            reviewDate: { type: 'string', description: 'Review date' },
            checkpoints: {
              type: 'array',
              items: { type: 'string' },
              description: 'Checkpoints to monitor'
            }
          },
          description: 'Follow-up actions'
        }
      },
      required: ['sessionId', 'keyDecisions', 'nextSteps']
    }
  },

  get_collaboration_session: {
    name: 'get_collaboration_session',
    description: 'Get details of a specific collaboration session',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'ID of the session to retrieve' }
      },
      required: ['sessionId']
    }
  },

  list_collaboration_sessions: {
    name: 'list_collaboration_sessions',
    description: 'List collaboration sessions with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['planning', 'review', 'brainstorming', 'decision-making'],
          description: 'Filter by session type'
        },
        status: {
          type: 'string',
          enum: ['scheduled', 'active', 'completed', 'cancelled'],
          description: 'Filter by session status'
        },
        participantId: { type: 'string', description: 'Filter by participant' }
      }
    }
  },

  // Reporting Tools
  generate_strategic_report: {
    name: 'generate_strategic_report',
    description: 'Generate comprehensive strategic reports with multiple sections and visualizations',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['executive-summary', 'detailed-analysis', 'board-presentation', 'investor-update', 'team-dashboard'],
          description: 'Type of strategic report'
        },
        templateId: { type: 'string', description: 'Template to use for the report' },
        periodStart: { type: 'string', description: 'Report period start date (ISO string)' },
        periodEnd: { type: 'string', description: 'Report period end date (ISO string)' },
        options: {
          type: 'object',
          properties: {
            format: {
              type: 'string',
              enum: ['markdown', 'html', 'pdf', 'json'],
              description: 'Report format'
            },
            includeConfidential: { type: 'boolean', description: 'Include confidential information' },
            recipients: {
              type: 'array',
              items: { type: 'string' },
              description: 'Report recipients'
            }
          },
          description: 'Report options'
        }
      },
      required: ['type', 'periodStart', 'periodEnd']
    }
  },

  get_strategic_report: {
    name: 'get_strategic_report',
    description: 'Retrieve a specific strategic report',
    inputSchema: {
      type: 'object',
      properties: {
        reportId: { type: 'string', description: 'ID of the report to retrieve' }
      },
      required: ['reportId']
    }
  },

  list_strategic_reports: {
    name: 'list_strategic_reports',
    description: 'List strategic reports with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['executive-summary', 'detailed-analysis', 'board-presentation', 'investor-update', 'team-dashboard'],
          description: 'Filter by report type'
        },
        startDate: { type: 'string', description: 'Filter reports generated after this date' },
        endDate: { type: 'string', description: 'Filter reports generated before this date' }
      }
    }
  },

  generate_quick_insights: {
    name: 'generate_quick_insights',
    description: 'Generate quick strategic insights for immediate decision support',
    inputSchema: {
      type: 'object',
      properties: {
        timeframe: {
          type: 'string',
          enum: ['7-days', '30-days', '90-days'],
          description: 'Timeframe for insights analysis'
        },
        focusAreas: {
          type: 'array',
          items: { type: 'string' },
          description: 'Areas to focus on for insights'
        }
      },
      required: ['timeframe']
    }
  },

  export_report_data: {
    name: 'export_report_data',
    description: 'Export strategic data in various formats',
    inputSchema: {
      type: 'object',
      properties: {
        reportId: { type: 'string', description: 'Specific report to export (optional)' },
        format: {
          type: 'string',
          enum: ['json', 'csv', 'markdown'],
          description: 'Export format'
        },
        includeRawData: { type: 'boolean', description: 'Include raw data in export' }
      },
      required: ['format']
    }
  },

  generate_dashboard_metrics: {
    name: 'generate_dashboard_metrics',
    description: 'Generate comprehensive dashboard metrics for strategic monitoring',
    inputSchema: {
      type: 'object',
      properties: {
        timeframe: {
          type: 'string',
          enum: ['30-days', '90-days', '6-months', '12-months'],
          description: 'Timeframe for metrics analysis'
        }
      },
      required: ['timeframe']
    }
  }
};

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.values(TOOLS)
  };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // Strategic Conversation Tools
      case 'start_strategy_session':
        return { content: [{ type: 'text', text: JSON.stringify(await conversationTools.startStrategySession(args as any), null, 2) }] };
      
      case 'capture_strategic_insight':
        return { content: [{ type: 'text', text: JSON.stringify(await conversationTools.captureStrategicInsight(args as any), null, 2) }] };
      
      case 'track_strategic_decision':
        return { content: [{ type: 'text', text: JSON.stringify(await conversationTools.trackStrategicDecision(args as any), null, 2) }] };
      
      case 'add_action_item':
        return { content: [{ type: 'text', text: JSON.stringify(await conversationTools.addActionItem(args as any), null, 2) }] };
      
      case 'update_conversation_summary':
        return { content: [{ type: 'text', text: JSON.stringify(await conversationTools.updateConversationSummary(args as any), null, 2) }] };
      
      case 'get_conversation':
        return { content: [{ type: 'text', text: JSON.stringify(await conversationTools.getConversation(args as any), null, 2) }] };
      
      case 'list_conversations':
        return { content: [{ type: 'text', text: JSON.stringify(await conversationTools.listConversations(args as any), null, 2) }] };

      // Business Goal Tools
      case 'create_business_goal':
        return { content: [{ type: 'text', text: JSON.stringify(await goalTools.createBusinessGoal(args as any), null, 2) }] };
      
      case 'update_goal_progress':
        return { content: [{ type: 'text', text: JSON.stringify(await goalTools.updateGoalProgress(args as any), null, 2) }] };
      
      case 'add_milestone':
        return { content: [{ type: 'text', text: JSON.stringify(await goalTools.addMilestone(args as any), null, 2) }] };
      
      case 'get_goal':
        return { content: [{ type: 'text', text: JSON.stringify(await goalTools.getGoal(args as any), null, 2) }] };
      
      case 'list_goals':
        return { content: [{ type: 'text', text: JSON.stringify(await goalTools.listGoals(args as any), null, 2) }] };
      
      case 'get_goal_analytics':
        return { content: [{ type: 'text', text: JSON.stringify(await goalTools.getGoalAnalytics(), null, 2) }] };

      // Template Tools
      case 'list_conversation_templates':
        return { content: [{ type: 'text', text: JSON.stringify(await templateTools.listConversationTemplates(), null, 2) }] };
      
      case 'get_conversation_template':
        return { content: [{ type: 'text', text: JSON.stringify(await templateTools.getConversationTemplate(args as any), null, 2) }] };
      
      case 'start_templated_conversation':
        return { content: [{ type: 'text', text: JSON.stringify(await templateTools.startTemplatedConversation(args as any), null, 2) }] };
      
      case 'apply_template_guidance':
        return { content: [{ type: 'text', text: JSON.stringify(await templateTools.applyTemplateGuidance(args as any), null, 2) }] };
      
      case 'generate_conversation_report':
        return { content: [{ type: 'text', text: JSON.stringify(await templateTools.generateConversationReport(args as any), null, 2) }] };

      // Integration Tools
      case 'extract_insights_from_files':
        return { content: [{ type: 'text', text: JSON.stringify(await integrationTools.extractInsightsFromFiles(args as any), null, 2) }] };
      
      case 'generate_business_implications':
        return { content: [{ type: 'text', text: JSON.stringify(await integrationTools.generateBusinessImplications(args as any), null, 2) }] };
      
      case 'link_insight_to_conversation':
        return { content: [{ type: 'text', text: JSON.stringify(await integrationTools.linkInsightToConversation(args as any), null, 2) }] };
      
      case 'create_insight_based_conversation':
        return { content: [{ type: 'text', text: JSON.stringify(await integrationTools.createInsightBasedConversation(args as any), null, 2) }] };

      // Intelligence Tools
      case 'create_technical_milestone':
        return { content: [{ type: 'text', text: JSON.stringify(await intelligenceTools.createTechnicalMilestone(args as any), null, 2) }] };
      
      case 'update_milestone_progress':
        return { content: [{ type: 'text', text: JSON.stringify(await intelligenceTools.updateMilestoneProgress(args as any), null, 2) }] };
      
      case 'analyze_development_business_alignment':
        return { content: [{ type: 'text', text: JSON.stringify(await intelligenceTools.analyzeDevelopmentBusinessAlignment(args as any), null, 2) }] };
      
      case 'generate_business_impact_forecast':
        return { content: [{ type: 'text', text: JSON.stringify(await intelligenceTools.generateBusinessImpactForecast(args as any), null, 2) }] };
      
      case 'identify_strategic_opportunities':
        return { content: [{ type: 'text', text: JSON.stringify(await intelligenceTools.identifyStrategicOpportunities(args as any), null, 2) }] };
      
      case 'get_milestone_business_alignment':
        return { content: [{ type: 'text', text: JSON.stringify(await intelligenceTools.getMilestoneBusinessAlignment(args as any), null, 2) }] };

      // Analytics Tools
      case 'run_comprehensive_analysis':
        return { content: [{ type: 'text', text: JSON.stringify(await analyticsTools.runComprehensiveAnalysis(args as any), null, 2) }] };
      
      case 'generate_strategic_dashboard':
        return { content: [{ type: 'text', text: JSON.stringify(await analyticsTools.generateStrategicDashboard(args as any), null, 2) }] };
      
      case 'generate_goal_health_report':
        return { content: [{ type: 'text', text: JSON.stringify(await analyticsTools.generateGoalHealthReport(args as any), null, 2) }] };
      
      case 'generate_pattern_analysis_report':
        return { content: [{ type: 'text', text: JSON.stringify(await analyticsTools.generatePatternAnalysisReport(args as any), null, 2) }] };
      
      case 'generate_executive_insights_brief':
        return { content: [{ type: 'text', text: JSON.stringify(await analyticsTools.generateExecutiveInsightsBrief(args as any), null, 2) }] };

      // Forecasting Tools
      case 'generate_scenario_forecast':
        return { content: [{ type: 'text', text: JSON.stringify(await forecastingTools.generateScenarioForecast(args as any), null, 2) }] };
      
      case 'identify_strategy_gaps':
        return { content: [{ type: 'text', text: JSON.stringify(await forecastingTools.identifyStrategyGaps(args as any), null, 2) }] };
      
      case 'generate_competitive_intelligence':
        return { content: [{ type: 'text', text: JSON.stringify(await forecastingTools.generateCompetitiveIntelligence(args as any), null, 2) }] };
      
      case 'run_what_if_analysis':
        return { content: [{ type: 'text', text: JSON.stringify(await forecastingTools.runWhatIfAnalysis(args as any), null, 2) }] };
      
      case 'generate_confidence_intervals':
        return { content: [{ type: 'text', text: JSON.stringify(await forecastingTools.generateConfidenceIntervals(args as any), null, 2) }] };

      // Strategy Review Automation Tools
      case 'evaluate_strategy_review_triggers':
        return { content: [{ type: 'text', text: JSON.stringify(await intelligenceTools.evaluateStrategyReviewTriggers(args as any), null, 2) }] };
      
      case 'configure_strategy_review_trigger':
        return { content: [{ type: 'text', text: JSON.stringify(await intelligenceTools.configureStrategyReviewTrigger(args as any), null, 2) }] };
      
      case 'get_strategy_reviews':
        return { content: [{ type: 'text', text: JSON.stringify(await intelligenceTools.getStrategyReviews(args as any), null, 2) }] };
      
      case 'complete_strategy_review':
        return { content: [{ type: 'text', text: JSON.stringify(await intelligenceTools.completeStrategyReview(args as any), null, 2) }] };

      // Collaboration Tools
      case 'create_collaboration_session':
        return { content: [{ type: 'text', text: JSON.stringify(await collaborationTools.createCollaborationSession(args as any), null, 2) }] };
      
      case 'add_session_contribution':
        return { content: [{ type: 'text', text: JSON.stringify(await collaborationTools.addSessionContribution(args as any), null, 2) }] };
      
      case 'record_session_decision':
        return { content: [{ type: 'text', text: JSON.stringify(await collaborationTools.recordSessionDecision(args as any), null, 2) }] };
      
      case 'complete_collaboration_session':
        return { content: [{ type: 'text', text: JSON.stringify(await collaborationTools.completeCollaborationSession(args as any), null, 2) }] };
      
      case 'get_collaboration_session':
        return { content: [{ type: 'text', text: JSON.stringify(await collaborationTools.getCollaborationSession(args as any), null, 2) }] };
      
      case 'list_collaboration_sessions':
        return { content: [{ type: 'text', text: JSON.stringify(await collaborationTools.listCollaborationSessions(args as any), null, 2) }] };

      // Reporting Tools
      case 'generate_strategic_report':
        return { content: [{ type: 'text', text: JSON.stringify(await reportingTools.generateStrategicReport(args as any), null, 2) }] };
      
      case 'get_strategic_report':
        return { content: [{ type: 'text', text: JSON.stringify(await reportingTools.getStrategicReport(args as any), null, 2) }] };
      
      case 'list_strategic_reports':
        return { content: [{ type: 'text', text: JSON.stringify(await reportingTools.listStrategicReports(args as any), null, 2) }] };
      
      case 'generate_quick_insights':
        return { content: [{ type: 'text', text: JSON.stringify(await reportingTools.generateQuickInsights(args as any), null, 2) }] };
      
      case 'export_report_data':
        return { content: [{ type: 'text', text: JSON.stringify(await reportingTools.exportReportData(args as any), null, 2) }] };
      
      case 'generate_dashboard_metrics':
        return { content: [{ type: 'text', text: JSON.stringify(await reportingTools.generateDashboardMetrics(args as any), null, 2) }] };

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new McpError(ErrorCode.InternalError, `Error executing tool ${name}: ${errorMessage}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Scribe Tree Strategic CTO MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});