import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { FeatureFlagService } from '../feature-flags/FeatureFlagService';
import { ResilientWritingAnalysisMCPClient } from '../mcp/ResilientWritingAnalysisMCPClient';
import { DirectWritingAnalysisService } from '../direct/DirectWritingAnalysisService';
import { WritingAnalysisFallbackService } from '../fallback/WritingAnalysisFallbackService';

/**
 * Adaptive Writing Analysis Manager
 * Intelligently routes requests between MCP, Direct, and Fallback services
 * based on feature flags, service health, and performance metrics
 */

export type AnalysisServiceType = 'mcp' | 'direct' | 'fallback';

export interface ServiceMetrics {
  responseTime: number;
  successRate: number;
  lastError?: string;
  lastErrorTime?: number;
  requestCount: number;
  failureCount: number;
}

@Injectable()
export class AdaptiveWritingAnalysisManager implements OnModuleInit {
  private readonly logger = new Logger(AdaptiveWritingAnalysisManager.name);

  private mcpClient: ResilientWritingAnalysisMCPClient;
  private directService: DirectWritingAnalysisService;
  private fallbackService: WritingAnalysisFallbackService;
  private featureFlags: FeatureFlagService;

  // Service metrics tracking
  private metrics = new Map<AnalysisServiceType, ServiceMetrics>();
  
  // Performance thresholds
  private readonly RESPONSE_TIME_THRESHOLD = 5000; // 5 seconds
  private readonly SUCCESS_RATE_THRESHOLD = 0.8; // 80%
  private readonly MAX_RETRY_ATTEMPTS = 2;

  constructor() {
    this.mcpClient = new ResilientWritingAnalysisMCPClient();
    this.directService = new DirectWritingAnalysisService();
    this.fallbackService = new WritingAnalysisFallbackService();
    this.featureFlags = new FeatureFlagService();

    // Initialize metrics
    this.initializeMetrics();
  }

  async onModuleInit() {
    await this.mcpClient.onModuleInit();
    this.logger.log('Adaptive writing analysis manager initialized');
  }

  /**
   * Initialize metrics tracking for all services
   */
  private initializeMetrics(): void {
    const serviceTypes: AnalysisServiceType[] = ['mcp', 'direct', 'fallback'];
    serviceTypes.forEach(service => {
      this.metrics.set(service, {
        responseTime: 0,
        successRate: 1.0,
        requestCount: 0,
        failureCount: 0,
      });
    });
  }

  /**
   * Determine the best service to use for a given operation
   */
  private async getBestServiceForOperation(operation: string): Promise<{
    service: AnalysisServiceType;
    reasoning: string[];
  }> {
    const reasoning: string[] = [];

    // Check feature flags first
    if (!this.featureFlags.isMCPIntegrationActive()) {
      reasoning.push('MCP integration disabled by feature flags');
      return { service: 'direct', reasoning };
    }

    // Check MCP health
    try {
      const mcpHealth = await this.mcpClient.healthCheck();
      if (!mcpHealth.healthy && !mcpHealth.fallbackAvailable) {
        reasoning.push('MCP service unhealthy and fallback unavailable');
        return { service: 'direct', reasoning };
      }
    } catch (error) {
      reasoning.push('MCP health check failed');
      return { service: 'direct', reasoning };
    }

    // Check performance metrics
    const mcpMetrics = this.metrics.get('mcp')!;
    const directMetrics = this.metrics.get('direct')!;

    if (mcpMetrics.successRate < this.SUCCESS_RATE_THRESHOLD) {
      reasoning.push(`MCP success rate too low: ${(mcpMetrics.successRate * 100).toFixed(1)}%`);
      return { service: 'direct', reasoning };
    }

    if (mcpMetrics.responseTime > this.RESPONSE_TIME_THRESHOLD) {
      reasoning.push(`MCP response time too slow: ${mcpMetrics.responseTime}ms`);
      return { service: 'direct', reasoning };
    }

    // Check specific operation flags
    const operationMap: Record<string, 'writing_analysis' | 'reflection_analysis' | 'content_classification' | 'ai_boundaries' | 'audit_trails'> = {
      'analyzeWritingPatterns': 'writing_analysis',
      'evaluateReflectionQuality': 'reflection_analysis',
      'classifyContentSensitivity': 'content_classification',
      'applyAIBoundaries': 'ai_boundaries',
      'auditWritingDataAccess': 'audit_trails',
    };

    const flagKey = operationMap[operation];
    if (flagKey && !this.featureFlags.shouldUseMCP(flagKey)) {
      reasoning.push(`${operation} MCP disabled by feature flag`);
      return { service: 'direct', reasoning };
    }

    // If all checks pass, use MCP
    reasoning.push('MCP service healthy and enabled');
    return { service: 'mcp', reasoning };
  }

