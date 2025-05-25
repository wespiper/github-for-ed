import { Assignment } from '../models/Assignment';
import { AssignmentSubmission } from '../models/AssignmentSubmission';
import { WritingSession } from '../models/WritingSession';
import { User } from '../models/User';
import mongoose from 'mongoose';
import { EducationalAIService } from './ai/EducationalAIService';

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

/*
// FUTURE: Educational AI Request Interface (Phase 3B Implementation)
export interface AIEducationalRequest {
  studentId: string;
  assignmentId: string;
  submissionId?: string;
  action: AIEducationalAction;
  context: {
    currentStage: WritingStage;
    contentSample: string;
    specificQuestion: string;      // What student is trying to figure out
    learningObjective: string;     // What they should learn from this
  };
  timestamp: Date;
}
*/

/*
// FUTURE: Educational AI Contribution Interface (Phase 3B Implementation)
export interface AIContribution {
  id: string;
  type: 'question' | 'prompt' | 'perspective' | 'feedback';
  content: string;
  timestamp: Date;
  stage: WritingStage;
  action: AIEducationalAction;
  educationalRationale: string;   // Why this helps learning
  
  // Student engagement requirement
  studentResponse: {
    acknowledged: boolean;
    reflection: string;           // Required explanation of thinking
    reasoning: string;            // Why they found it helpful/not helpful
    applied: boolean;            // Did they use this in their writing
    modifications: string;       // How they adapted the suggestion
  } | null;
  
  // Attribution and transparency
  educatorVisible: boolean;
  attributionRequired: boolean;   // Must be cited in final work
  learningImpact: 'none' | 'minimal' | 'moderate' | 'significant';
}
*/

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

/*
// FUTURE: Educational AI Response Interface (Phase 3B Implementation)
export interface AIEducationalResponse {
  requestId: string;
  approved: boolean;
  
  // When approved: Educational questions and prompts
  educationalGuidance?: {
    type: 'question' | 'prompt' | 'perspective' | 'challenge';
    action: AIEducationalAction;
    content: string[];               // Array of questions/prompts, never answers
    educationalRationale: string;    // Why this helps learning
    expectedOutcome: string;         // What student should discover
    reflectionPrompt: string;        // Required reflection after engagement
  };
  
  // When denied: Learning-focused alternatives  
  denialReason?: string;
  educationalAlternatives?: {
    independentActions: string[];    // What student can do alone
    resourceSuggestions: string[];   // Materials to consult
    reflectionQuestions: string[];   // Questions to consider
    learningObjective: string;       // Why independence is valuable here
  };
  
  // Always required
  contributionTracking: {
    mustBeAttributed: boolean;
    visibleToEducator: boolean;
    impactsAssessment: boolean;
  };
  
  // Required reflection before next AI interaction
  mandatoryReflection: {
    required: boolean;
    minimumLength: number;
    qualityThreshold: 'basic' | 'detailed' | 'analytical';
    prompts: string[];
  };
}
*/

/*
// FUTURE: Reflection Quality Assessment (Phase 3B Implementation)
export interface ReflectionQualityMetrics {
  length: number;
  thoughtfulness: 'surface' | 'developing' | 'deep';
  specificity: 'vague' | 'specific' | 'detailed';
  criticalThinking: 'absent' | 'present' | 'sophisticated';
  selfAwareness: 'low' | 'medium' | 'high';
  educationalValue: number; // 1-10 scale
  
  // Progressive access impact
  unlocksNextLevel: boolean;
  allowsMoreAIAccess: boolean;
}

// FUTURE: Progressive AI Access System (Phase 3B Implementation)
export interface AIAccessProgression {
  currentLevel: 'restricted' | 'standard' | 'enhanced';
  interactionsRemaining: number;
  reflectionQualityRequired: 'basic' | 'detailed' | 'analytical';
  
  unlockCriteria: {
    reflectionQuality: number;        // Average quality score needed
    consistentEngagement: boolean;    // Regular reflection participation
    educatorApproval?: boolean;       // Optional educator override
    independenceShown: boolean;       // Evidence of working without AI
  };
  
  restrictions: {
    maxInteractionsPerHour: number;
    reflectionRequiredAfter: number;  // Every N interactions
    educatorNotificationTrigger: boolean;
  };
}
*/

