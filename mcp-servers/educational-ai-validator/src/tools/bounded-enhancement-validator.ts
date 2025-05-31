import { EducationalContext, AIResponse } from '../types/educational-contexts.js';
import { BoundedEnhancementValidation, ValidationResult } from '../types/validation-results.js';
import { QuestionQualityValidator } from '../validators/question-quality-validator.js';
import { CognitiveLoadValidator } from '../validators/cognitive-load-validator.js';
import { IndependenceTrajectoryValidator } from '../validators/independence-trajectory-validator.js';

export class BoundedEnhancementValidator {
  static async validate(
    aiResponse: AIResponse, 
    context: EducationalContext
  ): Promise<BoundedEnhancementValidation> {
    
    const validationResults = {
      questionsOnly: await this.validateQuestionsOnly(aiResponse),
      educationalValue: await this.validateEducationalValue(aiResponse, context),
      appropriateDifficulty: await this.validateDifficulty(aiResponse, context),
      independenceBuilding: await this.validateIndependenceBuilding(aiResponse, context),
      transparentRationale: await this.validateTransparency(aiResponse),
      dependencyPrevention: await this.validateDependencyPrevention(aiResponse, context)
    };

    const overallScore = this.calculateOverallScore(validationResults);
    const issues = this.identifyIssues(validationResults);
    const recommendations = this.generateRecommendations(validationResults);

    return {
      isValid: overallScore >= 80, // 80% threshold for approval
      overallScore,
      principleScores: {
        questionsOnly: validationResults.questionsOnly.score,
        educationalValue: validationResults.educationalValue.score,
        appropriateDifficulty: validationResults.appropriateDifficulty.score,
        independenceBuilding: validationResults.independenceBuilding.score,
        transparentRationale: validationResults.transparentRationale.score,
        dependencyPrevention: validationResults.dependencyPrevention.score
      },
      issues,
      recommendations,
      adjustments: this.generateAdjustments(validationResults),
      educationalRationale: this.generateEducationalRationale(aiResponse, context, validationResults)
    };
  }

  private static async validateQuestionsOnly(aiResponse: AIResponse): Promise<ValidationResult> {
    const issues: string[] = [];
    let score = 100;

    // Check if response contains any direct answers or content generation
    const prohibitedPatterns = [
      /here's how to/i,
      /the answer is/i,
      /you should write/i,
      /here's what to say/i,
      /copy this/i,
      /use this text/i,
      /here's a paragraph/i,
      /here's an example:/i,
      /try this:/i
    ];

    const prohibitedPhrases = [
      'write this',
      'use these words',
      'copy and paste',
      'here\'s your thesis',
      'here\'s your conclusion',
      'here\'s your introduction'
    ];

    // Check questions for prohibited patterns
    for (const question of aiResponse.questions || []) {
      for (const pattern of prohibitedPatterns) {
        if (pattern.test(question)) {
          issues.push(`Question contains content generation: "${question.substring(0, 50)}..."`);
          score -= 30;
        }
      }

      for (const phrase of prohibitedPhrases) {
        if (question.toLowerCase().includes(phrase)) {
          issues.push(`Question provides direct answer: "${phrase}"`);
          score -= 25;
        }
      }

      // Verify it's actually a question
      if (!question.includes('?') && !question.toLowerCase().startsWith('consider') && 
          !question.toLowerCase().startsWith('think about') && 
          !question.toLowerCase().startsWith('reflect on')) {
        issues.push(`Statement provided instead of question: "${question.substring(0, 50)}..."`);
        score -= 20;
      }
    }

    // Check for imperative statements disguised as guidance
    const imperativePatterns = [
      /^write about/i,
      /^include these points/i,
      /^make sure to/i,
      /^don't forget to/i,
      /^remember to/i
    ];

    for (const question of aiResponse.questions || []) {
      for (const pattern of imperativePatterns) {
        if (pattern.test(question.trim())) {
          issues.push(`Imperative guidance instead of question: "${question.substring(0, 50)}..."`);
          score -= 15;
        }
      }
    }

    return {
      score: Math.max(0, score),
      issues,
      passed: score >= 70
    };
  }

