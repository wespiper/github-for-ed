import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, XCircle, Info, Lock, Unlock } from 'lucide-react';

export type WritingStage = 'brainstorming' | 'drafting' | 'revising' | 'editing';
export type BoundaryLevel = 'strict' | 'guided' | 'flexible';

export interface StageAction {
  id: string;
  name: string;
  description: string;
  educationalRationale: string;
  isAllowed: boolean;
  requiresReflection: boolean;
  examples: string[];
  alternatives?: string[];
}

export interface StageBoundary {
  stage: WritingStage;
  level: BoundaryLevel;
  allowedActions: StageAction[];
  prohibitedActions: StageAction[];
  educationalGoals: string[];
  transitionCriteria: string[];
}

interface StageSpecificBoundariesProps {
  currentStage: WritingStage;
  boundaryLevel: BoundaryLevel;
  studentLevel: 'novice' | 'developing' | 'proficient' | 'advanced';
  onActionRequest: (actionId: string) => void;
  onBoundaryOverride?: (reason: string) => void;
  className?: string;
}

const STAGE_BOUNDARIES: Record<WritingStage, Record<BoundaryLevel, StageBoundary>> = {
  brainstorming: {
    strict: {
      stage: 'brainstorming',
      level: 'strict',
      allowedActions: [
        {
          id: 'generate_questions',
          name: 'Generate Focusing Questions',
          description: 'AI provides questions to help focus your thinking',
          educationalRationale: 'Questions stimulate original thinking without providing answers',
          isAllowed: true,
          requiresReflection: true,
          examples: ['What specific aspect interests you most?', 'How does this connect to your experience?'],
          alternatives: []
        },
        {
          id: 'suggest_perspectives',
          name: 'Suggest Alternative Perspectives',
          description: 'AI offers different viewpoints to consider',
          educationalRationale: 'Multiple perspectives enhance critical thinking',
          isAllowed: true,
          requiresReflection: true,
          examples: ['Consider the economic perspective', 'What would critics argue?'],
          alternatives: []
        },
        {
          id: 'clarify_prompt',
          name: 'Clarify Assignment Prompt',
          description: 'AI helps interpret assignment requirements',
          educationalRationale: 'Understanding requirements is essential for success',
          isAllowed: true,
          requiresReflection: false,
          examples: ['Break down key requirements', 'Identify main objectives'],
          alternatives: []
        }
      ],
      prohibitedActions: [
        {
          id: 'generate_ideas',
          name: 'Generate Ideas',
          description: 'AI creates ideas for you',
          educationalRationale: 'Original idea generation is core to creative thinking',
          isAllowed: false,
          requiresReflection: false,
          examples: [],
          alternatives: ['Use focusing questions to develop your own ideas', 'Try mind mapping techniques']
        },
        {
          id: 'create_outline',
          name: 'Create Outline',
          description: 'AI structures your ideas for you',
          educationalRationale: 'Organizational thinking must be developed personally',
          isAllowed: false,
          requiresReflection: false,
          examples: [],
          alternatives: ['Use organizational questions', 'Practice traditional outlining methods']
        }
      ],
      educationalGoals: [
        'Develop original thinking and creativity',
        'Learn to ask productive questions',
        'Build confidence in idea generation',
        'Practice divergent thinking skills'
      ],
      transitionCriteria: [
        'Has generated sufficient ideas independently',
        'Shows understanding of assignment requirements',
        'Demonstrates ability to think from multiple perspectives'
      ]
    },
    guided: {
      stage: 'brainstorming',
      level: 'guided',
      allowedActions: [
        {
          id: 'generate_questions',
          name: 'Generate Focusing Questions',
          description: 'AI provides questions to help focus your thinking',
          educationalRationale: 'Questions stimulate original thinking without providing answers',
          isAllowed: true,
          requiresReflection: true,
          examples: ['What specific aspect interests you most?', 'How does this connect to your experience?'],
          alternatives: []
        },
        {
          id: 'suggest_perspectives',
          name: 'Suggest Alternative Perspectives',
          description: 'AI offers different viewpoints to consider',
          educationalRationale: 'Multiple perspectives enhance critical thinking',
          isAllowed: true,
          requiresReflection: true,
          examples: ['Consider the economic perspective', 'What would critics argue?'],
          alternatives: []
        },
        {
          id: 'idea_expansion',
          name: 'Idea Expansion Prompts',
          description: 'AI helps you develop existing ideas further',
          educationalRationale: 'Building on your ideas develops analytical thinking',
          isAllowed: true,
          requiresReflection: true,
          examples: ['What evidence supports this?', 'How might this idea evolve?'],
          alternatives: []
        }
      ],
      prohibitedActions: [
        {
          id: 'generate_ideas',
          name: 'Generate Ideas',
          description: 'AI creates ideas for you',
          educationalRationale: 'Original idea generation remains essential',
          isAllowed: false,
          requiresReflection: false,
          examples: [],
          alternatives: ['Use expansion prompts on your existing ideas']
        }
      ],
      educationalGoals: [
        'Develop idea expansion skills',
        'Learn to build on initial thoughts',
        'Practice connecting concepts',
        'Build analytical thinking'
      ],
      transitionCriteria: [
        'Can expand ideas with depth',
        'Shows connections between concepts',
        'Demonstrates analytical thinking'
      ]
    },
    flexible: {
      stage: 'brainstorming',
      level: 'flexible',
      allowedActions: [
        {
          id: 'generate_questions',
          name: 'Generate Focusing Questions',
          description: 'AI provides questions to help focus your thinking',
          educationalRationale: 'Questions stimulate original thinking',
          isAllowed: true,
          requiresReflection: false,
          examples: ['What specific aspect interests you most?'],
          alternatives: []
        },
        {
          id: 'suggest_perspectives',
          name: 'Suggest Alternative Perspectives',
          description: 'AI offers different viewpoints to consider',
          educationalRationale: 'Multiple perspectives enhance thinking',
          isAllowed: true,
          requiresReflection: false,
          examples: ['Consider the economic perspective'],
          alternatives: []
        },
        {
          id: 'idea_expansion',
          name: 'Idea Expansion Prompts',
          description: 'AI helps develop existing ideas',
          educationalRationale: 'Builds analytical thinking',
          isAllowed: true,
          requiresReflection: false,
          examples: ['What evidence supports this?'],
          alternatives: []
        },
        {
          id: 'research_guidance',
          name: 'Research Direction Guidance',
          description: 'AI suggests research directions',
          educationalRationale: 'Efficient research supports idea development',
          isAllowed: true,
          requiresReflection: true,
          examples: ['Look into recent studies on...', 'Primary sources might include...'],
          alternatives: []
        }
      ],
      prohibitedActions: [
        {
          id: 'generate_content',
          name: 'Generate Written Content',
          description: 'AI writes content for you',
          educationalRationale: 'Writing must remain your original work',
          isAllowed: false,
          requiresReflection: false,
          examples: [],
          alternatives: ['Use prompts to guide your own writing']
        }
      ],
      educationalGoals: [
        'Efficient idea development',
        'Strategic research skills',
        'Advanced analytical thinking',
        'Independent learning'
      ],
      transitionCriteria: [
        'Shows sophisticated idea development',
        'Demonstrates research skills',
        'Ready for drafting phase'
      ]
    }
  },
  
  drafting: {
    strict: {
      stage: 'drafting',
      level: 'strict',
      allowedActions: [
        {
          id: 'structural_questions',
          name: 'Structural Questions',
          description: 'AI asks about organization and flow',
          educationalRationale: 'Questions help develop organizational thinking',
          isAllowed: true,
          requiresReflection: true,
          examples: ['How do these paragraphs connect?', 'What\'s your main argument?'],
          alternatives: []
        },
        {
          id: 'audience_questions',
          name: 'Audience Awareness Questions',
          description: 'AI helps consider reader perspective',
          educationalRationale: 'Audience awareness is crucial for effective writing',
          isAllowed: true,
          requiresReflection: true,
          examples: ['What does your reader need to know?', 'How will they react to this?'],
          alternatives: []
        }
      ],
      prohibitedActions: [
        {
          id: 'generate_sentences',
          name: 'Generate Sentences',
          description: 'AI writes sentences for you',
          educationalRationale: 'Sentence crafting develops writing fluency',
          isAllowed: false,
          requiresReflection: false,
          examples: [],
          alternatives: ['Use structural questions to guide your writing']
        },
        {
          id: 'improve_paragraphs',
          name: 'Improve Paragraphs',
          description: 'AI rewrites your paragraphs',
          educationalRationale: 'Revision skills must be developed personally',
          isAllowed: false,
          requiresReflection: false,
          examples: [],
          alternatives: ['Answer questions about paragraph effectiveness']
        }
      ],
      educationalGoals: [
        'Develop drafting fluency',
        'Build organizational skills',
        'Learn audience awareness',
        'Practice sustained writing'
      ],
      transitionCriteria: [
        'Has completed a full first draft',
        'Shows organizational thinking',
        'Demonstrates audience awareness'
      ]
    },
    guided: {
      stage: 'drafting',
      level: 'guided',
      allowedActions: [
        {
          id: 'structural_questions',
          name: 'Structural Questions',
          description: 'AI asks about organization and flow',
          educationalRationale: 'Questions develop organizational thinking',
          isAllowed: true,
          requiresReflection: true,
          examples: ['How do these paragraphs connect?'],
          alternatives: []
        },
        {
          id: 'transition_help',
          name: 'Transition Suggestions',
          description: 'AI suggests ways to connect ideas',
          educationalRationale: 'Good transitions improve coherence',
          isAllowed: true,
          requiresReflection: true,
          examples: ['Consider showing contrast here', 'This needs a bridge to the next idea'],
          alternatives: []
        },
        {
          id: 'evidence_questions',
          name: 'Evidence Questions',
          description: 'AI asks about support for claims',
          educationalRationale: 'Evidence evaluation is critical thinking',
          isAllowed: true,
          requiresReflection: true,
          examples: ['What evidence supports this claim?', 'How strong is this example?'],
          alternatives: []
        }
      ],
      prohibitedActions: [
        {
          id: 'generate_sentences',
          name: 'Generate Sentences',
          description: 'AI writes sentences for you',
          educationalRationale: 'Writing must remain your original expression',
          isAllowed: false,
          requiresReflection: false,
          examples: [],
          alternatives: ['Use questions to guide your sentence construction']
        }
      ],
      educationalGoals: [
        'Improve coherence and flow',
        'Strengthen evidence use',
        'Develop transition skills',
        'Build argument structure'
      ],
      transitionCriteria: [
        'Draft shows good organization',
        'Evidence supports claims effectively',
        'Ideas flow logically'
      ]
    },
    flexible: {
      stage: 'drafting',
      level: 'flexible',
      allowedActions: [
        {
          id: 'structural_questions',
          name: 'Structural Questions',
          description: 'AI asks about organization and flow',
          educationalRationale: 'Questions develop thinking',
          isAllowed: true,
          requiresReflection: false,
          examples: ['How do these paragraphs connect?'],
          alternatives: []
        },
        {
          id: 'style_feedback',
          name: 'Style Feedback',
          description: 'AI comments on writing style and voice',
          educationalRationale: 'Style awareness improves writing quality',
          isAllowed: true,
          requiresReflection: true,
          examples: ['This tone fits your audience', 'Consider varying sentence length'],
          alternatives: []
        },
        {
          id: 'alternative_phrasings',
          name: 'Alternative Phrasing Suggestions',
          description: 'AI suggests different ways to express ideas',
          educationalRationale: 'Multiple options develop language skills',
          isAllowed: true,
          requiresReflection: true,
          examples: ['You could also say...', 'Another way to phrase this...'],
          alternatives: []
        }
      ],
      prohibitedActions: [
        {
          id: 'write_sections',
          name: 'Write Complete Sections',
          description: 'AI writes entire paragraphs or sections',
          educationalRationale: 'Extended writing must be your own work',
          isAllowed: false,
          requiresReflection: false,
          examples: [],
          alternatives: ['Use phrasing suggestions to improve your writing']
        }
      ],
      educationalGoals: [
        'Advanced style development',
        'Sophisticated expression',
        'Efficient drafting',
        'Professional writing skills'
      ],
      transitionCriteria: [
        'Draft demonstrates strong style',
        'Ideas are clearly expressed',
        'Ready for revision focus'
      ]
    }
  },

  revising: {
    strict: {
      stage: 'revising',
      level: 'strict',
      allowedActions: [
        {
          id: 'content_questions',
          name: 'Content Analysis Questions',
          description: 'AI asks about argument strength and evidence',
          educationalRationale: 'Critical analysis develops revision skills',
          isAllowed: true,
          requiresReflection: true,
          examples: ['Is this argument convincing?', 'What\'s missing from this evidence?'],
          alternatives: []
        },
        {
          id: 'reader_perspective',
          name: 'Reader Perspective Questions',
          description: 'AI helps consider reader experience',
          educationalRationale: 'Reader awareness drives effective revision',
          isAllowed: true,
          requiresReflection: true,
          examples: ['What might confuse a reader here?', 'How would they react to this?'],
          alternatives: []
        }
      ],
      prohibitedActions: [
        {
          id: 'rewrite_sections',
          name: 'Rewrite Sections',
          description: 'AI rewrites parts of your draft',
          educationalRationale: 'Revision thinking must be developed personally',
          isAllowed: false,
          requiresReflection: false,
          examples: [],
          alternatives: ['Use analysis questions to guide your revision']
        }
      ],
      educationalGoals: [
        'Develop critical analysis skills',
        'Learn substantive revision',
        'Build reader awareness',
        'Practice argument evaluation'
      ],
      transitionCriteria: [
        'Can identify content strengths/weaknesses',
        'Shows reader awareness',
        'Makes substantive improvements'
      ]
    },
    guided: {
      stage: 'revising',
      level: 'guided',
      allowedActions: [
        {
          id: 'content_questions',
          name: 'Content Analysis Questions',
          description: 'AI asks about argument strength',
          educationalRationale: 'Analysis develops revision skills',
          isAllowed: true,
          requiresReflection: true,
          examples: ['Is this argument convincing?'],
          alternatives: []
        },
        {
          id: 'reorganization_suggestions',
          name: 'Reorganization Suggestions',
          description: 'AI suggests structural improvements',
          educationalRationale: 'Structure affects argument effectiveness',
          isAllowed: true,
          requiresReflection: true,
          examples: ['Consider moving this paragraph', 'This example might work better here'],
          alternatives: []
        },
        {
          id: 'gap_identification',
          name: 'Gap Identification',
          description: 'AI points out missing elements',
          educationalRationale: 'Identifying gaps improves completeness',
          isAllowed: true,
          requiresReflection: true,
          examples: ['This argument needs more support', 'Consider addressing counterarguments'],
          alternatives: []
        }
      ],
      prohibitedActions: [
        {
          id: 'rewrite_content',
          name: 'Rewrite Content',
          description: 'AI rewrites your content',
          educationalRationale: 'Original expression must be preserved',
          isAllowed: false,
          requiresReflection: false,
          examples: [],
          alternatives: ['Use suggestions to guide your own revision']
        }
      ],
      educationalGoals: [
        'Master structural revision',
        'Identify content gaps',
        'Improve argument strength',
        'Develop revision strategies'
      ],
      transitionCriteria: [
        'Makes effective structural changes',
        'Addresses content gaps',
        'Shows strategic revision thinking'
      ]
    },
    flexible: {
      stage: 'revising',
      level: 'flexible',
      allowedActions: [
        {
          id: 'content_questions',
          name: 'Content Analysis Questions',
          description: 'AI analyzes argument strength',
          educationalRationale: 'Analysis improves revision',
          isAllowed: true,
          requiresReflection: false,
          examples: ['Is this argument convincing?'],
          alternatives: []
        },
        {
          id: 'alternative_approaches',
          name: 'Alternative Approaches',
          description: 'AI suggests different ways to present ideas',
          educationalRationale: 'Multiple approaches enhance sophistication',
          isAllowed: true,
          requiresReflection: true,
          examples: ['You could approach this chronologically', 'Consider a compare/contrast structure'],
          alternatives: []
        },
        {
          id: 'impact_assessment',
          name: 'Impact Assessment',
          description: 'AI evaluates potential impact of changes',
          educationalRationale: 'Understanding revision effects improves decisions',
          isAllowed: true,
          requiresReflection: true,
          examples: ['This change would strengthen...', 'Moving this might confuse...'],
          alternatives: []
        }
      ],
      prohibitedActions: [
        {
          id: 'complete_rewrite',
          name: 'Complete Rewrite',
          description: 'AI extensively rewrites your work',
          educationalRationale: 'Original authorship must be maintained',
          isAllowed: false,
          requiresReflection: false,
          examples: [],
          alternatives: ['Use approach suggestions to guide your revision']
        }
      ],
      educationalGoals: [
        'Advanced revision strategies',
        'Sophisticated structural thinking',
        'Impact-aware revision',
        'Professional-level revision skills'
      ],
      transitionCriteria: [
        'Demonstrates advanced revision thinking',
        'Makes sophisticated improvements',
        'Ready for editing phase'
      ]
    }
  },

  editing: {
    strict: {
      stage: 'editing',
      level: 'strict',
      allowedActions: [
        {
          id: 'error_identification',
          name: 'Error Identification Questions',
          description: 'AI asks you to find and fix errors',
          educationalRationale: 'Self-editing develops proofreading skills',
          isAllowed: true,
          requiresReflection: false,
          examples: ['Check this sentence for clarity', 'Look for agreement errors in this paragraph'],
          alternatives: []
        },
        {
          id: 'style_questions',
          name: 'Style Questions',
          description: 'AI asks about word choice and tone',
          educationalRationale: 'Style awareness improves final polish',
          isAllowed: true,
          requiresReflection: true,
          examples: ['Is this word choice effective?', 'Does this tone fit your purpose?'],
          alternatives: []
        }
      ],
      prohibitedActions: [
        {
          id: 'fix_errors',
          name: 'Fix Errors Directly',
          description: 'AI corrects errors for you',
          educationalRationale: 'Error recognition must be developed',
          isAllowed: false,
          requiresReflection: false,
          examples: [],
          alternatives: ['Use error identification questions to improve self-editing']
        }
      ],
      educationalGoals: [
        'Develop self-editing skills',
        'Learn error recognition',
        'Build proofreading habits',
        'Improve attention to detail'
      ],
      transitionCriteria: [
        'Can identify most errors independently',
        'Shows style awareness',
        'Produces clean final draft'
      ]
    },
    guided: {
      stage: 'editing',
      level: 'guided',
      allowedActions: [
        {
          id: 'error_identification',
          name: 'Error Identification',
          description: 'AI points out specific error types',
          educationalRationale: 'Targeted feedback improves learning',
          isAllowed: true,
          requiresReflection: false,
          examples: ['Subject-verb disagreement in line 3', 'Comma splice in second paragraph'],
          alternatives: []
        },
        {
          id: 'style_suggestions',
          name: 'Style Suggestions',
          description: 'AI suggests specific style improvements',
          educationalRationale: 'Specific feedback builds style skills',
          isAllowed: true,
          requiresReflection: true,
          examples: ['Consider a more active voice here', 'This word might be more precise'],
          alternatives: []
        },
        {
          id: 'consistency_check',
          name: 'Consistency Check',
          description: 'AI identifies inconsistencies in style/format',
          educationalRationale: 'Consistency is important for professional writing',
          isAllowed: true,
          requiresReflection: false,
          examples: ['Inconsistent citation format', 'Mixed verb tenses'],
          alternatives: []
        }
      ],
      prohibitedActions: [
        {
          id: 'auto_correct',
          name: 'Auto-Correct Text',
          description: 'AI makes corrections automatically',
          educationalRationale: 'Manual correction builds editing skills',
          isAllowed: false,
          requiresReflection: false,
          examples: [],
          alternatives: ['Use specific feedback to make corrections yourself']
        }
      ],
      educationalGoals: [
        'Learn specific error patterns',
        'Improve style precision',
        'Build consistency awareness',
        'Develop editing efficiency'
      ],
      transitionCriteria: [
        'Corrects errors effectively',
        'Shows style improvement',
        'Maintains consistency'
      ]
    },
    flexible: {
      stage: 'editing',
      level: 'flexible',
      allowedActions: [
        {
          id: 'comprehensive_review',
          name: 'Comprehensive Review',
          description: 'AI provides detailed editing feedback',
          educationalRationale: 'Comprehensive feedback accelerates improvement',
          isAllowed: true,
          requiresReflection: false,
          examples: ['Grammar, style, and formatting review', 'Professional polish suggestions'],
          alternatives: []
        },
        {
          id: 'alternative_phrasings',
          name: 'Alternative Phrasings',
          description: 'AI suggests refined word choices',
          educationalRationale: 'Options help develop sophisticated expression',
          isAllowed: true,
          requiresReflection: false,
          examples: ['More precise terminology', 'Professional tone alternatives'],
          alternatives: []
        },
        {
          id: 'publication_readiness',
          name: 'Publication Readiness Check',
          description: 'AI assesses readiness for submission',
          educationalRationale: 'Standards awareness builds professional skills',
          isAllowed: true,
          requiresReflection: true,
          examples: ['Meets academic standards', 'Professional presentation quality'],
          alternatives: []
        }
      ],
      prohibitedActions: [
        {
          id: 'complete_editing',
          name: 'Complete Editing Service',
          description: 'AI edits the entire document',
          educationalRationale: 'Some editing work must remain your own',
          isAllowed: false,
          requiresReflection: false,
          examples: [],
          alternatives: ['Use comprehensive feedback to guide your editing']
        }
      ],
      educationalGoals: [
        'Professional editing standards',
        'Sophisticated language use',
        'Publication-ready quality',
        'Advanced proofreading skills'
      ],
      transitionCriteria: [
        'Produces professional-quality work',
        'Shows sophisticated language use',
        'Ready for publication/submission'
      ]
    }
  }
};