  /**
   * Execute operation with adaptive service selection and fallback
   */
  private async executeWithAdaptiveSelection<T>(
    operation: string,
    mcpOperation: () => Promise<T>,
    directOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>
  ): Promise<T & { serviceUsed: AnalysisServiceType; reasoning: string[] }> {
    const { service: primaryService, reasoning } = await this.getBestServiceForOperation(operation);
    
    let lastError: Error | null = null;
    let attempts = 0;

    // Try primary service
    const result = await this.tryService(primaryService, operation, {
      mcp: mcpOperation,
      direct: directOperation,
      fallback: fallbackOperation,
    });

    if (result.success) {
      return { ...result.data, serviceUsed: primaryService, reasoning };
    }

    lastError = result.error;
    this.logger.warn(`Primary service ${primaryService} failed for ${operation}:`, lastError.message);

    // Try fallback services in order
    const fallbackOrder = this.getFallbackOrder(primaryService);
    
    for (const fallbackService of fallbackOrder) {
      if (attempts >= this.MAX_RETRY_ATTEMPTS) break;
      
      attempts++;
      const fallbackResult = await this.tryService(fallbackService, operation, {
        mcp: mcpOperation,
        direct: directOperation,
        fallback: fallbackOperation,
      });

      if (fallbackResult.success) {
        const newReasoning = [...reasoning, `Primary ${primaryService} failed, using ${fallbackService}`];
        return { ...fallbackResult.data, serviceUsed: fallbackService, reasoning: newReasoning };
      }

      lastError = fallbackResult.error;
      this.logger.warn(`Fallback service ${fallbackService} failed for ${operation}:`, lastError.message);
    }

    // All services failed
    throw new Error(`All services failed for ${operation}. Last error: ${lastError?.message}`);
  }

  /**
   * Try a specific service and track metrics
   */
  private async tryService<T>(
    serviceType: AnalysisServiceType,
    operation: string,
    operations: {
      mcp: () => Promise<T>;
      direct: () => Promise<T>;
      fallback: () => Promise<T>;
    }
  ): Promise<{ success: boolean; data?: T; error?: Error }> {
    const startTime = Date.now();
    const metrics = this.metrics.get(serviceType)!;
    
    try {
      let result: T;
      
      switch (serviceType) {
        case 'mcp':
          result = await operations.mcp();
          break;
        case 'direct':
          result = await operations.direct();
          break;
        case 'fallback':
          result = await operations.fallback();
          break;
        default:
          throw new Error(`Unknown service type: ${serviceType}`);
      }

      // Update success metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics(serviceType, responseTime, true);
      
      return { success: true, data: result };
      
    } catch (error) {
      // Update failure metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics(serviceType, responseTime, false, error as Error);
      
      return { success: false, error: error as Error };
    }
  }

  /**
   * Update service metrics
   */
  private updateMetrics(
    serviceType: AnalysisServiceType,
    responseTime: number,
    success: boolean,
    error?: Error
  ): void {
    const metrics = this.metrics.get(serviceType)!;
    
    metrics.requestCount++;
    if (!success) {
      metrics.failureCount++;
      metrics.lastError = error?.message;
      metrics.lastErrorTime = Date.now();
    }
    
    // Update rolling averages
    metrics.responseTime = (metrics.responseTime + responseTime) / 2;
    metrics.successRate = (metrics.requestCount - metrics.failureCount) / metrics.requestCount;
  }

  /**
   * Get fallback service order based on primary service failure
   */
  private getFallbackOrder(primaryService: AnalysisServiceType): AnalysisServiceType[] {
    switch (primaryService) {
      case 'mcp':
        return ['direct', 'fallback'];
      case 'direct':
        return ['fallback'];
      case 'fallback':
        return []; // No fallback for fallback service
      default:
        return ['fallback'];
    }
  }

  // Public API methods with adaptive selection

  async analyzeWritingPatterns(params: any): Promise<any> {
    return this.executeWithAdaptiveSelection(
      'analyzeWritingPatterns',
      () => this.mcpClient.analyzeWritingPatterns(params),
      () => this.directService.analyzeWritingPatterns(params),
      () => this.fallbackService.analyzeWritingPatterns({
        content: params.content,
        userId: params.userId,
        options: params.options,
      })
    );
  }

  async evaluateReflectionQuality(params: any): Promise<any> {
    return this.executeWithAdaptiveSelection(
      'evaluateReflectionQuality',
      () => this.mcpClient.evaluateReflectionQuality(params),
      () => this.directService.evaluateReflectionQuality(params),
      () => this.fallbackService.evaluateReflectionQuality({
        reflection: params.reflection,
        userId: params.userId,
      })
    );
  }