  private static async validateEducationalValue(
    aiResponse: AIResponse, 
    context: EducationalContext
  ): Promise<ValidationResult> {
    const issues: string[] = [];
    let score = 100;

    const questions = aiResponse.questions || [];
    
    if (questions.length === 0) {
      issues.push('No questions provided');
      return { score: 0, issues, passed: false };
    }

    // Validate each question for educational value
    for (const question of questions) {
      const questionScore = await QuestionQualityValidator.assessEducationalValue(question, context);
      
      if (questionScore.criticalThinking < 60) {
        issues.push(`Low critical thinking value: "${question.substring(0, 50)}..."`);
        score -= 15;
      }

      if (questionScore.depthOfThought < 50) {
        issues.push(`Shallow question depth: "${question.substring(0, 50)}..."`);
        score -= 10;
      }

      if (questionScore.learningObjectiveAlignment < 70) {
        issues.push(`Poor alignment with learning objectives: "${question.substring(0, 50)}..."`);
        score -= 12;
      }
    }

    // Check for question diversity (avoid repetitive questioning)
    const questionTypes = this.categorizeQuestions(questions);
    if (questionTypes.size < Math.min(3, Math.ceil(questions.length / 2))) {
      issues.push('Questions lack diversity in cognitive approaches');
      score -= 15;
    }

    return {
      score: Math.max(0, score),
      issues,
      passed: score >= 70
    };
  }

  private static async validateDifficulty(
    aiResponse: AIResponse, 
    context: EducationalContext
  ): Promise<ValidationResult> {
    const cognitiveValidator = new CognitiveLoadValidator();
    return await cognitiveValidator.validateAppropriateComplexity(
      aiResponse.questions || [],
      context.studentProfile?.currentState?.cognitiveLoad || 'optimal',
      context.academicLevel
    );
  }

  private static async validateIndependenceBuilding(
    aiResponse: AIResponse, 
    context: EducationalContext
  ): Promise<ValidationResult> {
    const independenceValidator = new IndependenceTrajectoryValidator();
    return await independenceValidator.validateIndependenceSupport(
      aiResponse,
      context.studentProfile?.independenceMetrics || null
    );
  }

  private static async validateTransparency(aiResponse: AIResponse): Promise<ValidationResult> {
    const issues: string[] = [];
    let score = 100;

    // Check for educational rationale
    if (!aiResponse.educationalRationale || aiResponse.educationalRationale.trim().length < 50) {
      issues.push('Missing or insufficient educational rationale');
      score -= 30;
    }

    // Check for clear attribution of AI assistance
    if (!aiResponse.attribution || !aiResponse.attribution.includes('AI-generated questions')) {
      issues.push('Missing clear AI attribution');
      score -= 25;
    }

    // Check for transparency about limitations
    if (!aiResponse.limitations || aiResponse.limitations.length === 0) {
      issues.push('Missing explanation of AI limitations');
      score -= 20;
    }

    return {
      score: Math.max(0, score),
      issues,
      passed: score >= 70
    };
  }

  private static async validateDependencyPrevention(
    aiResponse: AIResponse, 
    _context: EducationalContext
  ): Promise<ValidationResult> {
    const issues: string[] = [];
    let score = 100;

    // Check if questions encourage self-reliance
    const dependencyKeywords = [
      'ask me again',
      'i can help you write',
      'let me solve this',
      'i\'ll figure this out',
      'don\'t worry about',
      'i\'ll handle'
    ];

    for (const question of aiResponse.questions || []) {
      for (const keyword of dependencyKeywords) {
        if (question.toLowerCase().includes(keyword)) {
          issues.push(`Question encourages dependency: "${keyword}"`);
          score -= 20;
        }
      }
    }

    // Check for self-reflection prompts
    const selfReflectionCount = (aiResponse.questions || []).filter(q => 
      q.toLowerCase().includes('what do you think') ||
      q.toLowerCase().includes('how might you') ||
      q.toLowerCase().includes('what would you') ||
      q.toLowerCase().includes('consider why') ||
      q.toLowerCase().includes('reflect on')
    ).length;

    if (selfReflectionCount === 0 && aiResponse.questions && aiResponse.questions.length > 1) {
      issues.push('No self-reflection prompts included');
      score -= 15;
    }

    // Check for independence-building language
    const independencePatterns = [
      /what strategies could you/i,
      /how might you approach/i,
      /what resources could you/i,
      /how would you evaluate/i,
      /what evidence would you/i
    ];

    const independenceCount = (aiResponse.questions || []).filter(q =>
      independencePatterns.some(pattern => pattern.test(q))
    ).length;

    if (independenceCount === 0) {
      issues.push('Questions do not build independence skills');
      score -= 10;
    }

    return {
      score: Math.max(0, score),
      issues,
      passed: score >= 70
    };
  }

