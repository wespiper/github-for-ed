import { Injectable, Logger } from '@nestjs/common';
import { ContentClassifierService } from '../../content-privacy/services/content-classifier.service';
import { AuditLoggerService } from '../../content-privacy/services/audit-logger.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as natural from 'natural';

export interface WritingPatternRequest {
  content: string;
  userId: string;
  role: 'student' | 'educator' | 'administrator';
  purpose: string;
  consent?: boolean;
  options?: {
    includeStructure?: boolean;
    includeSentiment?: boolean;
    includeComplexity?: boolean;
  };
}

export interface WritingPatternResult {
  patterns: {
    structure: any;
    sentiment: any;
    complexity: any;
    style: any;
  };
  privacyMetadata: {
    contentRedacted: boolean;
    sensitiveElementsRemoved: number;
    analysisScope: 'full' | 'limited';
  };
  timestamp: Date;
}

@Injectable()
export class WritingPatternAnalyzerService {
  private readonly logger = new Logger(WritingPatternAnalyzerService.name);
  private tokenizer: any;
  private sentimentAnalyzer: any;

  constructor(
    private contentClassifier: ContentClassifierService,
    private auditLogger: AuditLoggerService,
    private eventEmitter: EventEmitter2,
  ) {
    this.tokenizer = new natural.WordTokenizer();
    this.sentimentAnalyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
  }

  async analyzePatterns(request: WritingPatternRequest): Promise<WritingPatternResult> {
    this.logger.log(`Analyzing writing patterns for user ${request.userId}`);

    // First, classify content for privacy
    const classification = await this.contentClassifier.classifyContent({
      content: request.content,
      context: { contentType: 'essay' },
    });

    // Apply privacy preprocessing
    const processedContent = classification.sensitivityLevel === 'high' 
      ? classification.redactedContent 
      : request.content;

    // Analyze patterns
    const patterns = {
      structure: request.options?.includeStructure 
        ? this.analyzeStructure(processedContent) 
        : null,
      sentiment: request.options?.includeSentiment 
        ? this.analyzeSentiment(processedContent) 
        : null,
      complexity: request.options?.includeComplexity 
        ? this.analyzeComplexity(processedContent) 
        : null,
      style: this.analyzeStyle(processedContent),
    };

    // Log the analysis
    await this.auditLogger.logAccess({
      accessType: 'analyze',
      dataType: 'writing_patterns',
      userId: request.userId,
      accessedBy: request.userId,
      purpose: request.purpose,
      educationalContext: {},
    });

    // Emit event
    await this.eventEmitter.emit('writing.analyzed', {
      userId: request.userId,
      sensitivityLevel: classification.sensitivityLevel,
      patternsDetected: Object.keys(patterns).filter(k => (patterns as any)[k] !== null),
    });

    return {
      patterns,
      privacyMetadata: {
        contentRedacted: classification.sensitivityLevel === 'high',
        sensitiveElementsRemoved: classification.sensitiveElements.length,
        analysisScope: classification.sensitivityLevel === 'high' ? 'limited' : 'full',
      },
      timestamp: new Date(),
    };
  }

  private analyzeStructure(content: string): any {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
    const words = this.tokenizer.tokenize(content);

    return {
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      averageSentenceLength: words.length / Math.max(sentences.length, 1),
      paragraphLengths: paragraphs.map(p => this.tokenizer.tokenize(p).length),
    };
  }

  private analyzeSentiment(content: string): any {
    const tokens = this.tokenizer.tokenize(content);
    const sentiment = this.sentimentAnalyzer.getSentiment(tokens);

    return {
      overallSentiment: sentiment,
      sentimentLabel: sentiment > 0.1 ? 'positive' : sentiment < -0.1 ? 'negative' : 'neutral',
      confidence: Math.abs(sentiment),
    };
  }

  private analyzeComplexity(content: string): any {
    const words = this.tokenizer.tokenize(content);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Simple complexity metrics
    const avgWordLength = words.reduce((sum: number, word: string) => sum + word.length, 0) / words.length;
    const longWords = words.filter((word: string) => word.length > 6).length;
    const complexityScore = (avgWordLength * 0.5) + (longWords / words.length * 0.5);

    return {
      averageWordLength: avgWordLength,
      longWordPercentage: (longWords / words.length) * 100,
      complexityScore,
      readabilityLevel: complexityScore > 0.7 ? 'advanced' : complexityScore > 0.5 ? 'intermediate' : 'basic',
    };
  }

  private analyzeStyle(content: string): any {
    const words = this.tokenizer.tokenize(content.toLowerCase());
    const uniqueWords = new Set(words);
    
    // Style indicators
    const firstPersonPronouns = words.filter((w: string) => ['i', 'me', 'my', 'myself'].includes(w)).length;
    const secondPersonPronouns = words.filter((w: string) => ['you', 'your', 'yourself'].includes(w)).length;
    const academicTransitions = words.filter((w: string) => ['however', 'therefore', 'moreover', 'furthermore'].includes(w)).length;

    return {
      vocabularyDiversity: uniqueWords.size / words.length,
      firstPersonUsage: (firstPersonPronouns / words.length) * 100,
      secondPersonUsage: (secondPersonPronouns / words.length) * 100,
      academicTone: (academicTransitions / words.length) * 100,
      writingStyle: firstPersonPronouns > words.length * 0.05 ? 'personal' : 'formal',
    };
  }
}