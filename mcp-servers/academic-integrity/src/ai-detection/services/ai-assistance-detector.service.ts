/**
 * AI Assistance Detector Service
 * Detects levels of AI assistance in student work with educational context
 */

import { Injectable } from '@nestjs/common';

interface AIDetectionRequest {
  studentId: string;
  assignmentId: string;
  content: string;
  privacyContext: {
    requesterId: string;
    requesterType: string;
    purpose: string;
    educationalJustification?: string;
    timestamp: Date;
    correlationId: string;
  };
}

interface AIDetectionResult {
  assistanceLevel: 'none' | 'minimal' | 'moderate' | 'significant' | 'generated';
  confidence: number;
  patterns: string[];
  educationalContext: Record<string, any>;
  recommendations: string[];
  processingTime: number;
}

@Injectable()
export class AIAssistanceDetectorService {

  /**
   * Detect AI assistance levels in student work
   */
  async detectAssistanceLevels(request: AIDetectionRequest): Promise<AIDetectionResult> {
    const startTime = Date.now();
    
    try {
      // Analyze content patterns
      const patterns = await this.analyzeContentPatterns(request.content);
      
      // Determine assistance level
      const assistanceLevel = this.determineAssistanceLevel(patterns, request.content);
      
      // Calculate confidence score
      const confidence = this.calculateConfidence(patterns, request.content, assistanceLevel);
      
      // Generate educational recommendations
      const recommendations = this.generateRecommendations(assistanceLevel, confidence, patterns);
      
      // Build educational context
      const educationalContext = this.buildEducationalContext(
        request, 
        assistanceLevel, 
        patterns
      );

      const processingTime = Date.now() - startTime;

      return {
        assistanceLevel,
        confidence,
        patterns,
        educationalContext,
        recommendations,
        processingTime
      };

    } catch (error) {
      console.error('AI assistance detection failed:', error);
      throw new Error(`AI assistance detection failed: ${error.message}`);
    }
  }

  /**
   * Analyze content for AI-generated patterns
   */
  private async analyzeContentPatterns(content: string): Promise<string[]> {
    const patterns: string[] = [];
    
    // Text length and complexity analysis
    if (content.length > 2000) {
      patterns.push('extensive-content');
    }
    
    // Sentence structure analysis
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 15) {
      patterns.push('complex-structure');
    }
    
    // Vocabulary complexity
    const words = content.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const vocabularyDiversity = uniqueWords.size / words.length;
    
    if (vocabularyDiversity > 0.7) {
      patterns.push('high-vocabulary-diversity');
    }
    
    // AI self-reference detection
    const aiReferences = [
      'as an ai', 'artificial intelligence', 'language model',
      'i am claude', 'as chatgpt', 'i cannot', 'i am not able',
      'as an artificial', 'machine learning', 'neural network'
    ];
    
    const contentLower = content.toLowerCase();
    const hasAIReferences = aiReferences.some(ref => contentLower.includes(ref));
    
    if (hasAIReferences) {
      patterns.push('ai-self-reference');
    }
    
    // Formal language patterns
    const formalPhrases = [
      'furthermore', 'moreover', 'consequently', 'nevertheless',
      'in conclusion', 'to summarize', 'it is important to note',
      'one must consider', 'it should be emphasized'
    ];
    
    const formalCount = formalPhrases.filter(phrase => contentLower.includes(phrase)).length;
    if (formalCount > 3) {
      patterns.push('overly-formal-language');
    }
    
    // Perfect grammar detection (unusual for students)
    const grammarIssues = this.detectGrammarIssues(content);
    if (grammarIssues.length === 0 && content.length > 500) {
      patterns.push('perfect-grammar');
    }
    
    // Consistent style throughout
    const styleConsistency = this.analyzeStyleConsistency(content);
    if (styleConsistency > 0.9) {
      patterns.push('consistent-style');
    }
    
    // Generic or templated responses
    const genericPhrases = [
      'in today\'s society', 'throughout history', 'since the dawn of time',
      'it is worth noting', 'one could argue', 'many people believe'
    ];
    
