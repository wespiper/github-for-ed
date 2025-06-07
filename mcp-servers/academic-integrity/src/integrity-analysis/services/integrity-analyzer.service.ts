/**
 * Integrity Analyzer Service
 * Comprehensive academic integrity analysis with educational context
 */

import { Injectable } from '@nestjs/common';

interface IntegrityAnalysisRequest {
  studentId: string;
  assignmentId: string;
  submissionData: {
    content: string;
    metadata?: Record<string, any>;
    writingPatterns?: Record<string, any>;
  };
  privacyContext: {
    requesterId: string;
    requesterType: string;
    purpose: string;
    educationalJustification?: string;
    timestamp: Date;
    correlationId: string;
  };
}

interface IntegrityAnalysisResult {
  integrityScore: number;
  analysisType: 'integrity_check';
  flags: string[];
  recommendations: string[];
  educationalValue: number;
  confidence: number;
  result: {
    integrityScore: number;
    consistencyAnalysis: any;
    contentMetrics: {
      wordCount: number;
      sentenceCount: number;
      vocabularyComplexity: number;
      styleMetrics: Record<string, any>;
    };
    comparisonResults: {
      historicalConsistency: number;
      peerComparison: string;
      flaggedPatterns: string[];
    };
  };
  processingTime: number;
}

@Injectable()
export class IntegrityAnalyzerService {

