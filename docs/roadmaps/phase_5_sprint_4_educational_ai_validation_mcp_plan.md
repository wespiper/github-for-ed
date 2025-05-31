# Educational AI Validation & Testing MCP Server - Implementation Plan

## 🎯 **Project Overview**

Create an MCP server that automates educational AI validation and testing for Scribe Tree's bounded enhancement philosophy. This server will replace the planned manual implementation of `EducationalValidator.ts` and `PhilosophyEnforcer.ts` with automated, consistent validation tools.

## 📋 **Core Requirements from Scribe Tree's Phase 5**

### **Bounded Enhancement Principles to Validate**
1. **Questions Only**: AI never generates content, only asks educational questions
2. **Mandatory Reflection**: Every AI interaction requires meaningful student reflection
3. **Progressive Independence**: AI access decreases as competency develops
4. **Transparent Attribution**: All AI contributions visible to educators
5. **Educational Boundaries**: Context-sensitive assistance appropriate to learning stage

### **Integration Points**
- **AIBoundaryService.ts**: Enhanced validation for assistance requests
- **ClaudeProvider.ts**: Validate AI responses before delivery
- **ReflectionAnalysisService.ts**: Validate reflection requirements
- **StudentLearningProfileService.ts**: Validate progressive access calculations

---

## 🏗️ **MCP Server Architecture**

### **Server Structure**
```
educational-ai-validator/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                           # MCP server entry point
│   ├── tools/
│   │   ├── bounded-enhancement-validator.ts   # Core bounded enhancement validation
│   │   ├── blooms-taxonomy-analyzer.ts       # Educational question level assessment
│   │   ├── dependency-risk-detector.ts       # AI dependency prevention
│   │   ├── philosophy-enforcer.ts            # Principle compliance checking
│   │   ├── reflection-requirement-validator.ts # Reflection quality validation
│   │   └── educational-rationale-generator.ts # Transparent reasoning
│   ├── validators/
│   │   ├── question-quality-validator.ts     # Question educational value
│   │   ├── cognitive-load-validator.ts       # Appropriate difficulty assessment
│   │   ├── independence-trajectory-validator.ts # Progressive access validation
│   │   └── transfer-learning-validator.ts    # Skill development potential
│   ├── analyzers/
│   │   ├── linguistic-analyzer.ts            # NLP analysis for question quality
│   │   ├── educational-psychology-analyzer.ts # Learning theory compliance
│   │   └── pedagogy-analyzer.ts              # Teaching methodology alignment
│   ├── types/
│   │   ├── educational-contexts.ts           # Educational context definitions
│   │   ├── validation-results.ts             # Validation result types
│   │   └── bounded-enhancement-types.ts      # Bounded enhancement specific types
│   └── utils/
│       ├── educational-patterns.ts           # Common educational patterns
│       ├── blooms-taxonomy-keywords.ts       # Bloom's taxonomy verb mappings
│       └── philosophy-principles.ts          # Core philosophy definitions
├── tests/
│   ├── integration/
│   ├── unit/
│   └── educational-scenarios/
└── docs/
    ├── tool-reference.md
    └── integration-guide.md
```

### **Core MCP Tools to Implement**

```typescript
interface MCPToolDefinitions {
  // Primary validation tools
  validate_bounded_enhancement: (aiResponse: AIResponse, context: EducationalContext) => BoundedEnhancementValidation;
  assess_blooms_taxonomy: (questions: string[]) => BloomsTaxonomyAssessment;
  check_dependency_risk: (interactionPattern: AIInteractionPattern) => DependencyRiskAssessment;
  enforce_philosophy_principles: (response: AIResponse) => PhilosophyComplianceResult;
  
  // Reflection validation
  validate_reflection_requirements: (response: AIResponse, studentProfile: StudentProfile) => ReflectionValidation;
  assess_reflection_quality_threshold: (reflectionHistory: ReflectionHistory) => QualityThreshold;
  
  // Educational rationale
  generate_educational_rationale: (aiAction: AIAction, context: EducationalContext) => EducationalRationale;
  explain_boundary_decision: (boundaryAction: BoundaryAction) => BoundaryExplanation;
  
  // Progressive access validation
  validate_progressive_access: (accessLevel: AccessLevel, studentMetrics: StudentMetrics) => AccessValidation;
  calculate_independence_trajectory: (usageHistory: AIUsageHistory) => IndependenceProjection;
  
  // Question quality assessment
  analyze_question_educational_value: (question: string, context: EducationalContext) => EducationalValueScore;
  assess_cognitive_complexity: (questions: string[], studentLevel: AcademicLevel) => CognitiveComplexityAnalysis;
}
```

