import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface AIBoundaryRequest {
  request: {
    prompt: string;
    context: string;
    requestType: 'assistance' | 'feedback' | 'explanation' | 'answer';
  };
  studentContext: {
    assignmentType: string;
    reflectionCompleted: boolean;
    progressLevel: number;
  };
}

export interface AIBoundaryResult {
  allowed: boolean;
  modifiedRequest?: {
    prompt: string;
    context: string;
  };
  reason?: string;
  suggestions: string[];
  boundariesApplied: string[];
}

@Injectable()
export class AIBoundaryEnforcerService {
  private readonly logger = new Logger(AIBoundaryEnforcerService.name);

  // Patterns that indicate direct answer seeking
  private readonly answerPatterns = [
    /what is the answer/i,
    /give me the solution/i,
    /solve this for me/i,
    /write this for me/i,
    /complete my assignment/i,
    /do my homework/i,
    /tell me exactly what to write/i,
  ];

  // Educational value patterns
  private readonly educationalPatterns = [
    /how (can|do) I/i,
    /explain/i,
    /help me understand/i,
    /what does .* mean/i,
    /why is/i,
    /can you clarify/i,
    /guide me/i,
  ];

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  async enforceBoundaries(request: AIBoundaryRequest): Promise<AIBoundaryResult> {
    const boundaries: string[] = [];
    let allowed = true;
    let reason = '';
    const suggestions: string[] = [];

    // Check if reflection is required first
    if (!request.studentContext.reflectionCompleted && request.request.requestType === 'answer') {
      allowed = false;
      reason = 'Reflection must be completed before receiving direct assistance';
      suggestions.push('Complete your reflection on the assignment first');
      boundaries.push('reflection_requirement');
    }

    // Check for direct answer requests
    if (this.isDirectAnswerRequest(request.request.prompt)) {
      if (this.configService.get('privacy.aiBoundaries.blockDirectAnswers')) {
        allowed = false;
        reason = 'Direct answer requests are not allowed';
        suggestions.push('Try asking for guidance on how to approach the problem');
        suggestions.push('Request feedback on your current work instead');
        boundaries.push('no_direct_answers');
      }
    }

    // Check educational value
    if (!this.hasEducationalValue(request.request.prompt)) {
      allowed = false;
      reason = 'Request lacks clear educational purpose';
      suggestions.push('Be more specific about what you want to learn');
      suggestions.push('Explain what you\'ve already tried');
      boundaries.push('educational_value_required');
    }

    // Apply progressive access based on progress level
    const accessLevel = this.determineAccessLevel(request.studentContext);
    if (accessLevel === 'restricted' && request.request.requestType !== 'explanation') {
      allowed = false;
      reason = 'Your current progress level only allows explanatory help';
      suggestions.push('Focus on understanding concepts first');
      boundaries.push('progressive_access');
    }

    // Scrub sensitive content from context if needed
    const modifiedRequest = allowed ? this.scrubSensitiveContent(request.request) : undefined;

    // Log boundary enforcement
    await this.eventEmitter.emit('ai.boundary.enforced', {
      allowed,
      boundaries,
      requestType: request.request.requestType,
      studentProgress: request.studentContext.progressLevel,
      timestamp: new Date(),
    });

    return {
      allowed,
      modifiedRequest,
      reason,
      suggestions,
      boundariesApplied: boundaries,
    };
  }

  private isDirectAnswerRequest(prompt: string): boolean {
    return this.answerPatterns.some(pattern => pattern.test(prompt));
  }

  private hasEducationalValue(prompt: string): boolean {
    // Check if it contains educational patterns
    const hasEducationalPattern = this.educationalPatterns.some(pattern => pattern.test(prompt));
    
    // Check minimum length for substantive request
    const hasSubstance = prompt.split(' ').length > 5;
    
    // Check if it's not just a statement
    const isQuestion = prompt.includes('?') || hasEducationalPattern;

    return hasEducationalPattern || (hasSubstance && isQuestion);
  }

  private determineAccessLevel(context: any): 'restricted' | 'basic' | 'standard' | 'enhanced' {
    const { progressLevel, reflectionCompleted } = context;

    if (!reflectionCompleted) return 'restricted';
    if (progressLevel < 0.3) return 'basic';
    if (progressLevel < 0.7) return 'standard';
    return 'enhanced';
  }

  private scrubSensitiveContent(request: any): any {
    // Create a copy to avoid mutation
    const modified = { ...request };

    // Limit context length
    const maxLength = this.configService.get('privacy.aiBoundaries.maxContextLength');
    if (modified.context && modified.context.length > maxLength) {
      modified.context = modified.context.substring(0, maxLength) + '... [truncated for privacy]';
    }

    // Remove potential PII patterns (simplified)
    modified.prompt = modified.prompt.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME]');
    modified.context = modified.context?.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME]');

    return modified;
  }
}