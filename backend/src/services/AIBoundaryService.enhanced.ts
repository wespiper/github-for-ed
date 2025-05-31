/**
 * Enhanced AIBoundaryService with MCP Validation Integration
 * 
 * This is an example of how to integrate the MCP Educational AI Validator
 * into the existing AIBoundaryService.
 */

import { MCPValidationService } from './ai/MCPValidationService';
import { AIBoundaryService, AIAssistanceRequest, AIAssistanceResponse } from './AIBoundaryService';
import prisma from '../lib/prisma';

// Extend the existing AIBoundaryService
export class EnhancedAIBoundaryService extends AIBoundaryService {
  
  /**
   * Initialize the enhanced service with MCP validation
   */
  static async initialize(): Promise<void> {
    // Initialize MCP validation service
    await MCPValidationService.initialize();
    console.log('Enhanced AI Boundary Service initialized with MCP validation');
  }

  /**
   * Override the main evaluation method to include MCP validation
   */
  static async evaluateAssistanceRequest(request: AIAssistanceRequest): Promise<AIAssistanceResponse> {
    // First, use the original logic to create response
    const response = await super.evaluateAssistanceRequest(request);

    // If response is approved, validate with MCP
    if (response.approved) {
      try {
        // Prepare context for MCP validation
        const context = {
          writingStage: request.context.currentStage || 'drafting',
          academicLevel: 'undergraduate', // Default, could be fetched from assignment
          learningObjectives: [request.context.learningObjective],
          studentProfile: await this.buildStudentProfile(request.studentId)
        };

        // Validate bounded enhancement
        const validation = await MCPValidationService.validateBoundedEnhancement(
          {
            questions: response.educationalGuidance?.content || [],
            educationalRationale: response.educationalGuidance?.educationalRationale || '',
            attribution: 'AI-generated educational questions via Scribe Tree',
            limitations: [
              'Questions are general guidance only',
              'Cannot evaluate specific content quality',
              'Context understanding is limited'
            ],
            reflectionRequirements: response.mandatoryReflection
          },
          context
        );

        // If validation fails, adjust or reject
        if (!validation.isValid) {
          console.warn('MCP validation failed:', validation.issues);
          
          // Apply adjustments if possible
          if (validation.adjustments && Object.keys(validation.adjustments).length > 0) {
            response.educationalGuidance = await this.applyMCPAdjustments(
              response.educationalGuidance,
              validation.adjustments
            );
          } else {
            // Reject if adjustments can't fix it
            response.approved = false;
            response.educationalGuidance = undefined;
          }
        }

        // Enhance response with MCP insights
        if (response.approved) {
          // Add Bloom's taxonomy assessment
          const bloomsAssessment = await MCPValidationService.assessBloomsTaxonomy(
            response.educationalGuidance?.content || [],
            undefined,
            'undergraduate' // Default academic level
          );

          // Store assessment for analytics
          await this.storeBloomsAssessment(request.assignmentId, bloomsAssessment);

          // Add philosophy compliance score
          const philosophyCompliance = await MCPValidationService.enforcePhilosophyPrinciples(
            response,
            {
              questionsOnly: true,
              mandatoryReflection: true,
              progressiveAccess: true,
              transparentAttribution: true,
              independenceBuilding: true
            }
          );

          // Add educational rationale
          const rationale = await MCPValidationService.generateEducationalRationale(
            {
              type: 'question_generation',
              content: response.educationalGuidance?.content || [],
              complexity: bloomsAssessment.overallLevel
            },
            context,
            [request.context.learningObjective]
          );

          // Store insights separately for analytics
          await this.storeAIInsights(request.assignmentId, {
            bloomsLevel: bloomsAssessment.overallLevel,
            philosophyScore: philosophyCompliance.complianceScore,
            enhancedRationale: rationale.transparencyStatement
          });
        }

      } catch (error) {
        console.error('MCP validation error:', error);
        // Fall back to original validation if MCP fails
      }
    }

    // Check dependency risk
    if (response.approved) {
      const dependencyRisk = await this.checkDependencyRisk(request);
      
      if (dependencyRisk.riskLevel === 'high' || dependencyRisk.riskLevel === 'critical') {
        // Potentially restrict access
        if (dependencyRisk.riskLevel === 'critical') {
          response.approved = false;
          response.educationalAlternatives = {
            independentActions: dependencyRisk.interventions.map((i: any) => i.description),
            resourceSuggestions: ['Review your previous work', 'Consult course materials'],
            reflectionQuestions: ['What strategies have worked for you before?'],
            learningObjective: 'Build confidence in independent problem-solving'
          };
        }
      }
    }

    return response;
  }

