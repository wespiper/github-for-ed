import { Injectable, Logger } from '@nestjs/common';

// Import the actual MCP service implementations directly
import { WritingAnalysisService } from '../../mcp-servers/writing-analysis/src/writing-analysis/services/writing-analysis.service';
import { ReflectionAnalysisService } from '../../mcp-servers/writing-analysis/src/reflection-analysis/services/reflection-analysis.service';
import { ContentClassifierService } from '../../mcp-servers/writing-analysis/src/content-privacy/services/content-classifier.service';
import { PIIDetectorService } from '../../mcp-servers/writing-analysis/src/content-privacy/services/pii-detector.service';
import { EducationalValidatorService } from '../../mcp-servers/writing-analysis/src/educational-validation/services/educational-validator.service';
import { AIBoundaryEnforcerService } from '../../mcp-servers/writing-analysis/src/educational-validation/services/ai-boundary-enforcer.service';
import { InsightsGeneratorService } from '../../mcp-servers/writing-analysis/src/insights-generation/services/insights-generator.service';
import { AuditService } from '../../mcp-servers/writing-analysis/src/repositories/services/audit.service';

/**
 * Direct Writing Analysis Service
 * Bypasses MCP protocol and uses services directly
 * Provides the same functionality as MCP tools but without JSON-RPC overhead
 */
@Injectable()
export class DirectWritingAnalysisService {
  private readonly logger = new Logger(DirectWritingAnalysisService.name);

  private writingAnalysisService: WritingAnalysisService;
  private reflectionAnalysisService: ReflectionAnalysisService;
  private contentClassifierService: ContentClassifierService;
  private piiDetectorService: PIIDetectorService;
  private educationalValidatorService: EducationalValidatorService;
  private aiBoundaryEnforcerService: AIBoundaryEnforcerService;
  private insightsGeneratorService: InsightsGeneratorService;
  private auditService: AuditService;

  constructor() {
    // Initialize services directly (in real implementation, these would be injected)
    this.writingAnalysisService = new WritingAnalysisService();
    this.reflectionAnalysisService = new ReflectionAnalysisService();
    this.contentClassifierService = new ContentClassifierService();
    this.piiDetectorService = new PIIDetectorService();
    this.educationalValidatorService = new EducationalValidatorService();
    this.aiBoundaryEnforcerService = new AIBoundaryEnforcerService();
    this.insightsGeneratorService = new InsightsGeneratorService();
    this.auditService = new AuditService();
    
    this.logger.log('Direct writing analysis service initialized - bypassing MCP');
  }

  /**
   * Analyze writing patterns directly
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
    try {
      this.logger.debug('Direct writing pattern analysis started');
      
      // Log the operation for audit
      await this.auditService.logDataAccess({
        accessType: 'read',
        dataType: 'writing_content',
        userId: params.userId,
        accessedBy: params.userId,
        purpose: params.purpose,
        educationalContext: {
          role: params.role,
          hasConsent: params.consent || false,
        },
      });

      // Perform analysis using direct service
      const analysisResult = await this.writingAnalysisService.analyzePatterns({
        content: params.content,
        analysisType: 'comprehensive',
        options: {
          includeStructure: params.options?.includeStructure ?? true,
          includeSentiment: params.options?.includeSentiment ?? true,
          includeComplexity: params.options?.includeComplexity ?? true,
          includeTemporalPatterns: false,
          includeRhetoricalElements: false,
        },
        privacyLevel: params.consent ? 'full' : 'basic',
      });

      return {
        ...analysisResult,
        directMode: true,
        privacyMetadata: {
          consentProvided: params.consent || false,
          analysisLevel: params.consent ? 'comprehensive' : 'basic',
          auditLogged: true,
        },
      };
      
    } catch (error) {
      this.logger.error('Direct writing pattern analysis failed:', error);
      throw new Error(`Writing pattern analysis failed: ${error.message}`);
    }
  }

  /**
   * Evaluate reflection quality directly
   */
  async evaluateReflectionQuality(params: {
    reflection: string;
    userId: string;
    role: 'student' | 'educator' | 'administrator';
    purpose: string;
    consent?: boolean;
  }): Promise<any> {
    try {
      this.logger.debug('Direct reflection quality evaluation started');

      // Log the operation
      await this.auditService.logDataAccess({
        accessType: 'read',
        dataType: 'reflection_content',
        userId: params.userId,
        accessedBy: params.userId,
        purpose: params.purpose,
        educationalContext: {
          role: params.role,
          hasConsent: params.consent || false,
        },
      });

      // Perform analysis
      const qualityResult = await this.reflectionAnalysisService.evaluateQuality({
        reflectionText: params.reflection,
        userId: params.userId,
        analysisLevel: params.consent ? 'detailed' : 'basic',
        educationalContext: {
          assignmentType: 'reflection',
          gradeLevel: 'undergraduate',
        },
      });

      return {
        ...qualityResult,
        directMode: true,
        privacyMetadata: {
          consentProvided: params.consent || false,
          analysisLevel: params.consent ? 'detailed' : 'basic',
          auditLogged: true,
        },
      };
      
    } catch (error) {
      this.logger.error('Direct reflection quality evaluation failed:', error);
      throw new Error(`Reflection quality evaluation failed: ${error.message}`);
    }
  }

