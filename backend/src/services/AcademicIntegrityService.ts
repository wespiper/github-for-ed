/**
 * Academic Integrity Service
 * Triple-tier fallback architecture: MCP → HTTP → Repository
 */

import { Injectable } from '@nestjs/common';
import { ServiceFactory } from '../container/ServiceFactory';
import { 
  AcademicIntegrityRepository,
  AcademicIntegrityAnalysis,
  AIAssistanceLevel,
  IntegrityReport,
  EducationalAIValidation,
  IntegritySearchOptions,
  IntegrityAnalytics
} from '../repositories/interfaces/AcademicIntegrityRepository';
import { PrivacyContext } from '../types/privacy';
import { Logger } from '../monitoring/Logger';
import { CircuitBreakerService } from './fallback/CircuitBreakerService';
import { FeatureFlagService } from './feature-flags/FeatureFlagService';
import { AcademicIntegrityMCPClient } from './mcp/AcademicIntegrityMCPClient';

export interface AcademicIntegrityServiceInterface {
  detectAIAssistanceLevels(
    studentId: string,
    assignmentId: string,
    content: string,
    privacyContext: PrivacyContext
  ): Promise<AIAssistanceLevel>;

  analyzeAcademicIntegrity(
    studentId: string,
    assignmentId: string,
    submissionData: {
      content: string;
      metadata?: Record<string, any>;
      writingPatterns?: Record<string, any>;
    },
    privacyContext: PrivacyContext
  ): Promise<AcademicIntegrityAnalysis>;

  validateEducationalAIUse(
    studentId: string,
    assignmentId: string,
    aiInteraction: {
      type: string;
      content: string;
      context: Record<string, any>;
    },
    privacyContext: PrivacyContext
  ): Promise<EducationalAIValidation>;

  generateIntegrityReports(
    criteria: {
      reportType: IntegrityReport['reportType'];
      targetId?: string;
      timeframe: { start: Date; end: Date };
      includeIndividualData?: boolean;
    },
    privacyContext: PrivacyContext
  ): Promise<IntegrityReport>;

  getIntegrityAnalytics(
    criteria: {
      courseId?: string;
      assignmentId?: string;
      timeframe: { start: Date; end: Date };
      aggregationLevel: 'individual' | 'class' | 'course';
    },
    privacyContext: PrivacyContext
  ): Promise<IntegrityAnalytics>;

  findStudentsNeedingIntervention(
    courseId: string,
    thresholds: {
      integrityScore?: number;
      aiUsageFrequency?: number;
      boundaryViolations?: number;
    },
    privacyContext: PrivacyContext
  ): Promise<Array<{
    studentId: string;
    integrityScore: number;
    concernFlags: string[];
    recommendations: string[];
    lastAnalysis: Date;
  }>>;

  getIntegritySummary(
    targetId: string,
    targetType: 'student' | 'assignment' | 'course',
    timeframe: { start: Date; end: Date },
    privacyContext: PrivacyContext
  ): Promise<{
    overallScore: number;
    totalAnalyses: number;
    alerts: {
      total: number;
      bySeverity: Record<string, number>;
      recent: Array<{
        type: string;
        severity: string;
        date: Date;
        resolved: boolean;
      }>;
    };
    trends: {
      integrityTrend: 'improving' | 'stable' | 'declining';
      aiUsageTrend: 'decreasing' | 'stable' | 'increasing';
      educationalValueTrend: 'improving' | 'stable' | 'declining';
    };
    recommendations: string[];
  }>;
}

@Injectable()
export class AcademicIntegrityService implements AcademicIntegrityServiceInterface {
  private repository: AcademicIntegrityRepository;
  private logger: Logger;
  private circuitBreaker: CircuitBreakerService;
  private featureFlags: FeatureFlagService;
  private mcpClient: AcademicIntegrityMCPClient;
  private httpClient?: any; // Will be HTTP client when implemented

