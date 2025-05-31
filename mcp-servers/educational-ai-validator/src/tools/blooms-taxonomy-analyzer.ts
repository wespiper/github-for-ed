import { BloomsTaxonomyKeywords } from '../utils/blooms-taxonomy-keywords.js';
import { BloomsTaxonomyAssessment } from '../types/validation-results.js';

export class BloomsTaxonomyAnalyzer {
  static async analyze(
    questions: string[], 
    targetLevel?: number, 
    academicLevel?: string
  ): Promise<BloomsTaxonomyAssessment> {
    
    const questionLevels = questions.map(question => 
      this.analyzeQuestionLevel(question)
    );

    const distribution = this.calculateDistribution(questionLevels);
    const overallLevel = this.calculateOverallLevel(questionLevels);
    const recommendations = this.generateRecommendations(
      questionLevels, 
      targetLevel, 
      academicLevel
    );

    const educationalAlignment = this.assessEducationalAlignment(
      overallLevel,
      targetLevel,
      academicLevel
    );

    return {
      overallLevel,
      questionLevels,
      distribution,
      recommendations,
      educationalAlignment
    };
  }

  private static analyzeQuestionLevel(question: string): {
    question: string;
    level: number;
    confidence: number;
    reasoning: string;
  } {
    const questionLower = question.toLowerCase();
    const keywords = BloomsTaxonomyKeywords.getKeywords();
    
    let detectedLevel = 1;
    let confidence = 0;
    let reasoning = '';
    
    // Check for explicit Bloom's verbs (highest confidence)
    for (let level = 6; level >= 1; level--) {
      const levelKeywords = keywords[level];
      for (const keyword of levelKeywords.primary) {
        if (questionLower.includes(keyword)) {
          detectedLevel = level;
          confidence = 0.9;
          reasoning = `Contains primary Bloom's verb: "${keyword}"`;
          return { question, level: detectedLevel, confidence, reasoning };
        }
      }
    }

    // Check for secondary indicators
    for (let level = 6; level >= 1; level--) {
      const levelKeywords = keywords[level];
      for (const keyword of levelKeywords.secondary || []) {
        if (questionLower.includes(keyword)) {
          detectedLevel = level;
          confidence = 0.7;
          reasoning = `Contains secondary indicator: "${keyword}"`;
          break;
        }
      }
      if (confidence > 0) break;
    }

    // Pattern-based analysis for complex questions
    if (confidence === 0) {
      const patterns = this.analyzeQuestionPatterns(question);
      detectedLevel = patterns.level;
      confidence = patterns.confidence;
      reasoning = patterns.reasoning;
    }

    return { question, level: detectedLevel, confidence, reasoning };
  }

  private static analyzeQuestionPatterns(question: string): {
    level: number;
    confidence: number;
    reasoning: string;
  } {
    const questionLower = question.toLowerCase();

    // Level 6 - Create patterns
    if (questionLower.includes('design') || 
        questionLower.includes('develop a new') ||
        questionLower.includes('create an original') ||
        questionLower.includes('compose') ||
        questionLower.includes('construct a plan')) {
      return {
        level: 6,
        confidence: 0.8,
        reasoning: 'Pattern suggests creation/synthesis activity'
      };
    }

    // Level 5 - Evaluate patterns
    if (questionLower.includes('judge') ||
        questionLower.includes('critique') ||
        questionLower.includes('assess the value') ||
        questionLower.includes('evaluate the effectiveness') ||
        (questionLower.includes('which is better') && questionLower.includes('why'))) {
      return {
        level: 5,
        confidence: 0.8,
        reasoning: 'Pattern suggests evaluation/judgment activity'
      };
    }

    // Level 4 - Analyze patterns
    if (questionLower.includes('why') && 
        (questionLower.includes('different') || questionLower.includes('similar')) ||
        questionLower.includes('what evidence') ||
        questionLower.includes('what factors') ||
        questionLower.includes('how does this relate')) {
      return {
        level: 4,
        confidence: 0.75,
        reasoning: 'Pattern suggests analytical thinking'
      };
    }

    // Level 3 - Apply patterns
    if (questionLower.includes('how would you use') ||
        questionLower.includes('apply this to') ||
        questionLower.includes('what would happen if') ||
        questionLower.includes('solve this problem')) {
      return {
        level: 3,
        confidence: 0.7,
        reasoning: 'Pattern suggests application activity'
      };
    }

    // Level 2 - Understand patterns
    if (questionLower.includes('explain why') ||
        questionLower.includes('what does this mean') ||
        questionLower.includes('summarize') ||
        questionLower.includes('interpret')) {
      return {
        level: 2,
        confidence: 0.6,
        reasoning: 'Pattern suggests comprehension activity'
      };
    }

    // Level 1 - Remember patterns (default)
    return {
      level: 1,
      confidence: 0.5,
      reasoning: 'No clear higher-order thinking patterns detected'
    };
  }