  private static categorizeQuestions(questions: string[]): Set<string> {
    const categories = new Set<string>();
    
    const patterns = {
      'analysis': /analyze|examine|compare|contrast|evaluate/i,
      'synthesis': /combine|create|design|develop|formulate/i,
      'application': /apply|demonstrate|use|implement|solve/i,
      'comprehension': /explain|describe|summarize|interpret/i,
      'perspective': /viewpoint|perspective|alternative|different angle/i,
      'evidence': /evidence|support|proof|data|research/i,
      'reasoning': /why|because|reason|logic|justify/i,
      'metacognition': /think about thinking|your process|how you/i
    };

    for (const question of questions) {
      for (const [category, pattern] of Object.entries(patterns)) {
        if (pattern.test(question)) {
          categories.add(category);
        }
      }
    }

    return categories;
  }

  private static calculateOverallScore(validationResults: any): number {
    const weights = {
      questionsOnly: 0.25,        // 25% - Core principle
      educationalValue: 0.20,     // 20% - Learning effectiveness
      appropriateDifficulty: 0.15, // 15% - Cognitive load
      independenceBuilding: 0.20,  // 20% - Independence
      transparentRationale: 0.10,  // 10% - Transparency
      dependencyPrevention: 0.10   // 10% - Dependency prevention
    };

    let weightedSum = 0;
    for (const [key, weight] of Object.entries(weights)) {
      weightedSum += validationResults[key].score * weight;
    }

    return Math.round(weightedSum);
  }

  private static identifyIssues(validationResults: any): string[] {
    const allIssues: string[] = [];
    
    for (const result of Object.values(validationResults) as ValidationResult[]) {
      allIssues.push(...result.issues);
    }

    return allIssues;
  }

  private static generateRecommendations(validationResults: any): string[] {
    const recommendations: string[] = [];

    if (validationResults.questionsOnly.score < 80) {
      recommendations.push('Focus on asking questions rather than providing answers or content');
      recommendations.push('Remove any imperative statements or direct guidance');
    }

    if (validationResults.educationalValue.score < 70) {
      recommendations.push('Increase question depth to promote critical thinking');
      recommendations.push('Align questions more closely with learning objectives');
      recommendations.push('Add variety to cognitive approaches in questioning');
    }

    if (validationResults.appropriateDifficulty.score < 70) {
      recommendations.push('Adjust question complexity to match student cognitive load');
      recommendations.push('Consider student academic level when framing questions');
    }

    if (validationResults.independenceBuilding.score < 70) {
      recommendations.push('Include more self-reflection prompts');
      recommendations.push('Frame questions to build problem-solving independence');
      recommendations.push('Avoid language that creates AI dependency');
    }

    if (validationResults.transparentRationale.score < 70) {
      recommendations.push('Provide clear educational rationale for all AI assistance');
      recommendations.push('Include transparent attribution of AI contributions');
      recommendations.push('Explain AI limitations and encourage critical evaluation');
    }

    return recommendations;
  }

  private static generateAdjustments(validationResults: any): Record<string, any> {
    const adjustments: any = {};

    if (validationResults.questionsOnly.score < 70) {
      adjustments.questionsOnly = {
        action: 'rephrase_as_questions',
        priority: 'high',
        examples: [
          'Instead of "Write about X", ask "What aspects of X are most important to explore?"',
          'Instead of "Include Y", ask "How might Y strengthen your argument?"'
        ]
      };
    }

    if (validationResults.educationalValue.score < 70) {
      adjustments.educationalValue = {
        action: 'increase_cognitive_depth',
        priority: 'medium',
        suggestions: [
          'Add questions that require analysis and evaluation',
          'Connect questions to broader learning objectives',
          'Include perspective-taking opportunities'
        ]
      };
    }

    if (validationResults.independenceBuilding.score < 70) {
      adjustments.independenceBuilding = {
        action: 'add_independence_scaffolding',
        priority: 'medium',
        techniques: [
          'Include metacognitive reflection prompts',
          'Ask about student strategies and approaches',
          'Encourage resource identification and evaluation'
        ]
      };
    }

    return adjustments;
  }

  private static generateEducationalRationale(
    _aiResponse: AIResponse,
    context: EducationalContext,
    validationResults: any
  ): string {
    const rationale = [];

    if (validationResults.questionsOnly.passed) {
      rationale.push('Questions maintain educational boundaries by promoting inquiry rather than providing answers.');
    }

    if (validationResults.educationalValue.passed) {
      rationale.push(`Questions align with ${context.writingStage} stage learning objectives and promote critical thinking.`);
    }

    if (validationResults.appropriateDifficulty.passed) {
      rationale.push(`Question complexity is appropriate for ${context.academicLevel} level and current cognitive state.`);
    }

    if (validationResults.independenceBuilding.passed) {
      rationale.push('Questions scaffold independence by encouraging self-reflection and strategic thinking.');
    }

    if (rationale.length === 0) {
      rationale.push('AI response requires adjustment to meet educational standards.');
    }

    return rationale.join(' ');
  }
}