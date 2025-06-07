import { Injectable, Logger } from '@nestjs/common';
import { WritingPattern, ReflectionQuality, WritingInsights } from '../types/writing-analysis';

/**
 * Fallback service for writing analysis when MCP server is unavailable
 * Provides basic functionality to maintain core platform operations
 */
@Injectable()
export class WritingAnalysisFallbackService {
  private readonly logger = new Logger(WritingAnalysisFallbackService.name);

  /**
   * Basic writing pattern analysis without MCP
   */
  async analyzeWritingPatterns(params: {
    content: string;
    userId: string;
    options?: {
      includeStructure?: boolean;
      includeSentiment?: boolean;
      includeComplexity?: boolean;
    };
  }): Promise<{
    patterns: WritingPattern;
    privacyMetadata: {
      fallbackMode: boolean;
      limitedAnalysis: boolean;
      mcpUnavailable: boolean;
    };
  }> {
    this.logger.warn('Using fallback writing pattern analysis - MCP unavailable');
    
    const { content, options = {} } = params;
    
    // Basic structural analysis
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    const patterns: WritingPattern = {
      structure: options.includeStructure ? {
        sentenceCount: sentences.length,
        averageSentenceLength: words.length / Math.max(sentences.length, 1),
        paragraphCount: paragraphs.length,
        wordCount: words.length,
        organizationScore: this.calculateBasicOrganization(content),
        transitionWords: this.countTransitionWords(content),
      } : undefined,
      
      sentiment: options.includeSentiment ? {
        overall: 'neutral', // Conservative fallback
        confidence: 0.5, // Low confidence in fallback mode
        emotionalTone: 'analytical',
      } : undefined,
      
      complexity: options.includeComplexity ? {
        readabilityScore: this.calculateBasicReadability(sentences, words),
        vocabularyLevel: this.assessVocabularyLevel(words),
        syntaxComplexity: this.calculateSyntaxComplexity(sentences),
      } : undefined,
      
      // Limited patterns in fallback mode
      temporalPatterns: undefined,
      rhetoricalElements: undefined,
      cohesionMarkers: undefined,
    };

    return {
      patterns,
      privacyMetadata: {
        fallbackMode: true,
        limitedAnalysis: true,
        mcpUnavailable: true,
      },
    };
  }

  /**
   * Basic reflection quality evaluation without MCP
   */
  async evaluateReflectionQuality(params: {
    reflection: string;
    userId: string;
  }): Promise<{
    quality: ReflectionQuality;
    progressiveAccess: {
      currentLevel: 'restricted' | 'basic' | 'standard' | 'enhanced';
      nextLevelRequirements: string[];
    };
    fallbackMode: boolean;
  }> {
    this.logger.warn('Using fallback reflection quality analysis - MCP unavailable');
    
    const { reflection } = params;
    
    // Basic quality heuristics
    const wordCount = reflection.split(/\s+/).length;
    const sentences = reflection.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Simple quality indicators
    const hasBackwardLooking = /\b(learned|realized|discovered|understood|struggled)\b/i.test(reflection);
    const hasForwardLooking = /\b(will|next time|plan|goal|improve)\b/i.test(reflection);
    const hasSelfAwareness = /\b(I|my|myself|realize|think|feel)\b/i.test(reflection);
    
    let overallScore = 0;
    
    // Length check (minimum quality indicator)
    if (wordCount >= 50) overallScore += 25;
    if (wordCount >= 100) overallScore += 15;
    
    // Content quality indicators
    if (hasBackwardLooking) overallScore += 20;
    if (hasForwardLooking) overallScore += 20;
    if (hasSelfAwareness) overallScore += 20;
    
    // Determine access level (conservative in fallback mode)
    let currentLevel: 'restricted' | 'basic' | 'standard' | 'enhanced' = 'restricted';
    if (overallScore >= 60) currentLevel = 'basic';
    if (overallScore >= 80) currentLevel = 'standard';
    // Never grant 'enhanced' in fallback mode for safety
    
    const quality: ReflectionQuality = {
      overall: Math.min(overallScore, 85), // Cap at 85% in fallback mode
      dimensions: {
        depth: hasBackwardLooking ? 70 : 40,
        selfAwareness: hasSelfAwareness ? 70 : 30,
        criticalThinking: (hasBackwardLooking && hasForwardLooking) ? 65 : 35,
        growthMindset: hasForwardLooking ? 70 : 40,
      },
      strengths: [
        ...(hasBackwardLooking ? ['Shows reflection on past learning'] : []),
        ...(hasForwardLooking ? ['Identifies future goals'] : []),
        ...(wordCount >= 100 ? ['Detailed response'] : []),
      ],
      improvements: [
        ...(!hasBackwardLooking ? ['Add more reflection on learning process'] : []),
        ...(!hasForwardLooking ? ['Include specific future goals'] : []),
        'MCP analysis unavailable - limited feedback',
      ],
    };

    return {
      quality,
      progressiveAccess: {
        currentLevel,
        nextLevelRequirements: this.getNextLevelRequirements(currentLevel),
      },
      fallbackMode: true,
    };
  }