  private static calculateDistribution(questionLevels: any[]): any {
    const distribution = {
      remember: 0,
      understand: 0,
      apply: 0,
      analyze: 0,
      evaluate: 0,
      create: 0
    };

    const levelNames = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
    
    questionLevels.forEach(q => {
      const levelName = levelNames[q.level - 1];
      distribution[levelName as keyof typeof distribution]++;
    });

    // Convert to percentages
    const total = questionLevels.length;
    if (total > 0) {
      Object.keys(distribution).forEach(key => {
        distribution[key as keyof typeof distribution] = 
          Math.round((distribution[key as keyof typeof distribution] / total) * 100);
      });
    }

    return distribution;
  }

  private static calculateOverallLevel(questionLevels: any[]): number {
    if (questionLevels.length === 0) return 1;

    // Weighted average with confidence
    const weightedSum = questionLevels.reduce((sum, q) => 
      sum + (q.level * q.confidence), 0
    );
    const totalWeight = questionLevels.reduce((sum, q) => 
      sum + q.confidence, 0
    );

    return Math.round(weightedSum / totalWeight);
  }

  private static generateRecommendations(
    questionLevels: any[], 
    targetLevel?: number, 
    academicLevel?: string
  ): string[] {
    const recommendations: string[] = [];
    const overallLevel = this.calculateOverallLevel(questionLevels);

    // Target level recommendations
    if (targetLevel && overallLevel < targetLevel) {
      recommendations.push(
        `Current question level (${overallLevel}) is below target (${targetLevel}). ` +
        `Consider adding more complex analytical or evaluative questions.`
      );
    }

    // Academic level appropriateness
    const expectedLevels: Record<string, number> = {
      'elementary': 2,
      'middle': 3,
      'high': 4,
      'undergraduate': 4,
      'graduate': 5
    };

    if (academicLevel && expectedLevels[academicLevel]) {
      const expected = expectedLevels[academicLevel];
      if (overallLevel < expected) {
        recommendations.push(
          `For ${academicLevel} level, consider increasing cognitive complexity ` +
          `to level ${expected} (currently ${overallLevel})`
        );
      }
    }

    // Distribution recommendations
    const distribution = this.calculateDistribution(questionLevels);
    
    if (distribution.remember > 40) {
      recommendations.push(
        'Too many recall-based questions. Add more analysis and application questions.'
      );
    }

    if (distribution.analyze + distribution.evaluate + distribution.create < 30) {
      recommendations.push(
        'Add more higher-order thinking questions (analyze, evaluate, create).'
      );
    }

    if (questionLevels.some(q => q.confidence < 0.6)) {
      recommendations.push(
        'Some questions have ambiguous cognitive levels. Use clearer Bloom\'s taxonomy verbs.'
      );
    }

    // Specific level recommendations
    if (distribution.create === 0 && (academicLevel === 'undergraduate' || academicLevel === 'graduate')) {
      recommendations.push(
        'Consider adding creation-level questions to challenge advanced students.'
      );
    }

    if (distribution.apply === 0) {
      recommendations.push(
        'No application questions detected. Add questions that ask students to use concepts in new situations.'
      );
    }

    // Balance recommendations
    const levels = questionLevels.map(q => q.level);
    const uniqueLevels = new Set(levels);
    if (uniqueLevels.size < 3 && questionLevels.length >= 3) {
      recommendations.push(
        'Questions lack variety in cognitive levels. Aim for a mix of different thinking levels.'
      );
    }

    return recommendations;
  }

  private static assessEducationalAlignment(
    actualLevel: number,
    targetLevel?: number,
    academicLevel?: string
  ): any {
    const target = targetLevel || this.getDefaultTargetLevel(academicLevel);
    
    return {
      isAppropriate: Math.abs(actualLevel - target) <= 1,
      targetLevel: target,
      actualLevel,
      adjustment: actualLevel < target ? 
        'increase_complexity' : 
        actualLevel > target ? 'decrease_complexity' : 'maintain_level'
    };
  }

  private static getDefaultTargetLevel(academicLevel?: string): number {
    const defaults: Record<string, number> = {
      'elementary': 2,
      'middle': 3,
      'high': 4,
      'undergraduate': 4,
      'graduate': 5
    };

    return defaults[academicLevel || 'undergraduate'] || 4;
  }
}