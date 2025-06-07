// Template-based strategic conversation tools
import { v4 as uuidv4 } from 'uuid';
import { ToolResponse } from '../types/index.js';
import { TemplateEngine, CONVERSATION_TEMPLATES } from '../templates/conversationTemplates.js';
import { ConversationTools } from './conversationTools.js';
import { StorageAdapter } from '../storage/StorageAdapter.js';

export class TemplateTools {
  private templateEngine: TemplateEngine;
  private conversationTools: ConversationTools;

  constructor(private storage: StorageAdapter) {
    this.templateEngine = new TemplateEngine();
    this.conversationTools = new ConversationTools(storage);
  }

  async listConversationTemplates(): Promise<ToolResponse> {
    try {
      const templates = this.templateEngine.listTemplates();
      
      const templateSummaries = templates.map(template => ({
        id: template.id,
        name: template.name,
        type: template.type,
        description: template.description,
        purpose: template.context.purpose,
        typicalTriggers: template.context.typicalTriggers,
        expectedOutcomes: template.context.expectedOutcomes
      }));

      return {
        success: true,
        data: templateSummaries,
        message: `Found ${templates.length} strategic conversation templates`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to list conversation templates: ${error}`
      };
    }
  }

  async getConversationTemplate(args: { templateId: string }): Promise<ToolResponse> {
    try {
      const template = this.templateEngine.getTemplate(args.templateId);
      
      if (!template) {
        return {
          success: false,
          error: `Template with ID ${args.templateId} not found`
        };
      }

      return {
        success: true,
        data: template,
        message: `Retrieved template: ${template.name}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get conversation template: ${error}`
      };
    }
  }

  async startTemplatedConversation(args: {
    templateId: string;
    title: string;
    context: {
      technicalMilestone?: string;
      businessTrigger?: string;
      marketEvent?: string;
      urgency?: 'low' | 'medium' | 'high' | 'critical';
      [key: string]: any;
    };
    participants?: string[];
  }): Promise<ToolResponse> {
    try {
      const template = this.templateEngine.getTemplate(args.templateId);
      
      if (!template) {
        return {
          success: false,
          error: `Template with ID ${args.templateId} not found`
        };
      }

      // Start the conversation using the base conversation tools
      const conversationResult = await this.conversationTools.startStrategySession({
        type: template.type,
        title: args.title,
        context: args.context,
        participants: args.participants
      });

      if (!conversationResult.success) {
        return conversationResult;
      }

      const conversation = conversationResult.data;
      
      // Generate template structure for this conversation
      const templateStructure = this.templateEngine.generateTemplateStructure(
        args.templateId, 
        args.context
      );

      // Add template-specific key questions
      if (templateStructure) {
        await this.conversationTools.updateConversationSummary({
          conversationId: conversation.id,
          summary: `Strategic conversation started using ${template.name} template. 
          
Template Purpose: ${template.context.purpose}

Key Areas to Address:
${templateStructure.sections.map(section => `- ${section.title}: ${section.description}`).join('\n')}`,
          keyQuestions: templateStructure.keyQuestions,
          status: 'active'
        });
      }

      return {
        success: true,
        data: {
          conversation,
          template: {
            id: template.id,
            name: template.name,
            structure: templateStructure
          }
        },
        message: `Templated conversation started successfully using ${template.name}. Conversation ID: ${conversation.id}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to start templated conversation: ${error}`
      };
    }
  }

  async applyTemplateGuidance(args: {
    conversationId: string;
    templateId: string;
    sectionIndex: number;
    context?: any;
  }): Promise<ToolResponse> {
    try {
      const template = this.templateEngine.getTemplate(args.templateId);
      
      if (!template) {
        return {
          success: false,
          error: `Template with ID ${args.templateId} not found`
        };
      }

      const section = template.templateStructure.sections[args.sectionIndex];
      if (!section) {
        return {
          success: false,
          error: `Section ${args.sectionIndex} not found in template`
        };
      }

      const guidance = {
        sectionTitle: section.title,
        description: section.description,
        guidingQuestions: section.guidingQuestions,
        expectedOutputs: section.expectedOutputs,
        suggestedInsightCategories: template.suggestedInsightCategories
      };

      return {
        success: true,
        data: guidance,
        message: `Template guidance provided for section: ${section.title}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to apply template guidance: ${error}`
      };
    }
  }

  async generateConversationReport(args: {
    conversationId: string;
    templateId?: string;
    includeTemplate?: boolean;
  }): Promise<ToolResponse> {
    try {
      // Get the conversation
      const conversationResult = await this.conversationTools.getConversation({
        conversationId: args.conversationId
      });

      if (!conversationResult.success) {
        return conversationResult;
      }

      const conversation = conversationResult.data;
      
      // Generate structured report
      const report = {
        conversation: {
          title: conversation.title,
          type: conversation.type,
          timestamp: conversation.timestamp,
          status: conversation.status,
          participants: conversation.participants
        },
        context: conversation.context,
        summary: conversation.conversationSummary,
        keyQuestions: conversation.keyQuestions,
        insights: {
          total: conversation.insights.length,
          byCategory: this.groupInsightsByCategory(conversation.insights),
          highImpact: conversation.insights.filter((i: any) => i.impact === 'critical' || i.impact === 'high')
        },
        decisions: {
          total: conversation.decisions.length,
          byStatus: this.groupDecisionsByStatus(conversation.decisions),
          pending: conversation.decisions.filter((d: any) => d.status === 'pending')
        },
        actionItems: {
          total: conversation.actionItems.length,
          byStatus: this.groupActionItemsByStatus(conversation.actionItems),
          byPriority: this.groupActionItemsByPriority(conversation.actionItems),
          overdue: this.getOverdueActionItems(conversation.actionItems)
        }
      };

      // Add template analysis if requested
      if (args.includeTemplate && args.templateId) {
        const template = this.templateEngine.getTemplate(args.templateId);
        if (template) {
          const templateAnalysis = this.analyzeTemplateCompletion(conversation, template);
          (report as any)['templateAnalysis'] = templateAnalysis;
        }
      }

      return {
        success: true,
        data: report,
        message: `Generated comprehensive report for conversation: ${conversation.title}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate conversation report: ${error}`
      };
    }
  }

  private groupInsightsByCategory(insights: any[]) {
    const grouped: Record<string, number> = {};
    insights.forEach((insight: any) => {
      grouped[insight.category] = (grouped[insight.category] || 0) + 1;
    });
    return grouped;
  }

  private groupDecisionsByStatus(decisions: any[]) {
    const grouped: Record<string, number> = {};
    decisions.forEach((decision: any) => {
      grouped[decision.status] = (grouped[decision.status] || 0) + 1;
    });
    return grouped;
  }

  private groupActionItemsByStatus(actionItems: any[]) {
    const grouped: Record<string, number> = {};
    actionItems.forEach(item => {
      grouped[item.status] = (grouped[item.status] || 0) + 1;
    });
    return grouped;
  }

  private groupActionItemsByPriority(actionItems: any[]) {
    const grouped: Record<string, number> = {};
    actionItems.forEach(item => {
      grouped[item.priority] = (grouped[item.priority] || 0) + 1;
    });
    return grouped;
  }

  private getOverdueActionItems(actionItems: any[]) {
    const now = new Date();
    return actionItems.filter(item => {
      const dueDate = new Date(item.dueDate);
      return dueDate < now && item.status !== 'completed';
    });
  }

  private analyzeTemplateCompletion(conversation: any, template: any) {
    const sections = template.templateStructure.sections;
    const insights = conversation.insights;
    const decisions = conversation.decisions;
    
    const completion = {
      sectionsAddressed: 0,
      keyQuestionsAnswered: 0,
      expectedOutputsGenerated: 0,
      overallCompleteness: 0
    };

    // Analyze how well the conversation followed the template
    sections.forEach((section: any) => {
      const sectionKeywords = this.extractKeywords(section.title + ' ' + section.description);
      const relevantInsights = insights.filter((insight: any) => 
        this.hasKeywordOverlap(insight.content, sectionKeywords)
      );
      
      if (relevantInsights.length > 0) {
        completion.sectionsAddressed++;
      }
    });

    // Calculate completion percentages
    completion.overallCompleteness = Math.round(
      (completion.sectionsAddressed / sections.length) * 100
    );

    return {
      completion,
      recommendations: this.generateTemplateRecommendations(conversation, template, completion)
    };
  }

  private extractKeywords(text: string): string[] {
    return text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['that', 'this', 'with', 'from', 'they', 'have', 'will'].includes(word));
  }

  private hasKeywordOverlap(text: string, keywords: string[]): boolean {
    const textLower = text.toLowerCase();
    return keywords.some(keyword => textLower.includes(keyword));
  }

  private generateTemplateRecommendations(conversation: any, template: any, completion: any): string[] {
    const recommendations: string[] = [];
    
    if (completion.overallCompleteness < 50) {
      recommendations.push('Consider revisiting template sections that haven\'t been fully addressed');
    }
    
    if (conversation.decisions.length === 0) {
      recommendations.push('No strategic decisions have been documented - consider what decisions need to be made');
    }
    
    if (conversation.actionItems.length === 0) {
      recommendations.push('No action items have been created - identify concrete next steps');
    }
    
    const pendingItems = conversation.actionItems.filter((item: any) => item.status === 'pending');
    if (pendingItems.length > 5) {
      recommendations.push('Large number of pending action items - consider prioritizing or consolidating');
    }

    return recommendations;
  }
}