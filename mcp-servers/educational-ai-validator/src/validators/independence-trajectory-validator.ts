import { AIResponse } from '../types/educational-contexts.js';
import { ValidationResult } from '../types/validation-results.js';

export interface IndependenceMetrics {
  aiRequestFrequency: number;
  independentWorkStreak: number;
  qualityWithoutAI: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export class IndependenceTrajectoryValidator {
  async validateIndependenceSupport(
    aiResponse: AIResponse,
    studentMetrics: IndependenceMetrics | null
  ): Promise<ValidationResult> {
    const issues: string[] = [];
    let score = 100;

    const questions = aiResponse.questions || [];

    // Check for scaffolding that promotes independence
    const independencePatterns = {
      strategyBuilding: [
        /what strategies/i,
        /how might you approach/i,
        /what methods could/i,
        /develop.*approach/i,
        /plan.*tackle/i
      ],
      resourceIdentification: [
        /what resources/i,
        /where.*find/i,
        /what sources/i,
        /how.*research/i,
        /what tools/i
      ],
      selfEvaluation: [
        /how.*know.*successful/i,
        /evaluate.*own/i,
        /assess.*progress/i,
        /measure.*success/i,
        /criteria.*judge/i
      ],
      metacognition: [
        /thinking process/i,
        /how.*thinking/i,
        /reflect.*approach/i,
        /awareness.*learning/i,
        /monitor.*understanding/i
      ],
      problemDecomposition: [
        /break.*down/i,
        /smaller steps/i,
        /component parts/i,
        /manageable pieces/i,
        /step by step/i
      ]
    };

    // Count independence-building elements
    let independenceElementCount = 0;
    const foundElements: string[] = [];

    for (const [category, patterns] of Object.entries(independencePatterns)) {
      for (const question of questions) {
        for (const pattern of patterns) {
          if (pattern.test(question)) {
            independenceElementCount++;
            foundElements.push(category);
            break; // Count each category once per question
          }
        }
      }
    }

    // Evaluate based on number of questions
    const independenceRatio = questions.length > 0 ? independenceElementCount / questions.length : 0;

    if (independenceRatio < 0.3) {
      score -= 30;
      issues.push('Insufficient independence-building elements in questions');
    } else if (independenceRatio < 0.5) {
      score -= 15;
      issues.push('Limited independence scaffolding');
    } else if (independenceRatio > 0.7) {
      score += 10; // Bonus for strong independence focus
    }

    // Check for dependency-creating patterns
    const dependencyPatterns = [
      /let me.*for you/i,
      /i'll.*help.*write/i,
      /here's what.*should/i,
      /follow these exact/i,
      /just ask me/i,
      /come back.*help/i,
      /rely on.*AI/i,
      /depend on.*assistance/i
    ];

    let dependencyCount = 0;
    for (const question of questions) {
      for (const pattern of dependencyPatterns) {
        if (pattern.test(question)) {
          dependencyCount++;
          score -= 20;
          issues.push(`Dependency-creating language detected: "${question.substring(0, 50)}..."`);
          break;
        }
      }
    }

    // Adjust based on student metrics if available
    if (studentMetrics) {
      // If student is already showing high dependency, require stronger independence building
      if (studentMetrics.aiRequestFrequency > 5) {
        if (independenceElementCount < 3) {
          score -= 20;
          issues.push('Student shows high AI dependency but questions lack strong independence building');
        }
      }

      // If student trend is decreasing independence, penalize lack of scaffolding
      if (studentMetrics.trend === 'decreasing') {
        if (!foundElements.includes('strategyBuilding') && !foundElements.includes('resourceIdentification')) {
          score -= 15;
          issues.push('Student independence declining but questions lack strategy/resource scaffolding');
        }
      }

      // If student has good independent work quality, allow more challenging independence prompts
      if (studentMetrics.qualityWithoutAI > 70) {
        // Check for advanced independence prompts
        const advancedIndependence = questions.some(q => 
          /develop.*own.*framework/i.test(q) ||
          /create.*personal.*approach/i.test(q) ||
          /design.*strategy/i.test(q)
        );
        
        if (advancedIndependence) {
          score += 10;
        }
      }
    }

    // Check for gradual release of responsibility
    const gradualReleaseIndicators = [
      /first.*then.*finally/i,
      /start with.*move to/i,
      /begin by.*progress to/i,
      /initially.*eventually/i,
      /practice.*before/i
    ];

    let hasGradualRelease = false;
    for (const question of questions) {
      for (const pattern of gradualReleaseIndicators) {
        if (pattern.test(question)) {
          hasGradualRelease = true;
          score += 10;
          break;
        }
      }
      if (hasGradualRelease) break;
    }

    // Check for empowerment language
    const empowermentPatterns = [
      /you can/i,
      /you're capable/i,
      /your ability/i,
      /trust your/i,
      /your insight/i,
      /your judgment/i,
      /you've shown/i,
      /your experience/i
    ];

    let empowermentCount = 0;
    for (const question of questions) {
      for (const pattern of empowermentPatterns) {
        if (pattern.test(question)) {
          empowermentCount++;
          break;
        }
      }
    }

    if (empowermentCount === 0 && questions.length > 2) {
      score -= 10;
      issues.push('Lacks empowering language to build student confidence');
    } else if (empowermentCount >= 2) {
      score += 5;
    }

    // Validate progressive challenge
    if (questions.length >= 3) {
      const hasProgressiveChallenge = this.assessProgressiveChallenge(questions);
      if (!hasProgressiveChallenge) {
        score -= 10;
        issues.push('Questions do not show progressive challenge or scaffolding');
      }
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      issues,
      passed: score >= 70
    };
  }

  private assessProgressiveChallenge(questions: string[]): boolean {
    // Simple heuristic: check if questions get progressively more complex
    const complexities = questions.map(q => {
      let complexity = 0;
      
      // Word count
      complexity += q.split(/\s+/).length;
      
      // Cognitive level indicators
      if (/analyze|evaluate|create/i.test(q)) complexity += 10;
      if (/compare|contrast/i.test(q)) complexity += 8;
      if (/explain|describe/i.test(q)) complexity += 5;
      if (/what|when|where/i.test(q)) complexity += 2;
      
      return complexity;
    });

    // Check if there's an upward trend
    let increasingTrend = 0;
    for (let i = 1; i < complexities.length; i++) {
      if (complexities[i] >= complexities[i - 1]) {
        increasingTrend++;
      }
    }

    // At least half should show increase or maintenance
    return increasingTrend >= Math.floor(complexities.length / 2);
  }
}