  /**
   * Analyze academic integrity comprehensively
   */
  async analyzeIntegrity(request: IntegrityAnalysisRequest): Promise<IntegrityAnalysisResult> {
    const startTime = Date.now();
    
    try {
      // Extract content and metadata
      const { content, metadata, writingPatterns } = request.submissionData;
      
      // Perform comprehensive analysis
      const contentMetrics = this.analyzeContentMetrics(content);
      const consistencyAnalysis = await this.analyzeWritingConsistency(content, writingPatterns);
      const integrityPatterns = this.detectIntegrityPatterns(content, contentMetrics);
      
      // Calculate overall integrity score
      const integrityScore = this.calculateIntegrityScore(
        contentMetrics,
        consistencyAnalysis,
        integrityPatterns
      );
      
      // Generate flags and recommendations
      const flags = this.generateIntegrityFlags(integrityScore, integrityPatterns, contentMetrics);
      const recommendations = this.generateIntegrityRecommendations(flags, integrityScore, integrityPatterns);
      
      // Calculate confidence and educational value
      const confidence = this.calculateAnalysisConfidence(integrityPatterns, contentMetrics);
      const educationalValue = this.calculateEducationalValue(integrityScore, flags);
      
      const processingTime = Date.now() - startTime;

      return {
        integrityScore,
        analysisType: 'integrity_check',
        flags,
        recommendations,
        educationalValue,
        confidence,
        result: {
          integrityScore,
          consistencyAnalysis,
          contentMetrics,
          comparisonResults: {
            historicalConsistency: consistencyAnalysis.consistencyScore,
            peerComparison: 'privacy-protected', // Would be actual comparison in production
            flaggedPatterns: integrityPatterns
          }
        },
        processingTime
      };

    } catch (error) {
      console.error('Integrity analysis failed:', error);
      throw new Error(`Integrity analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze content metrics for integrity assessment
   */
  private analyzeContentMetrics(content: string): {
    wordCount: number;
    sentenceCount: number;
    vocabularyComplexity: number;
    styleMetrics: Record<string, any>;
  } {
    
    const words = content.trim().split(/\s+/);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Calculate vocabulary complexity
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const vocabularyComplexity = uniqueWords.size / words.length;
    
    // Analyze style metrics
    const styleMetrics = this.calculateStyleMetrics(content, words, sentences);
    
    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      vocabularyComplexity,
      styleMetrics
    };
  }

  /**
   * Calculate style metrics for consistency analysis
   */
  private calculateStyleMetrics(content: string, words: string[], sentences: string[]): Record<string, any> {
    
    // Average sentence length
    const avgSentenceLength = words.length / sentences.length;
    
    // Sentence length variation
    const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
    const sentenceLengthVariance = this.calculateVariance(sentenceLengths);
    
    // Punctuation patterns
    const punctuationCount = (content.match(/[,.;:]/g) || []).length;
    const punctuationDensity = punctuationCount / words.length;
    
    // Paragraph structure
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const avgParagraphLength = words.length / paragraphs.length;
    
    // Reading complexity (simplified Flesch score approximation)
    const avgWordsPerSentence = avgSentenceLength;
    const avgSyllablesPerWord = this.estimateAvgSyllables(words);
    const readingComplexity = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    
    return {
      avgSentenceLength,
      sentenceLengthVariance,
      punctuationDensity,
      avgParagraphLength,
      readingComplexity,
      formality: this.calculateFormality(content),
      coherence: this.calculateCoherence(sentences)
    };
  }

  /**
   * Analyze writing consistency for integrity assessment
   */
  private async analyzeWritingConsistency(content: string, writingPatterns?: Record<string, any>): Promise<{
    consistencyScore: number;
    anomalies: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
    recommendations: string[];
  }> {
    
    const anomalies: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }> = [];
    
    // Analyze style consistency within the document
    const internalConsistency = this.analyzeInternalConsistency(content);
    
    // Check for sudden style changes
    if (internalConsistency.styleVariation > 0.7) {
      anomalies.push({
        type: 'style_variation',
        severity: 'medium',
        description: 'Significant style variation detected within the document'
      });
    }
    
    // Check for complexity inconsistencies
    if (internalConsistency.complexityVariation > 0.6) {
      anomalies.push({
        type: 'complexity_variation',
        severity: 'medium',
        description: 'Inconsistent complexity levels throughout the document'
      });
    }
    
    // Calculate overall consistency score
    const consistencyScore = Math.max(0, 1 - (anomalies.length * 0.2));
    
    const recommendations = this.generateConsistencyRecommendations(anomalies, consistencyScore);
    
    return {
      consistencyScore,
      anomalies,
      recommendations
    };
  }

  /**
   * Detect integrity-related patterns
   */
  private detectIntegrityPatterns(content: string, contentMetrics: any): string[] {
    const patterns: string[] = [];
    
    // Unusual perfection indicators
    if (contentMetrics.styleMetrics.sentenceLengthVariance < 5 && contentMetrics.wordCount > 500) {
      patterns.push('unusually-consistent-style');
    }
    
    // Overly complex vocabulary for typical student level
    if (contentMetrics.vocabularyComplexity > 0.8) {
      patterns.push('high-vocabulary-complexity');
    }
    
    // Perfect grammar (unusual for student work)
    const grammarErrors = this.detectBasicGrammarErrors(content);
    if (grammarErrors.length === 0 && contentMetrics.wordCount > 300) {
      patterns.push('perfect-grammar');
    }
    
    // Formal language overuse
    if (contentMetrics.styleMetrics.formality > 0.8) {
      patterns.push('overly-formal-language');
    }
    
    // Lack of personal voice or examples
    const personalElements = this.detectPersonalElements(content);
    if (personalElements.score < 0.3 && contentMetrics.wordCount > 400) {
      patterns.push('lack-personal-voice');
    }
    
    // Generic or templated content
    const genericScore = this.detectGenericContent(content);
    if (genericScore > 0.7) {
      patterns.push('generic-content');
    }
    
    // Inconsistent knowledge level
    const knowledgeConsistency = this.analyzeKnowledgeConsistency(content);
    if (knowledgeConsistency < 0.6) {
      patterns.push('inconsistent-knowledge-level');
    }
    
    return patterns;
  }

  /**
   * Calculate overall integrity score
   */
  private calculateIntegrityScore(
    contentMetrics: any,
    consistencyAnalysis: any,
    integrityPatterns: string[]
  ): number {
    
    let score = 1.0; // Start with perfect integrity
    
    // Deduct points for integrity concerns
    const patternDeductions = {
      'unusually-consistent-style': 0.15,
      'high-vocabulary-complexity': 0.1,
      'perfect-grammar': 0.2,
      'overly-formal-language': 0.1,
      'lack-personal-voice': 0.15,
      'generic-content': 0.2,
      'inconsistent-knowledge-level': 0.25
    };
    
    integrityPatterns.forEach(pattern => {
      score -= patternDeductions[pattern] || 0.1;
    });
    
    // Factor in consistency analysis
    score *= consistencyAnalysis.consistencyScore;
    
    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Generate integrity flags based on analysis
   */
  private generateIntegrityFlags(
    integrityScore: number,
    integrityPatterns: string[],
    contentMetrics: any
  ): string[] {
    
    const flags: string[] = [];
    
    if (integrityScore < 0.6) {
      flags.push('low-integrity-score');
    }
    
    if (integrityScore < 0.4) {
      flags.push('critical-integrity-concern');
    }
    
    if (integrityPatterns.includes('perfect-grammar') && 
        integrityPatterns.includes('overly-formal-language')) {
      flags.push('potential-ai-generation');
    }
    
    if (integrityPatterns.includes('lack-personal-voice') && 
        integrityPatterns.includes('generic-content')) {
      flags.push('templated-content-concern');
    }
    
    if (contentMetrics.wordCount < 100) {
      flags.push('insufficient-content');
    }
    
    if (integrityPatterns.length > 4) {
      flags.push('multiple-integrity-concerns');
    }
    
    return flags;
  }

  /**
   * Generate integrity recommendations
   */
  private generateIntegrityRecommendations(
    flags: string[],
    integrityScore: number,
    integrityPatterns: string[]
  ): string[] {
    
    const recommendations: string[] = [];
    
    if (flags.includes('critical-integrity-concern')) {
      recommendations.push('Immediate review required - discuss with instructor');
      recommendations.push('Review academic integrity policies and guidelines');
    }
    
    if (flags.includes('low-integrity-score')) {
      recommendations.push('Consider rewriting sections with more personal voice');
      recommendations.push('Add specific examples from your own experience or research');
    }
    
    if (flags.includes('potential-ai-generation')) {
      recommendations.push('If AI was used, ensure it follows institutional guidelines');
      recommendations.push('Demonstrate understanding by explaining key concepts in your own words');
    }
    
    if (flags.includes('templated-content-concern')) {
      recommendations.push('Develop more original analysis and insights');
      recommendations.push('Move beyond generic statements to specific arguments');
    }
    
    if (integrityPatterns.includes('lack-personal-voice')) {
      recommendations.push('Include more personal insights and examples');
      recommendations.push('Develop your unique analytical perspective');
    }
    
    if (integrityScore > 0.8) {
      recommendations.push('Excellent demonstration of academic integrity');
      recommendations.push('Continue developing your original thinking and writing');
    }
    
    return recommendations.length > 0 ? recommendations : ['Continue current academic practices'];
  }

  /**
   * Calculate analysis confidence
   */
  private calculateAnalysisConfidence(integrityPatterns: string[], contentMetrics: any): number {
    let confidence = 0.7; // Base confidence
    
    // Multiple patterns increase confidence
    if (integrityPatterns.length > 3) confidence += 0.1;
    if (integrityPatterns.length > 5) confidence += 0.1;
    
    // Content length affects confidence
    if (contentMetrics.wordCount > 500) confidence += 0.05;
    if (contentMetrics.wordCount > 1000) confidence += 0.05;
    
    // Strong indicators increase confidence
    if (integrityPatterns.includes('perfect-grammar')) confidence += 0.1;
    if (integrityPatterns.includes('inconsistent-knowledge-level')) confidence += 0.15;
    
    return Math.min(0.95, confidence);
  }

  /**
   * Calculate educational value of the analysis
   */
  private calculateEducationalValue(integrityScore: number, flags: string[]): number {
    // Educational value decreases with integrity concerns
    let value = integrityScore;
    
    // Severe concerns have lower educational value
    if (flags.includes('critical-integrity-concern')) value *= 0.3;
    else if (flags.includes('low-integrity-score')) value *= 0.6;
    
    return Math.max(0.1, value); // Minimum educational value for learning opportunity
  }

  // Helper methods for analysis
  
  private analyzeInternalConsistency(content: string): {
    styleVariation: number;
    complexityVariation: number;
  } {
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    if (paragraphs.length < 2) {
      return { styleVariation: 0, complexityVariation: 0 };
    }
    
    const paragraphMetrics = paragraphs.map(p => {
      const words = p.split(/\s+/);
      const sentences = p.split(/[.!?]+/).filter(s => s.trim().length > 0);
      return {
        avgSentenceLength: words.length / Math.max(1, sentences.length),
        complexity: this.estimateAvgSyllables(words)
      };
    });
    
    const avgSentenceLengths = paragraphMetrics.map(m => m.avgSentenceLength);
    const complexities = paragraphMetrics.map(m => m.complexity);
    
    return {
      styleVariation: this.calculateVariance(avgSentenceLengths) / 100, // Normalize
      complexityVariation: this.calculateVariance(complexities)
    };
  }

  private detectBasicGrammarErrors(content: string): string[] {
    const errors: string[] = [];
    
    // Basic checks (in production, use proper grammar checking library)
    if (content.includes(' i ') && !content.includes(' I ')) {
      errors.push('capitalization');
    }
    
    if (content.includes('  ')) {
      errors.push('spacing');
    }
    
    if (content.includes('it\'s') && content.includes('academic')) {
      // Basic possessive vs contraction check
      errors.push('possessive-contraction');
    }
    
    return errors;
  }

  private detectPersonalElements(content: string): { score: number; elements: string[] } {
    const personalIndicators = [
      /\bi\s+believe/gi, /\bi\s+think/gi, /\bmy\s+experience/gi,
      /\bin\s+my\s+opinion/gi, /\bi\s+have\s+seen/gi, /\bi\s+feel/gi,
      /\bpersonally/gi, /\bfrom\s+my\s+perspective/gi
    ];
    
    const elements: string[] = [];
    let score = 0;
    
    personalIndicators.forEach(indicator => {
      const matches = content.match(indicator);
      if (matches) {
        elements.push(indicator.source);
        score += matches.length * 0.1;
      }
    });
    
    return { score: Math.min(1, score), elements };
  }

  private detectGenericContent(content: string): number {
    const genericPhrases = [
      'in today\'s society', 'throughout history', 'since the dawn of time',
      'many people believe', 'it is widely known', 'everyone knows',
      'in conclusion', 'to summarize', 'as we can see'
    ];
    
    const contentLower = content.toLowerCase();
    const genericCount = genericPhrases.filter(phrase => contentLower.includes(phrase)).length;
    
    return Math.min(1, genericCount / 5); // Normalize to 0-1 scale
  }

  private analyzeKnowledgeConsistency(content: string): number {
    // Simplified analysis - in production, use more sophisticated NLP
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Check for knowledge level indicators
    const basicIndicators = ['simple', 'easy', 'basic', 'fundamental'];
    const advancedIndicators = ['complex', 'sophisticated', 'nuanced', 'multifaceted'];
    
    let basicCount = 0;
    let advancedCount = 0;
    
    sentences.forEach(sentence => {
      const sentenceLower = sentence.toLowerCase();
      basicIndicators.forEach(indicator => {
        if (sentenceLower.includes(indicator)) basicCount++;
      });
      advancedIndicators.forEach(indicator => {
        if (sentenceLower.includes(indicator)) advancedCount++;
      });
    });
    
    // Consistency is higher when knowledge level indicators are balanced
    if (basicCount === 0 && advancedCount === 0) return 0.8; // Neutral
    
    const total = basicCount + advancedCount;
    const ratio = Math.abs(basicCount - advancedCount) / total;
    
    return 1 - ratio; // Higher consistency = lower ratio
  }

  private calculateFormality(content: string): number {
    const formalIndicators = [
      'furthermore', 'moreover', 'consequently', 'nevertheless',
      'notwithstanding', 'henceforth', 'heretofore', 'wherein'
    ];
    
    const contentLower = content.toLowerCase();
    const formalCount = formalIndicators.filter(indicator => contentLower.includes(indicator)).length;
    const words = content.split(/\s+/).length;
    
    return Math.min(1, (formalCount / words) * 100); // Normalize
  }

  private calculateCoherence(sentences: string[]): number {
    if (sentences.length < 2) return 0.5;
    
    // Simple coherence measure based on transition words
    const transitions = [
      'however', 'therefore', 'furthermore', 'moreover', 'additionally',
      'consequently', 'nevertheless', 'meanwhile', 'subsequently'
    ];
    
    let transitionCount = 0;
    sentences.forEach(sentence => {
      const sentenceLower = sentence.toLowerCase();
      transitions.forEach(transition => {
        if (sentenceLower.includes(transition)) transitionCount++;
      });
    });
    
    return Math.min(1, transitionCount / sentences.length);
  }

  private generateConsistencyRecommendations(anomalies: any[], consistencyScore: number): string[] {
    const recommendations: string[] = [];
    
    if (consistencyScore < 0.6) {
      recommendations.push('Work on maintaining consistent writing style throughout');
    }
    
    anomalies.forEach(anomaly => {
      switch (anomaly.type) {
        case 'style_variation':
          recommendations.push('Maintain consistent sentence structure and tone');
          break;
        case 'complexity_variation':
          recommendations.push('Keep vocabulary and complexity level consistent');
          break;
      }
    });
    
    if (recommendations.length === 0) {
      recommendations.push('Writing style is appropriately consistent');
    }
    
    return recommendations;
  }

  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const variance = numbers.reduce((acc, num) => acc + Math.pow(num - mean, 2), 0) / numbers.length;
    
    return variance;
  }

  private estimateAvgSyllables(words: string[]): number {
    // Simple syllable estimation
    const totalSyllables = words.reduce((count, word) => {
      const syllableCount = word.toLowerCase().replace(/[^a-z]/g, '').replace(/[aeiou]{2,}/g, 'a').replace(/[^aeiou]/g, '').length;
      return count + Math.max(1, syllableCount);
    }, 0);
    
    return totalSyllables / words.length;
  }
}