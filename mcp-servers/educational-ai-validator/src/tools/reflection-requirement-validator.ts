import { AIResponse, StudentProfile } from '../types/educational-contexts.js';
import { ReflectionValidation } from '../types/validation-results.js';

export class ReflectionRequirementValidator {
  static async validate(
    response: AIResponse,
    studentProfile: StudentProfile,
    previousReflections?: any[]
  ): Promise<ReflectionValidation> {
    
    const issues: string[] = [];
    const suggestions: string[] = [];
    let qualityScore = 100;
    let meetsRequirements = true;

    // Check if reflection requirements are present
    if (!response.reflectionRequirements) {
      issues.push('No reflection requirements specified');
      suggestions.push('Add mandatory reflection requirements for AI interactions');
      qualityScore -= 30;
      meetsRequirements = false;
    } else {
      const reqs = response.reflectionRequirements;

      // Validate mandatory flag
      if (!reqs.mandatory) {
        issues.push('Reflection not marked as mandatory');
        suggestions.push('Make reflection mandatory for all AI interactions');
        qualityScore -= 25;
        meetsRequirements = false;
      }

      // Validate minimum length
      const baseMinLength = this.calculateBaseMinimumLength(studentProfile);
      if (!reqs.minimumLength || reqs.minimumLength < baseMinLength) {
        issues.push(`Minimum length (${reqs.minimumLength || 0}) below required (${baseMinLength})`);
        suggestions.push(`Set minimum length to at least ${baseMinLength} words`);
        qualityScore -= 15;
      }

      // Validate quality threshold
      const requiredThreshold = this.determineQualityThreshold(studentProfile, previousReflections);
      if (!reqs.qualityThreshold || this.compareThresholds(reqs.qualityThreshold, requiredThreshold) < 0) {
        issues.push(`Quality threshold too low for student profile`);
        suggestions.push(`Increase threshold to '${requiredThreshold}' level`);
        qualityScore -= 20;
      }

      // Validate prompts
      if (!reqs.prompts || reqs.prompts.length < 2) {
        issues.push('Insufficient reflection prompts provided');
        suggestions.push('Include at least 2-3 specific reflection prompts');
        qualityScore -= 15;
      } else {
        const promptQuality = this.assessPromptQuality(reqs.prompts);
        if (promptQuality.score < 70) {
          issues.push(...promptQuality.issues);
          suggestions.push(...promptQuality.suggestions);
          qualityScore -= (100 - promptQuality.score) / 2;
        }
      }

      // Validate assessment criteria
      if (!reqs.assessmentCriteria || reqs.assessmentCriteria.length < 3) {
        issues.push('Insufficient assessment criteria specified');
        suggestions.push('Provide clear criteria for reflection evaluation');
        qualityScore -= 15;
      }
    }

    // Check for progressive difficulty based on student history
    if (previousReflections && previousReflections.length > 0) {
      const progressionCheck = this.checkProgressiveDifficulty(
        response.reflectionRequirements,
        previousReflections,
        studentProfile
      );
      
      if (!progressionCheck.appropriate) {
        issues.push(progressionCheck.issue!);
        suggestions.push(progressionCheck.suggestion!);
        qualityScore -= 15;
      }
    }

    // Generate adjusted requirements if needed
    const adjustedRequirements = qualityScore < 80 ? 
      this.generateAdjustedRequirements(studentProfile, previousReflections) : 
      undefined;

    return {
      isValid: qualityScore >= 70,
      qualityScore: Math.max(0, qualityScore),
      meetsRequirements,
      issues,
      suggestions,
      adjustedRequirements
    };
  }

  private static calculateBaseMinimumLength(profile: StudentProfile): number {
    const baseLength = 100; // Base minimum
    let adjustment = 0;

    // Adjust based on average reflection depth
    if (profile.preferences.averageReflectionDepth < 40) {
      adjustment += 50; // Require more length for shallow reflectors
    } else if (profile.preferences.averageReflectionDepth > 70) {
      adjustment -= 20; // Can be slightly shorter for deep reflectors
    }

    // Adjust based on independence metrics
    if (profile.independenceMetrics.trend === 'decreasing') {
      adjustment += 30; // Require more reflection when independence declining
    }

    // Adjust based on cognitive load
    if (profile.currentState.cognitiveLoad === 'overload') {
      adjustment -= 30; // Reduce requirements during overload
    } else if (profile.currentState.cognitiveLoad === 'low') {
      adjustment += 20; // Can handle more during low load
    }

    return Math.max(50, baseLength + adjustment);
  }

  private static determineQualityThreshold(
    profile: StudentProfile,
    previousReflections?: any[]
  ): 'basic' | 'detailed' | 'analytical' {
    
    // If student has been gaming the system
    if (previousReflections && previousReflections.length > 3) {
      const recentQuality = previousReflections
        .slice(-3)
        .reduce((sum, r) => sum + (r.qualityScore || 0), 0) / 3;
      
      if (recentQuality < 40) {
        return 'analytical'; // Require highest quality
      }
    }

    // Based on student profile
    if (profile.preferences.averageReflectionDepth >= 70) {
      return 'detailed'; // Already good at reflection
    } else if (profile.preferences.averageReflectionDepth >= 50) {
      return 'detailed'; // Push for improvement
    } else {
      return 'analytical'; // Need significant improvement
    }
  }