  /**
   * Check dependency risk using MCP validation
   */
  private static async checkDependencyRisk(request: AIAssistanceRequest): Promise<any> {
    // Get recent interaction pattern
    const recentInteractions = await prisma.aIInteractionLog.findMany({
      where: {
        studentId: request.studentId,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const reflectionScores = await prisma.reflectionAnalysis.findMany({
      where: {
        studentId: request.studentId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last week
        }
      },
      select: { 
        overallQualityScore: true 
      }
    });

    const avgReflectionQuality = reflectionScores.length > 0 ?
      reflectionScores.reduce((sum, r) => sum + r.overallQualityScore, 0) / reflectionScores.length :
      50;

    return MCPValidationService.checkDependencyRisk(
      {
        frequency: recentInteractions.length,
        requestTypes: recentInteractions.map(i => i.assistanceType),
        reflectionQuality: avgReflectionQuality,
        independentWorkRatio: await this.calculateIndependentWorkRatio(request.studentId)
      },
      await this.buildStudentProfile(request.studentId)
    );
  }

  /**
   * Build student profile for MCP validation
   */
  private static async buildStudentProfile(studentId: string): Promise<any> {
    const profile = await prisma.studentProfile.findUnique({
      where: { studentId }
    });

    if (!profile) {
      // Return default profile
      return {
        studentId,
        currentState: {
          cognitiveLoad: 'optimal',
          recentBreakthrough: false,
          strugglingDuration: 0,
          lastSuccessfulInteraction: new Date()
        },
        independenceMetrics: {
          aiRequestFrequency: 0,
          independentWorkStreak: 0,
          qualityWithoutAI: 50,
          trend: 'stable'
        },
        preferences: {
          questionComplexity: 'mixed',
          bestRespondsTo: [],
          strugglesWIth: [],
          averageReflectionDepth: 50
        },
        strengths: {
          evidenceAnalysis: 50,
          perspectiveTaking: 50,
          logicalReasoning: 50,
          creativeThinking: 50,
          organizationalSkills: 50
        }
      };
    }

    // Transform database profile to MCP format
    return {
      studentId: profile.studentId,
      currentState: {
        cognitiveLoad: profile.currentCognitiveLoad,
        recentBreakthrough: profile.recentBreakthrough,
        strugglingDuration: profile.strugglingDuration,
        lastSuccessfulInteraction: profile.lastSuccessfulInteraction
      },
      independenceMetrics: {
        aiRequestFrequency: profile.aiRequestFrequency,
        independentWorkStreak: profile.independentWorkStreak,
        qualityWithoutAI: profile.qualityWithoutAI,
        trend: profile.independenceTrend
      },
      preferences: {
        questionComplexity: profile.questionComplexity,
        bestRespondsTo: profile.bestRespondsTo as any[],
        strugglesWIth: profile.strugglesWith as any[],
        averageReflectionDepth: profile.averageReflectionDepth
      },
      strengths: {
        evidenceAnalysis: profile.evidenceAnalysis,
        perspectiveTaking: profile.perspectiveTaking,
        logicalReasoning: profile.logicalReasoning,
        creativeThinking: profile.creativeThinking,
        organizationalSkills: profile.organizationalSkills
      }
    };
  }

  /**
   * Apply MCP adjustments to educational guidance
   */
  private static async applyMCPAdjustments(
    guidance: any,
    adjustments: any
  ): Promise<any> {
    const adjusted = { ...guidance };

    // Apply question rephrasing
    if (adjustments.questionsOnly && adjusted.content) {
      adjusted.content = adjusted.content.map((q: string) => {
        // Convert statements to questions
        if (!q.includes('?')) {
          return `What ${q.toLowerCase()}?`;
        }
        // Remove imperative language
        return q.replace(/^(write|include|make sure|don't forget)/i, 'How might you');
      });
    }

    // Apply cognitive complexity adjustments
    if (adjustments.educationalValue) {
      // This would require regenerating questions with Claude
      // For now, just add a note
      adjusted.complexityNote = 'Questions need cognitive depth adjustment';
    }

    // Add independence scaffolding
    if (adjustments.independenceBuilding && adjusted.content) {
      adjusted.content = [
        ...adjusted.content,
        'What strategies could you use to approach similar challenges independently?',
        'How will you know if your approach is effective?'
      ];
    }

    return adjusted;
  }

  /**
   * Calculate independent work ratio
   */
  private static async calculateIndependentWorkRatio(studentId: string): Promise<number> {
    const sessions = await prisma.writingSession.findMany({
      where: {
        userId: studentId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last week
        }
      }
    });

    // Count sessions with AI interactions
    let aiSessionCount = 0;
    for (const session of sessions) {
      const hasAI = await prisma.aIInteractionLog.findFirst({
        where: {
          studentId,
          createdAt: {
            gte: session.startTime,
            lte: session.endTime || new Date()
          }
        }
      });
      if (hasAI) aiSessionCount++;
    }

    if (sessions.length === 0) return 0;
    
    const independentSessions = sessions.length - aiSessionCount;
    return independentSessions / sessions.length;
  }

  /**
   * Store Bloom's assessment for analytics
   */
  private static async storeBloomsAssessment(
    assignmentId: string,
    assessment: any
  ): Promise<void> {
    // This would store in a new table for analytics
    // For now, just log it
    console.log('Bloom\'s Assessment:', {
      assignmentId,
      overallLevel: assessment.overallLevel,
      distribution: assessment.distribution
    });
  }

  /**
   * Store AI insights for analytics
   */
  private static async storeAIInsights(
    assignmentId: string,
    insights: any
  ): Promise<void> {
    // This would store in analytics table
    // For now, just log it
    console.log('AI Insights:', {
      assignmentId,
      ...insights
    });
  }

  /**
   * Enhanced reflection requirement validation
   */
  static async createReflectionRequirements(
    studentId: string,
    assignmentId: string,
    aiResponseId: string
  ): Promise<any> {
    const baseRequirements = {
      required: true,
      minimumLength: 150,
      qualityThreshold: 'detailed' as const,
      prompts: [
        'How did the AI questions help shape your thinking?',
        'What insights did you discover through this interaction?',
        'What would you do differently next time?'
      ]
    };

    // Get student profile
    const profile = await this.buildStudentProfile(studentId);

    // Get previous reflections
    const previousReflections = await prisma.reflectionAnalysis.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Validate with MCP
    const validation = await MCPValidationService.validateReflectionRequirements(
      { 
        reflectionRequirements: baseRequirements,
        questions: [],
        educationalRationale: '',
        attribution: '',
        limitations: []
      },
      profile,
      previousReflections
    );

    // Apply adjustments if needed
    if (validation.adjustedRequirements) {
      return {
        ...baseRequirements,
        ...validation.adjustedRequirements
      };
    }

    return baseRequirements;
  }

  /**
   * Progressive access validation
   */
  static async validateAccessLevelChange(
    studentId: string,
    proposedLevel: string,
    reason: string
  ): Promise<{ approved: boolean; feedback: string }> {
    // Get student metrics
    const metrics = await this.calculateStudentMetrics(studentId);
    const currentLevel = await this.getCurrentAccessLevel(studentId);

    // Validate with MCP
    const validation = await MCPValidationService.validateProgressiveAccess(
      currentLevel,
      metrics,
      {
        targetLevel: proposedLevel,
        reason,
        expectedBenefit: 'Adjusted AI support to match student progress'
      }
    );

    return {
      approved: validation.isValid,
      feedback: validation.isValid ?
        `Access level change approved: ${validation.rationaleForChange}` :
        `Access level change denied: ${validation.issues.join('. ')}`
    };
  }

  /**
   * Get current access level for student
   */
  private static async getCurrentAccessLevel(studentId: string): Promise<string> {
    // Get most recent reflection analysis
    const recentAnalysis = await prisma.reflectionAnalysis.findFirst({
      where: { studentId },
      orderBy: { createdAt: 'desc' }
    });

    return recentAnalysis?.progressiveAccessLevel || 'basic';
  }

  /**
   * Calculate comprehensive student metrics
   */
  private static async calculateStudentMetrics(studentId: string): Promise<any> {
    const reflections = await prisma.reflectionAnalysis.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const profile = await prisma.studentProfile.findUnique({
      where: { studentId }
    });

    // Note: learningBreakthrough table doesn't exist in schema
    // Using reflection analysis for breakthrough detection
    const breakthroughCount = reflections.filter(r => 
      r.overallQualityScore >= 90 && r.recognizesGaps && r.synthesizesIdeas
    ).length;

    // Calculate consistency score
    const scores = reflections.map(r => r.overallQualityScore);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length || 50;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length || 0;
    const consistencyScore = Math.max(0, 100 - Math.sqrt(variance));

    return {
      reflectionQualityAverage: reflections.length > 0 ?
        reflections.reduce((sum, r) => sum + r.overallQualityScore, 0) / reflections.length :
        50,
      independenceScore: profile?.qualityWithoutAI || 50,
      consistencyScore: Math.round(consistencyScore),
      timeInCurrentLevel: 7, // Default 7 days, would need date tracking
      totalInteractions: await prisma.aIInteractionLog.count({ where: { studentId } }),
      recentBreakthroughs: breakthroughCount,
      strugglingIndicators: profile?.strugglingDuration || 0
    };
  }

  /**
   * Cleanup on shutdown
   */
  static async shutdown(): Promise<void> {
    await MCPValidationService.disconnect();
  }
}