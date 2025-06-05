/**
 * Educational AI Validator Service
 * Provides AI validation and compliance checking for educational interactions
 */

import { ServiceFactory } from '../container/ServiceFactory';
import { 
  EducationalAIValidatorMCPClient, 
  MCPToolResponse,
  BoundedEnhancementValidation,
  BloomsTaxonomyAnalysis,
  DependencyRiskAssessment,
  EducationalRationale,
  PhilosophyCompliance,
  ReflectionRequirement
} from './mcp/EducationalAIValidatorMCPClient';
import { Logger } from '../monitoring/Logger';

export interface AIValidationRequest {
  content: string;
  context: {
    studentId: string;
    assignmentId?: string;
    courseId?: string;
    writingStage: string;
    academicLevel: string;
    interactionType: 'question' | 'guidance' | 'feedback' | 'suggestion';
  };
  studentProfile?: {
    gradLevel?: number;
    learningStyle?: string;
    strugglingAreas?: string[];
    strengths?: string[];
    reflectionHistory?: Array<{
      quality: number;
      depth: number;
      timestamp: string;
    }>;
  };
}

export interface ComprehensiveValidationResult {
  isValid: boolean;
  overallScore: number;
  validations: {
    boundedEnhancement: BoundedEnhancementValidation;
    bloomsTaxonomy: BloomsTaxonomyAnalysis;
    philosophyCompliance: PhilosophyCompliance;
    reflectionRequirement: ReflectionRequirement;
  };
  recommendations: string[];
  criticalIssues: string[];
  approved: boolean;
}

/**
 * Educational AI Validator Service with fallback architecture
 */
export class EducationalAIValidatorService {
  private mcpClient?: EducationalAIValidatorMCPClient;
  private logger: Logger;
  private healthStatus: {
    mcp: boolean;
    fallback: boolean;
  };

  constructor() {
    const serviceFactory = ServiceFactory.getInstance();
    this.logger = new Logger('EducationalAIValidatorService');
    
    // Use MCP client from ServiceFactory
    try {
      this.mcpClient = serviceFactory.getEducationalAIValidatorMCPClient();
    } catch (error) {
      this.logger.warn('Educational AI Validator MCP client not available, using fallback');
    }
    
    this.healthStatus = {
      mcp: false,
      fallback: true // Fallback is always available
    };

    this.startHealthChecks();
  }

  /**
   * Comprehensive AI validation combining all validation tools
   */
  async validateAIInteraction(request: AIValidationRequest): Promise<ComprehensiveValidationResult> {
    const operation = 'validateAIInteraction';
    
    try {
      // Try MCP validation first
      if (this.healthStatus.mcp && this.mcpClient) {
        return await this.validateWithMCP(request);
      }
      
      // Fallback to local validation
      return await this.validateWithFallback(request);
      
    } catch (error) {
      this.logger.error(`${operation} failed:`, error);
      
      // Emergency fallback - allow with warnings
      return {
        isValid: true,
        overallScore: 0.5,
        validations: {} as any,
        recommendations: ['AI validation system unavailable - using emergency fallback'],
        criticalIssues: ['Validation system failure'],
        approved: true // Allow with warnings in emergency
      };
    }
  }

  /**
   * Validate bounded enhancement compliance
   */
  async validateBoundedEnhancement(
    aiResponse: {
      questions?: string[];
      educationalRationale?: string;
      attribution?: string;
      limitations?: string[];
      content?: string;
    },
    context: {
      writingStage: string;
      academicLevel: string;
      studentProfile?: any;
      assignmentType?: string;
      learningObjectives?: string[];
    }
  ): Promise<BoundedEnhancementValidation | null> {
    if (this.healthStatus.mcp && this.mcpClient) {
      try {
        const result = await this.mcpClient.validateBoundedEnhancement(aiResponse, context);
        if (result.success) {
          return result.data!;
        }
      } catch (error) {
        this.logger.error('MCP bounded enhancement validation failed:', error);
      }
    }
    
    // Fallback validation
    return this.fallbackBoundedEnhancementValidation(aiResponse, context);
  }

