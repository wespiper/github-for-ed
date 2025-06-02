// Business goal management tools
import { v4 as uuidv4 } from 'uuid';
import { 
  BusinessGoal, 
  GoalMetric, 
  Milestone, 
  ProgressSnapshot,
  ToolResponse 
} from '../types/index.js';
import { StorageAdapter } from '../storage/StorageAdapter.js';

export class GoalTools {
  constructor(private storage: StorageAdapter) {}

  async createBusinessGoal(args: {
    category: 'revenue' | 'product' | 'market' | 'technical' | 'operational';
    title: string;
    description: string;
    owner: string;
    stakeholders?: string[];
    dependencies?: {
      technicalFeatures?: string[];
      businessPrerequisites?: string[];
      externalFactors?: string[];
    };
    initialMetrics?: {
      name: string;
      type: 'revenue' | 'growth' | 'efficiency' | 'quality' | 'satisfaction';
      target: number;
      unit: string;
      timeframe: string;
    }[];
  }): Promise<ToolResponse> {
    try {
      const goalId = uuidv4();
      const timestamp = new Date().toISOString();

      const metrics: GoalMetric[] = (args.initialMetrics || []).map(metric => ({
        id: uuidv4(),
        name: metric.name,
        type: metric.type,
        target: metric.target,
        current: 0,
        unit: metric.unit,
        timeframe: metric.timeframe,
        lastUpdated: timestamp
      }));

      const businessGoal: BusinessGoal = {
        id: goalId,
        category: args.category,
        title: args.title,
        description: args.description,
        metrics,
        milestones: [],
        dependencies: {
          technicalFeatures: args.dependencies?.technicalFeatures || [],
          businessPrerequisites: args.dependencies?.businessPrerequisites || [],
          externalFactors: args.dependencies?.externalFactors || []
        },
        status: 'planning',
        confidence: 50, // Start with neutral confidence
        lastUpdated: timestamp,
        linkedInsights: [],
        progressHistory: [],
        owner: args.owner,
        stakeholders: args.stakeholders || []
      };

      const data = await this.storage.load();
      data.goals[goalId] = businessGoal;
      data.metadata.totalGoals = Object.keys(data.goals).length;
      data.metadata.lastUpdated = timestamp;

      await this.storage.save(data);

      return {
        success: true,
        data: businessGoal,
        message: `Business goal '${args.title}' created successfully with ${metrics.length} initial metrics`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create business goal: ${error}`
      };
    }
  }

  async updateGoalProgress(args: {
    goalId: string;
    metricUpdates?: {
      metricId: string;
      currentValue: number;
    }[];
    confidence?: number;
    notes?: string;
    blockers?: string[];
    achievements?: string[];
    risks?: string[];
  }): Promise<ToolResponse> {
    try {
      const data = await this.storage.load();
      const goal = data.goals[args.goalId];

      if (!goal) {
        return {
          success: false,
          error: `Goal with ID ${args.goalId} not found`
        };
      }

      const timestamp = new Date().toISOString();

      // Update metrics
      if (args.metricUpdates) {
        args.metricUpdates.forEach(update => {
          const metric = goal.metrics.find(m => m.id === update.metricId);
          if (metric) {
            metric.current = update.currentValue;
            metric.lastUpdated = timestamp;
          }
        });
      }

      // Update confidence
      if (args.confidence !== undefined) {
        goal.confidence = Math.max(0, Math.min(100, args.confidence));
      }

      // Calculate overall completion percentage
      const completion = goal.metrics.length > 0 
        ? Math.round(goal.metrics.reduce((sum, metric) => {
            const progress = Math.min(100, (metric.current / metric.target) * 100);
            return sum + progress;
          }, 0) / goal.metrics.length)
        : 0;

      // Create progress snapshot
      const progressSnapshot: ProgressSnapshot = {
        id: uuidv4(),
        timestamp,
        completion,
        confidence: goal.confidence,
        notes: args.notes || '',
        blockers: args.blockers || [],
        achievements: args.achievements || [],
        risks: args.risks || []
      };

      goal.progressHistory.push(progressSnapshot);
      goal.lastUpdated = timestamp;

      // Update status based on completion
      if (completion >= 100) {
        goal.status = 'completed';
      } else if (completion > 0 && goal.status === 'planning') {
        goal.status = 'active';
      }

      data.metadata.lastUpdated = timestamp;
      await this.storage.save(data);

      return {
        success: true,
        data: {
          goal,
          progressSnapshot,
          completion
        },
        message: `Goal progress updated. Completion: ${completion}%, Confidence: ${goal.confidence}%`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update goal progress: ${error}`
      };
    }
  }

