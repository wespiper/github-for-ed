import { v4 as uuidv4 } from 'uuid';
import { AIBoundaryService } from '../AIBoundaryService';
import { AuthenticityDetector } from './AuthenticityDetector';
import { ReflectionCacheService } from '../cache/ReflectionCacheService';
import { ServiceFactory } from '../../container/ServiceFactory';
import { CacheKeyBuilder, CacheTTL } from '../../cache/CacheService';
import { 
  AIInteractionLoggedEvent, 
  StudentProgressUpdatedEvent,
  EventTypes 
} from '../../events/events';

export interface ReflectionAnalysis {
  // Multi-dimensional assessment
  depth: {
    score: number; // 0-100
    reasoningChains: number; // How many "because" connections
    abstractionLevel: number; // Concrete (1) to abstract (5)
    evidenceOfThinking: string[]; // Specific phrases showing thought
  };
  
  // Metacognitive indicators
  selfAwareness: {
    recognizesGaps: boolean;
    questionsAssumptions: boolean;
    identifiesLearningProcess: boolean;
    articulatesStruggle: boolean;
    score: number; // 0-100
  };
  
  // Critical thinking
  criticalEngagement: {
    challengesAIPrompts: boolean;
    offersAlternatives: boolean;
    evaluatesMultiplePerspectives: boolean;
    synthesizesIdeas: boolean;
    score: number; // 0-100
  };
  
  // Growth indicators  
  growthMindset: {
    focusOnLearning: boolean; // vs. performance
    embracesChallenge: boolean;
    seeksImprovement: boolean;
    score: number; // 0-100
  };
  
  // Overall assessment
  overall: {
    qualityScore: number; // 0-100
    authenticityScore: number; // 0-100 (vs. performative)
    progressiveAccessLevel: 'restricted' | 'basic' | 'standard' | 'enhanced';
    recommendations: string[];
  };
}

export class ReflectionAnalysisService {
  private static serviceFactory = ServiceFactory.getInstance();

