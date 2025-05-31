import { AIResponse, StudentProfile } from '../types/educational-contexts.js';
import { PrincipleValidationResult } from '../types/validation-results.js';

export abstract class PhilosophyPrinciple {
  abstract validate(response: AIResponse, profile?: StudentProfile): Promise<PrincipleValidationResult>;
}

export class ProductiveStrugglePrinciple extends PhilosophyPrinciple {
  async validate(response: AIResponse, profile?: StudentProfile): Promise<PrincipleValidationResult> {
    const issues: string[] = [];
    const evidence: string[] = [];
    let score = 100;

    const questions = response.questions || [];

    // Check if questions maintain appropriate difficulty
    for (const question of questions) {
      // Check for answer provision
      if (question.includes('Here\'s how') || 
          question.includes('The answer is') ||
          question.includes('You should write')) {
        issues.push('Question provides answer instead of promoting struggle');
        evidence.push(`Answer provided in: "${question.substring(0, 50)}..."`);
        score -= 25;
      }

      // Check for over-simplification
      if (question.includes('Just do') || 
          question.includes('Simply') ||
          question.includes('All you need')) {
        issues.push('Question oversimplifies the challenge');
        evidence.push(`Over-simplification in: "${question.substring(0, 50)}..."`);
        score -= 15;
      }

      // Check if difficulty matches student capacity
      if (profile?.currentState?.cognitiveLoad === 'high') {
        const complexity = this.assessQuestionComplexity(question);
        if (complexity > 3) {
          issues.push('Question too complex for current cognitive load');
          evidence.push('High complexity during student struggle');
          score -= 15;
        }
      }
    }

    // Ensure struggle is productive, not destructive
    if (profile?.currentState?.strugglingDuration && profile.currentState.strugglingDuration > 20) {
      const hasScaffolding = questions.some(q => 
        q.includes('start with') || 
        q.includes('first step') || 
        q.includes('break down')
      );
      
      if (!hasScaffolding) {
        issues.push('Extended struggle without scaffolding support');
        evidence.push('Student struggling >20 minutes without support structure');
        score -= 10;
      }
    }

    // Check for appropriate challenge level
    const challengeIndicators = questions.filter(q => 
      /challenge|stretch|push.*thinking|extend.*understanding/i.test(q)
    ).length;

    if (challengeIndicators === 0 && questions.length > 2) {
      issues.push('Questions lack appropriate challenge');
      evidence.push('No challenge indicators found');
      score -= 10;
    }

    return {
      compliant: score >= 70,
      score: Math.max(0, score),
      issues,
      evidence
    };
  }

  private assessQuestionComplexity(question: string): number {
    let complexity = 1;
    
    if (question.split(/[,;:]/).length > 2) complexity++;
    if (question.split(/\s+/).length > 25) complexity++;
    if (/analyze.*evaluate.*synthesize/i.test(question)) complexity += 2;
    if (/multiple.*factors.*consider/i.test(question)) complexity++;
    
    return complexity;
  }
}

export class CognitiveLoadBalancePrinciple extends PhilosophyPrinciple {
  async validate(response: AIResponse, profile?: StudentProfile): Promise<PrincipleValidationResult> {
    const issues: string[] = [];
    const evidence: string[] = [];
    let score = 100;

    const questions = response.questions || [];
    const cognitiveLoad = profile?.currentState?.cognitiveLoad || 'optimal';

    // Assess question load
    const loadAssessment = this.assessQuestionLoad(questions, cognitiveLoad);
    
    if (loadAssessment.mismatch) {
      issues.push(loadAssessment.issue!);
      evidence.push(loadAssessment.evidence!);
      score -= loadAssessment.penalty;
    }

    // Check for cognitive relief during overload
    if (cognitiveLoad === 'overload') {
      const hasRelief = questions.some(q => 
        /one thing|single aspect|just focus|start small/i.test(q)
      );
      
      if (!hasRelief) {
        issues.push('No cognitive relief offered during overload');
        evidence.push('Student in overload without simplification');
        score -= 20;
      }
    }

    // Check for appropriate challenge during low load
    if (cognitiveLoad === 'low') {
      const hasChallengeIncrease = questions.some(q => 
        /consider also|what if|how might this connect|broader implications/i.test(q)
      );
      
      if (!hasChallengeIncrease) {
        issues.push('Missed opportunity to increase challenge during low load');
        evidence.push('Student has capacity for more challenge');
        score -= 15;
      }
    }

    // Check pacing
    if (questions.length > 5) {
      issues.push('Too many questions at once may overwhelm');
      evidence.push(`${questions.length} questions provided`);
      score -= 15;
    }

    return {
      compliant: score >= 70,
      score: Math.max(0, score),
      issues,
      evidence
    };
  }

