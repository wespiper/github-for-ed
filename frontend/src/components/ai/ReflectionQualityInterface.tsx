import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, Brain, ArrowRight } from 'lucide-react';

export type ReflectionDepth = 'surface' | 'developing' | 'deep' | 'transformative';

export interface ReflectionAssessment {
  depth: ReflectionDepth;
  score: number; // 0-100
  criteria: {
    specificity: number;      // How specific vs generic
    metacognition: number;    // Thinking about thinking
    connection: number;       // Links to prior learning/experience
    growth: number;          // Recognition of learning/change
    application: number;     // Future application insights
  };
  feedback: string[];
  aiAccessLevel: 'minimal' | 'guided' | 'full';
  recommendedActions: string[];
}

export interface ReflectionPrompt {
  id: string;
  stage: 'brainstorming' | 'drafting' | 'revising' | 'editing';
  prompt: string;
  followUpQuestions: string[];
  minimumWordCount: number;
  assessmentCriteria: string[];
}

interface ReflectionQualityInterfaceProps {
  writingStage: 'brainstorming' | 'drafting' | 'revising' | 'editing';
  aiInteractionContext: string;
  onReflectionComplete: (assessment: ReflectionAssessment) => void;
  onReflectionSkipped: () => void;
  className?: string;
}

const REFLECTION_PROMPTS: Record<string, ReflectionPrompt> = {
  brainstorming: {
    id: 'brainstorm-reflect',
    stage: 'brainstorming',
    prompt: "Before accessing AI assistance for brainstorming, reflect on your current thinking process:",
    followUpQuestions: [
      "What specific aspects of this topic are you most uncertain about?",
      "What do you already know that might be relevant?",
      "What questions are driving your curiosity about this topic?",
      "How does this connect to your previous writing or learning experiences?"
    ],
    minimumWordCount: 100,
    assessmentCriteria: [
      "Identifies specific knowledge gaps",
      "Shows awareness of existing knowledge",
      "Demonstrates curiosity and questioning",
      "Makes connections to prior experience"
    ]
  },
  drafting: {
    id: 'draft-reflect',
    stage: 'drafting',
    prompt: "Reflect on your drafting process and current challenges:",
    followUpQuestions: [
      "Where are you getting stuck in your writing?",
      "What organizational choices have you made and why?",
      "How are you deciding what to include or exclude?",
      "What voice or tone are you trying to achieve?"
    ],
    minimumWordCount: 120,
    assessmentCriteria: [
      "Identifies specific writing challenges",
      "Shows awareness of rhetorical choices",
      "Demonstrates strategic thinking about content",
      "Reflects on audience and purpose"
    ]
  },
  revising: {
    id: 'revise-reflect',
    stage: 'revising',
    prompt: "Reflect on your revision process and what you've learned from your draft:",
    followUpQuestions: [
      "What patterns do you notice in your current draft?",
      "Where do you feel the argument or narrative is strongest/weakest?",
      "What feedback have you received and how are you processing it?",
      "How has your understanding of the topic evolved through writing?"
    ],
    minimumWordCount: 150,
    assessmentCriteria: [
      "Analyzes patterns in own writing",
      "Evaluates strengths and weaknesses critically",
      "Processes feedback thoughtfully",
      "Shows evolution of understanding"
    ]
  },
  editing: {
    id: 'edit-reflect',
    stage: 'editing',
    prompt: "Reflect on your editing priorities and final decisions:",
    followUpQuestions: [
      "What editing priorities are most important for this piece?",
      "How do you decide when a sentence or paragraph needs revision?",
      "What patterns do you notice in your writing that need attention?",
      "How will you know when this piece is ready for your intended audience?"
    ],
    minimumWordCount: 100,
    assessmentCriteria: [
      "Prioritizes editing strategically",
      "Shows awareness of sentence-level choices",
      "Recognizes personal writing patterns",
      "Understands audience readiness"
    ]
  }
};

