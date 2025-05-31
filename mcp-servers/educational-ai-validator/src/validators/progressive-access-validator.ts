export interface AccessValidation {
  isValid: boolean;
  currentLevel: string;
  recommendedLevel: string;
  rationaleForChange?: string;
  issues: string[];
  recommendations: string[];
}

export interface StudentMetrics {
  reflectionQualityAverage: number;
  independenceScore: number;
  consistencyScore: number;
  timeInCurrentLevel: number; // days
  totalInteractions: number;
  recentBreakthroughs: number;
  strugglingIndicators: number;
}

export interface ProposedChange {
  targetLevel: string;
  reason: string;
  expectedBenefit: string;
}

export class ProgressiveAccessValidator {
  static async validate(
    currentAccessLevel: string,
    studentMetrics: StudentMetrics,
    proposedChange?: ProposedChange
  ): Promise<AccessValidation> {
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Calculate what the level should be based on metrics
    const recommendedLevel = this.calculateRecommendedLevel(studentMetrics);
    
    // If there's a proposed change, validate it
    let isValid = true;
    let rationaleForChange;
    
    if (proposedChange) {
      const changeValidation = this.validateProposedChange(
        currentAccessLevel,
        proposedChange,
        studentMetrics,
        recommendedLevel
      );
      
      isValid = changeValidation.isValid;
      if (!isValid) {
        issues.push(...changeValidation.issues);
      }
      rationaleForChange = changeValidation.rationale;
    } else {
      // Just check if current level is appropriate
      if (currentAccessLevel !== recommendedLevel) {
        const levelDifference = this.getLevelDifference(currentAccessLevel, recommendedLevel);
        
        if (Math.abs(levelDifference) > 1) {
          issues.push(`Current level (${currentAccessLevel}) significantly mismatched with metrics`);
          recommendations.push(`Consider gradual transition to ${recommendedLevel}`);
        } else if (levelDifference !== 0) {
          recommendations.push(`Student metrics suggest ${recommendedLevel} access level`);
        }
      }
    }
    
    // Add specific recommendations based on metrics
    recommendations.push(...this.generateMetricBasedRecommendations(studentMetrics, currentAccessLevel));
    
    return {
      isValid,
      currentLevel: currentAccessLevel,
      recommendedLevel,
      rationaleForChange,
      issues,
      recommendations
    };
  }
  
  private static calculateRecommendedLevel(metrics: StudentMetrics): string {
    let score = 0;
    
    // Reflection quality (0-40 points)
    score += (metrics.reflectionQualityAverage / 100) * 40;
    
    // Independence (0-30 points)
    score += (metrics.independenceScore / 100) * 30;
    
    // Consistency (0-20 points)
    score += (metrics.consistencyScore / 100) * 20;
    
    // Time bonus (0-10 points)
    if (metrics.timeInCurrentLevel > 30) {
      score += 10;
    } else if (metrics.timeInCurrentLevel > 14) {
      score += 5;
    }
    
    // Breakthrough bonus
    score += Math.min(10, metrics.recentBreakthroughs * 3);
    
    // Struggling penalty
    score -= Math.min(20, metrics.strugglingIndicators * 5);
    
    // Determine level based on score
    if (score >= 85) {
      return 'enhanced';
    } else if (score >= 65) {
      return 'standard';
    } else if (score >= 45) {
      return 'basic';
    } else {
      return 'restricted';
    }
  }
  