---

## 📝 **Implementation Details**

### **1. Core Server Setup (src/index.ts)**

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

// Import tool implementations
import { BoundedEnhancementValidator } from './tools/bounded-enhancement-validator.js';
import { BloomsTaxonomyAnalyzer } from './tools/blooms-taxonomy-analyzer.js';
import { DependencyRiskDetector } from './tools/dependency-risk-detector.js';
import { PhilosophyEnforcer } from './tools/philosophy-enforcer.js';
import { ReflectionRequirementValidator } from './tools/reflection-requirement-validator.js';
import { EducationalRationaleGenerator } from './tools/educational-rationale-generator.js';

// Educational context types
import { 
  EducationalContext, 
  AIResponse, 
  StudentProfile,
  BoundedEnhancementValidation 
} from './types/educational-contexts.js';

const server = new Server(
  {
    name: 'educational-ai-validator',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define all MCP tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'validate_bounded_enhancement',
        description: 'Validate AI response against bounded enhancement principles',
        inputSchema: {
          type: 'object',
          properties: {
            aiResponse: {
              type: 'object',
              properties: {
                questions: { type: 'array', items: { type: 'string' } },
                educationalGuidance: { type: 'object' },
                rationale: { type: 'string' }
              },
              required: ['questions']
            },
            context: {
              type: 'object',
              properties: {
                writingStage: { type: 'string' },
                academicLevel: { type: 'string' },
                learningObjectives: { type: 'array', items: { type: 'string' } },
                studentProfile: { type: 'object' }
              },
              required: ['writingStage', 'academicLevel']
            }
          },
          required: ['aiResponse', 'context']
        }
      },
      {
        name: 'assess_blooms_taxonomy',
        description: 'Analyze questions for Bloom\'s taxonomy cognitive levels',
        inputSchema: {
          type: 'object',
          properties: {
            questions: { type: 'array', items: { type: 'string' } },
            targetLevel: { type: 'number', minimum: 1, maximum: 6 },
            academicLevel: { type: 'string' }
          },
          required: ['questions']
        }
      },
      {
        name: 'check_dependency_risk',
        description: 'Assess AI dependency risk from interaction patterns',
        inputSchema: {
          type: 'object',
          properties: {
            interactionPattern: {
              type: 'object',
              properties: {
                frequency: { type: 'number' },
                requestTypes: { type: 'array', items: { type: 'string' } },
                reflectionQuality: { type: 'number' },
                independentWorkRatio: { type: 'number' }
              },
              required: ['frequency', 'requestTypes']
            },
            studentProfile: { type: 'object' }
          },
          required: ['interactionPattern']
        }
      },
      {
        name: 'enforce_philosophy_principles',
        description: 'Enforce Scribe Tree\'s educational philosophy principles',
        inputSchema: {
          type: 'object',
          properties: {
            response: { type: 'object' },
            principles: {
              type: 'object',
              properties: {
                questionsOnly: { type: 'boolean' },
                mandatoryReflection: { type: 'boolean' },
                progressiveAccess: { type: 'boolean' },
                transparentAttribution: { type: 'boolean' },
                independenceBuilding: { type: 'boolean' }
              }
            }
          },
          required: ['response']
        }
      },
      {
        name: 'validate_reflection_requirements',
        description: 'Validate reflection requirements for AI interactions',
        inputSchema: {
          type: 'object',
          properties: {
            response: { type: 'object' },
            studentProfile: { type: 'object' },
            previousReflections: { type: 'array' }
          },
          required: ['response', 'studentProfile']
        }
      },
      {
        name: 'generate_educational_rationale',
        description: 'Generate transparent educational rationale for AI actions',
        inputSchema: {
          type: 'object',
          properties: {
            aiAction: { type: 'object' },
            context: { type: 'object' },
            educationalGoals: { type: 'array', items: { type: 'string' } }
          },
          required: ['aiAction', 'context']
        }
      },
      {
        name: 'analyze_question_educational_value',
        description: 'Analyze the educational value of questions',
        inputSchema: {
          type: 'object',
          properties: {
            question: { type: 'string' },
            context: { type: 'object' },
            learningObjectives: { type: 'array' }
          },
          required: ['question', 'context']
        }
      },
      {
        name: 'validate_progressive_access',
        description: 'Validate progressive access level decisions',
        inputSchema: {
          type: 'object',
          properties: {
            currentAccessLevel: { type: 'string' },
            studentMetrics: { type: 'object' },
            proposedChange: { type: 'object' }
          },
          required: ['currentAccessLevel', 'studentMetrics']
        }
      }
    ]
  };
});

// Tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'validate_bounded_enhancement':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await BoundedEnhancementValidator.validate(args.aiResponse, args.context),
                null,
                2
              )
            }
          ]
        };

      case 'assess_blooms_taxonomy':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await BloomsTaxonomyAnalyzer.analyze(args.questions, args.targetLevel, args.academicLevel),
                null,
                2
              )
            }
          ]
        };

      case 'check_dependency_risk':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await DependencyRiskDetector.assess(args.interactionPattern, args.studentProfile),
                null,
                2
              )
            }
          ]
        };

      case 'enforce_philosophy_principles':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await PhilosophyEnforcer.enforce(args.response, args.principles),
                null,
                2
              )
            }
          ]
        };

      case 'validate_reflection_requirements':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await ReflectionRequirementValidator.validate(
                  args.response, 
                  args.studentProfile, 
                  args.previousReflections
                ),
                null,
                2
              )
            }
          ]
        };

      case 'generate_educational_rationale':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await EducationalRationaleGenerator.generate(
                  args.aiAction, 
                  args.context, 
                  args.educationalGoals
                ),
                null,
                2
              )
            }
          ]
        };

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Tool ${name} not found`);
    }
  } catch (error) {
    throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error.message}`);
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Educational AI Validator MCP Server running on stdio');
}

