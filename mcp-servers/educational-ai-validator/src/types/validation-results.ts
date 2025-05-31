export interface BoundedEnhancementValidation {
  isValid: boolean;
  overallScore: number;
  principleScores: {
    questionsOnly: number;
    educationalValue: number;
    appropriateDifficulty: number;
    independenceBuilding: number;
    transparentRationale: number;
    dependencyPrevention: number;
  };
  issues: string[];
  recommendations: string[];
  adjustments: Record<string, any>;
  educationalRationale: string;
}

export interface ValidationResult {
  score: number;
  issues: string[];
  passed: boolean;
}

export interface BloomsTaxonomyAssessment {
  overallLevel: number; // 1-6
  questionLevels: Array<{
    question: string;
    level: number;
    confidence: number;
    reasoning: string;
  }>;
  distribution: {
    remember: number;
    understand: number;
    apply: number;
    analyze: number;
    evaluate: number;
    create: number;
  };
  recommendations: string[];
  educationalAlignment: {
    isAppropriate: boolean;
    targetLevel: number;
    actualLevel: number;
    adjustment: string;
  };
}

export interface DependencyRiskAssessment {
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  indicators: {
    requestFrequency: number;
    reflectionQuality: number;
    independenceRatio: number;
    progressionTrend: string;
  };
  issues: string[];
  recommendations: string[];
  interventions: Array<{
    type: string;
    priority: 'low' | 'medium' | 'high';
    description: string;
  }>;
}

export interface PhilosophyComplianceResult {
  overallCompliance: boolean;
  complianceScore: number; // 0-100
  principleResults: {
    productiveStruggle: PrincipleValidationResult;
    cognitiveBalance: PrincipleValidationResult;
    independenceTrajectory: PrincipleValidationResult;
    transferLearning: PrincipleValidationResult;
    transparentDependency: PrincipleValidationResult;
  };
  violations: PhilosophyViolation[];
  recommendations: string[];
  adjustments: PhilosophyAdjustment[];
}

export interface PrincipleValidationResult {
  compliant: boolean;
  score: number;
  issues: string[];
  evidence: string[];
}

export interface PhilosophyViolation {
  principle: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string;
  recommendation: string;
}

export interface PhilosophyAdjustment {
  type: 'rephrase' | 'add_scaffolding' | 'reduce_complexity' | 'add_reflection' | 'remove_content';
  description: string;
  priority: 'low' | 'medium' | 'high';
  example?: string;
}

export interface ReflectionValidation {
  isValid: boolean;
  qualityScore: number;
  meetsRequirements: boolean;
  issues: string[];
  suggestions: string[];
  adjustedRequirements?: {
    minimumLength: number;
    qualityThreshold: string;
    additionalPrompts: string[];
  };
}

export interface EducationalRationale {
  action: string;
  purpose: string;
  learningObjectives: string[];
  pedagogicalApproach: string;
  expectedOutcomes: string[];
  transparencyStatement: string;
}