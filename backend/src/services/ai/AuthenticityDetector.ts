import natural from 'natural';
import { ReflectionAnalysis } from '@prisma/client';
import prisma from '../../lib/prisma';

/**
 * Enhanced authenticity detection for reflection gaming prevention
 */
export class AuthenticityDetector {
  // Advanced formulaic patterns that indicate gaming
  private static readonly GAMING_PATTERNS = {
    generic: [
      /the (ai|questions?) (helped|made) me (think|realize|understand)/gi,
      /i (learned|discovered|found) (that|how)/gi,
      /this (was|is) (helpful|useful|interesting)/gi,
      /these questions (challenged|pushed|forced) me/gi,
      /i (now|will) (understand|know|see)/gi
    ],
    
    repetitive: [
      /^(yes|no|maybe|i think|i feel|i believe)/gi,
      /(first|second|third|finally|in conclusion)/gi,
      /^(the|this|these|those) \w+ (is|are|was|were)/gi
    ],
    
    minimal: [
      /^.{0,50}$/m, // Very short sentences
      /^[\w\s]{0,20}[.!?]$/gm // Minimal effort responses
    ],
    
    copyPaste: [
      /\b(Lorem ipsum|placeholder|example text)\b/gi,
      /\[(insert|add|write) .+\]/gi,
      /\.\.\./g // Excessive ellipses
    ]
  };

  // Linguistic complexity indicators
  private static readonly COMPLEXITY_INDICATORS = {
    connectives: ['because', 'therefore', 'however', 'although', 'furthermore', 'moreover', 'consequently'],
    metacognitive: ['realize', 'understand', 'assume', 'believe', 'wonder', 'question', 'reflect'],
    specific: ['specifically', 'particularly', 'especially', 'namely', 'for instance'],
    evaluative: ['effective', 'ineffective', 'successful', 'challenging', 'difficult', 'surprising']
  };

  /**
   * Perform advanced authenticity analysis
   */
  static async analyzeAuthenticity(
    reflection: string,
    studentId: string,
    assignmentId: string
  ): Promise<{
    score: number;
    flags: string[];
    confidence: number;
    recommendations: string[];
  }> {
    const flags: string[] = [];
    let score = 100; // Start with assumption of authenticity
    
    // 1. Pattern-based gaming detection
    const gamingScore = this.detectGamingPatterns(reflection, flags);
    score -= (100 - gamingScore);
    
    // 2. Linguistic complexity analysis
    const complexityScore = this.analyzeLinguisticComplexity(reflection);
    if (complexityScore < 30) {
      score -= 20;
      flags.push('Low linguistic complexity');
    }
    
    // 3. Temporal pattern analysis
    const temporalScore = await this.analyzeTemporalPatterns(studentId, assignmentId);
    score -= (100 - temporalScore);
    
    // 4. Cross-reference with previous reflections
    const similarityScore = await this.checkCrossReflectionSimilarity(reflection, studentId);
    score -= (100 - similarityScore);
    
    // 5. Sentiment consistency check
    const sentimentScore = this.analyzeSentimentConsistency(reflection);
    if (sentimentScore < 50) {
      score -= 15;
      flags.push('Inconsistent sentiment');
    }
    
    // 6. Personal voice detection
    const voiceScore = await this.detectPersonalVoice(reflection, studentId);
    if (voiceScore < 40) {
      score -= 20;
      flags.push('Lacks personal voice');
    }
    
    // Calculate confidence based on data availability
    const confidence = this.calculateConfidence(reflection, flags.length);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(score, flags);
    
    return {
      score: Math.max(0, Math.min(100, score)),
      flags,
      confidence,
      recommendations
    };
  }

  /**
   * Detect gaming patterns using regex and NLP
   */
  private static detectGamingPatterns(reflection: string, flags: string[]): number {
    let score = 100;
    
    // Check generic patterns
    let genericMatches = 0;
    this.GAMING_PATTERNS.generic.forEach(pattern => {
      const matches = reflection.match(pattern);
      if (matches) genericMatches += matches.length;
    });
    
    if (genericMatches > 3) {
      score -= 30;
      flags.push(`High generic phrase count (${genericMatches})`);
    } else if (genericMatches > 1) {
      score -= 15;
      flags.push('Contains generic phrases');
    }
    
    // Check repetitive structure
    let repetitiveMatches = 0;
    this.GAMING_PATTERNS.repetitive.forEach(pattern => {
      const matches = reflection.match(pattern);
      if (matches) repetitiveMatches += matches.length;
    });
    
    if (repetitiveMatches > 5) {
      score -= 25;
      flags.push('Highly repetitive structure');
    }
    
    // Check minimal effort
    const sentences = reflection.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = reflection.length / Math.max(1, sentences.length);
    
    if (avgSentenceLength < 50) {
      score -= 20;
      flags.push('Very short average sentence length');
    }
    
    // Check for copy-paste indicators
    this.GAMING_PATTERNS.copyPaste.forEach(pattern => {
      if (pattern.test(reflection)) {
        score -= 40;
        flags.push('Copy-paste indicators detected');
      }
    });
    
    return score;
  }

