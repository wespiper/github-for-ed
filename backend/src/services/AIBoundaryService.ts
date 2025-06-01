import { randomUUID } from 'crypto';
import { EducationalAIService } from './ai/EducationalAIService';
import { ReflectionAnalysisService } from './ai/ReflectionAnalysisService';
import { 
  StudentRepository, 
  AssignmentRepository, 
  AIInteractionRepository 
} from '../repositories/interfaces';

// Educational AI Actions - Focus on questions and prompts, never content generation
export type AIEducationalAction = 
  // Brainstorming Stage
  | 'generate_prompts'          // "Have you considered..." type questions
  | 'suggest_perspectives'      // Alternative viewpoints to explore
  | 'ask_clarifying_questions'  // Help focus ideas
  
  // Drafting Stage  
  | 'suggest_organization'      // Structure questions, not content
  | 'prompt_development'        // "What evidence supports..." questions
  | 'identify_gaps'             // Point out missing elements
  
  // Revising Stage
  | 'evaluate_arguments'        // Logic and consistency questions
  | 'suggest_evidence_needs'    // "What would strengthen..." prompts
  | 'question_logic'            // Critical thinking challenges
  
  // Editing Stage
  | 'suggest_grammar_fixes'     // Mechanical corrections with explanation
  | 'identify_clarity_issues'   // Questions about unclear passages  
  | 'recommend_style_improvements' // Reader-focused suggestions

// Prohibited actions - these should NEVER be allowed
export type ProhibitedAIAction = 
  | 'generate_content'      // Writing paragraphs or sentences
  | 'complete_thoughts'     // Finishing student ideas
  | 'provide_final_answers' // Giving solutions instead of guidance

export type WritingStage = 'brainstorming' | 'drafting' | 'revising' | 'editing';

// Current AI assistance types (educational actions to be implemented in Phase 3B)
export type AIAssistanceType = 
  | 'grammar' 
  | 'style' 
  | 'structure' 
  | 'research' 
  | 'citations' 
  | 'brainstorming' 
  | 'outlining';

export type AIBoundaryLevel = 'strict' | 'moderate' | 'permissive';

// Maintain backward compatibility with existing implementation
export interface AIAssistanceRequest {
  studentId: string;
  assignmentId: string;
  submissionId?: string;
  assistanceType: AIAssistanceType;
  context: {
    currentStage?: string;
    contentSample: string;
    specificQuestion: string;
    learningObjective: string;
  };
  timestamp: Date;
}

// Educational AI Response matching frontend expectations
export interface AIAssistanceResponse {
  requestId: string;
  approved: boolean;
  
  // Educational guidance (questions/prompts, never answers)
  educationalGuidance?: {
    type: 'question' | 'prompt' | 'perspective' | 'challenge';
    action: string;
    content: string[];                // Array of questions/prompts
    educationalRationale: string;     // Why this helps learning
    expectedOutcome: string;          // What student should discover
    reflectionPrompt: string;         // Required reflection
  };
  
  // Learning-focused alternatives when denied
  educationalAlternatives?: {
    independentActions: string[];     // What student can do alone
    resourceSuggestions: string[];    // Materials to consult
    reflectionQuestions: string[];    // Questions to consider
    learningObjective: string;        // Why independence matters
  };
  
  // Always required
  contributionTracking: {
    mustBeAttributed: boolean;
    visibleToEducator: boolean;
    impactsAssessment: boolean;
  };
  
  // Mandatory reflection requirements
  mandatoryReflection: {
    required: boolean;
    minimumLength: number;
    qualityThreshold: 'basic' | 'detailed' | 'analytical';
    prompts: string[];
  };
}

// Maintain backward compatibility with existing implementation
export interface AIUsageAnalytics {
  studentId: string;
  assignmentId: string;
  usageStats: {
    totalRequests: number;
    approvedRequests: number;
    deniedRequests: number;
    assistanceTypes: Record<AIAssistanceType, number>;
    averageRequestsPerSession: number;
  };
  learningImpact: {
    independentWorkTime: number; // minutes without AI
    assistedWorkTime: number; // minutes with AI
    skillDevelopmentScore: number; // 0-100
    reflectionQuality: number; // 0-100
  };
  recommendations: {
    reduceAIDependency?: boolean;
    encourageMoreExploration?: boolean;
    focusAreas: string[];
  };
}