main().catch(console.error);
```

### **2. Bounded Enhancement Validator (src/tools/bounded-enhancement-validator.ts)**

```typescript
import { EducationalContext, AIResponse, BoundedEnhancementValidation } from '../types/educational-contexts.js';
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
    context: EducationalContext
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

  private static generateAdjustments(validationResults: any): object {
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
    aiResponse: AIResponse,
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

interface ValidationResult {
  score: number;
  issues: string[];
  passed: boolean;
}
```

### **3. Bloom's Taxonomy Analyzer (src/tools/blooms-taxonomy-analyzer.ts)**

```typescript
import { BloomsTaxonomyKeywords } from '../utils/blooms-taxonomy-keywords.js';

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

export class BloomsTaxonomyAnalyzer {
  static async analyze(
    questions: string[], 
    targetLevel?: number, 
    academicLevel?: string
  ): Promise<BloomsTaxonomyAssessment> {
    
    const questionLevels = questions.map(question => 
      this.analyzeQuestionLevel(question)
    );

    const distribution = this.calculateDistribution(questionLevels);
    const overallLevel = this.calculateOverallLevel(questionLevels);
    const recommendations = this.generateRecommendations(
      questionLevels, 
      targetLevel, 
      academicLevel
    );

    const educationalAlignment = this.assessEducationalAlignment(
      overallLevel,
      targetLevel,
      academicLevel
    );

    return {
      overallLevel,
      questionLevels,
      distribution,
      recommendations,
      educationalAlignment
    };
  }

  private static analyzeQuestionLevel(question: string): {
    question: string;
    level: number;
    confidence: number;
    reasoning: string;
  } {
    const questionLower = question.toLowerCase();
    const keywords = BloomsTaxonomyKeywords.getKeywords();
    
    let detectedLevel = 1;
    let confidence = 0;
    let reasoning = '';
    
    // Check for explicit Bloom's verbs (highest confidence)
    for (let level = 6; level >= 1; level--) {
      const levelKeywords = keywords[level];
      for (const keyword of levelKeywords.primary) {
        if (questionLower.includes(keyword)) {
          detectedLevel = level;
          confidence = 0.9;
          reasoning = `Contains primary Bloom's verb: "${keyword}"`;
          return { question, level: detectedLevel, confidence, reasoning };
        }
      }
    }

    // Check for secondary indicators
    for (let level = 6; level >= 1; level--) {
      const levelKeywords = keywords[level];
      for (const keyword of levelKeywords.secondary || []) {
        if (questionLower.includes(keyword)) {
          detectedLevel = level;
          confidence = 0.7;
          reasoning = `Contains secondary indicator: "${keyword}"`;
          break;
        }
      }
      if (confidence > 0) break;
    }

    // Pattern-based analysis for complex questions
    if (confidence === 0) {
      const patterns = this.analyzeQuestionPatterns(question);
      detectedLevel = patterns.level;
      confidence = patterns.confidence;
      reasoning = patterns.reasoning;
    }

    return { question, level: detectedLevel, confidence, reasoning };
  }

  private static analyzeQuestionPatterns(question: string): {
    level: number;
    confidence: number;
    reasoning: string;
  } {
    const questionLower = question.toLowerCase();

    // Level 6 - Create patterns
    if (questionLower.includes('design') || 
        questionLower.includes('develop a new') ||
        questionLower.includes('create an original') ||
        questionLower.includes('compose') ||
        questionLower.includes('construct a plan')) {
      return {
        level: 6,
        confidence: 0.8,
        reasoning: 'Pattern suggests creation/synthesis activity'
      };
    }

    // Level 5 - Evaluate patterns
    if (questionLower.includes('judge') ||
        questionLower.includes('critique') ||
        questionLower.includes('assess the value') ||
        questionLower.includes('evaluate the effectiveness') ||
        (questionLower.includes('which is better') && questionLower.includes('why'))) {
      return {
        level: 5,
        confidence: 0.8,
        reasoning: 'Pattern suggests evaluation/judgment activity'
      };
    }

    // Level 4 - Analyze patterns
    if (questionLower.includes('why') && 
        (questionLower.includes('different') || questionLower.includes('similar')) ||
        questionLower.includes('what evidence') ||
        questionLower.includes('what factors') ||
        questionLower.includes('how does this relate')) {
      return {
        level: 4,
        confidence: 0.75,
        reasoning: 'Pattern suggests analytical thinking'
      };
    }

    // Level 3 - Apply patterns
    if (questionLower.includes('how would you use') ||
        questionLower.includes('apply this to') ||
        questionLower.includes('what would happen if') ||
        questionLower.includes('solve this problem')) {
      return {
        level: 3,
        confidence: 0.7,
        reasoning: 'Pattern suggests application activity'
      };
    }

    // Level 2 - Understand patterns
    if (questionLower.includes('explain why') ||
        questionLower.includes('what does this mean') ||
        questionLower.includes('summarize') ||
        questionLower.includes('interpret')) {
      return {
        level: 2,
        confidence: 0.6,
        reasoning: 'Pattern suggests comprehension activity'
      };
    }

    // Level 1 - Remember patterns (default)
    return {
      level: 1,
      confidence: 0.5,
      reasoning: 'No clear higher-order thinking patterns detected'
    };
  }

  private static calculateDistribution(questionLevels: any[]): any {
    const distribution = {
      remember: 0,
      understand: 0,
      apply: 0,
      analyze: 0,
      evaluate: 0,
      create: 0
    };

    const levelNames = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
    
    questionLevels.forEach(q => {
      const levelName = levelNames[q.level - 1];
      distribution[levelName]++;
    });

    // Convert to percentages
    const total = questionLevels.length;
    Object.keys(distribution).forEach(key => {
      distribution[key] = Math.round((distribution[key] / total) * 100);
    });

    return distribution;
  }

  private static calculateOverallLevel(questionLevels: any[]): number {
    if (questionLevels.length === 0) return 1;

    // Weighted average with confidence
    const weightedSum = questionLevels.reduce((sum, q) => 
      sum + (q.level * q.confidence), 0
    );
    const totalWeight = questionLevels.reduce((sum, q) => 
      sum + q.confidence, 0
    );

    return Math.round(weightedSum / totalWeight);
  }

  private static generateRecommendations(
    questionLevels: any[], 
    targetLevel?: number, 
    academicLevel?: string
  ): string[] {
    const recommendations: string[] = [];
    const overallLevel = this.calculateOverallLevel(questionLevels);

    // Target level recommendations
    if (targetLevel && overallLevel < targetLevel) {
      recommendations.push(
        `Current question level (${overallLevel}) is below target (${targetLevel}). ` +
        `Consider adding more complex analytical or evaluative questions.`
      );
    }

    // Academic level appropriateness
    const expectedLevels = {
      'elementary': 2,
      'middle': 3,
      'high': 4,
      'undergraduate': 4,
      'graduate': 5
    };

    if (academicLevel && expectedLevels[academicLevel]) {
      const expected = expectedLevels[academicLevel];
      if (overallLevel < expected) {
        recommendations.push(
          `For ${academicLevel} level, consider increasing cognitive complexity ` +
          `to level ${expected} (currently ${overallLevel})`
        );
      }
    }

    // Distribution recommendations
    const distribution = this.calculateDistribution(questionLevels);
    
    if (distribution.remember > 40) {
      recommendations.push(
        'Too many recall-based questions. Add more analysis and application questions.'
      );
    }

    if (distribution.analyze + distribution.evaluate + distribution.create < 30) {
      recommendations.push(
        'Add more higher-order thinking questions (analyze, evaluate, create).'
      );
    }

    if (questionLevels.some(q => q.confidence < 0.6)) {
      recommendations.push(
        'Some questions have ambiguous cognitive levels. Use clearer Bloom\'s taxonomy verbs.'
      );
    }

    return recommendations;
  }

  private static assessEducationalAlignment(
    actualLevel: number,
    targetLevel?: number,
    academicLevel?: string
  ): any {
    const target = targetLevel || this.getDefaultTargetLevel(academicLevel);
    
    return {
      isAppropriate: Math.abs(actualLevel - target) <= 1,
      targetLevel: target,
      actualLevel,
      adjustment: actualLevel < target ? 
        'increase_complexity' : 
        actualLevel > target ? 'decrease_complexity' : 'maintain_level'
    };
  }

  private static getDefaultTargetLevel(academicLevel?: string): number {
    const defaults = {
      'elementary': 2,
      'middle': 3,
      'high': 4,
      'undergraduate': 4,
      'graduate': 5
    };

    return defaults[academicLevel || 'undergraduate'] || 4;
  }
}
```

### **4. Philosophy Enforcer (src/tools/philosophy-enforcer.ts)**

```typescript
import { 
  ProductiveStrugglePrinciple,
  CognitiveLoadBalancePrinciple,
  IndependenceTrajectoryPrinciple,
  TransferLearningPrinciple,
  TransparentDependencyPrinciple
} from '../validators/philosophy-principles.js';

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

export class PhilosophyEnforcer {
  static async enforce(
    response: any,
    principles?: any
  ): Promise<PhilosophyComplianceResult> {
    
    // Validate against all Scribe Tree philosophy principles
    const principleResults = {
      productiveStruggle: await ProductiveStrugglePrinciple.validate(response),
      cognitiveBalance: await CognitiveLoadBalancePrinciple.validate(response),
      independenceTrajectory: await IndependenceTrajectoryPrinciple.validate(response),
      transferLearning: await TransferLearningPrinciple.validate(response),
      transparentDependency: await TransparentDependencyPrinciple.validate(response)
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
          description: `${principle} principle violation`,
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

  private static getPrincipleRecommendation(principle: string, issues: string[]): string {
    const recommendations = {
      productiveStruggle: 'Ensure questions maintain appropriate challenge without providing answers',
      cognitiveBalance: 'Adjust question complexity to match student cognitive capacity',
      independenceTrajectory: 'Frame questions to build self-reliance and autonomous thinking',
      transferLearning: 'Connect questions to broader skills and transferable knowledge',
      transparentDependency: 'Clearly attribute AI assistance and explain its educational purpose'
    };

    return recommendations[principle] || 'Review and adjust based on principle requirements';
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
          break;

        case 'cognitiveBalance':
          if (violation.evidence.includes('too complex')) {
            adjustments.push({
              type: 'reduce_complexity',
              description: 'Simplify questions to match cognitive capacity',
              priority: 'medium'
            });
          }
          if (violation.evidence.includes('too simple')) {
            adjustments.push({
              type: 'add_scaffolding',
              description: 'Add complexity while maintaining support',
              priority: 'medium'
            });
          }
          break;

        case 'independenceTrajectory':
          adjustments.push({
            type: 'add_reflection',
            description: 'Add metacognitive reflection prompts',
            priority: 'high',
            example: 'Include "What strategies are you using to approach this problem?"'
          });
          break;

        case 'transferLearning':
          adjustments.push({
            type: 'add_scaffolding',
            description: 'Connect questions to broader skills and contexts',
            priority: 'medium',
            example: 'Ask "How might this approach apply to other writing situations?"'
          });
          break;

        case 'transparentDependency':
          adjustments.push({
            type: 'add_reflection',
            description: 'Add clear attribution and limitation statements',
            priority: 'high'
          });
          break;
      }
    });

    return adjustments;
  }
}
```

### **5. Types and Interfaces (src/types/educational-contexts.ts)**

```typescript
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
  adjustments: object;
  educationalRationale: string;
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
```

---

## 🧪 **Testing Strategy**

### **Unit Testing Framework**

```typescript
// tests/unit/bounded-enhancement-validator.test.ts
import { BoundedEnhancementValidator } from '../src/tools/bounded-enhancement-validator.js';
import { EducationalContext, AIResponse } from '../src/types/educational-contexts.js';

