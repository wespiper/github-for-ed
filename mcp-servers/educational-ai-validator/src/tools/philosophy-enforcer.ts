import { 
  ProductiveStrugglePrinciple,
  CognitiveLoadBalancePrinciple,
  IndependenceTrajectoryPrinciple,
  TransferLearningPrinciple,
  TransparentDependencyPrinciple
} from '../validators/philosophy-principles.js';
import { 
  PhilosophyComplianceResult, 
  PhilosophyViolation, 
  PhilosophyAdjustment 
} from '../types/validation-results.js';

export class PhilosophyEnforcer {
  static async enforce(
    response: any,
    _principles?: any
  ): Promise<PhilosophyComplianceResult> {
    
    // Validate against all Scribe Tree philosophy principles
    const principleResults = {
      productiveStruggle: await new ProductiveStrugglePrinciple().validate(response),
      cognitiveBalance: await new CognitiveLoadBalancePrinciple().validate(response),
      independenceTrajectory: await new IndependenceTrajectoryPrinciple().validate(response),
      transferLearning: await new TransferLearningPrinciple().validate(response),
      transparentDependency: await new TransparentDependencyPrinciple().validate(response)
    };

    const complianceScore = this.calculateComplianceScore(principleResults);
    const overallCompliance = complianceScore >= 80; // 80% threshold
    const violations = this.identifyViolations(principleResults);
    const recommendations = this.generateRecommendations(violations);
    const adjustments = this.generateAdjustments(violations);

    return {
      overallCompliance,
      complianceScore,
      principleResults,
      violations,
      recommendations,
      adjustments
    };
  }

  private static calculateComplianceScore(principleResults: any): number {
    const weights = {
      productiveStruggle: 0.25,      // Core to learning
      cognitiveBalance: 0.20,        // Prevents overwhelm
      independenceTrajectory: 0.25,  // Builds autonomy
      transferLearning: 0.15,        // Skill development
      transparentDependency: 0.15    // Prevents misuse
    };

    let weightedSum = 0;
    for (const [principle, weight] of Object.entries(weights)) {
      weightedSum += principleResults[principle].score * weight;
    }

    return Math.round(weightedSum);
  }

  private static identifyViolations(principleResults: any): PhilosophyViolation[] {
    const violations: PhilosophyViolation[] = [];

    Object.entries(principleResults).forEach(([principle, result]: [string, any]) => {
      if (!result.compliant) {
        const severity = this.determineSeverity(result.score);
        
        violations.push({
          principle,
          severity,
          description: `${this.getPrincipleDescription(principle)} principle violation`,
          evidence: result.issues.join('; '),
          recommendation: this.getPrincipleRecommendation(principle, result.issues)
        });
      }
    });

    return violations;
  }