export interface StageSpecificBoundaries {
  stageId: string;
  allowedTypes: string[];
  boundaryLevel: AIBoundaryLevel;
  customPrompts: string[];
}

/**
 * AI Boundary Service - Refactored to use Repository Pattern
 * Evaluates and controls AI assistance requests based on educational boundaries
 */
export class AIBoundaryService {
  
  constructor(
    private studentRepository: StudentRepository,
    private assignmentRepository: AssignmentRepository,
    private aiInteractionRepository: AIInteractionRepository,
    private educationalAIService: EducationalAIService
  ) {}

  /**
   * Evaluate whether AI assistance should be provided for a specific request
   * Now integrated with ReflectionAnalysisService for progressive access
   */
  async evaluateAssistanceRequest(
    request: AIAssistanceRequest
  ): Promise<AIAssistanceResponse> {
    try {
      // Get student's reflection history to determine access level
      const reflectionHistory = await ReflectionAnalysisService.getStudentReflectionHistory(
        request.studentId, 
        request.assignmentId
      );

      // Check if student has been gaming the system
      if (reflectionHistory.averageQuality < 30 && reflectionHistory.totalReflections > 3) {
        return this.createDenialResponse(
          'Your recent reflections need more depth and authenticity',
          'Quality reflections help you learn from AI interactions. Take time to think deeply about how the guidance affects your writing.',
          [
            'Review the reflection prompts carefully',
            'Share specific examples from your writing',
            'Explain your actual thought process'
          ]
        );
      }

      // Use the enhanced method logic with repositories
      const response = await this.createEducationalResponseWithReflectionRequirements(request, reflectionHistory);
      
      return response;
    } catch (error) {
      console.error('Error in evaluateAssistanceRequest:', error);
      // Fallback to basic response on error
      return this.createEducationalResponse(request);
    }
  }

  /**
   * Create educational response with adaptive reflection requirements
   */
  private async createEducationalResponseWithReflectionRequirements(
    request: AIAssistanceRequest,
    reflectionHistory: any
  ): Promise<AIAssistanceResponse> {
    // Get base educational response
    const questions = this.generateStageQuestions(request.assistanceType, request.context);
    
    // Calculate reflection requirements based on history
    const reflectionReqs = await ReflectionAnalysisService.calculateRequirements(
      request.studentId,
      questions
    );
    
    return {
      requestId: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      approved: true,
      educationalGuidance: {
        type: 'question',
        action: request.assistanceType,
        content: questions,
        educationalRationale: "These questions help you think deeper about your writing choices and develop critical thinking skills.",
        expectedOutcome: "You should discover new perspectives and approaches to strengthen your argument.",
        reflectionPrompt: "How did these questions change your thinking about your topic?"
      },
      contributionTracking: {
        mustBeAttributed: true,
        visibleToEducator: true,
        impactsAssessment: false
      },
      mandatoryReflection: {
        required: true,
        minimumLength: reflectionReqs.minimumLength,
        qualityThreshold: reflectionReqs.qualityThreshold,
        prompts: reflectionReqs.prompts
      }
    };
  }

  /**
   * Create a mock educational response for testing
   */
  private createEducationalResponse(request: AIAssistanceRequest): AIAssistanceResponse {
    const questions = this.generateStageQuestions(request.assistanceType, request.context);
    
    return {
      requestId: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      approved: true,
      educationalGuidance: {
        type: 'question',
        action: request.assistanceType,
        content: questions,
        educationalRationale: "These questions help you think deeper about your writing choices and develop critical thinking skills.",
        expectedOutcome: "You should discover new perspectives and approaches to strengthen your argument.",
        reflectionPrompt: "How did these questions change your thinking about your topic?"
      },
      contributionTracking: {
        mustBeAttributed: true,
        visibleToEducator: true,
        impactsAssessment: false
      },
      mandatoryReflection: {
        required: true,
        minimumLength: 100,
        qualityThreshold: 'basic',
        prompts: [
          "Explain how these questions helped you think about your writing differently.",
          "What new ideas or approaches will you try based on this guidance?"
        ]
      }
    };
  }