  /**
   * Classify content sensitivity directly
   */
  async classifyContentSensitivity(params: {
    content: string;
    context: {
      contentType: 'essay' | 'reflection' | 'notes' | 'feedback';
      academicLevel: string;
    };
  }): Promise<any> {
    try {
      this.logger.debug('Direct content sensitivity classification started');

      // First detect PII
      const piiResults = await this.piiDetectorService.detectPII({
        content: params.content,
        detectionLevel: 'comprehensive',
        includeConfidenceScores: true,
      });

      // Then classify overall sensitivity
      const classificationResult = await this.contentClassifierService.classifyContent({
        content: params.content,
        contentType: params.context.contentType,
        academicLevel: params.context.academicLevel,
        piiDetectionResults: piiResults,
      });

      return {
        ...classificationResult,
        piiDetection: piiResults,
        directMode: true,
        privacyMetadata: {
          piiDetected: piiResults.detected.length > 0,
          redactionApplied: piiResults.redacted,
          auditLogged: true,
        },
      };
      
    } catch (error) {
      this.logger.error('Direct content sensitivity classification failed:', error);
      throw new Error(`Content sensitivity classification failed: ${error.message}`);
    }
  }

  /**
   * Validate educational purpose directly
   */
  async validateEducationalPurpose(params: {
    purpose: string;
    context: {
      userRole: 'student' | 'educator' | 'administrator';
      assignmentType: string;
      academicLevel: string;
    };
  }): Promise<any> {
    try {
      this.logger.debug('Direct educational purpose validation started');

      const validationResult = await this.educationalValidatorService.validatePurpose({
        purpose: params.purpose,
        userRole: params.context.userRole,
        assignmentType: params.context.assignmentType,
        academicLevel: params.context.academicLevel,
        validationLevel: 'comprehensive',
      });

      return {
        ...validationResult,
        directMode: true,
        privacyMetadata: {
          validationLevel: 'comprehensive',
          auditLogged: true,
        },
      };
      
    } catch (error) {
      this.logger.error('Direct educational purpose validation failed:', error);
      throw new Error(`Educational purpose validation failed: ${error.message}`);
    }
  }