  /**
   * Analyze reflection quality with NLP-enhanced assessment
   */
  static async analyzeReflection(
    reflection: string,
    context: {
      studentId: string;
      assignmentId: string;
      aiInteractionId: string;
      writingStage: string;
    }
  ): Promise<ReflectionAnalysis> {
    const correlationId = uuidv4();
    const cache = this.serviceFactory.getCache();
    const eventBus = this.serviceFactory.getEventBus();

    // Check cache first
    const reflectionHash = ReflectionCacheService.hashReflection(reflection);
    const cacheKey = CacheKeyBuilder.reflectionQuality(`${context.studentId}:${context.assignmentId}:${reflectionHash}`);
    const cached = await cache.get<ReflectionAnalysis>(cacheKey);
    
    if (cached) {
      console.log('Cache hit for reflection analysis');
      return cached;
    }

    // Log AI interaction
    await eventBus.publish<AIInteractionLoggedEvent>({
      type: EventTypes.AI_INTERACTION_LOGGED,
      correlationId,
      timestamp: new Date(),
      payload: {
        studentId: context.studentId,
        courseId: '', // Would need to fetch from assignment
        assignmentId: context.assignmentId,
        interactionType: 'feedback_request',
        aiService: 'reflection_analyzer',
        request: {
          content: 'Analyze reflection quality',
          context: { reflectionLength: reflection.length }
        },
        response: {
          content: 'Processing reflection analysis',
          educationalValue: 0.9
        },
        duration: 0 // Will update later
      },
      metadata: { userId: context.studentId }
    });

    const startTime = Date.now();

    // Phase detection patterns
    const patterns = {
      reasoning: {
        phrases: ['because', 'therefore', 'since', 'as a result', 'this means', 'which explains'],
        weight: 15
      },
      complexity: {
        phrases: ['however', 'although', 'on the other hand', 'while', 'despite', 'alternatively'],
        weight: 20
      },
      metacognition: {
        phrases: ['I realize', 'I notice', 'I wonder', 'I\'m thinking', 'my process', 'I struggle with'],
        weight: 25
      },
      growth: {
        phrases: ['I learned', 'next time', 'I could improve', 'helps me understand', 'I want to try'],
        weight: 20
      },
      specificity: {
        // Check for concrete examples vs. vague statements
        patterns: /".+"|'.+'|for example|specifically|such as/gi,
        weight: 20
      }
    };

    // Calculate scores
    const depth = this.calculateDepthScore(reflection, patterns);
    const selfAwareness = this.assessSelfAwareness(reflection);
    const criticalEngagement = this.assessCriticalThinking(reflection);
    const growthMindset = this.assessGrowthMindset(reflection);
    
    // Check authenticity (vs. gaming)
    const authenticity = await this.assessAuthenticity(reflection, context);
    
    // Calculate overall quality
    const overallScore = (
      depth.score * 0.25 + 
      selfAwareness.score * 0.25 + 
      criticalEngagement.score * 0.25 + 
      growthMindset.score * 0.25
    );
    
    // Determine progressive access level
    const accessLevel = this.calculateAccessLevel(overallScore, authenticity.score);
    
    // Create analysis result
    const analysis: ReflectionAnalysis = {
      depth,
      selfAwareness,
      criticalEngagement,
      growthMindset,
      overall: {
        qualityScore: overallScore,
        authenticityScore: authenticity.score,
        progressiveAccessLevel: accessLevel,
        recommendations: this.generateRecommendations(overallScore, authenticity)
      }
    };

    // Store analysis in database
    await this.storeAnalysis(context, analysis, reflection);
    
    // Cache the result
    await cache.set(cacheKey, analysis, { ttl: CacheTTL.REFLECTION_QUALITY });

    // Publish progress update event
    await eventBus.publish<StudentProgressUpdatedEvent>({
      type: EventTypes.STUDENT_PROGRESS_UPDATED,
      correlationId,
      timestamp: new Date(),
      payload: {
        studentIdHash: context.studentId, // Using studentId as hash for now
        courseId: '', // Would need to fetch from assignment
        assignmentId: context.assignmentId,
        progressType: 'reflection',
        metrics: {
          reflectionQuality: overallScore,
          aiInteractionCount: 1
        },
        currentState: {
          reflectionDepth: depth.score,
          selfAwareness: selfAwareness.score,
          criticalThinking: criticalEngagement.score,
          growthMindset: growthMindset.score,
          accessLevel
        }
      },
      privacyContext: {
        dataMinimized: true,
        consentVerified: true,
        educationalPurpose: 'reflection_quality_analysis',
        retentionPeriod: 90
      },
      metadata: { userId: context.studentId }
    });

    // Update AI interaction duration
    const duration = Date.now() - startTime;
    await eventBus.publish<AIInteractionLoggedEvent>({
      type: EventTypes.AI_INTERACTION_LOGGED,
      correlationId,
      timestamp: new Date(),
      payload: {
        studentId: context.studentId,
        courseId: '',
        assignmentId: context.assignmentId,
        interactionType: 'feedback_request',
        aiService: 'reflection_analyzer',
        request: {
          content: 'Analyze reflection quality',
          context: { reflectionLength: reflection.length }
        },
        response: {
          content: 'Reflection analysis completed',
          educationalValue: 0.9
        },
        duration,
        bloomsLevel: this.determineBloomsLevel(overallScore)
      },
      metadata: { userId: context.studentId }
    });
    
    return analysis;
  }