  /**
   * Generate stage-appropriate questions
   */
  private generateStageQuestions(assistanceType: string, context: any): string[] {
    const stageQuestions: Record<string, string[]> = {
      'generate_prompts': [
        "What personal experiences have shaped your perspective on this topic?",
        "How might someone who disagrees with you view this issue?",
        "What assumptions are you making that might be worth questioning?"
      ],
      'suggest_perspectives': [
        "What would an expert in this field emphasize differently?",
        "How might this issue affect different communities or age groups?",
        "What historical context might change how readers understand this topic?"
      ],
      'ask_clarifying_questions': [
        "What is the most important point you want readers to understand?",
        "What evidence would be most convincing to someone who disagrees?",
        "Which part of your argument feels least developed right now?"
      ],
      'suggest_organization': [
        "Which of your main points is strongest and deserves prominent placement?",
        "How can you help readers follow your logic from one idea to the next?",
        "Where might readers need more background information to understand your argument?"
      ],
      'evaluate_arguments': [
        "What are the strongest counterarguments to your position?",
        "Which of your claims needs the most support with evidence?",
        "How would you respond to someone who says your argument is too simple?"
      ]
    };

    return stageQuestions[assistanceType] || [
      "What specific aspect of your writing are you trying to improve?",
      "How does this part connect to your main argument?",
      "What would make this section more compelling for your readers?"
    ];
  }

  /**
   * Configure AI boundaries for an assignment (refactored to use repositories)
   */
  async configureAssignmentBoundaries(
    assignmentId: string,
    instructorId: string,
    boundaries: {
      enabled: boolean;
      globalBoundary: AIBoundaryLevel;
      allowedAssistanceTypes: AIAssistanceType[];
      stageSpecificSettings: StageSpecificBoundaries[];
      requireReflection: boolean;
      reflectionPrompts: string[];
    }
  ): Promise<void> {
    this.validateObjectId(assignmentId);
    this.validateObjectId(instructorId);
    
    const assignment = await this.assignmentRepository.findById(assignmentId);
    if (!assignment) {
      throw new Error('Assignment not found');
    }
    
    // Verify instructor ownership
    if (assignment.instructorId !== instructorId) {
      throw new Error('Only the assignment instructor can configure AI boundaries');
    }
    
    // Validate boundaries configuration
    this.validateBoundariesConfiguration(boundaries);
    
    // Update assignment with AI settings using repository
    await this.assignmentRepository.updateAIBoundaries(assignmentId, {
      enabled: boundaries.enabled,
      globalBoundary: boundaries.globalBoundary,
      allowedAssistanceTypes: boundaries.allowedAssistanceTypes,
      stageSpecificSettings: boundaries.stageSpecificSettings,
      requireReflection: boundaries.requireReflection,
      reflectionPrompts: boundaries.reflectionPrompts
    });
  }
  
  /**
   * Get AI usage analytics for a student or assignment (refactored to use repositories)
   */
  async getAIUsageAnalytics(
    studentId: string,
    assignmentId: string,
    timeframe?: { start: Date; end: Date }
  ): Promise<AIUsageAnalytics> {
    this.validateObjectId(studentId);
    this.validateObjectId(assignmentId);
    
    // Get AI interactions using repository
    const interactions = await this.aiInteractionRepository.findByStudentId(
      studentId,
      timeframe
    );
    
    // Filter by assignment
    const assignmentInteractions = interactions.filter(
      interaction => interaction.assignmentId === assignmentId
    );
    
    const usageStats = this.calculateUsageStats(assignmentInteractions);
    const learningImpact = await this.calculateLearningImpact(
      studentId, 
      assignmentId, 
      assignmentInteractions
    );
    const recommendations = this.generateRecommendations(usageStats, learningImpact);
    
    return {
      studentId,
      assignmentId,
      usageStats,
      learningImpact,
      recommendations
    };
  }
  
