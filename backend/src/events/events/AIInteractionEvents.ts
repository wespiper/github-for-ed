import { Event } from '../EventBus';

/**
 * Event fired when a student interacts with AI assistance
 */
export interface AIInteractionLoggedEvent extends Event {
  type: 'ai.interaction.logged';
  payload: {
    studentId: string;
    courseId: string;
    assignmentId?: string;
    interactionType: 'question' | 'feedback_request' | 'suggestion' | 'clarification' | 'boundary_check';
    aiService: 'educational_assistant' | 'writing_analyzer' | 'reflection_analyzer' | 'boundary_intelligence';
    request: {
      content: string;
      context?: Record<string, any>;
    };
    response: {
      content: string;
      wasBlocked?: boolean;
      boundaryType?: string;
      educationalValue?: number;
    };
    duration: number;
    bloomsLevel?: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  };
}

/**
 * Event fired when AI detects potential academic integrity issue
 */
export interface AIIntegrityCheckEvent extends Event {
  type: 'ai.integrity.check';
  payload: {
    studentId: string;
    courseId: string;
    assignmentId: string;
    checkType: 'authenticity' | 'external_ai_use' | 'plagiarism' | 'excessive_assistance';
    confidence: number;
    details: {
      indicators: string[];
      patterns: Record<string, any>;
      recommendation: 'flag' | 'review' | 'clear';
    };
  };
}

/**
 * Event fired when AI boundary is enforced
 */
export interface AIBoundaryEnforcedEvent extends Event {
  type: 'ai.boundary.enforced';
  payload: {
    studentId: string;
    courseId: string;
    assignmentId?: string;
    boundaryType: 'cognitive_load' | 'assignment_scope' | 'learning_objective' | 'independence_level';
    requestedAction: string;
    deniedReason: string;
    educationalRationale: string;
    alternativeSuggestions?: string[];
  };
}