  private static compareThresholds(
    actual: 'basic' | 'detailed' | 'analytical',
    required: 'basic' | 'detailed' | 'analytical'
  ): number {
    const levels = { basic: 1, detailed: 2, analytical: 3 };
    return levels[actual] - levels[required];
  }

  private static assessPromptQuality(prompts: string[]): {
    score: number;
    issues: string[];
    suggestions: string[];
  } {
    let score = 100;
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for metacognitive prompts
    const hasMetacognitive = prompts.some(p => 
      /thinking process|how.*approach|why.*decide|what.*learn/i.test(p)
    );
    
    if (!hasMetacognitive) {
      score -= 20;
      issues.push('No metacognitive reflection prompts');
      suggestions.push('Add prompts about thinking process and learning');
    }

    // Check for specificity
    const genericPrompts = prompts.filter(p => 
      p.length < 20 || /reflect|think about|consider/i.test(p) && p.split(' ').length < 5
    );
    
    if (genericPrompts.length > prompts.length / 2) {
      score -= 25;
      issues.push('Prompts too generic or vague');
      suggestions.push('Make prompts more specific and actionable');
    }

    // Check for depth indicators
    const depthIndicators = prompts.filter(p => 
      /why|how|what if|implications|assumptions|evidence/i.test(p)
    );
    
    if (depthIndicators.length < prompts.length / 2) {
      score -= 15;
      issues.push('Prompts lack depth-promoting elements');
      suggestions.push('Include why/how questions to promote deeper thinking');
    }

    // Check for connection to AI interaction
    const aiConnectionPrompts = prompts.filter(p => 
      /AI.*help|questions.*thinking|assistance.*understanding/i.test(p)
    );
    
    if (aiConnectionPrompts.length === 0) {
      score -= 20;
      issues.push('Prompts don\'t connect to AI interaction');
      suggestions.push('Include prompts about how AI questions influenced thinking');
    }

    return { score: Math.max(0, score), issues, suggestions };
  }

  private static checkProgressiveDifficulty(
    currentReqs: any,
    previousReflections: any[],
    profile: StudentProfile
  ): { appropriate: boolean; issue?: string; suggestion?: string } {
    
    // Get average quality of recent reflections
    const recentAverage = previousReflections
      .slice(-5)
      .reduce((sum, r) => sum + (r.qualityScore || 50), 0) / Math.min(5, previousReflections.length);

    // If student is consistently performing well, increase requirements
    if (recentAverage > 80 && profile.independenceMetrics.trend !== 'decreasing') {
      if (!currentReqs || currentReqs.qualityThreshold !== 'analytical') {
        return {
          appropriate: false,
          issue: 'Student ready for more challenging reflection requirements',
          suggestion: 'Increase to analytical reflection threshold'
        };
      }
    }

    // If student is struggling, ensure appropriate scaffolding
    if (recentAverage < 50 && currentReqs && currentReqs.qualityThreshold === 'analytical') {
      return {
        appropriate: false,
        issue: 'Reflection requirements too challenging for struggling student',
        suggestion: 'Provide more scaffolding and reduce to detailed threshold temporarily'
      };
    }

    return { appropriate: true };
  }

  private static generateAdjustedRequirements(
    profile: StudentProfile,
    previousReflections?: any[]
  ): any {
    const minimumLength = this.calculateBaseMinimumLength(profile);
    const qualityThreshold = this.determineQualityThreshold(profile, previousReflections);

    const prompts = [];

    // Always include metacognitive prompt
    prompts.push('How did the AI questions change or deepen your thinking about this topic?');

    // Add based on student needs
    if (profile.preferences.averageReflectionDepth < 50) {
      prompts.push('What specific assumptions or gaps in your argument did the questions reveal?');
      prompts.push('Which question challenged you most and why?');
    }

    if (profile.independenceMetrics.trend === 'decreasing') {
      prompts.push('What strategies will you use to work through similar challenges independently?');
      prompts.push('How can you apply this thinking process without AI assistance?');
    }

    if (profile.currentState.recentBreakthrough) {
      prompts.push('What insight or connection led to your breakthrough moment?');
    }

    // Assessment criteria
    const assessmentCriteria = [
      'Demonstrates specific connections between AI questions and thinking changes',
      'Shows evidence of deeper understanding or new perspectives',
      'Identifies concrete next steps or applications',
      `Meets ${qualityThreshold} reflection depth requirements`
    ];

    if (qualityThreshold === 'analytical') {
      assessmentCriteria.push('Critically evaluates the helpfulness and limitations of AI assistance');
    }

    return {
      minimumLength,
      qualityThreshold,
      additionalPrompts: prompts,
      assessmentCriteria
    };
  }
}