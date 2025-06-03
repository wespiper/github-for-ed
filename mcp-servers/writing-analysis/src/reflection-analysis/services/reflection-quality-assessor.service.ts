import { Injectable, Logger } from '@nestjs/common';
import { ContentClassifierService } from '../../content-privacy/services/content-classifier.service';
import { ReflectionRepository } from '../../repositories/reflection.repository';
import { AuditLoggerService } from '../../content-privacy/services/audit-logger.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface ReflectionQualityRequest {
  reflection: string;
  userId: string;
  role: 'student' | 'educator' | 'administrator';
  purpose: string;
  consent?: boolean;
  assignmentContext?: {
    assignmentId?: string;
    rubric?: any;
  };
}

export interface ReflectionQualityResult {
  quality: {
    overall: number;
    dimensions: {
      depth: number;
      selfAwareness: number;
      criticalThinking: number;
      growthMindset: number;
      specificity: number;
    };
  };
  feedback: string[];
  privacyMetadata: {
    sensitiveContentMasked: boolean;
    anonymizationApplied: boolean;
  };
  progressiveAccess: {
    currentLevel: 'restricted' | 'basic' | 'standard' | 'enhanced';
    nextLevelRequirements: string[];
  };
}

@Injectable()
export class ReflectionQualityAssessorService {
  private readonly logger = new Logger(ReflectionQualityAssessorService.name);

  constructor(
    private contentClassifier: ContentClassifierService,
    private reflectionRepository: ReflectionRepository,
    private auditLogger: AuditLoggerService,
    private eventEmitter: EventEmitter2,
  ) {}

  async evaluateQuality(request: ReflectionQualityRequest): Promise<ReflectionQualityResult> {
    this.logger.log(`Evaluating reflection quality for user ${request.userId}`);

    // Classify content for privacy
    const classification = await this.contentClassifier.classifyContent({
      content: request.reflection,
      context: { contentType: 'reflection' },
    });

    // Mask sensitive content if needed
    const processedReflection = classification.sensitivityLevel === 'high'
      ? classification.redactedContent
      : request.reflection;

    // Evaluate quality dimensions
    const dimensions = this.evaluateQualityDimensions(processedReflection);
    const overall = this.calculateOverallQuality(dimensions);

    // Generate feedback
    const feedback = this.generateFeedback(dimensions, processedReflection);

    // Determine progressive access level
    const progressiveAccess = await this.determineProgressiveAccess(
      request.userId,
      overall
    );

    // Store reflection quality
    await this.reflectionRepository.create({
      userId: request.userId,
      assignmentId: request.assignmentContext?.assignmentId,
      quality: overall,
      dimensions,
      privacyLevel: classification.sensitivityLevel,
    });

    // Log the assessment
    await this.auditLogger.logAccess({
      accessType: 'analyze',
      dataType: 'reflection_quality',
      userId: request.userId,
      accessedBy: request.userId,
      purpose: request.purpose,
      educationalContext: request.assignmentContext,
    });

    // Emit quality assessment event
    await this.eventEmitter.emit('reflection.quality.assessed', {
      userId: request.userId,
      quality: overall,
      progressiveAccessLevel: progressiveAccess.currentLevel,
      timestamp: new Date(),
    });

    return {
      quality: {
        overall,
        dimensions,
      },
      feedback,
      privacyMetadata: {
        sensitiveContentMasked: classification.sensitivityLevel === 'high',
        anonymizationApplied: request.role === 'educator' && !request.consent,
      },
      progressiveAccess,
    };
  }

  private evaluateQualityDimensions(reflection: string): any {
    const words = reflection.split(/\s+/);
    const sentences = reflection.split(/[.!?]+/).filter(s => s.trim().length > 0);

    return {
      depth: this.evaluateDepth(reflection, words.length),
      selfAwareness: this.evaluateSelfAwareness(reflection),
      criticalThinking: this.evaluateCriticalThinking(reflection),
      growthMindset: this.evaluateGrowthMindset(reflection),
      specificity: this.evaluateSpecificity(reflection, sentences),
    };
  }

  private evaluateDepth(text: string, wordCount: number): number {
    let score = 0;

    // Length indicator
    if (wordCount > 200) score += 0.3;
    else if (wordCount > 100) score += 0.2;
    else if (wordCount > 50) score += 0.1;

    // Depth indicators
    const depthPatterns = [
      /because/gi,
      /therefore/gi,
      /however/gi,
      /although/gi,
      /furthermore/gi,
      /consequently/gi,
    ];

    depthPatterns.forEach(pattern => {
      if (pattern.test(text)) score += 0.1;
    });

    // Question exploration
    if (/why|how|what if/gi.test(text)) score += 0.2;

    return Math.min(score, 1);
  }

  private evaluateSelfAwareness(text: string): number {
    let score = 0;

    // First person reflection
    const firstPersonPattern = /\b(I|me|my|myself)\b/gi;
    const firstPersonMatches = text.match(firstPersonPattern) || [];
    if (firstPersonMatches.length > 5) score += 0.3;

    // Self-assessment patterns
    const selfAssessmentPatterns = [
      /I (learned|realized|discovered|understood)/gi,
      /I (struggled|found difficult|was challenged)/gi,
      /my (strength|weakness|improvement)/gi,
      /I (need to|should|could|will)/gi,
    ];

    selfAssessmentPatterns.forEach(pattern => {
      if (pattern.test(text)) score += 0.15;
    });

    // Emotion/feeling expression
    if (/I (felt|feel|was feeling)/gi.test(text)) score += 0.1;

    return Math.min(score, 1);
  }

