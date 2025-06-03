// Express-compatible Student Profiling Service with Repository Integration
import { StudentProfilingMCPClient, MCPToolResponse, StudentProfile, PrivacyChoices, PrivacyDashboard } from './mcp/StudentProfilingMCPClient';
import { StudentProfilingHTTPClient, HTTPResponse } from './http/StudentProfilingHTTPClient';
import { StudentProfilingRepository } from '../repositories/interfaces';
import { PrivacyContext } from '../types/privacy';
import { ServiceFactory } from '../container/ServiceFactory';

export interface StudentProfilingConfig {
  preferMCP: boolean;
  httpFallback: boolean;
  repositoryFallback: boolean;
  httpConfig?: {
    baseURL: string;
    timeout?: number;
    apiKey?: string;
  };
}

export class StudentProfilingService {
  private mcpClient?: StudentProfilingMCPClient;
  private httpClient?: StudentProfilingHTTPClient;
  private repository?: StudentProfilingRepository;
  private config: StudentProfilingConfig;

  constructor() {
    // Default configuration with repository pattern integration
    this.config = {
      preferMCP: true,
      httpFallback: true,
      repositoryFallback: true, // Added repository as final fallback
      httpConfig: {
        baseURL: process.env.STUDENT_PROFILING_API_URL || 'http://localhost:3002/api/v1',
        timeout: 10000,
        apiKey: process.env.STUDENT_PROFILING_API_KEY
      }
    };
  }

  async initialize(): Promise<void> {
    try {
      // Get services from service factory
      const serviceFactory = ServiceFactory.getInstance();
      this.mcpClient = serviceFactory.getStudentProfilingMCPClient();
      this.repository = serviceFactory.getStudentProfilingRepository();

      // Initialize HTTP client if fallback is enabled
      if (this.config.httpFallback && this.config.httpConfig) {
        this.httpClient = new StudentProfilingHTTPClient(this.config.httpConfig);
        await this.httpClient.connect();
      }

      console.log('Student Profiling Service initialized with repository pattern');
    } catch (error) {
      console.error('Failed to initialize Student Profiling Service:', error);
    }
  }

  private async executeWithFallback<T>(
    operation: string,
    mcpOperation: () => Promise<MCPToolResponse<T>>,
    httpOperation?: () => Promise<HTTPResponse<T>>,
    repositoryOperation?: () => Promise<T>
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const executionLog: string[] = [];

    // Try MCP first if preferred and available
    if (this.config.preferMCP && this.mcpClient?.isConnected()) {
      try {
        console.log(`Executing ${operation} via MCP`);
        executionLog.push('MCP attempt');
        const result = await mcpOperation();
        if (result.success) {
          return result;
        }
        console.warn(`MCP ${operation} failed: ${result.error}`);
        executionLog.push(`MCP failed: ${result.error}`);
      } catch (error) {
        console.error(`MCP ${operation} error:`, error);
        executionLog.push(`MCP error: ${error.message}`);
      }
    }

    // Fallback to HTTP if available
    if (this.config.httpFallback && this.httpClient?.isConnected() && httpOperation) {
      try {
        console.log(`Executing ${operation} via HTTP fallback`);
        executionLog.push('HTTP attempt');
        const result = await httpOperation();
        if (result.success) {
          return result;
        }
        console.warn(`HTTP ${operation} failed: ${result.error}`);
        executionLog.push(`HTTP failed: ${result.error}`);
      } catch (error) {
        console.error(`HTTP ${operation} error:`, error);
        executionLog.push(`HTTP error: ${error.message}`);
      }
    }

    // Final fallback to repository if available
    if (this.config.repositoryFallback && this.repository && repositoryOperation) {
      try {
        console.log(`Executing ${operation} via Repository fallback`);
        executionLog.push('Repository attempt');
        const result = await repositoryOperation();
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error(`Repository ${operation} error:`, error);
        executionLog.push(`Repository error: ${error.message}`);
      }
    }

    // If all methods fail
    return {
      success: false,
      error: `${operation} failed on all available channels: ${executionLog.join(' -> ')}`
    };
  }

  private createPrivacyContext(userId: string, purpose: string): PrivacyContext {
    return {
      requesterId: userId,
      requesterType: 'system',
      purpose: purpose,
      educationalJustification: 'Student profiling service operation'
    };
  }

