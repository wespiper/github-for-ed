import { EducationalContext } from '../types/educational-contexts.js';
import { EducationalRationale } from '../types/validation-results.js';

export interface AIAction {
  type: 'question_generation' | 'feedback' | 'scaffolding' | 'intervention' | 'assessment';
  content: string | string[];
  timing?: string;
  complexity?: number;
  studentState?: any;
}

export class EducationalRationaleGenerator {
  static async generate(
    aiAction: AIAction,
    context: EducationalContext,
    educationalGoals?: string[]
  ): Promise<EducationalRationale> {
    
    const purpose = this.determinePurpose(aiAction, context);
    const learningObjectives = this.alignWithObjectives(
      aiAction, 
      context.learningObjectives || educationalGoals || []
    );
    const pedagogicalApproach = this.identifyPedagogicalApproach(aiAction, context);
    const expectedOutcomes = this.projectExpectedOutcomes(aiAction, context);
    const transparencyStatement = this.createTransparencyStatement(
      aiAction, 
      purpose, 
      pedagogicalApproach
    );

    return {
      action: this.describeAction(aiAction),
      purpose,
      learningObjectives,
      pedagogicalApproach,
      expectedOutcomes,
      transparencyStatement
    };
  }

  private static describeAction(aiAction: AIAction): string {
    const actionDescriptions: Record<string, string> = {
      question_generation: 'Generated educational questions',
      feedback: 'Provided formative feedback',
      scaffolding: 'Offered learning scaffolds',
      intervention: 'Deployed learning intervention',
      assessment: 'Conducted formative assessment'
    };

    let description = actionDescriptions[aiAction.type] || 'Provided educational support';

    // Add specificity based on content
    if (Array.isArray(aiAction.content)) {
      description += ` (${aiAction.content.length} items)`;
    }

    if (aiAction.timing) {
      description += ` at ${aiAction.timing}`;
    }

    return description;
  }

  private static determinePurpose(aiAction: AIAction, context: EducationalContext): string {
    const basePurposes: Record<string, string> = {
      question_generation: 'Promote critical thinking and deeper engagement with content',
      feedback: 'Guide learning progress without providing direct answers',
      scaffolding: 'Support progressive skill development and independence',
      intervention: 'Address identified learning challenges or opportunities',
      assessment: 'Understand student thinking to inform future support'
    };

    let purpose = basePurposes[aiAction.type] || 'Support student learning journey';

    // Customize based on writing stage
    const stagePurposes: Record<string, string> = {
      brainstorming: 'to explore ideas and expand thinking possibilities',
      planning: 'to organize thoughts and develop coherent structure',
      drafting: 'to express ideas clearly and develop arguments',
      revising: 'to refine content and strengthen overall quality',
      editing: 'to polish expression and ensure clarity'
    };

    if (stagePurposes[context.writingStage]) {
      purpose += ` ${stagePurposes[context.writingStage]}`;
    }

    // Add student state considerations
    if (context.studentProfile?.currentState) {
      const state = context.studentProfile.currentState;
      
      if (state.cognitiveLoad === 'high' || state.cognitiveLoad === 'overload') {
        purpose += ', while managing cognitive load to prevent overwhelm';
      } else if (state.recentBreakthrough) {
        purpose += ', building on recent learning breakthrough';
      } else if (state.strugglingDuration > 15) {
        purpose += ', providing support during extended challenge';
      }
    }

    return purpose;
  }

  private static alignWithObjectives(
    aiAction: AIAction,
    objectives: string[]
  ): string[] {
    const alignedObjectives: string[] = [];

    // Map common learning objectives to AI actions
    const objectiveKeywords: Record<string, string[]> = {
      'critical thinking': ['analyze', 'evaluate', 'question', 'examine', 'critique'],
      'argumentation': ['claim', 'evidence', 'reasoning', 'counterargument', 'support'],
      'organization': ['structure', 'outline', 'sequence', 'flow', 'coherence'],
      'audience awareness': ['reader', 'perspective', 'context', 'purpose', 'tone'],
      'evidence use': ['support', 'cite', 'research', 'data', 'source'],
      'revision skills': ['improve', 'refine', 'strengthen', 'clarify', 'develop'],
      'metacognition': ['thinking', 'process', 'strategy', 'approach', 'reflection'],
      'independence': ['self', 'own', 'strategy', 'approach', 'resource']
    };

    // Check action content against objectives
    const contentText = Array.isArray(aiAction.content) ? 
      aiAction.content.join(' ') : 
      aiAction.content;
    const contentLower = contentText.toLowerCase();

    for (const objective of objectives) {
      const objLower = objective.toLowerCase();
      
      // Direct match
      if (contentLower.includes(objLower) || objLower.includes(aiAction.type)) {
        alignedObjectives.push(objective);
        continue;
      }

      // Keyword match
      for (const [concept, keywords] of Object.entries(objectiveKeywords)) {
        if (objLower.includes(concept)) {
          if (keywords.some(keyword => contentLower.includes(keyword))) {
            alignedObjectives.push(objective);
            break;
          }
        }
      }
    }

    // Add default objectives based on action type if none found
    if (alignedObjectives.length === 0) {
      const defaultObjectives: Record<string, string[]> = {
        question_generation: [
          'Develop critical thinking skills',
          'Enhance analytical capabilities'
        ],
        feedback: [
          'Improve self-assessment abilities',
          'Build revision skills'
        ],
        scaffolding: [
          'Support progressive skill development',
          'Build learning independence'
        ],
        intervention: [
          'Address learning challenges',
          'Maintain engagement and progress'
        ],
        assessment: [
          'Understand student thinking',
          'Inform instructional decisions'
        ]
      };

      alignedObjectives.push(...(defaultObjectives[aiAction.type] || ['Support student learning']));
    }

    return alignedObjectives;
  }