  /**
   * Analyze linguistic complexity using NLP
   */
  private static analyzeLinguisticComplexity(reflection: string): number {
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(reflection.toLowerCase()) || [];
    
    if (tokens.length < 50) return 20; // Too short to be complex
    
    let complexityScore = 30; // Base score
    
    // Check for connectives
    const connectiveCount = tokens.filter(token => 
      this.COMPLEXITY_INDICATORS.connectives.includes(token)
    ).length;
    complexityScore += Math.min(20, connectiveCount * 4);
    
    // Check for metacognitive terms
    const metacognitiveCount = tokens.filter(token =>
      this.COMPLEXITY_INDICATORS.metacognitive.includes(token)
    ).length;
    complexityScore += Math.min(20, metacognitiveCount * 5);
    
    // Check for specificity
    const specificCount = tokens.filter(token =>
      this.COMPLEXITY_INDICATORS.specific.includes(token)
    ).length;
    complexityScore += Math.min(15, specificCount * 5);
    
    // Vocabulary diversity (unique words / total words)
    const uniqueWords = new Set(tokens);
    const diversityRatio = uniqueWords.size / tokens.length;
    complexityScore += Math.min(15, diversityRatio * 30);
    
    return Math.min(100, complexityScore);
  }

  /**
   * Analyze temporal patterns (submission timing, frequency)
   */
  private static async analyzeTemporalPatterns(
    studentId: string,
    assignmentId: string
  ): Promise<number> {
    try {
      // Get recent reflections
      const recentReflections = await prisma.reflectionAnalysis.findMany({
        where: {
          studentId,
          assignmentId,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      // Suspicious if too many reflections in short time
      if (recentReflections.length > 5) {
        return 60; // Likely gaming the system
      }
      
      // Check submission intervals
      if (recentReflections.length >= 2) {
        const intervals: number[] = [];
        for (let i = 1; i < recentReflections.length; i++) {
          const interval = recentReflections[i-1].createdAt.getTime() - 
                          recentReflections[i].createdAt.getTime();
          intervals.push(interval);
        }
        
        // If all submissions are within 5 minutes of each other
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        if (avgInterval < 5 * 60 * 1000) {
          return 70; // Suspicious rapid submissions
        }
      }
      
      return 100; // Normal temporal pattern
    } catch (error) {
      console.error('Error analyzing temporal patterns:', error);
      return 100; // Give benefit of doubt on error
    }
  }

  /**
   * Check similarity with previous reflections
   */
  private static async checkCrossReflectionSimilarity(
    reflection: string,
    studentId: string
  ): Promise<number> {
    try {
      const previousReflections = await prisma.reflectionAnalysis.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { reflectionText: true }
      });
      
      if (previousReflections.length === 0) return 100;
      
      // Use TF-IDF for more sophisticated similarity
      const tfidf = new natural.TfIdf();
      
      // Add current reflection
      tfidf.addDocument(reflection);
      
      // Add previous reflections
      previousReflections.forEach(prev => {
        tfidf.addDocument(prev.reflectionText);
      });
      
      // Check similarity scores
      let maxSimilarity = 0;
      tfidf.tfidfs(reflection, (i, measure) => {
        if (i > 0 && measure > maxSimilarity) {
          maxSimilarity = measure;
        }
      });
      
      // High similarity indicates potential copy-paste or formulaic responses
      if (maxSimilarity > 0.8) return 40;
      if (maxSimilarity > 0.6) return 70;
      if (maxSimilarity > 0.4) return 85;
      
      return 100;
    } catch (error) {
      console.error('Error checking cross-reflection similarity:', error);
      return 100;
    }
  }

  /**
   * Analyze sentiment consistency
   */
  private static analyzeSentimentConsistency(reflection: string): number {
    const sentiment = new natural.SentimentAnalyzer('English', 
      natural.PorterStemmer, 'afinn'
    );
    
    const sentences = reflection.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length < 2) return 50; // Too short to analyze
    
    const sentiments = sentences.map(sentence => {
      const tokens = new natural.WordTokenizer().tokenize(sentence);
      return sentiment.getSentiment(tokens || []);
    });
    
    // Calculate variance in sentiment
    const mean = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
    const variance = sentiments.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / sentiments.length;
    
    // High variance suggests inconsistent emotional tone (potential gaming)
    if (variance > 2) return 30;
    if (variance > 1) return 60;
    
    return 100;
  }