  /**
   * Build a student profile with privacy controls
   */
  async buildStudentProfile(
    studentId: string,
    requesterContext: {
      userId: string;
      role: 'student' | 'teacher' | 'parent' | 'admin';
      purpose: string;
    },
    includePrivateData: boolean = false
  ): Promise<{ success: boolean; data?: StudentProfile; error?: string }> {
    const privacyContext = this.createPrivacyContext(requesterContext.userId, requesterContext.purpose);

    return this.executeWithFallback(
      'buildStudentProfile',
      () => this.mcpClient!.buildStudentProfile(studentId, requesterContext, includePrivateData),
      () => this.httpClient!.buildStudentProfile(studentId, requesterContext, includePrivateData),
      () => this.repository!.buildStudentProfile(studentId, requesterContext, includePrivateData, privacyContext)
    );
  }

  /**
   * Manage student privacy choices
   */
  async managePrivacyChoices(
    studentId: string,
    choices: Partial<PrivacyChoices>
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const privacyContext = this.createPrivacyContext(studentId, 'privacy_choice_management');

    return this.executeWithFallback(
      'managePrivacyChoices',
      () => this.mcpClient!.managePrivacyChoices(studentId, choices),
      () => this.httpClient!.updatePrivacyChoices(studentId, choices),
      () => this.repository!.updatePrivacyChoices(studentId, choices, privacyContext)
    );
  }

  /**
   * Generate privacy-preserving analytics
   */
  async generatePrivacyPreservingAnalytics(
    cohortIds: string[],
    metrics: string[],
    epsilon?: number,
    delta?: number
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const privacyContext = this.createPrivacyContext('system', 'privacy_preserving_analytics');

    return this.executeWithFallback(
      'generatePrivacyPreservingAnalytics',
      () => this.mcpClient!.generatePrivacyPreservingAnalytics(cohortIds, metrics, epsilon, delta),
      () => this.httpClient!.generatePrivacyPreservingAnalytics(cohortIds, metrics, epsilon, delta),
      () => this.repository!.generatePrivacyPreservingAnalytics(cohortIds, metrics, epsilon, delta, privacyContext)
    );
  }

  /**
   * Validate data access request
   */
  async validateDataAccessRequest(
    requesterId: string,
    requesterType: 'teacher' | 'peer' | 'platform' | 'researcher',
    studentId: string,
    purpose: string,
    dataTypes: string[],
    studentBenefit?: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const privacyContext = this.createPrivacyContext(requesterId, purpose);

    return this.executeWithFallback(
      'validateDataAccessRequest',
      () => this.mcpClient!.validateDataAccessRequest(requesterId, requesterType, studentId, purpose, dataTypes, studentBenefit),
      () => this.httpClient!.validateDataAccessRequest({
        requesterId,
        requesterType,
        studentId,
        purpose,
        dataTypes,
        studentBenefit
      }),
      () => this.repository!.validateDataAccessRequest(requesterId, requesterType, studentId, purpose, dataTypes, studentBenefit, privacyContext)
    );
  }

  /**
   * Create student privacy dashboard
   */
  async createPrivacyDashboard(
    studentId: string,
    includeRecommendations: boolean = true,
    timeRange: string = 'month'
  ): Promise<{ success: boolean; data?: PrivacyDashboard; error?: string }> {
    const privacyContext = this.createPrivacyContext(studentId, 'privacy_dashboard_generation');

    return this.executeWithFallback(
      'createPrivacyDashboard',
      () => this.mcpClient!.createPrivacyDashboard(studentId, includeRecommendations, timeRange),
      () => this.httpClient!.getPrivacyDashboard(studentId, includeRecommendations, timeRange),
      () => this.repository!.createPrivacyDashboard(studentId, includeRecommendations, timeRange, privacyContext)
    );
  }

  /**
   * Track learning trajectory with privacy controls
   */
  async trackLearningTrajectory(
    studentId: string,
    milestone: {
      skill: string;
      level: number;
      evidence?: string[];
    },
    privacyLevel: 'full' | 'anonymized' | 'aggregate' = 'anonymized'
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const privacyContext = this.createPrivacyContext(studentId, 'learning_trajectory_tracking');

    return this.executeWithFallback(
      'trackLearningTrajectory',
      () => this.mcpClient!.trackLearningTrajectory(studentId, milestone, privacyLevel),
      () => this.httpClient!.trackLearningTrajectory(studentId, milestone, privacyLevel),
      () => this.repository!.trackLearningTrajectory(studentId, milestone, privacyLevel, privacyContext)
    );
  }

