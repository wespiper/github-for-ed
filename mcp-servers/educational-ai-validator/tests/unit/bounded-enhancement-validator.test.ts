import { BoundedEnhancementValidator } from '../../src/tools/bounded-enhancement-validator.js';
import { EducationalContext, AIResponse } from '../../src/types/educational-contexts.js';

describe('BoundedEnhancementValidator', () => {
  describe('validate', () => {
    test('should pass valid educational questions', async () => {
      const aiResponse: AIResponse = {
        questions: [
          'What evidence supports your main argument?',
          'How might a skeptical reader respond to this claim?',
          'What assumptions are you making about your audience?'
        ],
        educationalRationale: 'These questions promote critical thinking about argument construction and audience awareness',
        attribution: 'AI-generated questions for educational support',
        limitations: ['Cannot evaluate content quality', 'Questions are suggestions only']
      };

      const context: EducationalContext = {
        writingStage: 'revising',
        academicLevel: 'undergraduate',
        learningObjectives: ['critical thinking', 'argument analysis']
      };

      const result = await BoundedEnhancementValidator.validate(aiResponse, context);
      
      expect(result.isValid).toBe(true);
      expect(result.overallScore).toBeGreaterThan(80);
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
      expect(result.recommendations.some(rec => rec.includes('asking questions'))).toBe(true);
    });

    test('should validate educational value and question diversity', async () => {
      const aiResponse: AIResponse = {
        questions: [
          'Analyze the effectiveness of your evidence in supporting your thesis.',
          'Evaluate potential counterarguments to your position.',
          'How might you strengthen the logical flow between paragraphs?',
          'What patterns do you notice in your argument structure?'
        ],
        educationalRationale: 'Questions designed to promote analytical thinking and structural awareness',
        attribution: 'AI-generated educational questions',
        limitations: ['General guidance only', 'Context-specific nuance limited']
      };

      const context: EducationalContext = {
        writingStage: 'revising',
        academicLevel: 'undergraduate',
        learningObjectives: ['critical thinking', 'argument analysis', 'revision strategies']
      };

      const result = await BoundedEnhancementValidator.validate(aiResponse, context);
      
      expect(result.isValid).toBe(true);
      expect(result.principleScores.educationalValue).toBeGreaterThan(70);
      expect(result.educationalRationale).toContain('critical thinking');
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
      expect(result.recommendations.some(rec => rec.includes('critical thinking'))).toBe(true);
    });

    test('should adjust difficulty based on cognitive load', async () => {
      const aiResponse: AIResponse = {
        questions: [
          'How does your argument connect to broader theoretical frameworks while considering multiple stakeholder perspectives and long-term societal implications?',
          'Analyze the epistemological assumptions underlying your methodology and their impact on your conclusions.',
          'Synthesize interdisciplinary perspectives to evaluate the systemic ramifications of your proposal.'
        ]
      };

      const context: EducationalContext = {
        writingStage: 'drafting',
        academicLevel: 'undergraduate',
        studentProfile: {
          studentId: 'test-student',
          currentState: {
            cognitiveLoad: 'overload',
            recentBreakthrough: false,
            strugglingDuration: 30,
            lastSuccessfulInteraction: new Date()
          },
          independenceMetrics: {
            aiRequestFrequency: 5,
            independentWorkStreak: 10,
            qualityWithoutAI: 60,
            trend: 'stable'
          },
          preferences: {
            questionComplexity: 'concrete',
            bestRespondsTo: ['examples', 'step-by-step'],
            strugglesWIth: ['abstract concepts'],
            averageReflectionDepth: 50
          },
          strengths: {
            evidenceAnalysis: 70,
            perspectiveTaking: 60,
            logicalReasoning: 65,
            creativeThinking: 55,
            organizationalSkills: 75
          }
        }
      };

      const result = await BoundedEnhancementValidator.validate(aiResponse, context);
      
      expect(result.principleScores.appropriateDifficulty).toBeLessThan(70);
      expect(result.issues.some(issue => issue.includes('too complex'))).toBe(true);
      expect(result.recommendations.some(rec => rec.includes('complexity'))).toBe(true);
    });

    test('should validate independence building elements', async () => {
      const aiResponse: AIResponse = {
        questions: [
          'What strategies could you develop to approach similar writing challenges?',
          'How might you evaluate the effectiveness of your own arguments?',
          'What resources could you identify to strengthen your research independently?'
        ],
        educationalRationale: 'Questions designed to build self-reliance and strategic thinking',
        attribution: 'AI-generated scaffolding questions',
        limitations: ['General strategies only']
      };

      const context: EducationalContext = {
        writingStage: 'revising',
        academicLevel: 'undergraduate'
      };

      const result = await BoundedEnhancementValidator.validate(aiResponse, context);
      
      expect(result.principleScores.independenceBuilding).toBeGreaterThan(70);
      expect(result.principleScores.dependencyPrevention).toBeGreaterThan(70);
    });

    test('should fail when encouraging dependency', async () => {
      const aiResponse: AIResponse = {
        questions: [
          'Just ask me again if you need more help with this.',
          'I can help you write the introduction if you\'re stuck.',
          'Don\'t worry about figuring this out alone, I\'ll help.'
        ]
      };

      const context: EducationalContext = {
        writingStage: 'drafting',
        academicLevel: 'undergraduate'
      };

      const result = await BoundedEnhancementValidator.validate(aiResponse, context);
      
      expect(result.isValid).toBe(false);
      expect(result.principleScores.dependencyPrevention).toBeLessThan(50);
      expect(result.issues.some(issue => issue.includes('dependency'))).toBe(true);
    });

    test('should require transparency elements', async () => {
      const aiResponse: AIResponse = {
        questions: [
          'What evidence supports your thesis?',
          'How could you strengthen your argument?'
        ]
        // Missing educationalRationale, attribution, limitations
      };

      const context: EducationalContext = {
        writingStage: 'revising',
        academicLevel: 'undergraduate'
      };

      const result = await BoundedEnhancementValidator.validate(aiResponse, context);
      
      expect(result.principleScores.transparentRationale).toBeLessThan(70);
      expect(result.issues.some(issue => issue.includes('rationale'))).toBe(true);
      expect(result.issues.some(issue => issue.includes('attribution'))).toBe(true);
      expect(result.issues.some(issue => issue.includes('limitations'))).toBe(true);
    });

    test('should generate appropriate adjustments for violations', async () => {
      const aiResponse: AIResponse = {
        questions: [
          'Here\'s how to structure your essay: introduction, three body paragraphs, conclusion.',
          'The main point should be stated in your thesis.',
          'Include evidence from at least three sources.'
        ]
      };

      const context: EducationalContext = {
        writingStage: 'planning',
        academicLevel: 'high'
      };

      const result = await BoundedEnhancementValidator.validate(aiResponse, context);
      
      expect(result.isValid).toBe(false);
      expect(result.adjustments).toBeDefined();
      expect(result.adjustments.questionsOnly).toBeDefined();
      expect(result.adjustments.questionsOnly.action).toBe('rephrase_as_questions');
      expect(result.adjustments.questionsOnly.examples).toBeDefined();
    });
  });

  describe('edge cases', () => {
    test('should handle empty questions array', async () => {
      const aiResponse: AIResponse = {
        questions: []
      };

      const context: EducationalContext = {
        writingStage: 'drafting',
        academicLevel: 'undergraduate'
      };

      const result = await BoundedEnhancementValidator.validate(aiResponse, context);
      
      expect(result.isValid).toBe(false);
      expect(result.principleScores.educationalValue).toBe(0);
      expect(result.issues.some(issue => issue.includes('No questions provided'))).toBe(true);
    });

    test('should handle missing student profile gracefully', async () => {
      const aiResponse: AIResponse = {
        questions: [
          'What evidence supports your argument?',
          'How might you organize your ideas more effectively?'
        ],
        educationalRationale: 'Basic scaffolding questions',
        attribution: 'AI-generated questions',
        limitations: ['General guidance only']
      };

      const context: EducationalContext = {
        writingStage: 'planning',
        academicLevel: 'high'
        // No studentProfile provided
      };

      const result = await BoundedEnhancementValidator.validate(aiResponse, context);
      
      expect(result.isValid).toBe(true);
      expect(result.overallScore).toBeGreaterThan(70);
    });
  });
});