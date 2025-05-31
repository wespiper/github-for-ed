export interface EducationalContext {
  writingStage: 'brainstorming' | 'planning' | 'drafting' | 'revising' | 'editing';
  academicLevel: 'elementary' | 'middle' | 'high' | 'undergraduate' | 'graduate';
  learningObjectives?: string[];
  assignmentType?: string;
  courseContext?: string;
  studentProfile?: StudentProfile;
  previousInteractions?: AIInteraction[];
}

export interface AIResponse {
  questions?: string[];
  educationalGuidance?: EducationalGuidance;
  rationale?: string;
  educationalRationale?: string;
  attribution?: string;
  limitations?: string[];
  reflectionRequirements?: ReflectionRequirements;
  progressiveAccess?: ProgressiveAccessInfo;
}

export interface StudentProfile {
  studentId: string;
  currentState: {
    cognitiveLoad: 'low' | 'optimal' | 'high' | 'overload';
    recentBreakthrough: boolean;
    strugglingDuration: number;
    lastSuccessfulInteraction: Date;
    emotionalState?: 'confident' | 'neutral' | 'frustrated' | 'anxious';
  };
  independenceMetrics: {
    aiRequestFrequency: number;
    independentWorkStreak: number;
    qualityWithoutAI: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  };
  preferences: {
    questionComplexity: 'concrete' | 'mixed' | 'abstract';
    bestRespondsTo: string[];
    strugglesWIth: string[];
    averageReflectionDepth: number;
  };
  strengths: {
    evidenceAnalysis: number;
    perspectiveTaking: number;
    logicalReasoning: number;
    creativeThinking: number;
    organizationalSkills: number;
  };
}

export interface EducationalGuidance {
  type: 'question' | 'prompt' | 'perspective' | 'reflection';
  content: string;
  educationalPurpose: string;
  cognitiveLevel: number; // Bloom's taxonomy 1-6
  expectedOutcome: string;
}

export interface ReflectionRequirements {
  mandatory: boolean;
  minimumLength?: number;
  qualityThreshold?: 'basic' | 'detailed' | 'analytical';
  prompts: string[];
  assessmentCriteria: string[];
}

export interface ProgressiveAccessInfo {
  currentLevel: 'restricted' | 'basic' | 'standard' | 'enhanced';
  nextLevelRequirements: string[];
  rationaleForLevel: string;
  timeToNextReview: number; // minutes
}

export interface AIInteraction {
  timestamp: Date;
  request: string;
  response: AIResponse;
  reflectionSubmitted?: boolean;
  reflectionQuality?: number;
  educationalOutcome?: string;
}