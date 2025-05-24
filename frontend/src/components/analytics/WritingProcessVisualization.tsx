import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface WritingEvent {
  timestamp: string;
  type: 'draft' | 'revision' | 'feedback' | 'reflection' | 'breakthrough';
  description: string;
  wordCount: number;
  changes: {
    added: number;
    deleted: number;
    modified: number;
  };
  metadata: {
    sessionDuration?: number;
    focusAreas?: string[];
    emotionalState?: 'confident' | 'uncertain' | 'frustrated' | 'breakthrough';
    cognitiveLoad?: 'low' | 'medium' | 'high';
  };
}

interface WritingJourney {
  assignmentId: string;
  studentId: string;
  startDate: string;
  currentDate: string;
  totalEvents: number;
  milestones: Array<{
    date: string;
    type: 'first_draft' | 'major_revision' | 'peer_feedback' | 'instructor_feedback' | 'final_draft';
    title: string;
    description: string;
    significance: 'minor' | 'moderate' | 'major';
  }>;
  events: WritingEvent[];
  patterns: {
    mostProductiveTime: string;
    averageSessionLength: number;
    revisionHabits: string;
    learningMoments: number;
  };
}

interface WritingProcessVisualizationProps {
  studentId: string;
  assignmentId: string;
  viewMode?: 'timeline' | 'patterns' | 'milestones';
}