  async addMilestone(args: {
    goalId: string;
    title: string;
    description: string;
    targetDate: string;
    linkedTechnicalWork?: string[];
  }): Promise<ToolResponse> {
    try {
      const data = await this.storage.load();
      const goal = data.goals[args.goalId];

      if (!goal) {
        return {
          success: false,
          error: `Goal with ID ${args.goalId} not found`
        };
      }

      const milestoneId = uuidv4();
      const milestone: Milestone = {
        id: milestoneId,
        title: args.title,
        description: args.description,
        targetDate: args.targetDate,
        status: 'pending',
        linkedTechnicalWork: args.linkedTechnicalWork
      };

      goal.milestones.push(milestone);
      goal.lastUpdated = new Date().toISOString();
      data.metadata.lastUpdated = goal.lastUpdated;

      await this.storage.save(data);

      return {
        success: true,
        data: milestone,
        message: `Milestone '${args.title}' added to goal '${goal.title}'`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to add milestone: ${error}`
      };
    }
  }

  async updateMilestoneStatus(args: {
    goalId: string;
    milestoneId: string;
    status: 'pending' | 'in-progress' | 'completed' | 'delayed' | 'cancelled';
    completionDate?: string;
    blockers?: string[];
  }): Promise<ToolResponse> {
    try {
      const data = await this.storage.load();
      const goal = data.goals[args.goalId];

      if (!goal) {
        return {
          success: false,
          error: `Goal with ID ${args.goalId} not found`
        };
      }

      const milestone = goal.milestones.find(m => m.id === args.milestoneId);
      if (!milestone) {
        return {
          success: false,
          error: `Milestone with ID ${args.milestoneId} not found`
        };
      }

      milestone.status = args.status;
      if (args.completionDate) {
        milestone.completionDate = args.completionDate;
      }
      if (args.blockers) {
        milestone.blockers = args.blockers;
      }

      goal.lastUpdated = new Date().toISOString();
      data.metadata.lastUpdated = goal.lastUpdated;

      await this.storage.save(data);

      return {
        success: true,
        data: milestone,
        message: `Milestone '${milestone.title}' status updated to ${args.status}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update milestone status: ${error}`
      };
    }
  }

  async getGoal(args: { goalId: string }): Promise<ToolResponse> {
    try {
      const data = await this.storage.load();
      const goal = data.goals[args.goalId];

      if (!goal) {
        return {
          success: false,
          error: `Goal with ID ${args.goalId} not found`
        };
      }

      // Calculate current completion
      const completion = goal.metrics.length > 0 
        ? Math.round(goal.metrics.reduce((sum, metric) => {
            const progress = Math.min(100, (metric.current / metric.target) * 100);
            return sum + progress;
          }, 0) / goal.metrics.length)
        : 0;

      return {
        success: true,
        data: {
          ...goal,
          currentCompletion: completion
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get goal: ${error}`
      };
    }
  }

  async listGoals(args: {
    category?: 'revenue' | 'product' | 'market' | 'technical' | 'operational';
    status?: 'planning' | 'active' | 'blocked' | 'completed' | 'paused';
    owner?: string;
  } = {}): Promise<ToolResponse> {
    try {
      const data = await this.storage.load();
      let goals = Object.values(data.goals);

      // Apply filters
      if (args.category) {
        goals = goals.filter(goal => goal.category === args.category);
      }
      if (args.status) {
        goals = goals.filter(goal => goal.status === args.status);
      }
      if (args.owner) {
        goals = goals.filter(goal => goal.owner === args.owner);
      }

      // Add current completion to each goal
      const goalsWithCompletion = goals.map(goal => {
        const completion = goal.metrics.length > 0 
          ? Math.round(goal.metrics.reduce((sum, metric) => {
              const progress = Math.min(100, (metric.current / metric.target) * 100);
              return sum + progress;
            }, 0) / goal.metrics.length)
          : 0;

        return {
          ...goal,
          currentCompletion: completion
        };
      });

      // Sort by last updated (most recent first)
      goalsWithCompletion.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

      return {
        success: true,
        data: goalsWithCompletion,
        message: `Found ${goalsWithCompletion.length} goals`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to list goals: ${error}`
      };
    }
  }

  async getGoalAnalytics(): Promise<ToolResponse> {
    try {
      const data = await this.storage.load();
      const goals = Object.values(data.goals);

      const analytics = {
        totalGoals: goals.length,
        byStatus: {
          planning: goals.filter(g => g.status === 'planning').length,
          active: goals.filter(g => g.status === 'active').length,
          blocked: goals.filter(g => g.status === 'blocked').length,
          completed: goals.filter(g => g.status === 'completed').length,
          paused: goals.filter(g => g.status === 'paused').length
        },
        byCategory: {
          revenue: goals.filter(g => g.category === 'revenue').length,
          product: goals.filter(g => g.category === 'product').length,
          market: goals.filter(g => g.category === 'market').length,
          technical: goals.filter(g => g.category === 'technical').length,
          operational: goals.filter(g => g.category === 'operational').length
        },
        averageConfidence: goals.length > 0 
          ? Math.round(goals.reduce((sum, g) => sum + g.confidence, 0) / goals.length)
          : 0,
        averageCompletion: goals.length > 0
          ? Math.round(goals.reduce((sum, goal) => {
              const completion = goal.metrics.length > 0 
                ? goal.metrics.reduce((metricSum, metric) => {
                    return metricSum + Math.min(100, (metric.current / metric.target) * 100);
                  }, 0) / goal.metrics.length
                : 0;
              return sum + completion;
            }, 0) / goals.length)
          : 0
      };

      return {
        success: true,
        data: analytics,
        message: `Goal analytics calculated for ${goals.length} goals`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get goal analytics: ${error}`
      };
    }
  }
}