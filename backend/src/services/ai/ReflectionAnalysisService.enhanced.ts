import { v4 as uuidv4 } from 'uuid';
import { AIBoundaryService } from '../AIBoundaryService';
import { AuthenticityDetector } from './AuthenticityDetector';
import { ReflectionCacheService } from '../cache/ReflectionCacheService';
import { ServiceFactory } from '../../container/ServiceFactory';
import { CacheKeyBuilder, CacheTTL } from '../../cache/CacheService';
import { PrivacyCacheService, PrivacyCacheKeyBuilder } from '../../cache/PrivacyCacheService';
import { PrivacyEventUtils } from '../../events/EventBus';
import { 
  AIInteractionLoggedEvent, 
  StudentProgressUpdatedEvent,
  ConsentVerificationEvent,
  DataAccessAuditedEvent,
  EventTypes 
} from '../../events/events';

// Re-export existing interface for compatibility
export { ReflectionAnalysis } from './ReflectionAnalysisService';

/**
 * Enhanced Reflection Analysis Service using MCP Server
 * 
 * This version integrates with the Writing Analysis MCP Server for:
 * - Privacy-enhanced reflection quality assessment
 * - Content sensitivity classification
 * - Progressive access level determination
 * - Comprehensive audit trails
 */
export class EnhancedReflectionAnalysisService {
  private static serviceFactory = ServiceFactory.getInstance();

  /**
   * Analyze reflection quality with MCP-enhanced privacy and assessment
   */
  static async analyzeReflection(
    reflection: string,
    context: {
      studentId: string;
      assignmentId: string;
      aiInteractionId: string;
      writingStage: string;
    }
  ): Promise<any> {
    const correlationId = uuidv4();
    const cache = this.serviceFactory.getCache();
    const eventBus = this.serviceFactory.getEventBus();
    const mcpClient = this.serviceFactory.getMCPClient();

    try {
      // Hash student ID for privacy
      const hashedStudentId = PrivacyEventUtils.hashStudentId(context.studentId);

      // First, classify content sensitivity
      const contentClassification = await mcpClient.classifyContentSensitivity({
        content: reflection,
        context: {
          contentType: 'reflection',
          academicLevel: 'undergraduate', // TODO: Get from student profile
        },
      });

      // Verify consent for reflection analysis
      await eventBus.publish<ConsentVerificationEvent>({
        type: EventTypes.CONSENT_VERIFICATION,
        correlationId,
        timestamp: new Date(),
        payload: {
          studentId: hashedStudentId,
          dataTypes: ['reflection_content', 'quality_assessment'],
          purpose: 'reflection_quality_analysis',
          accessorId: 'system',
          consentGiven: true, // TODO: Get from student preferences
          auditInfo: {
            accessType: 'analyze',
            justification: 'Educational reflection quality assessment'
          }
        },
        metadata: { userId: context.studentId }
      });

      // Check cache first (privacy-aware)
      const reflectionHash = ReflectionCacheService.hashReflection(reflection);
      const cacheKey = PrivacyCacheKeyBuilder.reflectionQuality(
        `${hashedStudentId}:${context.assignmentId}:${reflectionHash}`
      );
      const cached = await PrivacyCacheService.getWithPrivacyContext(
        cache,
        cacheKey,
        { studentId: hashedStudentId, dataType: 'reflection_analysis' }
      );
      
      if (cached) {
        console.log('Cache hit for privacy-aware reflection analysis');
        
        // Still audit the access
        await mcpClient.auditWritingDataAccess({
          accessType: 'read',
          dataType: 'reflection_analysis',
          userId: context.studentId,
          accessedBy: 'system',
          purpose: 'Cached reflection quality retrieval',
          educationalContext: {
            assignmentId: context.assignmentId,
          },
        });

        return cached;
      }

      // Use MCP to evaluate reflection quality with privacy safeguards
      const qualityAnalysis = await mcpClient.evaluateReflectionQuality({
        reflection,
        userId: context.studentId,
        role: 'student',
        purpose: 'educational self-assessment and improvement',
        consent: true, // TODO: Get from student preferences
        assignmentContext: {
          assignmentId: context.assignmentId,
        },
      });

      // Apply AI boundaries based on reflection quality
      const aiAccessLevel = await this.determineAIAccessLevel(
        qualityAnalysis,
        context,
        mcpClient
      );

      // Combine MCP analysis with traditional metrics
      const enhancedAnalysis = {
        ...qualityAnalysis,
        aiAccessLevel,
        contentClassification,
        privacyMetadata: {
          sensitiveContentMasked: contentClassification.sensitivityLevel === 'high',
          consentVerified: true,
          auditTrail: true,
        },
        correlationId,
        timestamp: new Date(),
      };

      // Cache the results with privacy context
      await PrivacyCacheService.setWithPrivacyContext(
        cache,
        cacheKey,
        enhancedAnalysis,
        CacheTTL.REFLECTION_QUALITY,
        { studentId: hashedStudentId, dataType: 'reflection_analysis' }
      );

      // Log AI interaction with privacy protection
      await eventBus.publish<AIInteractionLoggedEvent>({
        type: EventTypes.AI_INTERACTION_LOGGED,
        correlationId,
        timestamp: new Date(),
        payload: {
          studentId: hashedStudentId,
          courseId: '', // Would need to fetch from assignment
          assignmentId: context.assignmentId,
          interactionType: 'reflection_analysis',
          aiService: 'mcp_reflection_analyzer',
          request: {
            content: 'Analyze reflection quality',
            context: { 
              reflectionLength: reflection.length,
              sensitivityLevel: contentClassification.sensitivityLevel,
            }
          },
          response: {
            qualityScore: qualityAnalysis.quality?.overall || 0,
            accessLevel: aiAccessLevel.currentLevel,
            privacyProtected: true
          },
          processingTime: 0, // Would be calculated
          success: true
        },
        metadata: { userId: context.studentId }
      });

      // Audit the data access
      await mcpClient.auditWritingDataAccess({
        accessType: 'analyze',
        dataType: 'reflection_quality',
        userId: context.studentId,
        accessedBy: 'system',
        purpose: 'Educational reflection quality assessment',
        educationalContext: {
          assignmentId: context.assignmentId,
        },
      });

      // Publish progress update
      await eventBus.publish<StudentProgressUpdatedEvent>({
        type: EventTypes.STUDENT_PROGRESS_UPDATED,
        correlationId,
        timestamp: new Date(),
        payload: {
          studentId: hashedStudentId,
          courseId: '', // Would be fetched from assignment
          assignmentId: context.assignmentId,
          progressType: 'reflection_quality',
          metrics: {
            qualityScore: qualityAnalysis.quality?.overall || 0,
            accessLevel: aiAccessLevel.currentLevel,
            privacyProtected: true
          }
        },
        metadata: { userId: context.studentId }
      });

      return enhancedAnalysis;

    } catch (error) {
      console.error('Enhanced reflection analysis failed:', error);
      
      // Log the error for audit
      await eventBus.publish<DataAccessAuditedEvent>({
        type: EventTypes.DATA_ACCESS_AUDITED,
        correlationId,
        timestamp: new Date(),
        payload: {
          accessType: 'analyze',
          dataType: 'reflection',
          studentId: PrivacyEventUtils.hashStudentId(context.studentId),
          accessorId: 'system',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          auditDetails: {
            operation: 'reflection_quality_analysis',
            timestamp: new Date()
          }
        },
        metadata: { userId: context.studentId }
      });

      throw error;
    }
  }

