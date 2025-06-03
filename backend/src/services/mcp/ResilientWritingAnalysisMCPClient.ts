import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { CircuitBreakerService } from '../fallback/CircuitBreakerService';
import { WritingAnalysisFallbackService } from '../fallback/WritingAnalysisFallbackService';
import { WritingAnalysisMCPClient } from './WritingAnalysisMCPClient';

/**
 * Resilient MCP client with circuit breaker and fallback capabilities
 * Provides high availability for writing analysis services
 */
@Injectable()
export class ResilientWritingAnalysisMCPClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ResilientWritingAnalysisMCPClient.name);
  
  private mcpClient: WritingAnalysisMCPClient;
  private fallbackService: WritingAnalysisFallbackService;
  private circuitBreaker: CircuitBreakerService;
  
  private readonly SERVICE_NAME = 'writing-analysis-mcp';

  constructor() {
    this.mcpClient = new WritingAnalysisMCPClient();
    this.fallbackService = new WritingAnalysisFallbackService();
    this.circuitBreaker = new CircuitBreakerService();
  }

  async onModuleInit() {
    // Register circuit breaker with custom config for MCP
    this.circuitBreaker.registerCircuit(this.SERVICE_NAME, {
      failureThreshold: 3,        // Open after 3 failures (MCP is sensitive)
      recoveryTimeout: 60000,     // Try recovery after 1 minute
      successThreshold: 2,        // Close after 2 successes
      timeout: 15000,             // 15 second timeout for MCP calls
    });

    this.logger.log('Resilient MCP client initialized with circuit breaker');
  }

  async onModuleDestroy() {
    try {
      await this.mcpClient.disconnect();
    } catch (error) {
      this.logger.error('Error disconnecting MCP client:', error);
    }
  }

  /**
   * Analyze writing patterns with fallback
   */
  async analyzeWritingPatterns(params: {
    content: string;
    userId: string;
    role: 'student' | 'educator' | 'administrator';
    purpose: string;
    consent?: boolean;
    options?: {
      includeStructure?: boolean;
      includeSentiment?: boolean;
      includeComplexity?: boolean;
    };
  }): Promise<any> {
    return this.circuitBreaker.execute(
      this.SERVICE_NAME,
      // Primary operation - MCP call
      async () => {
        if (!this.mcpClient.isConnected()) {
          await this.mcpClient.connect();
        }
        return await this.mcpClient.analyzeWritingPatterns(params);
      },
      // Fallback operation
      async () => {
        this.logger.warn('Using fallback for analyzeWritingPatterns');
        return await this.fallbackService.analyzeWritingPatterns({
          content: params.content,
          userId: params.userId,
          options: params.options,
        });
      }
    );
  }

  /**
   * Evaluate reflection quality with fallback
   */
  async evaluateReflectionQuality(params: {
    reflection: string;
    userId: string;
    role: 'student' | 'educator' | 'administrator';
    purpose: string;
    consent?: boolean;
  }): Promise<any> {
    return this.circuitBreaker.execute(
      this.SERVICE_NAME,
      // Primary operation - MCP call
      async () => {
        if (!this.mcpClient.isConnected()) {
          await this.mcpClient.connect();
        }
        return await this.mcpClient.evaluateReflectionQuality(params);
      },
      // Fallback operation
      async () => {
        this.logger.warn('Using fallback for evaluateReflectionQuality');
        return await this.fallbackService.evaluateReflectionQuality({
          reflection: params.reflection,
          userId: params.userId,
        });
      }
    );
  }

  /**
   * Classify content sensitivity with fallback
   */
  async classifyContentSensitivity(params: {
    content: string;
    context: {
      contentType: 'essay' | 'reflection' | 'notes' | 'feedback';
      academicLevel: string;
    };
  }): Promise<any> {
    return this.circuitBreaker.execute(
      this.SERVICE_NAME,
      // Primary operation - MCP call
      async () => {
        if (!this.mcpClient.isConnected()) {
          await this.mcpClient.connect();
        }
        return await this.mcpClient.classifyContentSensitivity(params);
      },
      // Fallback operation
      async () => {
        this.logger.warn('Using fallback for classifyContentSensitivity');
        return await this.fallbackService.classifyContentSensitivity(params);
      }
    );
  }

  /**
   * Generate writing insights with fallback
   */
  async generateWritingInsights(params: {
    scope: 'individual' | 'class';
    targetId: string;
    timeframe: 'day' | 'week' | 'month' | 'semester';
    role: 'educator' | 'administrator';
    purpose: string;
    includeRecommendations?: boolean;
  }): Promise<any> {
    return this.circuitBreaker.execute(
      this.SERVICE_NAME,
      // Primary operation - MCP call
      async () => {
        if (!this.mcpClient.isConnected()) {
          await this.mcpClient.connect();
        }
        return await this.mcpClient.generateWritingInsights(params);
      },
      // Fallback operation
      async () => {
        this.logger.warn('Using fallback for generateWritingInsights');
        return await this.fallbackService.generateWritingInsights({
          scope: params.scope,
          targetId: params.targetId,
          timeframe: params.timeframe,
        });
      }
    );
  }

  /**
   * Validate educational purpose - graceful degradation
   */
  async validateEducationalPurpose(params: {
    purpose: string;
    context: {
      userRole: 'student' | 'educator' | 'administrator';
      assignmentType: string;
      academicLevel: string;
    };
  }): Promise<any> {
    return this.circuitBreaker.execute(
      this.SERVICE_NAME,
      // Primary operation - MCP call
      async () => {
        if (!this.mcpClient.isConnected()) {
          await this.mcpClient.connect();
        }
        return await this.mcpClient.validateEducationalPurpose(params);
      },
      // Fallback operation - allow with warning
      async () => {
        this.logger.warn('Using fallback for validateEducationalPurpose - allowing with limitations');
        return {
          isValid: true, // Conservative allow in fallback
          score: 75, // Moderate confidence
          criteria: {
            academicRelevance: 75,
            learningObjectiveAlignment: 70,
            appropriateLevel: 80,
            ethicalCompliance: 90,
          },
          recommendations: [
            'Educational purpose validation running in fallback mode',
            'Limited validation - manual review recommended',
            'Restore MCP service for comprehensive validation',
          ],
          fallbackMode: true,
        };
      }
    );
  }

  /**
   * Apply AI boundaries - critical for academic integrity
   */
  async applyAIBoundaries(params: {
    request: {
      prompt: string;
      context: string;
      requestType: string;
    };
    studentContext: {
      assignmentType: string;
      reflectionCompleted: boolean;
      progressLevel: number;
    };
  }): Promise<any> {
    return this.circuitBreaker.execute(
      this.SERVICE_NAME,
      // Primary operation - MCP call
      async () => {
        if (!this.mcpClient.isConnected()) {
          await this.mcpClient.connect();
        }
        return await this.mcpClient.applyAIBoundaries(params);
      },
      // Fallback operation - restrictive approach
      async () => {
        this.logger.warn('Using fallback for applyAIBoundaries - applying restrictive policy');
        
        // Conservative fallback - restrict AI assistance
        const allowed = params.studentContext.reflectionCompleted && 
                       params.studentContext.progressLevel >= 0.6;
        
        return {
          allowed,
          boundariesApplied: [
            'fallback_mode',
            'restricted_assistance',
            ...(allowed ? [] : ['insufficient_reflection_quality']),
          ],
          suggestions: allowed ? [
            'Limited AI assistance available in fallback mode',
            'Focus on your own thinking and analysis',
          ] : [
            'Complete reflection requirements to unlock AI assistance',
            'AI boundaries enforced in fallback mode',
          ],
          reasoning: allowed 
            ? 'Basic AI assistance allowed based on reflection completion'
            : 'AI assistance restricted due to insufficient reflection quality',
          fallbackMode: true,
        };
      }
    );
  }

  /**
   * Track writing progress with fallback
   */
  async trackWritingProgress(params: {
    userId: string;
    assignmentId: string;
    sessionData: any;
    privacyContext: any;
  }): Promise<any> {
    return this.circuitBreaker.execute(
      this.SERVICE_NAME,
      // Primary operation - MCP call
      async () => {
        if (!this.mcpClient.isConnected()) {
          await this.mcpClient.connect();
        }
        return await this.mcpClient.trackWritingProgress(params);
      },
      // Fallback operation - basic tracking
      async () => {
        this.logger.warn('Using fallback for trackWritingProgress');
        return {
          sessionMetrics: {
            totalSessions: 'N/A',
            totalTimeSpent: 'N/A',
            averageSessionLength: 'N/A',
            productivityScore: 'N/A',
          },
          developmentMetrics: {
            skillProgression: [],
            qualityImprovement: 'Limited tracking in fallback mode',
            consistencyScore: 'N/A',
          },
          interventionTriggers: [
            'Progress tracking unavailable - MCP service offline',
          ],
          fallbackMode: true,
        };
      }
    );
  }

  /**
   * Audit writing data access with fallback
   */
  async auditWritingDataAccess(params: {
    accessType: 'read' | 'write' | 'delete';
    dataType: string;
    userId: string;
    accessedBy: string;
    purpose: string;
    educationalContext: any;
  }): Promise<any> {
    return this.circuitBreaker.execute(
      this.SERVICE_NAME,
      // Primary operation - MCP call
      async () => {
        if (!this.mcpClient.isConnected()) {
          await this.mcpClient.connect();
        }
        return await this.mcpClient.auditWritingDataAccess(params);
      },
      // Fallback operation - log locally
      async () => {
        this.logger.warn('Using fallback for auditWritingDataAccess');
        
        // Log audit event locally when MCP is down
        const auditEvent = {
          ...params,
          timestamp: new Date().toISOString(),
          auditId: `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          fallbackMode: true,
        };
        
        this.logger.log('AUDIT (FALLBACK):', auditEvent);
        
        return {
          auditId: auditEvent.auditId,
          recorded: true,
          fallbackMode: true,
          warning: 'Audit logged locally - MCP audit service unavailable',
        };
      }
    );
  }

  /**
   * Health check for the resilient client
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    mcpStatus: any;
    circuitStatus: any;
    fallbackAvailable: boolean;
  }> {
    const circuitStatus = this.circuitBreaker.getCircuitStatus(this.SERVICE_NAME);
    
    let mcpStatus;
    try {
      mcpStatus = await this.mcpClient.healthCheck();
    } catch (error) {
      mcpStatus = {
        healthy: false,
        error: error.message,
      };
    }

    return {
      healthy: mcpStatus.healthy || circuitStatus?.state !== 'OPEN',
      mcpStatus,
      circuitStatus,
      fallbackAvailable: true, // Fallback services are always available
    };
  }

  /**
   * Get circuit breaker metrics for monitoring
   */
  getMetrics(): any {
    return {
      circuitBreaker: this.circuitBreaker.getCircuitStatus(this.SERVICE_NAME),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Force fallback mode (for testing/maintenance)
   */
  forceFallbackMode(): void {
    this.circuitBreaker.forceOpen(this.SERVICE_NAME);
    this.logger.log('Forced fallback mode - MCP circuit breaker opened manually');
  }

  /**
   * Reset circuit breaker (attempt service recovery)
   */
  resetCircuitBreaker(): boolean {
    const reset = this.circuitBreaker.resetCircuit(this.SERVICE_NAME);
    if (reset) {
      this.logger.log('Circuit breaker reset - attempting MCP service recovery');
    }
    return reset;
  }
}