  private static determineSeverity(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 30) return 'critical';
    if (score < 50) return 'high';
    if (score < 70) return 'medium';
    return 'low';
  }

  private static getPrincipleDescription(principle: string): string {
    const descriptions: Record<string, string> = {
      productiveStruggle: 'Productive Struggle',
      cognitiveBalance: 'Cognitive Load Balance',
      independenceTrajectory: 'Independence Building',
      transferLearning: 'Transfer Learning',
      transparentDependency: 'Transparent AI Dependency'
    };
    
    return descriptions[principle] || principle;
  }

  private static getPrincipleRecommendation(principle: string, issues: string[]): string {
    const recommendations: Record<string, string> = {
      productiveStruggle: 'Ensure questions maintain appropriate challenge without providing answers',
      cognitiveBalance: 'Adjust question complexity to match student cognitive capacity',
      independenceTrajectory: 'Frame questions to build self-reliance and autonomous thinking',
      transferLearning: 'Connect questions to broader skills and transferable knowledge',
      transparentDependency: 'Clearly attribute AI assistance and explain its educational purpose'
    };

    // Add specific recommendations based on issues
    let recommendation = recommendations[principle] || 'Review and adjust based on principle requirements';
    
    if (issues.some(issue => issue.includes('too complex'))) {
      recommendation += '. Simplify questions to reduce cognitive load';
    }
    
    if (issues.some(issue => issue.includes('dependency'))) {
      recommendation += '. Add explicit independence-building scaffolding';
    }
    
    if (issues.some(issue => issue.includes('answer'))) {
      recommendation += '. Rephrase to promote inquiry rather than provide solutions';
    }

    return recommendation;
  }

  private static generateRecommendations(violations: PhilosophyViolation[]): string[] {
    const recommendations: string[] = [];

    // Group by severity
    const critical = violations.filter(v => v.severity === 'critical');
    const high = violations.filter(v => v.severity === 'high');
    const medium = violations.filter(v => v.severity === 'medium');

    if (critical.length > 0) {
      recommendations.push('CRITICAL: Response violates core educational principles and must be revised');
      critical.forEach(v => recommendations.push(`- ${v.recommendation}`));
    }

    if (high.length > 0) {
      recommendations.push('HIGH PRIORITY: Significant philosophical issues require attention');
      high.forEach(v => recommendations.push(`- ${v.recommendation}`));
    }

    if (medium.length > 0) {
      recommendations.push('MEDIUM PRIORITY: Minor adjustments needed for optimal compliance');
      medium.forEach(v => recommendations.push(`- ${v.recommendation}`));
    }

    // Add general recommendations
    if (violations.length === 0) {
      recommendations.push('Response aligns well with educational philosophy principles');
    } else if (violations.length > 3) {
      recommendations.push('Consider comprehensive revision to better align with educational philosophy');
    }

    return recommendations;
  }

  private static generateAdjustments(violations: PhilosophyViolation[]): PhilosophyAdjustment[] {
    const adjustments: PhilosophyAdjustment[] = [];

    violations.forEach(violation => {
      switch (violation.principle) {
        case 'productiveStruggle':
          if (violation.evidence.includes('provides answer')) {
            adjustments.push({
              type: 'rephrase',
              description: 'Convert answer-providing statements into questions',
              priority: 'high',
              example: 'Instead of "The main theme is X", ask "What themes do you notice in this text?"'
            });
          }
          if (violation.evidence.includes('too complex')) {
            adjustments.push({
              type: 'reduce_complexity',
              description: 'Break complex questions into smaller, manageable parts',
              priority: 'high',
              example: 'Split multi-part questions into sequential scaffolded questions'
            });
          }
          break;

        case 'cognitiveBalance':
          if (violation.evidence.includes('too complex')) {
            adjustments.push({
              type: 'reduce_complexity',
              description: 'Simplify questions to match cognitive capacity',
              priority: 'medium',
              example: 'Use simpler vocabulary and shorter sentence structures'
            });
          }
          if (violation.evidence.includes('too simple')) {
            adjustments.push({
              type: 'add_scaffolding',
              description: 'Add complexity while maintaining support',
              priority: 'medium',
              example: 'Add "why" or "how" follow-ups to basic questions'
            });
          }
          break;

        case 'independenceTrajectory':
          if (violation.evidence.includes('No independence-building')) {
            adjustments.push({
              type: 'add_reflection',
              description: 'Add metacognitive reflection prompts',
              priority: 'high',
              example: 'Include "What strategies are you using to approach this problem?"'
            });
          }
          if (violation.evidence.includes('dependency-creating')) {
            adjustments.push({
              type: 'rephrase',
              description: 'Remove dependency-creating language',
              priority: 'high',
              example: 'Replace "Ask me whenever" with "When might you seek help?"'
            });
          }
          break;

        case 'transferLearning':
          if (violation.evidence.includes('No transfer learning')) {
            adjustments.push({
              type: 'add_scaffolding',
              description: 'Connect questions to broader skills and contexts',
              priority: 'medium',
              example: 'Ask "How might this approach apply to other writing situations?"'
            });
          }
          break;

        case 'transparentDependency':
          if (violation.evidence.includes('Missing') || violation.evidence.includes('insufficient')) {
            adjustments.push({
              type: 'add_reflection',
              description: 'Add clear attribution and limitation statements',
              priority: 'high',
              example: 'Include "These AI-generated questions are designed to promote your independent thinking"'
            });
          }
          break;
      }
    });

    // Remove duplicate adjustments
    const uniqueAdjustments = adjustments.filter((adj, index, self) =>
      index === self.findIndex(a => a.type === adj.type && a.description === adj.description)
    );

    return uniqueAdjustments;
  }
}