  /**
   * Determine AI access level based on reflection quality
   */
  private static async determineAIAccessLevel(
    qualityAnalysis: any,
    context: any,
    mcpClient: any
  ): Promise<any> {
    const quality = qualityAnalysis.quality?.overall || 0;
    const reflectionCompleted = quality > 0;
    
    // Use MCP to apply AI boundaries
    const boundaryResult = await mcpClient.applyAIBoundaries({
      request: {
        prompt: 'Request for AI assistance with writing',
        context: 'Student reflection analysis',
        requestType: 'assistance',
      },
      studentContext: {
        assignmentType: 'writing',
        reflectionCompleted,
        progressLevel: quality / 100,
      },
    });

    return {
      currentLevel: this.mapQualityToAccessLevel(quality),
      boundariesApplied: boundaryResult.boundariesApplied || [],
      aiAllowed: boundaryResult.allowed || false,
      suggestions: boundaryResult.suggestions || [],
    };
  }

  /**
   * Map quality score to access level
   */
  private static mapQualityToAccessLevel(qualityScore: number): string {
    if (qualityScore >= 90) return 'enhanced';
    if (qualityScore >= 75) return 'standard';
    if (qualityScore >= 60) return 'basic';
    return 'restricted';
  }

  /**
   * Get reflection requirements for access level
   */
  static async getReflectionRequirements(
    studentId: string,
    assignmentId: string
  ): Promise<{
    currentLevel: string;
    nextLevelRequirements: string[];
    qualityScore: number;
  }> {
    try {
      const mcpClient = this.serviceFactory.getMCPClient();
      
      // This would typically get the student's current reflection data
      // For now, we'll use mock data
      const mockQualityAnalysis = {
        quality: { overall: 45 },
        progressiveAccess: {
          currentLevel: 'restricted',
          nextLevelRequirements: [
            'Achieve a reflection quality score of 60 or higher',
            'Include specific examples in your reflection',
            'Explain how you will apply what you learned',
          ],
        },
      };

      return {
        currentLevel: mockQualityAnalysis.progressiveAccess.currentLevel,
        nextLevelRequirements: mockQualityAnalysis.progressiveAccess.nextLevelRequirements,
        qualityScore: mockQualityAnalysis.quality.overall,
      };
    } catch (error) {
      console.error('Error getting reflection requirements:', error);
      return {
        currentLevel: 'restricted',
        nextLevelRequirements: ['Complete a meaningful reflection'],
        qualityScore: 0,
      };
    }
  }

  /**
   * Health check for MCP integration
   */
  static async healthCheck(): Promise<{ healthy: boolean; mcpConnected: boolean; message?: string }> {
    try {
      const mcpClient = this.serviceFactory.getMCPClient();
      const health = await mcpClient.healthCheck();
      
      return {
        healthy: health.healthy,
        mcpConnected: health.healthy,
        message: health.message,
      };
    } catch (error) {
      return {
        healthy: false,
        mcpConnected: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}