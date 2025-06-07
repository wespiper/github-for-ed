import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as natural from 'natural';
import * as CryptoJS from 'crypto-js';

export interface ContentClassificationRequest {
  content: string;
  context?: {
    contentType?: 'essay' | 'reflection' | 'notes' | 'feedback';
    academicLevel?: string;
  };
}

export interface SensitiveElement {
  type: string;
  text: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
}

export interface ContentClassificationResult {
  sensitivityLevel: 'high' | 'medium' | 'low' | 'none';
  sensitivityScore: number;
  sensitiveElements: SensitiveElement[];
  recommendations: string[];
  redactedContent: string;
  classificationTimestamp: Date;
}

@Injectable()
export class ContentClassifierService {
  private readonly logger = new Logger(ContentClassifierService.name);
  private tokenizer: any;
  private sentimentAnalyzer: any;

  // Privacy patterns
  private readonly patterns = {
    personalInfo: {
      names: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,
      emails: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phones: /\b(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})\b/g,
      ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
      addresses: /\b\d{1,5}\s+\w+\s+(Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Court|Ct|Boulevard|Blvd)\b/gi,
    },
    familySituations: {
      keywords: /\b(mother|father|parent|sibling|brother|sister|family|divorce|custody|abuse|trauma)\b/gi,
      patterns: /\b(my (mom|dad|parents?|family)|family (problems?|issues?|situation))\b/gi,
    },
    mentalHealth: {
      keywords: /\b(depression|anxiety|suicide|self-harm|therapy|counseling|medication|mental health|bipolar|ADHD|OCD)\b/gi,
      patterns: /\b(feeling (depressed|anxious|suicidal)|want to (die|hurt myself)|can't cope)\b/gi,
    },
    financialInfo: {
      creditCards: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
      bankAccounts: /\b\d{8,17}\b/g,
      currency: /\$\d+(?:,\d{3})*(?:\.\d{2})?/g,
    },
    medical: {
      keywords: /\b(diagnosis|treatment|medication|doctor|hospital|surgery|illness|disease|condition)\b/gi,
      patterns: /\b(diagnosed with|suffering from|taking medication for)\b/gi,
    },
  };

  // Weight map for sensitive element types
  private readonly elementWeights: Record<string, number> = {
    personal_ssn: 1.0,
    financial_creditCards: 1.0,
    financial_bankAccounts: 0.9,
    mental_health: 0.9,
    emotional_distress: 0.8,
    personal_names: 0.7,
    personal_emails: 0.7,
    personal_phones: 0.7,
    personal_addresses: 0.8,
    family_situation: 0.7,
    medical: 0.8,
  };

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {
    this.tokenizer = new natural.WordTokenizer();
    this.sentimentAnalyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
  }

  async classifyContent(request: ContentClassificationRequest): Promise<ContentClassificationResult> {
    const startTime = Date.now();

    try {
      // Detect sensitive elements
      const sensitiveElements = this.detectSensitiveElements(request.content);
      
      // Calculate sensitivity score
      const sensitivityScore = this.calculateSensitivityScore(sensitiveElements, request.content);
      
      // Determine sensitivity level
      const sensitivityLevel = this.determineSensitivityLevel(sensitivityScore);
      
      // Generate redacted content
      const redactedContent = this.redactContent(request.content, sensitiveElements);
      
      // Generate recommendations based on findings
      const recommendations = this.generateRecommendations(sensitivityLevel, sensitiveElements);

      // Emit classification event
      await this.eventEmitter.emit('content.classified', {
        sensitivityLevel,
        elementCount: sensitiveElements.length,
        contentType: request.context?.contentType,
        timestamp: new Date(),
      });

      const result: ContentClassificationResult = {
        sensitivityLevel,
        sensitivityScore,
        sensitiveElements,
        recommendations,
        redactedContent,
        classificationTimestamp: new Date(),
      };

      // Check performance
      const duration = Date.now() - startTime;
      if (duration > this.configService.get('privacy.performance.maxPrivacyCheckMs')) {
        this.logger.warn(`Content classification took ${duration}ms, exceeding threshold`);
      }

      return result;
    } catch (error) {
      this.logger.error('Error classifying content:', error);
      throw new Error('Failed to classify content sensitivity');
    }
  }