  private static validateProposedChange(
    currentLevel: string,
    proposedChange: ProposedChange,
    metrics: StudentMetrics,
    recommendedLevel: string
  ): { isValid: boolean; issues: string[]; rationale: string } {
    const issues: string[] = [];
    let isValid = true;
    
    const currentLevelNum = this.getLevelNumber(currentLevel);
    const proposedLevelNum = this.getLevelNumber(proposedChange.targetLevel);
    const recommendedLevelNum = this.getLevelNumber(recommendedLevel);
    
    // Check if jump is too large
    if (Math.abs(proposedLevelNum - currentLevelNum) > 1) {
      isValid = false;
      issues.push('Access level changes should be gradual (one level at a time)');
    }
    
    // Check if change goes against metrics
    if (proposedLevelNum > currentLevelNum && recommendedLevelNum < currentLevelNum) {
      isValid = false;
      issues.push('Metrics do not support increasing access level');
    }
    
    if (proposedLevelNum < currentLevelNum && recommendedLevelNum > currentLevelNum) {
      isValid = false;
      issues.push('Metrics do not support decreasing access level');
    }
    
    // Validate specific transitions
    if (proposedChange.targetLevel === 'enhanced') {
      if (metrics.reflectionQualityAverage < 80) {
        isValid = false;
        issues.push('Enhanced access requires reflection quality average ≥ 80%');
      }
      if (metrics.independenceScore < 70) {
        isValid = false;
        issues.push('Enhanced access requires independence score ≥ 70%');
      }
      if (metrics.timeInCurrentLevel < 14) {
        isValid = false;
        issues.push('Must maintain current level for at least 14 days before enhancement');
      }
    }
    
    if (proposedChange.targetLevel === 'restricted' && currentLevel !== 'basic') {
      isValid = false;
      issues.push('Can only move to restricted from basic level');
    }
    
    // Generate rationale
    let rationale = proposedChange.reason;
    if (isValid) {
      rationale += `. Student metrics support this change: `;
      rationale += `reflection quality ${metrics.reflectionQualityAverage}%, `;
      rationale += `independence ${metrics.independenceScore}%, `;
      rationale += `time in level ${metrics.timeInCurrentLevel} days.`;
    }
    
    return { isValid, issues, rationale };
  }
  
  private static generateMetricBasedRecommendations(
    metrics: StudentMetrics,
    currentLevel: string
  ): string[] {
    const recommendations: string[] = [];
    
    // Reflection quality recommendations
    if (metrics.reflectionQualityAverage < 50) {
      recommendations.push('Focus on improving reflection quality through guided prompts and examples');
    } else if (metrics.reflectionQualityAverage > 85 && currentLevel !== 'enhanced') {
      recommendations.push('Excellent reflection quality suggests readiness for increased autonomy');
    }
    
    // Independence recommendations
    if (metrics.independenceScore < 40) {
      recommendations.push('Implement structured independence-building exercises');
      recommendations.push('Gradually increase time between AI interactions');
    } else if (metrics.independenceScore > 80) {
      recommendations.push('Strong independence - consider reducing AI access frequency');
    }
    
    // Consistency recommendations
    if (metrics.consistencyScore < 60) {
      recommendations.push('Work on maintaining consistent quality across interactions');
      recommendations.push('Consider shorter, more frequent sessions for stability');
    }
    
    // Time-based recommendations
    if (metrics.timeInCurrentLevel > 60 && currentLevel === 'basic') {
      recommendations.push('Extended time at basic level - assess barriers to progression');
    } else if (metrics.timeInCurrentLevel > 90 && currentLevel === 'standard') {
      recommendations.push('Consider personalized challenge to promote growth');
    }
    
    // Struggle/breakthrough balance
    if (metrics.strugglingIndicators > metrics.recentBreakthroughs * 2) {
      recommendations.push('High struggle-to-breakthrough ratio - provide additional support');
    } else if (metrics.recentBreakthroughs > 3 && metrics.strugglingIndicators < 2) {
      recommendations.push('Multiple breakthroughs with minimal struggle - increase challenge');
    }
    
    return recommendations;
  }
  
  private static getLevelNumber(level: string): number {
    const levels: Record<string, number> = {
      'restricted': 1,
      'basic': 2,
      'standard': 3,
      'enhanced': 4
    };
    return levels[level] || 2;
  }
  
  private static getLevelDifference(current: string, recommended: string): number {
    return this.getLevelNumber(recommended) - this.getLevelNumber(current);
  }
}