export const ReflectionQualityInterface: React.FC<ReflectionQualityInterfaceProps> = ({
  writingStage,
  // aiInteractionContext,
  onReflectionComplete,
  onReflectionSkipped,
  className = ""
}) => {
  const [reflection, setReflection] = useState('');
  const [assessment, setAssessment] = useState<ReflectionAssessment | null>(null);
  const [isAssessing, setIsAssessing] = useState(false);
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);

  const prompt = REFLECTION_PROMPTS[writingStage];
  const wordCount = reflection.trim().split(/\s+/).filter(word => word.length > 0).length;
  const meetsMinimum = wordCount >= prompt.minimumWordCount;

  const assessReflection = (text: string): ReflectionAssessment => {
    // Simplified assessment algorithm - in production, this would use more sophisticated NLP
    const words = text.toLowerCase();
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Specificity: looks for specific examples, details, concrete references
    const specificityIndicators = ['example', 'specifically', 'particular', 'instance', 'case', 'situation'];
    const specificity = Math.min(100, (specificityIndicators.filter(indicator => 
      words.includes(indicator)).length * 20) + (sentences.length > 5 ? 20 : 0));

    // Metacognition: thinking about thinking
    const metacognitionIndicators = ['think', 'realize', 'understand', 'learn', 'discover', 'notice', 'aware'];
    const metacognition = Math.min(100, metacognitionIndicators.filter(indicator => 
      words.includes(indicator)).length * 15);

    // Connection: links to prior experience
    const connectionIndicators = ['previous', 'before', 'similar', 'reminds', 'connects', 'relates', 'experience'];
    const connection = Math.min(100, connectionIndicators.filter(indicator => 
      words.includes(indicator)).length * 20);

    // Growth: recognition of learning/change
    const growthIndicators = ['changed', 'evolved', 'developed', 'improved', 'learned', 'grew', 'shifted'];
    const growth = Math.min(100, growthIndicators.filter(indicator => 
      words.includes(indicator)).length * 25);

    // Application: future application insights
    const applicationIndicators = ['will', 'plan', 'next', 'future', 'apply', 'use', 'try'];
    const application = Math.min(100, applicationIndicators.filter(indicator => 
      words.includes(indicator)).length * 20);

    const criteria = { specificity, metacognition, connection, growth, application };
    const averageScore = Object.values(criteria).reduce((sum, score) => sum + score, 0) / 5;

    let depth: ReflectionDepth;
    let aiAccessLevel: 'minimal' | 'guided' | 'full';
    
    if (averageScore >= 75) {
      depth = 'transformative';
      aiAccessLevel = 'full';
    } else if (averageScore >= 60) {
      depth = 'deep';
      aiAccessLevel = 'full';
    } else if (averageScore >= 40) {
      depth = 'developing';
      aiAccessLevel = 'guided';
    } else {
      depth = 'surface';
      aiAccessLevel = 'minimal';
    }

    const feedback: string[] = [];
    const recommendedActions: string[] = [];

    if (specificity < 50) {
      feedback.push("Try adding more specific examples or details to illustrate your points.");
      recommendedActions.push("Include a concrete example from your writing experience");
    }

    if (metacognition < 40) {
      feedback.push("Consider reflecting more deeply on your thinking process itself.");
      recommendedActions.push("Describe how your understanding has changed");
    }

    if (connection < 30) {
      feedback.push("Connect this experience to previous learning or writing you've done.");
      recommendedActions.push("Reference a similar situation from your past");
    }

    if (growth < 30) {
      feedback.push("Identify what you've learned or how you've grown from this experience.");
      recommendedActions.push("Describe one thing this process taught you");
    }

    if (application < 30) {
      feedback.push("Consider how you'll apply these insights to future writing.");
      recommendedActions.push("Plan how to use this learning going forward");
    }

    return {
      depth,
      score: Math.round(averageScore),
      criteria,
      feedback,
      aiAccessLevel,
      recommendedActions
    };
  };

  const handleSubmitReflection = () => {
    if (!meetsMinimum) return;
    
    setIsAssessing(true);
    
    // Simulate processing time for more realistic UX
    setTimeout(() => {
      const reflectionAssessment = assessReflection(reflection);
      setAssessment(reflectionAssessment);
      setIsAssessing(false);
      onReflectionComplete(reflectionAssessment);
    }, 1500);
  };

  const getDepthColor = (depth: ReflectionDepth) => {
    switch (depth) {
      case 'surface': return 'bg-red-100 text-red-800 border-red-200';
      case 'developing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'deep': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'transformative': return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getAccessLevelIcon = (level: 'minimal' | 'guided' | 'full') => {
    switch (level) {
      case 'minimal': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'guided': return <Brain className="w-4 h-4 text-yellow-500" />;
      case 'full': return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  if (assessment) {
    return (
      <Card className={`${className} border-l-4 ${assessment.depth === 'transformative' ? 'border-l-green-500' : 
        assessment.depth === 'deep' ? 'border-l-blue-500' : 
        assessment.depth === 'developing' ? 'border-l-yellow-500' : 'border-l-red-500'}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Reflection Assessment Complete</span>
            <div className="flex items-center gap-2">
              {getAccessLevelIcon(assessment.aiAccessLevel)}
              <Badge className={getDepthColor(assessment.depth)}>
                {assessment.depth} reflection
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Quality Score</p>
              <p className="text-2xl font-bold">{assessment.score}/100</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">AI Access Level</p>
              <p className="font-medium capitalize">{assessment.aiAccessLevel}</p>
            </div>
          </div>

          {showDetailedFeedback && (
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-2 text-xs">
                {Object.entries(assessment.criteria).map(([criterion, score]) => (
                  <div key={criterion} className="text-center">
                    <p className="font-medium capitalize">{criterion}</p>
                    <p className={`text-lg font-bold ${score >= 60 ? 'text-green-600' : score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {score}
                    </p>
                  </div>
                ))}
              </div>

              {assessment.feedback.length > 0 && (
                <div>
                  <p className="font-medium text-gray-700 mb-2">Feedback for Growth:</p>
                  <ul className="space-y-1">
                    {assessment.feedback.map((feedback, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        {feedback}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {assessment.recommendedActions.length > 0 && (
                <div>
                  <p className="font-medium text-gray-700 mb-2">Recommended Next Steps:</p>
                  <ul className="space-y-1">
                    {assessment.recommendedActions.map((action, index) => (
                      <li key={index} className="text-sm text-blue-600 flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowDetailedFeedback(!showDetailedFeedback)}
          >
            {showDetailedFeedback ? 'Hide' : 'Show'} Detailed Feedback
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} border-l-4 border-l-blue-500`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Required Reflection: {writingStage} Stage
        </CardTitle>
        <p className="text-sm text-gray-600">
          Thoughtful reflection is required before accessing AI assistance. This ensures you gain maximum educational value from the interaction.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="font-medium mb-2">{prompt.prompt}</p>
          <div className="space-y-2">
            {prompt.followUpQuestions.map((question, index) => (
              <p key={index} className="text-sm text-gray-600 pl-4 border-l-2 border-gray-200">
                {question}
              </p>
            ))}
          </div>
        </div>

        <div>
          <Textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Share your thoughts honestly and specifically. Quality reflection leads to better AI assistance..."
            className="min-h-32"
            disabled={isAssessing}
          />
          <div className="flex justify-between items-center mt-2">
            <p className={`text-sm ${meetsMinimum ? 'text-green-600' : 'text-gray-500'}`}>
              {wordCount} / {prompt.minimumWordCount} words minimum
            </p>
            {!meetsMinimum && (
              <p className="text-xs text-gray-500">
                Quality reflection takes time and thought
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button 
            variant="outline"
            onClick={onReflectionSkipped}
            disabled={isAssessing}
          >
            Skip (Limited AI Access)
          </Button>
          <Button 
            onClick={handleSubmitReflection}
            disabled={!meetsMinimum || isAssessing}
          >
            {isAssessing ? 'Assessing Reflection...' : 'Submit Reflection'}
          </Button>
        </div>

        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <p className="font-medium mb-1">Educational Transparency:</p>
          <p>This reflection assessment uses educational criteria to determine your readiness for AI assistance. Higher quality reflection unlocks more comprehensive AI support while building critical thinking skills.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReflectionQualityInterface;