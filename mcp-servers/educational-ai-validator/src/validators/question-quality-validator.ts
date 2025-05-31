import { EducationalContext } from '../types/educational-contexts.js';
import { BloomsTaxonomyKeywords } from '../utils/blooms-taxonomy-keywords.js';

export interface QuestionQualityScore {
  criticalThinking: number; // 0-100
  depthOfThought: number; // 0-100
  learningObjectiveAlignment: number; // 0-100
  openEndedness: number; // 0-100
  scaffoldingQuality: number; // 0-100
  overallQuality: number; // 0-100
  issues: string[];
  strengths: string[];
}

export class QuestionQualityValidator {
  static async assessEducationalValue(
    question: string,
    context: EducationalContext
  ): Promise<QuestionQualityScore> {
    const scores = {
      criticalThinking: await this.assessCriticalThinking(question),
      depthOfThought: await this.assessDepthOfThought(question),
      learningObjectiveAlignment: await this.assessLearningAlignment(question, context),
      openEndedness: await this.assessOpenEndedness(question),
      scaffoldingQuality: await this.assessScaffoldingQuality(question, context)
    };

    const overallQuality = this.calculateOverallQuality(scores);
    const issues = this.identifyIssues(scores, question);
    const strengths = this.identifyStrengths(scores, question);

    return {
      ...scores,
      overallQuality,
      issues,
      strengths
    };
  }

