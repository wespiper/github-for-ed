import { StudentProfile } from '../types/educational-contexts.js';
import { DependencyRiskAssessment } from '../types/validation-results.js';

export interface AIInteractionPattern {
  frequency: number; // requests per hour
  requestTypes: string[]; // types of help requested
  reflectionQuality?: number; // average quality score
  independentWorkRatio?: number; // ratio of independent to AI-assisted work
  sessionDurations?: number[]; // lengths of work sessions
  timeBeforeFirstRequest?: number; // minutes before first AI request
}

export class DependencyRiskDetector {
  static async assess(
    interactionPattern: AIInteractionPattern,
    studentProfile?: StudentProfile
  ): Promise<DependencyRiskAssessment> {
    
    let riskScore = 0;
    const issues: string[] = [];
    const recommendations: string[] = [];
    const interventions: any[] = [];

    // Analyze request frequency
    const frequencyRisk = this.assessFrequencyRisk(interactionPattern.frequency);
    riskScore += frequencyRisk.score;
    if (frequencyRisk.issue) issues.push(frequencyRisk.issue);
    if (frequencyRisk.recommendation) recommendations.push(frequencyRisk.recommendation);

    // Analyze request types
    const typeRisk = this.assessRequestTypeRisk(interactionPattern.requestTypes);
    riskScore += typeRisk.score;
    if (typeRisk.issue) issues.push(typeRisk.issue);
    if (typeRisk.recommendation) recommendations.push(typeRisk.recommendation);

    // Analyze reflection quality
    if (interactionPattern.reflectionQuality !== undefined) {
      const reflectionRisk = this.assessReflectionQualityRisk(interactionPattern.reflectionQuality);
      riskScore += reflectionRisk.score;
      if (reflectionRisk.issue) issues.push(reflectionRisk.issue);
      if (reflectionRisk.recommendation) recommendations.push(reflectionRisk.recommendation);
    }

    // Analyze independent work ratio
    if (interactionPattern.independentWorkRatio !== undefined) {
      const independenceRisk = this.assessIndependenceRisk(interactionPattern.independentWorkRatio);
      riskScore += independenceRisk.score;
      if (independenceRisk.issue) issues.push(independenceRisk.issue);
      if (independenceRisk.recommendation) recommendations.push(independenceRisk.recommendation);
    }

    // Analyze time before first request
    if (interactionPattern.timeBeforeFirstRequest !== undefined) {
      const immediacyRisk = this.assessImmediateRequestRisk(interactionPattern.timeBeforeFirstRequest);
      riskScore += immediacyRisk.score;
      if (immediacyRisk.issue) issues.push(immediacyRisk.issue);
      if (immediacyRisk.recommendation) recommendations.push(immediacyRisk.recommendation);
    }

    // Consider student profile if available
    if (studentProfile) {
      const profileRisk = this.assessProfileBasedRisk(studentProfile, interactionPattern);
      riskScore += profileRisk.score;
      if (profileRisk.issue) issues.push(profileRisk.issue);
      if (profileRisk.recommendation) recommendations.push(profileRisk.recommendation);
    }

    // Determine risk level
    const riskLevel = this.calculateRiskLevel(riskScore);

    // Generate interventions based on risk
    if (riskLevel !== 'none') {
      interventions.push(...this.generateInterventions(riskLevel, interactionPattern, issues));
    }

    // Calculate progression trend
    const progressionTrend = studentProfile?.independenceMetrics?.trend || 
      (interactionPattern.frequency > 3 ? 'decreasing' : 'stable');

    return {
      riskLevel,
      riskScore: Math.min(100, riskScore),
      indicators: {
        requestFrequency: interactionPattern.frequency,
        reflectionQuality: interactionPattern.reflectionQuality || 0,
        independenceRatio: interactionPattern.independentWorkRatio || 0,
        progressionTrend
      },
      issues,
      recommendations,
      interventions
    };
  }

