// Integration tools for connecting with existing insights and reflections workflow
import { v4 as uuidv4 } from 'uuid';
import { ToolResponse } from '../types/index.js';
import { InsightsIntegration, ExtractedInsight, BusinessImplication } from '../integrations/insightsIntegration.js';
import { StorageAdapter } from '../storage/StorageAdapter.js';

export class IntegrationTools {
  private insightsIntegration: InsightsIntegration;

  constructor(private storage: StorageAdapter, projectRoot?: string) {
    this.insightsIntegration = new InsightsIntegration(projectRoot);
  }

  async extractInsightsFromFiles(args: {
    includeInsights?: boolean;
    includeReflections?: boolean;
    minBusinessRelevance?: number;
  } = {}): Promise<ToolResponse> {
    try {
      const {
        includeInsights = true,
        includeReflections = true,
        minBusinessRelevance = 50
      } = args;

      const extractedInsights: ExtractedInsight[] = [];

      // Process insights files
      if (includeInsights) {
        const insightFiles = await this.insightsIntegration.readInsightFiles();
        
        for (const file of insightFiles) {
          const insights = this.insightsIntegration.extractStrategicInsights(file.content, file.filename);
          extractedInsights.push(...insights);
        }
      }

      // Process reflection files
      if (includeReflections) {
        const reflectionFiles = await this.insightsIntegration.readReflectionFiles();
        
        for (const file of reflectionFiles) {
          const insights = this.insightsIntegration.extractStrategicInsights(file.content, file.filename);
          extractedInsights.push(...insights);
        }
      }

      // Filter by business relevance
      const relevantInsights = extractedInsights.filter(
        insight => insight.businessRelevance >= minBusinessRelevance
      );

      // Sort by business relevance (highest first)
      relevantInsights.sort((a, b) => b.businessRelevance - a.businessRelevance);

      const summary = {
        totalExtracted: extractedInsights.length,
        relevantInsights: relevantInsights.length,
        byCategory: this.groupInsightsByCategory(relevantInsights),
        bySource: this.groupInsightsBySource(relevantInsights),
        highValue: relevantInsights.filter(i => i.businessRelevance >= 80).length
      };

      return {
        success: true,
        data: {
          insights: relevantInsights,
          summary
        },
        message: `Extracted ${relevantInsights.length} business-relevant insights from ${includeInsights ? 'insights' : ''}${includeInsights && includeReflections ? ' and ' : ''}${includeReflections ? 'reflections' : ''} files`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to extract insights from files: ${error}`
      };
    }
  }

  async generateBusinessImplications(args: {
    minBusinessRelevance?: number;
    includeAlignmentMappings?: boolean;
  } = {}): Promise<ToolResponse> {
    try {
      const { minBusinessRelevance = 60, includeAlignmentMappings = true } = args;

      // First extract insights
      const extractResult = await this.extractInsightsFromFiles({
        includeInsights: true,
        includeReflections: true,
        minBusinessRelevance
      });

      if (!extractResult.success) {
        return extractResult;
      }

      const insights = extractResult.data.insights as ExtractedInsight[];

      // Generate business implications
      const implications = await this.insightsIntegration.generateBusinessImplications(insights);

      // Generate alignment mappings if requested
      let alignmentMappings: any[] = [];
      if (includeAlignmentMappings) {
        alignmentMappings = await this.insightsIntegration.createAlignmentMappings(insights);
      }

      const analysis = {
        totalInsights: insights.length,
        businessImplications: implications.length,
        alignmentMappings: alignmentMappings.length,
        keyFindings: this.summarizeKeyFindings(implications),
        strategicRecommendations: this.generateStrategicRecommendations(implications, insights)
      };

      return {
        success: true,
        data: {
          implications,
          alignmentMappings,
          analysis,
          sourceInsights: insights.slice(0, 10) // Include top 10 insights for reference
        },
        message: `Generated ${implications.length} business implications from technical and educational insights`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate business implications: ${error}`
      };
    }
  }

