// Strategic conversation management tools
import { v4 as uuidv4 } from 'uuid';
import { 
  StrategyConversation, 
  StrategyInsight, 
  StrategyDecision, 
  ActionItem,
  StrategyConversationType,
  ToolResponse 
} from '../types/index.js';
import { StorageAdapter } from '../storage/StorageAdapter.js';

export class ConversationTools {
  constructor(private storage: StorageAdapter) {}

  async startStrategySession(args: {
    type: StrategyConversationType;
    title: string;
    context?: {
      technicalMilestone?: string;
      businessTrigger?: string;
      marketEvent?: string;
      urgency?: 'low' | 'medium' | 'high' | 'critical';
    };
    participants?: string[];
  }): Promise<ToolResponse> {
    try {
      const conversationId = uuidv4();
      const timestamp = new Date().toISOString();

      const conversation: StrategyConversation = {
        id: conversationId,
        type: args.type,
        title: args.title,
        timestamp,
        participants: args.participants || ['Strategic CTO'],
        context: {
          technicalMilestone: args.context?.technicalMilestone,
          businessTrigger: args.context?.businessTrigger,
          marketEvent: args.context?.marketEvent,
          urgency: args.context?.urgency || 'medium'
        },
        insights: [],
        decisions: [],
        actionItems: [],
        nextReview: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
        conversationSummary: '',
        keyQuestions: [],
        status: 'draft'
      };

      const data = await this.storage.load();
      data.conversations[conversationId] = conversation;
      data.metadata.totalConversations = Object.keys(data.conversations).length;
      data.metadata.lastUpdated = timestamp;

      await this.storage.save(data);

      return {
        success: true,
        data: conversation,
        message: `Strategic conversation '${args.title}' started successfully. Use the conversation ID ${conversationId} to add insights, decisions, and action items.`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to start strategy session: ${error}`
      };
    }
  }

  async captureStrategicInsight(args: {
    conversationId: string;
    insight: string;
    category: 'competitive-advantage' | 'market-opportunity' | 'technical-capability' | 'business-model' | 'risk-mitigation' | 'resource-optimization';
    impact: 'critical' | 'high' | 'medium' | 'low';
    evidence?: string[];
    actionable?: boolean;
    linkedInsights?: string[];
  }): Promise<ToolResponse> {
    try {
      const data = await this.storage.load();
      const conversation = data.conversations[args.conversationId];

      if (!conversation) {
        return {
          success: false,
          error: `Conversation with ID ${args.conversationId} not found`
        };
      }

      const insightId = uuidv4();
      const timestamp = new Date().toISOString();

      const strategicInsight: StrategyInsight = {
        id: insightId,
        content: args.insight,
        category: args.category,
        impact: args.impact,
        evidence: args.evidence || [],
        actionable: args.actionable || false,
        timestamp,
        linkedInsights: args.linkedInsights
      };

      // Add to conversation
      conversation.insights.push(strategicInsight);
      
      // Add to global insights collection
      data.insights[insightId] = strategicInsight;
      
      // Update metadata
      data.metadata.totalInsights = Object.keys(data.insights).length;
      data.metadata.lastUpdated = timestamp;

      await this.storage.save(data);

      return {
        success: true,
        data: strategicInsight,
        message: `Strategic insight captured successfully with ${args.impact} impact`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to capture strategic insight: ${error}`
      };
    }
  }

  async trackStrategicDecision(args: {
    conversationId: string;
    decision: string;
    rationale: string;
    tradeoffs?: string[];
    reviewTriggers?: string[];
    timeline?: string;
    owner?: string;
  }): Promise<ToolResponse> {
    try {
      const data = await this.storage.load();
      const conversation = data.conversations[args.conversationId];

      if (!conversation) {
        return {
          success: false,
          error: `Conversation with ID ${args.conversationId} not found`
        };
      }

      const decisionId = uuidv4();
      const timestamp = new Date().toISOString();

      const strategicDecision: StrategyDecision = {
        id: decisionId,
        decision: args.decision,
        rationale: args.rationale,
        tradeoffs: args.tradeoffs || [],
        reviewTriggers: args.reviewTriggers || [],
        timeline: args.timeline,
        owner: args.owner,
        status: 'pending',
        timestamp
      };

      conversation.decisions.push(strategicDecision);
      data.metadata.lastUpdated = timestamp;

      await this.storage.save(data);

      return {
        success: true,
        data: strategicDecision,
        message: `Strategic decision tracked successfully. Review triggers: ${args.reviewTriggers?.join(', ') || 'None specified'}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to track strategic decision: ${error}`
      };
    }
  }

  async addActionItem(args: {
    conversationId: string;
    description: string;
    owner: string;
    dueDate: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    linkedGoals?: string[];
  }): Promise<ToolResponse> {
    try {
      const data = await this.storage.load();
      const conversation = data.conversations[args.conversationId];

      if (!conversation) {
        return {
          success: false,
          error: `Conversation with ID ${args.conversationId} not found`
        };
      }

      const actionItemId = uuidv4();
      const timestamp = new Date().toISOString();

      const actionItem: ActionItem = {
        id: actionItemId,
        description: args.description,
        owner: args.owner,
        dueDate: args.dueDate,
        priority: args.priority,
        status: 'pending',
        linkedGoals: args.linkedGoals,
        timestamp
      };

      conversation.actionItems.push(actionItem);
      data.metadata.lastUpdated = timestamp;

      await this.storage.save(data);

      return {
        success: true,
        data: actionItem,
        message: `Action item added successfully. Due: ${args.dueDate}, Owner: ${args.owner}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to add action item: ${error}`
      };
    }
  }

  async updateConversationSummary(args: {
    conversationId: string;
    summary: string;
    keyQuestions?: string[];
    status?: 'draft' | 'active' | 'completed' | 'archived';
  }): Promise<ToolResponse> {
    try {
      const data = await this.storage.load();
      const conversation = data.conversations[args.conversationId];

      if (!conversation) {
        return {
          success: false,
          error: `Conversation with ID ${args.conversationId} not found`
        };
      }

      conversation.conversationSummary = args.summary;
      if (args.keyQuestions) {
        conversation.keyQuestions = args.keyQuestions;
      }
      if (args.status) {
        conversation.status = args.status;
      }

      data.metadata.lastUpdated = new Date().toISOString();
      await this.storage.save(data);

      return {
        success: true,
        data: conversation,
        message: `Conversation summary updated successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update conversation summary: ${error}`
      };
    }
  }

  async getConversation(args: { conversationId: string }): Promise<ToolResponse> {
    try {
      const data = await this.storage.load();
      const conversation = data.conversations[args.conversationId];

      if (!conversation) {
        return {
          success: false,
          error: `Conversation with ID ${args.conversationId} not found`
        };
      }

      return {
        success: true,
        data: conversation
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get conversation: ${error}`
      };
    }
  }

  async listConversations(args: {
    type?: StrategyConversationType;
    status?: 'draft' | 'active' | 'completed' | 'archived';
    limit?: number;
  } = {}): Promise<ToolResponse> {
    try {
      const data = await this.storage.load();
      let conversations = Object.values(data.conversations);

      // Apply filters
      if (args.type) {
        conversations = conversations.filter(conv => conv.type === args.type);
      }
      if (args.status) {
        conversations = conversations.filter(conv => conv.status === args.status);
      }

      // Sort by timestamp (most recent first)
      conversations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Apply limit
      if (args.limit) {
        conversations = conversations.slice(0, args.limit);
      }

      return {
        success: true,
        data: conversations,
        message: `Found ${conversations.length} conversations`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to list conversations: ${error}`
      };
    }
  }
}