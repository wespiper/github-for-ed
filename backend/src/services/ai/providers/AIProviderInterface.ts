import { WritingStage, AIEducationalAction } from '../../AIBoundaryService';

export interface EducationalContext {
  studentId: string;
  assignmentId: string;
  writingStage: WritingStage;
  contentSample: string;
  specificQuestion: string;
  learningObjective: string;
  academicLevel: 'novice' | 'developing' | 'proficient' | 'advanced';
}

export interface EducationalQuestion {
  id: string;
  type: 'clarifying' | 'expanding' | 'challenging' | 'perspective' | 'reflection';
  question: string;
  educationalRationale: string;
  expectedOutcome: string;
  followUpPrompts: string[];
}

export interface EducationalQuestionSet {
  requestId: string;
  action: AIEducationalAction;
  questions: EducationalQuestion[];
  overallEducationalGoal: string;
  reflectionPrompt: string;
  nextStepSuggestions: string[];
}

export interface PerspectiveSuggestion {
  id: string;
  perspective: string;
  description: string;
  questionsToExplore: string[];
  educationalValue: string;
  resourceSuggestions: string[];
}

export interface ValidationResult {
  isEducationallySound: boolean;
  containsAnswers: boolean;
  providesQuestions: boolean;
  alignsWithLearningObjectives: boolean;
  appropriateComplexity: boolean;
  issues: string[];
  suggestions: string[];
}

export interface AIProvider {
  name: string;
  
  /**
   * Generate educational questions based on student context
   */
  generateEducationalQuestions(context: EducationalContext): Promise<EducationalQuestionSet>;
  
  /**
   * Generate alternative perspectives for student to explore
   */
  generatePerspectives(
    topic: string,
    currentArguments: string[],
    context: EducationalContext
  ): Promise<PerspectiveSuggestion[]>;
  
  /**
   * Validate that AI response meets educational standards
   */
  validateEducationalResponse(response: string): Promise<ValidationResult>;
  
  /**
   * Check provider availability and health
   */
  healthCheck(): Promise<boolean>;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface AIProviderResponse {
  content: string;
  tokenUsage: TokenUsage;
  model: string;
  timestamp: Date;
  processingTime: number;
}