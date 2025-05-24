import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

// Educational AI Actions - aligned with our philosophy
type WritingStage = 'brainstorming' | 'drafting' | 'revising' | 'editing';

type EducationalAIAction = 
  // Brainstorming Stage - Questions that expand thinking
  | 'generate_prompts'          // "Have you considered..." questions
  | 'suggest_perspectives'      // Alternative viewpoints to explore
  | 'ask_clarifying_questions'  // Help focus ideas
  
  // Drafting Stage - Structure questions, never content
  | 'suggest_organization'      // "How might you organize..." questions
  | 'prompt_development'        // "What evidence supports..." prompts
  | 'identify_gaps'             // Point out missing elements
  
  // Revising Stage - Critical thinking challenges
  | 'evaluate_arguments'        // Logic and consistency questions
  | 'suggest_evidence_needs'    // "What would strengthen..." prompts
  | 'question_logic'            // Challenge reasoning
  
  // Editing Stage - Clarity and correctness guidance
  | 'suggest_grammar_fixes'     // Mechanical corrections with explanation
  | 'identify_clarity_issues'   // Questions about unclear passages
  | 'recommend_style_improvements'; // Reader-focused suggestions

interface AIEducationalRequest {
  studentId: string;
  assignmentId: string;
  action: EducationalAIAction;
  context: {
    currentStage: WritingStage;
    contentSample: string;
    specificQuestion: string;
    learningObjective: string;
  };
}

interface AIEducationalResponse {
  requestId: string;
  approved: boolean;
  
  // Educational guidance (questions/prompts, never answers)
  educationalGuidance?: {
    type: 'question' | 'prompt' | 'perspective' | 'challenge';
    action: EducationalAIAction;
    content: string[];                // Array of questions/prompts
    educationalRationale: string;     // Why this helps learning
    expectedOutcome: string;          // What student should discover
    reflectionPrompt: string;         // Required reflection
  };
  
  // Learning-focused alternatives when denied
  educationalAlternatives?: {
    independentActions: string[];     // What student can do alone
    resourceSuggestions: string[];    // Materials to consult
    reflectionQuestions: string[];    // Questions to consider
    learningObjective: string;        // Why independence matters
  };
  
  // Always required
  contributionTracking: {
    mustBeAttributed: boolean;
    visibleToEducator: boolean;
    impactsAssessment: boolean;
  };
  
  // Mandatory reflection requirements
  mandatoryReflection: {
    required: boolean;
    minimumLength: number;
    qualityThreshold: 'basic' | 'detailed' | 'analytical';
    prompts: string[];
  };
}

interface EducationalAICoachProps {
  studentId: string;
  assignmentId: string;
  currentStage: WritingStage;
  contentSample: string;
  onReflectionRequired: (reflection: { prompt: string; response: string }) => void;
}

export const EducationalAICoach = ({
  studentId,
  assignmentId,
  currentStage,
  contentSample,
  onReflectionRequired
}: EducationalAICoachProps) => {
  useAuth();
  const [selectedAction, setSelectedAction] = useState<EducationalAIAction | null>(null);
  const [specificQuestion, setSpecificQuestion] = useState('');
  const [learningObjective, setLearningObjective] = useState('');
  const [aiResponse, setAiResponse] = useState<AIEducationalResponse | null>(null);
  const [showReflectionForm, setShowReflectionForm] = useState(false);
  const [reflectionResponse, setReflectionResponse] = useState('');

  // Get stage-appropriate educational actions
  const getStageActions = (stage: WritingStage): EducationalAIAction[] => {
    switch (stage) {
      case 'brainstorming':
        return ['generate_prompts', 'suggest_perspectives', 'ask_clarifying_questions'];
      case 'drafting':
        return ['suggest_organization', 'prompt_development', 'identify_gaps'];
      case 'revising':
        return ['evaluate_arguments', 'question_logic', 'suggest_evidence_needs'];
      case 'editing':
        return ['suggest_grammar_fixes', 'identify_clarity_issues', 'recommend_style_improvements'];
      default:
        return [];
    }
  };

  const availableActions = getStageActions(currentStage);

  // Educational action descriptions
  const getActionDescription = (action: EducationalAIAction): string => {
    const descriptions = {
      // Brainstorming
      'generate_prompts': 'Get thought-provoking questions to expand your ideas',
      'suggest_perspectives': 'Explore alternative viewpoints and angles',
      'ask_clarifying_questions': 'Receive questions to help focus your thinking',
      
      // Drafting
      'suggest_organization': 'Get questions about how to structure your ideas',
      'prompt_development': 'Receive prompts to develop your arguments',
      'identify_gaps': 'Find questions about what might be missing',
      
      // Revising
      'evaluate_arguments': 'Get questions to test your logic and reasoning',
      'question_logic': 'Receive challenges to strengthen your thinking',
      'suggest_evidence_needs': 'Find questions about supporting evidence',
      
      // Editing
      'suggest_grammar_fixes': 'Get guidance on mechanical corrections',
      'identify_clarity_issues': 'Find questions about unclear passages',
      'recommend_style_improvements': 'Receive suggestions for better readability'
    };
    return descriptions[action];
  };

  // Submit AI assistance request
  const aiRequestMutation = useMutation({
    mutationFn: async (request: AIEducationalRequest) => {
      const response = await api.post('/analytics/ai-assistance-request', request);
      return response.data.data as AIEducationalResponse;
    },
    onSuccess: (response) => {
      setAiResponse(response);
      if (response.approved && response.mandatoryReflection.required) {
        setShowReflectionForm(true);
      }
    },
  });

  const handleActionSelect = (action: EducationalAIAction) => {
    setSelectedAction(action);
    setAiResponse(null);
    setShowReflectionForm(false);
    setReflectionResponse('');
  };

  const handleSubmitRequest = () => {
    if (!selectedAction || !specificQuestion || !learningObjective) return;

    const request: AIEducationalRequest = {
      studentId,
      assignmentId,
      action: selectedAction,
      context: {
        currentStage,
        contentSample,
        specificQuestion,
        learningObjective
      }
    };

    aiRequestMutation.mutate(request);
  };

  const handleReflectionSubmit = () => {
    if (aiResponse && reflectionResponse.length >= aiResponse.mandatoryReflection.minimumLength) {
      onReflectionRequired({
        prompt: aiResponse.mandatoryReflection.prompts[0],
        response: reflectionResponse
      });
      setShowReflectionForm(false);
      setReflectionResponse('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Educational AI Philosophy Header */}
      <Card className="p-4 bg-gradient-to-r from-scribe-50 to-highlight-50 border-scribe-200">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">🎯</div>
          <div>
            <h3 className="font-semibold text-scribe-900">Educational AI Coach</h3>
            <p className="text-sm text-scribe-700">
              AI asks questions to help you think deeper - it never provides answers or writes content for you.
            </p>
          </div>
        </div>
      </Card>

      {/* Current Writing Stage Context */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-ink-900">Current Writing Stage</h4>
          <Badge className="bg-branch-100 text-branch-800 capitalize">
            {currentStage}
          </Badge>
        </div>
        <p className="text-sm text-ink-600 mb-4">
          {currentStage === 'brainstorming' && 'AI can help you explore ideas and perspectives through thoughtful questions.'}
          {currentStage === 'drafting' && 'AI can ask questions about organization and development of your ideas.'}
          {currentStage === 'revising' && 'AI can challenge your logic and suggest ways to strengthen arguments.'}
          {currentStage === 'editing' && 'AI can help identify clarity issues and mechanical corrections.'}
        </p>

        {/* Available Educational Actions */}
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-ink-900">What kind of thinking help do you need?</h5>
          <div className="grid grid-cols-1 gap-2">
            {availableActions.map((action) => (
              <button
                key={action}
                onClick={() => handleActionSelect(action)}
                className={`text-left p-3 rounded-lg border transition-colors ${
                  selectedAction === action
                    ? 'border-scribe-300 bg-scribe-50'
                    : 'border-ink-200 hover:border-ink-300 hover:bg-ink-50'
                }`}
              >
                <div className="font-medium text-sm text-ink-900 capitalize">
                  {action.replace('_', ' ')}
                </div>
                <div className="text-xs text-ink-600 mt-1">
                  {getActionDescription(action)}
                </div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Educational Context Form */}
      {selectedAction && (
        <Card className="p-4">
          <h4 className="font-medium text-ink-900 mb-3">Help AI Ask Better Questions</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                What specific question or challenge are you trying to work through?
              </label>
              <textarea
                value={specificQuestion}
                onChange={(e) => setSpecificQuestion(e.target.value)}
                className="w-full p-3 border border-ink-300 rounded-lg focus:ring-2 focus:ring-scribe-500 focus:border-scribe-500"
                rows={3}
                placeholder="Describe what you're trying to figure out or improve..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                What do you hope to learn or understand better?
              </label>
              <textarea
                value={learningObjective}
                onChange={(e) => setLearningObjective(e.target.value)}
                className="w-full p-3 border border-ink-300 rounded-lg focus:ring-2 focus:ring-scribe-500 focus:border-scribe-500"
                rows={2}
                placeholder="What skills or insights do you want to develop?"
              />
            </div>

            <Button
              onClick={handleSubmitRequest}
              disabled={!specificQuestion || !learningObjective || aiRequestMutation.isPending}
              className="w-full"
            >
              {aiRequestMutation.isPending ? 'Getting Educational Guidance...' : 'Get Thinking Questions'}
            </Button>
          </div>
        </Card>
      )}

      {/* AI Educational Response */}
      {aiResponse && (
        <Card className="p-4">
          {aiResponse.approved ? (
            <div className="space-y-4">
              {/* Educational Guidance */}
              {aiResponse.educationalGuidance && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Badge className="bg-branch-100 text-branch-800">
                      {aiResponse.educationalGuidance.type}
                    </Badge>
                    <Badge variant="outline">
                      Educational Guidance
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-scribe-50 p-4 rounded-lg">
                      <h5 className="font-medium text-scribe-900 mb-2">Why this helps your learning:</h5>
                      <p className="text-sm text-scribe-800">
                        {aiResponse.educationalGuidance.educationalRationale}
                      </p>
                    </div>

                    <div>
                      <h5 className="font-medium text-ink-900 mb-2">Questions to Consider:</h5>
                      <ul className="space-y-2">
                        {aiResponse.educationalGuidance.content.map((question, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-branch-500 mt-1">•</span>
                            <span className="text-ink-700">{question}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-highlight-50 p-3 rounded-lg">
                      <h6 className="font-medium text-highlight-800 mb-1">What you should discover:</h6>
                      <p className="text-sm text-highlight-700">
                        {aiResponse.educationalGuidance.expectedOutcome}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Attribution Notice */}
              <div className="bg-ink-50 p-3 rounded-lg border border-ink-200">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="text-ink-600">ℹ️</div>
                  <span className="text-sm font-medium text-ink-700">Educational AI Contribution</span>
                </div>
                <p className="text-xs text-ink-600">
                  This AI guidance must be acknowledged in your work. Your educator can see this interaction.
                  {aiResponse.contributionTracking.impactsAssessment && ' This will be considered in your assessment.'}
                </p>
              </div>
            </div>
          ) : (
            // Educational Alternatives when denied
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="text-2xl">🎓</div>
                <div>
                  <h5 className="font-medium text-ink-900">Learning Through Independence</h5>
                  <p className="text-sm text-ink-600">AI is limited here to help you develop critical thinking skills</p>
                </div>
              </div>

              {aiResponse.educationalAlternatives && (
                <div className="space-y-3">
                  <div className="bg-ember-50 p-3 rounded-lg">
                    <h6 className="font-medium text-ember-800 mb-1">Why this builds your skills:</h6>
                    <p className="text-sm text-ember-700">
                      {aiResponse.educationalAlternatives.learningObjective}
                    </p>
                  </div>

                  <div>
                    <h6 className="font-medium text-ink-900 mb-2">Try these independent approaches:</h6>
                    <ul className="space-y-1">
                      {aiResponse.educationalAlternatives.independentActions.map((action, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-branch-500 mt-1">•</span>
                          <span className="text-sm text-ink-700">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h6 className="font-medium text-ink-900 mb-2">Consider these reflection questions:</h6>
                    <ul className="space-y-1">
                      {aiResponse.educationalAlternatives.reflectionQuestions.map((question, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-scribe-500 mt-1">?</span>
                          <span className="text-sm text-ink-700">{question}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Mandatory Reflection Form */}
      {showReflectionForm && aiResponse?.mandatoryReflection && (
        <Card className="p-4 border-scribe-300">
          <div className="flex items-center space-x-2 mb-3">
            <div className="text-2xl">💭</div>
            <h4 className="font-medium text-scribe-900">Required Reflection</h4>
          </div>
          
          <p className="text-sm text-ink-600 mb-3">
            To continue using AI assistance, please reflect on the guidance you received:
          </p>

          <div className="space-y-3">
            <div className="bg-scribe-50 p-3 rounded-lg">
              <p className="text-sm text-scribe-800 font-medium">
                {aiResponse.mandatoryReflection.prompts[0]}
              </p>
            </div>

            <textarea
              value={reflectionResponse}
              onChange={(e) => setReflectionResponse(e.target.value)}
              className="w-full p-3 border border-scribe-300 rounded-lg focus:ring-2 focus:ring-scribe-500"
              rows={4}
              placeholder="Explain your thinking process and how you plan to use this guidance..."
            />

            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-500">
                Minimum {aiResponse.mandatoryReflection.minimumLength} characters 
                ({reflectionResponse.length}/{aiResponse.mandatoryReflection.minimumLength})
              </span>
              <Button
                onClick={handleReflectionSubmit}
                disabled={reflectionResponse.length < aiResponse.mandatoryReflection.minimumLength}
                size="sm"
              >
                Submit Reflection
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};