  private assessQuestionLoad(questions: string[], cognitiveLoad: string): {
    mismatch: boolean;
    issue?: string;
    evidence?: string;
    penalty: number;
  } {
    const avgComplexity = questions.reduce((sum, q) => {
      let complexity = 0;
      complexity += q.split(/\s+/).length / 10; // Word count factor
      complexity += (q.match(/[,;:]/g) || []).length; // Structural complexity
      complexity += (q.match(/\?/g) || []).length - 1; // Multi-part questions
      return sum + complexity;
    }, 0) / questions.length;

    const loadTargets: Record<string, { min: number; max: number }> = {
      low: { min: 3, max: 8 },
      optimal: { min: 2, max: 6 },
      high: { min: 1, max: 4 },
      overload: { min: 0.5, max: 2 }
    };

    const target = loadTargets[cognitiveLoad];
    
    if (avgComplexity > target.max) {
      return {
        mismatch: true,
        issue: `Questions too complex for ${cognitiveLoad} cognitive load`,
        evidence: `Average complexity ${avgComplexity.toFixed(1)} exceeds max ${target.max}`,
        penalty: Math.min(30, Math.floor((avgComplexity - target.max) * 10))
      };
    }
    
    if (avgComplexity < target.min && cognitiveLoad !== 'overload') {
      return {
        mismatch: true,
        issue: `Questions too simple for ${cognitiveLoad} cognitive load`,
        evidence: `Average complexity ${avgComplexity.toFixed(1)} below min ${target.min}`,
        penalty: Math.min(20, Math.floor((target.min - avgComplexity) * 10))
      };
    }

    return { mismatch: false, penalty: 0 };
  }
}

export class IndependenceTrajectoryPrinciple extends PhilosophyPrinciple {
  async validate(response: AIResponse, profile?: StudentProfile): Promise<PrincipleValidationResult> {
    const issues: string[] = [];
    const evidence: string[] = [];
    let score = 100;

    const questions = response.questions || [];
    const independenceTrend = profile?.independenceMetrics?.trend || 'stable';

    // Check for independence-building elements
    const independenceElements = {
      strategyDevelopment: questions.filter(q => 
        /develop.*approach|create.*strategy|design.*method/i.test(q)
      ).length,
      selfEvaluation: questions.filter(q => 
        /how.*know.*successful|evaluate.*own|assess.*progress/i.test(q)
      ).length,
      resourceIdentification: questions.filter(q => 
        /what resources|where.*find|research strategies/i.test(q)
      ).length,
      metacognition: questions.filter(q => 
        /thinking process|reflect.*approach|aware.*learning/i.test(q)
      ).length
    };

    const totalIndependenceElements = Object.values(independenceElements).reduce((a, b) => a + b, 0);

    // Adjust requirements based on trend
    let requiredElements = 1;
    if (independenceTrend === 'decreasing') {
      requiredElements = 2;
      if (totalIndependenceElements < requiredElements) {
        issues.push('Insufficient independence scaffolding for declining student');
        evidence.push(`Only ${totalIndependenceElements} independence elements when trend is declining`);
        score -= 30;
      }
    } else if (totalIndependenceElements === 0 && questions.length > 1) {
      issues.push('No independence-building elements found');
      evidence.push('Questions lack self-reliance scaffolding');
      score -= 20;
    }

    // Check for dependency-creating language
    const dependencyPhrases = [
      'ask me whenever',
      'I\'ll always be here',
      'don\'t worry about figuring',
      'I can solve this for you'
    ];

    for (const question of questions) {
      for (const phrase of dependencyPhrases) {
        if (question.toLowerCase().includes(phrase)) {
          issues.push('Dependency-creating language detected');
          evidence.push(`Found: "${phrase}"`);
          score -= 25;
        }
      }
    }

    // Check progressive challenge
    if (profile?.independenceMetrics?.qualityWithoutAI && 
        profile.independenceMetrics.qualityWithoutAI > 70) {
      const hasAdvancedChallenge = questions.some(q => 
        /without assistance|independently develop|on your own/i.test(q)
      );
      
      if (!hasAdvancedChallenge) {
        issues.push('Student ready for independence challenges not provided');
        evidence.push('High independent work quality but no independence prompts');
        score -= 15;
      }
    }

    return {
      compliant: score >= 70,
      score: Math.max(0, score),
      issues,
      evidence
    };
  }
}

