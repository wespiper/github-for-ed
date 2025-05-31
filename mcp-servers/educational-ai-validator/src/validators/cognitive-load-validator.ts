import { ValidationResult } from '../types/validation-results.js';

export class CognitiveLoadValidator {
  async validateAppropriateComplexity(
    questions: string[],
    currentCognitiveLoad: 'low' | 'optimal' | 'high' | 'overload',
    academicLevel: string
  ): Promise<ValidationResult> {
    const issues: string[] = [];
    let score = 100;

    // Calculate average complexity of questions
    const complexityScores = questions.map(q => this.calculateQuestionComplexity(q));
    const averageComplexity = complexityScores.reduce((a, b) => a + b, 0) / complexityScores.length;

    // Define appropriate complexity ranges based on cognitive load
    const complexityTargets: Record<string, { min: number; max: number; ideal: number }> = {
      low: { min: 50, max: 90, ideal: 70 },      // Can handle more challenge
      optimal: { min: 40, max: 80, ideal: 60 },  // Balanced challenge
      high: { min: 20, max: 60, ideal: 40 },     // Reduce complexity
      overload: { min: 10, max: 40, ideal: 25 }  // Minimal complexity
    };

    const target = complexityTargets[currentCognitiveLoad];

    // Check if complexity matches cognitive load state
    if (averageComplexity > target.max) {
      const excess = averageComplexity - target.max;
      score -= Math.min(40, Math.floor(excess / 2));
      issues.push(`Questions too complex for ${currentCognitiveLoad} cognitive load (avg: ${Math.round(averageComplexity)}, max: ${target.max})`);
    } else if (averageComplexity < target.min) {
      const deficit = target.min - averageComplexity;
      score -= Math.min(30, Math.floor(deficit / 3));
      issues.push(`Questions too simple for ${currentCognitiveLoad} cognitive load (avg: ${Math.round(averageComplexity)}, min: ${target.min})`);
    }

    // Check individual question extremes
    const tooComplex = complexityScores.filter(c => c > target.max + 20).length;
    const tooSimple = complexityScores.filter(c => c < target.min - 20).length;

    if (tooComplex > 0) {
      score -= tooComplex * 10;
      issues.push(`${tooComplex} question(s) significantly exceed complexity threshold`);
    }

    if (tooSimple > 0) {
      score -= tooSimple * 8;
      issues.push(`${tooSimple} question(s) are significantly below complexity threshold`);
    }

    // Academic level adjustment
    const levelMultipliers: Record<string, number> = {
      elementary: 0.6,
      middle: 0.75,
      high: 0.9,
      undergraduate: 1.0,
      graduate: 1.1
    };

    const multiplier = levelMultipliers[academicLevel] || 1.0;
    const adjustedIdeal = target.ideal * multiplier;

    // Bonus points for hitting the sweet spot
    const distanceFromIdeal = Math.abs(averageComplexity - adjustedIdeal);
    if (distanceFromIdeal < 10) {
      score += 10;
    }

    // Special considerations for overload state
    if (currentCognitiveLoad === 'overload') {
      // Check for particularly stressful elements
      const stressfulElements = this.countStressfulElements(questions);
      if (stressfulElements > 0) {
        score -= stressfulElements * 15;
        issues.push(`Questions contain ${stressfulElements} potentially overwhelming elements`);
      }
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      issues,
      passed: score >= 70
    };
  }

  private calculateQuestionComplexity(question: string): number {
    let complexity = 0;

    // Length factor (normalized)
    const wordCount = question.split(/\s+/).length;
    complexity += Math.min(30, wordCount); // Cap at 30 points for length

    // Sentence structure complexity
    const clauses = question.split(/[,;:]/).length;
    complexity += clauses * 5;

    // Conceptual complexity indicators
    const complexConcepts = [
      /analyze|synthesize|evaluate|critique/i,
      /relationship|correlation|causation/i,
      /implications|consequences|ramifications/i,
      /underlying|fundamental|theoretical/i,
      /paradox|contradiction|dilemma/i,
      /nuance|subtlety|complexity/i,
      /multiple.*factors|various.*considerations/i,
      /interdependent|interconnected|systemic/i
    ];

    for (const pattern of complexConcepts) {
      if (pattern.test(question)) {
        complexity += 10;
      }
    }

    // Multi-part questions
    const questionMarks = (question.match(/\?/g) || []).length;
    if (questionMarks > 1) {
      complexity += (questionMarks - 1) * 15;
    }

    // Abstract vs concrete
    const abstractIndicators = [
      /concept|theory|principle|philosophy/i,
      /abstract|theoretical|hypothetical/i,
      /meta-|macro-|micro-/i
    ];

    for (const pattern of abstractIndicators) {
      if (pattern.test(question)) {
        complexity += 8;
      }
    }

    // Cognitive demand indicators
    if (/compare.*contrast.*and.*evaluate/i.test(question)) {
      complexity += 20; // Multiple high-level operations
    } else if (/compare.*contrast/i.test(question)) {
      complexity += 12;
    }

    // Normalize to 0-100 scale
    return Math.min(100, complexity);
  }

  private countStressfulElements(questions: string[]): number {
    let count = 0;

    const stressfulPatterns = [
      /everything|all aspects|entire|comprehensive/i,
      /must include|required to|need to ensure/i,
      /perfect|flawless|without any errors/i,
      /immediately|right now|urgent/i,
      /failure|mistake|wrong|incorrect/i,
      /judge|criticize|evaluate harshly/i
    ];

    for (const question of questions) {
      for (const pattern of stressfulPatterns) {
        if (pattern.test(question)) {
          count++;
          break; // Count each question only once
        }
      }
    }

    return count;
  }
}