  /**
   * Analyze content using Bloom's Taxonomy
   */
  async analyzeBloomsTaxonomy(
    content: string,
    context: {
      educationalLevel: string;
      subjectArea: string;
      targetSkills?: string[];
      currentLevel?: string;
    }
  ): Promise<BloomsTaxonomyAnalysis | null> {
    if (this.healthStatus.mcp && this.mcpClient) {
      try {
        const result = await this.mcpClient.analyzeBloomsTaxonomy(content, context);
        if (result.success) {
          return result.data!;
        }
      } catch (error) {
        this.logger.error('MCP Blooms taxonomy analysis failed:', error);
      }
    }
    
    // Fallback analysis
    return this.fallbackBloomsTaxonomyAnalysis(content, context);
  }

  /**
   * Detect AI dependency risk
   */
  async detectDependencyRisk(
    interactionHistory: Array<{
      timestamp: string;
      aiUsage: string;
      studentResponse: string;
      independentWork?: boolean;
    }>,
    studentProfile: {
      aiInteractionFrequency: number;
      independentSubmissions: number;
      progressWithoutAI: string;
      reflectionQuality?: number;
    }
  ): Promise<DependencyRiskAssessment | null> {
    if (this.healthStatus.mcp && this.mcpClient) {
      try {
        const result = await this.mcpClient.detectDependencyRisk(interactionHistory, studentProfile);
        if (result.success) {
          return result.data!;
        }
      } catch (error) {
        this.logger.error('MCP dependency risk detection failed:', error);
      }
    }
    
    // Fallback risk assessment
    return this.fallbackDependencyRiskAssessment(interactionHistory, studentProfile);
  }

  private async validateWithMCP(request: AIValidationRequest): Promise<ComprehensiveValidationResult> {
    const validations = await Promise.allSettled([
      this.mcpClient!.validateBoundedEnhancement(
        { content: request.content },
        {
          writingStage: request.context.writingStage,
          academicLevel: request.context.academicLevel,
          studentProfile: request.studentProfile
        }
      ),
      this.mcpClient!.analyzeBloomsTaxonomy(
        request.content,
        {
          educationalLevel: request.context.academicLevel,
          subjectArea: 'writing'
        }
      ),
      this.mcpClient!.enforcePhilosophy(
        request.content,
        request.context.interactionType,
        {
          studentLevel: request.context.academicLevel,
          learningGoals: [],
          currentSkills: request.studentProfile?.strengths || [],
          independenceLevel: 'developing'
        }
      ),
      this.mcpClient!.validateReflectionRequirement(
        {
          type: request.context.interactionType,
          content: request.content,
          educationalValue: 0.8,
          cognitiveLevel: 'application'
        },
        {
          academicLevel: request.context.academicLevel,
          reflectionHistory: request.studentProfile?.reflectionHistory || [],
          learningStyle: request.studentProfile?.learningStyle || 'mixed',
          currentSkills: request.studentProfile?.strengths || []
        }
      )
    ]);

    // Process results
    const boundedEnhancement = validations[0].status === 'fulfilled' && validations[0].value.success 
      ? validations[0].value.data! : null;
    const bloomsTaxonomy = validations[1].status === 'fulfilled' && validations[1].value.success 
      ? validations[1].value.data! : null;
    const philosophyCompliance = validations[2].status === 'fulfilled' && validations[2].value.success 
      ? validations[2].value.data! : null;
    const reflectionRequirement = validations[3].status === 'fulfilled' && validations[3].value.success 
      ? validations[3].value.data! : null;

    // Calculate overall score and approval
    const scores = [
      boundedEnhancement?.score || 0,
      bloomsTaxonomy?.complexity_score || 0,
      philosophyCompliance?.philosophy_alignment || 0
    ].filter(score => score > 0);
    
    const overallScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const isValid = overallScore >= 0.7 && (boundedEnhancement?.isValid !== false) && (philosophyCompliance?.compliant !== false);

    return {
      isValid,
      overallScore,
      validations: {
        boundedEnhancement: boundedEnhancement!,
        bloomsTaxonomy: bloomsTaxonomy!,
        philosophyCompliance: philosophyCompliance!,
        reflectionRequirement: reflectionRequirement!
      },
      recommendations: [
        ...(boundedEnhancement?.recommendations || []),
        ...(philosophyCompliance?.recommendations || [])
      ],
      criticalIssues: boundedEnhancement?.violations?.filter(v => v.severity === 'critical').map(v => v.description) || [],
      approved: isValid
    };
  }