  private static assessFrequencyRisk(frequency: number): { score: number; issue?: string; recommendation?: string } {
    if (frequency > 10) {
      return {
        score: 40,
        issue: 'Extremely high AI request frequency (>10/hour)',
        recommendation: 'Implement strict request limits and encourage longer independent work periods'
      };
    } else if (frequency > 5) {
      return {
        score: 25,
        issue: 'High AI request frequency (>5/hour)',
        recommendation: 'Gradually reduce AI access and provide self-help resources'
      };
    } else if (frequency > 3) {
      return {
        score: 15,
        issue: 'Moderate AI request frequency (>3/hour)',
        recommendation: 'Encourage students to attempt problems independently before seeking AI help'
      };
    } else if (frequency > 2) {
      return {
        score: 8,
        issue: 'Slightly elevated AI request frequency',
        recommendation: 'Monitor for increasing dependency patterns'
      };
    }
    return { score: 0 };
  }

  private static assessRequestTypeRisk(requestTypes: string[]): { score: number; issue?: string; recommendation?: string } {
    let totalScore = 0;
    const foundRisks: string[] = [];

    // Analyze request patterns
    if (requestTypes.includes('answer_seeking') || requestTypes.includes('solution_requests')) {
      totalScore += 25;
      foundRisks.push('seeking direct answers');
    }

    if (requestTypes.filter(t => t === requestTypes[0]).length === requestTypes.length && requestTypes.length > 2) {
      totalScore += 15;
      foundRisks.push('repetitive request patterns');
    }

    // Check for escalation pattern
    const complexityPattern = this.detectComplexityEscalation(requestTypes);
    if (complexityPattern === 'avoiding_challenge') {
      totalScore += 20;
      foundRisks.push('avoiding challenging tasks');
    }

    if (foundRisks.length > 0) {
      return {
        score: totalScore,
        issue: `Concerning request patterns: ${foundRisks.join(', ')}`,
        recommendation: 'Redirect to process-focused questions and self-discovery approaches'
      };
    }

    return { score: 0 };
  }

  private static assessReflectionQualityRisk(quality: number): { score: number; issue?: string; recommendation?: string } {
    if (quality < 30) {
      return {
        score: 25,
        issue: 'Very poor reflection quality indicates superficial engagement',
        recommendation: 'Require deeper reflections before additional AI access'
      };
    } else if (quality < 50) {
      return {
        score: 15,
        issue: 'Low reflection quality suggests minimal learning transfer',
        recommendation: 'Provide reflection scaffolding and examples'
      };
    } else if (quality < 70) {
      return {
        score: 8,
        issue: 'Moderate reflection quality could be improved',
        recommendation: 'Encourage more specific and analytical reflections'
      };
    }
    return { score: 0 };
  }

  private static assessIndependenceRisk(ratio: number): { score: number; issue?: string; recommendation?: string } {
    if (ratio < 0.2) {
      return {
        score: 30,
        issue: 'Very low independent work ratio (<20%)',
        recommendation: 'Mandate independent work periods before AI access'
      };
    } else if (ratio < 0.4) {
      return {
        score: 20,
        issue: 'Low independent work ratio (<40%)',
        recommendation: 'Increase required independent work time'
      };
    } else if (ratio < 0.6) {
      return {
        score: 10,
        issue: 'Moderate independent work ratio',
        recommendation: 'Encourage more independent exploration'
      };
    }
    return { score: 0 };
  }

  private static assessImmediateRequestRisk(timeBeforeFirst: number): { score: number; issue?: string; recommendation?: string } {
    if (timeBeforeFirst < 2) {
      return {
        score: 20,
        issue: 'Immediate AI requests without independent attempt',
        recommendation: 'Require minimum 5-minute independent effort before AI access'
      };
    } else if (timeBeforeFirst < 5) {
      return {
        score: 12,
        issue: 'Quick AI requests with minimal independent effort',
        recommendation: 'Encourage longer initial independent exploration'
      };
    } else if (timeBeforeFirst < 10) {
      return {
        score: 5,
        issue: 'Somewhat quick AI requests',
        recommendation: 'Promote confidence in independent problem-solving'
      };
    }
    return { score: 0 };
  }