  private evaluateCriticalThinking(text: string): number {
    let score = 0;

    // Analysis patterns
    const analysisPatterns = [
      /comparing|contrasting/gi,
      /analyzing|analysis/gi,
      /evaluating|evaluation/gi,
      /considering|consideration/gi,
      /perspective|viewpoint/gi,
    ];

    analysisPatterns.forEach(pattern => {
      if (pattern.test(text)) score += 0.15;
    });

    // Evidence-based thinking
    if (/evidence|example|instance|specifically/gi.test(text)) score += 0.2;

    // Counter-arguments or alternatives
    if (/alternatively|on the other hand|another way/gi.test(text)) score += 0.2;

    // Cause and effect
    if (/caused|resulted|led to|impact/gi.test(text)) score += 0.15;

    return Math.min(score, 1);
  }

  private evaluateGrowthMindset(text: string): number {
    let score = 0;

    // Future-oriented patterns
    const growthPatterns = [
      /next time|in the future|going forward/gi,
      /I will|I plan to|I intend to/gi,
      /improve|improvement|better/gi,
      /learn|learning|development/gi,
      /challenge|opportunity|growth/gi,
    ];

    growthPatterns.forEach(pattern => {
      if (pattern.test(text)) score += 0.15;
    });

    // Acknowledging mistakes positively
    if (/mistake.*learn|error.*improve|wrong.*better/gi.test(text)) score += 0.25;

    // Goal setting
    if (/goal|objective|aim|target/gi.test(text)) score += 0.1;

    return Math.min(score, 1);
  }

  private evaluateSpecificity(text: string, sentences: string[]): number {
    let score = 0;

    // Specific examples
    if (/for example|for instance|such as|specifically/gi.test(text)) score += 0.3;

    // Quantitative elements
    if (/\d+|first|second|third|many|few|several/gi.test(text)) score += 0.2;

    // Detailed descriptions (sentences > 15 words)
    const detailedSentences = sentences.filter(s => s.split(/\s+/).length > 15).length;
    score += Math.min(detailedSentences * 0.1, 0.3);

    // Named concepts or specific references
    if (/"[^"]+"|'[^']+'/.test(text)) score += 0.2;

    return Math.min(score, 1);
  }

  private calculateOverallQuality(dimensions: any): number {
    const weights: Record<string, number> = {
      depth: 0.25,
      selfAwareness: 0.2,
      criticalThinking: 0.25,
      growthMindset: 0.15,
      specificity: 0.15,
    };

    let weighted = 0;
    Object.keys(weights).forEach(key => {
      weighted += dimensions[key] * weights[key];
    });

    return Math.round(weighted * 100);
  }

  private generateFeedback(dimensions: any, reflection: string): string[] {
    const feedback: string[] = [];

    if (dimensions.depth < 0.5) {
      feedback.push('Consider exploring your thoughts in more depth. Ask yourself "why" and "how" questions.');
    }

    if (dimensions.selfAwareness < 0.5) {
      feedback.push('Try to include more personal insights about what you learned or how you felt.');
    }

    if (dimensions.criticalThinking < 0.5) {
      feedback.push('Strengthen your analysis by comparing ideas or considering different perspectives.');
    }

    if (dimensions.growthMindset < 0.5) {
      feedback.push('Think about how you can apply what you\'ve learned in the future.');
    }

    if (dimensions.specificity < 0.5) {
      feedback.push('Add specific examples or details to support your reflections.');
    }

    // Positive reinforcement
    const strongestDimension = Object.keys(dimensions).reduce((a, b) => 
      dimensions[a] > dimensions[b] ? a : b
    );
    feedback.push(`Strong ${strongestDimension.replace(/([A-Z])/g, ' $1').toLowerCase()} demonstrated!`);

    return feedback;
  }

  private async determineProgressiveAccess(userId: string, qualityScore: number): Promise<any> {
    // Get historical quality scores
    const history = await this.reflectionRepository.getQualityStats(userId);
    
    let currentLevel: 'restricted' | 'basic' | 'standard' | 'enhanced';
    const nextLevelRequirements: string[] = [];

    if (qualityScore < 60) {
      currentLevel = 'restricted';
      nextLevelRequirements.push('Achieve a reflection quality score of 60 or higher');
      nextLevelRequirements.push('Complete at least 3 reflections');
    } else if (qualityScore < 75) {
      currentLevel = 'basic';
      nextLevelRequirements.push('Achieve a reflection quality score of 75 or higher');
      nextLevelRequirements.push('Maintain consistency across 5 reflections');
    } else if (qualityScore < 90) {
      currentLevel = 'standard';
      nextLevelRequirements.push('Achieve a reflection quality score of 90 or higher');
      nextLevelRequirements.push('Demonstrate improvement trend over 10 reflections');
    } else {
      currentLevel = 'enhanced';
      nextLevelRequirements.push('Maintain excellence - you have full access!');
    }

    return {
      currentLevel,
      nextLevelRequirements,
    };
  }
}