export class TransferLearningPrinciple extends PhilosophyPrinciple {
  async validate(response: AIResponse, profile?: StudentProfile): Promise<PrincipleValidationResult> {
    const issues: string[] = [];
    const evidence: string[] = [];
    let score = 100;

    const questions = response.questions || [];

    // Check for transfer learning elements
    const transferElements = {
      connection: questions.filter(q => 
        /how.*relate|connect.*to|similar.*to|apply.*other/i.test(q)
      ).length,
      generalization: questions.filter(q => 
        /general principle|broader application|other contexts/i.test(q)
      ).length,
      skillTransfer: questions.filter(q => 
        /use.*skill|apply.*learned|transfer.*knowledge/i.test(q)
      ).length,
      patternRecognition: questions.filter(q => 
        /pattern|similar situations|recognize.*when/i.test(q)
      ).length
    };

    const totalTransferElements = Object.values(transferElements).reduce((a, b) => a + b, 0);

    if (totalTransferElements === 0 && questions.length > 2) {
      issues.push('No transfer learning opportunities provided');
      evidence.push('Questions lack connections to broader applications');
      score -= 25;
    } else if (totalTransferElements === 1 && questions.length > 3) {
      issues.push('Limited transfer learning opportunities');
      evidence.push('Only one transfer element in multiple questions');
      score -= 15;
    }

    // Check for domain-specific limitations
    const domainLimited = questions.filter(q => 
      /only in this|just for this assignment|specific to this text/i.test(q)
    ).length;

    if (domainLimited > 0) {
      issues.push('Questions limit learning to specific context');
      evidence.push('Domain-limiting language detected');
      score -= 20;
    }

    // Check for skill building progression
    if (profile?.strengths) {
      const buildOnStrengths = this.checkStrengthBuilding(questions, profile.strengths);
      if (!buildOnStrengths) {
        issues.push('Missed opportunity to build on student strengths');
        evidence.push('Questions don\'t leverage identified strengths');
        score -= 10;
      }
    }

    return {
      compliant: score >= 70,
      score: Math.max(0, score),
      issues,
      evidence
    };
  }

  private checkStrengthBuilding(questions: string[], strengths: any): boolean {
    const strengthKeywords: Record<string, string[]> = {
      evidenceAnalysis: ['evidence', 'support', 'data', 'research'],
      perspectiveTaking: ['perspective', 'viewpoint', 'consider how', 'point of view'],
      logicalReasoning: ['logic', 'reasoning', 'therefore', 'because'],
      creativeThinking: ['creative', 'innovative', 'original', 'unique'],
      organizationalSkills: ['organize', 'structure', 'outline', 'sequence']
    };

    for (const [strength, score] of Object.entries(strengths)) {
      if ((score as number) > 70 && strengthKeywords[strength]) {
        const keywords = strengthKeywords[strength];
        const leveraged = questions.some(q => 
          keywords.some(keyword => q.toLowerCase().includes(keyword))
        );
        if (leveraged) return true;
      }
    }

    return false;
  }
}

export class TransparentDependencyPrinciple extends PhilosophyPrinciple {
  async validate(response: AIResponse, profile?: StudentProfile): Promise<PrincipleValidationResult> {
    const issues: string[] = [];
    const evidence: string[] = [];
    let score = 100;

    // Check for clear AI attribution
    if (!response.attribution || response.attribution.length < 20) {
      issues.push('Missing or insufficient AI attribution');
      evidence.push('Students need to understand AI\'s role');
      score -= 30;
    }

    // Check for limitations disclosure
    if (!response.limitations || response.limitations.length === 0) {
      issues.push('No AI limitations disclosed');
      evidence.push('Students must understand AI boundaries');
      score -= 25;
    }

    // Check for educational rationale
    if (!response.educationalRationale || response.educationalRationale.length < 50) {
      issues.push('Insufficient educational rationale provided');
      evidence.push('Students deserve transparency about pedagogical choices');
      score -= 20;
    }

    // Check reflection requirements clarity
    if (response.reflectionRequirements) {
      if (!response.reflectionRequirements.assessmentCriteria || 
          response.reflectionRequirements.assessmentCriteria.length === 0) {
        issues.push('Reflection requirements lack clear assessment criteria');
        evidence.push('Students need to understand evaluation standards');
        score -= 15;
      }
    }

    // Check for dependency awareness
    const questions = response.questions || [];
    const hasDependencyAwareness = questions.some(q => 
      /without AI|independent work|own thinking|self-reliance/i.test(q)
    ) || (response.educationalRationale && 
         /independence|self-reliance|autonomous/i.test(response.educationalRationale));

    if (!hasDependencyAwareness && profile?.independenceMetrics?.aiRequestFrequency && 
        profile.independenceMetrics.aiRequestFrequency > 3) {
      issues.push('No acknowledgment of dependency risks for high-frequency user');
      evidence.push('Student uses AI frequently but no independence messaging');
      score -= 15;
    }

    return {
      compliant: score >= 70,
      score: Math.max(0, score),
      issues,
      evidence
    };
  }
}