describe('BoundedEnhancementValidator', () => {
  describe('validateQuestionsOnly', () => {
    test('should pass valid educational questions', async () => {
      const aiResponse: AIResponse = {
        questions: [
          'What evidence supports your main argument?',
          'How might a skeptical reader respond to this claim?',
          'What assumptions are you making about your audience?'
        ],
        educationalRationale: 'These questions promote critical thinking about argument construction'
      };

      const context: EducationalContext = {
        writingStage: 'revising',
        academicLevel: 'undergraduate'
      };

      const result = await BoundedEnhancementValidator.validate(aiResponse, context);
      
      expect(result.isValid).toBe(true);
      expect(result.principleScores.questionsOnly).toBeGreaterThan(80);
      expect(result.issues).toHaveLength(0);
    });

    test('should fail when providing direct answers', async () => {
      const aiResponse: AIResponse = {
        questions: [
          'The answer is to include more evidence in your second paragraph.',
          'You should write: "Climate change is a serious threat because..."',
          'Here\'s how to fix your conclusion: restate your main points.'
        ]
      };

      const context: EducationalContext = {
        writingStage: 'drafting',
        academicLevel: 'undergraduate'
      };

      const result = await BoundedEnhancementValidator.validate(aiResponse, context);
      
      expect(result.isValid).toBe(false);
      expect(result.principleScores.questionsOnly).toBeLessThan(50);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some(issue => issue.includes('content generation'))).toBe(true);
    });

    test('should detect imperative statements disguised as guidance', async () => {
      const aiResponse: AIResponse = {
        questions: [
          'Write about the environmental impacts first.',
          'Make sure to include three main arguments.',
          'Don\'t forget to cite your sources in MLA format.'
        ]
      };

      const context: EducationalContext = {
        writingStage: 'planning',
        academicLevel: 'high'
      };

      const result = await BoundedEnhancementValidator.validate(aiResponse, context);
      
      expect(result.isValid).toBe(false);
      expect(result.issues.some(issue => issue.includes('Imperative guidance'))).toBe(true);
    });
  });

  describe('validateEducationalValue', () => {
    test('should assess question quality and learning alignment', async () => {
      const aiResponse: AIResponse = {
        questions: [
          'Analyze the effectiveness of your evidence in supporting your thesis.',
          'Evaluate potential counterarguments to your position.',
          'How might you strengthen the logical flow between paragraphs?'
        ]
      };

      const context: EducationalContext = {
        writingStage: 'revising',
        academicLevel: 'undergraduate',
        learningObjectives: ['critical thinking', 'argument analysis', 'revision strategies']
      };

      const result = await BoundedEnhancementValidator.validate(aiResponse, context);
      
      expect(result.principleScores.educationalValue).toBeGreaterThan(70);
    });

    test('should identify shallow or repetitive questions', async () => {
      const aiResponse: AIResponse = {
        questions: [
          'What is your topic?',
          'What is your main point?',
          'What is your conclusion?',
          'What is your first argument?'
        ]
      };

      const context: EducationalContext = {
        writingStage: 'revising',
        academicLevel: 'undergraduate'
      };

      const result = await BoundedEnhancementValidator.validate(aiResponse, context);
      
      expect(result.principleScores.educationalValue).toBeLessThan(60);
      expect(result.issues.some(issue => issue.includes('lack diversity'))).toBe(true);
    });
  });
});
```

### **Integration Testing with Scribe Tree Backend**

```typescript
// tests/integration/scribe-tree-integration.test.ts
import { MCPClient } from '@modelcontextprotocol/sdk/client/index.js';