  /**
   * Generate reflection prompts after AI assistance use
   */
  generatePostAssistanceReflection(
    assistanceType: AIAssistanceType,
    context: string
  ): {
    prompts: string[];
    requiredResponses: number;
    learningGoals: string[];
  } {
    const basePrompts = this.getReflectionPrompts(assistanceType);
    const contextualPrompts = this.generateContextualPrompts(assistanceType, context);
    
    return {
      prompts: [...basePrompts, ...contextualPrompts],
      requiredResponses: Math.min(3, basePrompts.length),
      learningGoals: this.getLearningGoals(assistanceType)
    };
  }
  
  /**
   * Check if a student is becoming overly dependent on AI (refactored to use repositories)
   */
  async assessAIDependency(
    studentId: string,
    courseId: string,
    timeframe: { start: Date; end: Date }
  ): Promise<{
    dependencyLevel: 'low' | 'moderate' | 'high';
    indicators: string[];
    recommendations: string[];
    interventionNeeded: boolean;
  }> {
    this.validateObjectId(studentId);
    this.validateObjectId(courseId);
    
    // Get all assignments in the course using repository
    const assignments = await this.assignmentRepository.findByCourseId(courseId);
    const assignmentIds = assignments.map(a => a.id);
    
    // Get AI usage across all assignments using repository
    const allInteractions = await this.aiInteractionRepository.findByStudentId(
      studentId,
      timeframe
    );
    
    // Filter interactions for this course
    const courseInteractions = allInteractions.filter(
      interaction => assignmentIds.includes(interaction.assignmentId || '')
    );
    
    // Get student's writing analytics using repository
    const studentAnalytics = await this.studentRepository.findLearningAnalytics(
      studentId,
      timeframe
    );
    
    return this.analyzeDependencyPatterns(courseInteractions, studentAnalytics);
  }
  
  /**
   * Provide AI coaching suggestions for educators (refactored to use repositories)
   */
  async getAICoachingInsights(
    instructorId: string,
    courseId: string
  ): Promise<{
    classOverview: {
      totalStudents: number;
      aiActiveStudents: number;
      averageUsageRate: number;
      mostRequestedAssistance: AIAssistanceType;
    };
    studentConcerns: {
      studentId: string;
      concernLevel: 'low' | 'medium' | 'high';
      issues: string[];
      suggestions: string[];
    }[];
    boundaryRecommendations: {
      assignmentId: string;
      assignmentTitle: string;
      suggestedChanges: string[];
      rationale: string;
    }[];
  }> {
    this.validateObjectId(instructorId);
    this.validateObjectId(courseId);
    
    // Get assignments with AI analytics using repository
    const assignments = await this.assignmentRepository.findWithAIAnalytics(courseId);
    
    // Filter by instructor
    const instructorAssignments = assignments.filter(
      assignment => assignment.instructorId === instructorId
    );
    
    if (instructorAssignments.length === 0) {
      throw new Error('Access denied: No assignments found for this instructor in the course');
    }
    
    const classOverview = await this.calculateClassAIOverview(instructorAssignments);
    const studentConcerns = await this.identifyStudentConcerns(instructorAssignments);
    const boundaryRecommendations = await this.generateBoundaryRecommendations(instructorAssignments);
    
    return {
      classOverview,
      studentConcerns,
      boundaryRecommendations
    };
  }
  
  // Private helper methods (maintained for compatibility)
  
