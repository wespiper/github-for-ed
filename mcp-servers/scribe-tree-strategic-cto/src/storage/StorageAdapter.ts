// Storage adapter interface - designed for easy migration to PostgreSQL
import { StrategicDatabase, StrategyConversation, BusinessGoal, AlignmentMapping, StrategyInsight } from '../types/index.js';

export interface QueryFilter {
  type?: string;
  status?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
  limit?: number;
}

export interface StorageAdapter {
  // Core CRUD operations
  save(data: StrategicDatabase): Promise<void>;
  load(): Promise<StrategicDatabase>;
  
  // Strategic conversation queries
  findConversationsByType(type: string): Promise<StrategyConversation[]>;
  findConversationsByDateRange(from: string, to: string): Promise<StrategyConversation[]>;
  
  // Business goal queries
  getGoalsByStatus(status: string): Promise<BusinessGoal[]>;
  getGoalsByCategory(category: string): Promise<BusinessGoal[]>;
  
  // Insight queries
  searchInsights(query: string, category?: string): Promise<StrategyInsight[]>;
  getInsightsByImpact(impact: string): Promise<StrategyInsight[]>;
  
  // Alignment queries
  getAlignmentsByTechnicalFeature(feature: string): Promise<AlignmentMapping[]>;
  getAlignmentsByBusinessGoal(goalId: string): Promise<AlignmentMapping[]>;
  
  // Analytics queries (designed to work with both JSON and SQL)
  getConversationInsightCounts(): Promise<{conversationId: string, insightCount: number}[]>;
  getGoalProgressSummary(): Promise<{goalId: string, completion: number, confidence: number}[]>;
  getRecentActivity(days: number): Promise<{type: string, id: string, timestamp: string}[]>;
}

export class JSONStorageAdapter implements StorageAdapter {
  private dataPath: string;
  private cache: StrategicDatabase | null = null;

  constructor(dataPath: string = './strategic-data.json') {
    this.dataPath = dataPath;
  }

  async save(data: StrategicDatabase): Promise<void> {
    const fs = await import('fs/promises');
    await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));
    this.cache = data;
  }

  async load(): Promise<StrategicDatabase> {
    if (this.cache) {
      return this.cache;
    }

    try {
      const fs = await import('fs/promises');
      const fileContent = await fs.readFile(this.dataPath, 'utf-8');
      this.cache = JSON.parse(fileContent);
      return this.cache!;
    } catch (error) {
      // Return empty database if file doesn't exist
      const emptyDatabase: StrategicDatabase = {
        conversations: {},
        goals: {},
        alignments: {},
        insights: {},
        metadata: {
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
          totalConversations: 0,
          totalGoals: 0,
          totalInsights: 0
        }
      };
      await this.save(emptyDatabase);
      return emptyDatabase;
    }
  }

  async findConversationsByType(type: string): Promise<StrategyConversation[]> {
    const data = await this.load();
    return Object.values(data.conversations).filter(conv => conv.type === type);
  }

  async findConversationsByDateRange(from: string, to: string): Promise<StrategyConversation[]> {
    const data = await this.load();
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    return Object.values(data.conversations).filter(conv => {
      const convDate = new Date(conv.timestamp);
      return convDate >= fromDate && convDate <= toDate;
    });
  }

  async getGoalsByStatus(status: string): Promise<BusinessGoal[]> {
    const data = await this.load();
    return Object.values(data.goals).filter(goal => goal.status === status);
  }

  async getGoalsByCategory(category: string): Promise<BusinessGoal[]> {
    const data = await this.load();
    return Object.values(data.goals).filter(goal => goal.category === category);
  }

  async searchInsights(query: string, category?: string): Promise<StrategyInsight[]> {
    const data = await this.load();
    const searchTerm = query.toLowerCase();
    
    return Object.values(data.insights).filter(insight => {
      const matchesSearch = insight.content.toLowerCase().includes(searchTerm);
      const matchesCategory = !category || insight.category === category;
      return matchesSearch && matchesCategory;
    });
  }

  async getInsightsByImpact(impact: string): Promise<StrategyInsight[]> {
    const data = await this.load();
    return Object.values(data.insights).filter(insight => insight.impact === impact);
  }

  async getAlignmentsByTechnicalFeature(feature: string): Promise<AlignmentMapping[]> {
    const data = await this.load();
    const searchTerm = feature.toLowerCase();
    
    return Object.values(data.alignments).filter(alignment => 
      alignment.technicalFeature.toLowerCase().includes(searchTerm)
    );
  }

  async getAlignmentsByBusinessGoal(goalId: string): Promise<AlignmentMapping[]> {
    const data = await this.load();
    return Object.values(data.alignments).filter(alignment => 
      alignment.businessValue.primaryGoals.includes(goalId)
    );
  }

  async getConversationInsightCounts(): Promise<{conversationId: string, insightCount: number}[]> {
    const data = await this.load();
    
    return Object.values(data.conversations).map(conv => ({
      conversationId: conv.id,
      insightCount: conv.insights.length
    }));
  }

  async getGoalProgressSummary(): Promise<{goalId: string, completion: number, confidence: number}[]> {
    const data = await this.load();
    
    return Object.values(data.goals).map(goal => {
      const latestProgress = goal.progressHistory[goal.progressHistory.length - 1];
      return {
        goalId: goal.id,
        completion: latestProgress?.completion || 0,
        confidence: goal.confidence
      };
    });
  }

  async getRecentActivity(days: number): Promise<{type: string, id: string, timestamp: string}[]> {
    const data = await this.load();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const activity: {type: string, id: string, timestamp: string}[] = [];
    
    // Add conversations
    Object.values(data.conversations).forEach(conv => {
      if (new Date(conv.timestamp) >= cutoffDate) {
        activity.push({
          type: 'conversation',
          id: conv.id,
          timestamp: conv.timestamp
        });
      }
    });
    
    // Add goals
    Object.values(data.goals).forEach(goal => {
      if (new Date(goal.lastUpdated) >= cutoffDate) {
        activity.push({
          type: 'goal',
          id: goal.id,
          timestamp: goal.lastUpdated
        });
      }
    });
    
    // Add insights
    Object.values(data.insights).forEach(insight => {
      if (new Date(insight.timestamp) >= cutoffDate) {
        activity.push({
          type: 'insight',
          id: insight.id,
          timestamp: insight.timestamp
        });
      }
    });
    
    return activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}