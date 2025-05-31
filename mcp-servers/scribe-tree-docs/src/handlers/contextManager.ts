import * as fs from 'fs/promises';
import * as path from 'path';
import { ProjectContext, Task, ActivityEntry, ServerConfig, TaskManagementRequest } from '../types/index.js';

export class ContextManager {
  private context: ProjectContext | null = null;
  private config: ServerConfig;
  private contextFilePath: string;

  constructor(config: ServerConfig) {
    this.config = config;
    this.contextFilePath = path.join(config.projectRoot, config.cacheDirectory, 'project-context.json');
  }

  async initialize(): Promise<void> {
    await this.ensureCacheDirectory();
    await this.loadContext();
  }

  private async ensureCacheDirectory(): Promise<void> {
    const cacheDir = path.join(this.config.projectRoot, this.config.cacheDirectory);
    try {
      await fs.mkdir(cacheDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create cache directory:', error);
    }
  }

  private async loadContext(): Promise<void> {
    try {
      const contextData = await fs.readFile(this.contextFilePath, 'utf-8');
      const parsed = JSON.parse(contextData);
      
      // Convert date strings back to Date objects
      this.context = {
        ...parsed,
        created: new Date(parsed.created),
        lastAccessed: new Date(parsed.lastAccessed),
        activeTasks: parsed.activeTasks.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt)
        })),
        recentActivity: parsed.recentActivity.map((activity: any) => ({
          ...activity,
          timestamp: new Date(activity.timestamp)
        }))
      };
    } catch (error) {
      console.error('Context file not found or invalid, creating new context');
      await this.createNewContext();
    }
  }

  private async createNewContext(): Promise<void> {
    this.context = {
      id: `project-${Date.now()}`,
      name: 'Scribe Tree Educational Platform',
      rootPath: this.config.projectRoot,
      created: new Date(),
      lastAccessed: new Date(),
      currentPhase: 'Phase 5 - AI Enhancement Implementation',
      goals: [
        'Complete educational AI system with 95% compliance to Bounded Enhancement principles',
        'Implement progressive AI boundaries that build critical thinking',
        'Provide real-time educator insights into student writing development',
        'Maintain complete transparency in AI interactions'
      ],
      activeTasks: [],
      documentIndex: [],
      recentActivity: []
    };

    await this.saveContext();
  }

  private async saveContext(): Promise<void> {
    if (!this.context) return;

    try {
      await fs.writeFile(this.contextFilePath, JSON.stringify(this.context, null, 2));
    } catch (error) {
      console.error('Failed to save context:', error);
    }
  }

  async getContext(includeRecentActivity: boolean = true): Promise<ProjectContext | null> {
    if (!this.context) return null;

    this.context.lastAccessed = new Date();
    await this.saveContext();

    const result = { ...this.context };
    if (!includeRecentActivity) {
      result.recentActivity = [];
    }

    return result;
  }

  async updateContext(updates: Partial<ProjectContext>): Promise<ProjectContext | null> {
    if (!this.context) return null;

    const oldPhase = this.context.currentPhase;

    // Update context with provided changes
    Object.assign(this.context, updates);
    this.context.lastAccessed = new Date();

    // Track phase changes
    if (updates.currentPhase && updates.currentPhase !== oldPhase) {
      await this.addActivity({
        type: 'phase_changed',
        description: `Phase changed from "${oldPhase}" to "${updates.currentPhase}"`,
        relatedFiles: [],
        metadata: { previousPhase: oldPhase, newPhase: updates.currentPhase }
      });
    }

    await this.saveContext();
    return this.context;
  }

  async manageTasks(request: TaskManagementRequest): Promise<any> {
    if (!this.context) {
      throw new Error('Context not initialized');
    }

    switch (request.action) {
      case 'create':
        return await this.createTask(request.task!);
      
      case 'update':
        return await this.updateTask(request.taskId!, request.task!);
      
      case 'delete':
        return await this.deleteTask(request.taskId!);
      
      case 'list':
        return await this.listTasks(request.filters);
      
      default:
        throw new Error(`Unknown task action: ${request.action}`);
    }
  }

  private async createTask(taskData: Partial<Task>): Promise<Task> {
    const task: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      description: taskData.description || '',
      status: taskData.status || 'pending',
      priority: taskData.priority || 'medium',
      relatedDocs: taskData.relatedDocs || [],
      dependencies: taskData.dependencies || [],
      assignedPhase: taskData.assignedPhase || this.context!.currentPhase,
      notes: taskData.notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.context!.activeTasks.push(task);
    
    await this.addActivity({
      type: 'task_created' as any,
      description: `Created task: ${task.description}`,
      relatedFiles: task.relatedDocs,
      metadata: { taskId: task.id, priority: task.priority }
    });

    await this.saveContext();
    return task;
  }

  private async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const taskIndex = this.context!.activeTasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const task = this.context!.activeTasks[taskIndex];
    const oldStatus = task.status;
    
    Object.assign(task, updates);
    task.updatedAt = new Date();

    // Track status changes
    if (updates.status && updates.status !== oldStatus) {
      let activityType: 'task_completed' | 'document_updated' = 'document_updated';
      if (updates.status === 'completed') {
        activityType = 'task_completed';
      }

      await this.addActivity({
        type: activityType,
        description: `Task "${task.description}" status changed from ${oldStatus} to ${updates.status}`,
        relatedFiles: task.relatedDocs,
        metadata: { taskId: task.id, oldStatus, newStatus: updates.status }
      });
    }

    await this.saveContext();
    return task;
  }

  private async deleteTask(taskId: string): Promise<boolean> {
    const taskIndex = this.context!.activeTasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const task = this.context!.activeTasks[taskIndex];
    this.context!.activeTasks.splice(taskIndex, 1);

    await this.addActivity({
      type: 'document_updated',
      description: `Deleted task: ${task.description}`,
      relatedFiles: task.relatedDocs,
      metadata: { taskId: task.id, action: 'deleted' }
    });

    await this.saveContext();
    return true;
  }

  private async listTasks(filters?: {
    status?: Task['status'];
    priority?: Task['priority'];
    phase?: string;
  }): Promise<Task[]> {
    let tasks = [...this.context!.activeTasks];

    if (filters) {
      if (filters.status) {
        tasks = tasks.filter(task => task.status === filters.status);
      }
      if (filters.priority) {
        tasks = tasks.filter(task => task.priority === filters.priority);
      }
      if (filters.phase) {
        tasks = tasks.filter(task => task.assignedPhase === filters.phase);
      }
    }

    // Sort by priority (high -> medium -> low) then by creation date (newest first)
    tasks.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return tasks;
  }

  private async addActivity(activity: Omit<ActivityEntry, 'timestamp'>): Promise<void> {
    if (!this.context) return;

    const newActivity: ActivityEntry = {
      ...activity,
      timestamp: new Date()
    };

    this.context.recentActivity.unshift(newActivity);

    // Keep only the last 100 activities
    this.context.recentActivity = this.context.recentActivity.slice(0, 100);
  }

  async getProjectSummary(): Promise<any> {
    if (!this.context) return null;

    const totalTasks = this.context.activeTasks.length;
    const completedTasks = this.context.activeTasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = this.context.activeTasks.filter(t => t.status === 'in_progress').length;
    const pendingTasks = this.context.activeTasks.filter(t => t.status === 'pending').length;
    const blockedTasks = this.context.activeTasks.filter(t => t.status === 'blocked').length;

    const tasksByPriority = {
      high: this.context.activeTasks.filter(t => t.priority === 'high').length,
      medium: this.context.activeTasks.filter(t => t.priority === 'medium').length,
      low: this.context.activeTasks.filter(t => t.priority === 'low').length
    };

    const recentActivityCount = {
      today: this.context.recentActivity.filter(a => 
        a.timestamp >= new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length,
      thisWeek: this.context.recentActivity.filter(a => 
        a.timestamp >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length
    };

    return {
      projectName: this.context.name,
      currentPhase: this.context.currentPhase,
      goals: this.context.goals,
      taskSummary: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        pending: pendingTasks,
        blocked: blockedTasks,
        byPriority: tasksByPriority
      },
      recentActivity: recentActivityCount,
      lastUpdated: this.context.lastAccessed
    };
  }

  async getTasksByPhase(): Promise<Record<string, Task[]>> {
    if (!this.context) return {};

    const tasksByPhase: Record<string, Task[]> = {};

    this.context.activeTasks.forEach(task => {
      const phase = task.assignedPhase || 'Unassigned';
      if (!tasksByPhase[phase]) {
        tasksByPhase[phase] = [];
      }
      tasksByPhase[phase].push(task);
    });

    return tasksByPhase;
  }

  async archiveCompletedTasks(): Promise<number> {
    if (!this.context) return 0;

    const completedTasks = this.context.activeTasks.filter(t => t.status === 'completed');
    this.context.activeTasks = this.context.activeTasks.filter(t => t.status !== 'completed');

    if (completedTasks.length > 0) {
      // Save archived tasks to a separate file
      const archiveFile = path.join(
        this.config.projectRoot, 
        this.config.cacheDirectory, 
        `archived-tasks-${new Date().toISOString().split('T')[0]}.json`
      );

      try {
        await fs.writeFile(archiveFile, JSON.stringify(completedTasks, null, 2));
        
        await this.addActivity({
          type: 'document_updated',
          description: `Archived ${completedTasks.length} completed tasks`,
          relatedFiles: [archiveFile],
          metadata: { archivedCount: completedTasks.length }
        });

        await this.saveContext();
      } catch (error) {
        console.error('Failed to archive tasks:', error);
        // Restore tasks if archiving failed
        this.context.activeTasks.push(...completedTasks);
        return 0;
      }
    }

    return completedTasks.length;
  }
}