  /**
   * Assess skill development with sharing controls
   */
  async assessSkillDevelopment(
    studentId: string,
    skills: Array<{
      skillName: string;
      currentLevel: number;
      targetLevel: number;
      progress: number;
    }>,
    sharedWith: string[] = []
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const privacyContext = this.createPrivacyContext(studentId, 'skill_development_assessment');

    return this.executeWithFallback(
      'assessSkillDevelopment',
      () => this.mcpClient!.assessSkillDevelopment(studentId, skills, sharedWith),
      () => this.httpClient!.assessSkillDevelopment(studentId, skills, sharedWith),
      () => this.repository!.assessSkillDevelopment(studentId, skills, sharedWith, privacyContext)
    );
  }

  /**
   * Generate personalized recommendations with value exchange
   */
  async generatePersonalizedRecommendations(
    studentId: string,
    useEnhancedData: boolean = false,
    recommendationTypes?: string[]
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const privacyContext = this.createPrivacyContext(studentId, 'personalized_recommendation_generation');

    return this.executeWithFallback(
      'generatePersonalizedRecommendations',
      () => this.mcpClient!.generatePersonalizedRecommendations(studentId, useEnhancedData, recommendationTypes),
      () => this.httpClient!.generatePersonalizedRecommendations(studentId, { useEnhancedData, recommendationTypes }),
      () => this.repository!.generatePersonalizedRecommendations(studentId, useEnhancedData, recommendationTypes, privacyContext)
    );
  }

  /**
   * Get service health status
   */
  getServiceStatus(): {
    mcpConnected: boolean;
    httpConnected: boolean;
    repositoryAvailable: boolean;
    preferredMethod: 'MCP' | 'HTTP' | 'Repository';
  } {
    return {
      mcpConnected: this.mcpClient?.isConnected() || false,
      httpConnected: this.httpClient?.isConnected() || false,
      repositoryAvailable: !!this.repository,
      preferredMethod: this.config.preferMCP ? 'MCP' : (this.config.httpFallback ? 'HTTP' : 'Repository')
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<StudentProfilingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Student Profiling Service configuration updated');
  }

  /**
   * Get repository instance for direct access (if needed)
   */
  getRepository(): StudentProfilingRepository | undefined {
    return this.repository;
  }

  /**
   * Test repository integration
   */
  async testRepositoryIntegration(studentId: string): Promise<{
    success: boolean;
    results: {
      profileBuilt: boolean;
      privacyChoicesUpdated: boolean;
      trajectoryTracked: boolean;
      repositoryHealthy: boolean;
    };
    error?: string;
  }> {
    if (!this.repository) {
      return {
        success: false,
        results: {
          profileBuilt: false,
          privacyChoicesUpdated: false,
          trajectoryTracked: false,
          repositoryHealthy: false
        },
        error: 'Repository not available'
      };
    }

    try {
      const privacyContext = this.createPrivacyContext(studentId, 'integration_test');
      
      // Test profile building
      const profile = await this.repository.buildStudentProfile(
        studentId,
        { userId: studentId, role: 'student', purpose: 'test' },
        false,
        privacyContext
      );

      // Test privacy choices
      const privacyChoices = await this.repository.updatePrivacyChoices(
        studentId,
        { educationalSharing: { teacher: true, peer: false, parent: true } },
        privacyContext
      );

      // Test learning trajectory
      const milestone = await this.repository.trackLearningTrajectory(
        studentId,
        { skill: 'test-skill', level: 5, evidence: ['test-evidence'] },
        'anonymized',
        privacyContext
      );

      return {
        success: true,
        results: {
          profileBuilt: !!profile,
          privacyChoicesUpdated: !!privacyChoices,
          trajectoryTracked: !!milestone,
          repositoryHealthy: true
        }
      };
    } catch (error) {
      return {
        success: false,
        results: {
          profileBuilt: false,
          privacyChoicesUpdated: false,
          trajectoryTracked: false,
          repositoryHealthy: false
        },
        error: error.message
      };
    }
  }
}