export const WritingProcessVisualization = ({ 
  studentId, 
  assignmentId,
  viewMode = 'timeline'
}: WritingProcessVisualizationProps) => {
  const [activeView, setActiveView] = useState<'timeline' | 'patterns' | 'milestones'>(viewMode);
  const [selectedEvent, setSelectedEvent] = useState<WritingEvent | null>(null);

  // Fetch writing journey data
  const { data: writingJourney, isLoading, error } = useQuery({
    queryKey: ['writingJourney', studentId, assignmentId],
    queryFn: async () => {
      const response = await api.get<WritingJourney>(
        `/analytics/writing-journey/${studentId}/${assignmentId}`
      );
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-ink-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-ink-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !writingJourney) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">📝</div>
        <p className="text-ink-600">Unable to load writing journey visualization.</p>
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'draft': return '✏️';
      case 'revision': return '🔄';
      case 'feedback': return '💬';
      case 'reflection': return '💭';
      case 'breakthrough': return '✨';
      default: return '📝';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'draft': return 'border-branch-300 bg-branch-50';
      case 'revision': return 'border-scribe-300 bg-scribe-50';
      case 'feedback': return 'border-highlight-300 bg-highlight-50';
      case 'reflection': return 'border-ember-300 bg-ember-50';
      case 'breakthrough': return 'border-branch-400 bg-branch-100';
      default: return 'border-ink-300 bg-ink-50';
    }
  };

  const getMilestoneIcon = (type: string) => {
    switch (type) {
      case 'first_draft': return '🚀';
      case 'major_revision': return '🔧';
      case 'peer_feedback': return '👥';
      case 'instructor_feedback': return '👨‍🏫';
      case 'final_draft': return '🏆';
      default: return '📍';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-ink-900">Writing Process Journey</h3>
          <p className="text-sm text-ink-600">
            {writingJourney.totalEvents} events • Started {new Date(writingJourney.startDate).toLocaleDateString()}
          </p>
        </div>
        
        {/* View Mode Selector */}
        <div className="flex space-x-2">
          {[
            { id: 'timeline', label: 'Timeline', icon: '📅' },
            { id: 'patterns', label: 'Patterns', icon: '📊' },
            { id: 'milestones', label: 'Milestones', icon: '🎯' },
          ].map((view) => (
            <Button
              key={view.id}
              variant={activeView === view.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView(view.id as 'timeline' | 'patterns' | 'milestones')}
              className="text-xs"
            >
              <span className="mr-1">{view.icon}</span>
              {view.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Timeline View */}
      {activeView === 'timeline' && (
        <Card className="p-6">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-ink-200"></div>
            
            {/* Events */}
            <div className="space-y-6">
              {writingJourney.events.map((event, index) => (
                <div key={index} className="relative flex items-start space-x-4">
                  {/* Event Icon */}
                  <div className={`flex-shrink-0 w-16 h-16 rounded-full border-2 ${getEventColor(event.type)} flex items-center justify-center text-xl z-10`}>
                    {getEventIcon(event.type)}
                  </div>
                  
                  {/* Event Content */}
                  <div className="flex-1 min-w-0">
                    <div className="bg-white border border-ink-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                         onClick={() => setSelectedEvent(event)}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {event.type}
                          </Badge>
                          {event.metadata.emotionalState && (
                            <Badge className={
                              event.metadata.emotionalState === 'breakthrough' ? 'bg-branch-100 text-branch-800' :
                              event.metadata.emotionalState === 'confident' ? 'bg-scribe-100 text-scribe-800' :
                              event.metadata.emotionalState === 'uncertain' ? 'bg-highlight-100 text-highlight-800' :
                              'bg-ember-100 text-ember-800'
                            }>
                              {event.metadata.emotionalState}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-ink-500">
                          {new Date(event.timestamp).toLocaleDateString()} • {event.wordCount} words
                        </span>
                      </div>
                      
                      <p className="text-sm text-ink-900 mb-2">{event.description}</p>
                      
                      {/* Changes Summary */}
                      <div className="flex items-center space-x-4 text-xs text-ink-600">
                        {event.changes.added > 0 && (
                          <span className="text-branch-600">+{event.changes.added} words</span>
                        )}
                        {event.changes.deleted > 0 && (
                          <span className="text-ember-600">-{event.changes.deleted} words</span>
                        )}
                        {event.metadata.sessionDuration && (
                          <span>⏱️ {formatDuration(event.metadata.sessionDuration)}</span>
                        )}
                      </div>
                      
                      {/* Focus Areas */}
                      {event.metadata.focusAreas && event.metadata.focusAreas.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {event.metadata.focusAreas.map((area, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Patterns View */}
      {activeView === 'patterns' && (
        <div className="space-y-6">
          {/* Pattern Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl mb-2">⏰</div>
              <div className="text-lg font-bold text-ink-900">
                {writingJourney.patterns.mostProductiveTime}
              </div>
              <div className="text-sm text-ink-600">Most Productive Time</div>
            </Card>
            
            <Card className="p-4 text-center">
              <div className="text-2xl mb-2">📏</div>
              <div className="text-lg font-bold text-ink-900">
                {formatDuration(writingJourney.patterns.averageSessionLength)}
              </div>
              <div className="text-sm text-ink-600">Avg Session Length</div>
            </Card>
            
            <Card className="p-4 text-center">
              <div className="text-2xl mb-2">🔄</div>
              <div className="text-lg font-bold text-ink-900">
                {writingJourney.patterns.revisionHabits}
              </div>
              <div className="text-sm text-ink-600">Revision Style</div>
            </Card>
            
            <Card className="p-4 text-center">
              <div className="text-2xl mb-2">💡</div>
              <div className="text-lg font-bold text-ink-900">
                {writingJourney.patterns.learningMoments}
              </div>
              <div className="text-sm text-ink-600">Learning Moments</div>
            </Card>
          </div>

          {/* Writing Activity Heatmap */}
          <Card className="p-6">
            <h4 className="text-md font-semibold text-ink-900 mb-4">Writing Activity Patterns</h4>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-xs text-ink-600 font-medium p-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Simulated activity data - in real implementation, this would come from the API */}
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 28 }, (_, i) => {
                const intensity = Math.random();
                const intensityColor = 
                  intensity > 0.8 ? 'bg-branch-500' :
                  intensity > 0.6 ? 'bg-branch-400' :
                  intensity > 0.4 ? 'bg-branch-300' :
                  intensity > 0.2 ? 'bg-branch-200' :
                  'bg-ink-100';
                
                return (
                  <div
                    key={i}
                    className={`h-8 rounded ${intensityColor} cursor-pointer hover:opacity-80`}
                    title={`Day ${i + 1}: ${intensity > 0.2 ? Math.round(intensity * 120) + ' minutes' : 'No activity'}`}
                  />
                );
              })}
            </div>
            
            <div className="flex items-center justify-between mt-4 text-xs text-ink-600">
              <span>Less active</span>
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-ink-100 rounded"></div>
                <div className="w-3 h-3 bg-branch-200 rounded"></div>
                <div className="w-3 h-3 bg-branch-300 rounded"></div>
                <div className="w-3 h-3 bg-branch-400 rounded"></div>
                <div className="w-3 h-3 bg-branch-500 rounded"></div>
              </div>
              <span>More active</span>
            </div>
          </Card>

          {/* Emotional Journey */}
          <Card className="p-6">
            <h4 className="text-md font-semibold text-ink-900 mb-4">Emotional Writing Journey</h4>
            <div className="space-y-3">
              {writingJourney.events.filter(e => e.metadata.emotionalState).map((event, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-20 text-xs text-ink-600">
                    {new Date(event.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded-full ${
                        event.metadata.emotionalState === 'breakthrough' ? 'bg-branch-500' :
                        event.metadata.emotionalState === 'confident' ? 'bg-scribe-500' :
                        event.metadata.emotionalState === 'uncertain' ? 'bg-highlight-500' :
                        'bg-ember-500'
                      }`}></div>
                      <span className="text-sm capitalize">{event.metadata.emotionalState}</span>
                    </div>
                  </div>
                  <div className="text-xs text-ink-500">
                    {event.type}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Milestones View */}
      {activeView === 'milestones' && (
        <Card className="p-6">
          <h4 className="text-md font-semibold text-ink-900 mb-6">Writing Milestones</h4>
          <div className="space-y-6">
            {writingJourney.milestones.map((milestone, index) => (
              <div key={index} className="relative flex items-start space-x-4">
                {/* Milestone Icon */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg ${
                  milestone.significance === 'major' ? 'bg-branch-100 border-2 border-branch-400' :
                  milestone.significance === 'moderate' ? 'bg-scribe-100 border-2 border-scribe-400' :
                  'bg-highlight-100 border-2 border-highlight-400'
                }`}>
                  {getMilestoneIcon(milestone.type)}
                </div>
                
                {/* Milestone Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-ink-900">{milestone.title}</h5>
                    <div className="flex items-center space-x-2">
                      <Badge className={
                        milestone.significance === 'major' ? 'bg-branch-100 text-branch-800' :
                        milestone.significance === 'moderate' ? 'bg-scribe-100 text-scribe-800' :
                        'bg-highlight-100 text-highlight-800'
                      }>
                        {milestone.significance}
                      </Badge>
                      <span className="text-sm text-ink-500">
                        {new Date(milestone.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-ink-600">{milestone.description}</p>
                </div>
                
                {/* Connection Line */}
                {index < writingJourney.milestones.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-6 bg-ink-200"></div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-ink-900">Event Details</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedEvent(null)}
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{getEventIcon(selectedEvent.type)}</span>
                <div>
                  <div className="font-medium text-ink-900 capitalize">{selectedEvent.type}</div>
                  <div className="text-sm text-ink-600">
                    {new Date(selectedEvent.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-ink-900 mb-2">Description</h5>
                <p className="text-sm text-ink-600">{selectedEvent.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-ink-900 mb-1">Word Count</h5>
                  <p className="text-sm text-ink-600">{selectedEvent.wordCount}</p>
                </div>
                {selectedEvent.metadata.sessionDuration && (
                  <div>
                    <h5 className="font-medium text-ink-900 mb-1">Session Duration</h5>
                    <p className="text-sm text-ink-600">{formatDuration(selectedEvent.metadata.sessionDuration)}</p>
                  </div>
                )}
              </div>
              
              <div>
                <h5 className="font-medium text-ink-900 mb-2">Changes Made</h5>
                <div className="text-sm space-y-1">
                  {selectedEvent.changes.added > 0 && (
                    <div className="text-branch-600">+ {selectedEvent.changes.added} words added</div>
                  )}
                  {selectedEvent.changes.deleted > 0 && (
                    <div className="text-ember-600">- {selectedEvent.changes.deleted} words deleted</div>
                  )}
                  {selectedEvent.changes.modified > 0 && (
                    <div className="text-scribe-600">~ {selectedEvent.changes.modified} words modified</div>
                  )}
                </div>
              </div>
              
              {selectedEvent.metadata.focusAreas && selectedEvent.metadata.focusAreas.length > 0 && (
                <div>
                  <h5 className="font-medium text-ink-900 mb-2">Focus Areas</h5>
                  <div className="flex flex-wrap gap-1">
                    {selectedEvent.metadata.focusAreas.map((area, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};