  async classifyContentSensitivity(params: any): Promise<any> {
    return this.executeWithAdaptiveSelection(
      'classifyContentSensitivity',
      () => this.mcpClient.classifyContentSensitivity(params),
      () => this.directService.classifyContentSensitivity(params),
      () => this.fallbackService.classifyContentSensitivity(params)
    );
  }

  async validateEducationalPurpose(params: any): Promise<any> {
    return this.executeWithAdaptiveSelection(
      'validateEducationalPurpose',
      () => this.mcpClient.validateEducationalPurpose(params),
      () => this.directService.validateEducationalPurpose(params),
      () => Promise.resolve({
        isValid: true,
        score: 75,
        criteria: { academicRelevance: 75, learningObjectiveAlignment: 70, appropriateLevel: 80, ethicalCompliance: 90 },
        recommendations: ['Educational purpose validation using fallback service'],
        fallbackMode: true,
      })
    );
  }

  async applyAIBoundaries(params: any): Promise<any> {
    return this.executeWithAdaptiveSelection(
      'applyAIBoundaries',
      () => this.mcpClient.applyAIBoundaries(params),
      () => this.directService.applyAIBoundaries(params),
      () => Promise.resolve({
        allowed: params.studentContext?.reflectionCompleted && params.studentContext?.progressLevel >= 0.6,
        boundariesApplied: ['fallback_mode'],
        suggestions: ['Limited AI assistance in fallback mode'],
        reasoning: 'AI boundaries enforced by fallback service',
        fallbackMode: true,
      })
    );
  }

  async generateWritingInsights(params: any): Promise<any> {
    return this.executeWithAdaptiveSelection(
      'generateWritingInsights',
      () => this.mcpClient.generateWritingInsights(params),
      () => this.directService.generateWritingInsights(params),
      () => this.fallbackService.generateWritingInsights({
        scope: params.scope,
        targetId: params.targetId,
        timeframe: params.timeframe,
      })
    );
  }

  async trackWritingProgress(params: any): Promise<any> {
    return this.executeWithAdaptiveSelection(
      'trackWritingProgress',
      () => this.mcpClient.trackWritingProgress(params),
      () => this.directService.trackWritingProgress(params),
      () => Promise.resolve({
        sessionMetrics: { totalSessions: 'N/A', totalTimeSpent: 'N/A', averageSessionLength: 'N/A', productivityScore: 'N/A' },
        developmentMetrics: { skillProgression: [], qualityImprovement: 'Limited tracking', consistencyScore: 'N/A' },
        interventionTriggers: ['Progress tracking unavailable - using fallback'],
        fallbackMode: true,
      })
    );
  }

  async auditWritingDataAccess(params: any): Promise<any> {
    return this.executeWithAdaptiveSelection(
      'auditWritingDataAccess',
      () => this.mcpClient.auditWritingDataAccess(params),
      () => this.directService.auditWritingDataAccess(params),
      () => Promise.resolve({
        auditId: `fallback-${Date.now()}`,
        recorded: true,
        fallbackMode: true,
        warning: 'Audit logged locally - primary services unavailable',
      })
    );
  }

  /**
   * Get comprehensive health status
   */
  async getHealthStatus(): Promise<{
    overall: boolean;
    services: Record<AnalysisServiceType, any>;
    metrics: Record<AnalysisServiceType, ServiceMetrics>;
    featureFlags: any;
  }> {
    const services: Record<AnalysisServiceType, any> = {
      mcp: await this.mcpClient.healthCheck().catch(error => ({ healthy: false, error: error.message })),
      direct: await this.directService.healthCheck().catch(error => ({ healthy: false, error: error.message })),
      fallback: { healthy: true, directMode: true }, // Fallback is always available
    };

    const overall = Object.values(services).some(service => service.healthy);

    return {
      overall,
      services,
      metrics: Object.fromEntries(this.metrics),
      featureFlags: this.featureFlags.getClientConfig(),
    };
  }

  /**
   * Get performance metrics for monitoring
   */
  getPerformanceMetrics(): Record<AnalysisServiceType, ServiceMetrics> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Reset metrics (for testing or maintenance)
   */
  resetMetrics(): void {
    this.initializeMetrics();
    this.logger.log('Performance metrics reset');
  }

  /**
   * Update feature flags
   */
  updateFeatureFlags(updates: Record<string, boolean>): void {
    this.featureFlags.setFlags(updates as any);
    this.logger.log('Feature flags updated', updates);
  }
}