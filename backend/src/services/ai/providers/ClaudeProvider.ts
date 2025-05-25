import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import {
  AIProvider,
  EducationalContext,
  EducationalQuestion,
  EducationalQuestionSet,
  PerspectiveSuggestion,
  ValidationResult,
  AIProviderResponse,
  TokenUsage
} from './AIProviderInterface';
import { AIEducationalAction } from '../../AIBoundaryService';

export class ClaudeProvider implements AIProvider {
  public readonly name = 'claude';
  private client?: Anthropic;
  private model?: string;
  private maxTokens?: number;
  private temperature?: number;
  private initialized = false;

  constructor() {
    // Delay initialization until first use to avoid environment variable issues
  }

  private initialize() {
    if (this.initialized) return;
    
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      throw new Error('CLAUDE_API_KEY environment variable is required');
    }
    
    this.client = new Anthropic({
      apiKey: apiKey,
    });
    this.model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
    this.maxTokens = parseInt(process.env.CLAUDE_MAX_TOKENS || '4096');
    this.temperature = parseFloat(process.env.CLAUDE_TEMPERATURE || '0.7');
    
    this.initialized = true;
    console.log('Claude Provider initialized with model:', this.model);
  }

  async generateEducationalQuestions(context: EducationalContext): Promise<EducationalQuestionSet> {
    this.initialize();
    const prompt = this.buildEducationalPrompt(context);
    
    try {
      const response = await this.callClaude(prompt);
      const parsedResponse = await this.parseEducationalResponse(response.content, context.writingStage);
      
      return {
        requestId: uuidv4(),
        action: this.getActionFromStage(context.writingStage),
        questions: parsedResponse.questions,
        overallEducationalGoal: parsedResponse.overallGoal,
        reflectionPrompt: parsedResponse.reflectionPrompt,
        nextStepSuggestions: parsedResponse.nextSteps
      };
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error('Failed to generate educational questions');
    }
  }

  async generatePerspectives(
    topic: string,
    currentArguments: string[],
    context: EducationalContext
  ): Promise<PerspectiveSuggestion[]> {
    this.initialize();
    const prompt = this.buildPerspectivePrompt(topic, currentArguments, context);
    
    try {
      const response = await this.callClaude(prompt);
      return await this.parsePerspectiveResponse(response.content);
    } catch (error) {
      console.error('Claude perspective generation error:', error);
      throw new Error('Failed to generate educational perspectives');
    }
  }

  async validateEducationalResponse(response: string): Promise<ValidationResult> {
    this.initialize();
    const validationPrompt = `
As an educational AI validator, analyze this response to ensure it meets educational standards:

Response to validate: "${response}"

Check for:
1. Does it provide questions rather than answers?
2. Does it encourage critical thinking?
3. Does it maintain educational boundaries?
4. Is it appropriate for academic learning?

Respond with JSON format:
{
  "isEducationallySound": boolean,
  "containsAnswers": boolean,
  "providesQuestions": boolean,
  "alignsWithLearningObjectives": boolean,
  "appropriateComplexity": boolean,
  "issues": ["list", "of", "issues"],
  "suggestions": ["list", "of", "improvements"]
}`;

    try {
      const validation = await this.callClaude(validationPrompt);
      return JSON.parse(validation.content);
    } catch (error) {
      // Fallback validation
      return {
        isEducationallySound: true,
        containsAnswers: false,
        providesQuestions: true,
        alignsWithLearningObjectives: true,
        appropriateComplexity: true,
        issues: [],
        suggestions: []
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    this.initialize();
    try {
      const response = await this.client!.messages.create({
        model: this.model!,
        max_tokens: 10,
        temperature: 0,
        messages: [{
          role: 'user',
          content: 'Health check - respond with "OK"'
        }]
      });
      return response.content[0].type === 'text' && response.content[0].text.includes('OK');
    } catch (error) {
      console.error('Claude health check failed:', error);
      return false;
    }
  }

  private async callClaude(prompt: string): Promise<AIProviderResponse> {
    const startTime = Date.now();
    
    const response = await this.client!.messages.create({
      model: this.model!,
      max_tokens: this.maxTokens!,
      temperature: this.temperature!,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    const processingTime = Date.now() - startTime;

    // Calculate token usage (approximate for now)
    const tokenUsage: TokenUsage = {
      inputTokens: Math.ceil(prompt.length / 4),
      outputTokens: Math.ceil(content.length / 4),
      totalTokens: Math.ceil((prompt.length + content.length) / 4),
      estimatedCost: Math.ceil((prompt.length + content.length) / 4) * 0.000008 // Approximate Claude pricing
    };

    return {
      content,
      tokenUsage,
      model: this.model!,
      timestamp: new Date(),
      processingTime
    };
  }

  private buildEducationalPrompt(context: EducationalContext): string {
    const stageGuidance = this.getStageSpecificGuidance(context.writingStage);
    
    return `You are an educational AI assistant for a writing platform. Your role is to ask thoughtful questions that help students think deeper about their writing, NOT to provide answers or write content for them.

EDUCATIONAL CONTEXT:
- Writing Stage: ${context.writingStage}
- Student Level: ${context.academicLevel}
- Specific Question: ${context.specificQuestion}
- Learning Objective: ${context.learningObjective}

STUDENT'S CURRENT WRITING:
"${context.contentSample}"

STAGE-SPECIFIC GUIDANCE:
${stageGuidance}

CRITICAL EDUCATIONAL RULES:
1. Ask questions, NEVER provide answers
2. Encourage critical thinking and self-discovery
3. Help students develop their own ideas
4. Focus on the learning process, not the product
5. Maintain academic integrity

Please provide 3-5 educational questions that will help this student think deeper about their writing. For each question, explain why it's educationally valuable.

Format your response as JSON:
{
  "questions": [
    {
      "id": "q1",
      "type": "clarifying|expanding|challenging|perspective|reflection",
      "question": "Your thoughtful question here",
      "educationalRationale": "Why this question helps learning",
      "expectedOutcome": "What the student should discover",
      "followUpPrompts": ["Additional prompts if needed"]
    }
  ],
  "overallGoal": "What this set of questions aims to achieve",
  "reflectionPrompt": "A question for the student to reflect on after engaging with these questions",
  "nextSteps": ["Suggestions for what the student should do next"]
}`;
  }

  private buildPerspectivePrompt(topic: string, currentArguments: string[], context: EducationalContext): string {
    return `You are an educational AI assistant helping a student explore different perspectives on a topic. Your role is to suggest alternative viewpoints for the student to consider and explore through their own research and thinking.

TOPIC: ${topic}

STUDENT'S CURRENT ARGUMENTS:
${currentArguments.map((arg, i) => `${i + 1}. ${arg}`).join('\n')}

EDUCATIONAL CONTEXT:
- Writing Stage: ${context.writingStage}
- Student Level: ${context.academicLevel}
- Learning Objective: ${context.learningObjective}

Please suggest 3-4 alternative perspectives the student should consider. For each perspective, provide questions they should explore, not answers.

Format as JSON:
{
  "perspectives": [
    {
      "id": "p1",
      "perspective": "Name of the perspective",
      "description": "Brief description of this viewpoint",
      "questionsToExplore": ["Questions for the student to investigate"],
      "educationalValue": "Why exploring this perspective enhances learning",
      "resourceSuggestions": ["Types of sources to look for"]
    }
  ]
}`;
  }

  private getStageSpecificGuidance(stage: string): string {
    const guidance = {
      brainstorming: `
For brainstorming, focus on:
- Questions that expand thinking beyond obvious ideas
- Prompts that encourage creative connections
- Inquiries about personal experience and perspective
- Questions about audience and purpose`,
      
      drafting: `
For drafting, focus on:
- Questions about organization and structure
- Prompts about evidence and support
- Inquiries about audience awareness
- Questions about clarity and flow`,
      
      revising: `
For revising, focus on:
- Questions that challenge arguments and logic
- Prompts about evidence strength and relevance
- Inquiries about counterarguments
- Questions about overall effectiveness`,
      
      editing: `
For editing, focus on:
- Questions about clarity and precision
- Prompts about word choice and style
- Inquiries about conventions and format
- Questions about final polish and presentation`
    };

    return guidance[stage as keyof typeof guidance] || guidance.drafting;
  }

  private getActionFromStage(stage: string): AIEducationalAction {
    const actionMap = {
      brainstorming: 'generate_prompts' as AIEducationalAction,
      drafting: 'prompt_development' as AIEducationalAction,
      revising: 'evaluate_arguments' as AIEducationalAction,
      editing: 'identify_clarity_issues' as AIEducationalAction
    };

    return actionMap[stage as keyof typeof actionMap] || 'generate_prompts';
  }

  private async parseEducationalResponse(content: string, stage: string): Promise<any> {
    try {
      const parsed = JSON.parse(content);
      
      // Ensure all questions have proper IDs and types
      if (parsed.questions) {
        parsed.questions = parsed.questions.map((q: any, index: number) => ({
          id: q.id || `q${index + 1}`,
          type: q.type || 'clarifying',
          question: q.question,
          educationalRationale: q.educationalRationale || 'Helps develop critical thinking',
          expectedOutcome: q.expectedOutcome || 'Deeper understanding of the topic',
          followUpPrompts: q.followUpPrompts || []
        }));
      }

      return {
        questions: parsed.questions || [],
        overallGoal: parsed.overallGoal || 'Enhance critical thinking and writing development',
        reflectionPrompt: parsed.reflectionPrompt || 'How did these questions change your thinking about your writing?',
        nextSteps: parsed.nextSteps || ['Reflect on the questions', 'Apply insights to your writing']
      };
    } catch (error) {
      // Fallback if JSON parsing fails
      return {
        questions: [{
          id: 'fallback1',
          type: 'clarifying',
          question: 'What is the main point you want your reader to understand?',
          educationalRationale: 'Helps clarify central argument',
          expectedOutcome: 'Clearer focus in writing',
          followUpPrompts: ['How can you make this point more compelling?']
        }],
        overallGoal: 'Clarify writing focus and purpose',
        reflectionPrompt: 'How did thinking about your main point help you?',
        nextSteps: ['Revise with clearer focus', 'Strengthen supporting evidence']
      };
    }
  }

  private async parsePerspectiveResponse(content: string): Promise<PerspectiveSuggestion[]> {
    try {
      const parsed = JSON.parse(content);
      return parsed.perspectives || [];
    } catch (error) {
      // Fallback perspectives
      return [{
        id: 'fallback1',
        perspective: 'Alternative Viewpoint',
        description: 'Consider opposing arguments and different stakeholder perspectives',
        questionsToExplore: ['What would critics of this position argue?', 'Who might be affected differently?'],
        educationalValue: 'Develops critical thinking and argument strength',
        resourceSuggestions: ['Academic sources with different viewpoints', 'Primary sources from various stakeholders']
      }];
    }
  }
}