  private static calculateDepthScore(reflection: string, patterns: any): any {
    const words = reflection.split(/\s+/).length;
    const sentences = reflection.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    
    // Count reasoning indicators
    let reasoningCount = 0;
    patterns.reasoning.phrases.forEach((phrase: string) => {
      const matches = (reflection.match(new RegExp(phrase, 'gi')) || []).length;
      reasoningCount += matches;
    });
    
    // Calculate reasoning chains (how many connected thoughts)
    const reasoningChains = Math.min(reasoningCount, 5); // Cap at 5
    
    // Assess abstraction level
    const abstractionLevel = this.assessAbstractionLevel(reflection);
    
    // Evidence of thinking
    const evidenceOfThinking = this.extractThinkingEvidence(reflection);
    
    // Calculate score
    const lengthScore = Math.min(words / 200 * 30, 30); // 30 points for length
    const reasoningScore = (reasoningChains / 5) * 40; // 40 points for reasoning
    const abstractionScore = (abstractionLevel / 5) * 30; // 30 points for abstraction
    
    return {
      score: Math.round(lengthScore + reasoningScore + abstractionScore),
      reasoningChains,
      abstractionLevel,
      evidenceOfThinking
    };
  }

  private static assessSelfAwareness(reflection: string): any {
    const lowerReflection = reflection.toLowerCase();
    
    // Check for self-awareness indicators
    const recognizesGaps = /didn't|don't know|unsure|confused|need to learn|gap in/.test(lowerReflection);
    const questionsAssumptions = /assumed|thought.*but|realized|reconsidered|questioned/.test(lowerReflection);
    const identifiesLearningProcess = /my process|how i|when i|i tend to|my approach/.test(lowerReflection);
    const articulatesStruggle = /struggle|difficult|challenging|hard for me|trouble with/.test(lowerReflection);
    
    // Calculate score based on indicators
    let score = 25; // Base score
    if (recognizesGaps) score += 20;
    if (questionsAssumptions) score += 20;
    if (identifiesLearningProcess) score += 20;
    if (articulatesStruggle) score += 15;
    
    return {
      recognizesGaps,
      questionsAssumptions,
      identifiesLearningProcess,
      articulatesStruggle,
      score: Math.min(score, 100)
    };
  }

  private static assessCriticalThinking(reflection: string): any {
    const lowerReflection = reflection.toLowerCase();
    
    // Check for critical thinking indicators
    const challengesAIPrompts = /but i think|disagree|not sure about|question whether|wonder if the ai/.test(lowerReflection);
    const offersAlternatives = /instead|alternatively|another way|different approach|could also/.test(lowerReflection);
    const evaluatesMultiplePerspectives = /perspective|viewpoint|others might|some people|different opinion/.test(lowerReflection);
    const synthesizesIdeas = /connects to|relates to|builds on|combines|together these/.test(lowerReflection);
    
    // Calculate score
    let score = 20; // Base score
    if (challengesAIPrompts) score += 25;
    if (offersAlternatives) score += 20;
    if (evaluatesMultiplePerspectives) score += 20;
    if (synthesizesIdeas) score += 15;
    
    return {
      challengesAIPrompts,
      offersAlternatives,
      evaluatesMultiplePerspectives,
      synthesizesIdeas,
      score: Math.min(score, 100)
    };
  }

  private static assessGrowthMindset(reflection: string): any {
    const lowerReflection = reflection.toLowerCase();
    
    // Check for growth mindset indicators
    const focusOnLearning = /learn|understand|improve|develop|grow|discover/.test(lowerReflection);
    const embracesChallenge = /challenge|push myself|try harder|opportunity|excited to/.test(lowerReflection);
    const seeksImprovement = /next time|will try|want to|plan to|goal is/.test(lowerReflection);
    
    // Calculate score
    let score = 25; // Base score
    if (focusOnLearning) score += 25;
    if (embracesChallenge) score += 25;
    if (seeksImprovement) score += 25;
    
    return {
      focusOnLearning,
      embracesChallenge,
      seeksImprovement,
      score: Math.min(score, 100)
    };
  }