  async linkInsightToConversation(args: {
    conversationId: string;
    insightContent: string;
    category: 'competitive-advantage' | 'market-opportunity' | 'technical-capability' | 'business-model' | 'risk-mitigation' | 'resource-optimization';
    impact: 'critical' | 'high' | 'medium' | 'low';
    sourceFile?: string;
    businessRelevance?: number;
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

      const strategicInsight = {
        id: insightId,
        content: args.insightContent,
        category: args.category,
        impact: args.impact,
        evidence: args.sourceFile ? [args.sourceFile] : [],
        actionable: true,
        timestamp,
        linkedInsights: [],
        metadata: {
          sourceType: 'extracted-insight',
          businessRelevance: args.businessRelevance || 75,
          extractedFrom: args.sourceFile
        }
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
        message: `Linked insight from ${args.sourceFile || 'extracted content'} to conversation: ${conversation.title}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to link insight to conversation: ${error}`
      };
    }
  }

  async createInsightBasedConversation(args: {
    title: string;
    type: 'technical-milestone-review' | 'market-analysis' | 'competitive-strategy';
    sourceInsights: string[]; // Insight contents to base conversation on
    context?: {
      technicalMilestone?: string;
      businessTrigger?: string;
      marketEvent?: string;
    };
  }): Promise<ToolResponse> {
    try {
      // Extract insights first to understand what we're working with
      const extractResult = await this.extractInsightsFromFiles({
        includeInsights: true,
        includeReflections: true,
        minBusinessRelevance: 50
      });

      if (!extractResult.success) {
        return extractResult;
      }

      const allInsights = extractResult.data.insights as ExtractedInsight[];
      
      // Find insights that match the provided content
      const relevantInsights = allInsights.filter(insight =>
        args.sourceInsights.some(content => 
          insight.content.toLowerCase().includes(content.toLowerCase()) ||
          content.toLowerCase().includes(insight.content.toLowerCase())
        )
      );

      if (relevantInsights.length === 0) {
        return {
          success: false,
          error: 'No matching insights found for the provided content'
        };
      }

      // Create conversation
      const conversationId = uuidv4();
      const timestamp = new Date().toISOString();

      const conversation = {
        id: conversationId,
        type: args.type,
        title: args.title,
        timestamp,
        participants: ['Strategic CTO', 'Insights Integration'],
        context: {
          ...args.context,
          basedOnInsights: true,
          insightSources: relevantInsights.map(i => i.source)
        },
        insights: [],
        decisions: [],
        actionItems: [],
        nextReview: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        conversationSummary: `Strategic conversation based on extracted insights from ${relevantInsights.length} sources:\n${relevantInsights.map(i => `- ${i.source}`).join('\n')}`,
        keyQuestions: this.generateInsightBasedQuestions(relevantInsights, args.type),
        status: 'active' as const
      };

      // Save to storage
      const data = await this.storage.load();

      // Add insights to conversation
      for (const extractedInsight of relevantInsights) {
        const insightId = uuidv4();
        const strategicInsight = {
          id: insightId,
          content: extractedInsight.content,
          category: extractedInsight.suggestedBusinessCategory || 'technical-capability',
          impact: this.mapBusinessRelevanceToImpact(extractedInsight.businessRelevance),
          evidence: [extractedInsight.source],
          actionable: extractedInsight.businessRelevance > 70,
          timestamp,
          linkedInsights: []
        } as any;

        (conversation.insights as any[]).push(strategicInsight);
        // Add to global insights collection
        data.insights[insightId] = strategicInsight;
      }

      data.conversations[conversationId] = conversation as any;
      
      data.metadata.totalConversations = Object.keys(data.conversations).length;
      data.metadata.totalInsights = Object.keys(data.insights).length;
      data.metadata.lastUpdated = timestamp;

      await this.storage.save(data);

      return {
        success: true,
        data: {
          conversation,
          baseInsights: relevantInsights,
          analysis: {
            insightsIncluded: relevantInsights.length,
            averageBusinessRelevance: Math.round(
              relevantInsights.reduce((sum, i) => sum + i.businessRelevance, 0) / relevantInsights.length
            ),
            categoriesRepresented: [...new Set(relevantInsights.map(i => i.category))],
            sourceFiles: [...new Set(relevantInsights.map(i => i.source))]
          }
        },
        message: `Created strategic conversation based on ${relevantInsights.length} extracted insights`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create insight-based conversation: ${error}`
      };
    }
  }

  private groupInsightsByCategory(insights: ExtractedInsight[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    insights.forEach(insight => {
      grouped[insight.category] = (grouped[insight.category] || 0) + 1;
    });
    return grouped;
  }

  private groupInsightsBySource(insights: ExtractedInsight[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    insights.forEach(insight => {
      grouped[insight.source] = (grouped[insight.source] || 0) + 1;
    });
    return grouped;
  }

  private summarizeKeyFindings(implications: BusinessImplication[]): string[] {
    const findings: string[] = [];
    
    if (implications.length === 0) return ['No significant business implications identified'];

    const competitiveAdvantages = implications.map(i => i.competitiveAdvantage).filter(Boolean);
    const marketOpportunities = implications.map(i => i.marketOpportunity).filter(Boolean);
    const technicalPatterns = [...new Set(implications.map(i => i.technicalPattern))];

    if (technicalPatterns.length > 0) {
      findings.push(`${technicalPatterns.length} key technical patterns identified: ${technicalPatterns.slice(0, 3).join(', ')}`);
    }

    if (competitiveAdvantages.length > 0) {
      findings.push(`Strong competitive positioning through privacy-by-design and bounded enhancement philosophy`);
    }

    if (marketOpportunities.length > 0) {
      findings.push(`Market opportunities in enterprise education, privacy-conscious institutions, and AI-responsible learning`);
    }

    return findings;
  }

  private generateStrategicRecommendations(implications: BusinessImplication[], insights: ExtractedInsight[]): string[] {
    const recommendations: string[] = [];
    
    const highValueInsights = insights.filter(i => i.businessRelevance >= 80);
    const technicalInsights = insights.filter(i => i.category === 'technical-pattern');
    const educationalInsights = insights.filter(i => i.category === 'educational-insight');

    if (highValueInsights.length > 0) {
      recommendations.push(`Prioritize communication of ${highValueInsights.length} high-value capabilities to market`);
    }

    if (technicalInsights.length > 0) {
      recommendations.push('Leverage technical architecture advantages (microservices, privacy-by-design) in enterprise sales');
    }

    if (educationalInsights.length > 0) {
      recommendations.push('Position bounded enhancement philosophy as key differentiator in educational AI market');
    }

    // Add specific recommendations based on implications
    const privacyImplications = implications.filter(i => 
      i.technicalPattern.toLowerCase().includes('privacy') ||
      i.competitiveAdvantage.toLowerCase().includes('privacy')
    );

    if (privacyImplications.length > 0) {
      recommendations.push('Lead marketing with privacy-first messaging for institutional customers');
    }

    const architectureImplications = implications.filter(i =>
      i.technicalPattern.toLowerCase().includes('microservices') ||
      i.technicalPattern.toLowerCase().includes('architecture')
    );

    if (architectureImplications.length > 0) {
      recommendations.push('Emphasize enterprise scalability and reliability in sales materials');
    }

    return recommendations.length > 0 ? recommendations : ['Continue developing and documenting strategic capabilities'];
  }

  private generateInsightBasedQuestions(insights: ExtractedInsight[], conversationType: string): string[] {
    const questions: string[] = [];
    
    const categories = [...new Set(insights.map(i => i.category))];
    const avgRelevance = insights.reduce((sum, i) => sum + i.businessRelevance, 0) / insights.length;

    // Base questions on conversation type
    if (conversationType === 'technical-milestone-review') {
      questions.push('How do these technical achievements change our competitive position?');
      questions.push('What revenue opportunities do these capabilities unlock?');
      questions.push('How should we communicate these advancements to customers?');
    } else if (conversationType === 'market-analysis') {
      questions.push('What market opportunities do these insights reveal?');
      questions.push('How do our capabilities compare to market demands?');
      questions.push('What customer segments should we prioritize?');
    } else if (conversationType === 'competitive-strategy') {
      questions.push('What competitive advantages do these insights highlight?');
      questions.push('How can we strengthen our market differentiation?');
      questions.push('What threats should we prepare for?');
    }

    // Add category-specific questions
    if (categories.includes('technical-pattern')) {
      questions.push('How can we leverage our technical patterns for business advantage?');
    }
    if (categories.includes('educational-insight')) {
      questions.push('How does our educational philosophy differentiate us in the market?');
    }
    if (avgRelevance > 75) {
      questions.push('Which of these high-value insights should we prioritize for business impact?');
    }

    return questions;
  }

  private mapBusinessRelevanceToImpact(relevance: number): 'critical' | 'high' | 'medium' | 'low' {
    if (relevance >= 85) return 'critical';
    if (relevance >= 70) return 'high';
    if (relevance >= 55) return 'medium';
    return 'low';
  }
}