describe('Scribe Tree Integration', () => {
  let mcpClient: MCPClient;

  beforeAll(async () => {
    // Set up MCP client connection
    mcpClient = new MCPClient({
      name: 'test-client',
      version: '1.0.0'
    });
    
    // Connect to educational validator MCP server
    await mcpClient.connect();
  });

  test('should integrate with AIBoundaryService', async () => {
    // Simulate AIBoundaryService call
    const aiResponse = {
      questions: [
        'What evidence best supports your argument about renewable energy?',
        'How might critics challenge your position on solar power costs?'
      ],
      educationalRationale: 'Questions promote evidence evaluation and perspective-taking',
      attribution: 'AI-generated questions for educational support'
    };

    const context = {
      writingStage: 'revising',
      academicLevel: 'undergraduate',
      studentProfile: {
        currentState: { cognitiveLoad: 'optimal' },
        independenceMetrics: { trend: 'increasing' }
      }
    };

    const validation = await mcpClient.call('validate_bounded_enhancement', {
      aiResponse,
      context
    });

    expect(validation.isValid).toBe(true);
    expect(validation.overallScore).toBeGreaterThan(80);
  });

  test('should integrate with ClaudeProvider validation', async () => {
    // Test real Claude response validation
    const claudeResponse = {
      questions: [
        'What assumptions about your audience might be limiting your argument\'s effectiveness?',
        'How could you strengthen the connection between your evidence and conclusions?',
        'What would make a reader more likely to accept your perspective?'
      ],
      educationalRationale: 'Questions encourage audience awareness and argument refinement'
    };

    const validation = await mcpClient.call('enforce_philosophy_principles', {
      response: claudeResponse,
      principles: {
        questionsOnly: true,
        mandatoryReflection: true,
        progressiveAccess: true,
        transparentAttribution: true,
        independenceBuilding: true
      }
    });

    expect(validation.overallCompliance).toBe(true);
    expect(validation.violations).toHaveLength(0);
  });

  afterAll(async () => {
    await mcpClient.disconnect();
  });
});
```

### **Educational Scenario Testing**

```typescript
// tests/educational-scenarios/bounded-enhancement-scenarios.test.ts
describe('Educational Scenario Testing', () => {
  const scenarios = [
    {
      name: 'High-performing student in revision stage',
      context: {
        writingStage: 'revising',
        academicLevel: 'undergraduate',
        studentProfile: {
          currentState: { cognitiveLoad: 'optimal' },
          independenceMetrics: { trend: 'increasing', aiRequestFrequency: 1 },
          strengths: { evidenceAnalysis: 85, logicalReasoning: 80 }
        }
      },
      expectedOutcome: {
        validQuestions: [
          'How might you anticipate and address the strongest counterargument to your thesis?',
          'What additional perspectives could enrich your analysis of this issue?'
        ],
        invalidQuestions: [
          'Here\'s a stronger thesis statement for your essay.',
          'Add this sentence to improve your conclusion.'
        ]
      }
    },
    {
      name: 'Struggling student in brainstorming stage',
      context: {
        writingStage: 'brainstorming',
        academicLevel: 'high',
        studentProfile: {
          currentState: { cognitiveLoad: 'high' },
          independenceMetrics: { trend: 'stable', aiRequestFrequency: 4 },
          strengths: { creativeThinking: 65, organizationalSkills: 45 }
        }
      },
      expectedOutcome: {
        validQuestions: [
          'What topics genuinely interest you about this assignment?',
          'What do you already know about this subject from your own experience?'
        ],
        invalidQuestions: [
          'Write about these three main environmental issues.',
          'Your essay should have five paragraphs structured like this.'
        ]
      }
    }
  ];

  scenarios.forEach(scenario => {
    test(`should handle ${scenario.name}`, async () => {
      for (const question of scenario.expectedOutcome.validQuestions) {
        const aiResponse = {
          questions: [question],
          educationalRationale: 'Scaffolded support for student learning'
        };

        const validation = await BoundedEnhancementValidator.validate(aiResponse, scenario.context);
        expect(validation.isValid).toBe(true);
      }

      for (const question of scenario.expectedOutcome.invalidQuestions) {
        const aiResponse = {
          questions: [question]
        };

        const validation = await BoundedEnhancementValidator.validate(aiResponse, scenario.context);
        expect(validation.isValid).toBe(false);
      }
    });
  });
});
```

---

## 🔗 **Integration with Scribe Tree Backend**

### **AIBoundaryService Integration**

```typescript
// backend/src/services/AIBoundaryService.ts - Enhanced with MCP validation
import { MCPClient } from '@modelcontextprotocol/sdk/client/index.js';

export class AIBoundaryService {
  private static mcpClient: MCPClient;

  static async initializeMCP() {
    this.mcpClient = new MCPClient({
      name: 'scribe-tree-backend',
      version: '1.0.0'
    });
    
    // Connect to educational validator MCP server
    await this.mcpClient.connect({
      transport: {
        type: 'stdio',
        command: 'node',
        args: ['./mcp-servers/educational-ai-validator/dist/index.js']
      }
    });
  }

  static async evaluateAssistanceRequest(request: AIAssistanceRequest): Promise<AIEducationalResponse> {
    // Your existing logic for generating response
    const response = await this.createEducationalResponse(request);

    // NEW: MCP validation integration
    try {
      const validation = await this.mcpClient.call('validate_bounded_enhancement', {
        aiResponse: {
          questions: response.educationalG