  private static assessAbstractionLevel(reflection: string): number {
    // Simple heuristic for abstraction level
    const abstractIndicators = [
      'concept', 'theory', 'principle', 'framework', 'pattern',
      'systematic', 'abstract', 'generalize', 'universal', 'paradigm'
    ];
    
    const concreteIndicators = [
      'specific', 'example', 'particular', 'instance', 'detail',
      'exactly', 'precisely', 'literally', 'actual', 'real'
    ];
    
    const lowerReflection = reflection.toLowerCase();
    let abstractCount = 0;
    let concreteCount = 0;
    
    abstractIndicators.forEach(indicator => {
      if (lowerReflection.includes(indicator)) abstractCount++;
    });
    
    concreteIndicators.forEach(indicator => {
      if (lowerReflection.includes(indicator)) concreteCount++;
    });
    
    // Calculate level (1-5)
    if (abstractCount > concreteCount * 2) return 5;
    if (abstractCount > concreteCount) return 4;
    if (abstractCount === concreteCount && abstractCount > 0) return 3;
    if (concreteCount > abstractCount) return 2;
    return 1;
  }

  private static extractThinkingEvidence(reflection: string): string[] {
    const evidence: string[] = [];
    const sentences = reflection.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    const thinkingIndicators = [
      'realize', 'understand', 'notice', 'wonder', 'think',
      'believe', 'assume', 'conclude', 'discover', 'learn'
    ];
    
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      if (thinkingIndicators.some(indicator => lowerSentence.includes(indicator))) {
        evidence.push(sentence.trim());
      }
    });
    
    return evidence.slice(0, 3); // Return top 3 examples
  }

  private static async assessAuthenticity(reflection: string, context: any): Promise<any> {
    try {
      // Use enhanced AuthenticityDetector
      const authenticityAnalysis = await AuthenticityDetector.analyzeAuthenticity(
        reflection,
        context.studentId,
        context.assignmentId
      );
      
      return {
        score: authenticityAnalysis.score,
        flags: authenticityAnalysis.flags,
        confidence: authenticityAnalysis.confidence,
        recommendations: authenticityAnalysis.recommendations
      };
    } catch (error) {
      console.error('Error assessing authenticity:', error);
      
      // Fallback to simple authenticity check
      let authenticityScore = 80;
      
      // Basic formulaic pattern check
      const formulaicPhrases = [
        'the ai helped me think',
        'these questions made me realize',
        'i learned from this interaction',
        'this was helpful because'
      ];
      
      const lowerReflection = reflection.toLowerCase();
      let formulaicCount = 0;
      formulaicPhrases.forEach(phrase => {
        if (lowerReflection.includes(phrase)) formulaicCount++;
      });
      
      if (formulaicCount >= 3) {
        authenticityScore -= 20;
      }
      
      // Length check
      const words = reflection.split(/\s+/).length;
      if (words < 50) {
        authenticityScore -= 15;
      }
      
      return { 
        score: Math.max(authenticityScore, 0),
        flags: [],
        confidence: 50,
        recommendations: []
      };
    }
  }

  private static calculateSimilarity(text1: string, text2: string): number {
    // Simple Jaccard similarity for words
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  private static calculateAccessLevel(qualityScore: number, authenticityScore: number): 'restricted' | 'basic' | 'standard' | 'enhanced' {
    if (authenticityScore < 50) return 'restricted'; // Gaming detected
    if (qualityScore >= 80 && authenticityScore >= 80) return 'enhanced';
    if (qualityScore >= 60 && authenticityScore >= 70) return 'standard';
    if (qualityScore >= 40 && authenticityScore >= 60) return 'basic';
    return 'restricted';
  }

  private static generateRecommendations(qualityScore: number, authenticity: any): string[] {
    const recommendations: string[] = [];
    
    if (qualityScore < 40) {
      recommendations.push('Try to explain your thinking in more detail');
      recommendations.push('Include specific examples from your writing');
      recommendations.push('Describe what you learned from the AI questions');
    } else if (qualityScore < 60) {
      recommendations.push('Reflect on how the questions changed your approach');
      recommendations.push('Consider alternative perspectives mentioned');
      recommendations.push('Explain your reasoning process more clearly');
    } else if (qualityScore < 80) {
      recommendations.push('Deepen your analysis of the learning process');
      recommendations.push('Connect insights to broader writing principles');
      recommendations.push('Challenge yourself to think more critically');
    } else {
      recommendations.push('Excellent reflection! Keep exploring complex ideas');
      recommendations.push('Consider mentoring peers in reflection practices');
      recommendations.push('Apply these insights to other writing contexts');
    }
    
    if (authenticity.score < 70) {
      recommendations.push('Make your reflections more personal and specific');
      recommendations.push('Avoid generic statements - share your unique thoughts');
    }
    
    return recommendations;
  }

  private static async storeAnalysis(context: any, analysis: ReflectionAnalysis, reflectionText: string): Promise<void> {
    try {
      const serviceFactory = this.serviceFactory;
      
      // Note: This would normally get the reflection analysis repository from service factory
      // For now, import directly until ServiceFactory is updated
      const { PrismaReflectionAnalysisRepository } = await import('../../repositories/ReflectionRepository');
      const reflectionAnalysisRepo = new PrismaReflectionAnalysisRepository();
      
      await reflectionAnalysisRepo.create({
        studentId: context.studentId,
        assignmentId: context.assignmentId,
        aiInteractionId: context.aiInteractionId,
        reflectionText,
        depthScore: analysis.depth.score,
        reasoningChains: analysis.depth.reasoningChains,
        abstractionLevel: analysis.depth.abstractionLevel,
        evidenceOfThinking: analysis.depth.evidenceOfThinking,
        selfAwarenessScore: analysis.selfAwareness.score,
        recognizesGaps: analysis.selfAwareness.recognizesGaps,
        questionsAssumptions: analysis.selfAwareness.questionsAssumptions,
        identifiesLearningProcess: analysis.selfAwareness.identifiesLearningProcess,
        articulatesStruggle: analysis.selfAwareness.articulatesStruggle,
        criticalThinkingScore: analysis.criticalEngagement.score,
        challengesAIPrompts: analysis.criticalEngagement.challengesAIPrompts,
        offersAlternatives: analysis.criticalEngagement.offersAlternatives,
        evaluatesPerspectives: analysis.criticalEngagement.evaluatesMultiplePerspectives,
        synthesizesIdeas: analysis.criticalEngagement.synthesizesIdeas,
        growthMindsetScore: analysis.growthMindset.score,
        focusOnLearning: analysis.growthMindset.focusOnLearning,
        embracesChallenge: analysis.growthMindset.embracesChallenge,
        seeksImprovement: analysis.growthMindset.seeksImprovement,
        overallQualityScore: analysis.overall.qualityScore,
        authenticityScore: analysis.overall.authenticityScore,
        progressiveAccessLevel: analysis.overall.progressiveAccessLevel,
        recommendations: analysis.overall.recommendations
      });
      
      console.log('Reflection analysis stored successfully', {
        studentId: context.studentId,
        assignmentId: context.assignmentId,
        qualityScore: analysis.overall.qualityScore,
        authenticityScore: analysis.overall.authenticityScore
      });
    } catch (error) {
      console.error('Error storing reflection analysis:', error);
    }
  }

  /**
   * Get student's reflection history for pattern analysis
   */
  static async getStudentReflectionHistory(
    studentId: string,
    assignmentId?: string
  ): Promise<{
    totalReflections: number;
    averageQuality: number;
    qualityTrend: 'improving' | 'stable' | 'declining';
    strengths: string[];
    areasForGrowth: string[];
  }> {
    const cache = this.serviceFactory.getCache();

    try {
      // Check cache first
      const cacheKey = CacheKeyBuilder.studentLearningState(studentId, assignmentId || 'reflections');
      const cached = await cache.get<any>(cacheKey);
      if (cached) {
        console.log('Cache hit for reflection history');
        return cached;
      }

      // Get reflection analyses from repository
      const { PrismaReflectionAnalysisRepository } = await import('../../repositories/ReflectionRepository');
      const reflectionAnalysisRepo = new PrismaReflectionAnalysisRepository();
      
      const reflections = await reflectionAnalysisRepo.findByStudent(studentId, {
        assignmentId,
        limit: 20
      });
      
      if (reflections.length === 0) {
        return {
          totalReflections: 0,
          averageQuality: 0,
          qualityTrend: 'stable',
          strengths: [],
          areasForGrowth: ['Begin building reflection practice']
        };
      }
      
      // Extract quality scores
      const qualityScores = reflections.map(r => r.overallQualityScore);
      
      const averageQuality = Math.round(
        qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
      );
      
      // Calculate trend
      let qualityTrend: 'improving' | 'stable' | 'declining' = 'stable';
      if (qualityScores.length >= 3) {
        const recent = qualityScores.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
        const older = qualityScores.slice(-3).reduce((a, b) => a + b, 0) / 3;
        
        if (recent > older + 10) qualityTrend = 'improving';
        else if (recent < older - 10) qualityTrend = 'declining';
      }
      
      // Identify strengths and growth areas from latest reflection
      const strengths: string[] = [];
      const areasForGrowth: string[] = [];
      
      const latest = reflections[0];
      if (latest) {
        if (latest.depthScore > 70) strengths.push('Deep thinking');
        if (latest.selfAwarenessScore > 70) strengths.push('Self-awareness');
        if (latest.criticalThinkingScore > 70) strengths.push('Critical thinking');
        if (latest.growthMindsetScore > 70) strengths.push('Growth mindset');
        
        if (latest.depthScore < 50) areasForGrowth.push('Develop deeper analysis');
        if (latest.selfAwarenessScore < 50) areasForGrowth.push('Increase self-reflection');
        if (latest.criticalThinkingScore < 50) areasForGrowth.push('Strengthen critical thinking');
        if (latest.growthMindsetScore < 50) areasForGrowth.push('Cultivate growth mindset');
      }
      
      const result = {
        totalReflections: reflections.length,
        averageQuality,
        qualityTrend,
        strengths,
        areasForGrowth
      };
      
      // Cache the result
      await cache.set(cacheKey, result, { ttl: CacheTTL.STUDENT_STATE });
      
      return result;
    } catch (error) {
      console.error('Error getting reflection history:', error);
      return {
        totalReflections: 0,
        averageQuality: 0,
        qualityTrend: 'stable',
        strengths: [],
        areasForGrowth: []
      };
    }
  }

  /**
   * Calculate reflection requirements based on student history
   */
  static async calculateRequirements(
    studentId: string,
    questions: any
  ): Promise<{
    minimumLength: number;
    qualityThreshold: 'basic' | 'detailed' | 'analytical';
    prompts: string[];
  }> {
    const history = await this.getStudentReflectionHistory(studentId);
    
    // Adjust requirements based on history
    let minimumLength = 100;
    let qualityThreshold: 'basic' | 'detailed' | 'analytical' = 'basic';
    const prompts: string[] = [];
    
    if (history.averageQuality < 40) {
      minimumLength = 150;
      qualityThreshold = 'detailed';
      prompts.push(
        'Explain specifically how these questions changed your thinking',
        'What assumptions did you discover in your writing?',
        'How will you apply these insights to improve your work?'
      );
    } else if (history.averageQuality < 60) {
      minimumLength = 120;
      qualityThreshold = 'detailed';
      prompts.push(
        'Describe your thought process as you considered these questions',
        'What new perspectives did you gain?',
        'How does this connect to your learning goals?'
      );
    } else if (history.averageQuality >= 80) {
      minimumLength = 100;
      qualityThreshold = 'analytical';
      prompts.push(
        'Analyze how this interaction advanced your critical thinking',
        'What deeper patterns do you notice in your writing development?',
        'How might you apply these insights beyond this assignment?'
      );
    } else {
      prompts.push(
        'How did these questions help you think differently about your writing?',
        'What specific changes will you make based on this guidance?'
      );
    }
    
    return {
      minimumLength,
      qualityThreshold,
      prompts
    };
  }

  private static determineBloomsLevel(qualityScore: number): 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create' {
    if (qualityScore >= 90) return 'create';
    if (qualityScore >= 80) return 'evaluate';
    if (qualityScore >= 70) return 'analyze';
    if (qualityScore >= 60) return 'apply';
    if (qualityScore >= 40) return 'understand';
    return 'remember';
  }
}