  /**
   * Detect personal voice and writing style
   */
  private static async detectPersonalVoice(
    reflection: string,
    studentId: string
  ): Promise<number> {
    try {
      // Get previous high-quality reflections to establish baseline
      const baselineReflections = await prisma.reflectionAnalysis.findMany({
        where: {
          studentId,
          overallQualityScore: { gte: 70 },
          authenticityScore: { gte: 70 }
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { reflectionText: true }
      });
      
      if (baselineReflections.length < 2) {
        // Not enough data for comparison
        return 70; // Neutral score
      }
      
      // Analyze writing style features
      const currentStyle = this.extractStyleFeatures(reflection);
      const baselineStyles = baselineReflections.map(r => 
        this.extractStyleFeatures(r.reflectionText)
      );
      
      // Compare style consistency
      let consistencyScore = 0;
      baselineStyles.forEach(baseline => {
        const similarity = this.compareStyleFeatures(currentStyle, baseline);
        consistencyScore += similarity;
      });
      
      return Math.min(100, (consistencyScore / baselineStyles.length) * 100);
    } catch (error) {
      console.error('Error detecting personal voice:', error);
      return 70;
    }
  }

  /**
   * Extract writing style features
   */
  private static extractStyleFeatures(text: string): any {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/);
    
    return {
      avgSentenceLength: words.length / Math.max(1, sentences.length),
      avgWordLength: text.replace(/\s+/g, '').length / Math.max(1, words.length),
      punctuationRatio: (text.match(/[,;:]/g) || []).length / Math.max(1, sentences.length),
      firstPersonUsage: (text.match(/\b(I|me|my|mine)\b/gi) || []).length / Math.max(1, words.length),
      questionRatio: (text.match(/\?/g) || []).length / Math.max(1, sentences.length)
    };
  }

  /**
   * Compare writing style features
   */
  private static compareStyleFeatures(style1: any, style2: any): number {
    const features = Object.keys(style1);
    let similarity = 0;
    
    features.forEach(feature => {
      const diff = Math.abs(style1[feature] - style2[feature]);
      const maxVal = Math.max(style1[feature], style2[feature]);
      if (maxVal > 0) {
        similarity += (1 - diff / maxVal);
      }
    });
    
    return similarity / features.length;
  }

  /**
   * Calculate confidence in authenticity assessment
   */
  private static calculateConfidence(reflection: string, flagCount: number): number {
    const wordCount = reflection.split(/\s+/).length;
    
    // Base confidence on amount of data
    let confidence = 50;
    
    if (wordCount > 200) confidence += 30;
    else if (wordCount > 100) confidence += 20;
    else if (wordCount > 50) confidence += 10;
    
    // More flags = more confidence in gaming detection
    confidence += Math.min(20, flagCount * 5);
    
    return Math.min(100, confidence);
  }

  /**
   * Generate recommendations based on authenticity analysis
   */
  private static generateRecommendations(score: number, flags: string[]): string[] {
    const recommendations: string[] = [];
    
    if (score < 30) {
      recommendations.push('This reflection appears to be gaming the system');
      recommendations.push('Require a face-to-face discussion about the reflection');
      recommendations.push('Consider restricting AI access until genuine engagement shown');
    } else if (score < 50) {
      recommendations.push('Reflection shows signs of minimal effort');
      recommendations.push('Encourage more specific examples and personal insights');
      recommendations.push('Provide additional reflection prompts focused on deep thinking');
    } else if (score < 70) {
      recommendations.push('Reflection could be more authentic and personal');
      recommendations.push('Ask follow-up questions to deepen thinking');
    }
    
    // Specific recommendations based on flags
    if (flags.includes('Lacks personal voice')) {
      recommendations.push('Encourage student to share their unique perspective');
    }
    if (flags.includes('Low linguistic complexity')) {
      recommendations.push('Model more complex reflection examples');
    }
    if (flags.includes('Highly repetitive structure')) {
      recommendations.push('Vary reflection prompts to encourage different approaches');
    }
    
    return recommendations;
  }
}