  private static identifyPedagogicalApproach(
    aiAction: AIAction,
    context: EducationalContext
  ): string {
    const approaches: string[] = [];

    // Core approach based on action type
    const coreApproaches: Record<string, string> = {
      question_generation: 'Socratic questioning',
      feedback: 'Formative assessment',
      scaffolding: 'Zone of Proximal Development (ZPD)',
      intervention: 'Just-in-time teaching',
      assessment: 'Assessment for learning'
    };

    approaches.push(coreApproaches[aiAction.type] || 'Constructivist learning');

    // Additional approaches based on context
    if (context.studentProfile) {
      if (context.studentProfile.independenceMetrics.trend === 'increasing') {
        approaches.push('gradual release of responsibility');
      }
      
      if (context.studentProfile.currentState.cognitiveLoad === 'optimal') {
        approaches.push('flow state maintenance');
      }
      
      if (context.studentProfile.preferences.questionComplexity === 'concrete') {
        approaches.push('concrete-to-abstract progression');
      }
    }

    // Stage-specific approaches
    const stageApproaches: Record<string, string> = {
      brainstorming: 'divergent thinking promotion',
      planning: 'structural scaffolding',
      drafting: 'process-focused support',
      revising: 'metacognitive development',
      editing: 'precision and clarity focus'
    };

    if (stageApproaches[context.writingStage]) {
      approaches.push(stageApproaches[context.writingStage]);
    }

    return approaches.join(' with ');
  }

  private static projectExpectedOutcomes(
    aiAction: AIAction,
    context: EducationalContext
  ): string[] {
    const outcomes: string[] = [];

    // Universal outcomes
    outcomes.push('Increased engagement with writing task');
    outcomes.push('Deeper thinking about content and approach');

    // Action-specific outcomes
    const actionOutcomes: Record<string, string[]> = {
      question_generation: [
        'Identification of areas for improvement',
        'New perspectives on topic or approach',
        'Clarified thinking through reflection'
      ],
      feedback: [
        'Understanding of current strengths and areas for growth',
        'Concrete strategies for improvement',
        'Increased self-assessment capability'
      ],
      scaffolding: [
        'Progressive skill development',
        'Reduced cognitive overwhelm',
        'Increased confidence in abilities'
      ],
      intervention: [
        'Overcome specific learning obstacle',
        'Renewed motivation and engagement',
        'Alternative approaches identified'
      ],
      assessment: [
        'Clear understanding of progress',
        'Identified next steps for learning',
        'Metacognitive awareness increased'
      ]
    };

    outcomes.push(...(actionOutcomes[aiAction.type] || []));

    // Context-specific outcomes
    if (context.studentProfile?.currentState?.strugglingDuration && context.studentProfile.currentState.strugglingDuration > 20) {
      outcomes.push('Breakthrough in understanding or approach');
    }

    if (context.studentProfile?.independenceMetrics.trend === 'decreasing') {
      outcomes.push('Renewed confidence in independent work');
    }

    // Writing stage outcomes
    const stageOutcomes: Record<string, string> = {
      brainstorming: 'Expanded idea generation',
      planning: 'Clearer organizational structure',
      drafting: 'Improved content development',
      revising: 'Enhanced argument quality',
      editing: 'Polished final expression'
    };

    if (stageOutcomes[context.writingStage]) {
      outcomes.push(stageOutcomes[context.writingStage]);
    }

    return outcomes;
  }

  private static createTransparencyStatement(
    aiAction: AIAction,
    purpose: string,
    pedagogicalApproach: string
  ): string {
    const statements: string[] = [];

    // Opening statement
    statements.push(`This AI assistance is designed to support your learning journey, not replace your thinking.`);

    // Purpose transparency
    statements.push(`The purpose of this ${aiAction.type.replace('_', ' ')} is ${purpose}.`);

    // Approach transparency
    statements.push(`We're using ${pedagogicalApproach} to help you develop independent writing skills.`);

    // Limitations and expectations
    const limitations: Record<string, string> = {
      question_generation: 'These questions guide your thinking but don\'t provide answers - the insights must come from you.',
      feedback: 'This feedback highlights areas to consider but doesn\'t write content for you.',
      scaffolding: 'These scaffolds are temporary supports to help you build skills you\'ll use independently.',
      intervention: 'This support addresses current challenges while building your capacity to handle similar situations alone.',
      assessment: 'This assessment helps track progress but your growth comes from your own efforts and reflection.'
    };

    statements.push(limitations[aiAction.type] || 'Remember that AI is a tool to enhance, not replace, your learning.');

    // Student agency
    statements.push('You maintain full control over how you use these suggestions and develop your work.');

    // Educational value
    statements.push('Each interaction is designed to build your skills for future independent success.');

    return statements.join(' ');
  }
}