  private validateObjectId(id: string): void {
    if (!this.isValidUUID(id)) {
      throw new Error(`Invalid UUID: ${id}`);
    }
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
  
  private createDenialResponse(
    reason: string,
    educationalRationale: string,
    alternatives: string[]
  ): AIAssistanceResponse {
    return {
      requestId: randomUUID(),
      approved: false,
      educationalAlternatives: {
        independentActions: alternatives,
        resourceSuggestions: ['Review assignment instructions', 'Consult course materials'],
        reflectionQuestions: ['What can you try on your own first?', 'What specific help do you need?'],
        learningObjective: educationalRationale
      },
      contributionTracking: {
        mustBeAttributed: false,
        visibleToEducator: true,
        impactsAssessment: false
      },
      mandatoryReflection: {
        required: false,
        minimumLength: 0,
        qualityThreshold: 'basic',
        prompts: []
      }
    };
  }
  
  private validateBoundariesConfiguration(boundaries: any): void {
    if (!Array.isArray(boundaries.allowedAssistanceTypes)) {
      throw new Error('allowedAssistanceTypes must be an array');
    }
    
    if (!Array.isArray(boundaries.stageSpecificSettings)) {
      throw new Error('stageSpecificSettings must be an array');
    }
    
    const validBoundaryLevels = ['strict', 'moderate', 'permissive'];
    if (!validBoundaryLevels.includes(boundaries.globalBoundary)) {
      throw new Error('Invalid global boundary level');
    }
  }
  
  private calculateUsageStats(interactions: any[]): any {
    const totalRequests = interactions.length;
    const approvedRequests = interactions.filter(i => i.educationallySound).length;
    const deniedRequests = totalRequests - approvedRequests;
    
    const assistanceTypes: Record<AIAssistanceType, number> = {
      grammar: 0,
      style: 0,
      structure: 0,
      brainstorming: 0,
      research: 0,
      citations: 0,
      outlining: 0
    };
    
    interactions.forEach((interaction: any) => {
      if (interaction.assistanceType && assistanceTypes[interaction.assistanceType as AIAssistanceType] !== undefined) {
        assistanceTypes[interaction.assistanceType as AIAssistanceType]++;
      }
    });
    
    return {
      totalRequests,
      approvedRequests,
      deniedRequests,
      assistanceTypes,
      averageRequestsPerSession: totalRequests > 0 ? totalRequests / Math.max(1, interactions.length / 5) : 0
    };
  }
  
  private async calculateLearningImpact(
    studentId: string,
    assignmentId: string,
    interactions: any[]
  ): Promise<any> {
    // Get student analytics using repository
    const studentAnalytics = await this.studentRepository.findLearningAnalytics(
      studentId,
      { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() }
    );
    
    const assistedTime = interactions.length * 10; // Estimate 10 minutes per AI interaction
    const independentTime = studentAnalytics ? Math.max(0, studentAnalytics.totalSubmissions * 60 - assistedTime) : 0;
    
    return {
      independentWorkTime: independentTime,
      assistedWorkTime: assistedTime,
      skillDevelopmentScore: Math.max(0, 100 - (interactions.length * 5)), // Decreases with AI dependency
      reflectionQuality: studentAnalytics?.reflectionQuality || 75
    };
  }
  
  private generateRecommendations(usageStats: any, learningImpact: any): any {
    const recommendations: any = {
      focusAreas: []
    };
    
    if (usageStats.totalRequests > 20) {
      recommendations.reduceAIDependency = true;
      recommendations.focusAreas.push('Building independent writing confidence');
    }
    
    if (learningImpact.independentWorkTime < learningImpact.assistedWorkTime) {
      recommendations.encourageMoreExploration = true;
      recommendations.focusAreas.push('Developing self-reliance in problem-solving');
    }
    
    if (learningImpact.skillDevelopmentScore < 60) {
      recommendations.focusAreas.push('Strengthening foundational writing skills');
    }
    
    return recommendations;
  }
  
  private getReflectionPrompts(assistanceType: AIAssistanceType): string[] {
    const promptMap = {
      grammar: [
        'What grammar patterns did you notice in the feedback?',
        'How can you catch these errors independently next time?'
      ],
      style: [
        'Which style suggestions resonated with your writing goals?',
        'How do these changes affect your voice as a writer?'
      ],
      structure: [
        'How does better organization serve your argument?',
        'What organizational strategies will you try in future writing?'
      ],
      brainstorming: [
        'Which ideas feel most authentic to your perspective?',
        'How do these suggestions connect to your own experiences?'
      ],
      research: [
        'How do these sources strengthen your argument?',
        'What research strategies did you learn from this process?'
      ],
      citations: [
        'Why is proper citation important for your credibility?',
        'How does citation connect to academic integrity?'
      ],
      outlining: [
        'How does this structure support your main argument?',
        'What organizational patterns work best for your writing?'
      ]
    };
    
    return promptMap[assistanceType] || ['How did this assistance help your learning?'];
  }
  
  private generateContextualPrompts(assistanceType: AIAssistanceType, context: string): string[] {
    // Generate prompts based on specific context - simplified implementation
    return [`How does this ${assistanceType} help you communicate your specific ideas about: "${context.slice(0, 50)}..."`];
  }
  
  private getLearningGoals(assistanceType: AIAssistanceType): string[] {
    const goalMap = {
      grammar: ['Develop self-editing skills', 'Internalize grammar patterns'],
      style: ['Find your authentic voice', 'Adapt style to audience'],
      structure: ['Organize ideas logically', 'Support arguments effectively'],
      brainstorming: ['Generate original ideas', 'Think creatively about topics'],
      research: ['Evaluate source credibility', 'Integrate evidence effectively'],
      citations: ['Practice academic integrity', 'Learn scholarly conventions'],
      outlining: ['Create logical frameworks', 'Plan effective organization']
    };
    
    return goalMap[assistanceType] || ['Develop independent learning skills'];
  }
  
  private analyzeDependencyPatterns(interactions: any[], studentAnalytics: any): any {
    const totalInteractions = interactions.length;
    
    let dependencyLevel: 'low' | 'moderate' | 'high' = 'low';
    const indicators = [];
    
    // Simple dependency analysis based on frequency
    const daySpan = 30; // Analyze over 30 days
    const requestsPerDay = totalInteractions / daySpan;
    
    if (requestsPerDay > 1) {
      dependencyLevel = 'high';
      indicators.push('Very frequent AI assistance requests');
    } else if (requestsPerDay > 0.5) {
      dependencyLevel = 'moderate';
      indicators.push('Regular AI assistance usage');
    }
    
    if (totalInteractions > 50) {
      indicators.push('High total usage count');
      if (dependencyLevel === 'low') dependencyLevel = 'moderate';
    }
    
    const recommendations = [];
    if (dependencyLevel === 'high') {
      recommendations.push('Encourage independent work sessions');
      recommendations.push('Set AI usage goals with decreasing limits');
    } else if (dependencyLevel === 'moderate') {
      recommendations.push('Balance AI assistance with independent practice');
    }
    
    return {
      dependencyLevel,
      indicators,
      recommendations,
      interventionNeeded: dependencyLevel === 'high'
    };
  }
  
  private async calculateClassAIOverview(assignments: any[]): Promise<any> {
    // Calculate overview from assignments with AI analytics
    const allInteractions = assignments.flatMap(a => a.aiInteractionLogs || []);
    const uniqueStudents = new Set(allInteractions.map((log: any) => log.studentId));
    
    // Count assistance types
    const assistanceTypeCounts = allInteractions.reduce((acc: any, log: any) => {
      acc[log.assistanceType] = (acc[log.assistanceType] || 0) + 1;
      return acc;
    }, {});
    
    const mostRequestedAssistance = Object.entries(assistanceTypeCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] as AIAssistanceType || 'grammar';
    
    return {
      totalStudents: 25, // Would need to get from course enrollment
      aiActiveStudents: uniqueStudents.size,
      averageUsageRate: uniqueStudents.size > 0 ? allInteractions.length / uniqueStudents.size : 0,
      mostRequestedAssistance
    };
  }
  
  private async identifyStudentConcerns(assignments: any[]): Promise<any[]> {
    // Simplified implementation - would analyze patterns in real implementation
    return [];
  }
  
  private async generateBoundaryRecommendations(assignments: any[]): Promise<any[]> {
    // Simplified implementation - would analyze patterns and suggest boundary adjustments
    return [];
  }
}