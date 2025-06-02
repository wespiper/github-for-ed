// Core data models for Scribe Tree Strategic CTO MCP Server

import { z } from 'zod';

// Strategic Conversation Types
export const StrategyConversationTypeSchema = z.enum([
  'market-analysis',
  'product-roadmap', 
  'competitive-strategy',
  'monetization',
  'go-to-market',
  'technical-milestone-review',
  'business-goal-assessment'
]);

export type StrategyConversationType = z.infer<typeof StrategyConversationTypeSchema>;

// Strategic Insight Schema
export const StrategyInsightSchema = z.object({
  id: z.string(),
  content: z.string(),
  category: z.enum([
    'competitive-advantage',
    'market-opportunity', 
    'technical-capability',
    'business-model',
    'risk-mitigation',
    'resource-optimization'
  ]),
  impact: z.enum(['critical', 'high', 'medium', 'low']),
  evidence: z.array(z.string()),
  actionable: z.boolean(),
  timestamp: z.string(),
  linkedInsights: z.array(z.string()).optional(),
  linkedReflections: z.array(z.string()).optional()
});

export type StrategyInsight = z.infer<typeof StrategyInsightSchema>;

// Strategic Decision Schema
export const StrategyDecisionSchema = z.object({
  id: z.string(),
  decision: z.string(),
  rationale: z.string(),
  tradeoffs: z.array(z.string()),
  reviewTriggers: z.array(z.string()),
  timeline: z.string().optional(),
  owner: z.string().optional(),
  status: z.enum(['pending', 'approved', 'implemented', 'reviewed']),
  timestamp: z.string(),
  outcomes: z.array(z.string()).optional()
});

export type StrategyDecision = z.infer<typeof StrategyDecisionSchema>;

// Action Item Schema
export const ActionItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  owner: z.string(),
  dueDate: z.string(),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  status: z.enum(['pending', 'in-progress', 'completed', 'blocked']),
  blockers: z.array(z.string()).optional(),
  linkedGoals: z.array(z.string()).optional(),
  timestamp: z.string()
});

export type ActionItem = z.infer<typeof ActionItemSchema>;

// Strategic Conversation Schema
export const StrategyConversationSchema = z.object({
  id: z.string(),
  type: StrategyConversationTypeSchema,
  title: z.string(),
  timestamp: z.string(),
  participants: z.array(z.string()),
  context: z.object({
    technicalMilestone: z.string().optional(),
    businessTrigger: z.string().optional(),
    marketEvent: z.string().optional(),
    relatedInsights: z.array(z.string()).optional(),
    relatedReflections: z.array(z.string()).optional(),
    urgency: z.enum(['low', 'medium', 'high', 'critical']).optional()
  }),
  insights: z.array(StrategyInsightSchema),
  decisions: z.array(StrategyDecisionSchema),
  actionItems: z.array(ActionItemSchema),
  nextReview: z.string(),
  conversationSummary: z.string(),
  keyQuestions: z.array(z.string()),
  status: z.enum(['draft', 'active', 'completed', 'archived'])
});

export type StrategyConversation = z.infer<typeof StrategyConversationSchema>;

// Business Goal Types
export const GoalMetricSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['revenue', 'growth', 'efficiency', 'quality', 'satisfaction']),
  target: z.number(),
  current: z.number(),
  unit: z.string(),
  timeframe: z.string(),
  lastUpdated: z.string()
});

export type GoalMetric = z.infer<typeof GoalMetricSchema>;

export const MilestoneSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  targetDate: z.string(),
  status: z.enum(['pending', 'in-progress', 'completed', 'delayed', 'cancelled']),
  completionDate: z.string().optional(),
  blockers: z.array(z.string()).optional(),
  linkedTechnicalWork: z.array(z.string()).optional()
});

export type Milestone = z.infer<typeof MilestoneSchema>;

export const ProgressSnapshotSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  completion: z.number(), // 0-100
  confidence: z.number(), // 0-100
  notes: z.string(),
  blockers: z.array(z.string()),
  achievements: z.array(z.string()),
  risks: z.array(z.string())
});

export type ProgressSnapshot = z.infer<typeof ProgressSnapshotSchema>;

// Business Goal Schema
export const BusinessGoalSchema = z.object({
  id: z.string(),
  category: z.enum(['revenue', 'product', 'market', 'technical', 'operational']),
  title: z.string(),
  description: z.string(),
  metrics: z.array(GoalMetricSchema),
  milestones: z.array(MilestoneSchema),
  dependencies: z.object({
    technicalFeatures: z.array(z.string()),
    businessPrerequisites: z.array(z.string()),
    externalFactors: z.array(z.string())
  }),
  status: z.enum(['planning', 'active', 'blocked', 'completed', 'paused']),
  confidence: z.number(), // 0-100
  lastUpdated: z.string(),
  linkedInsights: z.array(z.string()),
  progressHistory: z.array(ProgressSnapshotSchema),
  owner: z.string(),
  stakeholders: z.array(z.string())
});

export type BusinessGoal = z.infer<typeof BusinessGoalSchema>;

// Development-Business Alignment Types
export const AlignmentMappingSchema = z.object({
  id: z.string(),
  technicalFeature: z.string(),
  codebaseEvidence: z.array(z.string()), // File paths, implementation details
  businessValue: z.object({
    primaryGoals: z.array(z.string()),
    impact: z.enum(['critical', 'high', 'medium', 'low']),
    revenueImplication: z.number(),
    userImpact: z.string(),
    competitiveAdvantage: z.string()
  }),
  progressMetrics: z.object({
    technicalCompletion: z.number(), // 0-100
    businessReadiness: z.number(), // 0-100
    marketValidation: z.number() // 0-100
  }),
  insights: z.array(z.string()),
  lastUpdated: z.string()
});

export type AlignmentMapping = z.infer<typeof AlignmentMappingSchema>;

// Storage Schema for the entire strategic database
export const StrategicDatabaseSchema = z.object({
  conversations: z.record(z.string(), StrategyConversationSchema),
  goals: z.record(z.string(), BusinessGoalSchema),
  alignments: z.record(z.string(), AlignmentMappingSchema),
  insights: z.record(z.string(), StrategyInsightSchema),
  metadata: z.object({
    version: z.string(),
    lastUpdated: z.string(),
    totalConversations: z.number(),
    totalGoals: z.number(),
    totalInsights: z.number()
  })
});

export type StrategicDatabase = z.infer<typeof StrategicDatabaseSchema>;

// Tool Request/Response Types
export interface ToolRequest {
  name: string;
  arguments: Record<string, any>;
}

export interface ToolResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}