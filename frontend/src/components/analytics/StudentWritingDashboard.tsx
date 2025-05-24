import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface WritingProgress {
  assignmentId: string;
  assignmentTitle: string;
  learningObjectives: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    progress: number;
    mastery: 'not_started' | 'developing' | 'proficient' | 'advanced';
  }>;
  writingPatterns: Array<{
    date: string;
    wordsWritten: number;
    revisionsCount: number;
    timeSpent: number;
    engagementScore: number;
  }>;
  breakthroughMoments: Array<{
    timestamp: string;
    type: 'clarity' | 'structure' | 'voice' | 'evidence';
    description: string;
    context: string;
  }>;
  reflectionPrompts: Array<{
    id: string;
    prompt: string;
    category: 'process' | 'learning' | 'growth';
    priority: 'high' | 'medium' | 'low';
  }>;
  developmentTimeline: Array<{
    date: string;
    milestone: string;
    description: string;
    evidence: string;
  }>;
}

interface StudentWritingDashboardProps {
  studentId: string;
  assignmentId?: string;
}

export const StudentWritingDashboard = ({ 
  studentId, 
  assignmentId 
}: StudentWritingDashboardProps) => {
  const [selectedAssignment, setSelectedAssignment] = useState<string>(assignmentId || '');
  const [activeTab, setActiveTab] = useState<'progress' | 'patterns' | 'reflection'>('progress');

  // Fetch writing progress data
  const { data: writingProgress, isLoading, error } = useQuery({
    queryKey: ['writingProgress', studentId, selectedAssignment],
    queryFn: async () => {
      if (!selectedAssignment) return null;
      const response = await api.get<WritingProgress>(
        `/analytics/writing-progress/${studentId}/${selectedAssignment}`
      );
      return response.data;
    },
    enabled: !!selectedAssignment,
  });

  // Fetch available assignments for the student
  const { data: assignments } = useQuery({
    queryKey: ['studentAssignments', studentId],
    queryFn: async () => {
      const response = await api.get(`/assignments/student/${studentId}`);
      return response.data;
    },
  });

  useEffect(() => {
    if (!selectedAssignment && assignments && assignments.length > 0) {
      setSelectedAssignment(assignments[0].id);
    }
  }, [assignments, selectedAssignment]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-ink-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-ink-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">⚠️</div>
        <p className="text-ink-600">Unable to load writing analytics.</p>
        <p className="text-sm text-ink-500">Please try refreshing the page.</p>
      </div>
    );
  }

  if (!writingProgress) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">📝</div>
        <p className="text-ink-600">Select an assignment to view your writing progress.</p>
      </div>
    );
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-branch-500';
    if (progress >= 60) return 'bg-highlight-500';
    if (progress >= 40) return 'bg-ember-500';
    return 'bg-ink-300';
  };

  const getMasteryBadgeColor = (mastery: string) => {
    switch (mastery) {
      case 'advanced': return 'bg-branch-100 text-branch-800';
      case 'proficient': return 'bg-scribe-100 text-scribe-800';
      case 'developing': return 'bg-highlight-100 text-highlight-800';
      default: return 'bg-ink-100 text-ink-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Assignment Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink-900">My Writing Journey</h2>
          <p className="text-ink-600">Track your growth and celebrate your progress</p>
        </div>
        
        {assignments && assignments.length > 1 && (
          <select
            value={selectedAssignment}
            onChange={(e) => setSelectedAssignment(e.target.value)}
            className="px-3 py-2 border border-ink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-scribe-500"
          >
            {assignments.map((assignment: { id: string; title: string }) => (
              <option key={assignment.id} value={assignment.id}>
                {assignment.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-ink-200">
        <nav className="flex space-x-8">
          {[
            { id: 'progress', label: 'Learning Progress', icon: '📈' },
            { id: 'patterns', label: 'Writing Patterns', icon: '🎯' },
            { id: 'reflection', label: 'Reflection Hub', icon: '💭' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'progress' | 'patterns' | 'reflection')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-scribe-500 text-scribe-600'
                  : 'border-transparent text-ink-500 hover:text-ink-700 hover:border-ink-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Learning Progress Tab */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          {/* Learning Objectives Progress */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-ink-900 mb-4">
              📚 Learning Objectives Progress
            </h3>
            <div className="space-y-4">
              {writingProgress.learningObjectives.map((objective) => (
                <div key={objective.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-ink-900">{objective.title}</h4>
                      <Badge className={getMasteryBadgeColor(objective.mastery)}>
                        {objective.mastery.replace('_', ' ')}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium text-ink-600">
                      {objective.progress}%
                    </span>
                  </div>
                  <p className="text-sm text-ink-600">{objective.description}</p>
                  <div className="w-full bg-ink-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(objective.progress)}`}
                      style={{ width: `${objective.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Development Timeline */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-ink-900 mb-4">
              🚀 Your Development Timeline
            </h3>
            <div className="space-y-4">
              {writingProgress.developmentTimeline.map((milestone, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-scribe-100 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-scribe-500 rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-ink-900">{milestone.milestone}</h4>
                      <span className="text-sm text-ink-500">
                        {new Date(milestone.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-ink-600 mt-1">{milestone.description}</p>
                    {milestone.evidence && (
                      <div className="mt-2 text-xs text-scribe-600 bg-scribe-50 px-2 py-1 rounded">
                        Evidence: {milestone.evidence}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Breakthrough Moments */}
          {writingProgress.breakthroughMoments.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-ink-900 mb-4">
                ✨ Breakthrough Moments
              </h3>
              <div className="space-y-3">
                {writingProgress.breakthroughMoments.map((moment, index) => (
                  <div key={index} className="border-l-4 border-branch-500 pl-4 py-2">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge className="bg-branch-100 text-branch-800">
                        {moment.type}
                      </Badge>
                      <span className="text-sm text-ink-500">
                        {new Date(moment.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-ink-900 font-medium">{moment.description}</p>
                    <p className="text-xs text-ink-600">{moment.context}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Writing Patterns Tab */}
      {activeTab === 'patterns' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-ink-900 mb-4">
              📊 Your Writing Patterns
            </h3>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {(() => {
                const totalWords = writingProgress.writingPatterns.reduce((sum, p) => sum + p.wordsWritten, 0);
                const totalTime = writingProgress.writingPatterns.reduce((sum, p) => sum + p.timeSpent, 0);
                const avgEngagement = writingProgress.writingPatterns.reduce((sum, p) => sum + p.engagementScore, 0) / writingProgress.writingPatterns.length;
                const totalRevisions = writingProgress.writingPatterns.reduce((sum, p) => sum + p.revisionsCount, 0);

                return [
                  { label: 'Total Words', value: totalWords, color: 'branch' },
                  { label: 'Time Spent', value: `${Math.round(totalTime / 60)}h`, color: 'scribe' },
                  { label: 'Avg Engagement', value: `${Math.round(avgEngagement)}%`, color: 'highlight' },
                  { label: 'Revisions', value: totalRevisions, color: 'ember' },
                ].map((stat) => (
                  <div key={stat.label} className={`bg-${stat.color}-50 rounded-lg p-4`}>
                    <div className={`text-sm font-medium text-${stat.color}-600`}>
                      {stat.label}
                    </div>
                    <div className={`text-2xl font-bold text-${stat.color}-900`}>
                      {stat.value}
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Daily Pattern Visualization */}
            <div className="space-y-3">
              <h4 className="font-medium text-ink-900">Daily Writing Activity</h4>
              {writingProgress.writingPatterns.map((pattern, index) => (
                <div key={index} className="flex items-center space-x-4 py-2">
                  <div className="w-20 text-sm text-ink-600">
                    {new Date(pattern.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-branch-600 w-16">
                        {pattern.wordsWritten}w
                      </span>
                      <div className="flex-1 bg-ink-100 rounded-full h-2">
                        <div
                          className="bg-branch-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, (pattern.wordsWritten / Math.max(...writingProgress.writingPatterns.map(p => p.wordsWritten))) * 100)}%`
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-highlight-600 w-16">
                        {Math.round(pattern.timeSpent)}m
                      </span>
                      <div className="flex-1 bg-ink-100 rounded-full h-1">
                        <div
                          className="bg-highlight-500 h-1 rounded-full"
                          style={{
                            width: `${pattern.engagementScore}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="w-12 text-xs text-ink-500 text-right">
                    {pattern.revisionsCount > 0 && `${pattern.revisionsCount}r`}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Reflection Tab */}
      {activeTab === 'reflection' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-ink-900 mb-4">
              💭 Reflection Prompts
            </h3>
            <div className="space-y-4">
              {writingProgress.reflectionPrompts.map((prompt) => (
                <div key={prompt.id} className="border border-ink-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge 
                      className={
                        prompt.category === 'process' ? 'bg-scribe-100 text-scribe-800' :
                        prompt.category === 'learning' ? 'bg-branch-100 text-branch-800' :
                        'bg-highlight-100 text-highlight-800'
                      }
                    >
                      {prompt.category}
                    </Badge>
                    <Badge variant={prompt.priority === 'high' ? 'default' : 'secondary'}>
                      {prompt.priority} priority
                    </Badge>
                  </div>
                  <p className="text-ink-900 mb-3">{prompt.prompt}</p>
                  <Button variant="outline" size="sm">
                    Start Reflection
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Self-Assessment Tools */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-ink-900 mb-4">
              🎯 Self-Assessment Tools
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <span className="text-2xl mb-1">📝</span>
                <span className="text-sm">Writing Process Check</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <span className="text-2xl mb-1">🎯</span>
                <span className="text-sm">Goal Setting Workshop</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <span className="text-2xl mb-1">🔍</span>
                <span className="text-sm">Revision Strategy</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <span className="text-2xl mb-1">🌟</span>
                <span className="text-sm">Strength Identifier</span>
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};