  private async validateWithFallback(request: AIValidationRequest): Promise<ComprehensiveValidationResult> {
    // Simple fallback validation rules
    const content = request.content.toLowerCase();
    
    // Check for direct answers (violation of bounded enhancement)
    const directAnswerPatterns = [
      'the answer is',
      'the solution is',
      'you should write',
      'the correct response',
      'copy this',
      'here is the answer'
    ];
    
    const hasDirectAnswers = directAnswerPatterns.some(pattern => content.includes(pattern));
    
    // Check for question-based guidance (good practice)
    const questionPatterns = ['?', 'consider', 'think about', 'reflect on', 'what if', 'how might'];
    const hasQuestions = questionPatterns.some(pattern => content.includes(pattern));
    
    const isValid = !hasDirectAnswers && hasQuestions;
    const overallScore = isValid ? 0.8 : 0.3;
    
    return {
      isValid,
      overallScore,
      validations: {} as any, // Simplified fallback doesn't provide detailed validations
      recommendations: isValid 
        ? ['Content follows basic educational guidelines']
        : ['Consider using more questions and avoiding direct answers'],
      criticalIssues: hasDirectAnswers ? ['Direct answers detected'] : [],
      approved: isValid
    };
  }

  private fallbackBoundedEnhancementValidation(aiResponse: any, context: any): BoundedEnhancementValidation {
    const content = (aiResponse.content || '').toLowerCase();
    const hasDirectAnswers = ['the answer is', 'the solution is', 'you should write'].some(pattern => content.includes(pattern));
    
    return {
      isValid: !hasDirectAnswers,
      score: hasDirectAnswers ? 0.2 : 0.8,
      violations: hasDirectAnswers ? [{
        type: 'direct_answer',
        severity: 'high' as const,
        description: 'Contains direct answers',
        suggestion: 'Use guiding questions instead'
      }] : [],
      recommendations: ['Use more open-ended questions'],
      educational_value: hasDirectAnswers ? 0.3 : 0.8,
      independence_promotion: hasDirectAnswers ? 0.2 : 0.9
    };
  }

  private fallbackBloomsTaxonomyAnalysis(content: string, context: any): BloomsTaxonomyAnalysis {
    // Simple keyword-based analysis
    const rememberKeywords = ['define', 'list', 'recall', 'identify'];
    const analyzeKeywords = ['compare', 'contrast', 'examine', 'analyze'];
    const evaluateKeywords = ['judge', 'critique', 'assess', 'evaluate'];
    
    const contentLower = content.toLowerCase();
    let primaryLevel = 'remember';
    
    if (evaluateKeywords.some(word => contentLower.includes(word))) {
      primaryLevel = 'evaluate';
    } else if (analyzeKeywords.some(word => contentLower.includes(word))) {
      primaryLevel = 'analyze';
    }
    
    return {
      cognitive_levels: [{
        level: primaryLevel,
        percentage: 100,
        examples: [content.substring(0, 50)]
      }],
      overall_level: primaryLevel,
      complexity_score: primaryLevel === 'evaluate' ? 0.9 : primaryLevel === 'analyze' ? 0.7 : 0.4,
      educational_progression: {
        current_level: primaryLevel,
        next_level: primaryLevel === 'remember' ? 'understand' : 'create',
        suggestions: ['Consider adding higher-order thinking questions']
      }
    };
  }

  private fallbackDependencyRiskAssessment(interactionHistory: any[], studentProfile: any): DependencyRiskAssessment {
    const frequencyRisk = studentProfile.aiInteractionFrequency > 10 ? 'high' : 'low';
    const independenceRatio = studentProfile.independentSubmissions / (studentProfile.aiInteractionFrequency + 1);
    
    return {
      risk_level: independenceRatio < 0.3 ? 'high' : 'low',
      risk_factors: independenceRatio < 0.3 ? [{
        factor: 'low_independence_ratio',
        severity: 0.8,
        description: 'Student relies heavily on AI assistance'
      }] : [],
      independence_score: independenceRatio,
      recommendations: ['Encourage more independent work'],
      monitoring_suggestions: ['Track AI usage frequency']
    };
  }

  private startHealthChecks(): void {
    // Check MCP client health every 30 seconds
    setInterval(async () => {
      if (this.mcpClient) {
        try {
          const health = await this.mcpClient.healthCheck();
          this.healthStatus.mcp = health.connected;
        } catch (error) {
          this.healthStatus.mcp = false;
        }
      }
    }, 30000);
  }

  /**
   * Get service health status
   */
  getHealthStatus(): { mcp: boolean; fallback: boolean } {
    return { ...this.healthStatus };
  }
}