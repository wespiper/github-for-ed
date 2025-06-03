/**
 * Type definitions for writing analysis services
 * Used by both MCP and fallback implementations
 */

export interface WritingPattern {
  structure?: {
    sentenceCount: number;
    averageSentenceLength: number;
    paragraphCount: number;
    wordCount: number;
    organizationScore: number;
    transitionWords: number;
  };
  sentiment?: {
    overall: 'positive' | 'negative' | 'neutral';
    confidence: number;
    emotionalTone: string;
  };
  complexity?: {
    readabilityScore: number;
    vocabularyLevel: 'basic' | 'intermediate' | 'advanced';
    syntaxComplexity: number;
  };
  temporalPatterns?: any;
  rhetoricalElements?: any;
  cohesionMarkers?: any;
}

export interface ReflectionQuality {
  overall: number;
  dimensions: {
    depth: number;
    selfAwareness: number;
    criticalThinking: number;
    growthMindset: number;
  };
  strengths: string[];
  improvements: string[];
}

export interface WritingInsights {
  keyMetrics: {
    activeStudents: string | number;
    avgReflectionQuality: string | number;
    completionRate: string | number;
    improvementTrend: string;
  };
  trends: any[];
  recommendations: string[];
  alerts: Array<{
    type: 'system' | 'privacy' | 'academic';
    severity: 'info' | 'warning' | 'error';
    message: string;
    action: string;
  }>;
}

export interface ContentSensitivity {
  sensitivityLevel: 'none' | 'low' | 'medium' | 'high';
  sensitivityScore: number;
  sensitiveElements: string[];
  recommendations: string[];
  redactedContent?: string;
}

export interface AIBoundaryCheck {
  allowed: boolean;
  boundariesApplied: string[];
  suggestions: string[];
  reasoning: string;
}

export interface EducationalValidation {
  isValid: boolean;
  score: number;
  criteria: {
    academicRelevance: number;
    learningObjectiveAlignment: number;
    appropriateLevel: number;
    ethicalCompliance: number;
  };
  recommendations: string[];
}

export interface WritingProgressTracking {
  sessionMetrics: {
    totalSessions: number;
    totalTimeSpent: number;
    averageSessionLength: number;
    productivityScore: number;
  };
  developmentMetrics: {
    skillProgression: any[];
    qualityImprovement: number;
    consistencyScore: number;
  };
  interventionTriggers: string[];
}