  /**
   * Basic content sensitivity classification without MCP
   */
  async classifyContentSensitivity(params: {
    content: string;
    context: {
      contentType: 'essay' | 'reflection' | 'notes' | 'feedback';
      academicLevel: string;
    };
  }): Promise<{
    sensitivityLevel: 'none' | 'low' | 'medium' | 'high';
    sensitivityScore: number;
    sensitiveElements: string[];
    recommendations: string[];
    fallbackMode: boolean;
  }> {
    this.logger.warn('Using fallback content sensitivity classification - MCP unavailable');
    
    const { content } = params;
    
    // Basic PII detection patterns
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
    const namePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
    
    const sensitiveElements: string[] = [];
    let sensitivityScore = 0;
    
    // Check for PII
    if (emailPattern.test(content)) {
      sensitiveElements.push('email_address');
      sensitivityScore += 30;
    }
    
    if (phonePattern.test(content)) {
      sensitiveElements.push('phone_number');
      sensitivityScore += 30;
    }
    
    if (namePattern.test(content)) {
      sensitiveElements.push('personal_name');
      sensitivityScore += 20;
    }
    
    // Basic mental health indicators
    const mentalHealthKeywords = /\b(depression|anxiety|suicide|self-harm|therapy|counseling)\b/i;
    if (mentalHealthKeywords.test(content)) {
      sensitiveElements.push('mental_health_content');
      sensitivityScore += 40;
    }
    
    // Determine sensitivity level
    let sensitivityLevel: 'none' | 'low' | 'medium' | 'high' = 'none';
    if (sensitivityScore >= 20) sensitivityLevel = 'low';
    if (sensitivityScore >= 40) sensitivityLevel = 'medium';
    if (sensitivityScore >= 60) sensitivityLevel = 'high';
    
    return {
      sensitivityLevel,
      sensitivityScore,
      sensitiveElements,
      recommendations: [
        ...(sensitivityScore > 0 ? ['Content contains potentially sensitive information'] : []),
        'Fallback analysis - limited sensitivity detection',
        'Consider manual review for comprehensive privacy assessment',
      ],
      fallbackMode: true,
    };
  }

  /**
   * Basic writing insights generation without MCP
   */
  async generateWritingInsights(params: {
    scope: 'individual' | 'class';
    targetId: string;
    timeframe: 'day' | 'week' | 'month' | 'semester';
  }): Promise<{
    insights: WritingInsights;
    privacyMetadata: {
      fallbackMode: boolean;
      limitedData: boolean;
    };
  }> {
    this.logger.warn('Using fallback writing insights generation - MCP unavailable');
    
    // Basic insights with limited data
    const insights: WritingInsights = {
      keyMetrics: {
        activeStudents: 'N/A (fallback mode)',
        avgReflectionQuality: 'Limited analysis available',
        completionRate: 'Unable to calculate',
        improvementTrend: 'MCP analysis required',
      },
      trends: [],
      recommendations: [
        'MCP service unavailable - using basic analysis',
        'Restore MCP connection for detailed insights',
        'Contact technical support if issue persists',
      ],
      alerts: [
        {
          type: 'system',
          severity: 'warning',
          message: 'Writing analysis running in fallback mode',
          action: 'Restore MCP connection',
        },
      ],
    };

    return {
      insights,
      privacyMetadata: {
        fallbackMode: true,
        limitedData: true,
      },
    };
  }

  // Helper methods for basic analysis

  private calculateBasicOrganization(content: string): number {
    // Simple organization check based on paragraph structure
    const paragraphs = content.split(/\n\s*\n/);
    if (paragraphs.length < 2) return 40;
    if (paragraphs.length >= 3 && paragraphs.length <= 5) return 80;
    return 60;
  }

  private countTransitionWords(content: string): number {
    const transitions = ['however', 'therefore', 'furthermore', 'additionally', 'consequently', 'moreover', 'meanwhile'];
    let count = 0;
    transitions.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) count += matches.length;
    });
    return count;
  }

  private calculateBasicReadability(sentences: string[], words: string[]): number {
    // Simplified Flesch reading ease approximation
    const avgSentenceLength = words.length / Math.max(sentences.length, 1);
    const avgSyllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0) / words.length;
    
    // Simplified formula (not actual Flesch)
    const score = 100 - (avgSentenceLength * 0.5) - (avgSyllables * 10);
    return Math.max(0, Math.min(100, score));
  }

  private countSyllables(word: string): number {
    // Very basic syllable counting
    return Math.max(1, word.toLowerCase().replace(/[^aeiou]/g, '').length);
  }

  private assessVocabularyLevel(words: string[]): 'basic' | 'intermediate' | 'advanced' {
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    if (avgWordLength < 4) return 'basic';
    if (avgWordLength < 6) return 'intermediate';
    return 'advanced';
  }

  private calculateSyntaxComplexity(sentences: string[]): number {
    // Basic complexity based on sentence length variance
    const lengths = sentences.map(s => s.split(/\s+/).length);
    const avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
    
    // Convert to 0-100 scale
    return Math.min(100, (variance + avgLength) * 2);
  }

  private getNextLevelRequirements(currentLevel: string): string[] {
    switch (currentLevel) {
      case 'restricted':
        return [
          'Write a reflection with at least 100 words',
          'Include what you learned from the assignment',
          'Describe specific challenges you faced',
        ];
      case 'basic':
        return [
          'Add more detail about your learning process',
          'Include specific examples from your work',
          'Describe how you will improve next time',
        ];
      case 'standard':
        return [
          'Demonstrate deeper critical thinking',
          'Connect learning to broader concepts',
          'Show evidence of metacognitive awareness',
        ];
      default:
        return ['Continue developing your reflection skills'];
    }
  }
}