  private static assessProfileBasedRisk(
    profile: StudentProfile, 
    pattern: AIInteractionPattern
  ): { score: number; issue?: string; recommendation?: string } {
    let score = 0;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check independence trajectory
    if (profile.independenceMetrics.trend === 'decreasing') {
      score += 20;
      issues.push('Student independence is declining');
      recommendations.push('Implement independence recovery plan');
    }

    // Check if pattern matches student weaknesses
    if (profile.preferences.strugglesWIth.includes('independent_thinking') && pattern.frequency > 3) {
      score += 15;
      issues.push('High AI use aligns with independence struggles');
      recommendations.push('Provide targeted independence-building exercises');
    }

    // Check cognitive load alignment
    if (profile.currentState.cognitiveLoad === 'high' && pattern.frequency > 5) {
      score += 10;
      issues.push('High AI dependency during cognitive overload');
      recommendations.push('Reduce task complexity before reducing AI access');
    }

    // Check for gaming patterns
    if (profile.preferences.averageReflectionDepth < 40 && pattern.reflectionQuality && pattern.reflectionQuality < 40) {
      score += 15;
      issues.push('Possible gaming of AI system with minimal reflection');
      recommendations.push('Require demonstration of understanding before AI access');
    }

    return {
      score,
      issue: issues.join('; '),
      recommendation: recommendations.join('; ')
    };
  }

  private static calculateRiskLevel(score: number): 'none' | 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    if (score >= 20) return 'low';
    return 'none';
  }

  private static detectComplexityEscalation(requestTypes: string[]): string {
    // Simple heuristic: if requests get simpler over time, student may be avoiding challenge
    const complexityMap: Record<string, number> = {
      'definition': 1,
      'explanation': 2,
      'analysis': 3,
      'evaluation': 4,
      'synthesis': 5
    };

    const complexities = requestTypes.map(type => {
      for (const [key, value] of Object.entries(complexityMap)) {
        if (type.toLowerCase().includes(key)) return value;
      }
      return 2; // default
    });

    // Check for decreasing complexity
    let decreasing = 0;
    for (let i = 1; i < complexities.length; i++) {
      if (complexities[i] < complexities[i - 1]) decreasing++;
    }

    return decreasing > complexities.length / 2 ? 'avoiding_challenge' : 'normal';
  }

  private static generateInterventions(
    riskLevel: string, 
    pattern: AIInteractionPattern,
    issues: string[]
  ): any[] {
    const interventions = [];

    if (riskLevel === 'critical' || riskLevel === 'high') {
      interventions.push({
        type: 'immediate_access_reduction',
        priority: 'high',
        description: 'Temporarily reduce AI access to 2 requests per hour with mandatory 15-minute independent work periods'
      });

      interventions.push({
        type: 'educator_consultation',
        priority: 'high',
        description: 'Schedule meeting with educator to discuss learning strategies and AI use'
      });
    }

    if (pattern.reflectionQuality && pattern.reflectionQuality < 50) {
      interventions.push({
        type: 'reflection_workshop',
        priority: 'medium',
        description: 'Attend reflection quality workshop or complete online module'
      });
    }

    if (pattern.independentWorkRatio && pattern.independentWorkRatio < 0.4) {
      interventions.push({
        type: 'independence_building',
        priority: 'high',
        description: 'Complete independence-building exercises before next AI access'
      });
    }

    if (issues.some(issue => issue.includes('gaming'))) {
      interventions.push({
        type: 'integrity_discussion',
        priority: 'medium',
        description: 'Participate in academic integrity discussion about AI use'
      });
    }

    // Always include a supportive intervention
    interventions.push({
      type: 'skill_development',
      priority: 'low',
      description: 'Access self-help resources for independent problem-solving strategies'
    });

    return interventions;
  }
}