import { ServiceDiscoveryClient } from '../service-discovery';
import { HTTPServiceClient, ServiceResponse } from './HTTPServiceClient';
import { EventEmitter } from 'events';

export interface WorkflowStep {
  id: string;
  serviceCapability: string;
  operation: string;
  input: any;
  dependencies?: string[];
  timeout?: number;
  retries?: number;
  optional?: boolean;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  rollbackOnFailure: boolean;
  maxConcurrency: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';
  startTime: Date;
  endTime?: Date;
  results: Map<string, any>;
  errors: Map<string, Error>;
  rollbackData: Map<string, any>;
}

export class ServiceOrchestrator extends EventEmitter {
  private serviceDiscovery: ServiceDiscoveryClient;
  private httpClients = new Map<string, HTTPServiceClient>();
  private workflows = new Map<string, WorkflowDefinition>();
  private executions = new Map<string, WorkflowExecution>();

  constructor(serviceDiscovery: ServiceDiscoveryClient) {
    super();
    this.serviceDiscovery = serviceDiscovery;
  }

  /**
   * Register a workflow definition
   */
  registerWorkflow(workflow: WorkflowDefinition): void {
    this.workflows.set(workflow.id, workflow);
    console.log(`[SERVICE ORCHESTRATOR] Registered workflow: ${workflow.name} (${workflow.id})`);
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowId: string,
    initialInput: any,
    correlationId?: string
  ): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const executionId = this.generateExecutionId();
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: 'pending',
      startTime: new Date(),
      results: new Map(),
      errors: new Map(),
      rollbackData: new Map()
    };

    this.executions.set(executionId, execution);
    this.emit('workflowStarted', execution);

    try {
      execution.status = 'running';
      console.log(`[SERVICE ORCHESTRATOR] Starting workflow execution: ${workflow.name} (${executionId})`);

      // Execute steps in dependency order
      await this.executeSteps(workflow, execution, initialInput, correlationId);

      execution.status = 'completed';
      execution.endTime = new Date();
      
      console.log(`[SERVICE ORCHESTRATOR] Workflow completed: ${workflow.name} (${executionId})`);
      this.emit('workflowCompleted', execution);

    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      
      console.error(`[SERVICE ORCHESTRATOR] Workflow failed: ${workflow.name} (${executionId}):`, error);
      this.emit('workflowFailed', execution, error);

      // Attempt rollback if enabled
      if (workflow.rollbackOnFailure) {
        await this.rollbackWorkflow(execution);
      }
    }

    return execution;
  }

  /**
   * Execute workflow steps
   */
  private async executeSteps(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    initialInput: any,
    correlationId?: string
  ): Promise<void> {
    const stepResults = new Map<string, any>();
    stepResults.set('input', initialInput);

    // Build dependency graph
    const dependencyGraph = this.buildDependencyGraph(workflow.steps);
    const executionOrder = this.topologicalSort(dependencyGraph);

    // Execute steps in order
    for (const stepId of executionOrder) {
      const step = workflow.steps.find(s => s.id === stepId);
      if (!step) continue;

      try {
        console.log(`[SERVICE ORCHESTRATOR] Executing step: ${step.id} (${step.serviceCapability})`);

        // Prepare step input
        const stepInput = this.prepareStepInput(step, stepResults);

        // Execute step
        const result = await this.executeStep(step, stepInput, correlationId);
        
        stepResults.set(step.id, result);
        execution.results.set(step.id, result);

        this.emit('stepCompleted', execution, step, result);

      } catch (error) {
        if (step.optional) {
          console.warn(`[SERVICE ORCHESTRATOR] Optional step failed: ${step.id}:`, error);
          execution.errors.set(step.id, error as Error);
          this.emit('stepFailed', execution, step, error);
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(
    step: WorkflowStep,
    input: any,
    correlationId?: string
  ): Promise<any> {
    // Discover service for this capability
    const service = await this.serviceDiscovery.getBestService(step.serviceCapability, 'http');
    if (!service) {
      throw new Error(`No available service for capability: ${step.serviceCapability}`);
    }

    // Get or create HTTP client for this service
    let httpClient = this.httpClients.get(service.id);
    if (!httpClient) {
      httpClient = new HTTPServiceClient({
        baseURL: service.endpoints.http || '',
        timeout: step.timeout || 30000,
        retries: step.retries || 3
      });
      this.httpClients.set(service.id, httpClient);
    }

    // Execute service call
    const response = await httpClient.post(`/${step.operation}`, input, {
      headers: correlationId ? { 'x-correlation-id': correlationId } : {},
      timeout: step.timeout,
      retries: step.retries
    });

    if (!response.success) {
      throw new Error(`Step execution failed: ${response.error}`);
    }

    return response.data;
  }

  /**
   * Prepare input for a step based on dependencies
   */
  private prepareStepInput(step: WorkflowStep, stepResults: Map<string, any>): any {
    let input = { ...step.input };

    // Merge results from dependencies
    if (step.dependencies) {
      for (const depId of step.dependencies) {
        const depResult = stepResults.get(depId);
        if (depResult) {
          input = { ...input, [depId]: depResult };
        }
      }
    }

    return input;
  }

  /**
   * Build dependency graph for workflow steps
   */
  private buildDependencyGraph(steps: WorkflowStep[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    for (const step of steps) {
      graph.set(step.id, step.dependencies || []);
    }

    return graph;
  }

  /**
   * Topological sort for dependency resolution
   */
  private topologicalSort(graph: Map<string, string[]>): string[] {
    const visited = new Set<string>();
    const temp = new Set<string>();
    const result: string[] = [];

    const visit = (node: string) => {
      if (temp.has(node)) {
        throw new Error(`Circular dependency detected involving: ${node}`);
      }
      
      if (!visited.has(node)) {
        temp.add(node);
        
        const dependencies = graph.get(node) || [];
        for (const dep of dependencies) {
          visit(dep);
        }
        
        temp.delete(node);
        visited.add(node);
        result.unshift(node); // Add to front for reverse order
      }
    };

    for (const node of graph.keys()) {
      visit(node);
    }

    return result;
  }

  /**
   * Rollback a failed workflow
   */
  private async rollbackWorkflow(execution: WorkflowExecution): Promise<void> {
    console.log(`[SERVICE ORCHESTRATOR] Rolling back workflow: ${execution.id}`);
    
    try {
      execution.status = 'rolled_back';
      
      // Implement rollback logic here
      // This would involve calling rollback operations on services
      // For now, just log the rollback attempt
      
      console.log(`[SERVICE ORCHESTRATOR] Rollback completed for workflow: ${execution.id}`);
      this.emit('workflowRolledBack', execution);
      
    } catch (rollbackError) {
      console.error(`[SERVICE ORCHESTRATOR] Rollback failed for workflow: ${execution.id}:`, rollbackError);
      this.emit('rollbackFailed', execution, rollbackError);
    }
  }

  /**
   * Get workflow execution status
   */
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Get all executions for a workflow
   */
  getWorkflowExecutions(workflowId: string): WorkflowExecution[] {
    return Array.from(this.executions.values())
      .filter(exec => exec.workflowId === workflowId);
  }

  /**
   * Get orchestrator statistics
   */
  getStats(): {
    workflows: number;
    executions: number;
    activeExecutions: number;
    httpClients: number;
    executionsByStatus: Record<string, number>;
  } {
    const executions = Array.from(this.executions.values());
    const executionsByStatus = executions.reduce((acc, exec) => {
      acc[exec.status] = (acc[exec.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      workflows: this.workflows.size,
      executions: this.executions.size,
      activeExecutions: executions.filter(e => e.status === 'running' || e.status === 'pending').length,
      httpClients: this.httpClients.size,
      executionsByStatus
    };
  }

  /**
   * Clean up old executions
   */
  cleanupExecutions(maxAge: number = 24 * 60 * 60 * 1000): number { // 24 hours default
    const cutoff = new Date(Date.now() - maxAge);
    let cleaned = 0;

    for (const [id, execution] of this.executions) {
      if (execution.endTime && execution.endTime < cutoff) {
        this.executions.delete(id);
        cleaned++;
      }
    }

    console.log(`[SERVICE ORCHESTRATOR] Cleaned up ${cleaned} old executions`);
    return cleaned;
  }

  /**
   * Utility methods
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}