  private detectSensitiveElements(content: string): SensitiveElement[] {
    const elements: SensitiveElement[] = [];

    // Check personal information
    Object.entries(this.patterns.personalInfo).forEach(([type, pattern]) => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match.index !== undefined) {
          elements.push({
            type: `personal_${type}`,
            text: match[0],
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            confidence: 0.9,
          });
        }
      }
    });

    // Check family situations
    const familyMatches = content.matchAll(this.patterns.familySituations.patterns);
    for (const match of familyMatches) {
      if (match.index !== undefined) {
        elements.push({
          type: 'family_situation',
          text: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          confidence: 0.8,
        });
      }
    }

    // Check mental health indicators
    const mentalHealthMatches = content.matchAll(this.patterns.mentalHealth.patterns);
    for (const match of mentalHealthMatches) {
      if (match.index !== undefined) {
        elements.push({
          type: 'mental_health',
          text: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          confidence: 0.95,
        });
      }
    }

    // Check financial information
    Object.entries(this.patterns.financialInfo).forEach(([type, pattern]) => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match.index !== undefined) {
          elements.push({
            type: `financial_${type}`,
            text: match[0],
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            confidence: 0.95,
          });
        }
      }
    });

    // Sentiment analysis for distress signals
    const tokens = this.tokenizer.tokenize(content);
    const sentiment = this.sentimentAnalyzer.getSentiment(tokens);
    
    if (sentiment < -0.5) {
      // Very negative sentiment might indicate distress
      elements.push({
        type: 'emotional_distress',
        text: 'Overall negative sentiment detected',
        startIndex: 0,
        endIndex: content.length,
        confidence: Math.abs(sentiment),
      });
    }

    return elements;
  }

  private calculateSensitivityScore(elements: SensitiveElement[], content: string): number {
    if (elements.length === 0) return 0;

    let totalScore = 0;
    let totalWeight = 0;

    elements.forEach(element => {
      const weight = this.elementWeights[element.type] || 0.5;
      totalScore += element.confidence * weight;
      totalWeight += weight;
    });

    // Normalize score considering content length
    const densityFactor = Math.min(elements.length / (content.length / 100), 1);
    const normalizedScore = (totalScore / Math.max(totalWeight, 1)) * densityFactor;

    return Math.min(normalizedScore, 1);
  }

  private determineSensitivityLevel(score: number): 'high' | 'medium' | 'low' | 'none' {
    const thresholds = this.configService.get('privacy.contentClassification.thresholds');

    if (score >= thresholds.high) return 'high';
    if (score >= thresholds.medium) return 'medium';
    if (score >= thresholds.low) return 'low';
    return 'none';
  }

  private redactContent(content: string, elements: SensitiveElement[]): string {
    if (elements.length === 0) return content;

    // Sort elements by start index in reverse order
    const sortedElements = [...elements].sort((a, b) => b.startIndex - a.startIndex);

    let redacted = content;
    sortedElements.forEach(element => {
      const replacement = '[REDACTED_' + element.type.toUpperCase() + ']';
      redacted = redacted.slice(0, element.startIndex) + replacement + redacted.slice(element.endIndex);
    });

    return redacted;
  }

  private generateRecommendations(level: string, elements: SensitiveElement[]): string[] {
    const recommendations: string[] = [];

    if (level === 'high') {
      recommendations.push('This content contains highly sensitive information and requires strict access controls');
      recommendations.push('Consider using anonymous submission for this type of content');
      recommendations.push('Ensure explicit consent before any analysis or sharing');
    }

    if (level === 'medium') {
      recommendations.push('Apply standard privacy protections to this content');
      recommendations.push('Limit access to authorized educators only');
      recommendations.push('Consider aggregating this data for analytics rather than individual analysis');
    }

    // Type-specific recommendations
    const hasmental_health = elements.some(e => e.type === 'mental_health');
    if (hasmental_health) {
      recommendations.push('Mental health indicators detected - consider alerting appropriate support resources');
      recommendations.push('Ensure counseling services are aware if student consents');
    }

    const hasFinancial = elements.some(e => e.type.startsWith('financial_'));
    if (hasFinancial) {
      recommendations.push('Financial information detected - apply PCI compliance standards');
      recommendations.push('Never store this information in plain text');
    }

    return recommendations;
  }
}