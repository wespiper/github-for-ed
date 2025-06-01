import { ClaudeProvider } from './providers/ClaudeProvider';
import { 
  AIProvider, 
  EducationalContext, 
  EducationalQuestionSet, 
  PerspectiveSuggestion,
  ValidationResult 
} from './providers/AIProviderInterface';
import { AIAssistanceRequest, AIEducationalAction, WritingStage } from '../AIBoundaryService';
import { Assignment } from '@prisma/client';
import { 
  StudentRepository, 
  AssignmentRepository, 
  AIInteractionRepository 
} from '../../repositories/interfaces';

// Define Assignment interface for type safety with Prisma types
type AssignmentType = Pick<Assignment, 'id' | 'title' | 'instructions' | 'learningObjectives'> & {
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
};

/**
 * Educational AI Service - Refactored to use Repository Pattern
 * Orchestrates AI providers for educational assistance with strict educational boundaries
 */
export class EducationalAIService {
  private provider: AIProvider = new ClaudeProvider();

  constructor(
    private studentRepository: StudentRepository,
    private assignmentRepository: AssignmentRepository,
    private aiInteractionRepository: AIInteractionRepository
  ) {}

  /**
   * Generate educational questions based on student's writing and context
   */
  async generateEducationalQuestions(
    request: AIAssistanceRequest,
    assignment: AssignmentType
  ): Promise<EducationalQuestionSet> {
    // Build educational context from request and assignment
    const context: EducationalContext = {
      studentId: request.studentId,
      assignmentId: request.assignmentId,
      writingStage: this.mapToWritingStage(request.context.currentStage),
      contentSample: request.context.contentSample,
      specificQuestion: request.context.specificQuestion,
      learningObjective: Array.isArray(assignment.learningObjectives) && assignment.learningObjectives.length > 0
        ? (assignment.learningObjectives as any)[0] 
        : 'Develop critical thinking through writing',
      academicLevel: await this.inferAcademicLevel(request.studentId, assignment)
    };

    try {
      // Generate questions using AI provider
      const questionSet = await this.provider.generateEducationalQuestions(context);
      
      // Validate educational compliance
      const validation = await this.validateEducationalContent(questionSet);
      
      if (!validation.isEducationallySound) {
        console.warn('Generated content failed educational validation:', validation.issues);
        // Return fallback educational questions
        return this.getFallbackQuestions(context);
      }

      // Log successful AI interaction for analytics using repository
      await this.logAIInteraction(request, questionSet, validation);

      return questionSet;
    } catch (error) {
      console.error('Educational AI generation failed:', error);
      // Return educational fallback
      return this.getFallbackQuestions(context);
    }
  }

  /**
   * Generate alternative perspectives for educational exploration
   */
  async generateEducationalPerspectives(
    topic: string,
    currentArguments: string[],
    context: EducationalContext
  ): Promise<PerspectiveSuggestion[]> {
    try {
      const perspectives = await this.provider.generatePerspectives(topic, currentArguments, context);
      
      // Validate each perspective for educational value
      const validatedPerspectives = [];
      for (const perspective of perspectives) {
        const validation = await this.validatePerspective(perspective);
        if (validation.isEducationallySound) {
          validatedPerspectives.push(perspective);
        }
      }

      return validatedPerspectives.length > 0 ? validatedPerspectives : this.getFallbackPerspectives(topic);
    } catch (error) {
      console.error('Perspective generation failed:', error);
      return this.getFallbackPerspectives(topic);
    }
  }

  /**
   * Validate that AI-generated content meets educational standards
   */
  async validateEducationalContent(content: EducationalQuestionSet): Promise<ValidationResult> {
    try {
      // Check each question for educational compliance
      for (const question of content.questions) {
        const questionValidation = await this.provider.validateEducationalResponse(question.question);
        if (!questionValidation.isEducationallySound) {
          return {
            isEducationallySound: false,
            containsAnswers: questionValidation.containsAnswers,
            providesQuestions: questionValidation.providesQuestions,
            alignsWithLearningObjectives: false,
            appropriateComplexity: questionValidation.appropriateComplexity,
            issues: [`Question "${question.question}" failed validation: ${questionValidation.issues.join(', ')}`],
            suggestions: questionValidation.suggestions
          };
        }
      }

      return {
        isEducationallySound: true,
        containsAnswers: false,
        providesQuestions: true,
        alignsWithLearningObjectives: true,
        appropriateComplexity: true,
        issues: [],
        suggestions: []
      };
    } catch (error) {
      console.error('Content validation failed:', error);
      // Conservative approach - assume content is educational if validation fails
      return {
        isEducationallySound: true,
        containsAnswers: false,
        providesQuestions: true,
        alignsWithLearningObjectives: true,
        appropriateComplexity: true,
        issues: ['Validation service unavailable'],
        suggestions: []
      };
    }
  }

  /**
   * Check AI provider health and availability
   */
  async checkProviderHealth(): Promise<boolean> {
    try {
      return await this.provider.healthCheck();
    } catch (error) {
      console.error('Provider health check failed:', error);
      return false;
    }
  }