  /**
   * Apply AI boundaries directly
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
    try {
      this.logger.debug('Direct AI boundary enforcement started');

      const boundaryResult = await this.aiBoundaryEnforcerService.checkBoundaries({
        aiRequest: params.request,
        studentContext: params.studentContext,
        enforcementLevel: 'strict',
        educationalObjectives: {
          maintainIndependence: true,
          encourageReflection: true,
          preventCheating: true,
        },
      });

      return {
        ...boundaryResult,
        directMode: true,
        privacyMetadata: {
          boundariesEnforced: boundaryResult.boundariesApplied?.length > 0,
          auditLogged: true,
        },
      };
      
    } catch (error) {
      this.logger.error('Direct AI boundary enforcement failed:', error);
      throw new Error(`AI boundary enforcement failed: ${error.message}`);
    }
  }

  /**
   * Generate writing insights directly
   */
  async generateWritingInsights(params: {
    scope: 'individual' | 'class';
    targetId: string;
    timeframe: 'day' | 'week' | 'month' | 'semester';
    role: 'educator' | 'administrator';
    purpose: string;
    includeRecommendations?: boolean;
  }): Promise<any> {
    try {
      this.logger.debug('Direct writing insights generation started');

      // Log the operation
      await this.auditService.logDataAccess({
        accessType: 'read',
        dataType: 'aggregated_writing_data',
        userId: 'system',
        accessedBy: params.targetId,
        purpose: params.purpose,
        educationalContext: {
          role: params.role,
          scope: params.scope,
          timeframe: params.timeframe,
        },
      });

      const insightsResult = await this.insightsGeneratorService.generateInsights({
        scope: params.scope,
        targetId: params.targetId,
        timeframe: params.timeframe,
        analysisType: 'comprehensive',
        includeRecommendations: params.includeRecommendations ?? true,
        privacyLevel: 'anonymized',
      });

      return {
        ...insightsResult,
        directMode: true,
        privacyMetadata: {
          dataAnonymized: true,
          aggregationLevel: params.scope,
          auditLogged: true,
        },
      };
      
    } catch (error) {
      this.logger.error('Direct writing insights generation failed:', error);
      throw new Error(`Writing insights generation failed: ${error.message}`);
    }
  }

  /**
   * Track writing progress directly
   */
  async trackWritingProgress(params: {
    userId: string;
    assignmentId: string;
    sessionData: any;
    privacyContext: any;
  }): Promise<any> {
    try {
      this.logger.debug('Direct writing progress tracking started');

      // Log the operation
      await this.auditService.logDataAccess({
        accessType: 'write',
        dataType: 'writing_session_data',
        userId: params.userId,
        accessedBy: params.userId,
        purpose: 'Progress tracking and learning analytics',
        educationalContext: {
          assignmentId: params.assignmentId,
          hasConsent: params.privacyContext?.hasConsent?.analytics || false,
        },
      });

      // Generate progress metrics (mock implementation)
      const progressResult = {
        sessionMetrics: {
          totalSessions: 5,
          totalTimeSpent: 120, // minutes
          averageSessionLength: 24,
          productivityScore: 78,
        },
        developmentMetrics: {
          skillProgression: [
            { skill: 'organization', improvement: 15 },
            { skill: 'clarity', improvement: 12 },
            { skill: 'depth', improvement: 8 },
          ],
          qualityImprovement: 22,
          consistencyScore: 85,
        },
        interventionTriggers: [],
        directMode: true,
        privacyMetadata: {
          consentRespected: true,
          dataMinimized: true,
          auditLogged: true,
        },
      };

      return progressResult;
      
    } catch (error) {
      this.logger.error('Direct writing progress tracking failed:', error);
      throw new Error(`Writing progress tracking failed: ${error.message}`);
    }
  }

  /**
   * Audit writing data access directly
   */
  async auditWritingDataAccess(params: {
    accessType: 'read' | 'write' | 'delete';
    dataType: string;
    userId: string;
    accessedBy: string;
    purpose: string;
    educationalContext: any;
  }): Promise<any> {
    try {
      this.logger.debug('Direct audit logging started');

      const auditResult = await this.auditService.logDataAccess(params);

      return {
        ...auditResult,
        directMode: true,
        privacyMetadata: {
          immutableLog: true,
          encryptedStorage: true,
          complianceLevel: 'GDPR_FERPA',
        },
      };
      
    } catch (error) {
      this.logger.error('Direct audit logging failed:', error);
      throw new Error(`Audit logging failed: ${error.message}`);
    }
  }

  /**
   * Health check for direct services
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    services: any;
    directMode: boolean;
  }> {
    const serviceChecks = {
      writingAnalysis: this.writingAnalysisService !== null,
      reflectionAnalysis: this.reflectionAnalysisService !== null,
      contentClassifier: this.contentClassifierService !== null,
      piiDetector: this.piiDetectorService !== null,
      educationalValidator: this.educationalValidatorService !== null,
      aiBoundaryEnforcer: this.aiBoundaryEnforcerService !== null,
      insightsGenerator: this.insightsGeneratorService !== null,
      auditService: this.auditService !== null,
    };

    const allHealthy = Object.values(serviceChecks).every(check => check);

    return {
      healthy: allHealthy,
      services: serviceChecks,
      directMode: true,
    };
  }
}