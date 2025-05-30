import prisma from '../../lib/prisma';
import * as natural from 'natural';
import { DocumentVersion, WritingSession } from '@prisma/client';

export interface AIDetectionResult {
  // Overall assessment
  overallRiskScore: number; // 0-100, higher = more likely AI-generated
  confidence: number; // 0-100, confidence in the assessment
  detectionMethod: 'stylometric' | 'behavioral' | 'pattern' | 'combined';
  
  // Detailed analysis
  stylometricAnalysis: {
    vocabularyComplexity: number;
    sentenceVariability: number;
    styleConsistency: number;
    unusualPhrases: string[];
    deviationFromBaseline: number;
  };
  
  // Behavioral indicators
  behavioralAnalysis: {
    typingSpeed: number; // words per minute
    pausePatterns: 'natural' | 'unnatural' | 'suspicious';
    copyPasteEvents: number;
    bulkTextAdditions: number;
    revisionPattern: 'organic' | 'minimal' | 'none';
  };
  
  // AI-specific patterns
  aiPatternAnalysis: {
    formulaicStructure: boolean;
    overlyPolishedStyle: boolean;
    lackOfPersonalVoice: boolean;
    suspiciouslyPerfectGrammar: boolean;
    hedgingLanguage: number; // AI tends to hedge more
  };
  
  // Educational response
  educationalResponse: {
    severity: 'low' | 'medium' | 'high';
    interventionType: 'none' | 'gentle_reminder' | 'reflection_prompt' | 'educator_alert';
    message: string;
    reflectionPrompts: string[];
    resourceLinks: string[];
  };
}

export interface WritingBaseline {
  studentId: string;
  // Writing style metrics
  averageWordLength: number;
  averageSentenceLength: number;
  vocabularyDiversity: number;
  commonPhrases: string[];
  grammarErrorRate: number;
  
  // Behavioral patterns
  typicalTypingSpeed: number;
  typicalPauseLength: number;
  revisionFrequency: number;
  
  // Personal markers
  favoriteTransitions: string[];
  personalAnecdotes: boolean;
  emotionalExpression: number;
  
  // Update tracking
  samplesAnalyzed: number;
  lastUpdated: Date;
}

export class ExternalAIDetectionService {
  private static readonly AI_INDICATORS = {
    hedgingPhrases: [
      'it is important to note',
      'it should be mentioned',
      'one might argue',
      'it could be said',
      'generally speaking',
      'in many cases',
      'to some extent'
    ],
    
    formulaicTransitions: [
      'furthermore',
      'moreover',
      'additionally',
      'in conclusion',
      'to summarize',
      'in essence'
    ],
    
    aiStyleMarkers: [
      'comprehensive understanding',
      'multifaceted approach',
      'nuanced perspective',
      'various stakeholders',
      'significant implications'
    ]
  };

  /**
   * Main detection method that combines multiple analysis approaches
   */
  static async detectExternalAI(
    documentId: string,
    content: string,
    sessionId?: string
  ): Promise<AIDetectionResult> {
    // Get document and author information
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        author: true,
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        writingSessions: {
          orderBy: { startTime: 'desc' },
          take: 5
        }
      }
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Get or create student baseline
    const baseline = await this.getOrCreateBaseline(document.authorId);
    
    // Perform multi-dimensional analysis
    const [stylometric, behavioral, aiPatterns] = await Promise.all([
      this.performStylometricAnalysis(content, baseline),
      this.analyzeBehavioralPatterns(document.writingSessions, sessionId),
      this.detectAIPatterns(content)
    ]);

    // Calculate overall risk score
    const overallRiskScore = this.calculateRiskScore(stylometric, behavioral, aiPatterns);
    
    // Determine educational response
    const educationalResponse = this.generateEducationalResponse(
      overallRiskScore,
      stylometric,
      behavioral,
      aiPatterns
    );