export const StageSpecificBoundaries: React.FC<StageSpecificBoundariesProps> = ({
  currentStage,
  boundaryLevel,
  studentLevel,
  onActionRequest,
  onBoundaryOverride,
  className = ""
}) => {
  // const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  const boundary = STAGE_BOUNDARIES[currentStage][boundaryLevel];

  const getBoundaryLevelColor = (level: BoundaryLevel) => {
    switch (level) {
      case 'strict': return 'bg-red-100 text-red-800 border-red-200';
      case 'guided': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'flexible': return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getActionIcon = (action: StageAction) => {
    if (!action.isAllowed) return <XCircle className="w-4 h-4 text-red-500" />;
    if (action.requiresReflection) return <Lock className="w-4 h-4 text-yellow-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const handleActionClick = (actionId: string) => {
    const action = [...boundary.allowedActions, ...boundary.prohibitedActions]
      .find(a => a.id === actionId);
    
    if (action?.isAllowed) {
      onActionRequest(actionId);
    } else {
      // setSelectedAction(actionId);
    }
  };

  const handleOverrideRequest = () => {
    if (onBoundaryOverride && overrideReason.trim()) {
      onBoundaryOverride(overrideReason);
      setShowOverrideForm(false);
      setOverrideReason('');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Stage and Boundary Info */}
      <Card className={`border-l-4 ${boundaryLevel === 'strict' ? 'border-l-red-500' : 
        boundaryLevel === 'guided' ? 'border-l-yellow-500' : 'border-l-green-500'}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="capitalize">{currentStage} Stage Boundaries</span>
            <div className="flex items-center gap-2">
              <Badge className={getBoundaryLevelColor(boundaryLevel)}>
                {boundaryLevel} mode
              </Badge>
              <Badge variant="outline" className="capitalize">
                {studentLevel} writer
              </Badge>
            </div>
          </CardTitle>
          <p className="text-sm text-gray-600">
            These boundaries ensure AI assistance enhances your learning without replacing critical thinking skills.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Educational Goals */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Educational Goals for This Stage:
              </h4>
              <ul className="space-y-1">
                {boundary.educationalGoals.map((goal, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-green-500" />
                    {goal}
                  </li>
                ))}
              </ul>
            </div>

            {/* Transition Criteria */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Ready for Next Stage When:</h4>
              <ul className="space-y-1">
                {boundary.transitionCriteria.map((criterion, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                    <Unlock className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-500" />
                    {criterion}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Allowed Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-700">Available AI Actions</CardTitle>
          <p className="text-sm text-gray-600">
            These actions are designed to enhance your learning at this stage.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {boundary.allowedActions.map((action) => (
              <div 
                key={action.id}
                className="border rounded-lg p-3 hover:bg-green-50 cursor-pointer transition-colors"
                onClick={() => handleActionClick(action.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getActionIcon(action)}
                    <h5 className="font-medium">{action.name}</h5>
                    {action.requiresReflection && (
                      <Badge variant="outline" className="text-xs">
                        Reflection Required
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                <p className="text-xs text-blue-600 mb-2">
                  <strong>Why:</strong> {action.educationalRationale}
                </p>
                {action.examples.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Examples:</p>
                    <ul className="text-xs text-gray-500 space-y-1">
                      {action.examples.map((example, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span>•</span>
                          <span>"{example}"</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Prohibited Actions */}
      {boundary.prohibitedActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Restricted Actions
            </CardTitle>
            <p className="text-sm text-gray-600">
              These actions are limited to preserve learning opportunities.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {boundary.prohibitedActions.map((action) => (
                <div 
                  key={action.id}
                  className="border border-red-200 rounded-lg p-3 bg-red-50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getActionIcon(action)}
                      <h5 className="font-medium text-red-800">{action.name}</h5>
                    </div>
                    {onBoundaryOverride && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowOverrideForm(true)}
                        className="text-xs"
                      >
                        Request Override
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-red-700 mb-2">{action.description}</p>
                  <p className="text-xs text-red-600 mb-2">
                    <strong>Why restricted:</strong> {action.educationalRationale}
                  </p>
                  {action.alternatives && action.alternatives.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-green-700 mb-1">Try instead:</p>
                      <ul className="text-xs text-green-600 space-y-1">
                        {action.alternatives.map((alternative, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span>→</span>
                            <span>{alternative}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Override Request Form */}
      {showOverrideForm && onBoundaryOverride && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Request Boundary Override</CardTitle>
            <p className="text-sm text-orange-700">
              Explain why you need access to a restricted action. Your instructor will review this request.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Explain your educational need for this override..."
                className="w-full p-2 border rounded min-h-20"
              />
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowOverrideForm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleOverrideRequest}
                  disabled={!overrideReason.trim()}
                >
                  Submit Request
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StageSpecificBoundaries;