  private static async assessCriticalThinking(question: string): Promise<number> {
    let score = 50; // Start with neutral score
    // const questionLower = question.toLowerCase(); // Not used, patterns use /i flag

    // Positive indicators for critical thinking
    const criticalThinkingPatterns = [
      { pattern: /why|how|what if/i, points: 10 },
      { pattern: /analyze|evaluate|assess|examine/i, points: 15 },
      { pattern: /compare|contrast|distinguish/i, points: 12 },
      { pattern: /evidence|support|justify|explain/i, points: 10 },
      { pattern: /implications|consequences|effects/i, points: 12 },
      { pattern: /alternative|perspective|viewpoint/i, points: 15 },
      { pattern: /strengths.*weaknesses|pros.*cons/i, points: 15 },
      { pattern: /assumption|bias|limitation/i, points: 12 },
      { pattern: /relationship|connection|pattern/i, points: 10 }
    ];

    // Apply positive scoring
    for (const { pattern, points } of criticalThinkingPatterns) {
      if (pattern.test(question)) {
        score += points;
      }
    }

    // Negative indicators (shallow questions)
    const shallowPatterns = [
      { pattern: /^what is|^who is|^where is|^when/i, points: -15 },
      { pattern: /^list|^name|^state/i, points: -10 },
      { pattern: /yes.*no question/i, points: -20 },
      { pattern: /^do you|^are you|^is it/i, points: -15 }
    ];

    // Apply negative scoring
    for (const { pattern, points } of shallowPatterns) {
      if (pattern.test(question)) {
        score += points;
      }
    }

    // Check for multi-part questions (often indicate depth)
    const questionParts = question.split(/[?]/).filter(part => part.trim().length > 0);
    if (questionParts.length > 1) {
      score += 10;
    }

    // Check Bloom's taxonomy level
    const bloomsLevel = BloomsTaxonomyKeywords.detectLevel(question);
    if (bloomsLevel.level >= 4) { // Analyze, Evaluate, Create
      score += 15;
    } else if (bloomsLevel.level <= 2) { // Remember, Understand
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private static async assessDepthOfThought(question: string): Promise<number> {
    let score = 40; // Start with base score

    // Length can be an indicator of depth (but not always)
    const wordCount = question.split(/\s+/).length;
    if (wordCount > 20) {
      score += 15;
    } else if (wordCount > 15) {
      score += 10;
    } else if (wordCount < 8) {
      score -= 10;
    }

    // Complex sentence structure
    const clauses = question.split(/,|;|and|but|because|although|while|if/).length;
    if (clauses > 2) {
      score += 15;
    }

    // Conceptual depth indicators
    const depthIndicators = [
      { pattern: /underlying|fundamental|core|essential/i, points: 12 },
      { pattern: /broader.*context|bigger.*picture/i, points: 15 },
      { pattern: /long.*term|future.*implications/i, points: 12 },
      { pattern: /historical.*context|precedent/i, points: 10 },
      { pattern: /ethical|moral|philosophical/i, points: 15 },
      { pattern: /systematic|holistic|comprehensive/i, points: 12 },
      { pattern: /nuance|complexity|subtlety/i, points: 15 },
      { pattern: /challenge.*assumption|question.*premise/i, points: 15 }
    ];

    for (const { pattern, points } of depthIndicators) {
      if (pattern.test(question)) {
        score += points;
      }
    }

    // Surface-level indicators (negative)
    const surfaceIndicators = [
      { pattern: /^define|^describe briefly/i, points: -15 },
      { pattern: /simple|basic|obvious/i, points: -10 },
      { pattern: /^what color|^how many|^which one/i, points: -20 }
    ];

    for (const { pattern, points } of surfaceIndicators) {
      if (pattern.test(question)) {
        score += points;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  private static async assessLearningAlignment(
    question: string,
    context: EducationalContext
  ): Promise<number> {
    let score = 70; // Start with good baseline

    // Check alignment with writing stage
    const stageAlignmentPatterns: Record<string, RegExp[]> = {
      brainstorming: [
        /ideas|topics|explore|consider|possibilities/i,
        /what.*interest|what.*know|what.*experience/i,
        /different.*angles|various.*approaches/i
      ],
      planning: [
        /structure|organize|outline|sequence/i,
        /main.*points|key.*arguments|thesis/i,
        /evidence.*support|examples.*use/i
      ],
      drafting: [
        /develop|expand|elaborate|express/i,
        /paragraph|section|introduction|conclusion/i,
        /flow|transition|connect/i
      ],
      revising: [
        /improve|strengthen|clarify|refine/i,
        /coherence|logic|argument|evidence/i,
        /reader.*perspective|audience.*needs/i
      ],
      editing: [
        /precise|accurate|clear|concise/i,
        /word.*choice|sentence.*structure/i,
        /polish|professional|final/i
      ]
    };

    const stagePatterns = stageAlignmentPatterns[context.writingStage] || [];
    let stageMatches = 0;
    
    for (const pattern of stagePatterns) {
      if (pattern.test(question)) {
        stageMatches++;
      }
    }

    if (stageMatches > 0) {
      score += Math.min(20, stageMatches * 10);
    } else {
      score -= 20; // Penalty for no stage alignment
    }

    // Check alignment with learning objectives
    if (context.learningObjectives && context.learningObjectives.length > 0) {
      let objectiveMatches = 0;
      
      for (const objective of context.learningObjectives) {
        const objectiveLower = objective.toLowerCase();
        const objectiveWords = objectiveLower.split(/\s+/);
        
        for (const word of objectiveWords) {
          if (word.length > 4 && question.toLowerCase().includes(word)) {
            objectiveMatches++;
            break;
          }
        }
      }

      if (objectiveMatches > 0) {
        score += Math.min(15, objectiveMatches * 5);
      } else {
        score -= 15;
      }
    }

    // Academic level appropriateness
    const levelExpectations: Record<string, number> = {
      elementary: 2,
      middle: 3,
      high: 4,
      undergraduate: 4,
      graduate: 5
    };

    const expectedLevel = levelExpectations[context.academicLevel] || 4;
    const actualLevel = BloomsTaxonomyKeywords.detectLevel(question).level;
    const levelDifference = Math.abs(actualLevel - expectedLevel);

    if (levelDifference === 0) {
      score += 10;
    } else if (levelDifference === 1) {
      // No change
    } else {
      score -= levelDifference * 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private static async assessOpenEndedness(question: string): Promise<number> {
    let score = 50; // Start neutral

    // Positive indicators for open-ended questions
    const openEndedPatterns = [
      { pattern: /how might|what could|in what ways/i, points: 15 },
      { pattern: /what are.*possibilities|what.*options/i, points: 15 },
      { pattern: /to what extent|how much|how far/i, points: 12 },
      { pattern: /from.*perspective|point of view/i, points: 15 },
      { pattern: /what factors|what considerations/i, points: 12 },
      { pattern: /how would you|what would you/i, points: 10 },
      { pattern: /explain.*thinking|describe.*approach/i, points: 12 },
      { pattern: /what.*mean to you|how.*understand/i, points: 15 }
    ];

    for (const { pattern, points } of openEndedPatterns) {
      if (pattern.test(question)) {
        score += points;
      }
    }

    // Negative indicators (closed-ended)
    const closedEndedPatterns = [
      { pattern: /^is |^are |^was |^were |^did |^does /i, points: -20 },
      { pattern: /^can |^could |^will |^would |^should /i, points: -15 },
      { pattern: /yes or no|true or false/i, points: -25 },
      { pattern: /which one|correct answer/i, points: -20 },
      { pattern: /^when exactly|^where exactly/i, points: -15 }
    ];

    for (const { pattern, points } of closedEndedPatterns) {
      if (pattern.test(question)) {
        score += points;
      }
    }

    // Check for multiple acceptable answers indicator
    const multipleAnswerPatterns = [
      /various|different|multiple|several/i,
      /could include|might include|such as/i,
      /for example|for instance/i
    ];

    for (const pattern of multipleAnswerPatterns) {
      if (pattern.test(question)) {
        score += 8;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  private static async assessScaffoldingQuality(
    question: string,
    context: EducationalContext
  ): Promise<number> {
    let score = 60; // Start with decent baseline

    // Check if question builds on student's current level
    const scaffoldingPatterns = [
      { pattern: /based on.*your|building on.*your/i, points: 15 },
      { pattern: /considering.*you've|given.*you've/i, points: 12 },
      { pattern: /next step|further develop/i, points: 10 },
      { pattern: /start with|begin by|first consider/i, points: 12 },
      { pattern: /then.*could|after.*might/i, points: 10 },
      { pattern: /what.*already know|prior.*knowledge/i, points: 15 }
    ];

    for (const { pattern, points } of scaffoldingPatterns) {
      if (pattern.test(question)) {
        score += points;
      }
    }

    // Cognitive load considerations
    if (context.studentProfile?.currentState?.cognitiveLoad) {
      const load = context.studentProfile.currentState.cognitiveLoad;
      
      // Adjust based on question complexity vs. student state
      const wordCount = question.split(/\s+/).length;
      
      if (load === 'high' || load === 'overload') {
        if (wordCount > 25) {
          score -= 15; // Too complex for high load
        } else if (wordCount < 15) {
          score += 10; // Appropriately simple
        }
      } else if (load === 'low') {
        if (wordCount < 10) {
          score -= 10; // Too simple for low load
        } else if (wordCount > 20) {
          score += 10; // Appropriately challenging
        }
      }
    }

    // Support structures in the question
    const supportPatterns = [
      { pattern: /for example|such as|like/i, points: 8 },
      { pattern: /hint:|consider:|remember:/i, points: 10 },
      { pattern: /one way|one approach|you might/i, points: 8 },
      { pattern: /break.*down|step.*step|part.*part/i, points: 12 }
    ];

    for (const { pattern, points } of supportPatterns) {
      if (pattern.test(question)) {
        score += points;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  private static calculateOverallQuality(scores: Record<string, number>): number {
    const weights = {
      criticalThinking: 0.25,
      depthOfThought: 0.20,
      learningObjectiveAlignment: 0.20,
      openEndedness: 0.20,
      scaffoldingQuality: 0.15
    };

    let weightedSum = 0;
    for (const [key, weight] of Object.entries(weights)) {
      weightedSum += scores[key] * weight;
    }

    return Math.round(weightedSum);
  }

  private static identifyIssues(scores: Record<string, number>, question: string): string[] {
    const issues: string[] = [];

    if (scores.criticalThinking < 50) {
      issues.push('Question lacks critical thinking elements');
    }

    if (scores.depthOfThought < 40) {
      issues.push('Question is too surface-level or simplistic');
    }

    if (scores.learningObjectiveAlignment < 60) {
      issues.push('Question poorly aligned with learning stage/objectives');
    }

    if (scores.openEndedness < 40) {
      issues.push('Question is too closed-ended or has limited response options');
    }

    if (scores.scaffoldingQuality < 50) {
      issues.push('Question lacks appropriate scaffolding for student level');
    }

    // Specific issues
    if (question.length < 30) {
      issues.push('Question may be too brief to promote deep thinking');
    }

    if (/yes|no/i.test(question) && !/(why|explain|how)/i.test(question)) {
      issues.push('Yes/no question without follow-up for explanation');
    }

    return issues;
  }

  private static identifyStrengths(scores: Record<string, number>, question: string): string[] {
    const strengths: string[] = [];

    if (scores.criticalThinking >= 80) {
      strengths.push('Excellent critical thinking promotion');
    }

    if (scores.depthOfThought >= 75) {
      strengths.push('Encourages deep, thoughtful exploration');
    }

    if (scores.learningObjectiveAlignment >= 85) {
      strengths.push('Well-aligned with learning objectives and stage');
    }

    if (scores.openEndedness >= 80) {
      strengths.push('Highly open-ended with multiple valid responses');
    }

    if (scores.scaffoldingQuality >= 75) {
      strengths.push('Appropriate scaffolding for student level');
    }

    // Specific strengths
    if (/perspective|viewpoint|alternative/i.test(question)) {
      strengths.push('Promotes perspective-taking');
    }

    if (/evidence|support|justify/i.test(question)) {
      strengths.push('Encourages evidence-based thinking');
    }

    return strengths;
  }
}