    return {
      overallRiskScore,
      confidence: this.calculateConfidence(stylometric, behavioral, aiPatterns),
      detectionMethod: 'combined',
      stylometricAnalysis: stylometric,
      behavioralAnalysis: behavioral,
      aiPatternAnalysis: aiPatterns,
      educationalResponse
    };
  }

  /**
   * Get or create a writing baseline for the student
   */
  private static async getOrCreateBaseline(studentId: string): Promise<WritingBaseline> {
    // Check for existing baseline
    const existingBaseline = await prisma.studentProfile.findUnique({
      where: { studentId },
      select: {
        sessionMetrics: true,
        updatedAt: true
      }
    });

    if (existingBaseline?.sessionMetrics && 
        (existingBaseline.sessionMetrics as any).writingBaseline) {
      return (existingBaseline.sessionMetrics as any).writingBaseline;
    }

    // Create new baseline from historical data
    const baseline = await this.buildBaseline(studentId);
    
    // Store baseline
    await prisma.studentProfile.upsert({
      where: { studentId },
      create: {
        studentId,
        sessionMetrics: { writingBaseline: baseline } as any
      },
      update: {
        sessionMetrics: { writingBaseline: baseline } as any
      }
    });

    return baseline;
  }

  /**
   * Build a writing baseline from historical submissions
   */
  private static async buildBaseline(studentId: string): Promise<WritingBaseline> {
    const submissions = await prisma.assignmentSubmission.findMany({
      where: { 
        authorId: studentId,
        content: { not: null }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    if (submissions.length === 0) {
      // Return default baseline for new students
      return this.getDefaultBaseline(studentId);
    }

    // Analyze writing patterns
    let totalWords = 0;
    let totalSentences = 0;
    const allWords: string[] = [];
    const phraseFrequency: Record<string, number> = {};

    submissions.forEach(submission => {
      if (submission.content) {
        const tokenizer = new natural.WordTokenizer();
        const tokens = tokenizer.tokenize(submission.content);
        const sentences = submission.content.split(/[.!?]+/).filter(s => s.trim());
        
        totalWords += tokens.length;
        totalSentences += sentences.length;
        allWords.push(...tokens.map((t: string) => t.toLowerCase()));
        
        // Extract common phrases
        const ngrams = natural.NGrams.ngrams(submission.content, 3);
        ngrams.forEach(ngram => {
          const phrase = ngram.join(' ').toLowerCase();
          phraseFrequency[phrase] = (phraseFrequency[phrase] || 0) + 1;
        });
      }
    });

    // Calculate metrics
    const uniqueWords = new Set(allWords);
    const vocabularyDiversity = uniqueWords.size / allWords.length;
    const averageWordLength = allWords.reduce((sum, word) => sum + word.length, 0) / allWords.length;
    const averageSentenceLength = totalWords / totalSentences;

    // Get most common phrases
    const commonPhrases = Object.entries(phraseFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([phrase]) => phrase);

    return {
      studentId,
      averageWordLength,
      averageSentenceLength,
      vocabularyDiversity,
      commonPhrases,
      grammarErrorRate: 0.05, // Default estimate
      typicalTypingSpeed: 40, // Default WPM
      typicalPauseLength: 5, // seconds
      revisionFrequency: 0.3, // 30% of text revised
      favoriteTransitions: this.extractTransitions(submissions),
      personalAnecdotes: this.detectPersonalAnecdotes(submissions),
      emotionalExpression: this.measureEmotionalExpression(submissions),
      samplesAnalyzed: submissions.length,
      lastUpdated: new Date()
    };
  }

  /**
   * Perform stylometric analysis comparing content to baseline
   */
  private static async performStylometricAnalysis(
    content: string,
    baseline: WritingBaseline
  ): Promise<AIDetectionResult['stylometricAnalysis']> {
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(content);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    
    // Calculate current metrics
    const currentWordLength = tokens.reduce((sum, word) => sum + word.length, 0) / tokens.length;
    const currentSentenceLength = tokens.length / sentences.length;
    const uniqueWords = new Set(tokens.map(t => t.toLowerCase()));
    const currentVocabularyDiversity = uniqueWords.size / tokens.length;
    
    // Calculate deviations
    const wordLengthDeviation = Math.abs(currentWordLength - baseline.averageWordLength) / baseline.averageWordLength;
    const sentenceLengthDeviation = Math.abs(currentSentenceLength - baseline.averageSentenceLength) / baseline.averageSentenceLength;
    const vocabularyDeviation = Math.abs(currentVocabularyDiversity - baseline.vocabularyDiversity) / baseline.vocabularyDiversity;
    
    // Overall deviation score
    const deviationFromBaseline = (wordLengthDeviation + sentenceLengthDeviation + vocabularyDeviation) / 3 * 100;
    
    // Check for unusual phrases (potential AI markers)
    const unusualPhrases = this.findUnusualPhrases(content, baseline);
    
    // Calculate complexity scores
    const vocabularyComplexity = this.calculateVocabularyComplexity(tokens);
    const sentenceVariability = this.calculateSentenceVariability(sentences);
    const styleConsistency = 100 - deviationFromBaseline;
    
    return {
      vocabularyComplexity,
      sentenceVariability,
      styleConsistency,
      unusualPhrases,
      deviationFromBaseline
    };
  }

  /**
   * Analyze behavioral patterns from writing sessions
   */
  private static async analyzeBehavioralPatterns(
    sessions: WritingSession[],
    currentSessionId?: string
  ): Promise<AIDetectionResult['behavioralAnalysis']> {
    if (sessions.length === 0) {
      return {
        typingSpeed: 0,
        pausePatterns: 'natural',
        copyPasteEvents: 0,
        bulkTextAdditions: 0,
        revisionPattern: 'none'
      };
    }

    const currentSession = currentSessionId 
      ? sessions.find(s => s.id === currentSessionId)
      : sessions[0];

    if (!currentSession || !currentSession.activity) {
      return {
        typingSpeed: 40,
        pausePatterns: 'natural',
        copyPasteEvents: 0,
        bulkTextAdditions: 0,
        revisionPattern: 'organic'
      };
    }

    const activity = currentSession.activity as any;
    
    // Calculate typing speed
    const duration = currentSession.duration || 1;
    const wordsAdded = (activity.charactersAdded || 0) / 5; // Approximate words
    const typingSpeed = (wordsAdded / duration) * 60; // WPM
    
    // Analyze pause patterns
    const pausePatterns = this.analyzePausePatterns(activity.pauses || []);
    
    // Count suspicious events
    const copyPasteEvents = activity.copyPasteCount || 0;
    const bulkTextAdditions = activity.bulkAdditions || 0;
    
    // Analyze revision patterns
    const deletionRatio = (activity.charactersDeleted || 0) / Math.max(1, activity.charactersAdded || 1);
    const revisionPattern = deletionRatio > 0.3 ? 'organic' : deletionRatio > 0.1 ? 'minimal' : 'none';
    
    return {
      typingSpeed,
      pausePatterns,
      copyPasteEvents,
      bulkTextAdditions,
      revisionPattern
    };
  }

  /**
   * Detect AI-specific writing patterns
   */
  private static async detectAIPatterns(content: string): Promise<AIDetectionResult['aiPatternAnalysis']> {
    const lowerContent = content.toLowerCase();
    
    // Check for formulaic structure
    const formulaicStructure = this.detectFormulaicStructure(content);
    
    // Check for overly polished style (no typos, perfect grammar)
    const overlyPolishedStyle = this.detectOverlyPolishedStyle(content);
    
    // Check for lack of personal voice
    const lackOfPersonalVoice = this.detectLackOfPersonalVoice(content);
    
    // Check grammar perfection
    const suspiciouslyPerfectGrammar = this.checkGrammarPerfection(content);
    
    // Count hedging language
    const hedgingLanguage = this.AI_INDICATORS.hedgingPhrases.reduce((count, phrase) => {
      return count + (lowerContent.match(new RegExp(phrase, 'g')) || []).length;
    }, 0);
    
    return {
      formulaicStructure,
      overlyPolishedStyle,
      lackOfPersonalVoice,
      suspiciouslyPerfectGrammar,
      hedgingLanguage
    };
  }

  /**
   * Calculate overall risk score
   */
  private static calculateRiskScore(
    stylometric: AIDetectionResult['stylometricAnalysis'],
    behavioral: AIDetectionResult['behavioralAnalysis'],
    aiPatterns: AIDetectionResult['aiPatternAnalysis']
  ): number {
    let score = 0;
    
    // Stylometric factors (0-40 points)
    if (stylometric.deviationFromBaseline > 50) score += 20;
    else if (stylometric.deviationFromBaseline > 30) score += 10;
    
    if (stylometric.unusualPhrases.length > 5) score += 10;
    else if (stylometric.unusualPhrases.length > 2) score += 5;
    
    if (stylometric.vocabularyComplexity > 80) score += 10;
    else if (stylometric.vocabularyComplexity > 60) score += 5;
    
    // Behavioral factors (0-40 points)
    if (behavioral.typingSpeed > 80) score += 15; // Suspiciously fast
    else if (behavioral.typingSpeed < 20) score += 10; // Suspiciously slow (copy-paste)
    
    if (behavioral.pausePatterns === 'suspicious') score += 10;
    else if (behavioral.pausePatterns === 'unnatural') score += 5;
    
    if (behavioral.copyPasteEvents > 3) score += 10;
    else if (behavioral.copyPasteEvents > 1) score += 5;
    
    if (behavioral.revisionPattern === 'none') score += 5;
    
    // AI pattern factors (0-20 points)
    if (aiPatterns.formulaicStructure) score += 5;
    if (aiPatterns.overlyPolishedStyle) score += 5;
    if (aiPatterns.lackOfPersonalVoice) score += 5;
    if (aiPatterns.suspiciouslyPerfectGrammar) score += 3;
    if (aiPatterns.hedgingLanguage > 3) score += 2;
    
    return Math.min(score, 100);
  }

  /**
   * Generate educational response based on detection results
   */
  private static generateEducationalResponse(
    riskScore: number,
    stylometric: AIDetectionResult['stylometricAnalysis'],
    behavioral: AIDetectionResult['behavioralAnalysis'],
    aiPatterns: AIDetectionResult['aiPatternAnalysis']
  ): AIDetectionResult['educationalResponse'] {
    // Low risk (0-30): No intervention
    if (riskScore <= 30) {
      return {
        severity: 'low',
        interventionType: 'none',
        message: 'Your writing shows authentic personal engagement. Keep it up!',
        reflectionPrompts: [],
        resourceLinks: []
      };
    }
    
    // Medium risk (31-60): Gentle reminder
    if (riskScore <= 60) {
      return {
        severity: 'medium',
        interventionType: 'gentle_reminder',
        message: 'Your writing style seems different than usual. Remember that authentic writing helps you learn better.',
        reflectionPrompts: [
          'How did you approach this writing task?',
          'What challenges did you face while writing?',
          'What resources did you use to help you?'
        ],
        resourceLinks: [
          '/resources/academic-integrity',
          '/resources/writing-authentically'
        ]
      };
    }
    
    // High risk (61-100): Reflection prompt
    return {
      severity: 'high',
      interventionType: 'reflection_prompt',
      message: 'We noticed some unusual patterns in your writing. Let\'s reflect on your writing process.',
      reflectionPrompts: [
        'Describe your writing process for this assignment step by step.',
        'What tools or resources did you use while writing?',
        'How does this piece represent your own thinking and voice?',
        'What did you learn from writing this?'
      ],
      resourceLinks: [
        '/resources/academic-integrity',
        '/resources/ai-tools-responsibly',
        '/resources/developing-your-voice'
      ]
    };
  }

  /**
   * Helper methods
   */
  
  private static getDefaultBaseline(studentId: string): WritingBaseline {
    return {
      studentId,
      averageWordLength: 4.5,
      averageSentenceLength: 15,
      vocabularyDiversity: 0.4,
      commonPhrases: [],
      grammarErrorRate: 0.05,
      typicalTypingSpeed: 40,
      typicalPauseLength: 5,
      revisionFrequency: 0.3,
      favoriteTransitions: [],
      personalAnecdotes: false,
      emotionalExpression: 50,
      samplesAnalyzed: 0,
      lastUpdated: new Date()
    };
  }

  private static extractTransitions(submissions: any[]): string[] {
    const transitions: Record<string, number> = {};
    const transitionWords = [
      'however', 'therefore', 'moreover', 'furthermore',
      'additionally', 'consequently', 'nevertheless', 'thus',
      'hence', 'meanwhile', 'afterward', 'finally'
    ];

    submissions.forEach(sub => {
      if (sub.content) {
        const lower = sub.content.toLowerCase();
        transitionWords.forEach(word => {
          const count = (lower.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
          if (count > 0) {
            transitions[word] = (transitions[word] || 0) + count;
          }
        });
      }
    });

    return Object.entries(transitions)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  private static detectPersonalAnecdotes(submissions: any[]): boolean {
    const personalIndicators = [
      /\b(I|me|my|mine|myself)\b.*\b(remember|recall|once|when I was|experienced)\b/i,
      /\b(my (mom|dad|mother|father|friend|teacher|family))\b/i,
      /\b(last (year|month|week|summer|winter))\b.*\bI\b/i
    ];

    return submissions.some(sub => 
      sub.content && personalIndicators.some(pattern => pattern.test(sub.content))
    );
  }

  private static measureEmotionalExpression(submissions: any[]): number {
    let totalScore = 0;
    let count = 0;

    submissions.forEach(sub => {
      if (sub.content) {
        const sentiment = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
        const tokenizer = new natural.WordTokenizer();
        const tokens = tokenizer.tokenize(sub.content);
        const score = sentiment.getSentiment(tokens);
        totalScore += Math.abs(score); // Absolute value for emotional intensity
        count++;
      }
    });

    return count > 0 ? (totalScore / count) * 10 : 50; // Scale to 0-100
  }

  private static findUnusualPhrases(content: string, baseline: WritingBaseline): string[] {
    const unusual: string[] = [];
    const contentLower = content.toLowerCase();
    
    // Check for AI indicator phrases
    this.AI_INDICATORS.aiStyleMarkers.forEach(marker => {
      if (contentLower.includes(marker)) {
        unusual.push(marker);
      }
    });
    
    // Check for phrases not in baseline
    const ngrams = natural.NGrams.ngrams(content, 3);
    ngrams.forEach(ngram => {
      const phrase = ngram.join(' ').toLowerCase();
      if (!baseline.commonPhrases.includes(phrase) && 
          this.AI_INDICATORS.formulaicTransitions.some(t => phrase.includes(t))) {
        unusual.push(phrase);
      }
    });
    
    return [...new Set(unusual)].slice(0, 10);
  }

  private static calculateVocabularyComplexity(tokens: string[]): number {
    const avgLength = tokens.reduce((sum, word) => sum + word.length, 0) / tokens.length;
    const longWords = tokens.filter(word => word.length > 8).length;
    const complexityScore = (avgLength / 6) * 50 + (longWords / tokens.length) * 50;
    return Math.min(complexityScore * 100, 100);
  }

  private static calculateSentenceVariability(sentences: string[]): number {
    if (sentences.length < 2) return 50;
    
    const lengths = sentences.map(s => s.split(/\s+/).length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);
    
    // Higher variability is more natural
    return Math.min((stdDev / avgLength) * 100, 100);
  }

  private static analyzePausePatterns(pauses: number[]): 'natural' | 'unnatural' | 'suspicious' {
    if (pauses.length === 0) return 'natural';
    
    const avgPause = pauses.reduce((a, b) => a + b, 0) / pauses.length;
    const longPauses = pauses.filter(p => p > 30).length; // 30 seconds
    const shortPauses = pauses.filter(p => p < 2).length; // 2 seconds
    
    if (longPauses > pauses.length * 0.3) return 'suspicious'; // Many long pauses (copy-paste?)
    if (shortPauses > pauses.length * 0.8) return 'unnatural'; // Too consistent
    
    return 'natural';
  }

  private static detectFormulaicStructure(content: string): boolean {
    // Check for standard 5-paragraph essay structure
    const paragraphs = content.split(/\n\n+/);
    if (paragraphs.length === 5) {
      const hasIntroTransition = /introduction|firstly|to begin/i.test(paragraphs[0]);
      const hasConclusionTransition = /conclusion|in conclusion|to summarize/i.test(paragraphs[4]);
      if (hasIntroTransition && hasConclusionTransition) return true;
    }
    
    // Check for formulaic transitions
    const formulaicCount = this.AI_INDICATORS.formulaicTransitions.reduce((count, transition) => {
      return count + (content.match(new RegExp(transition, 'gi')) || []).length;
    }, 0);
    
    return formulaicCount > 4;
  }

  private static detectOverlyPolishedStyle(content: string): boolean {
    // Simple heuristic: Check for common typos or informal language
    const informalMarkers = [
      /\b(gonna|wanna|gotta|kinda|sorta)\b/i,
      /\b(lol|omg|btw)\b/i,
      /[.!?]\s*[a-z]/g, // Sentence starting with lowercase
      /\s{2,}/, // Multiple spaces
      /[,;]\s*[,;]/ // Double punctuation
    ];
    
    const hasInformalElements = informalMarkers.some(pattern => pattern.test(content));
    const wordCount = content.split(/\s+/).length;
    
    // If it's a long text with zero informal elements, it might be AI
    return wordCount > 200 && !hasInformalElements;
  }

  private static detectLackOfPersonalVoice(content: string): boolean {
    const personalMarkers = [
      /\bI (think|believe|feel|remember|wonder)\b/i,
      /\b(my|our) (experience|opinion|view|perspective)\b/i,
      /\b(personally|honestly|frankly)\b/i,
      /\b(maybe|perhaps|probably)\b/i // Informal uncertainty
    ];
    
    const personalCount = personalMarkers.reduce((count, pattern) => {
      return count + (content.match(pattern) || []).length;
    }, 0);
    
    const wordCount = content.split(/\s+/).length;
    const personalRatio = personalCount / (wordCount / 100); // Per 100 words
    
    return personalRatio < 0.5; // Less than 0.5 personal markers per 100 words
  }

  private static checkGrammarPerfection(content: string): boolean {
    // This is a simplified check - in production, use a grammar API
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    
    // Check for varied sentence starts (natural writing)
    const sentenceStarts = sentences.map(s => s.trim().split(/\s+/)[0]?.toLowerCase());
    const uniqueStarts = new Set(sentenceStarts);
    const startVariety = uniqueStarts.size / sentences.length;
    
    // Perfect grammar often has less variety in sentence starts
    return startVariety < 0.7 && sentences.length > 5;
  }

  private static calculateConfidence(
    stylometric: AIDetectionResult['stylometricAnalysis'],
    behavioral: AIDetectionResult['behavioralAnalysis'],
    aiPatterns: AIDetectionResult['aiPatternAnalysis']
  ): number {
    let confidence = 50; // Base confidence
    
    // Strong stylometric deviation increases confidence
    if (stylometric.deviationFromBaseline > 70) confidence += 20;
    else if (stylometric.deviationFromBaseline > 50) confidence += 10;
    
    // Clear behavioral indicators increase confidence
    if (behavioral.copyPasteEvents > 5) confidence += 15;
    if (behavioral.typingSpeed > 100 || behavioral.typingSpeed < 10) confidence += 10;
    
    // Multiple AI patterns increase confidence
    const aiPatternCount = Object.values(aiPatterns).filter(v => v === true || (typeof v === 'number' && v > 3)).length;
    confidence += aiPatternCount * 5;
    
    return Math.min(confidence, 95); // Never 100% confident
  }

  /**
   * Store detection results for educator review
   */
  static async storeDetectionResult(
    documentId: string,
    detectionResult: AIDetectionResult
  ): Promise<void> {
    await prisma.document.update({
      where: { id: documentId },
      data: {
        metadata: {
          aiDetection: {
            timestamp: new Date(),
            riskScore: detectionResult.overallRiskScore,
            confidence: detectionResult.confidence,
            interventionDeployed: detectionResult.educationalResponse.interventionType !== 'none'
          }
        }
      }
    });

    // If high risk, create notification for educator
    if (detectionResult.overallRiskScore > 70) {
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          author: true,
          assignment: {
            include: {
              instructor: true
            }
          }
        }
      });

      if (document?.assignment) {
        await prisma.notification.create({
          data: {
            recipientId: document.assignment.instructorId,
            type: 'ai_detection_alert',
            category: 'academic_integrity',
            priority: 'high',
            title: 'Potential External AI Usage Detected',
            message: `Unusual writing patterns detected in ${document.author.firstName} ${document.author.lastName}'s submission for "${document.assignment.title}". Risk score: ${detectionResult.overallRiskScore}/100.`,
            context: {
              documentId,
              studentId: document.authorId,
              assignmentId: document.assignment.id,
              detectionDetails: {
                riskScore: detectionResult.overallRiskScore,
                confidence: detectionResult.confidence,
                primaryConcerns: this.summarizeConcerns(detectionResult)
              }
            }
          }
        });
      }
    }
  }

  private static summarizeConcerns(result: AIDetectionResult): string[] {
    const concerns: string[] = [];
    
    if (result.stylometricAnalysis.deviationFromBaseline > 50) {
      concerns.push('Significant deviation from typical writing style');
    }
    if (result.behavioralAnalysis.copyPasteEvents > 3) {
      concerns.push('Multiple copy-paste events detected');
    }
    if (result.aiPatternAnalysis.formulaicStructure) {
      concerns.push('Formulaic structure typical of AI writing');
    }
    if (result.aiPatternAnalysis.lackOfPersonalVoice) {
      concerns.push('Lack of personal voice or perspective');
    }
    
    return concerns;
  }
}