  /**
   * Get educational statistics about AI usage (refactored to use repositories)
   */
  async getEducationalStats(studentId: string, timeframe: { start: Date; end: Date }): Promise<{
    totalInteractions: number;
    questionsGenerated: number;
    perspectivesExplored: number;
    reflectionsCompleted: number;
    educationalValue: number;
  }> {
    try {
      // Query AI interaction logs using repository
      const interactions = await this.aiInteractionRepository.findByStudent(
        studentId,
        timeframe
      );

      const totalInteractions = interactions.length;
      const questionsGenerated = interactions.reduce((sum: number, log: any) => 
        sum + (log.questionsGenerated || 0), 0
      );
      const perspectivesExplored = interactions.filter(
        (log: any) => log.assistanceType === 'perspective_generation'
      ).length;
      const reflectionsCompleted = interactions.filter(
        (log: any) => log.reflectionCompleted
      ).length;
      
      // Calculate educational value score (0-100)
      const educationalValue = totalInteractions > 0 
        ? Math.round((reflectionsCompleted / totalInteractions) * 100)
        : 0;

      return {
        totalInteractions,
        questionsGenerated,
        perspectivesExplored,
        reflectionsCompleted,
        educationalValue
      };
    } catch (error) {
      console.error('Failed to get educational stats:', error);
      // Return fallback data
      return {
        totalInteractions: 0,
        questionsGenerated: 0,
        perspectivesExplored: 0,
        reflectionsCompleted: 0,
        educationalValue: 0
      };
    }
  }

  // Private helper methods

  private mapToWritingStage(stage?: string): WritingStage {
    const stageMap: Record<string, WritingStage> = {
      'planning': 'brainstorming',
      'brainstorming': 'brainstorming',
      'writing': 'drafting',
      'drafting': 'drafting',
      'revision': 'revising',
      'revising': 'revising',
      'editing': 'editing',
      'proofreading': 'editing'
    };

    return (stage && stageMap[stage.toLowerCase()]) || 'drafting';
  }

  private async inferAcademicLevel(studentId: string, assignment: AssignmentType): Promise<'novice' | 'developing' | 'proficient' | 'advanced'> {
    try {
      // Get student learning analytics using repository
      const analyticsTimeframe = {
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        end: new Date()
      };
      
      const studentAnalytics = await this.studentRepository.findLearningAnalytics(
        studentId,
        analyticsTimeframe
      );

      if (!studentAnalytics || studentAnalytics.totalSubmissions === 0) {
        // No submission history, base on assignment difficulty
        if (assignment.difficultyLevel === 'advanced') return 'developing';
        if (assignment.difficultyLevel === 'intermediate') return 'novice';
        return 'novice';
      }

      // Calculate level based on analytics
      const avgWordCount = studentAnalytics.averageWordCount;
      const reflectionQuality = studentAnalytics.reflectionQuality;
      
      // Simple heuristic based on writing volume and reflection quality
      if (avgWordCount > 1000 && reflectionQuality >= 70) {
        return 'proficient';
      } else if (avgWordCount > 500 && reflectionQuality >= 50) {
        return 'developing';
      } else {
        return 'novice';
      }
    } catch (error) {
      console.error('Failed to infer academic level:', error);
      // Fallback to assignment-based inference
      if (assignment.difficultyLevel === 'advanced') return 'developing';
      if (assignment.difficultyLevel === 'intermediate') return 'novice';
      return 'novice';
    }
  }

  private async validatePerspective(perspective: PerspectiveSuggestion): Promise<ValidationResult> {
    return await this.provider.validateEducationalResponse(perspective.description);
  }

  private async logAIInteraction(
    request: AIAssistanceRequest, 
    response: EducationalQuestionSet, 
    validation: ValidationResult
  ): Promise<void> {
    try {
      // Log to database for analytics and compliance tracking using repository
      await this.aiInteractionRepository.logInteraction({
        studentId: request.studentId,
        assignmentId: request.assignmentId,
        assistanceType: request.assistanceType,
        writingStage: request.context.currentStage || 'unknown',
        questionText: request.context.specificQuestion,
        questionsGenerated: response.questions.length,
        educationallySound: validation.isEducationallySound,
        metadata: {
          validation: validation,
          educationalGoal: response.overallEducationalGoal,
          nextSteps: response.nextStepSuggestions,
          responseId: response.requestId
        }
      });

      console.log('AI Interaction logged:', {
        studentId: request.studentId,
        assignmentId: request.assignmentId,
        assistanceType: request.assistanceType,
        questionsGenerated: response.questions.length,
        educationallySound: validation.isEducationallySound
      });
    } catch (error) {
      console.error('Failed to log AI interaction:', error);
      // Continue execution - logging failure shouldn't break user experience
    }
  }