// This interface is replaced by the new educational version above

/*
// FUTURE: Educational AI Analytics Interface (Phase 3B Implementation)
export interface AIEducationalAnalytics {
  studentId: string;
  assignmentId: string;
  
  // Educational Interaction Patterns
  educationalEngagement: {
    totalInteractions: number;
    questionsAsked: number;               // AI asked questions
    promptsEngaged: number;               // Student engaged with prompts
    reflectionsCompleted: number;         
    averageReflectionQuality: number;     // 1-10 scale
    stageProgression: Record<WritingStage, number>;
  };
  
  // Critical Thinking Development
  intellectualGrowth: {
    independentWorkTime: number;          // Minutes working without AI
    assistedThinkingTime: number;         // Minutes engaging with AI questions
    questionQualityImprovement: number;   // How student questions evolved
    criticalThinkingScore: number;        // Evidence of deeper analysis
    selfAwarenessGrowth: number;          // Metacognitive development
  };
  
  // Learning Process Visibility
  processAwareness: {
    writingDecisionExplanations: number;  // Can articulate choices
    revisionReasoning: number;            // Explains changes made
    sourceEvaluation: number;             // Critical assessment of sources
    argumentDevelopment: number;          // Logical thinking progression
  };
  
  // Independence Building
  autonomyDevelopment: {
    aiDependencyTrend: 'increasing' | 'stable' | 'decreasing';
    problemSolvingWithoutAI: number;      // Successfully worked independently
    questionFormulationSkill: number;     // Asks better questions over time
    confidenceInOwnThinking: number;      // Self-reported confidence
    transferToNewContexts: number;        // Applies learning elsewhere
  };
  
  // Educational Recommendations
  pedagogicalInsights: {
    readyForReducedAI: boolean;           // Can handle less assistance
    needsMoreScaffolding: boolean;        // Requires more support
    excellentReflector: boolean;          // High-quality self-assessment
    criticalThinkingStrengths: string[];  // Demonstrated capabilities
    growthOpportunities: string[];        // Areas for development
    nextLearningChallenges: string[];     // Appropriate next steps
  };
  
  // Attribution and Transparency
  contributionTracking: {
    totalAIContributions: number;
    attributedContributions: number;
    educatorVisibleInteractions: number;
    transparencyScore: number;            // How open about AI use
  };
}
*/

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

export class AIBoundaryService {
  
  /**
   * Evaluate whether AI assistance should be provided for a specific request
   * TEMPORARY IMPLEMENTATION: Returns educational guidance for testing
   */
  static async evaluateAssistanceRequest(
    request: AIAssistanceRequest
  ): Promise<AIAssistanceResponse> {
    // For now, return a mock educational response that matches frontend expectations
    return this.createEducationalResponse(request);
  }

  /**
   * Create a mock educational response for testing
   */
  private static createEducationalResponse(request: AIAssistanceRequest): AIAssistanceResponse {
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
  private static generateStageQuestions(assistanceType: string, context: any): string[] {
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

  // Rest of the original complex implementation (currently not used)
  private static async evaluateAssistanceRequestOriginal(
    request: AIAssistanceRequest
  ): Promise<any> {
    this.validateRequest(request);
    
    // Get assignment and its AI settings
    const assignment = await Assignment.findById(request.assignmentId);
    if (!assignment) {
      throw new Error('Assignment not found');
    }
    
    // Check if AI assistance is enabled for this assignment
    if (!assignment.aiSettings?.enabled) {
      return this.createDenialResponse(
        'AI assistance is not enabled for this assignment',
        'Complete this work independently to develop critical thinking skills',
        ['Use assignment rubric as guidance', 'Review course materials', 'Ask instructor for clarification']
      );
    }
    
    // Get current writing stage context
    const currentStage = await this.getCurrentWritingStage(request);
    
    // Check stage-specific boundaries
    const stageAllowed = this.isAssistanceAllowedInStage(
      assignment,
      currentStage,
      request.assistanceType
    );
    
    if (!stageAllowed.allowed) {
      return this.createDenialResponse(
        stageAllowed.reason || 'Stage restriction applies',
        stageAllowed.educationalRationale || 'This stage focuses on independent skill development',
        stageAllowed.alternatives || ['Try working independently first']
      );
    }
    
    // Check usage limits
    const usageLimits = await this.checkUsageLimits(request);
    if (!usageLimits.allowed) {
      return this.createDenialResponse(
        usageLimits.reason || 'Usage limit reached',
        'Developing independence in writing is crucial for learning',
        ['Take a break and return with fresh perspective', 'Review your work so far', 'Try a different approach']
      );
    }
    
    // Check global boundary level
    const globalBoundary = this.evaluateGlobalBoundary(
      assignment.aiSettings.globalBoundary,
      request.assistanceType
    );
    
    if (!globalBoundary.allowed) {
      return this.createDenialResponse(
        globalBoundary.reason || 'Global boundary restriction',
        globalBoundary.educationalRationale || 'This assignment has specific AI assistance limits',
        globalBoundary.alternatives || ['Try working independently']
      );
    }
    
    // Generate appropriate assistance
    const assistance = await this.generateBoundedAssistance(request, assignment);
    
    // Log the interaction
    await this.logAIInteraction(request, true);
    
    return {
      requestId: new mongoose.Types.ObjectId().toString(),
      approved: true,
      assistanceProvided: assistance,
      reflectionPrompt: this.generateReflectionPrompt(request.assistanceType),
      learningOpportunity: this.generateLearningOpportunity(request.assistanceType)
    };
  }
  
  /**
   * Configure AI boundaries for an assignment
   */
  static async configureAssignmentBoundaries(
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
    
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      throw new Error('Assignment not found');
    }
    
    // Verify instructor ownership
    if (assignment.instructor.toString() !== instructorId) {
      throw new Error('Only the assignment instructor can configure AI boundaries');
    }
    
    // Validate boundaries configuration
    this.validateBoundariesConfiguration(boundaries);
    
    // Update assignment with AI settings
    assignment.aiSettings = {
      enabled: boundaries.enabled,
      globalBoundary: boundaries.globalBoundary,
      allowedAssistanceTypes: boundaries.allowedAssistanceTypes,
      stageSpecificSettings: boundaries.stageSpecificSettings,
      requireReflection: boundaries.requireReflection,
      reflectionPrompts: boundaries.reflectionPrompts
    };
    
    await assignment.save();
  }
  
  /**
   * Get AI usage analytics for a student or assignment
   */
  static async getAIUsageAnalytics(
    studentId: string,
    assignmentId: string,
    timeframe?: { start: Date; end: Date }
  ): Promise<AIUsageAnalytics> {
    this.validateObjectId(studentId);
    this.validateObjectId(assignmentId);
    
    const timeQuery = timeframe ? {
      timestamp: { $gte: timeframe.start, $lte: timeframe.end }
    } : {};
    
    // Get AI interaction logs (would be from a dedicated collection)
    const interactions = await this.getAIInteractionLogs(
      studentId, 
      assignmentId, 
      timeQuery
    );
    
    const usageStats = this.calculateUsageStats(interactions);
    const learningImpact = await this.calculateLearningImpact(
      studentId, 
      assignmentId, 
      interactions
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
  static generatePostAssistanceReflection(
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
   * Check if a student is becoming overly dependent on AI
   */
  static async assessAIDependency(
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
    
    // Get all assignments in the course
    const assignments = await Assignment.find({ course: courseId });
    const assignmentIds = assignments.map(a => a._id);
    
    // Get AI usage across all assignments
    const allInteractions = [];
    for (const assignmentId of assignmentIds) {
      const interactions = await this.getAIInteractionLogs(
        studentId,
        assignmentId.toString(),
        { timestamp: { $gte: timeframe.start, $lte: timeframe.end } }
      );
      allInteractions.push(...interactions);
    }
    
    // Get writing sessions for comparison
    const writingSessions = await WritingSession.find({
      student: studentId,
      assignment: { $in: assignmentIds },
      startTime: { $gte: timeframe.start, $lte: timeframe.end }
    });
    
    return this.analyzeDependencyPatterns(allInteractions, writingSessions);
  }
  
  /**
   * Provide AI coaching suggestions for educators
   */
  static async getAICoachingInsights(
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
    
    // Verify instructor access
    const assignments = await Assignment.find({ 
      course: courseId, 
      instructor: instructorId 
    });
    
    if (assignments.length === 0) {
      throw new Error('Access denied: No assignments found for this instructor in the course');
    }
    
    const classOverview = await this.calculateClassAIOverview(assignments);
    const studentConcerns = await this.identifyStudentConcerns(assignments);
    const boundaryRecommendations = await this.generateBoundaryRecommendations(assignments);
    
    return {
      classOverview,
      studentConcerns,
      boundaryRecommendations
    };
  }
  
  // Private helper methods
  
  private static validateRequest(request: AIAssistanceRequest): void {
    if (!mongoose.Types.ObjectId.isValid(request.studentId)) {
      throw new Error('Invalid student ID');
    }
    if (!mongoose.Types.ObjectId.isValid(request.assignmentId)) {
      throw new Error('Invalid assignment ID');
    }
    if (!request.context.contentSample || !request.context.specificQuestion) {
      throw new Error('Content sample and specific request are required');
    }
  }
  
  private static validateObjectId(id: string): void {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error(`Invalid ObjectId: ${id}`);
    }
  }
  
  private static async getCurrentWritingStage(
    request: AIAssistanceRequest
  ): Promise<string | null> {
    if (request.context.currentStage) {
      return request.context.currentStage;
    }
    
    // Infer stage from submission status or other context
    const submission = await AssignmentSubmission.findOne({
      assignment: request.assignmentId,
      student: request.studentId
    });
    
    if (!submission) return null;
    
    // Simple stage inference based on progress
    if (submission.status === 'draft') return 'planning';
    if (submission.status === 'in_progress') return 'writing';
    if (submission.status === 'submitted') return 'revision';
    
    return null;
  }
  
  private static isAssistanceAllowedInStage(
    assignment: any,
    currentStage: string | null,
    assistanceType: AIAssistanceType
  ): { allowed: boolean; reason?: string; educationalRationale?: string; alternatives?: string[] } {
    if (!currentStage || !assignment.aiSettings?.stageSpecificSettings) {
      // Default to global settings if no stage-specific rules
      return { allowed: true };
    }
    
    const stageSettings = assignment.aiSettings.stageSpecificSettings.find(
      (s: any) => s.stageId === currentStage
    );
    
    if (!stageSettings) {
      return { allowed: true };
    }
    
    if (!stageSettings.allowedAssistanceTypes.includes(assistanceType)) {
      return {
        allowed: false,
        reason: `${assistanceType} is not allowed during the ${stageSettings.stageName} stage`,
        educationalRationale: `The ${stageSettings.stageName} stage focuses on developing independent ${this.getSkillForStage(currentStage)} skills`,
        alternatives: this.getStageAlternatives(currentStage)
      };
    }
    
    return { allowed: true };
  }
  
  private static async checkUsageLimits(
    request: AIAssistanceRequest
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Get recent AI interactions for this student/assignment
    const recentInteractions = await this.getAIInteractionLogs(
      request.studentId,
      request.assignmentId,
      {
        timestamp: {
          $gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      }
    );
    
    const maxRequestsPerHour = 5; // Configurable limit
    
    if (recentInteractions.length >= maxRequestsPerHour) {
      return {
        allowed: false,
        reason: `You've reached the maximum of ${maxRequestsPerHour} AI assistance requests per hour`
      };
    }
    
    return { allowed: true };
  }
  
  private static evaluateGlobalBoundary(
    globalBoundary: AIBoundaryLevel,
    assistanceType: AIAssistanceType
  ): { allowed: boolean; reason?: string; educationalRationale?: string; alternatives?: string[] } {
    const boundaryRules = {
      strict: ['grammar'],
      moderate: ['grammar', 'style', 'citations'],
      permissive: ['grammar', 'style', 'structure', 'brainstorming', 'research', 'citations', 'outlining']
    };
    
    const allowedTypes = boundaryRules[globalBoundary];
    
    if (!allowedTypes.includes(assistanceType)) {
      return {
        allowed: false,
        reason: `${assistanceType} exceeds the ${globalBoundary} AI boundary level for this assignment`,
        educationalRationale: this.getBoundaryRationale(globalBoundary),
        alternatives: this.getBoundaryAlternatives(globalBoundary)
      };
    }
    
    return { allowed: true };
  }
  
  private static async generateBoundedAssistance(
    request: AIAssistanceRequest,
    assignment: any
  ): Promise<{
    type: AIAssistanceType;
    suggestions: string[];
    explanation: string;
    educationalRationale: string;
  }> {
    try {
      // Use real AI service to generate educational questions
      const questionSet = await EducationalAIService.generateEducationalQuestions(request, assignment);
      
      // Convert AI-generated questions to the expected format
      const suggestions = questionSet.questions.map(q => q.question);
      const explanation = questionSet.overallEducationalGoal;
      const educationalRationale = questionSet.questions[0]?.educationalRationale || 
        'AI assistance provides questions to guide your thinking and learning process.';
      
      return {
        type: request.assistanceType,
        suggestions,
        explanation,
        educationalRationale
      };
    } catch (error) {
      console.error('Real AI assistance failed, using fallback:', error);
      
      // Fallback to educational alternatives if AI fails
      const fallbackMap = {
        grammar: {
          suggestions: [
            'What grammar patterns do you notice in your writing?',
            'How can you check for subject-verb agreement in your paragraphs?',
            'Which sentences might benefit from proofreading?'
          ],
          explanation: 'These questions help you develop self-editing skills.',
          educationalRationale: 'Learning to identify and correct your own grammar builds writing independence.'
        },
        style: {
          suggestions: [
            'How does your word choice reflect your intended tone?',
            'Where might you vary sentence length for better flow?',
            'What voice do you want to convey to your audience?'
          ],
          explanation: 'These questions help you think about writing style and voice.',
          educationalRationale: 'Developing style awareness improves communication effectiveness.'
        },
        structure: {
          suggestions: [
            'How does each paragraph advance your main argument?',
            'What transitions would help readers follow your logic?',
            'Where is your strongest evidence, and how can you highlight it?'
          ],
          explanation: 'These questions help you think about organization and flow.',
          educationalRationale: 'Strong structure makes arguments more persuasive and easier to follow.'
        },
        brainstorming: {
          suggestions: [
            'What questions does your topic raise for you?',
            'How does this connect to your personal experience?',
            'What would someone who disagrees with you say?'
          ],
          explanation: 'These questions help expand your thinking about the topic.',
          educationalRationale: 'Good questions lead to deeper exploration and original ideas.'
        },
        research: {
          suggestions: [
            'What types of sources would strengthen your argument?',
            'How can you evaluate the credibility of your sources?',
            'What perspectives might you be missing?'
          ],
          explanation: 'These questions guide your research process.',
          educationalRationale: 'Critical evaluation of sources is essential for academic integrity.'
        },
        citations: {
          suggestions: [
            'How can you check your citation format?',
            'Which ideas need attribution in your writing?',
            'What citation style does your assignment require?'
          ],
          explanation: 'These questions help ensure proper academic attribution.',
          educationalRationale: 'Proper citation shows respect for others\' intellectual work.'
        },
        outlining: {
          suggestions: [
            'What is your main argument or thesis?',
            'How do your supporting points connect logically?',
            'What order would be most persuasive for your audience?'
          ],
          explanation: 'These questions help you organize your ideas effectively.',
          educationalRationale: 'Clear organization makes writing more compelling and easier to understand.'
        }
      };
      
      const fallback = fallbackMap[request.assistanceType] || fallbackMap.structure;
      
      return {
        type: request.assistanceType,
        ...fallback
      };
    }
  }
  
  private static createDenialResponse(
    reason: string,
    educationalRationale: string,
    alternatives: string[]
  ): AIAssistanceResponse {
    return {
      requestId: new mongoose.Types.ObjectId().toString(),
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
  
  private static generateReflectionPrompt(assistanceType: AIAssistanceType): string {
    const prompts = {
      grammar: 'How will you remember these grammar patterns for future writing?',
      style: 'What did you learn about writing style that you can apply to other assignments?',
      structure: 'How does improving organization help communicate your ideas more effectively?',
      brainstorming: 'Which of these ideas feel most authentic to your own thinking?',
      research: 'How do these sources connect to your original research question?',
      citations: 'Why is proper citation important for academic integrity?',
      outlining: 'How does this organizational structure support your main argument?'
    };
    
    return prompts[assistanceType] || 'How did this assistance help you grow as a writer?';
  }
  
  private static generateLearningOpportunity(assistanceType: AIAssistanceType): string {
    const opportunities = {
      grammar: 'This is an opportunity to internalize grammar patterns and develop self-editing skills.',
      style: 'Use this feedback to develop your unique voice and writing style.',
      structure: 'Practice organizing ideas logically to strengthen critical thinking skills.',
      brainstorming: 'Build confidence in generating and evaluating your own ideas.',
      research: 'Develop skills in finding, evaluating, and integrating credible sources.',
      citations: 'Learn proper academic conventions and build scholarly writing habits.',
      outlining: 'Learn to create logical frameworks that support your arguments.'
    };
    
    return opportunities[assistanceType] || 'Every interaction with AI is a chance to become a more independent learner.';
  }
  
  private static validateBoundariesConfiguration(boundaries: any): void {
    if (!Array.isArray(boundaries.allowedAssistanceTypes)) {
      throw new Error('allowedAssistanceTypes must be an array');
    }
    
    if (!Array.isArray(boundaries.stageSpecificSettings)) {
      throw new Error('stageSpecificSettings must be an array');
    }
    
    const validBoundaryLevels = ['none', 'minimal', 'moderate', 'full'];
    if (!validBoundaryLevels.includes(boundaries.globalBoundary)) {
      throw new Error('Invalid global boundary level');
    }
  }
  
  private static async logAIInteraction(
    request: AIAssistanceRequest,
    approved: boolean
  ): Promise<void> {
    // In production, this would log to a dedicated AIInteraction collection
    console.log('AI Interaction:', {
      studentId: request.studentId,
      assignmentId: request.assignmentId,
      assistanceType: request.assistanceType,
      approved,
      timestamp: request.timestamp
    });
  }
  
  private static async getAIInteractionLogs(
    studentId: string,
    assignmentId: string,
    timeQuery: any
  ): Promise<any[]> {
    // Mock implementation - in production, query AIInteraction collection
    return [];
  }
  
  private static calculateUsageStats(interactions: any[]): any {
    const totalRequests = interactions.length;
    const approvedRequests = interactions.filter(i => i.approved).length;
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
  
  private static async calculateLearningImpact(
    studentId: string,
    assignmentId: string,
    interactions: any[]
  ): Promise<any> {
    // Get writing sessions to calculate independent vs assisted work time
    const writingSessions = await WritingSession.find({
      student: studentId,
      assignment: assignmentId
    });
    
    const totalWritingTime = writingSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    const assistedTime = interactions.length * 10; // Estimate 10 minutes per AI interaction
    const independentTime = Math.max(0, totalWritingTime - assistedTime);
    
    return {
      independentWorkTime: independentTime,
      assistedWorkTime: assistedTime,
      skillDevelopmentScore: Math.max(0, 100 - (interactions.length * 5)), // Decreases with AI dependency
      reflectionQuality: 75 // Placeholder - would be calculated from actual reflection responses
    };
  }
  
  private static generateRecommendations(usageStats: any, learningImpact: any): any {
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
  
  private static getReflectionPrompts(assistanceType: AIAssistanceType): string[] {
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
  
  private static generateContextualPrompts(assistanceType: AIAssistanceType, context: string): string[] {
    // Generate prompts based on specific context - simplified implementation
    return [`How does this ${assistanceType} help you communicate your specific ideas about: "${context.slice(0, 50)}..."`];
  }
  
  private static getLearningGoals(assistanceType: AIAssistanceType): string[] {
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
  
  private static analyzeDependencyPatterns(interactions: any[], writingSessions: any[]): any {
    const totalInteractions = interactions.length;
    const totalSessions = writingSessions.length;
    
    const requestsPerSession = totalSessions > 0 ? totalInteractions / totalSessions : 0;
    
    let dependencyLevel: 'low' | 'moderate' | 'high' = 'low';
    const indicators = [];
    
    if (requestsPerSession > 3) {
      dependencyLevel = 'high';
      indicators.push('Very frequent AI assistance requests');
    } else if (requestsPerSession > 1.5) {
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
  
  private static async calculateClassAIOverview(assignments: any[]): Promise<any> {
    // Mock implementation for class overview
    return {
      totalStudents: 25,
      aiActiveStudents: 20,
      averageUsageRate: 0.6,
      mostRequestedAssistance: 'grammar_check' as AIAssistanceType
    };
  }
  
  private static async identifyStudentConcerns(assignments: any[]): Promise<any[]> {
    // Mock implementation for student concerns
    return [];
  }
  
  private static async generateBoundaryRecommendations(assignments: any[]): Promise<any[]> {
    // Mock implementation for boundary recommendations
    return [];
  }
  
  private static getSkillForStage(stage: string): string {
    const stageSkills = {
      planning: 'idea generation and organization',
      writing: 'expression and development',
      revision: 'critical analysis and refinement'
    };
    
    return stageSkills[stage as keyof typeof stageSkills] || 'writing';
  }
  
  private static getStageAlternatives(stage: string): string[] {
    const alternatives = {
      planning: ['Use brainstorming techniques', 'Create an outline', 'Discuss ideas with peers'],
      writing: ['Focus on getting ideas down first', 'Use assignment rubric as guide', 'Take breaks and return with fresh perspective'],
      revision: ['Read work aloud', 'Use peer review', 'Focus on one element at a time']
    };
    
    return alternatives[stage as keyof typeof alternatives] || ['Ask instructor for guidance'];
  }
  
  private static getBoundaryRationale(boundary: AIBoundaryLevel): string {
    const rationales = {
      strict: 'This assignment focuses on developing independent writing skills with minimal AI assistance',
      moderate: 'This assignment balances AI assistance with independent skill development',
      permissive: 'This assignment allows comprehensive AI support while maintaining educational focus'
    };
    
    return rationales[boundary];
  }
  
  private static getBoundaryAlternatives(boundary: AIBoundaryLevel): string[] {
    const alternatives = {
      strict: ['Use assignment resources', 'Review course materials', 'Ask instructor questions'],
      moderate: ['Try independent revision first', 'Use peer feedback', 'Focus on structural improvements'],
      permissive: ['Consider which type of assistance would be most helpful']
    };
    
    return alternatives[boundary];
  }
}