    const genericCount = genericPhrases.filter(phrase => contentLower.includes(phrase)).length;
    if (genericCount > 2) {
      patterns.push('generic-phrasing');
    }
    
    return patterns;
  }

  /**
   * Determine assistance level based on detected patterns
   */
  private determineAssistanceLevel(
    patterns: string[], 
    content: string
  ): 'none' | 'minimal' | 'moderate' | 'significant' | 'generated' {
    
    let score = 0;
    
    // Weight patterns by severity
    if (patterns.includes('ai-self-reference')) score += 4;
    if (patterns.includes('perfect-grammar')) score += 2;
    if (patterns.includes('overly-formal-language')) score += 2;
    if (patterns.includes('generic-phrasing')) score += 2;
    if (patterns.includes('consistent-style')) score += 1;
    if (patterns.includes('high-vocabulary-diversity')) score += 1;
    if (patterns.includes('extensive-content')) score += 1;
    if (patterns.includes('complex-structure')) score += 1;
    
    // Determine level based on weighted score
    if (score >= 6) return 'generated';
    if (score >= 4) return 'significant';
    if (score >= 2) return 'moderate';
    if (score >= 1) return 'minimal';
    return 'none';
  }

  /**
   * Calculate confidence score for the detection
   */
  private calculateConfidence(
    patterns: string[], 
    content: string, 
    assistanceLevel: string
  ): number {
    
    let confidence = 0.5; // Base confidence
    
    // High confidence indicators
    if (patterns.includes('ai-self-reference')) confidence += 0.4;
    if (patterns.includes('perfect-grammar') && content.length > 1000) confidence += 0.2;
    if (patterns.includes('overly-formal-language')) confidence += 0.15;
    
    // Multiple patterns increase confidence
    if (patterns.length > 3) confidence += 0.1;
    if (patterns.length > 5) confidence += 0.1;
    
    // Content length factor
    if (content.length > 1500) confidence += 0.05;
    
    // Cap confidence at 95%
    return Math.min(0.95, confidence);
  }

  /**
   * Generate educational recommendations based on detection results
   */
  private generateRecommendations(
    assistanceLevel: string, 
    confidence: number, 
    patterns: string[]
  ): string[] {
    
    const recommendations: string[] = [];
    
    switch (assistanceLevel) {
      case 'generated':
        recommendations.push('Content appears to be AI-generated. Review academic integrity guidelines.');
        recommendations.push('Focus on developing original thinking and personal voice in writing.');
        recommendations.push('Consider rewriting with minimal AI assistance to demonstrate learning.');
        break;
        
      case 'significant':
        recommendations.push('High level of AI assistance detected. Consider reducing dependency.');
        recommendations.push('Work on developing independent writing skills.');
        recommendations.push('Use AI as a brainstorming tool rather than content generator.');
        break;
        
      case 'moderate':
        recommendations.push('Moderate AI assistance detected. Good balance if used educationally.');
        recommendations.push('Ensure you understand and can explain all content.');
        recommendations.push('Consider adding more personal insights and examples.');
        break;
        
      case 'minimal':
        recommendations.push('Minimal AI assistance detected. Excellent independent work.');
        recommendations.push('Continue developing your writing skills with occasional AI support.');
        break;
        
      case 'none':
        recommendations.push('No AI assistance detected. Excellent original work.');
        recommendations.push('Continue developing your independent writing abilities.');
        break;
    }
    
    // Pattern-specific recommendations
    if (patterns.includes('ai-self-reference')) {
      recommendations.push('Remove AI self-references and replace with your own voice.');
    }
    
    if (patterns.includes('overly-formal-language')) {
      recommendations.push('Consider using more natural, personal language appropriate for your level.');
    }
    
    if (confidence < 0.7) {
      recommendations.push('Detection requires human review for verification.');
    }
    
    return recommendations;
  }

  /**
   * Build educational context for the detection
   */
  private buildEducationalContext(
    request: AIDetectionRequest,
    assistanceLevel: string,
    patterns: string[]
  ): Record<string, any> {
    
    return {
      detectionPurpose: request.privacyContext.purpose,
      educationalJustification: request.privacyContext.educationalJustification,
      analysisTimestamp: request.privacyContext.timestamp.toISOString(),
      correlationId: request.privacyContext.correlationId,
      privacyCompliant: true,
      educationalValue: this.calculateEducationalValue(assistanceLevel, patterns),
      learningOpportunity: this.identifyLearningOpportunities(assistanceLevel, patterns),
      nextSteps: this.suggestNextSteps(assistanceLevel, patterns),
      academicIntegrityGuidance: this.provideIntegrityGuidance(assistanceLevel)
    };
  }

  /**
   * Calculate educational value of the analysis
   */
  private calculateEducationalValue(assistanceLevel: string, patterns: string[]): number {
    const levelValues = {
      'none': 1.0,
      'minimal': 0.9,
      'moderate': 0.7,
      'significant': 0.4,
      'generated': 0.1
    };
    
    return levelValues[assistanceLevel] || 0.5;
  }

  /**
   * Identify learning opportunities
   */
  private identifyLearningOpportunities(assistanceLevel: string, patterns: string[]): string[] {
    const opportunities: string[] = [];
    
    if (assistanceLevel === 'generated' || assistanceLevel === 'significant') {
      opportunities.push('Develop original thinking skills');
      opportunities.push('Practice independent writing');
      opportunities.push('Learn to express ideas in your own voice');
    }
    
    if (patterns.includes('overly-formal-language')) {
      opportunities.push('Develop authentic academic voice');
      opportunities.push('Learn appropriate formality levels');
    }
    
    if (patterns.includes('generic-phrasing')) {
      opportunities.push('Develop specific, original examples');
      opportunities.push('Practice concrete over abstract language');
    }
    
    return opportunities;
  }

  /**
   * Suggest next steps for the student
   */
  private suggestNextSteps(assistanceLevel: string, patterns: string[]): string[] {
    const steps: string[] = [];
    
    if (assistanceLevel === 'generated') {
      steps.push('Rewrite the content in your own words');
      steps.push('Meet with instructor to discuss academic integrity');
      steps.push('Practice writing without AI assistance');
    } else if (assistanceLevel === 'significant') {
      steps.push('Reduce AI assistance in future assignments');
      steps.push('Focus on developing personal writing style');
      steps.push('Use AI for brainstorming only');
    } else {
      steps.push('Continue current writing practices');
      steps.push('Consider sharing writing strategies with peers');
    }
    
    return steps;
  }

  /**
   * Provide academic integrity guidance
   */
  private provideIntegrityGuidance(assistanceLevel: string): string {
    const guidance = {
      'none': 'Excellent demonstration of academic integrity and original work.',
      'minimal': 'Good use of AI as a learning tool while maintaining academic integrity.',
      'moderate': 'Appropriate AI assistance if used transparently and educationally.',
      'significant': 'Consider the educational value and transparency of AI assistance.',
      'generated': 'Review academic integrity policies regarding AI-generated content.'
    };
    
    return guidance[assistanceLevel] || 'Follow institutional policies on AI use.';
  }

  /**
   * Simple grammar issue detection
   */
  private detectGrammarIssues(content: string): string[] {
    const issues: string[] = [];
    
    // Very basic grammar checks (in production, use proper NLP library)
    if (content.includes(' i ') && !content.includes(' I ')) {
      issues.push('capitalization');
    }
    
    if (content.includes('  ')) {
      issues.push('spacing');
    }
    
    return issues;
  }

  /**
   * Analyze style consistency throughout the text
   */
  private analyzeStyleConsistency(content: string): number {
    // Simple consistency analysis
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length < 3) return 0.5;
    
    // Check sentence length variation
    const lengths = sentences.map(s => s.trim().split(/\s+/).length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((acc, len) => acc + Math.pow(len - avgLength, 2), 0) / lengths.length;
    
    // Lower variance = higher consistency (potentially AI-generated)
    return variance < 10 ? 0.9 : 0.6;
  }
}