  private getFallbackQuestions(context: EducationalContext): EducationalQuestionSet {
    const stageQuestions = {
      brainstorming: [
        {
          id: 'fallback-brainstorm-1',
          type: 'clarifying' as const,
          question: 'What is the most important point you want your reader to understand?',
          educationalRationale: 'Helps identify and clarify the central argument or message',
          expectedOutcome: 'Student develops a clearer focus for their writing',
          followUpPrompts: ['How can you make this point more compelling?', 'What evidence supports this point?']
        },
        {
          id: 'fallback-brainstorm-2',
          type: 'expanding' as const,
          question: 'Who is most affected by this topic, and how might they view it differently?',
          educationalRationale: 'Encourages consideration of multiple perspectives and stakeholders',
          expectedOutcome: 'Student develops more nuanced understanding of the topic',
          followUpPrompts: ['What would these different groups want to know?', 'How might you address their concerns?']
        }
      ],
      drafting: [
        {
          id: 'fallback-draft-1',
          type: 'clarifying' as const,
          question: 'How does each paragraph advance your main argument?',
          educationalRationale: 'Helps students think about organization and logical flow',
          expectedOutcome: 'Student develops better structural awareness',
          followUpPrompts: ['Which paragraphs seem disconnected?', 'What transitions would help readers follow your logic?']
        },
        {
          id: 'fallback-draft-2',
          type: 'challenging' as const,
          question: 'What evidence is most convincing to someone who disagrees with you?',
          educationalRationale: 'Encourages critical evaluation of evidence and audience awareness',
          expectedOutcome: 'Student strengthens argumentative thinking',
          followUpPrompts: ['What objections might readers have?', 'How can you address counterarguments?']
        }
      ],
      revising: [
        {
          id: 'fallback-revise-1',
          type: 'challenging' as const,
          question: 'Where is your argument strongest, and where might it be vulnerable?',
          educationalRationale: 'Develops critical self-assessment skills',
          expectedOutcome: 'Student identifies areas for improvement',
          followUpPrompts: ['What additional evidence could strengthen weak points?', 'How might you reorganize for better impact?']
        },
        {
          id: 'fallback-revise-2',
          type: 'perspective' as const,
          question: 'How would your intended audience react to your most controversial point?',
          educationalRationale: 'Builds audience awareness and persuasive thinking',
          expectedOutcome: 'Student considers reader response and adjusts approach',
          followUpPrompts: ['What concerns might they have?', 'How can you address these concerns respectfully?']
        }
      ],
      editing: [
        {
          id: 'fallback-edit-1',
          type: 'clarifying' as const,
          question: 'Which sentences might confuse readers, and why?',
          educationalRationale: 'Develops clarity awareness and reader-focused thinking',
          expectedOutcome: 'Student improves sentence clarity and flow',
          followUpPrompts: ['How can you simplify complex sentences?', 'What words might be unclear to your audience?']
        },
        {
          id: 'fallback-edit-2',
          type: 'reflection' as const,
          question: 'What tone do you want to convey, and does your word choice support it?',
          educationalRationale: 'Builds awareness of voice and style in writing',
          expectedOutcome: 'Student develops more intentional word choice',
          followUpPrompts: ['Which words create the tone you want?', 'Where might your tone seem inappropriate?']
        }
      ]
    };

    const questions = stageQuestions[context.writingStage] || stageQuestions.drafting;

    return {
      requestId: `fallback-${Date.now()}`,
      action: this.getActionFromStage(context.writingStage),
      questions,
      overallEducationalGoal: `Develop ${context.writingStage} skills through critical thinking and self-reflection`,
      reflectionPrompt: 'How did thinking about these questions change your approach to your writing?',
      nextStepSuggestions: [
        'Take time to reflect on each question before continuing',
        'Revise your writing based on insights from these questions',
        'Consider discussing your thoughts with a peer or instructor'
      ]
    };
  }

  private getFallbackPerspectives(_topic: string): PerspectiveSuggestion[] {
    return [
      {
        id: 'fallback-perspective-1',
        perspective: 'Historical Context',
        description: 'Consider how this topic has evolved over time and what historical factors have shaped current understanding',
        questionsToExplore: [
          'How has thinking about this topic changed over the past decade?',
          'What historical events or trends influenced current perspectives?',
          'What can we learn from how this issue was handled in the past?'
        ],
        educationalValue: 'Develops historical thinking and understanding of change over time',
        resourceSuggestions: [
          'Historical documents and primary sources',
          'Academic articles tracing the evolution of ideas',
          'Comparative studies across different time periods'
        ]
      },
      {
        id: 'fallback-perspective-2',
        perspective: 'Stakeholder Analysis',
        description: 'Examine who is affected by this topic and how different groups might view it differently',
        questionsToExplore: [
          'Who benefits from current approaches to this topic?',
          'Who might be harmed or disadvantaged?',
          'What do different stakeholder groups prioritize?'
        ],
        educationalValue: 'Builds empathy and understanding of diverse viewpoints',
        resourceSuggestions: [
          'Interviews or statements from different stakeholder groups',
          'Policy documents showing different positions',
          'Community impact studies'
        ]
      }
    ];
  }

  private getActionFromStage(stage: WritingStage): AIEducationalAction {
    const actionMap: Record<WritingStage, AIEducationalAction> = {
      'brainstorming': 'generate_prompts',
      'drafting': 'prompt_development',
      'revising': 'evaluate_arguments',
      'editing': 'identify_clarity_issues'
    };

    return actionMap[stage] || 'generate_prompts';
  }
}