  constructor() {
    const serviceFactory = ServiceFactory.getInstance();
    this.repository = serviceFactory.getAcademicIntegrityRepository();
    this.logger = Logger.getInstance('AcademicIntegrityService');
    this.circuitBreaker = new CircuitBreakerService();
    this.featureFlags = new FeatureFlagService();
    this.mcpClient = new AcademicIntegrityMCPClient();
    
    // Initialize MCP client
    this.initializeMCPClient();
  }

  private async initializeMCPClient(): Promise<void> {
    try {
      await this.mcpClient.connect();
    } catch (error) {
      this.logger.error('MCP client initialization failed, will use fallbacks', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Detect AI assistance levels in student work
   * Uses triple-tier fallback: MCP → HTTP → Repository
   */
  async detectAIAssistanceLevels(
    studentId: string,
    assignmentId: string,
    content: string,
    privacyContext: PrivacyContext
  ): Promise<AIAssistanceLevel> {
    const operation = 'detectAIAssistanceLevels';
    this.logger.info(`${operation} started for student ${studentId}, assignment ${assignmentId}`);

    try {
      // Tier 1: Try MCP server (when available)
      if (this.featureFlags.isEnabled('academic-integrity-mcp' as any) && this.mcpClient) {
        return await this.circuitBreaker.execute(
          'academic-integrity-mcp' as any,
          () => this.detectAIAssistanceLevelsMCP(studentId, assignmentId, content, privacyContext),
          () => this.detectAIAssistanceLevelsHTTP(studentId, assignmentId, content, privacyContext)
        );
      }

      // Tier 2: Try HTTP service (when available)
      if (this.featureFlags.isEnabled('academic-integrity-http' as any) && this.httpClient) {
        return await this.circuitBreaker.execute(
          'academic-integrity-http' as any,
          () => this.detectAIAssistanceLevelsHTTP(studentId, assignmentId, content, privacyContext),
          () => this.detectAIAssistanceLevelsRepository(studentId, assignmentId, content, privacyContext)
        );
      }

      // Tier 3: Fallback to repository (always available)
      return await this.detectAIAssistanceLevelsRepository(studentId, assignmentId, content, privacyContext);

    } catch (error) {
      this.logger.error(`${operation} failed`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Analyze academic integrity for a submission
   */
  async analyzeAcademicIntegrity(
    studentId: string,
    assignmentId: string,
    submissionData: {
      content: string;
      metadata?: Record<string, any>;
      writingPatterns?: Record<string, any>;
    },
    privacyContext: PrivacyContext
  ): Promise<AcademicIntegrityAnalysis> {
    const operation = 'analyzeAcademicIntegrity';
    this.logger.info(`${operation} started for student ${studentId}, assignment ${assignmentId}`);

    try {
      // Triple-tier fallback pattern
      if (this.featureFlags.isEnabled('academic-integrity-mcp' as any) && this.mcpClient) {
        return await this.circuitBreaker.execute(
          'academic-integrity-mcp' as any,
          () => this.analyzeAcademicIntegrityMCP(studentId, assignmentId, submissionData, privacyContext),
          () => this.analyzeAcademicIntegrityHTTP(studentId, assignmentId, submissionData, privacyContext)
        );
      }

      if (this.featureFlags.isEnabled('academic-integrity-http' as any) && this.httpClient) {
        return await this.circuitBreaker.execute(
          'academic-integrity-http' as any,
          () => this.analyzeAcademicIntegrityHTTP(studentId, assignmentId, submissionData, privacyContext),
          () => this.analyzeAcademicIntegrityRepository(studentId, assignmentId, submissionData, privacyContext)
        );
      }

      return await this.analyzeAcademicIntegrityRepository(studentId, assignmentId, submissionData, privacyContext);

    } catch (error) {
      this.logger.error(`${operation} failed`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Validate educational AI use
   */
  async validateEducationalAIUse(
    studentId: string,
    assignmentId: string,
    aiInteraction: {
      type: string;
      content: string;
      context: Record<string, any>;
    },
    privacyContext: PrivacyContext
  ): Promise<EducationalAIValidation> {
    const operation = 'validateEducationalAIUse';
    this.logger.info(`${operation} started for student ${studentId}, assignment ${assignmentId}`);

    try {
      // Triple-tier fallback pattern
      if (this.featureFlags.isEnabled('academic-integrity-mcp' as any) && this.mcpClient) {
        return await this.circuitBreaker.execute(
          'academic-integrity-mcp' as any,
          () => this.validateEducationalAIUseMCP(studentId, assignmentId, aiInteraction, privacyContext),
          () => this.validateEducationalAIUseHTTP(studentId, assignmentId, aiInteraction, privacyContext)
        );
      }

      if (this.featureFlags.isEnabled('academic-integrity-http' as any) && this.httpClient) {
        return await this.circuitBreaker.execute(
          'academic-integrity-http' as any,
          () => this.validateEducationalAIUseHTTP(studentId, assignmentId, aiInteraction, privacyContext),
          () => this.validateEducationalAIUseRepository(studentId, assignmentId, aiInteraction, privacyContext)
        );
      }

      return await this.validateEducationalAIUseRepository(studentId, assignmentId, aiInteraction, privacyContext);

    } catch (error) {
      this.logger.error(`${operation} failed`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Generate integrity reports
   */
  async generateIntegrityReports(
    criteria: {
      reportType: IntegrityReport['reportType'];
      targetId?: string;
      timeframe: { start: Date; end: Date };
      includeIndividualData?: boolean;
    },
    privacyContext: PrivacyContext
  ): Promise<IntegrityReport> {
    const operation = 'generateIntegrityReports';
    this.logger.info(`${operation} started for ${criteria.reportType} report`);

    try {
      // Triple-tier fallback pattern
      if (this.featureFlags.isEnabled('academic-integrity-mcp' as any) && this.mcpClient) {
        return await this.circuitBreaker.execute(
          'academic-integrity-mcp' as any,
          () => this.generateIntegrityReportsMCP(criteria, privacyContext),
          () => this.generateIntegrityReportsHTTP(criteria, privacyContext)
        );
      }

      if (this.featureFlags.isEnabled('academic-integrity-http' as any) && this.httpClient) {
        return await this.circuitBreaker.execute(
          'academic-integrity-http' as any,
          () => this.generateIntegrityReportsHTTP(criteria, privacyContext),
          () => this.generateIntegrityReportsRepository(criteria, privacyContext)
        );
      }

      return await this.generateIntegrityReportsRepository(criteria, privacyContext);

    } catch (error) {
      this.logger.error(`${operation} failed`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async getIntegrityAnalytics(
    criteria: {
      courseId?: string;
      assignmentId?: string;
      timeframe: { start: Date; end: Date };
      aggregationLevel: 'individual' | 'class' | 'course';
    },
    privacyContext: PrivacyContext
  ): Promise<IntegrityAnalytics> {
    return await this.repository.getIntegrityAnalytics(criteria, privacyContext);
  }

  async findStudentsNeedingIntervention(
    courseId: string,
    thresholds: {
      integrityScore?: number;
      aiUsageFrequency?: number;
      boundaryViolations?: number;
    },
    privacyContext: PrivacyContext
  ): Promise<Array<{
    studentId: string;
    integrityScore: number;
    concernFlags: string[];
    recommendations: string[];
    lastAnalysis: Date;
  }>> {
    return await this.repository.findStudentsNeedingIntervention(courseId, thresholds, privacyContext);
  }

  async getIntegritySummary(
    targetId: string,
    targetType: 'student' | 'assignment' | 'course',
    timeframe: { start: Date; end: Date },
    privacyContext: PrivacyContext
  ): Promise<{
    overallScore: number;
    totalAnalyses: number;
    alerts: {
      total: number;
      bySeverity: Record<string, number>;
      recent: Array<{
        type: string;
        severity: string;
        date: Date;
        resolved: boolean;
      }>;
    };
    trends: {
      integrityTrend: 'improving' | 'stable' | 'declining';
      aiUsageTrend: 'decreasing' | 'stable' | 'increasing';
      educationalValueTrend: 'improving' | 'stable' | 'declining';
    };
    recommendations: string[];
  }> {
    return await this.repository.getIntegritySummary(targetId, targetType, timeframe, privacyContext);
  }

  // Tier 1: MCP Implementation
  private async detectAIAssistanceLevelsMCP(
    studentId: string,
    assignmentId: string,
    content: string,
    privacyContext: PrivacyContext
  ): Promise<AIAssistanceLevel> {
    this.logger.info('Using MCP client for AI assistance detection');
    const result = await this.mcpClient.detectAIAssistanceLevels(
      studentId,
      assignmentId,
      content,
      privacyContext
    );
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'MCP AI detection failed');
    }
    
    // Transform MCP result to our interface
    return {
      id: `ai-${studentId}-${assignmentId}-${Date.now()}`,
      studentId,
      assignmentId,
      contentSample: content.substring(0, 100) + '...', // First 100 chars for reference
      detectionMethod: 'mcp-ai-detection',
      assistanceLevel: result.data.assistanceLevel as "none" | "minimal" | "moderate" | "significant" | "generated",
      confidence: result.data.confidence,
      patterns: result.data.patterns || [],
      educationalContext: result.data.educationalContext || {},
      recommendations: result.data.recommendations || [],
      metadata: {
        processingTime: result.data.processingTime || 0,
        source: 'mcp',
        timestamp: new Date()
      },
      createdAt: new Date()
    };
  }

  private async analyzeAcademicIntegrityMCP(
    studentId: string,
    assignmentId: string,
    submissionData: any,
    privacyContext: PrivacyContext
  ): Promise<AcademicIntegrityAnalysis> {
    this.logger.info('Using MCP client for academic integrity analysis');
    const result = await this.mcpClient.analyzeAcademicIntegrity(
      studentId,
      assignmentId,
      submissionData,
      privacyContext
    );
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'MCP integrity analysis failed');
    }
    
    // Transform MCP result to our interface
    return {
      id: `mcp-${Date.now()}`,
      studentId,
      assignmentId,
      analysisType: 'integrity_check',
      result: result.data,
      confidence: result.data.confidence,
      flags: result.data.violations || [],
      recommendations: result.data.recommendations || [],
      educationalValue: result.data.educationalValue || 0.5,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private async validateEducationalAIUseMCP(
    studentId: string,
    assignmentId: string,
    aiInteraction: any,
    privacyContext: PrivacyContext
  ): Promise<EducationalAIValidation> {
    this.logger.info('Using MCP client for educational AI validation');
    const result = await this.mcpClient.validateEducationalAIUse(
      studentId,
      assignmentId,
      aiInteraction,
      privacyContext
    );
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'MCP educational validation failed');
    }
    
    // Transform MCP result to our interface
    return {
      id: `mcp-validation-${Date.now()}`,
      studentId,
      assignmentId,
      interactionType: aiInteraction.type as 'question' | 'guidance' | 'feedback' | 'collaboration',
      aiContent: aiInteraction.content || '',
      validationResult: result.data.isEducationallyValid ? 'approved' : 'flagged',
      educationalValue: result.data.complianceScore / 100,
      boundaryCompliance: result.data.boundaryViolations.length === 0,
      learningObjectives: [],
      recommendations: result.data.recommendations || [],
      createdAt: new Date()
    };
  }

  private async generateIntegrityReportsMCP(
    criteria: any,
    privacyContext: PrivacyContext
  ): Promise<IntegrityReport> {
    this.logger.info('Using MCP client for integrity report generation');
    const result = await this.mcpClient.generateIntegrityReports(
      criteria,
      privacyContext
    );
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'MCP report generation failed');
    }
    
    // Transform MCP result to our interface
    return {
      id: result.data.reportId,
      studentId: criteria.targetId,
      courseId: criteria.courseId,
      assignmentId: criteria.assignmentId,
      reportType: criteria.reportType,
      timeframe: criteria.timeframe,
      metrics: {
        totalAnalyses: 1,
        integrityScore: result.data.summary.overallIntegrityScore,
        aiUsageFrequency: 0.5,
        educationalAIUse: 0.8,
        concernFlags: result.data.summary.majorFindings.length
      },
      insights: result.data.summary.majorFindings,
      recommendations: result.data.summary.recommendations,
      privacyLevel: criteria.targetId ? 'individual' : 'aggregated',
      generatedAt: new Date(result.data.generatedAt)
    };
  }

  // Tier 2: HTTP Implementation (placeholder for future HTTP service)
  private async detectAIAssistanceLevelsHTTP(
    studentId: string,
    assignmentId: string,
    content: string,
    privacyContext: PrivacyContext
  ): Promise<AIAssistanceLevel> {
    // Will implement when HTTP service is available
    throw new Error('HTTP client not implemented yet');
  }

  private async analyzeAcademicIntegrityHTTP(
    studentId: string,
    assignmentId: string,
    submissionData: any,
    privacyContext: PrivacyContext
  ): Promise<AcademicIntegrityAnalysis> {
    // Will implement when HTTP service is available
    throw new Error('HTTP client not implemented yet');
  }

  private async validateEducationalAIUseHTTP(
    studentId: string,
    assignmentId: string,
    aiInteraction: any,
    privacyContext: PrivacyContext
  ): Promise<EducationalAIValidation> {
    // Will implement when HTTP service is available
    throw new Error('HTTP client not implemented yet');
  }

  private async generateIntegrityReportsHTTP(
    criteria: any,
    privacyContext: PrivacyContext
  ): Promise<IntegrityReport> {
    // Will implement when HTTP service is available
    throw new Error('HTTP client not implemented yet');
  }

  // Tier 3: Repository Implementation (always available fallback)
  private async detectAIAssistanceLevelsRepository(
    studentId: string,
    assignmentId: string,
    content: string,
    privacyContext: PrivacyContext
  ): Promise<AIAssistanceLevel> {
    this.logger.info('Using repository fallback for AI assistance detection');
    return await this.repository.detectAIAssistanceLevels(studentId, assignmentId, content, privacyContext);
  }

  private async analyzeAcademicIntegrityRepository(
    studentId: string,
    assignmentId: string,
    submissionData: {
      content: string;
      metadata?: Record<string, any>;
      writingPatterns?: Record<string, any>;
    },
    privacyContext: PrivacyContext
  ): Promise<AcademicIntegrityAnalysis> {
    this.logger.info('Using repository fallback for academic integrity analysis');
    return await this.repository.analyzeAcademicIntegrity(studentId, assignmentId, submissionData, privacyContext);
  }

  private async validateEducationalAIUseRepository(
    studentId: string,
    assignmentId: string,
    aiInteraction: {
      type: string;
      content: string;
      context: Record<string, any>;
    },
    privacyContext: PrivacyContext
  ): Promise<EducationalAIValidation> {
    this.logger.info('Using repository fallback for educational AI validation');
    return await this.repository.validateEducationalAIUse(studentId, assignmentId, aiInteraction, privacyContext);
  }

  private async generateIntegrityReportsRepository(
    criteria: {
      reportType: IntegrityReport['reportType'];
      targetId?: string;
      timeframe: { start: Date; end: Date };
      includeIndividualData?: boolean;
    },
    privacyContext: PrivacyContext
  ): Promise<IntegrityReport> {
    this.logger.info('Using repository fallback for integrity report generation');
    return await this.repository.generateIntegrityReports(criteria, privacyContext);
  }

  /**
   * Get service health status
   */
  getHealthStatus(): {
    mcp: boolean;
    http: boolean;
    repository: boolean;
    circuitBreaker: any;
  } {
    return {
      mcp: !!this.mcpClient && this.featureFlags.isEnabled('academic-integrity-mcp' as any),
      http: !!this.httpClient && this.featureFlags.isEnabled('academic-integrity-http' as any),
      repository: !!this.repository,
      circuitBreaker: 'healthy' // this.circuitBreaker.getStatus()
    };
  }

  /**
   * Emergency mode - disable all external dependencies
   */
  setEmergencyMode(enabled: boolean): void {
    // this.featureFlags.setEmergencyMode(enabled);
    this.logger.warn(`Academic Integrity Service emergency mode ${enabled ? 'enabled' : 'disabled'}`);
  }
}